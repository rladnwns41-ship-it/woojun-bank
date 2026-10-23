package main

import (
	"context"
	_ "embed"
	"encoding/json"
	"fmt"
	"math"
	"regexp"
	"sort"
	"strings"
	"time"

	"firebase.google.com/go/v4/db"
)

// The catalogue is generated from the existing estate.html land grid. Clients
// may quote prices, but only this server catalogue determines the actual price.
//
//go:embed land-catalog.json
var landCatalogueJSON []byte

type landCell struct {
	Base int64  `json:"base"`
	Near string `json:"near"`
}

var landCatalogue = func() map[string]landCell {
	v := map[string]landCell{}
	if err := json.Unmarshal(landCatalogueJSON, &v); err != nil {
		panic(err)
	}
	return v
}()

const landShield = int64(5 * time.Minute / time.Millisecond)

var landNonce = regexp.MustCompile(`^[A-Za-z0-9_-]{20,64}$`)

type landRequest struct {
	Action   string   `json:"action"`
	IDs      []string `json:"ids"`
	Nonce    string   `json:"nonce"`
	MaxTotal int64    `json:"maxTotal"`
}
type landReply struct {
	Action   string `json:"action"`
	Count    int    `json:"count"`
	Debit    int64  `json:"debit"`
	Credit   int64  `json:"credit"`
	Replayed bool   `json:"replayed,omitempty"`
}

func landMap(x any) map[string]any {
	v, _ := x.(map[string]any)
	if v == nil {
		return map[string]any{}
	}
	return v
}
func landInt(x any) int64 {
	switch n := x.(type) {
	case float64:
		return int64(n)
	case int64:
		return n
	case int:
		return int64(n)
	}
	return 0
}
func landOwner(x any) string    { s, _ := landMap(x)["o"].(string); return s }
func landRound(n float64) int64 { return int64(math.Floor(n/10000+.5)) * 10000 }
func landBuyPrice(base int64, count int) int64 {
	return landRound(float64(base) * (1 + .04*float64(count)))
}
func landSellPrice(cell map[string]any, base int64) int64 {
	p := landInt(cell["p"])
	if p <= 0 {
		p = base
	}
	return int64(math.Floor(float64(p)*.8/10000)) * 10000
}
func landTakePrice(cell map[string]any, base int64, count int) int64 {
	return landRound(float64(max(landBuyPrice(base, count), landInt(cell["p"]))) * 1.5)
}

