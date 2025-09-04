# 1001 Stories 데이터베이스 ER 다이어그램

## 📁 생성된 ERD 파일

### 1. **SVG 형식 ERD** (4.3MB)
- 경로: `/docs/database-erd.svg`
- 전체 데이터베이스 구조를 하나의 다이어그램으로 표현
- 브라우저에서 직접 열어 확대/축소 가능

### 2. **DBML 형식** (62KB)
- 경로: `/docs/schema.dbml`
- dbdiagram.io에서 임포트 가능
- 인터랙티브 편집 및 수정 가능

## 🔍 ERD 보는 방법

### 방법 1: 브라우저에서 SVG 직접 보기
```bash
open docs/database-erd.svg
# 또는
open -a "Google Chrome" docs/database-erd.svg
```

### 방법 2: dbdiagram.io 사용 (추천)
1. https://dbdiagram.io/d 접속
2. "Import" 클릭
3. "From DBML" 선택
4. `/docs/schema.dbml` 파일 내용 복사/붙여넣기
5. 인터랙티브하게 탐색 및 수정 가능

### 방법 3: VS Code에서 보기
- SVG Preview 확장 설치
- `docs/database-erd.svg` 파일 열기

## 🏗️ 데이터베이스 구조 요약

### 핵심 통계
- **총 모델 수**: 80개
- **총 Enum 타입**: 89개
- **중심 엔티티**: User (50+ 관계)

### 주요 서브시스템

#### 1. **사용자 관리 (User Management)**
```
User ─── Profile
  ├── Account (OAuth)
  ├── Session
  └── Subscription
```

#### 2. **교육 시스템 (Education)**
```
School ─── Class ─── Assignment
           │         └── Submission
           └── ClassEnrollment ─── User
```

#### 3. **콘텐츠 라이브러리 (Content)**
```
Story/Book ─── Chapter
    ├── Translation
    ├── ReadingProgress
    └── Bookmark
```

#### 4. **이커머스 (E-Commerce)**
```
Product ─── ProductVariant
    └── OrderItem ─── Order ─── User
```

#### 5. **봉사활동 (Volunteer)**
```
VolunteerProfile ─── Quest
    ├── QuestAssignment
    ├── VolunteerEvidence
    └── VolunteerPoints ─── VolunteerReward
```

## 📊 관계 패턴 분석

### 1:N (일대다) 관계
- User → Order, Story, Donation
- School → Class → Assignment
- Product → OrderItem

### N:M (다대다) 관계
- User ↔ Class (via ClassEnrollment)
- User ↔ Quest (via QuestAssignment)
- Mentor ↔ Mentee (via MentorRelation)

### 자기 참조
- Category (parent/children)
- MentorRelation (mentor/mentee)

## 🛠️ 추가 분석 도구

### PlantUML로 특정 부분 시각화
```plantuml
@startuml
!define Table(name,desc) class name as desc << (T,#FFAAAA) >>
!define primary_key(x) <b>x</b>
!define foreign_key(x) <u>x</u>

Table(User, "사용자") {
  primary_key(id): String
  email: String
  role: UserRole
}

Table(Order, "주문") {
  primary_key(id): String
  foreign_key(userId): String
  total: Decimal
}

User "1" --> "*" Order : places
@enduml
```

### SQL로 관계 확인
```sql
-- 외래 키 관계 조회
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    a.attname AS column_name,
    confrelid::regclass AS foreign_table_name,
    af.attname AS foreign_column_name
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
JOIN pg_attribute af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
WHERE c.contype = 'f'
ORDER BY conrelid::regclass::text, conname;
```

## 💡 권장사항

1. **복잡도 관리**: 80개 모델은 단일 다이어그램으로 보기 어려우므로 서브시스템별로 분리 권장
2. **성능 최적화**: User 모델의 50+ 관계는 성능 이슈 가능성
3. **캐싱 전략**: 자주 조회되는 관계에 대한 캐싱 레이어 구현 필요

## 📚 참고 자료

- [Prisma Schema 문서](https://www.prisma.io/docs/concepts/components/prisma-schema)
- [DBML 문법](https://www.dbml.org/docs/)
- [dbdiagram.io](https://dbdiagram.io)