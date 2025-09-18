# 1001 Stories 서브시스템별 ERD

전체 80개 모델을 6개 주요 서브시스템으로 분리했습니다.

## 📂 서브시스템 구조

### 1. 🔐 **사용자 인증 (user-auth.dbml)**
- **모델 수**: 8개
- **주요 엔티티**: User, Account, Session, Profile, Subscription
- **특징**: GDPR 규정 준수, 다중 인증 방식 지원
- **파일 크기**: 7.9KB

### 2. 📚 **교육 시스템 (education.dbml)**
- **모델 수**: 10개
- **주요 엔티티**: School, Class, Assignment, ClassEnrollment
- **특징**: 학교-수업-과제 계층 구조
- **파일 크기**: 6.9KB

### 3. 📖 **콘텐츠 라이브러리 (content-library.dbml)**
- **모델 수**: 12개
- **주요 엔티티**: Story, Book, Chapter, Translation
- **특징**: 다국어 지원, PDF 관리, 읽기 진도 추적
- **파일 크기**: 12.8KB (가장 큼)

### 4. 🛒 **이커머스 (ecommerce.dbml)**
- **모델 수**: 10개
- **주요 엔티티**: Product, Cart, Order, Payment
- **특징**: 변형 상품, 재고 관리, 주문 처리
- **파일 크기**: 9.1KB

### 5. 🤝 **봉사활동 (volunteer.dbml)**
- **모델 수**: 15개 (가장 복잡)
- **주요 엔티티**: VolunteerProfile, Quest, VolunteerPoints
- **특징**: 퀘스트 시스템, 포인트/보상, 멘토링
- **파일 크기**: 15.3KB (가장 큼)

### 6. 💝 **기부 시스템 (donation.dbml)**
- **모델 수**: 4개 (가장 단순)
- **주요 엔티티**: Donation, RecurringDonation, DonationCampaign
- **특징**: 정기 기부, 캠페인 관리
- **파일 크기**: 3.2KB

## 🔍 ERD 보는 방법

### 방법 1: dbdiagram.io에서 개별 보기 (추천)
1. https://dbdiagram.io/d 접속
2. "Import" → "From DBML" 선택
3. 원하는 서브시스템 DBML 파일 내용 복사/붙여넣기
4. 인터랙티브하게 탐색

### 방법 2: PlantUML로 SVG 생성
```bash
# PlantUML 설치 (Mac)
brew install plantuml

# DBML을 PlantUML로 변환 후 SVG 생성
cat user-auth.dbml | dbml2plantuml | plantuml -tsvg
```

### 방법 3: VS Code Extension 사용
- "DBML Language Support" extension 설치
- DBML 파일 열면 자동으로 다이어그램 미리보기

## 📊 서브시스템 간 관계

```
┌─────────────┐
│  User-Auth  │ ◄── 중심 (모든 시스템과 연결)
└─────────────┘
       │
       ├──► Education (User → ClassEnrollment)
       ├──► Content (User → ReadingProgress)
       ├──► E-Commerce (User → Order)
       ├──► Volunteer (User → VolunteerProfile)
       └──► Donation (User → Donation)
```

## 💡 활용 팁

### 개발팀별 사용
- **프론트엔드팀**: user-auth.dbml + 해당 기능 dbml
- **백엔드팀**: 전체 구조 이해 필요
- **데이터팀**: 모든 서브시스템 분석

### 문서화 용도
- **이해관계자 설명**: 개별 서브시스템 다이어그램 사용
- **기술 문서**: 전체 구조 + 상세 서브시스템
- **온보딩**: 단계별로 서브시스템 학습

## 🛠️ 커스텀 ERD 생성

특정 기능만 포함된 ERD가 필요한 경우:

```sql
-- 예: 사용자와 주문 관계만 보기
SELECT * FROM users;
SELECT * FROM orders WHERE user_id IN (SELECT id FROM users);
```

## 📝 다음 단계

1. 각 DBML 파일을 dbdiagram.io에 임포트
2. 서브시스템별 SVG/PNG 이미지 생성
3. 팀별 필요에 따라 추가 분리
4. API 문서와 연결

---

*생성일: 2025-09-04*
*총 모델 수: 80개*
*서브시스템: 6개*