// Validate the complete batch before changing any balance or ownership. The
// caller commits this value in one RTDB transaction, including the receipt.
func landTrade(root map[string]any, uid string, req landRequest, now int64) (landReply, error) {
	var out landReply
	bad := func(message string) (landReply, error) { return out, httpErr{400, message} }
	if req.Action != "buy" && req.Action != "sell" && req.Action != "take" {
		return bad("거래 종류를 확인해 주세요")
	}
	if !landNonce.MatchString(req.Nonce) || len(req.IDs) < 1 || len(req.IDs) > 100 {
		return bad("한 번에 1~100칸을 선택해 주세요")
	}
	ids := append([]string(nil), req.IDs...)
	sort.Strings(ids)
	for i, id := range ids {
		if _, ok := landCatalogue[id]; !ok || i > 0 && ids[i-1] == id {
			return bad("선택한 땅을 다시 확인해 주세요")
		}
	}
	fingerprint := fmt.Sprintf("%s|%s|%d", req.Action, strings.Join(ids, ","), req.MaxTotal)
	admin := landMap(root["admin"])
	receipts := landMap(admin["landReceipts"])
	ownReceipts := landMap(receipts[uid])
	if old, ok := ownReceipts[req.Nonce]; ok {
		r := landMap(old)
		if r["request"] != fingerprint {
			return bad("중복 거래 번호예요. 새로 선택해 주세요")
		}
		b, _ := json.Marshal(r["reply"])
		_ = json.Unmarshal(b, &out)
		out.Replayed = true
		return out, nil
	}
	users := landMap(root["users"])
	user := landMap(users[uid])
	name, _ := user["name"].(string)
	if name == "" || user["banned"] == true {
		return bad("거래할 수 없는 계정이에요")
	}
	estate := landMap(root["estate"])
	lands := landMap(estate["land"])
	n := 0
	for id, x := range lands {
		if _, ok := landCatalogue[id]; ok && landOwner(x) == uid {
			n++
		}
	}
	type change struct {
		id, previous        string
		price, compensation int64
	}
	changes := make([]change, 0, len(ids))
	out.Action = req.Action
	out.Count = len(ids)
	for _, id := range ids {
		cell := landMap(lands[id])
		owner := landOwner(cell)
		base := landCatalogue[id].Base
		ch := change{id: id, previous: owner}
		switch req.Action {
		case "buy":
			if owner != "" {
				return bad("방금 주인이 생긴 땅이 있어요. 선택을 다시 확인해 주세요")
			}
			ch.price = landBuyPrice(base, n)
			out.Debit += ch.price
			n++
		case "sell":
			if owner != uid {
				return bad("내 땅만 팔 수 있어요. 선택을 다시 확인해 주세요")
			}
			ch.price = landSellPrice(cell, base)
			out.Credit += ch.price
		case "take":
			if owner == "" || owner == uid || len(landMap(users[owner])) == 0 {
				return bad("다른 사람의 땅만 빼앗을 수 있어요")
			}
			if now-landInt(cell["ts"]) < landShield {
				return bad("매입 후 5분 동안은 보호되는 땅이에요")
			}
			ch.price = landTakePrice(cell, base, n)
			ch.compensation = landRound(float64(ch.price) * .8)
			out.Debit += ch.price
			n++
		}
		changes = append(changes, ch)
	}
	if out.Debit > req.MaxTotal {
		return bad("가격이 바뀌었어요. 새 금액을 확인한 뒤 다시 눌러 주세요")
	}
	if landInt(user["cash"]) < out.Debit {
		return bad("현금이 모자라요")
	}
	user["cash"] = landInt(user["cash"]) - out.Debit + out.Credit
	compensations := map[string]int64{}
	compensationCounts := map[string]int{}
	for _, ch := range changes {
		if req.Action == "sell" {
			delete(lands, ch.id)
			continue
		}
		if ch.previous != "" {
			previous := landMap(users[ch.previous])
			previous["cash"] = landInt(previous["cash"]) + ch.compensation
			users[ch.previous] = previous
			compensations[ch.previous] += ch.compensation
			compensationCounts[ch.previous]++
		}
		lands[ch.id] = map[string]any{"o": uid, "on": name, "p": ch.price, "ts": now}
	}
	users[uid] = user
	root["users"] = users
	estate["land"] = lands
	root["estate"] = estate
	history := landMap(root["history"])
	record := func(who, kind, label string, amount int64, count int) {
		entries := landMap(history[who])
		entries["land_"+req.Nonce] = map[string]any{"type": kind, "stock": label, "amount": amount, "qty": count, "price": float64(absLand(amount)) / float64(count), "ts": now}
		history[who] = entries
	}
	if req.Action == "sell" {
		record(uid, "sell", "땅따먹기 판매", out.Credit, out.Count)
	} else {
		label := "땅따먹기 구매"
		if req.Action == "take" {
			label = "땅따먹기 강제 매입"
		}
		record(uid, "buy", label, -out.Debit, out.Count)
	}
	for previous, amount := range compensations {
		record(previous, "sell", "땅따먹기 강제 매입 보상", amount, compensationCounts[previous])
	}
	root["history"] = history
	// Keep recent retries idempotent without unbounded receipt growth.
	if len(ownReceipts) >= 64 {
		oldest := ""
		var at int64 = math.MaxInt64
		for k, v := range ownReceipts {
			if t := landInt(landMap(v)["ts"]); t < at {
				at = t
				oldest = k
			}
		}
		delete(ownReceipts, oldest)
	}
	ownReceipts[req.Nonce] = map[string]any{"request": fingerprint, "reply": out, "ts": now}
	receipts[uid] = ownReceipts
	admin["landReceipts"] = receipts
	root["admin"] = admin
	return out, nil
}
func absLand(n int64) int64 {
	if n < 0 {
		return -n
	}
	return n
}
func handleLandTrade(ctx context.Context, c caller, body map[string]any) (any, error) {
	b, err := json.Marshal(body)
	if err != nil {
		return nil, err
	}
	var req landRequest
	if err = json.Unmarshal(b, &req); err != nil {
		return nil, httpErr{400, "선택한 땅을 확인해 주세요"}
	}
	var reply landReply
	now := time.Now().UnixMilli()
	err = dbC.NewRef("/").Transaction(ctx, func(tn db.TransactionNode) (interface{}, error) {
		var root map[string]any
		if e := tn.Unmarshal(&root); e != nil {
			return nil, e
		}
		if root == nil {
			return nil, httpErr{400, "계정을 찾을 수 없어요"}
		}
		var e error
		reply, e = landTrade(root, c.Key, req, now)
		if e != nil {
			return nil, e
		}
		return root, nil
	})
	return reply, err
}
