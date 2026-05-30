# Camp Rental Reservation

캠핑 렌탈 예약을 달력으로 확인하고 신청할 수 있는 웹앱입니다. 예약 데이터는 MySQL에 저장됩니다.

## 주요 기능

- 달력형 예약 현황 보기
- 예약 신청 등록
- 예약 상태: `pending`, `confirmed`, `canceled`
- 공개 달력에서는 이름 첫 글자만 표시
- 관리자 API로 전체 예약/연락처 조회 및 상태 변경

## 서버 구성

- 웹앱 서버: `8094`
- HAProxy 예시 포트: `8095`
- DB: MySQL 8.x 권장

## 필요한 서버

현재 구성만으로는 아래 2개면 충분합니다.

- Node.js 20 이상이 설치된 웹앱 서버
- MySQL 서버

Docker Compose를 쓰면 웹앱과 MySQL을 같은 서버에서 같이 띄울 수 있습니다. 실제 운영에서는 백업을 위해 MySQL 볼륨 백업이나 별도 DB 서버를 권장합니다.

## 로컬 실행

```bash
cp .env.example .env
npm install
npm start
```

브라우저에서 `http://localhost:8094`를 열면 됩니다.

## MySQL 직접 구성

MySQL에 접속해서 아래 파일을 실행합니다.

```bash
mysql -u root -p < db/schema.sql
```

그 다음 `.env` 값을 서버 환경에 맞게 수정합니다.

```env
PORT=8094
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=camp_user
DB_PASSWORD=change_this_password
DB_NAME=camp_reservations
ADMIN_KEY=change_this_admin_key
```

## Docker Compose 실행

```bash
docker compose up -d --build
```

비밀번호는 실행 전에 환경변수로 바꾸는 것을 권장합니다.

```bash
export DB_PASSWORD='강한_DB_비밀번호'
export ADMIN_KEY='강한_관리자키'
docker compose up -d --build
```

## HAProxy 예시

`deploy/haproxy-camp.cfg` 파일을 참고하세요. `8095`로 들어온 요청을 `127.0.0.1:8094` 앱 서버로 넘기는 예시가 들어 있습니다.

## 관리자 API

전체 예약 조회:

```bash
curl -H "x-admin-key: change_this_admin_key" http://localhost:8094/api/admin/reservations
```

예약 상태 변경:

```bash
curl -X PATCH \
  -H "Content-Type: application/json" \
  -H "x-admin-key: change_this_admin_key" \
  -d '{"status":"confirmed"}' \
  http://localhost:8094/api/admin/reservations/1/status
```

## 실제 서버 배포 메모

`ccymproxmox.iptime.org:8094`는 Node.js 앱 서버로 열고, `ccymproxmox.iptime.org:8095`는 HAProxy에서 `8094`로 프록시하면 됩니다.

운영 전에 꼭 바꿔야 하는 값:

- MySQL 비밀번호
- `ADMIN_KEY`
- 방화벽 인바운드 포트 `8094`, `8095`
- MySQL을 외부에 열지 않을 경우 `3306`은 내부만 허용
