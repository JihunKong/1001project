# Story Publication - Product Requirements Document (PRD)

## 1. Story Publication

## 2. User Story (사용자 시나리오)

| 역할 | 목표 |
|------|------|
| 작가 (Writer) | 새로운 스토리를 작성하고, AI 리뷰를 받아 개선한 뒤, 출판 승인을 위해 제출할 수 있어야 한다. |
| 관리자 (Admin) | 제출된 스토리를 검토하고, 작가와 소통하여 수정 요청(Iteration) 후 최종 승인하거나 반려할 수 있어야 한다. |

## 3. 문제 정의 및 배경 (Problem Statement & Background)

### 왜 이 기능이 필요한가?
플랫폼에 양질의 스토리를 지속적으로 제공하고, 작가들이 전문적인 피드백을 통해 스토리를 완성도 있게 발전시켜, 공식적으로 웹사이트에 출판할 수 있는 구조화된 프로세스를 마련하기 위함.

### 현재 어떤 Pain Point를 해결하려는가?
- **스토리 품질 관리 부재**: 작가들이 자체적으로 스토리 문법이나 구조를 검증하기 어려워 최종 출판물의 품질이 저하될 수 있음. → AI 리뷰를 통해 기본적인 품질 검증 및 개선 가이드 제공.
- **비효율적인 출판 프로세스**: 관리자와 작가 간의 피드백 및 승인 과정이 비공식적이거나 비체계적이어서 시간이 지연되고 혼선 발생. → 체계적인 제출 및 승인 시스템을 구축하여 효율성 증대.

### 관련된 이전 기능이나 정책 맥락
- **Writer/Editor 권한 정책**: 스토리 작성 및 제출 권한은 'Writer' 롤에게 부여되어 있으며, 최종 승인 및 출판 권한은 'Admin' 롤에게 한정됨.
- **콘텐츠 가이드라인**: 플랫폼의 출판 정책 및 콘텐츠 윤리 규정을 준수해야 함 (예: 특정 주제/언어 사용 금지).

## 4. 핵심 기능 범위 (Scope)

### In Scope:
- 스토리 작성 및 임시 저장 기능 (Title, Content)
- AI 리뷰 요청 및 결과 확인 기능 (문법, 기승전결 스트럭처 등)
- 스토리 제출 기능 (작가 → 관리자)
- 스토리 상태 관리 기능 (Draft, Pending Review, Under Revision, Approved, Published, Rejected)
- 관리자 검토 및 피드백 기능 (수정 요청/반려/승인)
- 승인 후 이미지 작성 (옵션) 및 등록 기능
- 웹사이트 출판 (Publishing) 기능 (관리자만 가능)
- '내가 쓴 스토리 목록' 화면 (작성/제출 현황 대시보드)

### Out of Scope:
- 협업 작성 기능 (공동 저자 지정 및 편집)
- 다국어 번역 기능 (원고 제출 후 자동/수동 번역)
- AI를 활용한 자동 이미지 생성 기능 (현재는 수동 등록만)
- 버전 관리 기능 (수정 이력 상세 추적)

## 5. 인수조건 (Acceptance Criteria – 화면별 시나리오)

### 5.1. 스토리 작성 및 AI 리뷰

| 플로우 | Given / When / Then |
|--------|---------------------|
| 스토리 임시 저장 | **Given**: 작가가 '새 스토리 작성' 화면에 진입하여 제목과 내용을 입력한 상태에서<br>**When**: '임시 저장' 버튼을 클릭하면<br>**Then**: 스토리는 'Draft' 상태로 저장되고, 작가 목록 페이지에서 해당 스토리가 'Draft' 상태로 표시되어야 한다. |
| AI 리뷰 요청 | **Given**: 작가가 'Draft' 상태의 스토리를 작성하고 'AI 리뷰 요청' 버튼을 클릭하면<br>**When**: 시스템이 스토리 내용을 기반으로 문법, 기승전결 구조 등에 대한 AI 리뷰를 진행하면<br>**Then**: AI 리뷰가 완료된 후, 작성 화면 내에 리뷰 결과가 요약되어 표시되며, 작가는 리뷰 내용을 참고하여 수정할 수 있어야 한다. (스토리 상태는 'Draft' 유지) |

### 5.2. 출판 승인 제출 및 관리자 검토

| 플로우 | Given / When / Then |
|--------|---------------------|
| 승인 제출 | **Given**: 작가가 AI 리뷰를 참고하여 수정을 완료하고 '최종 제출' 버튼을 클릭하면<br>**When**: '출판 승인 제출' 확인 모달에서 '확인'을 누르면<br>**Then**: 스토리 상태는 'Pending Review'로 변경되고, 작가는 해당 스토리를 더 이상 수정할 수 없으며, 관리자에게 알림이 발송되어야 한다. |
| 관리자 수정 요청 (Iteration) | **Given**: 관리자가 'Pending Review' 상태의 스토리를 검토하고 '수정 요청' 버튼을 클릭하면<br>**When**: 관리자가 수정 요청 사유를 상세히 작성한 후 '요청' 버튼을 누르면<br>**Then**: 스토리 상태는 'Under Revision'으로 변경되고, 작가에게 수정 요청 알림과 함께 관리자의 피드백 내용이 전달되어야 한다. 작가는 다시 스토리를 수정할 수 있는 상태가 되어야 한다. |
| 관리자 최종 승인 | **Given**: 관리자가 스토리를 검토하고 플랫폼의 모든 가이드라인을 충족한다고 판단하여 '최종 승인' 버튼을 클릭하면<br>**When**: '출판 승인 확인' 모달에서 '확인'을 누르면<br>**Then**: 스토리 상태는 'Approved'로 변경되고, 작가에게 승인 완료 알림이 발송되어야 한다. |

