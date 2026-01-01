#!/bin/bash
# Test script for job creation with authentication

# Get fresh token
echo "=== Getting authentication token ==="
TOKEN_RESPONSE=$(curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"grahiman02@gmail.com","password":"R4h1m@n!Y2025"}' \
  -s)

TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Failed to get authentication token"
  echo "Response: $TOKEN_RESPONSE"
  exit 1
fi

echo "Token obtained: ${TOKEN:0:50}..."
echo ""

# Test job creation
echo "=== Creating test job ==="
curl -X POST http://localhost:3000/jobs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title":"Authentication Test Job - Backend Verification",
    "description":"Testing backend authentication flow for job creation with proper user context and JWT validation",
    "categoryId":"cmge564r300067hbmwky6a49t",
    "budgetType":"FIXED",
    "budget":2500,
    "urgency":"MEDIUM",
    "addressLine1":"123 Test Street",
    "city":"Cape Town",
    "province":"Western Cape",
    "postalCode":"8001",
    "latitude":-33.9249,
    "longitude":18.4241,
    "requirements":["Test requirement 1", "Test requirement 2"],
    "isDraft":true
  }' \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s

echo ""
echo "=== Test complete ==="
