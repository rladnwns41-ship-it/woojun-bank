# Firebase 및 배포 설정

1. Firebase Console → Authentication → Sign-in method에서 **이메일/비밀번호**를 활성화합니다.
2. Render 또는 GitHub Pages 도메인을 Authentication의 **승인된 도메인**에 등록합니다.
3. 기존 닉네임·PIN 사용자는 로그인 화면의 **기존 계정 연결**에서 이메일과 비밀번호를 등록합니다. `authLinks/{authUid}`가 기존 `users/{nicknameKey}`를 가리킵니다.
4. 관리자 계정은 Realtime Database의 `admin/authorizedUids/{관리자 Auth UID}`를 `true`로 설정합니다.
5. 저장소 루트에 모든 HTML·JS·CSS 파일을 올리고 `assets/game-thumbs/` 폴더 구조를 유지합니다. 기존 `leisure.dc.html`, `lotto.dc.html`, `assets/fishing/`, `assets/openmoji/`는 삭제합니다. ZIP 파일만 올려서는 사이트가 배포되지 않습니다.
6. 배포 후 `/game-core.js`, `/wj-ui.js`, `/wj-ui.css`, `/qna.dc.html`, `/arcade-games.js`, `/assets/game-thumbs/omok.webp`가 모두 HTTP 200인지 확인합니다. `assets/rotate-phone.svg`는 더 이상 쓰지 않으니 지워도 됩니다. 삭제한 두 페이지는 HTTP 404가 정상입니다.

## 친구들의 Q&A

새 문제는 `friendQuizzes/{quizId}`에 저장됩니다. Q&A 화면은 최근 60개를 실시간 구독합니다. 답변·보상 기록과 계좌 잔액은 `users/{accountKey}` 한 거래에서 함께 갱신되어 같은 문제로 중복 보상을 받지 않습니다. 한 계정은 하루에 문제 5개를 올리고, 최대 20개 답변에서 보상받을 수 있습니다. 출제자는 자기 문제에서 보상받지 않습니다.

Realtime Database 규칙에 아래 항목을 **기존 규칙과 병합**하세요. 이미 상위 경로에 넓은 `.write`가 있으면 더 좁은 규칙이 보호를 제공하지 못하므로 상위 규칙도 확인해야 합니다. 기존 계좌 읽기·쓰기 규칙도 Q&A 화면의 사용자 거래를 허용해야 합니다.

```json
"friendQuizzes": {
  ".read": "auth != null",
  ".indexOn": ["createdAt"],
  "$quizId": {
    ".write": "auth != null && ((!data.exists() && newData.exists() && newData.child('authorAuthUid').val() === auth.uid) || (data.exists() && !newData.exists() && data.child('authorAuthUid').val() === auth.uid))",
    ".validate": "newData.hasChildren(['question', 'choices', 'answer', 'authorKey', 'authorAuthUid', 'authorName', 'createdAt']) && newData.child('question').isString() && newData.child('choices').hasChildren(['0', '1', '2', '3']) && newData.child('answer').isNumber() && newData.child('answer').val() >= 0 && newData.child('answer').val() <= 3 && newData.child('authorKey').isString() && newData.child('authorAuthUid').val() === auth.uid && newData.child('authorName').isString() && newData.child('createdAt').isNumber()"
  }
}
```

Firebase Auth는 로그인 신원을 확인하지만, 현재 게임머니와 정답 판정은 브라우저에서 처리합니다. 따라서 개발자 도구로 답을 읽거나 잔액을 조작하는 행위를 완전히 막을 수 없습니다. 실제 금전 가치가 있는 보상으로 운영하려면 정답 판정과 지급을 Cloud Functions 같은 서버로 옮기고 사용자 잔액의 클라이언트 쓰기를 차단해야 합니다.

## Render 서버 (Go) 배포

돈이 걸린 작업은 Go 서버(`main.go`)가 Firebase Admin 권한으로 처리합니다. 서버는 사이트 파일도 함께 서빙하므로 GitHub Pages 대신 Render 하나로 운영합니다.

