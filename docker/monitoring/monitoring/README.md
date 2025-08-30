# 1001 Stories - 프로덕션 모니터링 및 보안 시스템

## 📋 개요

이 디렉토리는 1001 Stories 프로덕션 환경의 모니터링, 백업, 보안, 배포 자동화를 위한 완전한 인프라스트럭처를 제공합니다.

## 🏗️ 아키텍처 구성

### 모니터링 스택
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Prometheus    │◄───┤  Node Exporter  │    │   BlackBox      │
│   (메트릭 수집)   │    │  (시스템 메트릭)  │    │  (HTTP 프로브)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                        ▲                        ▲
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    Grafana      │    │   Alertmanager  │    │  Uptime Kuma    │
│   (대시보드)      │    │   (알림 관리)    │    │ (업타임 모니터링) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 로그 관리
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    Promtail     │───►│      Loki       │◄───┤    Grafana      │
│   (로그 수집)     │    │   (로그 저장)    │    │  (로그 시각화)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📁 파일 구조

```
monitoring/
├── README.md                          # 이 문서
├── docker-compose.monitoring.yml      # 모니터링 스택 Docker Compose
├── prometheus.yml                     # Prometheus 설정
├── alertmanager.yml                   # Alertmanager 알림 설정
├── prometheus-rules/
│   └── 1001stories.yml               # 알림 규칙 정의
├── health-check.sh                    # 헬스체크 스크립트
├── backup-database.sh                 # 데이터베이스 백업 스크립트
├── deploy-enhanced.sh                 # 향상된 배포 스크립트
└── security-hardening.sh             # 보안 강화 스크립트
```

## 🚀 설치 및 설정

### 1. 모니터링 스택 배포

```bash
# 모니터링 디렉토리로 이동
cd monitoring/

# 환경 변수 설정
cp .env.example .env
# .env 파일을 편집하여 필요한 값들을 설정하세요

# 모니터링 스택 시작
docker-compose -f docker-compose.monitoring.yml up -d

# 서비스 상태 확인
docker-compose -f docker-compose.monitoring.yml ps
```

### 2. 환경 변수 설정

`.env` 파일에 다음 변수들을 설정하세요:

```env
# Grafana 설정
GRAFANA_PASSWORD=your-secure-password

# 이메일 알림 설정
SMTP_HOST=smtp.gmail.com:587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=alerts@1001stories.org

# Slack 알림 (선택사항)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# 데이터베이스 백업 설정
DB_HOST=localhost
DB_PORT=5432
DB_NAME=1001stories
DB_USER=postgres
PGPASSWORD=your-db-password

# AWS S3 백업 (선택사항)
S3_BUCKET=1001stories-backups
```

### 3. 헬스체크 및 백업 자동화

```bash
# 스크립트 실행 권한 부여
chmod +x health-check.sh backup-database.sh

# 수동 테스트
./health-check.sh
./backup-database.sh

# Cron 작업 등록
crontab -e

# 다음 라인들을 추가:
*/5 * * * * /opt/monitoring/health-check.sh >> /var/log/health-check.log 2>&1
0 2 * * * /opt/monitoring/backup-database.sh >> /var/log/backup.log 2>&1
0 3 * * 0 RESTORE_TEST=true /opt/monitoring/backup-database.sh >> /var/log/backup.log 2>&1
```

## 🔒 보안 강화

### 서버 보안 설정

```bash
# 루트 권한으로 실행
sudo ./security-hardening.sh

# 주요 보안 강화 사항:
# - UFW 방화벽 설정
# - Fail2Ban 침입 방지
# - SSH 보안 강화
# - 자동 보안 업데이트
# - 시스템 감사 (auditd)
# - 파일 무결성 모니터링 (AIDE)
# - AppArmor 보안 프로필
# - Docker 보안 설정
```

## 📊 모니터링 대시보드

### 접속 정보
- **Grafana**: `http://your-server:3001`
  - 사용자: `admin`
  - 비밀번호: `.env` 파일의 `GRAFANA_PASSWORD`

- **Prometheus**: `http://your-server:9090`
- **Alertmanager**: `http://your-server:9093`
- **Uptime Kuma**: `http://your-server:3002`

### 주요 메트릭

#### 시스템 메트릭
- CPU 사용률
- 메모리 사용률
- 디스크 사용량
- 네트워크 I/O
- 로드 애버리지

#### 애플리케이션 메트릭
- HTTP 응답 시간
- 에러율
- 처리량 (RPS)
- 데이터베이스 연결 수
- 컨테이너 상태

#### 비즈니스 메트릭
- 사용자 등록 수
- 스토리 업로드 수
- 결제 성공률
- 페이지 뷰

## 🚨 알림 시스템

### 알림 규칙

#### 중요도별 분류
- **Critical**: 즉시 대응 필요 (서비스 다운, 데이터베이스 장애)
- **Warning**: 주의 필요 (높은 리소스 사용량, 느린 응답)
- **Info**: 정보성 알림 (배포 완료, 백업 완료)

#### 알림 채널
- 이메일: 모든 알림
- Slack: 중요 알림 (설정 시)
- SMS: 치명적 알림 (외부 서비스 연동 필요)

### 알림 설정

```yaml
# alertmanager.yml에서 설정
receivers:
  - name: 'critical-alerts'
    email_configs:
      - to: 'admin@1001stories.org'
        subject: '[CRITICAL] 1001 Stories Alert'
```

