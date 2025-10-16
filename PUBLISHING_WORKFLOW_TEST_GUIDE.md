# Publishing Workflow Manual Test Guide

## 목적
각 역할별로 퍼블리싱 워크플로우를 수동 테스트하고 각 단계의 스크린샷을 캡처합니다.

## 테스트 계정

| 역할 | 이메일 | 비밀번호 |
|------|--------|----------|
| VOLUNTEER | volunteer@test.1001stories.org | test1234 |
| STORY_MANAGER | story-manager@test.1001stories.org | test1234 |
| BOOK_MANAGER | book-manager@test.1001stories.org | test1234 |
| CONTENT_ADMIN | content-admin@test.1001stories.org | test1234 |

## 테스트 URL
- **Production**: https://1001stories.seedsofempowerment.org
- **Local**: http://localhost:8001

## 스크린샷 저장 위치
`/Users/jihunkong/1001project/1001-stories/screenshots/publishing-workflow/`

---

## Step 1: VOLUNTEER - Text Story Submission

### 1.1 로그인
1. URL: https://1001stories.seedsofempowerment.org/login
2. **Password** 탭 클릭
3. 이메일: `volunteer@test.1001stories.org`
4. 비밀번호: `test1234`
5. **스크린샷**: `01-volunteer-login.png`

### 1.2 Submit Text 페이지로 이동
1. Dashboard에서 "Submit Text Story" 클릭 또는
2. 직접 이동: https://1001stories.seedsofempowerment.org/dashboard/volunteer/submit-text
3. **스크린샷**: `02-volunteer-empty-form.png`

### 1.3 스토리 입력
**Title**: "Test Story for Publishing Workflow"
**Author Alias**: "Test Author"
**Age Range**: "8-10"
**Reading Level**: "INTERMEDIATE"

**Story Content** (Rich Text Editor):
```
Once upon a time, in a small village nestled between mountains, there lived a curious child named Maya.

Maya loved to explore the forests around her home, discovering new plants and animals every day.

One day, she found a mysterious golden seed that would change her life forever...
```

**Summary**:
```
A story about Maya, a curious child who discovers a magical golden seed in the forest.
```

**Tags**: `adventure, discovery, nature`

4. **스크린샷**: `03-volunteer-filled-form.png`

### 1.4 Submit
1. "Submit Story" 버튼 클릭
2. 성공 메시지 확인
3. **스크린샷**: `04-volunteer-submission-success.png`

---

## Step 2: STORY_MANAGER - Review and Approve

### 2.1 로그아웃 및 재로그인
1. 현재 세션 로그아웃
2. https://1001stories.seedsofempowerment.org/login
3. **Password** 탭 → `story-manager@test.1001stories.org` / `test1234`
4. **스크린샷**: `05-story-manager-login.png`

### 2.2 Dashboard 확인
1. Story Manager Dashboard로 자동 리디렉트
2. **스크린샷**: `06-story-manager-dashboard.png`

### 2.3 Pending Submissions 확인
1. "Pending Submissions" 섹션 확인
2. "Test Story for Publishing Workflow" 찾기
3. **스크린샷**: `07-story-manager-pending-list.png`

### 2.4 Review 페이지
1. 스토리 클릭하여 리뷰 페이지로 이동
2. 전체 내용 확인
3. **스크린샷**: `08-story-manager-review-page.png`

### 2.5 Approve
1. "Approve" 버튼 클릭
2. 승인 확인
3. **스크린샷**: `09-story-manager-approval-success.png`

---

## Step 3: BOOK_MANAGER - Publication Format Decision

### 3.1 로그아웃 및 재로그인
1. 로그아웃
2. https://1001stories.seedsofempowerment.org/login
3. **Password** 탭 → `book-manager@test.1001stories.org` / `test1234`
4. **스크린샷**: `10-book-manager-login.png`

### 3.2 Dashboard 확인
1. Book Manager Dashboard로 이동
2. **스크린샷**: `11-book-manager-dashboard.png`