### 5.3. 이미지 등록 및 출판

| 플로우 | Given / When / Then |
|--------|---------------------|
| 이미지 등록 | **Given**: 스토리가 'Approved' 상태인 경우, 작가 또는 관리자가 '이미지 등록' 화면에 진입하여<br>**When**: 필수 이미지(예: 커버 이미지)를 업로드하고 '저장' 버튼을 누르면<br>**Then**: 이미지가 스토리와 연결되어 저장되고, 스토리는 'Approved' 상태를 유지해야 한다. (이미지 등록은 옵션이므로 상태 변경 없음) |
| 웹사이트 출판 | **Given**: 스토리가 'Approved' 상태이고, (옵션) 이미지가 등록되어 있는 상태에서<br>**When**: 관리자가 '출판 (Publish)' 버튼을 클릭하고 최종 확인을 거치면<br>**Then**: 스토리 상태는 'Published'로 변경되고, 웹사이트의 Public Library에 즉시 공개되어야 한다. |

## 6. 기능 요구사항 (Functional Requirements)

Up to the design team

## 7. 정책 (Policy)

### 접근 권한
- **스토리 작성/AI 리뷰 요청/제출/이미지 등록**: Writer만 가능
- **검토/수정 요청/반려/최종 승인/웹사이트 출판**: Admin만 가능
- **Published 스토리 삭제/비공개**: Admin만 가능

### 보안 정책
- **아동 개인정보/민감 정보 금지**: 모든 스토리 제출 시 시스템이 키워드 필터링을 통해 검사하며, 관리자 검토 단계에서 최종 확인.
- **저작권**: 작가는 제출하는 모든 콘텐츠에 대한 사용 권한을 플랫폼에 부여하는 것에 동의해야 함.

### 알림 정책
- **제출 시**: Admin에게 Push/이메일 알림 발송
- **수정 요청/승인/반려 시**: Writer에게 Push/이메일 알림 발송
- **웹사이트 출판 시**: Writer에게 이메일 알림 발송 (선택적)

## 8. 비즈니스 로직 (Business Logic)

### 스토리 제출 (최종 제출)
- 상태값을 **'Pending Review'**로 변경하고, 제출일시 (submitted_at) 필드에 현재 시각을 기록.

### 관리자 수정 요청
- 상태값을 **'Under Revision'**으로 변경.
- 피드백 내용은 별도의 'Review Log' 테이블에 저장하고, 작가 스토리 편집 화면에 노출.

### 스토리 출판 (Publish)
1. 상태값을 **'Published'**로 변경.
2. 출판일시 (published_at) 필드에 현재 시각을 기록.
3. Public Library (웹사이트 공개 DB/API)에 해당 스토리의 읽기 전용 레코드를 생성 또는 동기화하여 즉시 공개.

### 스토리 삭제 (Admin)
- DB에서 soft delete 처리.
- 상태값을 **'Deleted'**로 변경.
- Public Library에서는 즉시 제거 표시.

## 9. 요청사항 (Requests)

### Dev 요청사항
- **AI 리뷰 API 명세**: 문법 교정, 기승전결 구조 분석 결과를 반환하는 내부 AI API의 명세 및 호출 방식 정의 필요. (동기/비동기 처리 여부)
- **상태값 관리**: 스토리 상태를 나타내는 Enum/Code Table 정의. 상태 전환 시 이력 (Log) 관리 방안 설계 (Review Log 테이블 활용).
- **알림 기능 연동**: 제출/승인/수정 요청 시 이메일/Push 알림 서비스 연동 요청.

### Design 요청사항
- **AI 리뷰 결과 UI/UX**: AI가 제안하는 수정 사항을 작가가 쉽게 확인하고 수용/거절할 수 있는 편집기 연동 UX 디자인 검증 요청.
- **작가 대시보드 (목록)**: 스토리 상태별 (Draft, Under Revision, Published 등) 필터링 및 현황을 한눈에 볼 수 있는 '내가 쓴 스토리 목록' 화면 디자인 요청.
- **관리자 피드백 UI**: 관리자가 스토리 내용에 직접 인라인 코멘트를 달 수 있는 기능의 UI/UX 플로우 검증 요청.

### Test 요청사항
- **경계 상황 테스트**: 최대 길이의 스토리 제출 시 AI 리뷰/저장 처리 속도 테스트.
- **상태 전환 테스트**: Draft → Pending Review → Under Revision → Approved → Published로의 정상적인 상태 전환 및 권한에 따른 액션 제한 여부 (예: Writer가 Pending Review 상태 수정 불가) 검증.
- **출판 반영 여부**: Published 상태 변경 후 웹사이트 Public Library에 즉시 반영되는지 검증 (End-to-End 테스트).

---

## 📌 Implementation Notes

### Current System Alignment
- **Database Model**: `TextSubmission` (already implemented in `prisma/schema.prisma`)
- **AI Review System**: `AIReview` model + `/api/ai-review` endpoint (already exists)
- **Role System**: WRITER, STORY_MANAGER, BOOK_MANAGER, CONTENT_ADMIN
- **Status Workflow**: Matches PRD requirements with minor enhancements

### Key Differences from PRD
- PRD mentions "Admin" role generically, but current system has:
  - `STORY_MANAGER`: Reviews and provides feedback
  - `BOOK_MANAGER`: Decides publication format
  - `CONTENT_ADMIN`: Final approval and publishing
- This provides more granular control and better workflow separation

---

**Document Version**: 1.0
**Last Updated**: 2025-10-16
**Source**: PD Team PRD
