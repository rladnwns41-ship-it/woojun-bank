// 우준은행 서버 — Render Web Service (Go)
// 정적 파일을 서빙하고, 돈이 걸린 민감한 작업(우준 화폐 발급·입금, 대출 자동 회수)을
// Firebase Admin 권한으로 서버에서만 처리한다.
package main

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"log"
	"math"
	"math/big"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"

	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/auth"
	"firebase.google.com/go/v4/db"
	"google.golang.org/api/option"
)

const (
	codeAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	day          = int64(24 * time.Hour / time.Millisecond)
	loanPenalty  = 0.05
	maxIssue     = 50
	maxAmount    = 100_000_000
	exchangeBonus = 0.05 // 화폐 교환 시 액면가에 더 얹어 주는 비율
)

var (
	authC  *auth.Client
	dbC    *db.Client
	pepper string

	errNotFound = errors.New("없는 코드예요")
	errUsed     = errors.New("이미 사용한 코드예요")
	errVoid     = errors.New("폐기된 코드예요")
)

func main() {
	ctx := context.Background()
	pepper = os.Getenv("CODE_PEPPER")
	if len(pepper) < 16 {
		log.Fatal("CODE_PEPPER 환경변수(16자 이상)가 필요합니다")
	}
	sa := os.Getenv("FIREBASE_SERVICE_ACCOUNT")
	if sa == "" {
		log.Fatal("FIREBASE_SERVICE_ACCOUNT 환경변수(서비스 계정 JSON)가 필요합니다")
	}
	dbURL := os.Getenv("FIREBASE_DATABASE_URL")
	if dbURL == "" {
		dbURL = "https://game---6-cde77-default-rtdb.firebaseio.com"
	}
	app, err := firebase.NewApp(ctx, &firebase.Config{DatabaseURL: dbURL}, option.WithCredentialsJSON([]byte(sa)))
	if err != nil {
		log.Fatal(err)
	}
	if authC, err = app.Auth(ctx); err != nil {
		log.Fatal(err)
	}
	if dbC, err = app.Database(ctx); err != nil {
		log.Fatal(err)
	}

	root = findRoot()
	for _, f := range []string{"index.html", "support.js", "game-core.js", "wj-ui.js", "trade.dc.html"} {
		if _, err := os.Stat(filepath.Join(root, f)); err != nil {
			log.Printf("경고: %s 파일이 없어요 (%s)", f, root)
		}
	}
	log.Println("static root:", root)
	go loanSweeper()

	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) { w.Write([]byte("ok")) })
	// 배포 확인용: 주요 파일의 내용 해시(앞 10자)와 크기. 브라우저에서 /version 을 열어 보면 서버에 올라간 버전을 알 수 있다
	mux.HandleFunc("/version", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/plain; charset=utf-8")
		w.Header().Set("Cache-Control", "no-store")
		for _, f := range []string{"tourney.js", "tournament.dc.html", "game-core.js", "wj-ui.js", "company.dc.html", "company-core.js", "coin.dc.html", "estate.html", "trade.dc.html", "bank.dc.html"} {
			b, err := os.ReadFile(filepath.Join(root, f))
			if err != nil {
				w.Write([]byte(f + "  없음\n"))
				continue
			}
			s := sha256.Sum256(b)
			w.Write([]byte(f + "  " + hex.EncodeToString(s[:])[:10] + "  " + strconv.Itoa(len(b)) + "B\n"))
		}
	})
	mux.HandleFunc("/api/redeem", post(handleRedeem))
	mux.HandleFunc("/api/admin/currency/issue", post(adminOnly(handleIssue)))
	mux.HandleFunc("/api/admin/currency/void", post(adminOnly(handleVoid)))
	mux.HandleFunc("/", static)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Println("listening on :" + port)
	log.Fatal(http.ListenAndServe(":"+port, secure(mux)))
}

// ---------- 정적 파일 ----------

