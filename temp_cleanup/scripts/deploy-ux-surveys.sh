#!/bin/bash

# UX Survey Deployment Script
# Automatically deploys targeted surveys for role system validation

set -e

# Configuration
API_BASE_URL="http://localhost:3000/api"
ADMIN_TOKEN=${ADMIN_TOKEN:-""}  # Set via environment variable
SURVEYS_DIR="./config/surveys"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Create surveys directory and default surveys
create_default_surveys() {
    log_info "Creating default UX research surveys"
    
    mkdir -p "$SURVEYS_DIR"
    
    # Role Migration Satisfaction Survey
    cat > "$SURVEYS_DIR/role_migration_satisfaction.json" << 'EOF'
{
  "name": "Role System Changes Feedback",
  "description": "Help us understand how the role system changes have affected your experience",
  "trigger": "TIME_DELAY",
  "targetPage": "/dashboard",
  "targetRole": ["LEARNER", "CUSTOMER"],
  "frequency": "ONCE",
  "displayType": "MODAL",
  "position": "center",
  "delay": 10000,
  "questions": [
    {
      "id": "overall_satisfaction",
      "type": "rating",
      "question": "How satisfied are you with the recent changes to your account?",
      "required": true,
      "options": ["1", "2", "3", "4", "5"],
      "scale": {
        "min": 1,
        "max": 5,
        "minLabel": "Very Dissatisfied",
        "maxLabel": "Very Satisfied"
      }
    },
    {
      "id": "ease_of_use",
      "type": "choice",
      "question": "How would you describe the ease of using the platform now?",
      "required": true,
      "options": [
        "Much easier than before",
        "Somewhat easier",
        "About the same",
        "Somewhat harder",
        "Much harder than before"
      ]
    },
    {
      "id": "specific_issues",
      "type": "multiChoice",
      "question": "Have you experienced any of these issues? (Select all that apply)",
      "required": false,
      "options": [
        "Cannot find features I used to use",
        "Navigation is confusing",
        "Lost access to content",
        "Account settings are unclear",
        "Performance issues",
        "No issues"
      ]
    },
    {
      "id": "additional_feedback",
      "type": "text",
      "question": "Is there anything specific you'd like us to improve?",
      "required": false
    }
  ]
}
EOF

    # New User Onboarding Survey
    cat > "$SURVEYS_DIR/new_user_onboarding.json" << 'EOF'
{
  "name": "New User Experience",
  "description": "Help us improve the experience for new users",
  "trigger": "TIME_DELAY",
  "targetPage": "/dashboard",
  "targetRole": [],
  "frequency": "ONCE",
  "displayType": "SLIDE_IN",
  "position": "bottom-right",
  "delay": 30000,
  "questions": [
    {
      "id": "signup_experience",
      "type": "rating",
      "question": "How easy was the signup process?",
      "required": true,
      "options": ["1", "2", "3", "4", "5"],
      "scale": {
        "min": 1,
        "max": 5,
        "minLabel": "Very Difficult",
        "maxLabel": "Very Easy"
      }
    },
    {
      "id": "feature_discovery",
      "type": "choice",
      "question": "How easy is it to find what you're looking for?",
      "required": true,
      "options": [
        "Very easy - everything is clear",
        "Mostly easy - found most things",
        "Somewhat difficult - needed to search",
        "Very difficult - couldn't find what I needed"
      ]
    },
    {
      "id": "next_steps",
      "type": "choice",
      "question": "What would you like to do next on the platform?",
      "required": false,
      "options": [
        "Read stories",
        "Explore the library",
        "Learn about volunteering",
        "Make a donation",
        "Contact support",
        "Not sure"
      ]
    }
  ]
}
EOF

    # Feature Usage Survey
    cat > "$SURVEYS_DIR/feature_usage_feedback.json" << 'EOF'
{
  "name": "Feature Usage Feedback",
  "description": "Quick feedback on specific features",
  "trigger": "FEATURE_USE",
  "targetPage": null,
  "targetRole": [],
  "frequency": "WEEKLY",
  "displayType": "BANNER",
  "position": "top",
  "delay": 5000,
  "questions": [
    {
      "id": "feature_usefulness",
      "type": "scale",
      "question": "How useful was this feature for what you wanted to accomplish?",
      "required": true,
      "scale": {
        "min": 1,
        "max": 10,
        "minLabel": "Not useful",
        "maxLabel": "Very useful"
      }
    },
    {
      "id": "feature_difficulty",
      "type": "choice",
      "question": "How easy was this feature to use?",
      "required": true,
      "options": [
        "Very easy",
        "Easy",
        "Neutral",
        "Difficult",
        "Very difficult"
      ]
    },
    {
      "id": "improvement_suggestions",
      "type": "text",
      "question": "How could we improve this feature?",
      "required": false
    }
  ]
}
EOF

    log_success "Default surveys created in $SURVEYS_DIR"
}

