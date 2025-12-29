#!/bin/bash

# FrozenShield API Manual Testing Script
# This script provides comprehensive manual tests for all API endpoints
#
# Usage: ./manual-tests.sh [base_url]
# Example: ./manual-tests.sh http://localhost:5000
#
# Requirements:
# - curl (for making HTTP requests)
# - jq (for JSON parsing - optional but recommended)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Base URL (default to localhost)
BASE_URL="${1:-http://localhost:5000}"
API_URL="${BASE_URL}/api"

# Test results tracking
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Token storage
TOKEN=""
ADMIN_ID=""

# Helper functions
print_header() {
    echo -e "\n${BLUE}=====================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}=====================================${NC}\n"
}

print_test() {
    echo -e "${YELLOW}TEST:${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓ PASS:${NC} $1"
    ((TESTS_PASSED++))
    ((TESTS_TOTAL++))
}

print_fail() {
    echo -e "${RED}✗ FAIL:${NC} $1"
    ((TESTS_FAILED++))
    ((TESTS_TOTAL++))
}

print_info() {
    echo -e "${BLUE}INFO:${NC} $1"
}

# Make HTTP request and check response
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local headers=$4
    local expected_code=$5

    local response
    local http_code

    if [ -n "$data" ] && [ -n "$headers" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "${API_URL}${endpoint}" \
            -H "Content-Type: application/json" \
            -H "$headers" \
            -d "$data")
    elif [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "${API_URL}${endpoint}" \
            -H "Content-Type: application/json" \
            -d "$data")
    elif [ -n "$headers" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "${API_URL}${endpoint}" \
            -H "$headers")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "${API_URL}${endpoint}")
    fi

    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" -eq "$expected_code" ]; then
        echo "$body"
        return 0
    else
        echo "$body"
        return 1
    fi
}

# Check if server is running
check_server() {
    print_header "CHECKING SERVER STATUS"

    print_test "Server health check"
    local response
    response=$(curl -s "${API_URL}/health")

    if echo "$response" | grep -q "healthy"; then
        print_success "Server is running and healthy"
        print_info "Response: $response"
        return 0
    else
        print_fail "Server is not responding correctly"
        print_info "Response: $response"
        return 1
    fi
}

# Test authentication endpoints
test_authentication() {
    print_header "TESTING AUTHENTICATION ENDPOINTS"

    # Test 1: Register admin (may fail if admin already exists)
    print_test "POST /api/auth/register - Register first admin"
    local register_response
    register_response=$(make_request "POST" "/auth/register" \
        '{
            "username": "testadmin",
            "email": "admin@test.com",
            "password": "TestPassword123!"
        }' "" 201)

    if [ $? -eq 0 ]; then
        TOKEN=$(echo "$register_response" | grep -o '"token":"[^"]*' | sed 's/"token":"//')
        ADMIN_ID=$(echo "$register_response" | grep -o '"id":"[^"]*' | sed 's/"id":"//')
        print_success "Admin registered successfully"
        print_info "Token saved for subsequent tests"
    else
        # If registration fails, try to login instead
        print_info "Registration failed (admin may already exist), trying login..."

        print_test "POST /api/auth/login - Login existing admin"
        local login_response
        login_response=$(make_request "POST" "/auth/login" \
            '{
                "username": "testadmin",
                "password": "TestPassword123!"
            }' "" 200)

        if [ $? -eq 0 ]; then
            TOKEN=$(echo "$login_response" | grep -o '"token":"[^"]*' | sed 's/"token":"//')
            ADMIN_ID=$(echo "$login_response" | grep -o '"id":"[^"]*' | sed 's/"id":"//')
            print_success "Login successful"
            print_info "Token saved for subsequent tests"
        else
            print_fail "Login failed"
            print_info "Cannot continue with authenticated tests"
        fi
    fi

    # Test 2: Login validation - missing credentials
    print_test "POST /api/auth/login - Missing credentials (should fail)"
    make_request "POST" "/auth/login" \
        '{
            "username": "",
            "password": ""
        }' "" 400 > /dev/null

    if [ $? -eq 0 ]; then
        print_success "Correctly rejected empty credentials"
    else
        print_fail "Did not reject empty credentials"
    fi

    # Test 3: Login with wrong password
    print_test "POST /api/auth/login - Wrong password (should fail)"
    make_request "POST" "/auth/login" \
        '{
            "username": "testadmin",
            "password": "WrongPassword123!"
        }' "" 401 > /dev/null

    if [ $? -eq 0 ]; then
        print_success "Correctly rejected wrong password"
    else
        print_fail "Did not reject wrong password"
    fi

    # Test 4: Get current admin (authenticated)
    if [ -n "$TOKEN" ]; then
        print_test "GET /api/auth/me - Get current admin"
        make_request "GET" "/auth/me" "" "Authorization: Bearer $TOKEN" 200 > /dev/null

        if [ $? -eq 0 ]; then
            print_success "Retrieved current admin successfully"
        else
            print_fail "Failed to retrieve current admin"
        fi
    fi

    # Test 5: Get admin without token (should fail)
    print_test "GET /api/auth/me - Without token (should fail)"
    make_request "GET" "/auth/me" "" "" 401 > /dev/null

    if [ $? -eq 0 ]; then
        print_success "Correctly rejected request without token"
    else
        print_fail "Did not reject request without token"
    fi
}

