-- Enhanced Localization Database Schema for 1001 Stories Platform
-- This migration adds comprehensive internationalization and localization support

-- Supported locales configuration
CREATE TABLE supported_locales (
  code VARCHAR(10) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  native_name VARCHAR(100) NOT NULL,
  direction VARCHAR(3) CHECK (direction IN ('ltr', 'rtl')) DEFAULT 'ltr',
  script VARCHAR(20) NOT NULL, -- 'latin', 'arabic', 'chinese', 'cyrillic', 'devanagari'
  date_format VARCHAR(20) DEFAULT 'MM/dd/yyyy',
  number_format JSONB DEFAULT '{}',
  currency_symbol VARCHAR(10) DEFAULT '$',
  educational_context JSONB DEFAULT '{}',
  cultural_config JSONB DEFAULT '{}', -- Color schemes, imagery preferences, etc.
  is_active BOOLEAN DEFAULT true,
  priority_level INTEGER DEFAULT 0, -- Higher number = higher priority
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Localized content storage
CREATE TABLE localized_content (
  id SERIAL PRIMARY KEY,
  content_id VARCHAR(255) NOT NULL, -- Reference to original content
  locale VARCHAR(10) NOT NULL REFERENCES supported_locales(code),
  content_type VARCHAR(50) NOT NULL, -- 'ui', 'educational', 'story', 'metadata'
  namespace VARCHAR(100) DEFAULT 'common', -- i18n namespace
  content_key VARCHAR(255) NOT NULL, -- i18n key
  content_value TEXT NOT NULL, -- Translated content
  content_context JSONB DEFAULT '{}', -- ICU message format context
  meta_data JSONB DEFAULT '{}', -- Cultural context, formality level, etc.
  translation_status VARCHAR(20) DEFAULT 'pending' CHECK (
    translation_status IN ('pending', 'translated', 'reviewed', 'approved', 'rejected')
  ),
  cultural_review_status VARCHAR(20) DEFAULT 'pending' CHECK (
    cultural_review_status IN ('pending', 'reviewed', 'approved', 'needs_revision')
  ),
  quality_score FLOAT DEFAULT 0.0 CHECK (quality_score >= 0.0 AND quality_score <= 100.0),
  translator_id UUID REFERENCES users(id),
  cultural_reviewer_id UUID REFERENCES users(id),
  version_number INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(content_id, locale, namespace, content_key, version_number)
);

-- Translation memory for consistency across content
CREATE TABLE translation_memory (
  id SERIAL PRIMARY KEY,
  source_text TEXT NOT NULL,
  source_hash VARCHAR(64) NOT NULL, -- SHA-256 hash for quick lookups
  target_text TEXT NOT NULL,
  source_locale VARCHAR(10) NOT NULL REFERENCES supported_locales(code),
  target_locale VARCHAR(10) NOT NULL REFERENCES supported_locales(code),
  content_domain VARCHAR(50) DEFAULT 'general', -- ui, educational, narrative, marketing
  context_tags VARCHAR[] DEFAULT '{}',
  confidence_score FLOAT DEFAULT 0.0 CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
  usage_count INTEGER DEFAULT 0,
  quality_rating FLOAT DEFAULT 0.0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP DEFAULT NOW(),
  INDEX (source_hash, source_locale, target_locale),
  INDEX (content_domain, source_locale, target_locale)
);

-- Cultural adaptations metadata
CREATE TABLE cultural_adaptations (
  id SERIAL PRIMARY KEY,
  locale VARCHAR(10) NOT NULL REFERENCES supported_locales(code),
  adaptation_type VARCHAR(50) NOT NULL, -- color, imagery, interaction, format, typography
  content_selector VARCHAR(255), -- CSS selector or component identifier
  original_value TEXT,
  adapted_value TEXT NOT NULL,
  reasoning TEXT,
  cultural_context JSONB DEFAULT '{}',
  age_group VARCHAR(20), -- 6-8, 9-11, 12-14, 15-17
  educational_level VARCHAR(20), -- beginner, intermediate, advanced
  approval_status VARCHAR(20) DEFAULT 'pending' CHECK (
    approval_status IN ('pending', 'approved', 'rejected')
  ),
  approved_by UUID REFERENCES users(id),
  effectiveness_score FLOAT DEFAULT 0.0,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Translator and cultural expert profiles
CREATE TABLE translator_profiles (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  languages JSONB NOT NULL, -- {source: [], target: [], proficiency: {}}
  specializations VARCHAR[] DEFAULT '{}', -- educational, literature, ui, marketing, technical
  cultural_expertise JSONB DEFAULT '{}', -- regions, age_groups, educational_systems
  certifications JSONB DEFAULT '{}', -- type, issuer, expiry_date
  quality_metrics JSONB DEFAULT '{}', -- average_rating, completion_rate, timeliness_score
  availability_status VARCHAR(20) DEFAULT 'available' CHECK (
    availability_status IN ('available', 'busy', 'unavailable', 'inactive')
  ),
  hourly_rate DECIMAL(10,2),
  preferred_content_types VARCHAR[] DEFAULT '{}',
  timezone VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Translation workflow management
CREATE TABLE translation_workflows (
  id SERIAL PRIMARY KEY,
  content_id VARCHAR(255) NOT NULL,
  source_locale VARCHAR(10) NOT NULL REFERENCES supported_locales(code),
  target_locale VARCHAR(10) NOT NULL REFERENCES supported_locales(code),
  priority_level INTEGER DEFAULT 0, -- Higher number = higher priority
  deadline DATE,
  workflow_status VARCHAR(20) DEFAULT 'pending' CHECK (
    workflow_status IN ('pending', 'assigned', 'in_progress', 'translated',
                        'reviewing', 'cultural_review', 'approved', 'completed', 'cancelled')
  ),
  assigned_translator_id UUID REFERENCES users(id),
  assigned_reviewer_id UUID REFERENCES users(id),
  assigned_cultural_expert_id UUID REFERENCES users(id),
  translation_submitted_at TIMESTAMP,
  review_completed_at TIMESTAMP,
  cultural_review_completed_at TIMESTAMP,
  final_approved_at TIMESTAMP,
  estimated_word_count INTEGER DEFAULT 0,
  actual_word_count INTEGER DEFAULT 0,
  complexity_level VARCHAR(20) DEFAULT 'medium' CHECK (
    complexity_level IN ('simple', 'medium', 'complex', 'expert')
  ),
  budget_allocated DECIMAL(10,2),
  budget_spent DECIMAL(10,2) DEFAULT 0.00,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Community feedback and validation
CREATE TABLE community_feedback (
  id SERIAL PRIMARY KEY,
  content_id VARCHAR(255) NOT NULL,
  locale VARCHAR(10) NOT NULL REFERENCES supported_locales(code),
  reviewer_id UUID NOT NULL REFERENCES users(id),
  reviewer_type VARCHAR(30) NOT NULL CHECK (
    reviewer_type IN ('native_speaker', 'educator', 'parent', 'cultural_leader', 'student')
  ),
  cultural_sensitivity_rating INTEGER CHECK (cultural_sensitivity_rating BETWEEN 1 AND 5),
  cultural_sensitivity_comments TEXT,
  educational_value_rating INTEGER CHECK (educational_value_rating BETWEEN 1 AND 5),
  educational_comments TEXT,
  linguistic_quality_rating INTEGER CHECK (linguistic_quality_rating BETWEEN 1 AND 5),
  linguistic_comments TEXT,
  age_appropriateness BOOLEAN,
  curriculum_alignment INTEGER CHECK (curriculum_alignment BETWEEN 1 AND 5),
  overall_recommendation VARCHAR(20) CHECK (
    overall_recommendation IN ('approve', 'approve_with_changes', 'needs_major_revision', 'reject')
  ),
  specific_suggestions TEXT,
  regional_variant VARCHAR(10), -- e.g., 'es_MX' vs 'es_ES'
  reviewed_at TIMESTAMP DEFAULT NOW(),
  is_expert_review BOOLEAN DEFAULT false,
  helpfulness_score INTEGER DEFAULT 0, -- Community votes on feedback quality
  created_at TIMESTAMP DEFAULT NOW()
);

-- Cultural partnership and expert network
CREATE TABLE cultural_partners (
  id SERIAL PRIMARY KEY,
  organization_name VARCHAR(255) NOT NULL,
  partner_type VARCHAR(50) NOT NULL, -- university, ngo, government, community_leader
  regions VARCHAR[] DEFAULT '{}',
  languages VARCHAR[] DEFAULT '{}',
  expertise_areas VARCHAR[] DEFAULT '{}', -- educational_systems, child_psychology, linguistics
  contact_info JSONB NOT NULL, -- primary_contact, email, phone, timezone
  collaboration_scope JSONB DEFAULT '{}', -- content_review, cultural_adaptation, community_engagement
  partnership_status VARCHAR(20) DEFAULT 'active' CHECK (
    partnership_status IN ('active', 'inactive', 'pending', 'terminated')
  ),
  partnership_start_date DATE,
  partnership_end_date DATE,
  performance_metrics JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Content version control for translations
CREATE TABLE content_versions (
  id SERIAL PRIMARY KEY,
  content_id VARCHAR(255) NOT NULL,
  locale VARCHAR(10) NOT NULL REFERENCES supported_locales(code),
  version_number INTEGER NOT NULL,
  content_data JSONB NOT NULL,
  change_summary TEXT,
  change_type VARCHAR(50), -- translation_update, cultural_adaptation, educational_improvement
  changed_by UUID REFERENCES users(id),
  change_reason TEXT,
  approved_by UUID REFERENCES users(id),
  approval_notes TEXT,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(content_id, locale, version_number)
);

-- Quality assurance metrics tracking
CREATE TABLE qa_metrics (
  id SERIAL PRIMARY KEY,
  content_id VARCHAR(255) NOT NULL,
  locale VARCHAR(10) NOT NULL REFERENCES supported_locales(code),
  metric_type VARCHAR(50) NOT NULL, -- translation_accuracy, cultural_appropriateness, readability
  metric_value FLOAT NOT NULL,
  measurement_date DATE DEFAULT CURRENT_DATE,
  measured_by VARCHAR(50), -- automated, human_expert, community
  measurement_context JSONB DEFAULT '{}',
  improvement_suggestions TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Performance optimization tracking
CREATE TABLE localization_performance (
  id SERIAL PRIMARY KEY,
  locale VARCHAR(10) NOT NULL REFERENCES supported_locales(code),
  region VARCHAR(50),
  metric_name VARCHAR(100) NOT NULL, -- page_load_time, font_render_time, search_response_time
  metric_value FLOAT NOT NULL,
  measurement_timestamp TIMESTAMP DEFAULT NOW(),
  device_type VARCHAR(20), -- desktop, mobile, tablet
  browser VARCHAR(50),
  connection_type VARCHAR(20), -- 3g, 4g, wifi, broadband
  cdn_region VARCHAR(50),
  additional_data JSONB DEFAULT '{}'
);

-- Indexes for performance optimization
CREATE INDEX idx_localized_content_lookup ON localized_content(content_id, locale, namespace, content_key);
CREATE INDEX idx_localized_content_status ON localized_content(translation_status, cultural_review_status);
CREATE INDEX idx_translation_memory_lookup ON translation_memory(source_hash, source_locale, target_locale);
CREATE INDEX idx_translation_workflows_status ON translation_workflows(workflow_status, priority_level);
CREATE INDEX idx_community_feedback_content ON community_feedback(content_id, locale);
CREATE INDEX idx_cultural_adaptations_locale ON cultural_adaptations(locale, adaptation_type);
CREATE INDEX idx_content_versions_active ON content_versions(content_id, locale, is_active);
CREATE INDEX idx_qa_metrics_content_locale ON qa_metrics(content_id, locale, metric_type);
CREATE INDEX idx_localization_performance_metrics ON localization_performance(locale, metric_name, measurement_timestamp);

-- Insert default supported locales
INSERT INTO supported_locales (code, name, native_name, direction, script, educational_context, cultural_config) VALUES
('en', 'English', 'English', 'ltr', 'latin',
  '{"gradeSystem": "K-12", "academicYear": "September-June", "culturalHolidays": ["Christmas", "Thanksgiving", "Independence Day"]}',
  '{"primaryColor": "#3B82F6", "successColor": "#10B981", "warningColor": "#F59E0B", "dangerColor": "#EF4444"}'
),
('es', 'Spanish', 'Español', 'ltr', 'latin',
  '{"gradeSystem": "Primaria-Secundaria", "academicYear": "September-June", "culturalHolidays": ["Día de los Muertos", "Christmas", "Semana Santa"]}',
  '{"primaryColor": "#DC2626", "successColor": "#059669", "warningColor": "#D97706", "dangerColor": "#DC2626"}'
),
('ar', 'Arabic', 'العربية', 'rtl', 'arabic',
  '{"gradeSystem": "Primary-Secondary", "academicYear": "September-June", "culturalHolidays": ["Eid al-Fitr", "Eid al-Adha", "Ramadan"]}',
  '{"primaryColor": "#059669", "successColor": "#059669", "warningColor": "#D97706", "dangerColor": "#DC2626"}'
),
('fr', 'French', 'Français', 'ltr', 'latin',
  '{"gradeSystem": "CP-Terminale", "academicYear": "September-July", "culturalHolidays": ["Christmas", "Easter", "Bastille Day"]}',
  '{"primaryColor": "#3B82F6", "successColor": "#10B981", "warningColor": "#F59E0B", "dangerColor": "#EF4444"}'
),
('zh', 'Chinese (Simplified)', '简体中文', 'ltr', 'chinese',
  '{"gradeSystem": "小学-高中", "academicYear": "September-July", "culturalHolidays": ["Spring Festival", "Mid-Autumn Festival", "National Day"]}',
  '{"primaryColor": "#DC2626", "successColor": "#DC2626", "warningColor": "#F59E0B", "dangerColor": "#000000"}'
),
('ko', 'Korean', '한국어', 'ltr', 'korean',
  '{"gradeSystem": "초등-고등", "academicYear": "March-February", "culturalHolidays": ["Lunar New Year", "Chuseok", "Children\'s Day"]}',
  '{"primaryColor": "#3B82F6", "successColor": "#10B981", "warningColor": "#F59E0B", "dangerColor": "#EF4444"}'
),
('hi', 'Hindi', 'हिन्दी', 'ltr', 'devanagari',
  '{"gradeSystem": "Primary-Senior Secondary", "academicYear": "April-March", "culturalHolidays": ["Diwali", "Holi", "Independence Day"]}',
  '{"primaryColor": "#F97316", "successColor": "#059669", "warningColor": "#D97706", "dangerColor": "#DC2626"}'
),
('pt', 'Portuguese', 'Português', 'ltr', 'latin',
  '{"gradeSystem": "Fundamental-Médio", "academicYear": "February-December", "culturalHolidays": ["Christmas", "Carnival", "Independence Day"]}',
  '{"primaryColor": "#059669", "successColor": "#10B981", "warningColor": "#F59E0B", "dangerColor": "#EF4444"}'
);

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_supported_locales_updated_at BEFORE UPDATE ON supported_locales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_localized_content_updated_at BEFORE UPDATE ON localized_content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cultural_adaptations_updated_at BEFORE UPDATE ON cultural_adaptations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_translator_profiles_updated_at BEFORE UPDATE ON translator_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_translation_workflows_updated_at BEFORE UPDATE ON translation_workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cultural_partners_updated_at BEFORE UPDATE ON cultural_partners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();