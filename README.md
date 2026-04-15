# Production Isaiah - Self Hosting Guide (Asustor Server)

이 프로젝트를 개인 서버(Asustor 등)에 배포하기 위한 가이드입니다.

## 1. 사전 준비
- **Node.js**: 서버에 Node.js (v18 이상 권장, v22.6+ 권장)가 설치되어 있어야 합니다.
- **Firebase**: Firebase 콘솔에서 프로젝트가 설정되어 있어야 합니다.
- **Gmail App Password**: 문의 메일 전송을 위해 Gmail 앱 비밀번호가 필요합니다.

## 2. 설치 및 설정
1. 전체 파일을 서버의 원하는 디렉토리에 업로드합니다.
2. 터미널에서 해당 디렉토리로 이동하여 의존성을 설치합니다:
   ```bash
   npm install
   ```
3. `.env` 파일을 생성하고 필요한 정보를 입력합니다 (`.env.example` 참고):
   ```env
   # 이메일 발송 설정
   EMAIL_USER=your-gmail@gmail.com
   EMAIL_PASS=your-app-password

   # 관리자 인증 설정 (기본값 사용 가능)
   VITE_ADMIN_EMAIL=your-gmail@gmail.com
   VITE_ADMIN_PASSWORD=your-app-password

   # 서버 포트 (기본값 3000)
   PORT=3000
   ```

## 3. 빌드 및 실행
통합 코드 방식으로, 프론트엔드를 빌드한 후 서버를 실행합니다.

1. **프론트엔드 빌드**:
   ```bash
   npm run build
   ```
   이 명령은 `dist` 폴더를 생성합니다.

2. **서버 실행**:
   ```bash
   npm start
   ```
   이제 `http://서버IP:3000`으로 접속 가능합니다.

## 4. 관리자 메뉴 (Admin Menu) 주의사항
관리자 메뉴가 정상적으로 작동하려면 다음 설정을 확인하세요:

1. **Firebase 승인된 도메인**:
   - Firebase 콘솔 > Authentication > Settings > Authorized domains
   - 서버의 IP 주소 또는 도메인을 추가해야 Google 로그인이 작동합니다.
2. **HTTPS 권장**:
   - Google 로그인은 보안상 HTTPS 환경에서 가장 잘 작동합니다. IP로 접속 시 브라우저 정책에 따라 팝업이 차단되거나 오류가 날 수 있습니다.
3. **환경 변수**:
   - `VITE_ADMIN_EMAIL`과 `VITE_ADMIN_PASSWORD`가 `.env`에 정확히 입력되었는지 확인하세요.

## 5. 문제 해결 (Troubleshooting)
- **메일 전송 실패**: Gmail 설정에서 '앱 비밀번호'를 사용했는지 확인하세요.
- **관리자 로그인 오류**: 브라우저 콘솔(F12)을 확인하여 `auth/unauthorized-domain` 에러가 뜨는지 확인하세요.
- **포트 충돌**: Asustor의 다른 서비스가 3000번 포트를 사용 중이라면 `.env`에서 `PORT`를 변경하세요.