# Test project endpoints
test_projects() {
    print_header "TESTING PROJECT ENDPOINTS"

    local PROJECT_ID=""

    # Test 1: Get all projects (public)
    print_test "GET /api/projects - Get all projects"
    make_request "GET" "/projects" "" "" 200 > /dev/null

    if [ $? -eq 0 ]; then
        print_success "Retrieved all projects"
    else
        print_fail "Failed to retrieve projects"
    fi

    # Test 2: Get featured projects (public)
    print_test "GET /api/projects/featured - Get featured projects"
    make_request "GET" "/projects/featured" "" "" 200 > /dev/null

    if [ $? -eq 0 ]; then
        print_success "Retrieved featured projects"
    else
        print_fail "Failed to retrieve featured projects"
    fi

    # Test 3: Create project without auth (should fail)
    print_test "POST /api/projects - Without auth (should fail)"
    make_request "POST" "/projects" \
        '{
            "title": "Test Project",
            "description": "This should fail"
        }' "" 401 > /dev/null

    if [ $? -eq 0 ]; then
        print_success "Correctly rejected unauthenticated project creation"
    else
        print_fail "Did not reject unauthenticated request"
    fi

    # Test 4: Create project with auth
    if [ -n "$TOKEN" ]; then
        print_test "POST /api/projects - Create project with auth"
        local create_response
        create_response=$(make_request "POST" "/projects" \
            '{
                "title": "Test API Project",
                "description": "A project created during API testing",
                "imageUrl": "https://example.com/test-image.jpg",
                "tags": ["Testing", "API", "Node.js"],
                "projectUrl": "https://example.com",
                "featured": true,
                "order": 99
            }' "Authorization: Bearer $TOKEN" 201)

        if [ $? -eq 0 ]; then
            PROJECT_ID=$(echo "$create_response" | grep -o '"_id":"[^"]*' | sed 's/"_id":"//' | head -1)
            print_success "Created project successfully"
            print_info "Project ID: $PROJECT_ID"
        else
            print_fail "Failed to create project"
        fi
    fi

    # Test 5: Create project missing required fields
    if [ -n "$TOKEN" ]; then
        print_test "POST /api/projects - Missing required fields (should fail)"
        make_request "POST" "/projects" \
            '{
                "title": "Test Project"
            }' "Authorization: Bearer $TOKEN" 400 > /dev/null

        if [ $? -eq 0 ]; then
            print_success "Correctly rejected project with missing fields"
        else
            print_fail "Did not reject project with missing fields"
        fi
    fi

    # Test 6: Get single project
    if [ -n "$PROJECT_ID" ]; then
        print_test "GET /api/projects/:id - Get single project"
        make_request "GET" "/projects/$PROJECT_ID" "" "" 200 > /dev/null

        if [ $? -eq 0 ]; then
            print_success "Retrieved single project"
        else
            print_fail "Failed to retrieve single project"
        fi
    fi

    # Test 7: Update project
    if [ -n "$TOKEN" ] && [ -n "$PROJECT_ID" ]; then
        print_test "PUT /api/projects/:id - Update project"
        make_request "PUT" "/projects/$PROJECT_ID" \
            '{
                "title": "Updated Test Project",
                "description": "Updated description",
                "featured": false
            }' "Authorization: Bearer $TOKEN" 200 > /dev/null

        if [ $? -eq 0 ]; then
            print_success "Updated project successfully"
        else
            print_fail "Failed to update project"
        fi
    fi

    # Test 8: Update project without auth (should fail)
    if [ -n "$PROJECT_ID" ]; then
        print_test "PUT /api/projects/:id - Without auth (should fail)"
        make_request "PUT" "/projects/$PROJECT_ID" \
            '{
                "title": "Hacked Project"
            }' "" 401 > /dev/null

        if [ $? -eq 0 ]; then
            print_success "Correctly rejected unauthenticated update"
        else
            print_fail "Did not reject unauthenticated update"
        fi
    fi

    # Test 9: Delete project without auth (should fail)
    if [ -n "$PROJECT_ID" ]; then
        print_test "DELETE /api/projects/:id - Without auth (should fail)"
        make_request "DELETE" "/projects/$PROJECT_ID" "" "" 401 > /dev/null

        if [ $? -eq 0 ]; then
            print_success "Correctly rejected unauthenticated delete"
        else
            print_fail "Did not reject unauthenticated delete"
        fi
    fi

    # Test 10: Delete project with auth
    if [ -n "$TOKEN" ] && [ -n "$PROJECT_ID" ]; then
        print_test "DELETE /api/projects/:id - Delete project with auth"
        make_request "DELETE" "/projects/$PROJECT_ID" "" "Authorization: Bearer $TOKEN" 200 > /dev/null

        if [ $? -eq 0 ]; then
            print_success "Deleted project successfully"
        else
            print_fail "Failed to delete project"
        fi
    fi

    # Test 11: Get deleted project (should fail)
    if [ -n "$PROJECT_ID" ]; then
        print_test "GET /api/projects/:id - Get deleted project (should fail)"
        make_request "GET" "/projects/$PROJECT_ID" "" "" 404 > /dev/null

        if [ $? -eq 0 ]; then
            print_success "Correctly returned 404 for deleted project"
        else
            print_fail "Did not return 404 for deleted project"
        fi
    fi
}