var root = "."

// 실행 파일이 있는 폴더(=저장소 루트)를 정적 파일 위치로 쓴다. 작업 폴더가 달라도 동작하게.
func findRoot() string {
	cands := []string{}
	if wd, err := os.Getwd(); err == nil {
		cands = append(cands, wd)
	}
	if exe, err := os.Executable(); err == nil {
		cands = append(cands, filepath.Dir(exe))
	}
	cands = append(cands, "/opt/render/project/src")
	for _, d := range cands {
		if _, err := os.Stat(filepath.Join(d, "index.html")); err == nil {
			return d
		}
	}
	return "."
}

var mimeOf = map[string]string{".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".ico": "image/x-icon", ".woff2": "font/woff2", ".gif": "image/gif"}

var allowExt = map[string]bool{".html": true, ".js": true, ".css": true, ".png": true, ".jpg": true, ".jpeg": true, ".webp": true, ".svg": true, ".ico": true, ".woff2": true, ".gif": true}

func static(w http.ResponseWriter, r *http.Request) {
	p := path.Clean("/" + r.URL.Path)
	if p == "/" {
		p = "/index.html"
	}
	name := strings.TrimPrefix(p, "/")
	base := filepath.Base(name)
	if strings.HasPrefix(base, ".") || strings.HasPrefix(name, "uploads/") || strings.HasPrefix(name, "shots/") || !allowExt[strings.ToLower(filepath.Ext(name))] {
		http.NotFound(w, r)
		return
	}
	full := filepath.Join(root, filepath.FromSlash(name))
	if fi, err := os.Stat(full); err != nil || fi.IsDir() {
		log.Printf("404 %s (찾은 위치: %s)", p, full)
		http.NotFound(w, r)
		return
	}
	w.Header().Set("Content-Type", mimeOf[strings.ToLower(filepath.Ext(name))])
	switch strings.ToLower(filepath.Ext(name)) {
	case ".html", ".js", ".css":
		// 코드 파일은 매번 서버에 새 버전이 있는지 확인한다 (배포하면 바로 적용)
		w.Header().Set("Cache-Control", "no-cache, must-revalidate")
	default:
		w.Header().Set("Cache-Control", "public, max-age=3600")
	}
	http.ServeFile(w, r, full)
}

func secure(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		hd := w.Header()
		hd.Set("X-Content-Type-Options", "nosniff")
		hd.Set("X-Frame-Options", "SAMEORIGIN")
		hd.Set("Referrer-Policy", "strict-origin-when-cross-origin")
		hd.Set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
		if r.TLS != nil || r.Header.Get("X-Forwarded-Proto") == "https" {
			hd.Set("Strict-Transport-Security", "max-age=31536000")
		}
		h.ServeHTTP(w, r)
	})
}

// ---------- API 공통 ----------

type caller struct {
	UID    string
	Key    string // users/{Key}
	Device string
}

type apiFn func(ctx context.Context, c caller, body map[string]any) (any, error)

func post(fn apiFn) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.Header().Set("Cache-Control", "no-store")
		if r.Method != http.MethodPost {
			writeErr(w, 405, "POST만 허용돼요")
			return
		}
		ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
		defer cancel()
		tok := strings.TrimPrefix(r.Header.Get("Authorization"), "Bearer ")
		t, err := authC.VerifyIDToken(ctx, tok)
		if err != nil {
			writeErr(w, 401, "로그인이 만료됐어요. 다시 로그인해 주세요")
			return
		}
		c := caller{UID: t.UID, Key: t.UID, Device: sanitize(r.Header.Get("X-WJ-Device"))}
		var link string
		if err := dbC.NewRef("authLinks/"+t.UID).Get(ctx, &link); err == nil && link != "" {
			c.Key = link
		}
		if banned(ctx, c) {
			writeErr(w, 403, "정지된 계정이에요")
			return
		}
		body := map[string]any{}
		r.Body = http.MaxBytesReader(w, r.Body, 4096)
		_ = json.NewDecoder(r.Body).Decode(&body)
		out, err := fn(ctx, c, body)
		if err != nil {
			code := 400
			var he httpErr
			if errors.As(err, &he) {
				code = he.code
			}
			writeErr(w, code, err.Error())
			return
		}
		json.NewEncoder(w).Encode(out)
	}
}

