# Code Review Checklist for 1001 Stories

This checklist ensures consistent code quality and adherence to best practices across the 1001 Stories platform.

## 🔴 Critical Issues (Must Fix)

### Security
- [ ] No sensitive data (API keys, passwords, tokens) exposed in code
- [ ] User inputs are properly validated and sanitized
- [ ] Authentication and authorization checks are in place
- [ ] SQL injection vulnerabilities are prevented (using Prisma ORM properly)
- [ ] XSS vulnerabilities are prevented (proper data escaping)
- [ ] File uploads are validated for type, size, and content
- [ ] Rate limiting is implemented for API endpoints
- [ ] HTTPS is enforced for sensitive operations

### TypeScript Safety
- [ ] No `any` types used (use proper type definitions)
- [ ] All function parameters and return types are explicitly typed
- [ ] Null/undefined checks are in place where needed
- [ ] Type assertions are justified and safe
- [ ] Generic types are properly constrained
- [ ] Union types are handled exhaustively

### Error Handling
- [ ] All async operations have proper error handling
- [ ] Database operations are wrapped in try-catch blocks
- [ ] API endpoints return consistent error responses
- [ ] Client-side errors are logged appropriately
- [ ] User-friendly error messages are displayed
- [ ] Error boundaries are implemented for React components

## 🟡 Important Issues (Should Fix)

