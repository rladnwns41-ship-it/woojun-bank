package main

// 이벤트는 기존 config 읽기 권한을 재사용한다. 참가자 쓰기는 Go API만
// 허용하므로 Firebase 규칙을 따로 배포하지 않아도 된다.
import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"math/big"
	"sort"
	"strings"
	"time"
	"unicode/utf8"

	"firebase.google.com/go/v4/db"
)

type liveAnswer struct {
	Name      string `json:"name"`
	Text      string `json:"text"`
	Choice    int    `json:"choice"`
	Highlight bool   `json:"highlight"`
	Skipped   bool   `json:"skipped"`
	At        int64  `json:"at"`
}

type liveEvent struct {
	ID         string                `json:"id"`
	Notice     string                `json:"notice"`
	NoticeID   string                `json:"noticeId"`
	Question   string                `json:"question"`
	Choices    []string              `json:"choices"`
	Highlights []int                 `json:"highlights"`
	Target     string                `json:"target"`
	TargetName string                `json:"targetName"`
	Open       bool                  `json:"open"`
	At         int64                 `json:"at"`
	Deadline   int64                 `json:"deadline"`
	Answers    map[string]liveAnswer `json:"answers"`
}

func eventText(body map[string]any, key string, max int) (string, error) {
	s, _ := body[key].(string)
	s = strings.TrimSpace(s)
	if utf8.RuneCountInString(s) > max {
		return "", httpErr{400, "글자 수가 너무 길어요: " + key}
	}
	return s, nil
}

func eventNumber(body map[string]any, key string) (int, bool) {
	v, ok := body[key].(float64)
	if !ok || v != float64(int(v)) {
		return 0, false
	}
	return int(v), true
}

func eventID() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

// Transaction이 재시도되어도 같은 입력을 쓰고, 응답/종료/다음 질문을 원자적으로 처리한다.
func eventTransaction(ctx context.Context, change func(*liveEvent) error) error {
	return dbC.NewRef("config/liveEvent").Transaction(ctx, func(tn db.TransactionNode) (interface{}, error) {
		var ev liveEvent
		if err := tn.Unmarshal(&ev); err != nil {
			return nil, err
		}
		if err := change(&ev); err != nil {
			return nil, err
		}
		return ev, nil
	})
}

func handleLiveEventAdmin(ctx context.Context, c caller, body map[string]any) (any, error) {
	action, _ := body["action"].(string)
	id, err := eventID()
	if err != nil {
		return nil, err
	}
	now := time.Now().UnixMilli()
	var next liveEvent
	switch action {
	case "notice":
		notice, e := eventText(body, "notice", 500)
		if e != nil {
			return nil, e
		}
		err = eventTransaction(ctx, func(ev *liveEvent) error {
			ev.Notice, ev.NoticeID = notice, id
			return nil
		})
	case "publish":
		q, e := eventText(body, "question", 300)
		if e != nil {
			return nil, e
		}
		if q == "" {
			return nil, httpErr{400, "질문을 적어 주세요"}
		}
		next = liveEvent{ID: id, Question: q, Target: "all", TargetName: "전체 참가자", Open: true, At: now}
		if raw, exists := body["choices"]; exists {
			items, ok := raw.([]any)
			if !ok || len(items) == 1 || len(items) > 4 {
				return nil, httpErr{400, "선택지는 없거나 2~4개여야 해요"}
			}
			for _, item := range items {
				s, ok := item.(string)
				s = strings.TrimSpace(s)
				if !ok || s == "" || utf8.RuneCountInString(s) > 80 {
					return nil, httpErr{400, "선택지는 1~80자로 적어 주세요"}
				}
				next.Choices = append(next.Choices, s)
			}
		}
		if raw, exists := body["highlights"]; exists {
			items, ok := raw.([]any)
			if !ok || len(items) > 4 {
				return nil, httpErr{400, "강조 선택지가 잘못됐어요"}
			}
			for _, item := range items {
				v, ok := item.(float64)
				if !ok || v != float64(int(v)) || v < 0 || v >= float64(len(next.Choices)) {
					return nil, httpErr{400, "강조 선택지를 확인하세요"}
				}
				next.Highlights = append(next.Highlights, int(v))
			}
		}
		seconds, ok := eventNumber(body, "seconds")
		if !ok || seconds < 0 || seconds > 3600 {
			return nil, httpErr{400, "시간 제한은 0~3600초로 적어 주세요"}
		}
		if seconds > 0 {
			next.Deadline = now + int64(seconds)*1000
		}
		target, _ := body["target"].(string)
		if target != "all" {
			var online map[string]struct {
				N string `json:"n"`
				T int64  `json:"t"`
			}
			if e := dbC.NewRef("online").Get(ctx, &online); e != nil {
				return nil, e
			}
			var candidates []string
			for k, p := range online {
				if p.T > now-90000 && p.T <= now+15000 && p.N != "" && k != c.Key {
					candidates = append(candidates, k)
				}
			}
			sort.Strings(candidates)
			if target == "random" {
				if len(candidates) == 0 {
					return nil, httpErr{400, "지목할 접속자가 없어요. 전체 질문을 선택하세요"}
				}
				n, e := rand.Int(rand.Reader, big.NewInt(int64(len(candidates))))
				if e != nil {
					return nil, e
				}
				target = candidates[n.Int64()]
			} else {
				found := false
				for _, k := range candidates {
					if target == k {
						found = true
					}
				}
				if !found {
					return nil, httpErr{400, "지목할 사용자가 접속 중이 아니에요"}
				}
			}
			var profile struct {
				Name   string `json:"name"`
				Banned bool   `json:"banned"`
			}
			if e := dbC.NewRef("users/"+target).Get(ctx, &profile); e != nil {
				return nil, e
			}
			if profile.Name == "" || profile.Banned {
				return nil, httpErr{400, "참가할 수 없는 계정이에요. 다시 뽑아 주세요"}
			}
			next.Target, next.TargetName = target, profile.Name
		}
		err = eventTransaction(ctx, func(ev *liveEvent) error {
			next.Notice, next.NoticeID = ev.Notice, ev.NoticeID
			*ev = next
			return nil
		})
	case "close", "clear", "deleteAnswer":
		roundID, _ := body["id"].(string)
		key, _ := body["key"].(string)
		err = eventTransaction(ctx, func(ev *liveEvent) error {
			if roundID != ev.ID {
				return httpErr{409, "질문이 바뀌었어요. 화면을 확인해 주세요"}
			}
			switch action {
			case "close":
				ev.Open = false
			case "clear":
				*ev = liveEvent{Notice: ev.Notice, NoticeID: ev.NoticeID}
			case "deleteAnswer":
				delete(ev.Answers, key)
			}
			return nil
		})
	default:
		return nil, httpErr{400, "알 수 없는 이벤트 명령이에요"}
	}
	if err != nil {
		return nil, err
	}
	return map[string]any{"ok": true, "id": id, "targetName": next.TargetName}, nil
}