type httpErr struct {
	code int
	msg  string
}

func (e httpErr) Error() string { return e.msg }

func writeErr(w http.ResponseWriter, code int, msg string) {
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(map[string]string{"error": msg})
}

func sanitize(s string) string {
	if len(s) > 40 {
		return ""
	}
	for _, ch := range s {
		if !(ch >= 'a' && ch <= 'z' || ch >= 'A' && ch <= 'Z' || ch >= '0' && ch <= '9' || ch == '_' || ch == '-') {
			return ""
		}
	}
	return s
}

func banned(ctx context.Context, c caller) bool {
	var v any
	if dbC.NewRef("bans/uids/"+c.UID).Get(ctx, &v) == nil && v != nil {
		return true
	}
	if c.Device != "" {
		v = nil
		if dbC.NewRef("bans/devices/"+c.Device).Get(ctx, &v) == nil && v != nil {
			return true
		}
	}
	var b bool
	_ = dbC.NewRef("users/"+c.Key+"/banned").Get(ctx, &b)
	return b
}

func adminOnly(fn apiFn) apiFn {
	return func(ctx context.Context, c caller, body map[string]any) (any, error) {
		var ok bool
		if err := dbC.NewRef("admin/authorizedUids/"+c.UID).Get(ctx, &ok); err != nil || !ok {
			return nil, httpErr{403, "관리자 권한이 없어요"}
		}
		return fn(ctx, c, body)
	}
}

// ---------- 시도 횟수 제한 (코드 무차별 대입 방지) ----------

var (
	failMu sync.Mutex
	fails  = map[string][]time.Time{}
)

func tooMany(id string) bool {
	failMu.Lock()
	defer failMu.Unlock()
	cut := time.Now().Add(-10 * time.Minute)
	kept := fails[id][:0]
	for _, t := range fails[id] {
		if t.After(cut) {
			kept = append(kept, t)
		}
	}
	fails[id] = kept
	return len(kept) >= 8
}

func addFail(id string) {
	failMu.Lock()
	fails[id] = append(fails[id], time.Now())
	failMu.Unlock()
}

// ---------- 우준 화폐 ----------

func normCode(s string) (string, bool) {
	var b strings.Builder
	for _, ch := range strings.ToUpper(s) {
		if ch >= 'A' && ch <= 'Z' || ch >= '0' && ch <= '9' {
			b.WriteRune(ch)
		}
	}
	out := strings.TrimPrefix(b.String(), "WJ")
	return out, len(out) == 12
}

func codeKey(code12 string) string {
	h := sha256.Sum256([]byte(pepper + ":" + code12))
	return hex.EncodeToString(h[:20])
}

func newCode() (string, error) {
	var b strings.Builder
	for i := 0; i < 12; i++ {
		n, err := rand.Int(rand.Reader, big.NewInt(int64(len(codeAlphabet))))
		if err != nil {
			return "", err
		}
		b.WriteByte(codeAlphabet[n.Int64()])
	}
	return b.String(), nil
}

func pretty(c string) string { return "WJ-" + c[0:4] + "-" + c[4:8] + "-" + c[8:12] }

func num(v any) float64 {
	switch x := v.(type) {
	case float64:
		return x
	case int64:
		return float64(x)
	case int:
		return float64(x)
	case json.Number:
		f, _ := x.Float64()
		return f
	}
	return 0
}

