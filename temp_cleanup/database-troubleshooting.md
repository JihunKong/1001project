# Database Connection Troubleshooting - EC2 Environment

## 🎯 즉시 실행 가능한 해결책 (우선순위별)

### 1단계: AWS Console Session Manager 접근

```bash
# AWS Console → EC2 → 인스턴스 선택 → 연결 → Session Manager
# 브라우저에서 터미널이 열리면 다음 명령 실행:

sudo su -
cd /home/ubuntu/1001-stories
```

### 2단계: 빠른 진단 및 복구

```bash
# 1. 컨테이너 상태 확인
docker ps -a

# 2. 데이터베이스 로그 확인 (에러 확인)
docker logs 1001-stories-postgres-1 --tail 50

# 3. 앱 로그 확인 (연결 에러 확인)  
docker logs 1001-stories-app-1 --tail 50

# 4. 즉시 재시작 시도
docker-compose restart postgres
sleep 10
docker-compose restart app

# 5. 30초 대기 후 테스트
sleep 30
curl http://localhost:3000/api/health
```

### 3단계: 환경변수 검증 및 수정

```bash
# 1. 현재 환경변수 확인 (비밀번호 마스킹)
docker exec 1001-stories-app-1 env | grep -E "DATABASE|POSTGRES" | sed 's/password[^=]*=[^@]*@/password=***@/gi'

# 2. .env.production 파일 직접 확인
cat .env.production

# 3. PostgreSQL 컨테이너 환경변수 확인
docker exec 1001-stories-postgres-1 env | grep POSTGRES

# 4. 데이터베이스 연결 문자열 형식 확인
# 올바른 형식: postgresql://postgres:password@postgres:5432/1001stories
```

## 🔧 일반적인 데이터베이스 연결 문제 및 해결책

### 문제 1: "authentication failed for user postgres"

**원인**: 비밀번호 불일치 또는 사용자 권한 문제

**해결책**:
```bash
# PostgreSQL 컨테이너 내부 접근
docker exec -it 1001-stories-postgres-1 bash

# 비밀번호 없이 로컬 연결 테스트
psql -h localhost -U postgres

# 사용자 목록 및 권한 확인
\du

# 데이터베이스 목록 확인  
\l

# 비밀번호 재설정 (필요시)
ALTER USER postgres PASSWORD 'new_password';

# 종료
\q
exit

# .env.production 파일 업데이트
nano .env.production
# DATABASE_URL="postgresql://postgres:new_password@postgres:5432/1001stories"

# 컨테이너 재시작
docker-compose down
docker-compose up -d
```

### 문제 2: "database does not exist"

**해결책**:
```bash
# PostgreSQL 접속
docker exec -it 1001-stories-postgres-1 psql -U postgres

# 데이터베이스 생성
CREATE DATABASE "1001stories";

# 권한 부여
GRANT ALL PRIVILEGES ON DATABASE "1001stories" TO postgres;

# 종료
\q

# Prisma 마이그레이션 실행
docker exec -it 1001-stories-app-1 npx prisma migrate deploy
```

### 문제 3: "connection refused" 또는 "could not connect"

**해결책**:
```bash
# Docker 네트워크 확인
docker network ls | grep 1001-stories

# 컨테이너 간 네트워크 연결 테스트
docker exec -it 1001-stories-app-1 ping postgres

# PostgreSQL 서비스 상태 확인
docker exec -it 1001-stories-postgres-1 pg_isready -h localhost -U postgres

# 포트 바인딩 확인
docker port 1001-stories-postgres-1

# 전체 Docker Compose 재시작
docker-compose down
docker-compose up -d --force-recreate
```

### 문제 4: "too many connections"

**해결책**:
```bash
# 현재 연결 수 확인
docker exec -it 1001-stories-postgres-1 psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"

# 최대 연결 수 확인
docker exec -it 1001-stories-postgres-1 psql -U postgres -c "SHOW max_connections;"

# 유휴 연결 종료
docker exec -it 1001-stories-postgres-1 psql -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND query_start < now() - interval '5 minutes';"

# PostgreSQL 재시작
docker-compose restart postgres
```

## 🔍 고급 진단 도구

### PostgreSQL 성능 모니터링