### Code Quality
- [ ] Functions are focused on a single responsibility
- [ ] Code is DRY (Don't Repeat Yourself)
- [ ] Magic numbers and strings are replaced with named constants
- [ ] Complex logic is broken into smaller, testable functions
- [ ] Code is readable and self-documenting
- [ ] Consistent naming conventions are used

### Performance
- [ ] Database queries are optimized (proper indexing, avoid N+1 queries)
- [ ] React components use useMemo/useCallback where appropriate
- [ ] Expensive operations are debounced or throttled
- [ ] Images are optimized and properly sized
- [ ] Bundle size impact is considered for new dependencies
- [ ] API responses are properly paginated for large datasets

### Accessibility
- [ ] Semantic HTML elements are used correctly
- [ ] ARIA attributes are provided where needed
- [ ] Color contrast meets WCAG standards
- [ ] Keyboard navigation works properly
- [ ] Screen reader compatibility is ensured
- [ ] Focus management is handled correctly

### Testing
- [ ] New functionality has corresponding tests
- [ ] Edge cases are covered in tests
- [ ] API endpoints have integration tests
- [ ] Complex business logic has unit tests
- [ ] Error scenarios are tested
- [ ] Mock data is realistic and comprehensive

## 🟢 Suggestions (Good to Have)

### Code Style
- [ ] Consistent formatting (handled by Prettier)
- [ ] Import statements are organized logically
- [ ] File and folder naming follows project conventions
- [ ] Component files are properly structured
- [ ] Comments explain "why" not "what"

### Architecture
- [ ] Components are properly componentized (not too big or too small)
- [ ] Business logic is separated from UI logic
- [ ] API layer is abstracted appropriately
- [ ] State management follows established patterns
- [ ] Dependencies are injected rather than hardcoded

### Documentation
- [ ] Complex algorithms are documented
- [ ] Public APIs have JSDoc comments
- [ ] README files are updated for new features
- [ ] Breaking changes are documented

## Role-Specific Checks

### For API Routes (`/app/api/*`)
- [ ] Input validation using Zod schemas
- [ ] Proper HTTP status codes are returned
- [ ] Rate limiting is implemented
- [ ] Authentication middleware is applied
- [ ] Database transactions are used for multi-step operations
- [ ] API responses follow consistent structure
- [ ] OpenAPI/Swagger documentation is updated

### For React Components (`/components/*`, `/app/*`)
- [ ] Props are properly typed with interfaces
- [ ] State management is optimized (avoid unnecessary re-renders)
- [ ] Side effects are properly managed with useEffect
- [ ] Event handlers are memoized when appropriate
- [ ] Loading and error states are handled
- [ ] Components are accessible and semantic

### For Database Operations (`/lib/prisma.ts`, migrations)
- [ ] Migrations are reversible
- [ ] Indexes are created for frequently queried fields
- [ ] Foreign key constraints are properly defined
- [ ] Data validation is handled at the database level
- [ ] Sensitive data is properly encrypted
- [ ] Row-Level Security (RLS) rules are applied

### For Authentication (`/lib/auth*`, `/middleware.ts`)
- [ ] JWT tokens have appropriate expiration times
- [ ] Session management is secure
- [ ] Role-based access control is properly implemented
- [ ] Password requirements meet security standards
- [ ] Account lockout mechanisms are in place
- [ ] Multi-factor authentication is considered

## Testing Strategy

### Unit Tests
- [ ] Pure functions are tested with multiple inputs
- [ ] Error cases are explicitly tested
- [ ] Mocks are used appropriately (not over-mocked)
- [ ] Test names clearly describe what is being tested
- [ ] Tests are isolated and don't depend on external state

### Integration Tests
- [ ] API endpoints are tested with realistic data
- [ ] Database operations are tested with actual DB
- [ ] Authentication flows are tested end-to-end
- [ ] Third-party integrations are properly mocked
- [ ] Error scenarios are included in test cases

### E2E Tests
- [ ] Critical user workflows are covered
- [ ] Tests are stable and not flaky
- [ ] Test data is properly set up and torn down
- [ ] Cross-browser compatibility is verified
- [ ] Mobile responsiveness is tested

## Performance Checklist

### Frontend Performance
- [ ] Images are optimized and use next/image
- [ ] Code splitting is implemented for large components
- [ ] Lazy loading is used for below-the-fold content
- [ ] Bundle analyzer results are reviewed
- [ ] Critical CSS is inlined
- [ ] Service Worker is implemented for caching

### Backend Performance
- [ ] Database queries are analyzed with EXPLAIN
- [ ] N+1 queries are eliminated
- [ ] Appropriate caching strategies are implemented
- [ ] API responses are compressed
- [ ] Connection pooling is configured properly
- [ ] Background jobs are used for heavy operations

### Monitoring
- [ ] Performance metrics are collected
- [ ] Error tracking is implemented
- [ ] User experience metrics are monitored
- [ ] Database performance is tracked
- [ ] API response times are logged

## Deployment Checklist

### Pre-deployment
- [ ] All tests pass (unit, integration, E2E)
- [ ] TypeScript compilation succeeds without errors
- [ ] Linting passes with no errors
- [ ] Docker build completes successfully
- [ ] Environment variables are properly configured
- [ ] Database migrations run successfully

### Post-deployment
- [ ] Application starts without errors
- [ ] Critical workflows are manually tested
- [ ] Performance metrics are within acceptable ranges
- [ ] Error rates remain normal
- [ ] Monitoring and logging are functional

## Review Process

1. **Self Review**: Author reviews their own code using this checklist
2. **Automated Checks**: CI/CD pipeline runs tests, linting, and type checking
3. **Peer Review**: At least one team member reviews the code
4. **Security Review**: Security-sensitive changes get additional review
5. **Performance Review**: Changes affecting performance are benchmarked
6. **Final Approval**: Code is approved for merging and deployment

## Common Anti-Patterns to Avoid

- Using `any` type instead of proper TypeScript types
- Inline styles instead of CSS classes
- Synchronous operations that should be asynchronous
- Missing error handling in async operations
- Hardcoded configuration values
- Overly complex components that should be split
- Database queries in loops (N+1 problem)
- Unvalidated user inputs
- Missing loading states in UI components
- Inconsistent error response formats from APIs

Remember: Code review is not just about finding bugs—it's about knowledge sharing, maintaining consistency, and improving the overall codebase quality.