1. Firebase Console → 프로젝트 설정 → 서비스 계정 → **새 비공개 키 생성**으로 JSON을 받습니다.
2. 저장소를 Render에 연결하고 **New → Blueprint**를 고르면 `render.yaml`이 읽힙니다. (직접 만들 때: Web Service · Runtime Go · Build `go mod tidy && go build -o app .` · Start `./app`)
3. 환경변수 `FIREBASE_SERVICE_ACCOUNT`에 1번 JSON 전체를 붙여 넣습니다. `CODE_PEPPER`는 Render가 자동 생성합니다. **CODE_PEPPER를 바꾸면 이미 발급한 화폐 코드가 모두 무효가 되니** 바꾸지 마세요.
4. Render 도메인(`*.onrender.com`)을 Firebase Authentication의 승인된 도메인에 추가합니다.
5. 배포 후 `/healthz`가 `ok`인지 확인합니다.

서버가 맡는 일: 우준 화폐 코드 발급·폐기(관리자), ATM 입금(코드 확인 → 1회 사용 처리 → 입금), 10분마다 연체 대출 회수, 틀린 코드 반복 입력 차단(10분에 8회). `main.go`, `go.mod`, `render.yaml`, `.md` 파일은 웹으로 노출되지 않습니다.

## 로그인 · 게스트

- Authentication → Sign-in method에서 **이메일/비밀번호**와 **익명**을 둘 다 켭니다.
- 새 계정은 닉네임과 비밀번호만 받습니다. 닉네임을 해시해서 내부용 주소(`u…@id.wjbank.app`)로 Firebase에 등록하므로 이메일을 수집하지 않습니다. 대신 비밀번호 재설정 메일은 보낼 수 없고, 관리자가 Firebase Console에서 비밀번호를 바꿔 줘야 합니다.
- 게스트는 익명 로그인입니다. 브라우저에 로그인 상태가 계속 남고, 쿠키 `wj_did`(10년)에 브라우저 ID가 남습니다. 쿠키·사이트 데이터를 지우면 게스트 계정은 되찾을 수 없습니다.

## 정지 (UID · 브라우저)

관리자 화면에서 계정 정지 시 `users/{key}/banned`와 `bans/uids/{authUid}`가 함께 설정됩니다. 브라우저 정지는 `bans/devices/{브라우저 ID}`입니다. 접속할 때마다 `users/{key}/devices/{브라우저 ID}`가 기록돼 관리자 화면에서 보입니다.

## 대출 자동 상환

처음 빌린 순간부터 3일(`loanDue`)이 기한입니다. 기한이 지나면 하루마다 5% 연체 이자가 붙고 가진 현금에서 자동으로 빠져나갑니다. 접속 중인 브라우저와 서버가 같은 규칙으로 처리하며 `loanCharged`로 이자가 두 번 붙지 않게 막습니다.

## 추가 Security Rules

```json
"bans": {
  ".read": "auth != null && root.child('admin/authorizedUids/' + auth.uid).val() === true",
  ".write": "auth != null && root.child('admin/authorizedUids/' + auth.uid).val() === true",
  "devices": { "$did": { ".read": true } },
  "uids": { "$uid": { ".read": "auth != null && auth.uid === $uid" } }
},
"currency": {
  ".read": "auth != null && root.child('admin/authorizedUids/' + auth.uid).val() === true",
  ".write": false
},
"coinChat": {
  ".read": "auth != null",
  "$coinId": { "$msgId": { ".write": "auth != null && !data.exists()", ".validate": "newData.child('t').isString() && newData.child('t').val().length <= 120" } }
},
"users": { ".indexOn": ["loanDue"] }
```

`currency`는 서버만 씁니다. 코드 원문은 저장하지 않고 `CODE_PEPPER`를 섞은 해시만 저장하므로, 데이터베이스를 읽어도 코드를 알아낼 수 없습니다.

## 코인 (coin.dc.html)

친구가 만든 코인은 `coins/{coinId}`, 거래 내역은 `coinTx/{coinId}/{txId}`에 저장됩니다. 가격은 유통량으로만 정해집니다(`100 + 2 × 유통량`준). 매수·매도는 `coins/{coinId}` 트랜잭션으로 유통량과 보유량(`h/{accountKey}`)을 함께 바꿉니다. 발행 비용은 650,000준이고, 하루 가격 변동은 시가 기준 ±30%(상한가·하한가)로 막혀요. 주식도 같은 ±30% 제한이 적용돼요. 발행 비용 외에, 거래 수수료 2% 중 1%는 발행자에게 갑니다. 아래 규칙을 기존 규칙과 병합하세요.

