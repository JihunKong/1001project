# Code Quality Improvement Plan

## 현재 상태
- **총 경고**: 80+개
- **총 에러**: 3개
- **우선순위**: 에러 → 경고 → 리팩토링

---

## Phase 1: 즉시 수정 (에러)

### 1. React 특수 문자 이스케이프 (3개)
**위치**:
- `app/login/page.tsx:354` - "Let's" 등
- `components/workflow/StoryStatusCardDemo.tsx:184, 259`

**수정 방법**:
```tsx
// Before
<p>Let's get started</p>

// After
<p>Let&apos;s get started</p>
// 또는
<p>{`Let's get started`}</p>
```

**예상 시간**: 10분

---

## Phase 2: Console.log 제거/교체 (60+개)

### 우선순위 파일:
1. `components/workflow/StoryStatusCardDemo.tsx` (6개)
2. `lib/email.ts` (14개)
3. `lib/audit-monitoring.ts` (7개)
4. `lib/performance.ts` (4개)
5. `lib/prisma.ts` (2개)
6. 기타 파일들

### 수정 방법:
```typescript
// Development only logs - 제거
console.log('Debug info');  // 삭제

// Important logs - console.warn/error로 변경
console.log('Critical error');
// → console.error('Critical error');

// Debugging info - 주석 처리 또는 삭제
console.log('User data:', data);  // 삭제
```

**예상 시간**: 1-2시간

---

## Phase 3: React Hook Dependencies (15개)

### 문제 패턴:
```typescript
// 문제
useEffect(() => {
  fetchData();
}, []); // fetchData가 의존성에 없음

// 해결책 1: useCallback으로 함수 메모이제이션
const fetchData = useCallback(() => {
  // ...
}, [/* dependencies */]);

useEffect(() => {
  fetchData();
}, [fetchData]);

// 해결책 2: 함수를 useEffect 안으로 이동
useEffect(() => {
  const fetchData = () => {
    // ...
  };
  fetchData();
}, [/* actual dependencies */]);
```

### 수정 파일:
1. `app/dashboard/book-manager/decide/[id]/page.tsx`
2. `app/dashboard/book-manager/page.tsx`
3. `app/dashboard/content-admin/page.tsx`
4. `app/dashboard/content-admin/review/[id]/page.tsx`
5. `app/dashboard/story-manager/page.tsx`
6. `app/dashboard/story-manager/review/[id]/page.tsx`
7. `app/dashboard/writer/library/page.tsx`
8. `app/dashboard/writer/notifications/page.tsx`
9. `app/dashboard/writer/page.tsx`
10. `app/dashboard/writer/stories/page.tsx`
11. `app/profile/notifications/page.tsx`
12. `lib/hooks/useContentAccess.ts` (2개)
13. `lib/hooks/useEnhancedAuth.ts` (3개)

**예상 시간**: 2-3시간

---

## Phase 4: Export 패턴 개선 (2개)

### 문제 파일:
1. `lib/rate-limit.ts`
2. `lib/security-middleware.ts`

### 수정:
```typescript
// Before
export default {
  // ...
}

// After
const rateLimiter = {
  // ...
};

export default rateLimiter;
```

**예상 시간**: 10분

---

## 실행 순서

### Step 1: 에러 수정 (10분)
```bash
# 1. React 특수 문자 이스케이프
# - app/login/page.tsx
# - components/workflow/StoryStatusCardDemo.tsx

git add .
git commit -m "fix: Escape special characters in React components"
```

### Step 2: Console.log 정리 (1-2시간)
```bash
# Demo 파일부터 시작 (개발용)
# 1. components/workflow/StoryStatusCardDemo.tsx - 제거 가능
# 2. lib/email.ts - console.error로 변경
# 3. lib/audit-monitoring.ts - console.error로 변경
# 4. 기타 파일들

git add .
git commit -m "refactor: Replace console.log with proper logging"
```

### Step 3: React Hook Dependencies (2-3시간)
```bash
# Dashboard 파일들 수정
# useCallback 패턴 적용

git add .
git commit -m "fix: Add missing dependencies to React hooks"
```

### Step 4: Export 패턴 (10분)
```bash
# rate-limit.ts, security-middleware.ts

git add .
git commit -m "refactor: Improve export patterns"
```

### Step 5: 최종 검증
```bash
npm run lint  # 모든 에러/경고 해결 확인
npm run build # 빌드 성공 확인

git push origin code-quality
```

---

## 추가 작업 (선택사항)

### TypeScript 엄격성 개선
```bash
npm run type-check
```

### 보안 감사
```bash
npm audit
npm audit fix
```

### 성능 최적화
- 불필요한 re-render 제거
- 메모이제이션 추가
- Code splitting 최적화

---

## 예상 총 소요 시간
- **Phase 1 (에러)**: 10분
- **Phase 2 (Console)**: 1-2시간
- **Phase 3 (Hooks)**: 2-3시간
- **Phase 4 (Export)**: 10분
- **총계**: 약 4-6시간

---

## Git 커밋 전략

### 작은 단위로 커밋:
```bash
# 각 Phase마다 커밋
git add [specific-files]
git commit -m "fix: [specific issue]"

# 정기적으로 푸시
git push origin code-quality
```

### 커밋 메시지 컨벤션:
- `fix:` - 버그 수정
- `refactor:` - 코드 리팩토링
- `chore:` - 빌드/설정 변경
- `test:` - 테스트 추가/수정

---

## 주의사항

1. **한 번에 하나씩**: 너무 많은 파일을 동시에 수정하지 말것
2. **테스트**: 각 수정 후 `npm run lint` 실행
3. **빌드 확인**: 주기적으로 `npm run build` 실행
4. **백업**: 중요한 변경 전 브랜치 백업

---

## 완료 체크리스트

- [ ] Phase 1: React 특수 문자 이스케이프
- [ ] Phase 2: Console.log 제거/교체
- [ ] Phase 3: React Hook Dependencies 수정
- [ ] Phase 4: Export 패턴 개선
- [ ] 최종 lint 검사 통과
- [ ] 빌드 성공 확인
- [ ] main 브랜치로 병합

