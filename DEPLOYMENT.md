# 1001 Stories - Docker 배포 가이드

## ✅ 완료된 작업

### 1. Docker 컨테이너화
- ✅ Multi-stage Dockerfile 생성 (최적화된 production 빌드)
- ✅ docker-compose.yml (production 환경)
- ✅ docker-compose.dev.yml (개발 환경)
- ✅ Nginx reverse proxy 설정
- ✅ Health check endpoint (`/api/health`)

### 2. 배포 스크립트
- ✅ `scripts/deploy.sh` - 메인 배포 스크립트
- ✅ `scripts/setup-server.sh` - 서버 초기 설정
- ✅ `scripts/test-docker-local.sh` - 로컬 Docker 테스트

### 3. Git 저장소
- ✅ Git repository 초기화
- ✅ .gitignore 설정 (민감 정보 제외)
- ✅ 초기 commit 완료

## 🚀 GitHub에 Push하기

### 1. GitHub 저장소 생성
1. GitHub.com에서 새 repository 생성
2. Repository 이름: `1001-stories`
3. Private repository로 설정 권장

### 2. Remote 추가 및 Push
```bash
# GitHub remote 추가
git remote add origin https://github.com/YOUR_USERNAME/1001-stories.git

# 코드 push
git push -u origin main
```

## 🖥️ 서버 배포 (43.202.3.58)

### 1. 서버 초기 설정
```bash
# 서버 접속
ssh -i ../1001project.pem ubuntu@43.202.3.58

# 설정 스크립트 다운로드 및 실행
curl -o setup-server.sh https://raw.githubusercontent.com/YOUR_USERNAME/1001-stories/main/scripts/setup-server.sh
chmod +x setup-server.sh
./setup-server.sh
```

### 2. 저장소 Clone 및 환경 설정
```bash
# 배포 디렉토리로 이동
cd /var/www/1001-stories

# 저장소 clone
git clone https://github.com/YOUR_USERNAME/1001-stories.git .

# 환경 변수 파일 생성
nano .env
# 필요한 환경 변수 입력 후 저장
```

### 3. Docker로 배포
```bash
# Docker 이미지 빌드
docker-compose build

# 서비스 시작
docker-compose up -d

# 상태 확인
docker-compose ps
```

### 4. SSL 인증서 설정 (선택사항)
```bash
# 도메인이 있는 경우
sudo certbot --nginx -d your-domain.com
```

## 📝 환경 변수 설정

서버의 `.env` 파일에 다음 내용 추가:

```env
# 필수 설정
NODE_ENV=production
NEXTAUTH_URL=http://43.202.3.58
NEXTAUTH_SECRET=your-generated-secret

# 데이터베이스 (추후 설정)
# DATABASE_URL=postgresql://user:password@localhost:5432/1001stories

# 이메일 서비스 (선택)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASSWORD=your-app-password
```

## 🔍 테스트 및 확인

### 로컬 테스트
```bash
# Docker 테스트 실행
./scripts/test-docker-local.sh all
```

### 서버 테스트
```bash
# Health check
curl http://43.202.3.58/api/health

# 로그 확인
docker-compose logs -f app
```

## 🔄 업데이트 배포

로컬에서 변경사항 push 후:
```bash
# 로컬에서
git push origin main

# 로컬에서 배포 스크립트 실행
./scripts/deploy.sh
```

## ⚠️ 주의사항

1. **민감 정보 관리**
   - `.pem` 파일은 절대 Git에 commit하지 마세요
   - `.env` 파일도 Git에 포함시키지 마세요
   - 민감한 정보는 SSH로만 전송

2. **포트 설정**
   - 80: HTTP (Nginx)
   - 443: HTTPS (Nginx)
   - 3000: Next.js (Docker 내부)

3. **방화벽 규칙**
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw allow 22/tcp
   ```

## 📊 모니터링

### Docker 상태
```bash
docker-compose ps
docker stats
```

### 로그 확인
```bash
# 앱 로그
docker-compose logs app

# Nginx 로그
docker-compose logs nginx
```

### 디스크 공간
```bash
df -h
```

## 🆘 문제 해결

### 컨테이너 재시작
```bash
docker-compose restart
```

### 전체 재배포
```bash
docker-compose down
docker-compose up -d --build
```

### 롤백
```bash
./scripts/deploy.sh rollback
```

---

## 다음 단계

1. GitHub repository 생성 및 코드 push
2. 서버에서 초기 설정 스크립트 실행
3. 환경 변수 설정
4. Docker로 배포
5. 도메인 연결 및 SSL 설정 (선택)