```bash
# 현재 활성 연결 및 쿼리 확인
docker exec -it 1001-stories-postgres-1 psql -U postgres -c "
SELECT 
    pid,
    usename,
    application_name,
    client_addr,
    state,
    query_start,
    query
FROM pg_stat_activity 
WHERE state != 'idle'
ORDER BY query_start;"

# 데이터베이스 크기 확인
docker exec -it 1001-stories-postgres-1 psql -U postgres -c "
SELECT 
    datname,
    pg_size_pretty(pg_database_size(datname)) as size
FROM pg_database 
WHERE datname = '1001stories';"

# 테이블별 크기 확인
docker exec -it 1001-stories-postgres-1 psql -U postgres -d 1001stories -c "
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"
```

### Docker 컨테이너 리소스 사용량

```bash
# 실시간 리소스 모니터링
docker stats 1001-stories-app-1 1001-stories-postgres-1 --no-stream

# 컨테이너 상세 정보
docker inspect 1001-stories-postgres-1 | jq '.[0].State'

# 컨테이너 파일시스템 사용량
docker exec -it 1001-stories-postgres-1 df -h

# PostgreSQL 데이터 디렉토리 크기
docker exec -it 1001-stories-postgres-1 du -sh /var/lib/postgresql/data/
```

## 🚨 Emergency Recovery Scripts

### 자동 진단 스크립트 (EC2에서 실행)

```bash
#!/bin/bash
# /home/ubuntu/diagnose-db-comprehensive.sh

echo "🔍 종합 데이터베이스 진단 시작..."

# 1. 시스템 리소스 확인
echo "📊 시스템 리소스:"
free -h
df -h | grep -E "/$|/var"

# 2. Docker 상태
echo -e "\n🐳 Docker 상태:"
systemctl status docker --no-pager -l
docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 3. PostgreSQL 연결 테스트
echo -e "\n🔌 PostgreSQL 연결 테스트:"
if docker exec -it 1001-stories-postgres-1 pg_isready -h localhost -U postgres; then
    echo "✅ PostgreSQL 서버 응답 정상"
    
    # 데이터베이스 목록
    echo -e "\n📊 데이터베이스 목록:"
    docker exec -it 1001-stories-postgres-1 psql -U postgres -lqt | cut -d \| -f 1 | grep -v "^$" | head -10
    
    # 연결 수 확인
    echo -e "\n👥 현재 연결 수:"
    docker exec -it 1001-stories-postgres-1 psql -U postgres -c "SELECT count(*) as connections FROM pg_stat_activity;" -t
    
    # 데이터베이스 크기
    echo -e "\n💽 데이터베이스 크기:"
    docker exec -it 1001-stories-postgres-1 psql -U postgres -c "SELECT datname, pg_size_pretty(pg_database_size(datname)) FROM pg_database WHERE datname='1001stories';" -t
else
    echo "❌ PostgreSQL 서버 응답 없음"
fi

# 4. 앱 연결 테스트
echo -e "\n🌐 앱 서버 테스트:"
if curl -f --connect-timeout 10 http://localhost:3000/api/health; then
    echo -e "\n✅ 앱 서버 헬스체크 성공"
else
    echo -e "\n❌ 앱 서버 헬스체크 실패"
fi

# 5. 최근 에러 로그
echo -e "\n📝 최근 PostgreSQL 에러 (최근 20줄):"
docker logs 1001-stories-postgres-1 --tail 20 2>&1 | grep -i error || echo "에러 없음"

echo -e "\n📝 최근 앱 에러 (최근 20줄):"
docker logs 1001-stories-app-1 --tail 20 2>&1 | grep -i -E "error|fail|exception" || echo "에러 없음"

# 6. 환경변수 확인 (민감한 정보 마스킹)
echo -e "\n🔧 환경변수 확인:"
docker exec 1001-stories-app-1 env | grep -E "DATABASE|POSTGRES|NODE_ENV" | sed 's/password[^=]*=[^@]*@/password=***@/gi'

# 7. 네트워크 연결 테스트
echo -e "\n🌐 네트워크 테스트:"
docker exec -it 1001-stories-app-1 ping -c 3 postgres 2>/dev/null && echo "✅ 네트워크 연결 정상" || echo "❌ 네트워크 연결 실패"

echo -e "\n✅ 진단 완료"
```

### 자동 복구 스크립트 (EC2에서 실행)

