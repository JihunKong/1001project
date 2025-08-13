# 1001 Stories - Comprehensive Database Schema Documentation

## Table of Contents
1. [Overview](#overview)
2. [Core Models](#core-models)
3. [E-commerce System](#e-commerce-system)
4. [Digital Library](#digital-library)
5. [Educational System](#educational-system)
6. [School Management](#school-management)
7. [Volunteer Management](#volunteer-management)
8. [Donation System](#donation-system)
9. [Content Management](#content-management)
10. [Relationships](#relationships)
11. [Indexes & Performance](#indexes--performance)

## Overview

This document describes the complete database schema for the 1001 Stories platform, supporting all features including e-commerce, digital library, educational tools, volunteer management, and donation tracking.

## Core Models

### User
The central model for all platform users.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| email | String | Unique email address |
| emailVerified | DateTime? | Email verification timestamp |
| name | String? | Display name |
| image | String? | Profile image URL |
| role | UserRole | User role (LEARNER, TEACHER, INSTITUTION, VOLUNTEER, ADMIN) |
| schoolId | String? | Associated school (for students/teachers) |
| createdAt | DateTime | Account creation date |
| updatedAt | DateTime | Last update timestamp |

### Profile
Extended user information.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| userId | String | Foreign key to User |
| firstName | String? | First name |
| lastName | String? | Last name |
| organization | String? | Organization name |
| bio | String? | User biography |
| location | String? | Geographic location |
| phone | String? | Contact number |
| dateOfBirth | DateTime? | Birth date |
| language | String | Preferred language |
| timezone | String | User timezone |
| teachingLevel | String? | For teachers |
| subjects | String[] | Teaching subjects |
| studentCount | Int? | Number of students |
| skills | String[] | Volunteer skills |
| availability | String? | Volunteer schedule |
| experience | String? | Background experience |

## E-commerce System

### Product
Physical and digital products for sale.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| sku | String | Stock keeping unit |
| type | ProductType | PHYSICAL_BOOK, DIGITAL_BOOK, MERCHANDISE, ARTWORK |
| title | String | Product name |
| description | String | Product description |
| price | Decimal | Base price |
| compareAtPrice | Decimal? | Original price (for sales) |
| cost | Decimal? | Cost to produce |
| currency | String | Currency code (USD, KRW, etc.) |
| weight | Float? | Weight in grams |
| status | ProductStatus | ACTIVE, DRAFT, ARCHIVED |
| featured | Boolean | Featured product flag |
| creatorId | String? | Creator/artist reference |
| creatorStory | String? | Creator background |
| categoryId | String | Product category |
| tags | String[] | Searchable tags |
| impactMetric | String? | Social impact measure |
| impactValue | String? | Impact quantity |

### ProductVariant
Product variations (size, color, format).

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| productId | String | Parent product |
| title | String | Variant name |
| sku | String | Variant SKU |
| price | Decimal | Variant price |
| inventoryQuantity | Int | Stock level |
| attributes | Json | Size, color, etc. |

### Inventory
Stock management for products.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| productId | String | Product reference |
| variantId | String? | Variant reference |
| quantity | Int | Available quantity |
| reserved | Int | Reserved for orders |
| location | String | Warehouse location |
| reorderPoint | Int | Reorder threshold |
| reorderQuantity | Int | Reorder amount |

### Cart
User shopping cart.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| userId | String? | User reference (null for guests) |
| sessionId | String? | Guest session ID |
| items | CartItem[] | Cart contents |
| expiresAt | DateTime | Cart expiration |

### CartItem
Individual items in cart.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| cartId | String | Parent cart |
| productId | String | Product reference |
| variantId | String? | Variant reference |
| quantity | Int | Item quantity |
| price | Decimal | Price at time of adding |

### Order
Completed purchases.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| orderNumber | String | Human-readable order ID |
| userId | String? | Customer reference |
| email | String | Customer email |
| status | OrderStatus | PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED |
| subtotal | Decimal | Items total |
| tax | Decimal | Tax amount |
| shipping | Decimal | Shipping cost |
| total | Decimal | Final amount |
| currency | String | Currency code |
| paymentStatus | PaymentStatus | PENDING, PAID, FAILED, REFUNDED |
| paymentMethod | String? | Payment type |
| stripePaymentId | String? | Stripe reference |
| notes | String? | Order notes |
| shippingAddress | Json | Delivery address |
| billingAddress | Json | Billing address |
| createdAt | DateTime | Order date |

### OrderItem
Products within an order.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| orderId | String | Parent order |
| productId | String | Product reference |
| variantId | String? | Variant reference |
| title | String | Product name (snapshot) |
| quantity | Int | Quantity ordered |
| price | Decimal | Unit price |
| total | Decimal | Line total |
| fulfillmentStatus | String? | Item status |

## Digital Library

### Book
Enhanced story model for digital books.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| isbn | String? | ISBN number |
| title | String | Book title |
| subtitle | String? | Book subtitle |
| authorId | String | Primary author |
| coAuthors | String[] | Additional authors |
| illustratorId | String? | Illustrator reference |
| publishedDate | DateTime? | Publication date |
| publisher | String? | Publisher name |
| language | String | Original language |
| pageCount | Int? | Total pages |
| readingLevel | String? | Age/grade level |
| genres | String[] | Book genres |
| subjects | String[] | Educational subjects |
| description | String | Book description |
| coverImage | String | Cover URL |
| samplePdf | String? | Preview PDF URL |
| fullPdf | String? | Complete PDF (premium) |
| epubFile | String? | EPUB version |
| audioFile | String? | Audiobook URL |
| isPremium | Boolean | Premium content flag |
| price | Decimal? | Purchase price |
| viewCount | Int | Total views |
| rating | Float? | Average rating |
| featured | Boolean | Featured book |

### Chapter
Book chapters for sequential reading.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| bookId | String | Parent book |
| chapterNumber | Int | Chapter sequence |
| title | String | Chapter title |
| content | String | Chapter text |
| audioUrl | String? | Chapter audio |
| illustrations | String[] | Chapter images |
| readingTime | Int? | Estimated minutes |

### ReadingProgress
User's reading progress tracking.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| userId | String | Reader reference |
| bookId | String | Book reference |
| currentChapter | Int | Current chapter |
| currentPage | Int? | Current page |
| currentPosition | String? | Text position |
| percentComplete | Float | Progress percentage |
| totalReadingTime | Int | Minutes read |
| lastReadAt | DateTime | Last reading session |
| startedAt | DateTime | First opened |
| completedAt | DateTime? | Completion date |
| notes | String[] | Reader notes |

### Bookmark
Saved positions in books.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| userId | String | User reference |
| bookId | String | Book reference |
| chapterId | String? | Chapter reference |
| position | String | Text position |
| note | String? | User note |
| color | String? | Highlight color |
| createdAt | DateTime | Bookmark date |

### ReadingList
User's reading lists/collections.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| userId | String | Owner reference |
| name | String | List name |
| description | String? | List description |
| isPublic | Boolean | Public visibility |
| books | String[] | Book IDs |

## Educational System

### Class
Educational classes/courses.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| code | String | Class code |
| name | String | Class name |
| description | String? | Class description |
| teacherId | String | Instructor reference |
| schoolId | String? | School reference |
| subject | String | Subject area |
| gradeLevel | String | Grade/level |
| schedule | Json | Class schedule |
| startDate | DateTime | Course start |
| endDate | DateTime | Course end |
| maxStudents | Int | Enrollment limit |
| isActive | Boolean | Active status |
| settings | Json | Class settings |

### ClassEnrollment
Student-class relationships.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| classId | String | Class reference |
| studentId | String | Student reference |
| enrolledAt | DateTime | Enrollment date |
| status | EnrollmentStatus | ACTIVE, COMPLETED, DROPPED |
| grade | String? | Final grade |
| attendance | Float | Attendance percentage |
| progress | Float | Course progress |

### Assignment
Class assignments and homework.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| classId | String | Class reference |
| title | String | Assignment title |
| description | String | Instructions |
| type | AssignmentType | READING, WRITING, PROJECT, QUIZ |
| dueDate | DateTime | Due date |
| points | Int | Maximum points |
| resources | String[] | Resource URLs |
| requirements | Json | Requirements |

### Submission
Student assignment submissions.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| assignmentId | String | Assignment reference |
| studentId | String | Student reference |
| submittedAt | DateTime | Submission time |
| content | String? | Text submission |
| attachments | String[] | File URLs |
| grade | Float? | Score received |
| feedback | String? | Teacher feedback |
| status | SubmissionStatus | DRAFT, SUBMITTED, GRADED, RETURNED |

### Lesson
Course lessons/modules.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| classId | String | Class reference |
| lessonNumber | Int | Sequence |
| title | String | Lesson title |
| objectives | String[] | Learning objectives |
| content | String | Lesson content |
| resources | Json | Lesson materials |
| duration | Int | Estimated minutes |

### LessonProgress
Student lesson completion.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| lessonId | String | Lesson reference |
| studentId | String | Student reference |
| startedAt | DateTime | Start time |
| completedAt | DateTime? | Completion time |
| timeSpent | Int | Minutes spent |
| score | Float? | Quiz score |

## School Management

### School
Educational institutions.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| name | String | School name |
| type | SchoolType | PRIMARY, SECONDARY, HIGH, UNIVERSITY |
| address | Json | School address |
| country | String | Country code |
| phone | String? | Contact number |
| email | String? | Contact email |
| website | String? | School website |
| principalName | String? | Principal/head |
| studentCount | Int | Total students |
| teacherCount | Int | Total teachers |
| establishedYear | Int? | Founded year |
| accreditation | String[] | Certifications |
| partneredAt | DateTime | Partnership date |
| status | SchoolStatus | ACTIVE, PENDING, INACTIVE |

### Budget
School financial management.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| schoolId | String | School reference |
| year | Int | Budget year |
| totalBudget | Decimal | Total amount |
| allocatedBudget | Decimal | Allocated amount |
| spentBudget | Decimal | Spent amount |
| categories | Json | Budget categories |

### BudgetItem
Budget line items.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| budgetId | String | Budget reference |
| category | String | Item category |
| description | String | Item description |
| amount | Decimal | Allocated amount |
| spent | Decimal | Spent amount |
| vendor | String? | Supplier name |
| approvedBy | String? | Approver reference |

### SchoolResource
School educational resources.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| schoolId | String | School reference |
| type | ResourceType | BOOK, COMPUTER, SUPPLIES, EQUIPMENT |
| name | String | Resource name |
| quantity | Int | Available quantity |
| condition | String | Resource condition |
| location | String? | Storage location |
| purchaseDate | DateTime? | Acquisition date |
| value | Decimal? | Asset value |

## Volunteer Management

### VolunteerProject
Volunteer opportunities and projects.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| title | String | Project title |
| description | String | Project description |
| type | VolunteerType | TRANSLATION, ILLUSTRATION, TEACHING, TECHNICAL |
| skills | String[] | Required skills |
| location | String | Remote/Location |
| timeCommitment | String | Hours per week |
| startDate | DateTime | Project start |
| endDate | DateTime? | Project end |
| maxVolunteers | Int | Volunteer limit |
| currentVolunteers | Int | Current count |
| status | ProjectStatus | OPEN, IN_PROGRESS, COMPLETED |
| impact | String | Expected impact |
| coordinator | String | Coordinator reference |

### VolunteerApplication
Volunteer applications for projects.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| projectId | String | Project reference |
| volunteerId | String | Applicant reference |
| motivation | String | Why interested |
| experience | String | Relevant experience |
| availability | String | Time availability |
| status | ApplicationStatus | PENDING, APPROVED, REJECTED |
| reviewedBy | String? | Reviewer reference |
| reviewedAt | DateTime? | Review date |
| notes | String? | Review notes |

### VolunteerHours
Volunteer time tracking.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| volunteerId | String | Volunteer reference |
| projectId | String | Project reference |
| date | DateTime | Activity date |
| hours | Float | Hours worked |
| activity | String | Work description |
| impact | String? | Impact achieved |
| verified | Boolean | Verification status |
| verifiedBy | String? | Verifier reference |

### VolunteerCertificate
Volunteer recognition certificates.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| volunteerId | String | Volunteer reference |
| projectId | String? | Project reference |
| type | CertificateType | PARTICIPATION, ACHIEVEMENT, MILESTONE |
| title | String | Certificate title |
| description | String | Achievement description |
| hoursContributed | Float | Total hours |
| issuedDate | DateTime | Issue date |
| certificateUrl | String? | Certificate file |

## Donation System

### Donation
Individual donations.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| donorId | String? | Donor reference |
| campaignId | String? | Campaign reference |
| amount | Decimal | Donation amount |
| currency | String | Currency code |
| type | DonationType | ONE_TIME, RECURRING |
| paymentMethod | String | Payment type |
| stripePaymentId | String? | Stripe reference |
| anonymousD | Boolean | Anonymous donation |
| donorName | String? | Display name |
| donorEmail | String | Donor email |
| message | String? | Donor message |
| taxDeductible | Boolean | Tax status |
| receiptUrl | String? | Receipt URL |
| status | DonationStatus | PENDING, COMPLETED, FAILED, REFUNDED |
| createdAt | DateTime | Donation date |

### DonationCampaign
Fundraising campaigns.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| title | String | Campaign title |
| description | String | Campaign description |
| goal | Decimal | Target amount |
| raised | Decimal | Current amount |
| currency | String | Currency code |
| startDate | DateTime | Campaign start |
| endDate | DateTime | Campaign end |
| category | String | Campaign type |
| beneficiary | String | Who benefits |
| impactStatement | String | Expected impact |
| images | String[] | Campaign images |
| videoUrl | String? | Campaign video |
| status | CampaignStatus | DRAFT, ACTIVE, COMPLETED, CANCELLED |
| featured | Boolean | Featured campaign |

### RecurringDonation
Subscription donations.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| donorId | String | Donor reference |
| amount | Decimal | Monthly amount |
| currency | String | Currency code |
| dayOfMonth | Int | Billing day |
| stripeSubscriptionId | String? | Stripe subscription |
| status | SubscriptionStatus | ACTIVE, PAUSED, CANCELLED |
| startDate | DateTime | Start date |
| pausedAt | DateTime? | Pause date |
| cancelledAt | DateTime? | Cancellation date |
| totalContributed | Decimal | Lifetime value |
| lastPaymentDate | DateTime? | Last payment |
| nextPaymentDate | DateTime? | Next payment |

### DonorTier
Donor recognition levels.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| name | String | Tier name |
| minimumAmount | Decimal | Minimum donation |
| benefits | String[] | Tier benefits |
| badgeUrl | String? | Recognition badge |

## Content Management

### StorySubmission
User story submissions.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| authorId | String | Author reference |
| title | String | Story title |
| content | String | Story content |
| language | String | Original language |
| category | String | Story category |
| ageGroup | String | Target age |
| status | SubmissionStatus | DRAFT, SUBMITTED, IN_REVIEW, APPROVED, PUBLISHED, REJECTED |
| reviewerId | String? | Reviewer reference |
| reviewNotes | String? | Review feedback |
| editorialNotes | String? | Editorial notes |
| publishDate | DateTime? | Publication date |
| compensation | Decimal? | Author payment |

### Translation
Story translations.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| originalId | String | Original content |
| translatorId | String | Translator reference |
| fromLanguage | String | Source language |
| toLanguage | String | Target language |
| title | String | Translated title |
| content | String | Translated content |
| status | TranslationStatus | IN_PROGRESS, REVIEW, APPROVED, PUBLISHED |
| qualityScore | Float? | Quality rating |
| reviewerId | String? | Reviewer reference |
| reviewNotes | String? | Review notes |

### Illustration
Story illustrations.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| storyId | String | Story reference |
| artistId | String | Artist reference |
| title | String | Illustration title |
| description | String? | Image description |
| fileUrl | String | Image URL |
| thumbnailUrl | String? | Thumbnail URL |
| position | Int? | Story position |
| status | IllustrationStatus | DRAFT, SUBMITTED, APPROVED, PUBLISHED |
| compensation | Decimal? | Artist payment |
| license | String | Usage rights |

### Review
Content reviews and ratings.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| userId | String | Reviewer reference |
| contentType | ContentType | BOOK, PRODUCT, STORY |
| contentId | String | Content reference |
| rating | Int | 1-5 stars |
| title | String? | Review title |
| comment | String? | Review text |
| helpful | Int | Helpful votes |
| verified | Boolean | Verified purchase |
| createdAt | DateTime | Review date |

## Relationships

### Primary Relationships
- User → Profile (1:1)
- User → Orders (1:n)
- User → Donations (1:n)
- User → ReadingProgress (1:n)
- User → ClassEnrollment (1:n)
- School → Classes (1:n)
- School → Budget (1:1)
- Class → Assignments (1:n)
- Book → Chapters (1:n)
- Book → Translations (1:n)

### Many-to-Many Relationships
- User ↔ Class (via ClassEnrollment)
- User ↔ VolunteerProject (via VolunteerApplication)
- Book ↔ ReadingList (via array field)

## Indexes & Performance

### Critical Indexes
```sql
-- User queries
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_user_role ON users(role);
CREATE INDEX idx_user_school ON users(school_id);

-- E-commerce
CREATE INDEX idx_product_status ON products(status);
CREATE INDEX idx_order_user ON orders(user_id);
CREATE INDEX idx_order_status ON orders(status);
CREATE INDEX idx_cart_session ON carts(session_id);

-- Reading
CREATE INDEX idx_reading_progress ON reading_progress(user_id, book_id);
CREATE INDEX idx_bookmark_user ON bookmarks(user_id);

-- Educational
CREATE INDEX idx_class_teacher ON classes(teacher_id);
CREATE INDEX idx_enrollment_student ON class_enrollments(student_id);
CREATE INDEX idx_enrollment_class ON class_enrollments(class_id);

-- Volunteer
CREATE INDEX idx_volunteer_project ON volunteer_hours(project_id);
CREATE INDEX idx_volunteer_user ON volunteer_hours(volunteer_id);

-- Donations
CREATE INDEX idx_donation_campaign ON donations(campaign_id);
CREATE INDEX idx_donation_donor ON donations(donor_id);
```

### Performance Considerations
1. Use pagination for large result sets
2. Implement caching for frequently accessed data
3. Use database views for complex queries
4. Regular index maintenance
5. Archive old data periodically

## Data Integrity

### Constraints
- Unique constraints on email, SKU, ISBN
- Foreign key relationships with CASCADE/RESTRICT
- Check constraints on prices (>= 0)
- Not null constraints on critical fields

### Audit Fields
All models include:
- createdAt: Record creation timestamp
- updatedAt: Last modification timestamp
- createdBy: User who created record (where applicable)
- updatedBy: User who last modified record (where applicable)

### Soft Deletes
Critical models support soft deletes:
- deletedAt: Deletion timestamp
- deletedBy: User who deleted record
- isDeleted: Boolean flag

## Security Considerations

1. **Personal Data Protection**
   - Encrypt sensitive fields (SSN, payment info)
   - Implement data retention policies
   - Support GDPR right to be forgotten

2. **Access Control**
   - Row-level security for multi-tenant data
   - Role-based access control (RBAC)
   - API rate limiting

3. **Audit Trail**
   - Log all data modifications
   - Track user actions
   - Maintain compliance records

## Migration Strategy

1. **Phase 1**: Core models (User, Profile, Subscription)
2. **Phase 2**: E-commerce (Product, Order, Cart)
3. **Phase 3**: Educational (Class, Assignment, Enrollment)
4. **Phase 4**: Support systems (Volunteer, Donation)
5. **Phase 5**: Content management (Review, Translation)

## Backup & Recovery

1. **Backup Schedule**
   - Daily incremental backups
   - Weekly full backups
   - Monthly archive backups

2. **Recovery Procedures**
   - Point-in-time recovery
   - Disaster recovery plan
   - Regular restore testing

---

*Last Updated: December 2024*
*Version: 2.0.0*