# Test contact endpoints
test_contact() {
    print_header "TESTING CONTACT ENDPOINTS"

    local CONTACT_ID=""

    # Test 1: Submit contact form
    print_test "POST /api/contact - Submit contact form"
    local contact_response
    contact_response=$(make_request "POST" "/contact" \
        '{
            "name": "Test User",
            "email": "testuser@example.com",
            "message": "This is a test message for API testing purposes.",
            "honeypot": ""
        }' "" 201)

    if [ $? -eq 0 ]; then
        CONTACT_ID=$(echo "$contact_response" | grep -o '"id":"[^"]*' | sed 's/"id":"//')
        print_success "Contact form submitted successfully"
        print_info "Contact ID: $CONTACT_ID"
    else
        print_fail "Failed to submit contact form"
    fi

    # Test 2: Submit with missing fields (should fail)
    print_test "POST /api/contact - Missing required fields (should fail)"
    make_request "POST" "/contact" \
        '{
            "name": "Test User",
            "email": "testuser@example.com"
        }' "" 400 > /dev/null

    if [ $? -eq 0 ]; then
        print_success "Correctly rejected submission with missing fields"
    else
        print_fail "Did not reject submission with missing fields"
    fi

    # Test 3: Submit with short message (should fail)
    print_test "POST /api/contact - Message too short (should fail)"
    make_request "POST" "/contact" \
        '{
            "name": "Test User",
            "email": "testuser@example.com",
            "message": "Short"
        }' "" 400 > /dev/null

    if [ $? -eq 0 ]; then
        print_success "Correctly rejected message that is too short"
    else
        print_fail "Did not reject short message"
    fi

    # Test 4: Submit with honeypot (spam protection)
    print_test "POST /api/contact - Honeypot field filled (spam)"
    make_request "POST" "/contact" \
        '{
            "name": "Spam Bot",
            "email": "spam@example.com",
            "message": "This is spam with honeypot filled",
            "honeypot": "I am a bot"
        }' "" 201 > /dev/null

    if [ $? -eq 0 ]; then
        print_success "Honeypot protection working (silent accept)"
    else
        print_fail "Honeypot protection not working correctly"
    fi

    # Test 5: Get contacts without auth (should fail)
    print_test "GET /api/contact - Without auth (should fail)"
    make_request "GET" "/contact" "" "" 401 > /dev/null

    if [ $? -eq 0 ]; then
        print_success "Correctly rejected unauthenticated access to contacts"
    else
        print_fail "Did not reject unauthenticated access"
    fi

    # Test 6: Get contacts with auth
    if [ -n "$TOKEN" ]; then
        print_test "GET /api/contact - Get all contacts with auth"
        make_request "GET" "/contact" "" "Authorization: Bearer $TOKEN" 200 > /dev/null

        if [ $? -eq 0 ]; then
            print_success "Retrieved all contacts successfully"
        else
            print_fail "Failed to retrieve contacts"
        fi
    fi

    # Test 7: Update contact status
    if [ -n "$TOKEN" ] && [ -n "$CONTACT_ID" ]; then
        print_test "PATCH /api/contact/:id - Update contact status"
        make_request "PATCH" "/contact/$CONTACT_ID" \
            '{
                "status": "responded",
                "notes": "Test note added during API testing"
            }' "Authorization: Bearer $TOKEN" 200 > /dev/null

        if [ $? -eq 0 ]; then
            print_success "Updated contact status successfully"
        else
            print_fail "Failed to update contact status"
        fi
    fi

    # Test 8: Update contact without auth (should fail)
    if [ -n "$CONTACT_ID" ]; then
        print_test "PATCH /api/contact/:id - Without auth (should fail)"
        make_request "PATCH" "/contact/$CONTACT_ID" \
            '{
                "status": "hacked"
            }' "" 401 > /dev/null

        if [ $? -eq 0 ]; then
            print_success "Correctly rejected unauthenticated update"
        else
            print_fail "Did not reject unauthenticated update"
        fi
    fi

    # Test 9: Delete contact without auth (should fail)
    if [ -n "$CONTACT_ID" ]; then
        print_test "DELETE /api/contact/:id - Without auth (should fail)"
        make_request "DELETE" "/contact/$CONTACT_ID" "" "" 401 > /dev/null

        if [ $? -eq 0 ]; then
            print_success "Correctly rejected unauthenticated delete"
        else
            print_fail "Did not reject unauthenticated delete"
        fi
    fi

    # Test 10: Delete contact with auth
    if [ -n "$TOKEN" ] && [ -n "$CONTACT_ID" ]; then
        print_test "DELETE /api/contact/:id - Delete contact with auth"
        make_request "DELETE" "/contact/$CONTACT_ID" "" "Authorization: Bearer $TOKEN" 200 > /dev/null

        if [ $? -eq 0 ]; then
            print_success "Deleted contact successfully"
        else
            print_fail "Failed to delete contact"
        fi
    fi
}