### 3.3 Approved Stories 확인
1. Story Manager가 승인한 스토리 목록 확인
2. "Test Story for Publishing Workflow" 찾기
3. **스크린샷**: `12-book-manager-approved-list.png`

### 3.4 Format Decision 페이지
1. 스토리 클릭
2. Publication format 선택 화면 확인
3. **스크린샷**: `13-book-manager-format-page.png`

### 3.5 Choose Format
1. **"Text Format"** 선택 (AI 이미지 생성용)
   - 또는 "Book Format" (PDF 업로드 필요)
2. 결정 확인
3. **스크린샷**: `14-book-manager-format-selected.png`

---

## Step 4: CONTENT_ADMIN - Final Approval and Publish

### 4.1 로그아웃 및 재로그인
1. 로그아웃
2. https://1001stories.seedsofempowerment.org/login
3. **Password** 탭 → `content-admin@test.1001stories.org` / `test1234`
4. **스크린샷**: `15-content-admin-login.png`

### 4.2 Dashboard 확인
1. Content Admin Dashboard로 이동
2. **스크린샷**: `16-content-admin-dashboard.png`

### 4.3 Ready for Publishing 확인
1. Format이 결정된 콘텐츠 목록 확인
2. "Test Story for Publishing Workflow" 찾기
3. **스크린샷**: `17-content-admin-ready-list.png`

### 4.4 Final Review 페이지
1. 스토리 클릭
2. 모든 메타데이터 및 콘텐츠 최종 확인
3. **스크린샷**: `18-content-admin-final-review.png`

### 4.5 Publish
1. **"Publish"** 버튼 클릭
2. 퍼블리싱 성공 메시지 확인
3. **스크린샷**: `19-content-admin-publish-success.png`

---

## Step 5: Verify Published Content

### 5.1 Library 페이지
1. 로그아웃 (선택사항)
2. https://1001stories.seedsofempowerment.org/library
3. **스크린샷**: `20-library-page.png`

### 5.2 Search Published Story
1. 검색창에 "Test Story for Publishing Workflow" 입력
2. 검색 결과 확인
3. **스크린샷**: `21-library-search-result.png`

### 5.3 Story Detail Page
1. 스토리 클릭
2. 상세 페이지 확인
   - Title, Author, Summary
   - AI 생성 이미지 (Text format 선택 시)
   - Full content
3. **스크린샷**: `22-published-story-detail.png`

### 5.4 Reading Experience
1. "Read Now" 버튼 클릭 (있다면)
2. 읽기 화면 확인
3. **스크린샷**: `23-published-story-reading.png`

---

## 체크리스트

- [ ] VOLUNTEER: Story submission completed
- [ ] STORY_MANAGER: Review and approval completed
- [ ] BOOK_MANAGER: Format decision completed
- [ ] CONTENT_ADMIN: Final approval and publish completed
- [ ] Library: Published story verified
- [ ] Total screenshots: 23개

---

## 추가 테스트 시나리오

### Rejection Flow (선택사항)

#### STORY_MANAGER Rejection
1. 다른 스토리 제출
2. Story Manager가 "Request Changes" 선택
3. 피드백 작성
4. **스크린샷**: `24-story-manager-rejection.png`

#### Volunteer Revision
1. Volunteer로 다시 로그인
2. 피드백 확인
3. 스토리 수정 및 재제출
4. **스크린샷**: `25-volunteer-revision.png`

---

## 문제 해결

### 로그인 실패
- 브라우저 쿠키/캐시 삭제 후 재시도
- 시크릿/프라이빗 모드 사용

### 페이지가 보이지 않음
- URL이 정확한지 확인
- 역할에 맞는 대시보드 URL 사용

### Submit 버튼이 비활성화됨
- 모든 필수 필드 작성 확인
- Title, Content, Age Range는 필수

---

## 완료 후

모든 스크린샷을 다음 위치에 저장:
```
/Users/jihunkong/1001project/1001-stories/screenshots/publishing-workflow/
```

스크린샷 파일명:
- 01-23: 정상 워크플로우
- 24-25: Rejection flow (선택)