func handleIssue(ctx context.Context, c caller, body map[string]any) (any, error) {
	amount := int64(num(body["amount"]))
	count := int(num(body["count"]))
	if amount < 1000 || amount > maxAmount {
		return nil, errors.New("금액은 1,000준 ~ 1억 준이에요")
	}
	if count < 1 || count > maxIssue {
		return nil, errors.New("한 번에 1~50장까지 발급할 수 있어요")
	}
	codes := make([]string, 0, count)
	for len(codes) < count {
		code, err := newCode()
		if err != nil {
			return nil, err
		}
		ref := dbC.NewRef("currency/" + codeKey(code))
		created := false
		err = ref.Transaction(ctx, func(tn db.TransactionNode) (interface{}, error) {
			var cur map[string]any
			if err := tn.Unmarshal(&cur); err != nil {
				return nil, err
			}
			if cur != nil {
				created = false
				return cur, nil
			}
			created = true
			return map[string]any{"amount": amount, "createdAt": time.Now().UnixMilli(), "by": c.UID, "hint": code[8:]}, nil
		})
		if err != nil {
			return nil, err
		}
		if created {
			codes = append(codes, pretty(code))
		}
	}
	log.Printf("issue %d x %d by %s", count, amount, c.UID)
	return map[string]any{"codes": codes}, nil
}

func handleVoid(ctx context.Context, c caller, body map[string]any) (any, error) {
	id, _ := body["id"].(string)
	if len(id) != 40 || sanitize(id) == "" {
		return nil, errors.New("잘못된 코드 ID예요")
	}
	err := dbC.NewRef("currency/"+id).Transaction(ctx, func(tn db.TransactionNode) (interface{}, error) {
		var cur map[string]any
		if err := tn.Unmarshal(&cur); err != nil {
			return nil, err
		}
		if cur == nil {
			return nil, errNotFound
		}
		if cur["usedBy"] != nil {
			return nil, errUsed
		}
		cur["void"] = true
		return cur, nil
	})
	if err != nil {
		return nil, err
	}
	return map[string]any{"ok": true}, nil
}

func handleRedeem(ctx context.Context, c caller, body map[string]any) (any, error) {
	limitID := c.UID + "|" + c.Device
	if tooMany(limitID) {
		return nil, httpErr{429, "틀린 시도가 많아요. 10분 뒤에 다시 해 주세요"}
	}
	raw, _ := body["code"].(string)
	code, ok := normCode(raw)
	if !ok {
		addFail(limitID)
		return nil, errors.New("코드 12자리를 확인해 주세요")
	}
	var name string
	_ = dbC.NewRef("users/"+c.Key+"/name").Get(ctx, &name)
	var exists any
	if err := dbC.NewRef("users/"+c.Key+"/cash").Get(ctx, &exists); err != nil || exists == nil {
		return nil, errors.New("계좌를 찾을 수 없어요")
	}
	ref := dbC.NewRef("currency/" + codeKey(code))
	var amount float64
	err := ref.Transaction(ctx, func(tn db.TransactionNode) (interface{}, error) {
		var cur map[string]any
		if err := tn.Unmarshal(&cur); err != nil {
			return nil, err
		}
		if cur == nil {
			return nil, errNotFound
		}
		if v, _ := cur["void"].(bool); v {
			return nil, errVoid
		}
		if cur["usedBy"] != nil {
			return nil, errUsed
		}
		amount = num(cur["amount"])
		cur["usedBy"] = c.Key
		cur["usedName"] = name
		cur["usedAt"] = time.Now().UnixMilli()
		return cur, nil
	})
	if err != nil {
		if errors.Is(err, errNotFound) || errors.Is(err, errUsed) || errors.Is(err, errVoid) {
			addFail(limitID)
			return nil, err
		}
		return nil, errors.New("잠시 후 다시 시도해 주세요")
	}
	face := amount
	bonus := math.Floor(face * exchangeBonus)
	amount = face + bonus
	err = dbC.NewRef("users/"+c.Key+"/cash").Transaction(ctx, func(tn db.TransactionNode) (interface{}, error) {
		var cash float64
		if err := tn.Unmarshal(&cash); err != nil {
			return nil, err
		}
		return cash + amount, nil
	})
	if err != nil {
		// 입금 실패 시 코드를 되살린다
		_ = ref.Child("usedBy").Delete(ctx)
		return nil, errors.New("교환하지 못했어요. 코드는 그대로 쓸 수 있어요")
	}
	_, _ = dbC.NewRef("history/"+c.Key).Push(ctx, map[string]any{"type": "atm", "amount": amount, "text": "우준 화폐 교환 · 액면 " + itoa(face) + "준 + 보너스 " + itoa(bonus) + "준", "ts": time.Now().UnixMilli()})
	log.Printf("redeem %v by %s", amount, c.Key)
	return map[string]any{"amount": amount, "face": face, "bonus": bonus}, nil
}