# Test SEO endpoints
test_seo() {
    print_header "TESTING SEO ENDPOINTS"

    # Test 1: Get sitemap.xml
    print_test "GET /sitemap.xml - Get sitemap"
    local sitemap_response
    sitemap_response=$(curl -s "${BASE_URL}/sitemap.xml")

    if echo "$sitemap_response" | grep -q "<?xml"; then
        print_success "Retrieved sitemap successfully"
    else
        print_fail "Failed to retrieve sitemap"
    fi

    # Test 2: Get structured data
    print_test "GET /structured-data.json - Get structured data"
    local structured_response
    structured_response=$(curl -s "${BASE_URL}/structured-data.json")

    if echo "$structured_response" | grep -q "@context"; then
        print_success "Retrieved structured data successfully"
    else
        print_fail "Failed to retrieve structured data"
    fi
}

# Test edge cases and security
test_edge_cases() {
    print_header "TESTING EDGE CASES & SECURITY"

    # Test 1: Invalid JSON
    print_test "Invalid JSON payload"
    local invalid_response
    invalid_response=$(curl -s -X POST "${API_URL}/auth/login" \
        -H "Content-Type: application/json" \
        -d 'invalid json{')

    # Most servers will return 400 or 500 for invalid JSON
    if echo "$invalid_response" | grep -qi "error\|invalid\|bad"; then
        print_success "Server handles invalid JSON appropriately"
    else
        print_fail "Server may not handle invalid JSON correctly"
    fi

    # Test 2: XSS attempt in contact form
    print_test "XSS attempt in contact form"
    make_request "POST" "/contact" \
        '{
            "name": "<script>alert(\"XSS\")</script>",
            "email": "test@example.com",
            "message": "Testing XSS with <img src=x onerror=alert(1)>"
        }' "" 201 > /dev/null

    if [ $? -eq 0 ]; then
        print_success "Server accepted input (check if sanitized in storage)"
        print_info "Manual verification needed: Check database for sanitization"
    else
        print_fail "Server rejected XSS test unexpectedly"
    fi

    # Test 3: Very long input
    print_test "Very long input string"
    local long_string=$(python -c "print('A' * 10000)" 2>/dev/null || echo "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA")
    make_request "POST" "/contact" \
        "{
            \"name\": \"Test\",
            \"email\": \"test@example.com\",
            \"message\": \"$long_string\"
        }" "" 201 > /dev/null

    if [ $? -eq 0 ]; then
        print_success "Server accepted very long input"
        print_info "Consider adding max length validation"
    else
        print_fail "Server rejected very long input"
    fi

    # Test 4: Invalid MongoDB ObjectId
    print_test "Invalid MongoDB ObjectId format"
    make_request "GET" "/projects/invalid-id-format" "" "" 500 > /dev/null

    if [ $? -eq 0 ]; then
        print_success "Server handles invalid ObjectId"
    else
        print_info "Server returned different status code for invalid ID"
    fi

    # Test 5: SQL Injection attempt (should not affect MongoDB)
    print_test "SQL Injection attempt"
    make_request "POST" "/auth/login" \
        '{
            "username": "admin\" OR \"1\"=\"1",
            "password": "anything"
        }' "" 401 > /dev/null

    if [ $? -eq 0 ]; then
        print_success "SQL injection attempt properly rejected"
    else
        print_fail "SQL injection handling unclear"
    fi
}

