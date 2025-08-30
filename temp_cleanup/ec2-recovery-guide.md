# EC2 Database Recovery Guide - 1001 Stories

## 현재 상황 요약
- **서버**: AWS EC2 인스턴스 (3.128.143.122)
- **상태**: 웹사이트 정상, API 500 에러 (DB 인증 실패)
- **접근**: SSH publickey 인증 필요

## 🚨 즉시 실행 가능한 복구 방법 (SSH 키 불필요)

### 1. AWS Console - Session Manager 접근

#### 1-1. AWS Console 로그인
```
1. AWS Console (console.aws.amazon.com) 로그인
2. EC2 서비스로 이동
3. 인스턴스 검색: 3.128.143.122 또는 1001-stories
4. 인스턴스 선택 후 "연결" 버튼 클릭
```

#### 1-2. Session Manager 연결
```
연결 방법: "Session Manager" 탭 선택
- 브라우저에서 직접 터미널 접근
- SSH 키 불필요
- IAM 권한만 있으면 즉시 접근
```

**Session Manager 연결 후 실행 명령:**
```bash
# 루트 권한으로 전환
sudo su -

# Docker 컨테이너 상태 확인
docker ps -a

# 데이터베이스 컨테이너 로그 확인
docker logs 1001-stories-postgres-1

# 앱 컨테이너 로그 확인  
docker logs 1001-stories-app-1

# 컨테이너 재시작
docker-compose restart postgres
docker-compose restart app
```

### 2. EC2 Instance Connect (브라우저 SSH)

#### 2-1. Instance Connect 설정
```
1. EC2 Console → 인스턴스 선택
2. "연결" → "EC2 Instance Connect" 탭
3. 사용자명: ubuntu (기본값)
4. "연결" 클릭하여 브라우저에서 SSH 터미널 열기
```

#### 2-2. 임시 SSH 키 생성 (필요시)
```bash
# AWS CLI에서 임시 SSH 키 푸시
aws ec2-instance-connect send-ssh-public-key \
    --region us-east-2 \
    --instance-id i-1234567890abcdef0 \
    --instance-os-user ubuntu \
    --ssh-public-key file://~/.ssh/id_rsa.pub
```

### 3. CloudWatch 원격 진단

#### 3-1. CloudWatch Logs 확인
```
1. AWS Console → CloudWatch → 로그 그룹
2. /aws/ec2/1001-stories 로그 그룹 확인
3. 최근 에러 로그 검색:
   - "database"
   - "connection"
   - "authentication"
   - "password"
```

#### 3-2. CloudWatch 대시보드 생성
```json
{
  "widgets": [
    {
      "type": "log",
      "properties": {
        "query": "SOURCE '/var/log/docker' | fields @timestamp, @message\n| filter @message like /database|connection|error/\n| sort @timestamp desc\n| limit 100",
        "region": "us-east-2",
        "title": "Database Connection Errors"
      }
    }
  ]
}
```

## 🔧 데이터베이스 연결 문제 해결

### 1. PostgreSQL 인증 문제 해결

#### 1-1. 환경변수 확인
```bash
# 컨테이너 내부 환경변수 확인
docker exec -it 1001-stories-app-1 env | grep DATABASE
docker exec -it 1001-stories-postgres-1 env | grep POSTGRES

# .env 파일 확인
docker exec -it 1001-stories-app-1 cat .env
```

#### 1-2. PostgreSQL 연결 테스트
```bash
# PostgreSQL 컨테이너 내부 접근
docker exec -it 1001-stories-postgres-1 bash

# psql 연결 테스트
psql -h localhost -U postgres -d 1001stories

# 사용자 및 권한 확인
\du
\l
```

#### 1-3. 데이터베이스 인증 설정 수정
```bash
# pg_hba.conf 확인 및 수정
docker exec -it 1001-stories-postgres-1 cat /var/lib/postgresql/data/pg_hba.conf

# trust 인증으로 임시 변경 (보안 주의)
echo "host all all 0.0.0.0/0 trust" >> /var/lib/postgresql/data/pg_hba.conf

# PostgreSQL 재시작
docker-compose restart postgres
```

