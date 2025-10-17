# Institution Schema Design

## Problem
The UserRole enum includes INSTITUTION, but there's no supporting database schema to manage:
- Institution entities
- Teacher-institution relationships
- Department organization
- Institution-wide analytics

## Proposed Schema Changes

### 1. New Institution Model
```prisma
model Institution {
  id              String    @id @default(cuid())
  name            String
  code            String    @unique  // Unique institution code
  type            String?   // "school", "library", "ngo"
  location        String?
  country         String?
  timezone        String    @default("UTC")

  // Contact information
  contactEmail    String?
  contactPhone    String?
  website         String?

  // Settings
  settings        Json?     // Institution-specific settings

  // Subscription and limits
  maxTeachers     Int       @default(50)
  maxStudents     Int       @default(1000)
  maxClasses      Int       @default(100)

  // Status
  isActive        Boolean   @default(true)
  verifiedAt      DateTime?

  // Relations
  admins          User[]    @relation("InstitutionAdmins")
  teachers        User[]    @relation("InstitutionTeachers")
  departments     Department[]
  classes         Class[]   @relation("InstitutionClasses")

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([code])
  @@index([isActive])
  @@map("institutions")
}
```

### 2. New Department Model
```prisma
model Department {
  id              String      @id @default(cuid())
  institutionId   String
  name            String
  code            String      // Department code within institution
  description     String?     @db.Text

  // Head of department
  headTeacherId   String?

  // Relations
  institution     Institution @relation(fields: [institutionId], references: [id], onDelete: Cascade)
  headTeacher     User?       @relation("DepartmentHead", fields: [headTeacherId], references: [id])
  teachers        User[]      @relation("DepartmentTeachers")

  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  @@unique([institutionId, code])
  @@index([institutionId])
  @@map("departments")
}
```

### 3. Updates to Existing Models

#### User Model - Add institution relations
```prisma
// Add to User model
institutionId        String?
institution          Institution? @relation("InstitutionTeachers", fields: [institutionId], references: [id])
institutionAdminOf   Institution[] @relation("InstitutionAdmins")

departmentId         String?
department           Department?  @relation("DepartmentTeachers", fields: [departmentId], references: [id])
departmentHeadOf     Department[] @relation("DepartmentHead")

@@index([institutionId])
@@index([departmentId])
```

#### Class Model - Add institution relation
```prisma
// Add to Class model
institutionId   String?
institution     Institution? @relation("InstitutionClasses", fields: [institutionId], references: [id])

@@index([institutionId])
```

## Migration Strategy

### Phase 1: Schema Extension (Non-breaking)
1. Create Institution and Department models
2. Add nullable institutionId and departmentId fields to User
3. Add nullable institutionId to Class
4. Deploy migration without data changes

### Phase 2: Data Migration (Optional)
1. Create institutions for existing INSTITUTION role users
2. Link teachers to institutions (if relationship data available)
3. Create departments based on Profile.subjects

### Phase 3: Enforcement (Future)
1. Make institutionId required for INSTITUTION and TEACHER roles
2. Add constraints and validation
3. Implement institution-scoped RLS policies

## API Implementation Notes

For now, API routes will:
1. Use mock data for development/testing
2. Be designed to work with real schema once migrated
3. Include TODO comments marking where real DB queries should go
4. Use proper TypeScript interfaces matching future schema

## Testing Strategy

1. Mock data matches schema interfaces exactly
2. API tests verify response structure
3. Integration tests ready for real DB
4. Migration can be applied when ready without API changes