// 검사/결과 생성 로직은 DB와 분리해 동시 제출, 재시도, 마감 경계를 검증한다.
func recordLiveAnswer(ev *liveEvent, uid, name string, body map[string]any, now int64) error {
	id, _ := body["id"].(string)
	if ev.ID == "" || id != ev.ID {
		return httpErr{409, "다음 질문으로 바뀌었어요"}
	}
	// 네트워크 오류 후 재전송해도 같은 계정의 답변은 다시 기록하지 않는다.
	if _, exists := ev.Answers[uid]; exists {
		return nil
	}
	if !ev.Open || (ev.Deadline > 0 && now >= ev.Deadline) {
		return httpErr{409, "답변 시간이 끝났어요"}
	}
	if ev.Target != "all" && ev.Target != uid {
		return httpErr{403, "이번 질문에 지목된 참가자만 답할 수 있어요"}
	}
	skip, _ := body["skip"].(bool)
	answer := liveAnswer{Name: name, Choice: -1, Skipped: skip, At: now}
	if skip {
		answer.Text = "패스했어요"
	} else {
		if consent, _ := body["consent"].(bool); !consent {
			return httpErr{400, "닉네임·답변 공개 안내를 확인해 주세요"}
		}
		if len(ev.Choices) > 0 {
			choice, ok := eventNumber(body, "choice")
			if !ok || choice < 0 || choice >= len(ev.Choices) {
				return httpErr{400, "선택지를 골라 주세요"}
			}
			answer.Choice, answer.Text = choice, ev.Choices[choice]
			for _, h := range ev.Highlights {
				if h == choice {
					answer.Highlight = true
				}
			}
		} else {
			text, e := eventText(body, "text", 200)
			if e != nil {
				return e
			}
			if text == "" {
				return httpErr{400, "답변을 입력해 주세요"}
			}
			answer.Text = text
		}
	}
	if len(ev.Answers) >= 1000 {
		return httpErr{409, "이번 질문의 답변이 가득 찼어요"}
	}
	if ev.Answers == nil {
		ev.Answers = map[string]liveAnswer{}
	}
	ev.Answers[uid] = answer
	return nil
}

func handleLiveEventAnswer(ctx context.Context, c caller, body map[string]any) (any, error) {
	var profile struct {
		Name string `json:"name"`
	}
	if err := dbC.NewRef("users/"+c.Key).Get(ctx, &profile); err != nil {
		return nil, err
	}
	if profile.Name == "" {
		return nil, httpErr{403, "가입한 참가자 계정으로 접속해 주세요"}
	}
	err := eventTransaction(ctx, func(ev *liveEvent) error {
		return recordLiveAnswer(ev, c.Key, profile.Name, body, time.Now().UnixMilli())
	})
	if err != nil {
		return nil, err
	}
	return map[string]bool{"ok": true}, nil
}
