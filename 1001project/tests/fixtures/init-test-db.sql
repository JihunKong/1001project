-- Test database initialization script
-- This script sets up the test database with sample data for E2E testing

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('LEARNER', 'TEACHER', 'INSTITUTION', 'VOLUNTEER', 'ADMIN');
CREATE TYPE story_status AS ENUM ('DRAFT', 'REVIEW', 'TRANSLATION', 'ILLUSTRATION', 'EDITING', 'PUBLISHED');
CREATE TYPE payment_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    password_hash VARCHAR(255),
    role user_role DEFAULT 'LEARNER',
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    profile_image VARCHAR(500),
    locale VARCHAR(10) DEFAULT 'en',
    demo_mode BOOLEAN DEFAULT FALSE
);

-- Stories table
CREATE TABLE IF NOT EXISTS stories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    content TEXT,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status story_status DEFAULT 'DRAFT',
    language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP,
    view_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    tags TEXT[],
    cover_image VARCHAR(500)
);

-- Classes table (for teachers)
CREATE TABLE IF NOT EXISTS classes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
    code VARCHAR(20) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    grade_level VARCHAR(50),
    subject VARCHAR(100)
);

-- Class enrollments
CREATE TABLE IF NOT EXISTS enrollments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(class_id, student_id)
);

-- Institutions table
CREATE TABLE IF NOT EXISTS institutions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_verified BOOLEAN DEFAULT FALSE,
    country VARCHAR(100),
    city VARCHAR(100),
    website VARCHAR(500),
    description TEXT
);

-- Volunteer projects
CREATE TABLE IF NOT EXISTS volunteer_projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    required_skills TEXT[],
    location VARCHAR(255)
);

-- Volunteer applications
CREATE TABLE IF NOT EXISTS volunteer_applications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES volunteer_projects(id) ON DELETE CASCADE,
    volunteer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'PENDING',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    message TEXT,
    UNIQUE(project_id, volunteer_id)
);

-- Payment records
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status payment_status DEFAULT 'PENDING',
    payment_method VARCHAR(50),
    transaction_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);

-- Sessions table for authentication
CREATE TABLE IF NOT EXISTS sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45)
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_stories_author ON stories(author_id);
CREATE INDEX idx_stories_status ON stories(status);
CREATE INDEX idx_classes_teacher ON classes(teacher_id);
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- Insert test data
-- Test users with different roles (password: TestPass123!)
INSERT INTO users (email, name, password_hash, role, email_verified, demo_mode) VALUES
    ('admin@test.com', 'Test Admin', '$2a$10$YourHashedPasswordHere', 'ADMIN', true, false),
    ('teacher@test.com', 'Test Teacher', '$2a$10$YourHashedPasswordHere', 'TEACHER', true, false),
    ('learner@test.com', 'Test Learner', '$2a$10$YourHashedPasswordHere', 'LEARNER', true, false),
    ('volunteer@test.com', 'Test Volunteer', '$2a$10$YourHashedPasswordHere', 'VOLUNTEER', true, false),
    ('institution@test.com', 'Test Institution Admin', '$2a$10$YourHashedPasswordHere', 'INSTITUTION', true, false),
    ('demo.learner@test.com', 'Demo Learner', '$2a$10$YourHashedPasswordHere', 'LEARNER', true, true),
    ('demo.teacher@test.com', 'Demo Teacher', '$2a$10$YourHashedPasswordHere', 'TEACHER', true, true);

-- Test stories
INSERT INTO stories (title, content, author_id, status, language) VALUES
    ('The Adventure Begins', 'Once upon a time...', (SELECT id FROM users WHERE email = 'learner@test.com'), 'PUBLISHED', 'en'),
    ('Learning Journey', 'In a small village...', (SELECT id FROM users WHERE email = 'teacher@test.com'), 'REVIEW', 'en'),
    ('Korean Folk Tale', '옛날 옛적에...', (SELECT id FROM users WHERE email = 'volunteer@test.com'), 'PUBLISHED', 'ko');

-- Test classes
INSERT INTO classes (name, teacher_id, code, grade_level, subject) VALUES
    ('Math Class 101', (SELECT id FROM users WHERE email = 'teacher@test.com'), 'MATH101', 'Grade 5', 'Mathematics'),
    ('English Literature', (SELECT id FROM users WHERE email = 'teacher@test.com'), 'ENG201', 'Grade 6', 'English');

-- Test institutions
INSERT INTO institutions (name, admin_id, is_verified, country, city) VALUES
    ('Global Learning Center', (SELECT id FROM users WHERE email = 'institution@test.com'), true, 'USA', 'New York'),
    ('Community Education Hub', (SELECT id FROM users WHERE email = 'institution@test.com'), false, 'Korea', 'Seoul');

-- Test volunteer projects
INSERT INTO volunteer_projects (title, description, institution_id, start_date, is_active) VALUES
    ('Story Translation Project', 'Help translate stories for children', 
     (SELECT id FROM institutions WHERE name = 'Global Learning Center'), 
     CURRENT_DATE, true),
    ('Illustration Workshop', 'Create illustrations for published stories', 
     (SELECT id FROM institutions WHERE name = 'Community Education Hub'), 
     CURRENT_DATE + INTERVAL '7 days', true);

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO test_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO test_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO test_user;