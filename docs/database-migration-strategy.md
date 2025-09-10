# Database Migration Strategy
## From Current Schema to Enhanced Educational Platform Schema

### Overview
This document outlines the migration strategy from the current 1001 Stories database schema to the enhanced educational platform schema with comprehensive learning management features.

## Migration Phases

### Phase 1: Non-Breaking Additions (Week 1)
**Goal**: Add new tables and fields without affecting existing functionality

#### New Tables to Create:
1. **ClassRoom** - Teacher classroom management
2. **ClassEnrollment** - Student-teacher relationships
3. **Assignment** - Content assignments
4. **AssignmentSubmission** - Student submissions
5. **ReadingSession** - Detailed reading tracking
6. **VocabularyWord** - User vocabulary learning
7. **BookVocabulary** - Book-defined vocabulary
8. **Discussion** - Book club discussions
9. **DiscussionPost** - Discussion posts
10. **AIGeneratedImage** - AI illustrations
11. **TTSRequest** - Text-to-speech audio
12. **AIGeneratedContent** - AI educational content

#### Fields to Add to Existing Tables:

**User Table:**
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS grade_level VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) DEFAULT 'en';
ALTER TABLE users ADD COLUMN IF NOT EXISTS reading_level VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS interests TEXT[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_reading_time INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS books_completed INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0;
```

**Book Table:**
```sql
ALTER TABLE books ADD COLUMN IF NOT EXISTS isbn VARCHAR(20);
ALTER TABLE books ADD COLUMN IF NOT EXISTS publishing_status VARCHAR(20) DEFAULT 'DRAFT';
ALTER TABLE books ADD COLUMN IF NOT EXISTS published_at TIMESTAMP;
ALTER TABLE books ADD COLUMN IF NOT EXISTS grade_level TEXT[];
ALTER TABLE books ADD COLUMN IF NOT EXISTS word_count INTEGER;
ALTER TABLE books ADD COLUMN IF NOT EXISTS reading_time INTEGER;
ALTER TABLE books ADD COLUMN IF NOT EXISTS curriculum TEXT[];
ALTER TABLE books ADD COLUMN IF NOT EXISTS has_quiz BOOLEAN DEFAULT FALSE;
ALTER TABLE books ADD COLUMN IF NOT EXISTS has_vocabulary BOOLEAN DEFAULT FALSE;
ALTER TABLE books ADD COLUMN IF NOT EXISTS has_audio BOOLEAN DEFAULT FALSE;
ALTER TABLE books ADD COLUMN IF NOT EXISTS has_activities BOOLEAN DEFAULT FALSE;
ALTER TABLE books ADD COLUMN IF NOT EXISTS is_interactive BOOLEAN DEFAULT FALSE;
ALTER TABLE books ADD COLUMN IF NOT EXISTS access_type VARCHAR(20) DEFAULT 'FREE';
ALTER TABLE books ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE books ADD COLUMN IF NOT EXISTS read_count INTEGER DEFAULT 0;
ALTER TABLE books ADD COLUMN IF NOT EXISTS avg_rating FLOAT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS total_ratings INTEGER DEFAULT 0;
```

### Phase 2: Data Migration Scripts (Week 2)

#### 1. Migrate Existing Classes (if any)
```typescript
// migrate-classes.ts
async function migrateClasses() {
  // Find existing class-like structures
  const existingClasses = await prisma.class.findMany();
  
  for (const oldClass of existingClasses) {
    await prisma.classRoom.create({
      data: {
        name: oldClass.name,
        teacherId: oldClass.teacherId,
        classCode: generateClassCode(),
        // Map other fields
      }
    });
  }
}
```

#### 2. Create Reading Progress Records
```typescript
// create-reading-progress.ts
async function createReadingProgress() {
  // Find users with reading history
  const readingHistory = await prisma.userContentInteraction.findMany({
    where: { interactionType: 'READ' }
  });
  
  for (const history of readingHistory) {
    await prisma.readingProgress.upsert({
      where: {
        userId_bookId: {
          userId: history.userId,
          bookId: history.contentId
        }
      },
      create: {
        userId: history.userId,
        bookId: history.contentId,
        currentPage: history.currentPage || 1,
        totalPages: history.totalPages || 100,
        percentComplete: history.progress || 0
      },
      update: {
        lastReadAt: new Date()
      }
    });
  }
}
```

#### 3. Enhance Book Submissions
```typescript
// enhance-book-submissions.ts
async function enhanceBookSubmissions() {
  const submissions = await prisma.bookSubmission.findMany();
  
  for (const submission of submissions) {
    // Map old status to new workflow stages
    const workflowStage = mapStatusToWorkflowStage(submission.status);
    
    await prisma.bookSubmission.update({
      where: { id: submission.id },
      data: {
        currentStage: workflowStage,
        submittedAt: submission.createdAt
      }
    });
  }
}
```

### Phase 3: Application Code Updates (Week 3)

#### API Endpoints to Update:
1. **/api/classroom** - New classroom management
2. **/api/assignments** - Assignment creation and submission
3. **/api/reading-progress** - Enhanced progress tracking
4. **/api/vocabulary** - Vocabulary learning system
5. **/api/discussions** - Book club discussions
6. **/api/ai-content** - AI content generation
7. **/api/publishing** - Multi-stage publishing workflow

#### Frontend Components to Create:
1. **TeacherDashboard** - Classroom management UI
2. **AssignmentManager** - Create and track assignments
3. **ReadingTracker** - Visual progress tracking
4. **VocabularyBuilder** - Interactive vocabulary learning
5. **BookClubHub** - Discussion forum interface
6. **PublishingWorkflow** - Multi-stage submission UI
7. **AIContentGenerator** - AI illustration and content tools

### Phase 4: Data Integrity & Performance (Week 4)

#### 1. Create Database Indexes
```sql
-- Performance-critical indexes
CREATE INDEX idx_reading_progress_user_book ON reading_progress(user_id, book_id);
CREATE INDEX idx_assignments_due_date ON assignments(due_date) WHERE status = 'PUBLISHED';
CREATE INDEX idx_vocabulary_mastery ON vocabulary_words(user_id, mastery);
CREATE INDEX idx_book_submissions_stage ON book_submissions(current_stage);
CREATE INDEX idx_discussions_club ON discussions(club_id);

-- Full-text search indexes
CREATE INDEX idx_books_title_gin ON books USING gin(to_tsvector('english', title));
CREATE INDEX idx_books_content_gin ON books USING gin(to_tsvector('english', content));
```

#### 2. Add Constraints
```sql
-- Ensure data integrity
ALTER TABLE class_enrollments ADD CONSTRAINT unique_enrollment UNIQUE(class_id, student_id);
ALTER TABLE assignment_submissions ADD CONSTRAINT unique_submission UNIQUE(assignment_id, student_id);
ALTER TABLE reading_progress ADD CONSTRAINT check_percent CHECK (percent_complete >= 0 AND percent_complete <= 100);
ALTER TABLE vocabulary_words ADD CONSTRAINT check_mastery CHECK (mastery >= 0 AND mastery <= 100);
```

#### 3. Create Triggers
```sql
-- Auto-update reading progress
CREATE OR REPLACE FUNCTION update_reading_progress()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE reading_progress 
  SET 
    percent_complete = (NEW.current_page::float / NEW.total_pages::float) * 100,
    last_read_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_reading_progress
AFTER UPDATE OF current_page ON reading_progress
FOR EACH ROW
EXECUTE FUNCTION update_reading_progress();

-- Update user stats
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.percent_complete = 100 AND OLD.percent_complete < 100 THEN
    UPDATE users 
    SET books_completed = books_completed + 1
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_stats
AFTER UPDATE OF percent_complete ON reading_progress
FOR EACH ROW
EXECUTE FUNCTION update_user_stats();
```

### Phase 5: Testing & Rollback Plan (Week 5)

#### Testing Strategy:
1. **Unit Tests** - Test each new model and relationship
2. **Integration Tests** - Test complete workflows
3. **Load Testing** - Ensure performance with large datasets
4. **User Acceptance Testing** - Test with real teachers and students

#### Rollback Plan:
1. **Database Snapshots** - Take snapshots before each phase
2. **Feature Flags** - Enable new features gradually
3. **Backward Compatibility** - Maintain old APIs during transition
4. **Data Export** - Export critical data before migration

### Migration Commands

```bash
# 1. Generate Prisma migration
npx prisma migrate dev --name add_educational_features

# 2. Run migration scripts in order
npx tsx scripts/migrations/01-add-new-tables.ts
npx tsx scripts/migrations/02-migrate-existing-data.ts
npx tsx scripts/migrations/03-create-indexes.ts
npx tsx scripts/migrations/04-add-constraints.ts
npx tsx scripts/migrations/05-create-triggers.ts

# 3. Validate migration
npx tsx scripts/migrations/validate-migration.ts

# 4. Generate new Prisma client
npx prisma generate

# 5. Run tests
npm run test:migration
```

### Monitoring Post-Migration

#### Key Metrics to Monitor:
1. **Query Performance** - Response times for new queries
2. **Index Usage** - Ensure indexes are being used
3. **Data Integrity** - Check for orphaned records
4. **User Activity** - Monitor adoption of new features
5. **Error Rates** - Track any migration-related errors

#### Database Health Checks:
```sql
-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Check slow queries
SELECT 
  query,
  calls,
  mean_exec_time,
  total_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 20;
```

## Timeline Summary

| Week | Phase | Key Activities |
|------|-------|----------------|
| 1 | Non-Breaking Additions | Add new tables and columns |
| 2 | Data Migration | Migrate and transform existing data |
| 3 | Application Updates | Update APIs and create new UIs |
| 4 | Performance & Integrity | Add indexes, constraints, triggers |
| 5 | Testing & Deployment | Test, validate, and deploy |

## Risk Mitigation

### High-Risk Areas:
1. **Class Code Collisions** - Use UUID generation
2. **Reading Progress Accuracy** - Validate calculations
3. **Workflow State Transitions** - Enforce valid transitions
4. **AI Content Moderation** - Implement safety checks
5. **Performance Impact** - Monitor query times

### Mitigation Strategies:
1. **Staged Rollout** - Deploy to subset of users first
2. **Feature Flags** - Control feature availability
3. **Monitoring** - Real-time alerts for issues
4. **Rollback Ready** - Quick rollback procedures
5. **Support Team** - Trained on new features

## Success Criteria

1. ✅ All existing functionality remains operational
2. ✅ New features accessible to appropriate user roles
3. ✅ Query performance within acceptable limits (<100ms)
4. ✅ Data integrity maintained (0 data loss)
5. ✅ User adoption metrics improving
6. ✅ No increase in error rates
7. ✅ Successful completion of all test scenarios

## Maintenance Plan

### Regular Tasks:
- Weekly index optimization
- Monthly data integrity checks
- Quarterly performance reviews
- Annual schema optimization

### Monitoring Dashboard:
- Real-time query performance
- Feature usage statistics
- Error tracking
- User feedback collection