// ---------- 대출: 기한 지나면 연체 이자 + 자동 회수 ----------

func loanSweeper() {
	for {
		sweepLoans()
		time.Sleep(10 * time.Minute)
	}
}

func sweepLoans() {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()
	var users map[string]struct {
		Loan    float64 `json:"loan"`
		LoanDue float64 `json:"loanDue"`
	}
	if err := dbC.NewRef("users").OrderByChild("loanDue").StartAt(1).EndAt(float64(time.Now().UnixMilli())).Get(ctx, &users); err != nil {
		// 인덱스가 없으면 전체를 읽는다
		if err := dbC.NewRef("users").Get(ctx, &users); err != nil {
			log.Println("loan sweep:", err)
			return
		}
	}
	now := time.Now().UnixMilli()
	for key, u := range users {
		if u.Loan <= 0 || u.LoanDue == 0 || int64(u.LoanDue) > now {
			continue
		}
		var paid, added float64
		err := dbC.NewRef("users/"+key).Transaction(ctx, func(tn db.TransactionNode) (interface{}, error) {
			var x map[string]any
			if err := tn.Unmarshal(&x); err != nil {
				return nil, err
			}
			paid, added = 0, 0
			if x == nil {
				return x, nil
			}
			loan, due, charged, cash := num(x["loan"]), int64(num(x["loanDue"])), int64(num(x["loanCharged"])), num(x["cash"])
			if loan <= 0 || due == 0 || now < due {
				return x, nil
			}
			from, extra := due, int64(1)
			if charged > 0 {
				from, extra = charged, 0
			}
			days := (now-from)/day + extra
			if days > 0 {
				nl := math.Round(loan * math.Pow(1+loanPenalty, float64(days)))
				added = nl - loan
				loan = nl
				if charged == 0 {
					charged = due
				}
				x["loanCharged"] = charged + days*day
			}
			pay := math.Min(math.Max(0, cash), loan)
			x["cash"] = cash - pay
			loan -= pay
			paid = pay
			if loan <= 0 {
				x["loan"] = 0
				delete(x, "loanDue")
				delete(x, "loanCharged")
			} else {
				x["loan"] = loan
			}
			return x, nil
		})
		if err == nil && (paid > 0 || added > 0) {
			_, _ = dbC.NewRef("history/"+key).Push(ctx, map[string]any{"type": "autorepay", "amount": -paid, "text": "대출 기한 초과 · 연체 이자 " + itoa(added) + "준 · 자동 상환 " + itoa(paid) + "준", "ts": now})
		}
	}
}

func itoa(f float64) string {
	s := big.NewInt(int64(math.Round(f))).String()
	neg := strings.HasPrefix(s, "-")
	s = strings.TrimPrefix(s, "-")
	var b strings.Builder
	for i, ch := range s {
		if i > 0 && (len(s)-i)%3 == 0 {
			b.WriteByte(',')
		}
		b.WriteRune(ch)
	}
	if neg {
		return "-" + b.String()
	}
	return b.String()
}