### 2. Docker Compose 전체 재시작

```bash
# 현재 디렉토리로 이동
cd /home/ubuntu/1001-stories

# 컨테이너 중지
docker-compose down

# 이미지 재빌드 (필요시)
docker-compose build --no-cache

# 서비스 재시작
docker-compose up -d

# 상태 확인
docker-compose ps
docker-compose logs -f
```

### 3. 환경변수 재설정

```bash
# .env.production 파일 확인
cat .env.production

# DATABASE_URL 형식 검증
# postgresql://username:password@host:port/database
# 예: postgresql://postgres:password123@postgres:5432/1001stories

# 환경변수 다시 로드
docker-compose down
docker-compose up -d
```

## 🔄 EC2 인스턴스 관리

### 1. 인스턴스 재부팅 (마지막 수단)

#### 1-1. AWS Console에서 재부팅
```
1. EC2 Console → 인스턴스 선택
2. "인스턴스 상태" → "인스턴스 재부팅"
3. 확인 후 재부팅 실행
```

#### 1-2. 재부팅 후 자동 복구 확인
```bash
# SSH/Session Manager로 다시 접속 후
sudo systemctl status docker
docker-compose ps

# 자동 시작 안 된 경우 수동 시작
cd /home/ubuntu/1001-stories
docker-compose up -d
```

### 2. 인스턴스 백업 및 복구

#### 2-1. EBS 스냅샷 생성
```
1. EC2 Console → 볼륨 → 인스턴스 볼륨 선택
2. "작업" → "스냅샷 생성"
3. 설명: "1001-stories-recovery-backup-$(date)"
```

#### 2-2. AMI 이미지 생성
```
1. EC2 Console → 인스턴스 선택
2. "작업" → "이미지 및 템플릿" → "이미지 생성"
3. 이름: "1001-stories-working-state"
```

## 🔍 실시간 모니터링 설정

### 1. CloudWatch Agent 설치 (필요시)

```bash
# CloudWatch Agent 다운로드
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm

# 설치
sudo rpm -U ./amazon-cloudwatch-agent.rpm

# 설정 파일 생성
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-config-wizard
```

### 2. Docker 컨테이너 헬스체크

```bash
# healthcheck 추가된 docker-compose.yml 적용
docker-compose down
docker-compose up -d

# 헬스체크 상태 확인
docker ps
curl http://localhost:3000/api/health
```

## ⚠️ 보안 고려사항

### 1. Session Manager IAM 권한
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::ACCOUNT:user/USERNAME"
      },
      "Action": [
        "ssm:StartSession",
        "ssm:SendCommand"
      ],
      "Resource": "arn:aws:ec2:region:account:instance/i-INSTANCEID"
    }
  ]
}
```

### 2. 데이터베이스 보안 강화
```bash
# PostgreSQL 사용자 비밀번호 변경
docker exec -it 1001-stories-postgres-1 psql -U postgres
ALTER USER postgres PASSWORD 'new_secure_password';

# .env 파일 업데이트
sed -i 's/old_password/new_secure_password/g' .env.production
```

## 📋 체크리스트

- [ ] AWS Console Session Manager 접근 테스트
- [ ] 데이터베이스 컨테이너 로그 확인
- [ ] PostgreSQL 연결 테스트
- [ ] 환경변수 검증
- [ ] Docker 서비스 재시작
- [ ] API 엔드포인트 테스트
- [ ] CloudWatch 모니터링 설정
- [ ] 백업 스냅샷 생성

## 🆘 긴급 연락처

- **AWS Support**: 콘솔에서 케이스 생성
- **CloudWatch 대시보드**: 실시간 모니터링
- **백업 AMI**: 최악의 경우 새 인스턴스로 복구

---

이 가이드는 SSH 키 없이도 AWS 네이티브 도구를 활용하여 즉시 문제를 진단하고 해결할 수 있도록 설계되었습니다.