#!/bin/bash

# API-based Publishing Workflow Test
# Tests the complete workflow: WRITER → STORY_MANAGER → BOOK_MANAGER → CONTENT_ADMIN → PUBLISHED

set -e

BASE_URL="${BASE_URL:-http://localhost:8001}"
OUTPUT_DIR="test-results/api-workflow"
mkdir -p "$OUTPUT_DIR"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Publishing Workflow API Test${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to login and get session cookie, returns user ID
login() {
    local email=$1
    local password=$2
    local role=$3

    echo -e "${YELLOW}🔐 Logging in as $role ($email)...${NC}" >&2

    # Get CSRF token
    local csrf_response=$(curl -s -c "$OUTPUT_DIR/cookies-$role.txt" \
        "$BASE_URL/api/auth/csrf")
    local csrf_token=$(echo $csrf_response | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)

    # Login with credentials
    local login_response=$(curl -s -b "$OUTPUT_DIR/cookies-$role.txt" \
        -c "$OUTPUT_DIR/cookies-$role.txt" \
        -X POST "$BASE_URL/api/auth/callback/credentials" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$email\",\"password\":\"$password\",\"csrfToken\":\"$csrf_token\",\"callbackUrl\":\"$BASE_URL/dashboard\",\"json\":true}")

    echo "$login_response" > "$OUTPUT_DIR/login-$role.json"

    # Verify session and extract user ID
    local session_response=$(curl -s -b "$OUTPUT_DIR/cookies-$role.txt" \
        "$BASE_URL/api/auth/session")

    if echo "$session_response" | grep -q "\"user\""; then
        echo -e "${GREEN}✓ Logged in successfully as $role${NC}" >&2
        echo "$session_response" > "$OUTPUT_DIR/session-$role.json"

        # Extract and return user ID from session (without trailing newline)
        local user_id=$(echo "$session_response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4 | tr -d '\n')
        printf "%s" "$user_id"
        return 0
    else
        echo -e "${RED}✗ Login failed for $role${NC}" >&2
        echo "$session_response" >&2
        return 1
    fi
}

# Step 1: WRITER - Create and submit story
test_writer_submission() {
    echo ""
    echo -e "${BLUE}=== STEP 1: WRITER SUBMISSION ===${NC}"

    WRITER_ID=$(login "writer@test.1001stories.org" "test1234" "writer")

    # Create story submission
    echo -e "${YELLOW}📝 Creating story submission...${NC}"

    local story_data='{
        "title": "Maya'\''s Golden Seed Discovery",
        "authorAlias": "Test Author",
        "content": "<p>Once upon a time, in a small village nestled between mountains, there lived a curious child named Maya.</p><p>Maya loved to explore the forests around her home, discovering new plants and animals every day.</p><p>One day, she found a mysterious golden seed that would change her life forever. The seed glowed with a warm, magical light that seemed to whisper ancient secrets.</p>",
        "summary": "A story about Maya, a curious child who discovers a magical golden seed in the forest that changes her life.",
        "language": "en",
        "ageRange": "8-12",
        "category": ["adventure", "fantasy"],
        "tags": ["discovery", "nature", "magic"],
        "copyrightConfirmed": true,
        "originalWork": true,
        "licenseType": "CC-BY-SA",
        "termsAccepted": true
    }'

    local create_response=$(curl -s -b "$OUTPUT_DIR/cookies-writer.txt" \
        -X POST "$BASE_URL/api/text-submissions" \
        -H "Content-Type: application/json" \
        -d "$story_data")

    echo "$create_response" > "$OUTPUT_DIR/01-writer-create.json"

    # Extract submission ID
    SUBMISSION_ID=$(echo "$create_response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

    if [ -z "$SUBMISSION_ID" ]; then
        echo -e "${RED}✗ Failed to create submission${NC}"
        echo "$create_response"
        return 1
    fi

    echo -e "${GREEN}✓ Story created with ID: $SUBMISSION_ID${NC}"

    # Submit for review using action parameter
    echo -e "${YELLOW}📤 Submitting for review...${NC}"

    local submit_response=$(curl -s -b "$OUTPUT_DIR/cookies-writer.txt" \
        -X PUT "$BASE_URL/api/text-submissions/$SUBMISSION_ID" \
        -H "Content-Type: application/json" \
        -d '{"action":"submit"}')

    echo "$submit_response" > "$OUTPUT_DIR/02-writer-submit.json"

    local json_response="$submit_response"

    if echo "$json_response" | grep -q '"status"'; then
        local new_status=$(echo "$json_response" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
        echo -e "${GREEN}✓ Story submitted for review (Status: $new_status)${NC}"
        return 0
    else
        echo -e "${RED}✗ Failed to submit story${NC}"
        echo "Response: $json_response"
        return 1
    fi
}

# Step 2: STORY_MANAGER - Review and approve
test_story_manager_review() {
    echo ""
    echo -e "${BLUE}=== STEP 2: STORY_MANAGER ASSIGNMENT & REVIEW ===${NC}"

    # First, get story manager ID
    STORY_MANAGER_ID=$(login "story-manager@test.1001stories.org" "test1234" "story-manager")

    # Then login as CONTENT_ADMIN to assign the story manager
    echo -e "${YELLOW}📝 Logging in as Content Admin to assign Story Manager...${NC}"
    TEMP_ADMIN_ID=$(login "content-admin@test.1001stories.org" "test1234" "content-admin-temp")

    # Get pending submissions
    echo -e "${YELLOW}📋 Fetching pending submissions...${NC}"

    local submissions=$(curl -s -b "$OUTPUT_DIR/cookies-content-admin-temp.txt" \
        "$BASE_URL/api/text-submissions?status=PENDING")

    echo "$submissions" > "$OUTPUT_DIR/03-story-manager-queue.json"

    # Assign story manager using CONTENT_ADMIN permissions
    echo -e "${YELLOW}📝 Assigning story manager...${NC}"

    # Create JSON payload in a temp file to avoid control character issues
    cat > "$OUTPUT_DIR/assign-story-manager.json" <<EOF
{"action":"assign_story_manager","storyManagerId":"$STORY_MANAGER_ID"}
EOF

    local assign_response=$(curl -s -b "$OUTPUT_DIR/cookies-content-admin-temp.txt" \
        -X PUT "$BASE_URL/api/text-submissions/$SUBMISSION_ID" \
        -H "Content-Type: application/json" \
        -d @"$OUTPUT_DIR/assign-story-manager.json")

    echo "$assign_response" > "$OUTPUT_DIR/03b-story-manager-assign.json"

    # Verify assignment succeeded
    if ! echo "$assign_response" | grep -q "STORY_REVIEW"; then
        echo -e "${RED}✗ Failed to assign story manager${NC}"
        echo "$assign_response"
        return 1
    fi

    echo -e "${GREEN}✓ Story manager assigned (Status: STORY_REVIEW)${NC}"

    # Now, STORY_MANAGER can approve the story
    echo -e "${YELLOW}✅ Approving story as Story Manager...${NC}"

    local approve_response=$(curl -s -b "$OUTPUT_DIR/cookies-story-manager.txt" \
        -X PUT "$BASE_URL/api/text-submissions/$SUBMISSION_ID" \
        -H "Content-Type: application/json" \
        -d '{"action":"story_approve","feedback":"Great story! Well written and engaging for the target age group."}')

    echo "$approve_response" > "$OUTPUT_DIR/04-story-manager-approve.json"

    if echo "$approve_response" | grep -q "STORY_APPROVED"; then
        echo -e "${GREEN}✓ Story approved by Story Manager (Status: STORY_APPROVED)${NC}"
        return 0
    else
        echo -e "${RED}✗ Failed to approve story${NC}"
        echo "$approve_response"
        return 1
    fi
}

# Step 3: BOOK_MANAGER - Decide format
test_book_manager_decision() {
    echo ""
    echo -e "${BLUE}=== STEP 3: BOOK_MANAGER ASSIGNMENT & FORMAT DECISION ===${NC}"

    # First, get book manager ID
    BOOK_MANAGER_ID=$(login "book-manager@test.1001stories.org" "test1234" "book-manager")

    # Use existing CONTENT_ADMIN session to assign book manager
    echo -e "${YELLOW}📝 Assigning book manager (using Content Admin)...${NC}"

    # Get approved stories
    echo -e "${YELLOW}📚 Fetching approved stories...${NC}"

    local stories=$(curl -s -b "$OUTPUT_DIR/cookies-content-admin-temp.txt" \
        "$BASE_URL/api/text-submissions?status=STORY_APPROVED")

    echo "$stories" > "$OUTPUT_DIR/05-book-manager-queue.json"

    # Assign book manager using CONTENT_ADMIN permissions
    # Create JSON payload in a temp file to avoid control character issues
    cat > "$OUTPUT_DIR/assign-book-manager.json" <<EOF
{"action":"assign_book_manager","bookManagerId":"$BOOK_MANAGER_ID"}
EOF

    local assign_bm_response=$(curl -s -b "$OUTPUT_DIR/cookies-content-admin-temp.txt" \
        -X PUT "$BASE_URL/api/text-submissions/$SUBMISSION_ID" \
        -H "Content-Type: application/json" \
        -d @"$OUTPUT_DIR/assign-book-manager.json")

    echo "$assign_bm_response" > "$OUTPUT_DIR/05b-book-manager-assign.json"

    # Verify assignment succeeded
    if ! echo "$assign_bm_response" | grep -q "FORMAT_REVIEW"; then
        echo -e "${RED}✗ Failed to assign book manager${NC}"
        echo "$assign_bm_response"
        return 1
    fi

    echo -e "${GREEN}✓ Book manager assigned (Status: FORMAT_REVIEW)${NC}"

    # Now BOOK_MANAGER can decide format
    echo -e "${YELLOW}📖 Deciding publication format as Book Manager...${NC}"

    local decide_response=$(curl -s -b "$OUTPUT_DIR/cookies-book-manager.txt" \
        -X PUT "$BASE_URL/api/text-submissions/$SUBMISSION_ID" \
        -H "Content-Type: application/json" \
        -d '{"action":"format_decision","decision":"TEXT"}')

    echo "$decide_response" > "$OUTPUT_DIR/06-book-manager-decide.json"

    if echo "$decide_response" | grep -q "CONTENT_REVIEW"; then
        echo -e "${GREEN}✓ Format decided: TEXT (Status: CONTENT_REVIEW)${NC}"
        return 0
    else
        echo -e "${RED}✗ Failed to decide format${NC}"
        echo "$decide_response"
        return 1
    fi
}

# Step 4: CONTENT_ADMIN - Final approval and publish
test_content_admin_publish() {
    echo ""
    echo -e "${BLUE}=== STEP 4: CONTENT_ADMIN FINAL APPROVAL ===${NC}"

    CONTENT_ADMIN_ID=$(login "content-admin@test.1001stories.org" "test1234" "content-admin")

    # Get content for review
    echo -e "${YELLOW}🔍 Fetching content for review...${NC}"

    local content=$(curl -s -b "$OUTPUT_DIR/cookies-content-admin.txt" \
        "$BASE_URL/api/text-submissions?status=CONTENT_REVIEW")

    echo "$content" > "$OUTPUT_DIR/07-content-admin-queue.json"

    # Publish using action parameter
    echo -e "${YELLOW}🚀 Publishing to library...${NC}"

    local publish_response=$(curl -s -b "$OUTPUT_DIR/cookies-content-admin.txt" \
        -X PUT "$BASE_URL/api/text-submissions/$SUBMISSION_ID" \
        -H "Content-Type: application/json" \
        -d '{"action":"final_approve","notes":"Approved for publication. Excellent contribution."}')

    echo "$publish_response" > "$OUTPUT_DIR/08-content-admin-publish.json"

    if echo "$publish_response" | grep -q "PUBLISHED"; then
        echo -e "${GREEN}✓ Story published successfully! (Status: PUBLISHED)${NC}"
        return 0
    else
        echo -e "${RED}✗ Failed to publish story${NC}"
        echo "$publish_response"
        return 1
    fi
}

# Step 5: Verify published content
test_verify_publication() {
    echo ""
    echo -e "${BLUE}=== STEP 5: VERIFY PUBLICATION ===${NC}"

    # Get final submission state
    local final_state=$(curl -s -b "$OUTPUT_DIR/cookies-content-admin.txt" \
        "$BASE_URL/api/text-submissions/$SUBMISSION_ID")

    echo "$final_state" > "$OUTPUT_DIR/09-final-state.json"

    if echo "$final_state" | grep -q '"status":"PUBLISHED"' && \
       echo "$final_state" | grep -q '"publishedAt"'; then
        echo -e "${GREEN}✓ Publication verified in database${NC}"
        echo -e "${GREEN}✓ Published at: $(echo $final_state | grep -o '"publishedAt":"[^"]*"' | cut -d'"' -f4)${NC}"
        return 0
    else
        echo -e "${RED}✗ Publication verification failed${NC}"
        echo "$final_state"
        return 1
    fi
}

# Main execution
main() {
    echo -e "${YELLOW}Starting API-based workflow test...${NC}"
    echo -e "${YELLOW}Test results will be saved to: $OUTPUT_DIR${NC}"
    echo ""

    # Run all steps
    if test_writer_submission && \
       test_story_manager_review && \
       test_book_manager_decision && \
       test_content_admin_publish && \
       test_verify_publication; then
        echo ""
        echo -e "${GREEN}========================================${NC}"
        echo -e "${GREEN}✅ ALL TESTS PASSED!${NC}"
        echo -e "${GREEN}========================================${NC}"
        echo ""
        echo -e "${GREEN}Publishing workflow completed successfully:${NC}"
        echo -e "${GREEN}  WRITER → STORY_MANAGER → BOOK_MANAGER → CONTENT_ADMIN → PUBLISHED${NC}"
        echo ""
        echo -e "${BLUE}Test results saved in: $OUTPUT_DIR${NC}"
        echo -e "${BLUE}Submission ID: $SUBMISSION_ID${NC}"
        exit 0
    else
        echo ""
        echo -e "${RED}========================================${NC}"
        echo -e "${RED}❌ TESTS FAILED${NC}"
        echo -e "${RED}========================================${NC}"
        echo ""
        echo -e "${RED}Check error logs in: $OUTPUT_DIR${NC}"
        exit 1
    fi
}

# Run main function
main
