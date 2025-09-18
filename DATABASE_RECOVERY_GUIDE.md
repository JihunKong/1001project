# 1001 Stories Database Recovery Guide

## 즉시 실행 가능한 해결책

현재 상황: 서버는 정상이지만 외부 접근이 불가능한 상태입니다. DNS는 정상이지만 HTTP/HTTPS 연결이 실패하고 있습니다.

### 🚨 즉시 실행할 수 있는 방법들

#### 1. AWS Lightsail 웹 콘솔을 통한 복구 (권장)

**단계 1: AWS Lightsail 콘솔 접근**
```
1. AWS 콘솔 로그인 → Lightsail 서비스로 이동
2. 인스턴스 선택 → "Connect using SSH" 클릭
3. 브라우저 기반 SSH 터미널이 열림
```

**단계 2: 즉시 실행할 명령어들**
```bash
# 1. 프로젝트 디렉토리로 이동
cd /home/ubuntu/1001-stories

# 2. 현재 상태 확인
docker ps -a
docker-compose ps

# 3. 모든 서비스 재시작 (가장 안전한 첫 번째 시도)
docker-compose restart

# 4. 30초 대기 후 상태 확인
sleep 30
docker ps

# 5. 헬스 체크
curl -f http://localhost/health

# 6. 만약 여전히 실패한다면, 완전 재시작
docker-compose down
docker-compose up -d

# 7. 서비스 안정화 대기
sleep 60

# 8. 최종 확인
curl -f http://localhost/health
docker ps
```

#### 2. 로컬에서 실행 가능한 복구 스크립트

**실행 방법:**
```bash
# SSH 접근 시도 및 복구
./scripts/remote-recovery.sh full

# PostgreSQL 전용 복구
./scripts/postgres-recovery.sh recover

# 지속적인 모니터링 시작
./scripts/health-monitor.sh monitor
```

#### 3. AWS CLI를 통한 인스턴스 재부팅 (최후 수단)

```bash
# 인스턴스 상태 확인
aws lightsail get-instance --instance-name YOUR_INSTANCE_NAME

# 인스턴스 재부팅
aws lightsail reboot-instance --instance-name YOUR_INSTANCE_NAME

# 재부팅 후 3-5분 대기 후 상태 확인
```

### 🔍 진단 및 모니터링

#### 현재 문제 분석
- ✅ DNS 해상도: 정상 (3.128.143.122로 올바르게 해결됨)
- ❌ HTTP/HTTPS 연결: 실패 (방화벽 또는 nginx 문제 가능성)
- ❌ 서버 핑: 실패 (ICMP가 차단되었거나 서버 다운)

#### 가능한 원인들
1. **Docker 컨테이너 다운**: nginx 또는 앱 컨테이너가 중지됨
2. **방화벽 문제**: UFW 설정이 변경되어 HTTP/HTTPS 트래픽 차단
3. **nginx 설정 오류**: 설정 파일 문제로 nginx 시작 실패
4. **PostgreSQL 연결 문제**: DB 연결 실패로 앱 컨테이너 크래시
5. **디스크 공간 부족**: 로그나 데이터로 인한 디스크 풀

### 📋 AWS Lightsail 웹 콘솔 단계별 가이드

#### Phase 1: 초기 진단
```bash
# 시스템 상태 확인
sudo systemctl status docker
df -h
free -h
ps aux | grep -E "(nginx|postgres|node)"

# Docker 상태 확인
docker system df
docker volume ls
docker network ls
```

#### Phase 2: 서비스 복구
```bash
# 프로젝트 디렉토리로 이동
cd /home/ubuntu/1001-stories

# 현재 컨테이너 상태
docker-compose ps
docker-compose logs --tail=20

# 단계적 재시작
docker-compose stop
docker-compose rm -f
docker-compose up -d postgres
sleep 15
docker-compose up -d app
sleep 10  
docker-compose up -d nginx

# 방화벽 확인 및 재설정
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload
```

#### Phase 3: 데이터베이스 특별 복구
```bash
# PostgreSQL 컨테이너만 따로 확인
docker exec 1001-stories-db pg_isready -U stories_user -d stories_db

# 만약 DB 연결 실패시
docker-compose stop postgres
docker volume ls | grep postgres
docker-compose up -d postgres
sleep 30

# DB 연결 테스트
docker exec 1001-stories-db psql -U stories_user -d stories_db -c "SELECT 1;"
```

#### Phase 4: 최종 검증
```bash
# 모든 서비스 확인
docker ps
curl -f http://localhost/health
curl -f http://localhost/demo

# 외부 접근 테스트
curl -f http://$(curl -s ifconfig.me)/health

# 로그 확인
docker-compose logs nginx | tail -10
docker-compose logs app | tail -10
docker-compose logs postgres | tail -10
```

### 🚀 자동화된 복구 스크립트 사용법

프로젝트에 포함된 스크립트들:

#### 1. 원격 복구 스크립트
```bash
./scripts/remote-recovery.sh full    # 전체 복구 프로세스
./scripts/remote-recovery.sh diagnose # 진단만
./scripts/remote-recovery.sh commands # Lightsail 명령어 생성
```

#### 2. PostgreSQL 전용 복구
```bash
./scripts/postgres-recovery.sh diagnose    # 안전한 진단
./scripts/postgres-recovery.sh recover     # 전체 복구
./scripts/postgres-recovery.sh reset-auth  # 인증 재설정
```

#### 3. 헬스 모니터링
```bash
./scripts/health-monitor.sh status    # 빠른 상태 체크
./scripts/health-monitor.sh detailed  # 상세 진단
./scripts/health-monitor.sh monitor   # 지속적 모니터링
```

### 📞 복구 진행 상황 추적

#### 실시간 로그 모니터링
```bash
# 컨테이너 상태 실시간 확인
watch -n 2 'docker ps && echo "=== Health ===" && curl -s http://localhost/health || echo "FAILED"'

# 모든 로그 실시간 모니터링
docker-compose logs -f

# 특정 서비스 로그만
docker-compose logs -f postgres
docker-compose logs -f app  
docker-compose logs -f nginx
```

#### 복구 성공 확인 체크리스트
- [ ] `docker ps` - 모든 컨테이너가 "Up" 상태
- [ ] `curl http://localhost/health` - 200 응답
- [ ] `curl http://localhost/demo` - 데모 페이지 접근 가능
- [ ] PostgreSQL 연결 테스트 성공
- [ ] 외부에서 웹사이트 접근 가능

### ⚠️ 주의사항

1. **데이터 백업**: 복구 전에 현재 데이터 백업 권장
   ```bash
   docker run --rm -v 1001-stories_postgres_data:/source -v $(pwd)/backups:/backup alpine tar czf /backup/emergency-backup-$(date +%Y%m%d-%H%M%S).tar.gz -C /source .
   ```

2. **환경 변수 확인**: `.env.production` 파일이 올바른지 확인

3. **로그 보존**: 문제 분석을 위해 복구 전 로그 저장
   ```bash
   docker-compose logs > recovery-logs-$(date +%Y%m%d-%H%M%S).log
   ```

### 🆘 긴급 연락처 및 에스컬레이션

복구가 실패할 경우:
1. 모든 로그를 수집하여 보관
2. 데이터베이스 백업 상태 확인
3. AWS Lightsail 지원팀에 문의
4. 최악의 경우 새 인스턴스로 복구

이 가이드의 스크립트들은 모두 `/Users/jihunkong/1001project/1001-stories/scripts/` 디렉토리에 준비되어 있으며, 즉시 실행 가능합니다.