```bash
#!/bin/bash
# /home/ubuntu/auto-fix-db.sh

echo "🚨 자동 데이터베이스 복구 시작..."

cd /home/ubuntu/1001-stories

# 1. 현재 상태 백업
echo "📦 현재 상태 백업..."
cp .env.production .env.production.backup.$(date +%Y%m%d_%H%M%S)

# 2. 컨테이너 중지
echo "🛑 컨테이너 중지 중..."
docker-compose down || true

# 3. 네트워크 정리
echo "🧹 네트워크 정리..."
docker network prune -f

# 4. PostgreSQL 볼륨 권한 수정
echo "🔧 PostgreSQL 볼륨 권한 수정..."
sudo chown -R 999:999 ./postgres-data/ 2>/dev/null || true

# 5. 환경변수 검증 및 수정
echo "✅ 환경변수 검증..."
if ! grep -q "DATABASE_URL.*postgresql://" .env.production; then
    echo "⚠️ DATABASE_URL 형식 오류 - 기본값으로 복구"
    sed -i 's/^DATABASE_URL=.*/DATABASE_URL="postgresql:\/\/postgres:postgres@postgres:5432\/1001stories"/' .env.production
fi

# 6. Docker 이미지 갱신
echo "🔄 Docker 이미지 갱신..."
docker-compose pull

# 7. 서비스 재시작 (단계별)
echo "🚀 PostgreSQL 먼저 시작..."
docker-compose up -d postgres

# PostgreSQL 준비 대기
echo "⏳ PostgreSQL 시작 대기 (30초)..."
sleep 30

# PostgreSQL 준비 상태 확인
for i in {1..30}; do
    if docker exec 1001-stories-postgres-1 pg_isready -h localhost -U postgres 2>/dev/null; then
        echo "✅ PostgreSQL 준비 완료"
        break
    fi
    echo "⏳ PostgreSQL 대기 중... ($i/30)"
    sleep 2
done

# 8. 앱 서버 시작
echo "🚀 앱 서버 시작..."
docker-compose up -d app

# 9. 앱 서버 준비 대기
echo "⏳ 앱 서버 시작 대기 (60초)..."
sleep 60

# 10. 헬스체크
echo "🏥 헬스체크 수행..."
for i in {1..10}; do
    if curl -f --connect-timeout 5 http://localhost:3000/api/health 2>/dev/null; then
        echo "✅ 서비스 정상화 완료!"
        break
    elif [ $i -eq 10 ]; then
        echo "❌ 헬스체크 실패 - 수동 개입 필요"
        exit 1
    else
        echo "⏳ 헬스체크 대기... ($i/10)"
        sleep 10
    fi
done

# 11. 최종 상태 확인
echo -e "\n📋 최종 상태:"
docker-compose ps
echo -e "\n🔌 데이터베이스 연결:"
docker exec 1001-stories-postgres-1 pg_isready -h localhost -U postgres && echo "✅ 정상" || echo "❌ 실패"

echo -e "\n🎉 자동 복구 완료!"
echo "로그 확인: docker-compose logs -f"
```

## 📋 문제 해결 체크리스트

### 즉시 확인사항
- [ ] AWS Console Session Manager로 접속 가능
- [ ] Docker 서비스 상태 (running/exited)
- [ ] PostgreSQL 컨테이너 로그에 에러 메시지
- [ ] 환경변수 DATABASE_URL 형식 검증
- [ ] 디스크 용량 충분 (최소 1GB 여유)
- [ ] 메모리 사용량 (80% 미만)

### 단계별 복구 절차
1. **즉시 재시작**: `docker-compose restart postgres && docker-compose restart app`
2. **환경변수 수정**: DATABASE_URL 형식 및 비밀번호 확인
3. **전체 재시작**: `docker-compose down && docker-compose up -d`
4. **볼륨 재생성**: 데이터 손실 각오하고 볼륨 삭제 후 재생성
5. **EC2 재부팅**: 최후 수단으로 인스턴스 재부팅

### 예방 조치
- [ ] 정기 백업 자동화 (스냅샷)
- [ ] 모니터링 알람 설정
- [ ] 로그 로테이션 설정
- [ ] 리소스 사용량 모니터링
- [ ] 정기 헬스체크 자동화

---

이 문서의 모든 명령은 EC2 Session Manager에서 즉시 실행 가능하며, SSH 키 없이도 복구할 수 있도록 설계되었습니다.