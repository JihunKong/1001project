# ESL 학습 플랫폼 구현 계획

## 🎯 프로젝트 목표
1001 Stories를 위한 포괄적인 ESL 학습 플랫폼 구축

## 📊 현재 상태 분석
- **문제점**: 앱이 점점 복잡해지고 체계가 없어짐
- **요구사항**: 실제 교사-학생 상호작용, 게이미피케이션, AI 기반 학습

## 🏗️ 아키텍처 설계

### 핵심 도메인
```
├── 학습 도메인 (Learning)
│   ├── 텍스트 학습 (적응형 난이도)
│   ├── 어휘 학습 시스템
│   └── 진도 추적
├── 평가 도메인 (Assessment)
│   ├── 퀴즈 시스템
│   └── 학습 분석
├── 소셜 도메인 (Social)
│   ├── 북클럽
│   └── 토론 기능
└── 게이미피케이션 (Gamification)
    ├── XP & 레벨
    ├── 업적 시스템
    └── 리더보드
```

## 🚀 구현 단계

### Phase 1: MVP 핵심 기능 (1-2주)
- [x] 데이터베이스 스키마 설계
- [ ] 학습 진도 추적 API
- [ ] 어휘 학습 시스템
- [ ] 기본 읽기 인터페이스 개선

### Phase 2: AI 통합 (3-4주)
- [ ] AI 튜터 개선 (캐싱 추가)
- [ ] 텍스트 난이도 조정
- [ ] 발음 도우미
- [ ] 문법 설명 기능

### Phase 3: 평가 시스템 (5-6주)
- [ ] 퀴즈 생성 도구
- [ ] 자동 채점 시스템
- [ ] 학습 분석 대시보드
- [ ] 진도 리포트

### Phase 4: 소셜 학습 (7-8주)
- [ ] 북클럽 생성/관리
- [ ] 토론 스레드
- [ ] 교사-학생 메시징
- [ ] 협업 주석

### Phase 5: 게이미피케이션 (9-10주)
- [ ] XP & 레벨 시스템
- [ ] 업적 배지
- [ ] 리더보드
- [ ] 일일 도전 과제

## 📱 UI/UX 설계 원칙

### 모바일 우선 디자인
```css
/* 기본: 모바일 */
.reading-interface { 
  display: flex; 
  flex-direction: column; 
}

/* 태블릿 이상 */
@media (min-width: 768px) {
  .reading-interface { 
    flex-direction: row; 
  }
}
```

### 점진적 기능 공개
- 기본 모드: 텍스트 읽기만
- 학습 모드: 어휘, AI 튜터
- 고급 모드: 모든 기능

## 🛡️ 보안 고려사항
1. API 키 환경변수 이동
2. Rate limiting 구현
3. 입력 검증 강화
4. PDF 접근 권한 검사

## 📊 KPI 목표

### 3개월 목표
- 활성 사용자: 500명
- 완독률: 70%
- 사용자 만족도: 4.0+

### 6개월 목표
- 활성 사용자: 2,500명
- 월간 활성률: 65%
- AI 튜터 사용률: 25%

### 12개월 목표
- 활성 사용자: 10,000명
- 5개국 진출
- CEFR 레벨 향상: 50%

## 🔧 기술 스택

### 현재 사용 중
- Next.js 15.4.6
- React 19
- PostgreSQL + Prisma
- OpenAI API
- Docker

### 추가 예정
- Redis (캐싱)
- Socket.io (실시간)
- Bull (작업 큐)
- Sentry (모니터링)

## 📝 데이터베이스 마이그레이션

### 새로운 테이블 (11개)
1. LearningProgress - 학습 진도
2. Vocabulary - 어휘 학습
3. Quiz - 퀴즈 정의
4. QuizAttempt - 퀴즈 시도
5. BookClub - 북클럽
6. BookClubMember - 클럽 멤버
7. BookClubPost - 클럽 게시글
8. Achievement - 업적 정의
9. UserAchievement - 사용자 업적
10. UserStats - 사용자 통계
11. ReadingSession - 읽기 세션

## 🎮 게이미피케이션 시스템

### XP 획득 방식
- 페이지 읽기: 10 XP
- 단어 학습: 5 XP
- 퀴즈 통과: 50 XP
- 토론 참여: 20 XP

### 레벨 시스템
```
Level 1 (씨앗): 0-500 XP
Level 2 (새싹): 501-1500 XP
Level 3 (나무): 1501-3000 XP
Level 4 (숲): 3001-5000 XP
Level 5 (정원): 5000+ XP
```

### 업적 예시
- 📚 독서왕: 10권 완독
- 💬 토론 리더: 50개 댓글
- 🔥 연속 학습: 7일 스트릭
- 🎯 퀴즈 마스터: 10개 만점

## 🚢 배포 전략

### 로컬 개발
```bash
# Docker 환경 실행
docker-compose -f docker-compose.dev.yml up

# 데이터베이스 마이그레이션
npm run db:migrate

# 개발 서버 시작
npm run dev
```

### 프로덕션 배포
```bash
# Docker 이미지 빌드
docker build -t 1001stories-esl .

# EC2 배포 (추후)
./scripts/deploy-ec2.sh
```

## 📋 체크리스트

### 즉시 해결 (P0)
- [ ] OpenAI API 키 환경변수 이동
- [ ] CSP 헤더 수정
- [ ] TTS 음성 품질 개선

### 다음 스프린트 (P1)
- [ ] PDF 뷰어 접근성 개선
- [ ] Redis 캐싱 구현
- [ ] 백그라운드 작업 큐

### 향후 계획 (P2)
- [ ] 오프라인 모드
- [ ] 모바일 앱
- [ ] 다국어 지원 확대

## 📞 지원 및 리소스
- GitHub Issues: 버그 및 기능 요청
- Discord: 실시간 커뮤니케이션
- Wiki: 개발 문서

---

*마지막 업데이트: 2025-09-07*