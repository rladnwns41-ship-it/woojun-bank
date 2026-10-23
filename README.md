# 우준은행

친구들끼리 쓰는 가상 경제 사이트. 가상 주식, 친구들이 만든 코인, 실시간 보드게임, 우준 화폐 ATM.

## 구성

- `index.html` 로그인 · 가입 · 게스트
- `trade.dc.html` 거래소 (주식, 상한가·하한가 ±30%)
- `bank.dc.html` 내 계좌 (송금 · 출금 · 대출 · ATM · 내역)
- `games.dc.html` 보드게임 (`games-more.js`: 치킨 차차차 · 라쿠카라차 · 포켓볼)
- `tournament.dc.html` 토너먼트 (`tourney.js`: 매주 목요일 20시 자동 개최 · 접속자 초대 · 참가 보너스 5만준 · 대진표 · 우승 상금 1억~10억 무작위)
- `games-uno.js` 우노 · `games-golf.js` 미니골프 (6홀: 모래·연못·경사로·범퍼·풍차)
- `estate.html` 부동산 (전국 위성 지도, 동·호 단위 계약, 대출, 월세·전세·실거주, 보유세, 리모델링, 다주택 중과, 실거래가, 급매, 건물주)
- `company.dc.html` 회사 (설립·영입, 1인 2곳, 출근 수익, 사업, 시설, 업종 능력, 증시 상장, 인수합병, 대항전, 채팅, 파업, 부도)
- `company-core.js` · `CompanyMarket.dc.html` 회사 주식 (거래소에도 표시, 주가 변동)
- `coin.dc.html` 코인 (발행 650,000준)
- `ranking.dc.html` 랭킹
- `lotto.dc.html` 복권 (긁는 복권, 잭팟)
- `hack.dc.html` 해킹 (월·수요일, 문제 풀고 확률로 친구 현금 빼 오기, 공격·방어 업그레이드)
- `admin.dc.html` 관리자
- `main.go` Render용 Go 서버 (정적 파일 + 화폐 발급/입금 + 연체 대출 회수)

## 배포

Render에 이 저장소를 연결하고 Blueprint(`render.yaml`)로 만듭니다. 자세한 설정과 Firebase 규칙은 `FIREBASE_SETUP.md`를 보세요.

서비스 계정 JSON은 저장소에 올리지 말고 Render 환경변수 `FIREBASE_SERVICE_ACCOUNT`에만 넣으세요.

## 2026-10-23: 땅 거래 · 기존 2인 대국

- `estate.html`: 드래그로 최대 100칸 선택, 빈 땅 일괄 구매, 내 땅 판매(매입가 80%), 다른 주인 땅 강제 매입.
- 강제 매입가는 일반 구매가와 기존 매입가 중 높은 가격의 1.5배. 이전 주인에게 80% 보상, 매입 후 5분 보호.
- `land-trade.go`: `/api/land/trade`에서 잔액·소유권·보상·거래 내역·중복 요청 영수증을 하나의 서버 트랜잭션으로 확정.
- `database.rules.json`: `estate/land` 직접 쓰기를 차단. Firebase Realtime Database 규칙에도 이 파일을 적용해야 합니다.
- `games-duo.js`: 기존 `BG` 2인 대국 시스템에 바퀴벌레 포커, 펭귄 얼음 깨기, 코드네임 듀엣 등록. 코드네임은 친선 협동 전용이며 판돈·대결 전적을 정산하지 않습니다.
- 탭 아이콘은 Tabler SVG를 코드에 포함. 게임 그림은 `assets/openmoji/`에 포함해 CDN 실패 시 픽셀 그림으로 바뀌지 않습니다. 출처는 `assets/ATTRIBUTION.md` 참조.
- 앞서 받은 별도 친구 모임 버전의 `games-party.js`, `party-games.css`, `party-games.go`, `party-rules.go`, `party-rules_test.go`는 더 이상 사용하지 않습니다. 이전 파일을 적용했다면 제거하세요. `main.go`와 `games.dc.html`도 이번 파일로 함께 교체합니다.

검증: `go test ./...`, `go vet ./...`, `node tests/games-duo.test.cjs`, `node scripts/build-land-catalog.cjs --check`.