```json
"coins": {
  ".read": "auth != null",
  "$coinId": {
    ".write": "auth != null",
    ".validate": "newData.hasChildren(['name', 'sym', 'by', 'ts', 's']) && newData.child('s').isNumber() && newData.child('s').val() >= 0"
  }
},
"coinTx": {
  ".read": "auth != null",
  "$coinId": { "$txId": { ".write": "auth != null && !data.exists()" } }
}
```

게임머니와 마찬가지로 가격 계산과 지급은 브라우저에서 처리하므로, 조작을 완전히 막으려면 서버로 옮겨야 합니다.

## 보드게임 친구 초대

초대방은 `games.dc.html?room=...` 링크를 받은 사용자가 참가합니다. 링크는 UI 접근을 돕는 기능이며, `tables`의 읽기·쓰기 권한은 별도 Security Rules로 관리해야 합니다.

## 공통 UI (wj-ui.js · wj-ui.css)

모든 로그인 페이지가 불러오는 공통 파일입니다. 상단 탭 글리치·스크램블 효과, 페이지 전환, 알림 토스트, `Ctrl+K`(또는 `/`) 빠른 이동, `Alt+1~5` 페이지 단축키, 출석 보상, 내 차례 알림을 담당합니다.

출석 보상은 하루 한 번(한국 시간 기준) `users/{accountKey}` 거래 하나로 `daily: { day, streak, total }`과 `cash`를 함께 갱신합니다. 연속 출석일수에 따라 3,000준에서 하루 1,000준씩 늘어 최대 9,000준까지 지급됩니다. 주급은 한국 시간 월요일에 시작하는 주마다 500,000준이 첫 접속 때 자동 지급돼요(`users/{key}/weekly`). 기존 계좌 쓰기 규칙이 이 거래를 허용해야 합니다.

화폐 단위는 화면 표시만 "준"으로 바뀌었고, 데이터베이스 값은 그대로입니다.

## 세금

주식을 팔 때 매도 금액의 0.2% 거래세와 수익의 10% 양도소득세를 뗍니다(`game-core.js`의 `TAX`). 낸 세금은 `users/{key}/taxPaid`에 쌓이고 전체 합계는 `treasury/tax`에 모입니다.

```json
"treasury": { ".read": "auth != null", "tax": { ".write": "auth != null", ".validate": "newData.isNumber() && newData.val() >= data.val()" } }
```

## 해킹 (hack.dc.html)

한국 시간 월·수요일에만 열립니다. 하루 5번, 같은 친구는 하루 한 번, 시도마다 쿨타임 30분(`hack.last`). 문제 5개(세 자리 덧뺄셈, 두 자리 곱셈, 2진수·16진수 변환)를 40초 안에 모두 맞히면 성공 확률(30% + (공격 − 상대 방어) × 6%p, 5~85%)로 결과가 갈립니다. 성공하면 상대 현금의 3% + 공격 레벨당 1%(최대 30만 + 레벨당 10만준)를 가져오고, 실패하면 2만 + 상대 방어 레벨당 1만준을 상대에게 벌금으로 냅니다. 레벨은 `users/{key}/hack`에, 기록은 `hackLog/{key}`에 저장됩니다. 업그레이드 비용은 5만 × (현재 레벨 + 1)²준, 최고 10레벨.

```json
"hackLog": { "$key": { ".read": "auth != null", "$id": { ".write": "auth != null && !data.exists()" } } }
```

송금과 마찬가지로 다른 사용자의 `cash`를 브라우저에서 바꾸므로 기존 계좌 쓰기 규칙이 이를 허용해야 합니다.

## 관리자 설정 (config)

관리자 화면의 **해킹 · 세금 설정**에서 해킹 탭을 켜고 끄고(`config/hackEnabled`), 주식 매도 세율(`config/tax: { sell, gain }`, 비율 값)을 바꿉니다. 모든 페이지가 실시간으로 읽어서 바로 반영돼요. 값이 없으면 해킹 켜짐, 거래세 0.2%, 양도세 10%가 기본값입니다.

```json
"config": { ".read": "auth != null", ".write": "auth != null && root.child('admin/authorizedUids/' + auth.uid).val() === true" }
```

## 코인 삭제

발행자는 코인 화면에서 자기 코인을 지울 수 있어요. 발행자를 뺀 보유자에게 산 값(원가 `cb`)을 발행자 현금에서 돌려줍니다. 관리자는 **코인 관리**에서 아무 코인이나 지울 수 있고, 이때 환불은 관리자 권한으로 지급돼요. `coinTx`·`coinChat` 기록도 지우려면 아래 규칙을 추가하세요(없으면 기록만 남고 코인은 지워져요).

