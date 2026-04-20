# Production Isaiah - Deployment Guide

이 프로젝트는 **GitHub -> GitHub Actions -> NAS(정적 파일)** 구조로 배포되는 정적 웹 애플리케이션입니다.

## 1. 아키텍처 개요
- **Frontend**: Vite + React (SPA)
- **Database/Storage**: Firebase (Firestore & Storage)
- **Deployment**: 
  1. GitHub에 코드 푸시
  2. GitHub Actions에서 `npm run build` 수행
  3. 생성된 `dist` 폴더의 정적 파일들을 NAS 호스팅 경로로 전송
  4. Nginx 등 웹 서버를 통해 정적 파일 서빙

## 2. 사전 준비
- **Firebase**: Firebase Console에서 프로젝트 설정 및 `firebase-applet-config.json` 준비.
- **NAS/Hosting**: `dist` 폴더의 내용을 호스팅할 웹 서버 환경.

## 3. 설정 (Environment Variables)
`.env` 파일에 필요한 정보를 입력합니다 (`.env.example` 참고):
```env
# 관리자 인증 설정
VITE_ADMIN_EMAIL=thechilde77@gmail.com
VITE_ADMIN_PASSWORD=5882
```

## 4. 빌드 및 배포
1. **의존성 설치**:
   ```bash
   npm install
   ```
2. **정적 파일 빌드**:
   ```bash
   npm run build
   ```
3. 생성된 `dist` 디렉토리 내의 모든 파일을 서버의 웹 루트 디렉토리로 업로드합니다.

## 5. 관리자 메뉴 (Admin Menu)
관리자 메뉴는 클라이언트 브라우저에서 직접 Firebase Firestore와 통신하여 데이터를 관리합니다.
- 사이트 설정, 포트폴리오, 협력사, 메시지 등 모든 데이터는 실시간으로 Firebase에 저장됩니다.
- 별도의 서버 측 빌드 프로세스 없이, 저장된 데이터는 각 페이지 접속 시 브라우저에서 동적으로 불러와 렌더링됩니다.

## 6. 주의사항
- **SPA 라우팅**: Nginx 등 웹 서버 설정에서 모든 요청을 `index.html`로 보내도록 설정해야 라우팅(예: `/portfolio`, `/campaign`)이 정상 작동합니다.
- **Firebase 승인된 도메인**: Firebase Console > Authentication > Settings에 배포 도메인을 반드시 추가해야 합니다.