# Test rate limiting
test_rate_limiting() {
    print_header "TESTING RATE LIMITING"

    print_info "Note: Rate limiting tests may take several minutes"
    print_info "Contact form: 10 requests/hour, General API: 100 requests/15min"

    # Test contact form rate limiting (10/hour)
    print_test "Contact form rate limiting (11 requests rapidly)"
    local rate_limit_hit=false

    for i in {1..11}; do
        local response
        response=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/contact" \
            -H "Content-Type: application/json" \
            -d "{
                \"name\": \"Test $i\",
                \"email\": \"test$i@example.com\",
                \"message\": \"Rate limit test message number $i with sufficient length\"
            }")

        local http_code=$(echo "$response" | tail -n 1)

        if [ "$http_code" -eq 429 ]; then
            rate_limit_hit=true
            print_success "Rate limit triggered at request $i"
            break
        fi
    done

    if [ "$rate_limit_hit" = true ]; then
        print_success "Contact form rate limiting is working"
    else
        print_fail "Contact form rate limit not triggered after 11 requests"
        print_info "May need to check rate limiting configuration"
    fi
}

# Print test summary
print_summary() {
    print_header "TEST SUMMARY"

    echo -e "${BLUE}Total Tests:${NC} $TESTS_TOTAL"
    echo -e "${GREEN}Passed:${NC} $TESTS_PASSED"
    echo -e "${RED}Failed:${NC} $TESTS_FAILED"

    local pass_rate=0
    if [ $TESTS_TOTAL -gt 0 ]; then
        pass_rate=$((TESTS_PASSED * 100 / TESTS_TOTAL))
    fi

    echo -e "${BLUE}Pass Rate:${NC} ${pass_rate}%"

    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "\n${GREEN}All tests passed!${NC}"
        return 0
    else
        echo -e "\n${RED}Some tests failed. Please review the output above.${NC}"
        return 1
    fi
}

# Main execution
main() {
    clear
    print_header "FROZENSHIELD API TESTING SUITE"

    echo "Base URL: $BASE_URL"
    echo "API URL: $API_URL"
    echo ""

    # Check if server is running
    if ! check_server; then
        echo -e "\n${RED}Error: Server is not running or not responding${NC}"
        echo "Please start the server and try again."
        exit 1
    fi

    # Run test suites
    test_authentication
    test_projects
    test_contact
    test_seo
    test_edge_cases

    # Optional: Run rate limiting tests (takes time)
    read -p "Run rate limiting tests? (takes ~1 minute) [y/N]: " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        test_rate_limiting
    else
        print_info "Skipping rate limiting tests"
    fi

    # Print summary
    print_summary
}

# Run main function
main
