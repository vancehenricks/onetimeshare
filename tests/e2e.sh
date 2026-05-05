#!/bin/bash

# End-to-end (system) Tests for OneTimeShare API
# Tests all endpoints using curl

# Color handling (respect NO_COLOR)
if [ -n "$NO_COLOR" ]; then
  RED=''
  GREEN=''
  YELLOW=''
  BLUE=''
  NC=''
else
  RED='\033[0;31m'
  GREEN='\033[0;32m'
  YELLOW='\033[1;33m'
  BLUE='\033[0;34m'
  NC='\033[0m'
fi

TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

API_URL="${API_URL:-http://localhost:3000}"

log_pass() { printf "%b\n" "${GREEN}✓${NC} $1"; ((TESTS_PASSED++)); ((TESTS_RUN++)); }
log_fail() { printf "%b\n" "${RED}✗${NC} $1"; ((TESTS_FAILED++)); ((TESTS_RUN++)); }
log_test() { printf "%b\n" "${BLUE}→${NC} $1"; }
log_section() { printf "\n%b\n" "${YELLOW}## $1${NC}"; }

printf "%b\n" "${BLUE}╔════════════════════════════════════════╗"
printf "%b\n" "║  OneTimeShare API End-to-End Tests     ║"
printf "%b\n" "╚════════════════════════════════════════╝${NC}\n"

# Test 1: Server connectivity
log_section "Server Connectivity"
log_test "Checking if server is reachable"
if curl -s "$API_URL" > /dev/null 2>&1; then
  log_pass "Server is reachable"
else
  log_fail "Cannot reach server at $API_URL"
  exit 1
fi

# Test 2: Create secret
log_section "POST /api/secrets - Create Secret"
log_test "Creating secret with encrypted content"
RESPONSE=$(curl -s -X POST "$API_URL/api/secrets" \
  -H "Content-Type: application/json" \
  -d '{"encryptedContent":"ZCg/wm9sWWGXW8oc1Nb8fXdT9J21nw6ciCKMueNNzzzGi88DtV=="}')

if echo "$RESPONSE" | grep -q '"id"'; then
  log_pass "Response contains id"
else
  log_fail "Missing id in response: $RESPONSE"
fi

if echo "$RESPONSE" | grep -q '"shareUrl"'; then
  log_pass "Response contains shareUrl"
else
  log_fail "Missing shareUrl in response"
fi

if echo "$RESPONSE" | grep -q '"expiresAt"'; then
  log_pass "Response contains expiresAt"
else
  log_fail "Missing expiresAt in response"
fi

CREATED_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)

# Test 3: Create secret without content (should fail)
log_section "POST /api/secrets - Error Handling"
log_test "Creating secret without encryptedContent"
RESPONSE=$(curl -s -X POST "$API_URL/api/secrets" \
  -H "Content-Type: application/json" \
  -d '{}')

if echo "$RESPONSE" | grep -q '"error"'; then
  log_pass "Correctly returned error"
else
  log_fail "Should return error for missing content"
fi

# Test 4: Retrieve secret
log_section "GET /api/secrets/:id - Retrieve"
log_test "Retrieving secret with ID: $CREATED_ID"
RETRIEVE=$(curl -s "$API_URL/api/secrets/$CREATED_ID")

if echo "$RETRIEVE" | grep -q '"encryptedContent"'; then
  log_pass "Retrieved encrypted content"
else
  log_fail "Missing encrypted content in response"
fi

# Test 5: One-time access
log_section "One-Time Access"
log_test "Creating new secret for one-time access test"
RESPONSE=$(curl -s -X POST "$API_URL/api/secrets" \
  -H "Content-Type: application/json" \
  -d '{"encryptedContent":"one-time-test"}')
ONE_TIME_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)

log_test "First retrieval"
FIRST=$(curl -s "$API_URL/api/secrets/$ONE_TIME_ID")
if echo "$FIRST" | grep -q '"encryptedContent"'; then
  log_pass "First retrieval successful"
else
  log_fail "First retrieval failed"
fi

