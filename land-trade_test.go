package main

import (
	"encoding/json"
	"reflect"
	"testing"
)

func landFixture() map[string]any {
	return map[string]any{"users": map[string]any{"a": map[string]any{"name": "우준", "cash": int64(1000000000)}, "b": map[string]any{"name": "민서", "cash": int64(1000000000)}}, "estate": map[string]any{"land": map[string]any{}}, "other": map[string]any{"keep": true}}
}
func landIDs() []string { return []string{"90_40", "90_41"} }
func request(action string, ids []string, n string) landRequest {
	return landRequest{Action: action, IDs: ids, Nonce: "test-nonce-0000000000" + n, MaxTotal: 1000000000}
}
func TestLandBatchLifecycleAndConservation(t *testing.T) {
	root := landFixture()
	ids := landIDs()
	now := int64(1000000000)
	for _, id := range ids {
		if landCatalogue[id].Base == 0 {
			t.Fatal("fixture outside land grid", id)
		}
	}
	before := landInt(landMap(landMap(root["users"])["a"])["cash"])
	buy, e := landTrade(root, "a", request("buy", ids, "buy"), now)
	if e != nil {
		t.Fatal(e)
	}
	lands := landMap(landMap(root["estate"])["land"])
	if buy.Count != 2 || len(lands) != 2 {
		t.Fatal(buy, lands)
	}
	if landInt(landMap(landMap(root["users"])["a"])["cash"]) != before-buy.Debit {
		t.Fatal("incorrect debit")
	}
	oldA := landInt(landMap(landMap(root["users"])["a"])["cash"])
	oldB := landInt(landMap(landMap(root["users"])["b"])["cash"])
	take, e := landTrade(root, "b", request("take", ids, "take"), now+landShield)
	if e != nil {
		t.Fatal(e)
	}
	var compensation int64
	for _, id := range ids {
		if landOwner(lands[id]) != "b" {
			t.Fatal("ownership")
		}
		compensation += landRound(float64(landInt(landMap(lands[id])["p"])) * .8)
	}
	if landInt(landMap(landMap(root["users"])["a"])["cash"]) != oldA+compensation || landInt(landMap(landMap(root["users"])["b"])["cash"]) != oldB-take.Debit {
		t.Fatal("capture conservation")
	}
	sell, e := landTrade(root, "b", request("sell", ids, "sell"), now+landShield+1)
	if e != nil {
		t.Fatal(e)
	}
	if len(lands) != 0 || sell.Credit <= 0 {
		t.Fatal(sell, lands)
	}
	if len(landMap(landMap(root["history"])["a"])) != 2 || len(landMap(landMap(root["history"])["b"])) != 2 {
		t.Fatal("buyer/seller compensation history missing")
	}
	if !reflect.DeepEqual(root["other"], map[string]any{"keep": true}) {
		t.Fatal("unrelated data changed")
	}
}
func TestLandRetryIdempotentAcrossJSON(t *testing.T) {
	root := landFixture()
	req := request("buy", landIDs(), "retry")
	first, e := landTrade(root, "a", req, 1000000000)
	if e != nil {
		t.Fatal(e)
	}
	b, _ := json.Marshal(root)
	var next map[string]any
	json.Unmarshal(b, &next)
	before, _ := json.Marshal(next)
	again, e := landTrade(next, "a", req, 1000000001)
	if e != nil || !again.Replayed || again.Debit != first.Debit {
		t.Fatal(again, e)
	}
	after, _ := json.Marshal(next)
	if string(before) != string(after) {
		t.Fatal("retry charged twice")
	}
	req.Action = "sell"
	if _, e = landTrade(next, "a", req, 1000000002); e == nil {
		t.Fatal("nonce reused for different operation")
	}
}
func TestLandBatchRejectsWithoutPartialChanges(t *testing.T) {
	cases := []string{"balance", "maxTotal", "occupied", "notMine", "protected", "duplicate", "ocean"}
	for _, kind := range cases {
		t.Run(kind, func(t *testing.T) {
			root := landFixture()
			ids := landIDs()
			req := request("buy", ids, kind)
			lands := landMap(landMap(root["estate"])["land"])
			switch kind {
			case "balance":
				landMap(landMap(root["users"])["a"])["cash"] = 0
			case "maxTotal":
				req.MaxTotal = 1
			case "occupied":
				lands[ids[1]] = map[string]any{"o": "b"}
			case "notMine":
				req.Action = "sell"
			case "protected":
				req.Action = "take"
				for _, id := range ids {
					lands[id] = map[string]any{"o": "b", "p": 1000000, "ts": 1000000000}
				}
			case "duplicate":
				req.IDs = []string{ids[0], ids[0]}
			case "ocean":
				req.IDs = []string{ids[0], "0_0"}
			}
			before, _ := json.Marshal(root)
			if _, e := landTrade(root, "a", req, 1000000001); e == nil {
				t.Fatal("invalid trade accepted")
			}
			after, _ := json.Marshal(root)
			if string(before) != string(after) {
				t.Fatal("partial mutation on error")
			}
		})
	}
}