# Deploy a survey
deploy_survey() {
    local survey_file="$1"
    
    if [ ! -f "$survey_file" ]; then
        log_error "Survey file not found: $survey_file"
        return 1
    fi
    
    log_info "Deploying survey: $(basename "$survey_file")"
    
    # Validate JSON
    if ! jq empty "$survey_file" 2>/dev/null; then
        log_error "Invalid JSON in survey file: $survey_file"
        return 1
    fi
    
    # Deploy to API
    local response
    response=$(curl -s -X POST "${API_BASE_URL}/surveys/active" \
                    -H "Content-Type: application/json" \
                    -H "Authorization: Bearer ${ADMIN_TOKEN}" \
                    -d @"$survey_file")
    
    if [ $? -eq 0 ]; then
        # Check if deployment was successful
        if echo "$response" | jq -e '.success' >/dev/null 2>&1; then
            local survey_id
            survey_id=$(echo "$response" | jq -r '.survey.id')
            log_success "Survey deployed successfully (ID: $survey_id)"
            return 0
        else
            log_error "Survey deployment failed: $(echo "$response" | jq -r '.error // "Unknown error"')"
            return 1
        fi
    else
        log_error "Failed to connect to API"
        return 1
    fi
}

# Deploy all surveys in directory
deploy_all_surveys() {
    local deployed=0
    local failed=0
    
    log_info "Deploying all surveys from $SURVEYS_DIR"
    
    for survey_file in "$SURVEYS_DIR"/*.json; do
        if [ -f "$survey_file" ]; then
            if deploy_survey "$survey_file"; then
                ((deployed++))
            else
                ((failed++))
            fi
        fi
    done
    
    log_info "Deployment complete: $deployed deployed, $failed failed"
    
    if [ $failed -gt 0 ]; then
        return 1
    fi
}

# List active surveys
list_active_surveys() {
    log_info "Fetching active surveys"
    
    local response
    response=$(curl -s -X GET "${API_BASE_URL}/surveys/active" \
                    -H "Content-Type: application/json")
    
    if [ $? -eq 0 ]; then
        if command -v jq &> /dev/null; then
            echo "$response" | jq -r '.[] | "- \(.name) (ID: \(.id), Target: \(.targetRole // ["All"] | join(", ")))"'
        else
            echo "$response"
        fi
    else
        log_error "Failed to fetch active surveys"
        return 1
    fi
}

# Create targeted survey based on parameters
create_targeted_survey() {
    local survey_name="$1"
    local target_role="$2"
    local target_page="$3"
    
    log_info "Creating targeted survey: $survey_name"
    
    local survey_file="$SURVEYS_DIR/targeted_${survey_name,,}_$(date +%s).json"
    
    case "$survey_name" in
        "AdminFeedback")
            cat > "$survey_file" << EOF
{
  "name": "Admin Dashboard Feedback",
  "description": "Feedback on administrative features and dashboard",
  "trigger": "TIME_DELAY",
  "targetPage": "${target_page:-"/admin"}",
  "targetRole": ["${target_role:-"ADMIN"}"],
  "frequency": "WEEKLY",
  "displayType": "MODAL",
  "delay": 15000,
  "questions": [
    {
      "id": "admin_efficiency",
      "type": "rating",
      "question": "How efficient are the admin tools for your daily tasks?",
      "required": true,
      "options": ["1", "2", "3", "4", "5"]
    },
    {
      "id": "missing_features",
      "type": "text",
      "question": "What admin features are you missing or would like to see improved?",
      "required": false
    }
  ]
}
EOF
            ;;
        "LibraryUsage")
            cat > "$survey_file" << EOF
{
  "name": "Library Usage Experience",
  "description": "Feedback on library and content discovery",
  "trigger": "PAGE_LOAD",
  "targetPage": "${target_page:-"/library"}",
  "targetRole": [],
  "frequency": "ONCE",
  "displayType": "SLIDE_IN",
  "delay": 20000,
  "questions": [
    {
      "id": "content_discovery",
      "type": "choice",
      "question": "How easy is it to find content you're interested in?",
      "required": true,
      "options": ["Very easy", "Easy", "Neutral", "Difficult", "Very difficult"]
    },
    {
      "id": "content_quality",
      "type": "rating",
      "question": "How would you rate the quality of the content?",
      "required": true,
      "options": ["1", "2", "3", "4", "5"]
    }
  ]
}
EOF
            ;;
        *)
            log_error "Unknown survey type: $survey_name"
            return 1
            ;;
    esac
    
    log_success "Targeted survey created: $survey_file"
    echo "$survey_file"
}

# Show usage information
show_usage() {
    cat << EOF
Usage: $0 [COMMAND] [OPTIONS]

Commands:
    create-defaults     Create default UX research surveys
    deploy-all         Deploy all surveys from $SURVEYS_DIR
    deploy <file>      Deploy specific survey file
    list              List active surveys
    create-target     Create targeted survey

Examples:
    $0 create-defaults
    $0 deploy-all
    $0 deploy $SURVEYS_DIR/role_migration_satisfaction.json
    $0 list
    $0 create-target AdminFeedback ADMIN /admin

Environment Variables:
    ADMIN_TOKEN       Admin API token for authentication
    API_BASE_URL      Base URL for API (default: http://localhost:3000/api)

Survey Types for create-target:
    AdminFeedback     Survey for admin users
    LibraryUsage      Survey for library usage

EOF
}

# Main execution
main() {
    local command="$1"
    
    case "$command" in
        "create-defaults")
            create_default_surveys
            ;;
        "deploy-all")
            if [ ! -d "$SURVEYS_DIR" ]; then
                log_error "Surveys directory not found: $SURVEYS_DIR"
                log_info "Run '$0 create-defaults' first"
                exit 1
            fi
            deploy_all_surveys
            ;;
        "deploy")
            local survey_file="$2"
            if [ -z "$survey_file" ]; then
                log_error "Survey file path required"
                show_usage
                exit 1
            fi
            deploy_survey "$survey_file"
            ;;
        "list")
            list_active_surveys
            ;;
        "create-target")
            local survey_type="$2"
            local role="$3"
            local page="$4"
            if [ -z "$survey_type" ]; then
                log_error "Survey type required"
                show_usage
                exit 1
            fi
            local created_file
            created_file=$(create_targeted_survey "$survey_type" "$role" "$page")
            if [ $? -eq 0 ]; then
                log_info "Would you like to deploy this survey now? (y/n)"
                read -r response
                if [[ "$response" =~ ^[Yy]$ ]]; then
                    deploy_survey "$created_file"
                fi
            fi
            ;;
        "-h"|"--help"|"help"|"")
            show_usage
            ;;
        *)
            log_error "Unknown command: $command"
            show_usage
            exit 1
            ;;
    esac
}

# Check dependencies
check_dependencies() {
    if ! command -v curl &> /dev/null; then
        log_error "curl is required but not installed"
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        log_warning "jq is not installed - some features will be limited"
    fi
}

# Check dependencies and run
check_dependencies
main "$@"