# 동현큐™: 출처·이용 안내

동현큐는 1981년 Taito America의 오락실 게임 「큐(Qix)」와 그 게임보이 이식판(1990 · Nintendo 발매)에서 따온 선 긋기 땅따먹기의 **뼈대**에서 영감을 받은 비상업적 취미 작품이다. 큐의 권리는 Taito(Square Enix 자회사)에 있다. 동현큐는 이들과 관계가 없고 승인도 받지 않았다.

## 원작에서 가져온 것

- 뼈대만 참고했다: 테두리에서 안쪽으로 선을 그어 돌아오면 떠도는 큐가 없는 쪽이 점령되는 것, 빠른 선과 느린 선의 점수 차이, 테두리를 도는 스파크, 멈춘 선을 타고 오는 도화선, 목표 비율을 채우면 다음 단계로 가는 구성.
- 다르게 만들었다: 1인용, 아홉 단계로 끝이 있음, 동현랭으로 고르는 방식 다섯(기본·빌런 떼·쌍둥이 큐·빠른 큐·욕심쟁이), 스파크를 동현랭 세계관의 슈슈 얼굴로, 시리즈 플레이그라운드에 맞춘 파스텔 색, 저장·불러오기, 전체 화면, 게임패드.
- 원작 게임의 그림·음악·효과음·글·코드는 하나도 쓰지 않았다. 원작 파일과 그 일부는 이 저장소에 없고, 원작 파일에서 그림이나 자료를 꺼내 쓰지도 않았다.
- 구체적인 수치(판 크기·속도·점수·슈슈 수·간격·도화선 대기)는 모두 동현큐가 정한 것이다.

## 동현큐가 새로 만든 것

- 게임 엔진(`src/engine.js`: 판·선·점령 채우기·큐·슈슈·도화선·단계 진행), 화면(`src/render.js`), 조작·메뉴·저장(`src/app.js`), 동현랭 출전 규약과 예제(`src/examples.js`), 문서, 시험.
- 슈슈 얼굴(`src/sprites.js`)은 동현주의 16×16 도트 그림을 그대로 가져왔다.
- 동현랭 실행기(`src/donghyun.js`)는 [동현랭 저장소](https://github.com/Raspberry-Kim/donghyun-lang)의 v1.55를 고치지 않고 썼다. 합성 효과음(`src/sfx.js`)과 게임패드(`src/gamepad.js`)는 동현램의 것을 따랐고, 편집기·전체 화면·저장 메뉴도 동현램의 방식을 따랐다.

## 슈슈

슈슈는 동현파의 복서다. 슈슈의 이름과 모습(도트 그림 포함)에 대한 권리는 MIT 코드 라이선스와 별개로 만든 사람에게 있다. 코드를 가져다 쓸 때 이 그림과 이름은 바꿔 쓰기를 권한다.

## 참고한 자료

- Qix — Wikipedia: https://en.wikipedia.org/wiki/Qix
- QIX Releases — MobyGames: https://www.mobygames.com/game/3476/qix/releases/
- Qix (Game Boy) — theLogBook: https://www.thelogbook.com/phosphor/qix-game-boy/

## 글꼴

검은고딕 Black Han Sans · Pretendard · 나눔고딕코딩 — SIL Open Font License 1.1 (`licenses/`).

## 라이선스

동현큐 코드·문서: MIT (`LICENSE`). 동현랭 실행기: MIT (`licenses/DONGHYUN-MIT.txt`).