log_test "Second retrieval (should fail)"
SECOND=$(curl -s "$API_URL/api/secrets/$ONE_TIME_ID")
if echo "$SECOND" | grep -q '"error"'; then
  log_pass "Second retrieval correctly rejected"
else
  log_fail "Should reject second retrieval: $SECOND"
fi

# Test 6: Non-existent secret
log_section "GET /api/secrets/:id - Error Handling"
log_test "Retrieving non-existent secret"
RESPONSE=$(curl -s "$API_URL/api/secrets/nonexistent-id-99999999999")
if echo "$RESPONSE" | grep -q '"error"'; then
  log_pass "Correctly returned 404 error"
else
  log_fail "Should return error for non-existent secret"
fi

# Test 7: Check validity
log_section "GET /api/secrets/:id/check - Validity"
log_test "Creating secret for validity check"
RESPONSE=$(curl -s -X POST "$API_URL/api/secrets" \
  -H "Content-Type: application/json" \
  -d '{"encryptedContent":"validity-test"}')
CHECK_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)

log_test "Checking if secret is valid"
CHECK=$(curl -s "$API_URL/api/secrets/$CHECK_ID/check")
if echo "$CHECK" | grep -q '"valid":true'; then
  log_pass "Secret marked as valid"
else
  log_fail "Secret should be valid: $CHECK"
fi

log_test "Retrieving secret then checking validity"
curl -s "$API_URL/api/secrets/$CHECK_ID" > /dev/null
CHECK=$(curl -s "$API_URL/api/secrets/$CHECK_ID/check")
if echo "$CHECK" | grep -q '"valid":false'; then
  log_pass "Secret correctly marked invalid after retrieval"
else
  log_fail "Secret should be invalid after retrieval"
fi

# Test 8: Multiple secrets
log_section "Multiple Secrets"
log_test "Creating two secrets"
RESP1=$(curl -s -X POST "$API_URL/api/secrets" \
  -H "Content-Type: application/json" \
  -d '{"encryptedContent":"secret-a"}')
ID1=$(echo "$RESP1" | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)

RESP2=$(curl -s -X POST "$API_URL/api/secrets" \
  -H "Content-Type: application/json" \
  -d '{"encryptedContent":"secret-b"}')
ID2=$(echo "$RESP2" | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)

if [ "$ID1" != "$ID2" ]; then
  log_pass "Secrets have unique IDs"
else
  log_fail "Secrets should have unique IDs"
fi

log_test "Verifying independent retrieval"
RET1=$(curl -s "$API_URL/api/secrets/$ID1")
RET2=$(curl -s "$API_URL/api/secrets/$ID2")
if echo "$RET1" | grep -q 'secret-a' && echo "$RET2" | grep -q 'secret-b'; then
  log_pass "Secrets retrieved independently"
else
  log_fail "Secrets not retrieved correctly"
fi

# Test 9: HTTP Status Codes
log_section "HTTP Status Codes"
log_test "POST creates returns 200"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/api/secrets" \
  -H "Content-Type: application/json" \
  -d '{"encryptedContent":"test-status"}')
if [ "$STATUS" = "200" ]; then
  log_pass "POST returns 200"
else
  log_fail "POST returned $STATUS instead of 200"
fi

log_test "GET non-existent returns 404"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/secrets/invalid-999999")
if [ "$STATUS" = "404" ]; then
  log_pass "GET non-existent returns 404"
else
  log_fail "GET returned $STATUS instead of 404"
fi

# Summary
log_section "Test Summary"
echo "Total tests: $TESTS_RUN"
printf "%b\n" "${GREEN}Passed: $TESTS_PASSED${NC}"
if [ $TESTS_FAILED -gt 0 ]; then
  printf "%b\n" "${RED}Failed: $TESTS_FAILED${NC}"
  echo ""
  printf "%b\n" "${RED}✗ Some tests failed${NC}"
  exit 1
else
  printf "%b\n" "${GREEN}Failed: $TESTS_FAILED${NC}"
  echo ""
  printf "%b\n" "${GREEN}✓ All tests passed!${NC}"
  exit 0
fi
