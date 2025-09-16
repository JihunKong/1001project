# Phase 5 Publishing Workflow Test Accounts

✅ **Test accounts successfully created on production server!**

## Login URL
https://1001stories.seedsofempowerment.org/login

## Test Accounts

### 1. Learner Account
- **Email:** learner.test@1001stories.org
- **Password:** learner123
- **Role:** LEARNER
- **Purpose:** Student account for testing book assignments and reading

### 2. Teacher Account
- **Email:** teacher.test@1001stories.org
- **Password:** teacher123
- **Role:** TEACHER
- **Purpose:** Teacher account for managing classes and assigning books

### 3. Volunteer Account
- **Email:** volunteer.test@1001stories.org
- **Password:** volunteer123
- **Role:** VOLUNTEER
- **Purpose:** Volunteer account for submitting stories

### 4. Story Manager Account
- **Email:** story.manager@1001stories.org
- **Password:** storymanager123
- **Role:** STORY_MANAGER
- **Purpose:** Reviews and approves submitted stories

### 5. Book Manager Account
- **Email:** book.manager@1001stories.org
- **Password:** bookmanager123
- **Role:** BOOK_MANAGER
- **Purpose:** Manages book format decisions and publication pipeline

### 6. Content Admin Account
- **Email:** content.admin@1001stories.org
- **Password:** contentadmin123
- **Role:** CONTENT_ADMIN
- **Purpose:** Final approval and content policy management

### 7. System Admin Account
- **Email:** admin.test@1001stories.org
- **Password:** admin123456
- **Role:** ADMIN
- **Purpose:** Full system administration access

## Publishing Workflow Testing Steps

1. **Submit a Story**
   - Login as **Volunteer** (volunteer.test@1001stories.org / volunteer123)
   - Navigate to dashboard and submit a new story

2. **Review and Approve Story**
   - Login as **Story Manager** (story.manager@1001stories.org / storymanager123)
   - Review submitted story in the queue
   - Provide feedback or approve for next stage

3. **Decide Format and Approve**
   - Login as **Book Manager** (book.manager@1001stories.org / bookmanager123)
   - Decide publication format (book vs text)
   - Approve for final review

4. **Final Approval and Publish**
   - Login as **Content Admin** (content.admin@1001stories.org / contentadmin123)
   - Give final approval
   - Publish to library

5. **Assign Book to Class**
   - Login as **Teacher** (teacher.test@1001stories.org / teacher123)
   - Create a class if needed
   - Assign published book to students

6. **Read Assigned Book**
   - Login as **Learner** (learner.test@1001stories.org / learner123)
   - Access assigned book from dashboard
   - Test reading features

## Test Class (Optional)
- **Class Name:** Phase 5 Test Class
- **Join Code:** TEST01
- **Description:** Class for testing publishing workflow
- **Teacher:** teacher.test@1001stories.org
- **Enrolled Student:** learner.test@1001stories.org

## Notes
- All accounts have been email-verified and are ready for immediate use
- Passwords are bcrypt-hashed in the database
- These are test accounts - use them only for testing the publishing workflow
- The accounts use the ON CONFLICT clause, so running the SQL again will update existing accounts

## Created
- Date: 2025-09-15
- Location: Production Server (3.128.143.122)
- Database: 1001-stories-db (PostgreSQL)