```json
"coinTx": { "$coinId": { ".write": "auth != null && !newData.exists() && (!root.child('coins/' + $coinId).exists())" } },
"coinChat": { "$coinId": { ".write": "auth != null && !newData.exists() && (!root.child('coins/' + $coinId).exists())" } }
```

## 부계 방지

- 브라우저마다 처음 로그인한 계정이 그 브라우저의 주인이 됩니다(`deviceOwners/{브라우저 ID}`). 같은 브라우저에서 다른 계정으로 가입·게스트 시작·로그인하면 막히고 `users/{key}/altOf`에 기록돼요.
- 쿠키를 지워도 남는 기기 지문을 `users/{key}/fps`에 저장합니다. 같은 브라우저나 지문을 쓴 계정끼리는 송금, 해킹, 돈 걸린 보드게임을 할 수 없어요.
- 가족이나 친구가 기기를 함께 쓴다면 관리자 화면 플레이어 목록에서 **부계 허용**을 누르세요(`users/{key}/altOk`). 같은 기기를 쓴 다른 계정은 "같은 기기: …"로 표시돼요.
- 브라우저 판별일 뿐이라 다른 기기·시크릿 창+다른 브라우저 조합까지 완전히 막을 수는 없어요.

```json
"deviceOwners": { "$did": { ".read": true, ".write": "auth != null && (!data.exists() || root.child('admin/authorizedUids/' + auth.uid).val() === true)" } }
```

## 경제 밸런스

- 주식: 매수 수수료 0.3%, 매도 거래세 0.3%, 수익 양도세 15%(관리자에서 변경). 산 즉시 팔 수 있고, 호재·악재 뉴스는 가격이 움직이고 45초 뒤에 떠요.
- 코인: 거래 수수료 5%(절반은 발행자), 홍보 펌핑 20만준 · 5~15%, 뉴스는 1분 늦게 떠요.
- 보드게임 승리 보너스: 판돈 대국은 판돈의 20%, 친선 대국은 5,000준(하루 10번). 4수 이상 둔 대국만, 같은 기기 계정끼리는 지급하지 않아요. `tables/{id}/bonus`에 한 번만 지급 기록.
- 주급 50만준(매주 월요일 기준), 출석 3,000~9,000준.
- 우준 화폐는 ATM에서 액면가 + 5%로 교환돼요(서버 `exchangeBonus`).

## 탭 켜기·끄기

관리자 화면 **탭 · 세금 설정**에서 거래소·내 계좌·보드게임·코인·랭킹·해킹을 각각 끌 수 있어요(`config/tabs/{trade|bank|games|coin|ranking|hack}` = false). 꺼진 탭은 메뉴에서 사라지고, 주소로 들어오면 닫힘 안내가 떠요.

## 보이지 않는 균형 조절 (관리자만 참고)

화면에는 설명하지 않고, 순자산 중앙값(최소 100만)과 비교해 자동으로 조절해요. 배율은 √(중앙값 ÷ 내 순자산)이고 0.6~1.6배 사이예요.

- 주급·출석·보드게임 승리 보너스: 가난할수록 많이(최대 1.6배), 부자일수록 적게(최소 0.6배). 예) 주급 30만~80만.
- 주식 양도세: 부자일수록 높게(0.7~1.5배). 화면의 예상 세금에 이미 반영돼요.
- 해킹 성공 확률: 나보다 부자를 털면 최대 +10%p, 가난한 사람을 털면 최대 −10%p. 화면의 확률에 이미 반영돼요.

조절 강도는 `game-core.js`의 `eqMul`·`eqTax`·`eqHack` 범위 값으로 바꿀 수 있어요.

## 복권 (lotto.dc.html)

1장 1만준, 하루 20장. 한 장 팔릴 때마다 3,000준이 잭팟(`lotto/pot`, 시작 100만)에 쌓여요. 당첨 확률: 잭팟 1/2500 · 50만 1/300 · 5만 1/30 · 2만 1/12 · 1만 1/6.
큰 등수(잭팟·50만·5만)는 균형 배율의 제곱(0.36~2.56배)을 곱해서 부자는 잘 안 되고 가난하면 잘 돼요. 작은 등수는 모두 같아요. 12장 연속 꽝이면 다음 장은 2만 이상이 보장돼요. 꽝인 장도 같은 그림 2개가 자주 나와서 아깝게 보여요.