## 💾 백업 시스템

### 백업 전략

#### 데이터베이스 백업
- **빈도**: 매일 새벽 2시
- **보존 기간**: 30일
- **위치**: 로컬 + S3 (선택사항)
- **압축**: gzip
- **암호화**: 전송 시 SSL/TLS

#### 애플리케이션 백업
- **빈도**: 배포 전 자동
- **보존 기간**: 7일
- **포함 내용**: 코드, 설정, 업로드 파일

#### 복원 절차
```bash
# 데이터베이스 복원
./backup-database.sh --restore backup-20241231_020000.sql.gz

# 애플리케이션 롤백
./deploy-enhanced.sh rollback backup-20241231-020000
```

## 🔄 배포 시스템

### 배포 전략

#### 무중단 배포 (Zero-Downtime)
```bash
# 기본 배포 방식
./deploy-enhanced.sh deploy zero-downtime

# 특징:
# - 서비스 중단 없음
# - Rolling update 방식
# - 자동 헬스체크
# - 실패 시 자동 롤백
```

#### 전통적 배포
```bash
# 전통적 방식 (서비스 중단 발생)
./deploy-enhanced.sh deploy traditional

# 사용 시기:
# - 데이터베이스 마이그레이션
# - 인프라 변경
# - 긴급 보안 패치
```

### 배포 파이프라인

1. **사전 검증**
   - Prerequisites 확인
   - 서버 연결 테스트
   - 디스크 공간 확인

2. **백업**
   - 현재 버전 백업
   - 데이터베이스 백업
   - 업로드 파일 백업

3. **배포**
   - Git 코드 업데이트
   - Docker 이미지 빌드
   - 서비스 업데이트

4. **검증**
   - 헬스체크
   - 주요 엔드포인트 테스트
   - 데이터베이스 연결 확인

5. **알림**
   - 배포 상태 통보
   - 소요 시간 기록
   - 실패 시 알림

## 🛠️ 트러블슈팅

### 일반적인 문제들

#### 1. 서비스 응답 없음
```bash
# 서비스 상태 확인
docker-compose ps

# 로그 확인
docker-compose logs app

# 헬스체크 실행
./health-check.sh
```

#### 2. 높은 리소스 사용률
```bash
# 시스템 리소스 확인
top
df -h
free -h

# Docker 리소스 정리
docker system prune -af
```

#### 3. 데이터베이스 연결 실패
```bash
# PostgreSQL 상태 확인
docker-compose exec postgres pg_isready -U postgres

# 연결 수 확인
docker-compose exec postgres psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"
```

#### 4. SSL 인증서 문제
```bash
# 인증서 만료일 확인
echo | openssl s_client -servername 1001stories.seedsofempowerment.org -connect 1001stories.seedsofempowerment.org:443 2>/dev/null | openssl x509 -noout -dates

# Let's Encrypt 갱신
certbot renew --dry-run
```

### 로그 위치

- **애플리케이션 로그**: `docker-compose logs app`
- **시스템 로그**: `/var/log/syslog`
- **Nginx 로그**: `/var/log/nginx/`
- **PostgreSQL 로그**: `docker-compose logs postgres`
- **보안 로그**: `/var/log/auth.log`, `/var/log/fail2ban.log`
- **감사 로그**: `/var/log/audit/audit.log`

## 📈 성능 최적화

### 데이터베이스 최적화
```sql
-- 인덱스 확인
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch 
FROM pg_stat_user_indexes 
ORDER BY idx_scan ASC;

-- 느린 쿼리 확인
SELECT query, mean_time, calls, total_time 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

### 컨테이너 리소스 제한
```yaml
# docker-compose.yml에 추가
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '1.0'
          memory: 1G
```

## 🔍 보안 모니터링

### 정기 보안 검사

#### Lynis 시스템 감사
```bash
# 전체 시스템 감사
lynis audit system

# 결과 검토
cat /var/log/lynis.log
```

#### 무결성 검사
```bash
# AIDE 파일 무결성 검사
aide --check

# 루트킷 검사
rkhunter --check
chkrootkit
```

#### 로그 분석
```bash
# 실패한 로그인 시도
grep "Failed password" /var/log/auth.log | tail -20

# Fail2Ban 상태
fail2ban-client status sshd
```

## 📞 지원 및 연락처

### 긴급 상황 대응
1. **서비스 다운**: 즉시 `./deploy-enhanced.sh rollback` 실행
2. **보안 침해 의심**: 서버 격리 후 보안팀 연락
3. **데이터 손실**: 최신 백업에서 복원

### 연락처
- **개발팀**: dev@1001stories.org
- **운영팀**: ops@1001stories.org
- **보안팀**: security@1001stories.org
- **긴급 상황**: +82-XXX-XXXX-XXXX

### 문서 및 자료
- **내부 위키**: https://wiki.1001stories.org
- **Runbook**: https://docs.1001stories.org/runbooks/
- **API 문서**: https://docs.1001stories.org/api/

---

## 📝 변경 로그

### v1.0.0 (2025-08-30)
- 초기 모니터링 시스템 구축
- 헬스체크 및 백업 자동화
- 보안 강화 스크립트 추가
- 무중단 배포 시스템 구현

---

*이 문서는 1001 Stories 프로덕션 환경의 안정성과 보안을 위해 지속적으로 업데이트됩니다.*