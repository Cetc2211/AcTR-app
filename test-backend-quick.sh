#!/bin/bash

# Quick Test Script for AcTR Backend Deployment
# Usage: bash test-backend-quick.sh

BACKEND="https://backend-service-263108580734.us-central1.run.app"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🧪 Testing AcTR-IA-Backend${NC}"
echo "Service: $BACKEND"
echo ""

# Test 1: Health Check
echo -e "${YELLOW}1. Testing Health Check (GET /)${NC}"
HEALTH=$(curl -s -w "%{http_code}" -o /tmp/health.json "$BACKEND/")
HEALTH_CODE=${HEALTH: -3}

if [ "$HEALTH_CODE" == "200" ]; then
    echo -e "${GREEN}✅ Health Check: OK${NC}"
    echo "Response:"
    jq . /tmp/health.json 2>/dev/null || cat /tmp/health.json
    echo ""
else
    echo -e "${RED}❌ Health Check FAILED (Code: $HEALTH_CODE)${NC}"
    cat /tmp/health.json
    echo ""
fi

# Test 2: Group Report
echo -e "${YELLOW}2. Testing Generate Group Report (POST /generate-group-report)${NC}"
REPORT=$(curl -s -w "%{http_code}" -o /tmp/report.json -X POST "$BACKEND/generate-group-report" \
  -H "Content-Type: application/json" \
  -d '{
    "group_name": "Test Group",
    "partial": "Primer Parcial",
    "stats": {
      "totalStudents": 30,
      "approvedCount": 25,
      "failedCount": 5,
      "groupAverage": 7.8,
      "attendanceRate": 92.5,
      "atRiskStudentCount": 3
    }
  }')
REPORT_CODE=${REPORT: -3}

if [ "$REPORT_CODE" == "200" ]; then
    echo -e "${GREEN}✅ Generate Report: OK${NC}"
    echo "Response (first 300 chars):"
    jq '.report' /tmp/report.json 2>/dev/null | head -c 300 || head -c 300 /tmp/report.json
    echo -e "\n...${NC}\n"
else
    echo -e "${RED}❌ Generate Report FAILED (Code: $REPORT_CODE)${NC}"
    cat /tmp/report.json
    echo ""
fi

# Test 3: Student Feedback
echo -e "${YELLOW}3. Testing Generate Student Feedback (POST /generate-student-feedback)${NC}"
FEEDBACK=$(curl -s -w "%{http_code}" -o /tmp/feedback.json -X POST "$BACKEND/generate-student-feedback" \
  -H "Content-Type: application/json" \
  -d '{
    "student_name": "Test Student",
    "subject": "Test Subject",
    "grades": [7.5, 8.0, 7.8],
    "attendance": 95,
    "observations": "Good participation"
  }')
FEEDBACK_CODE=${FEEDBACK: -3}

if [ "$FEEDBACK_CODE" == "200" ]; then
    echo -e "${GREEN}✅ Generate Feedback: OK${NC}"
    echo "Response (first 300 chars):"
    jq '.feedback' /tmp/feedback.json 2>/dev/null | head -c 300 || head -c 300 /tmp/feedback.json
    echo -e "\n...${NC}\n"
else
    echo -e "${RED}❌ Generate Feedback FAILED (Code: $FEEDBACK_CODE)${NC}"
    cat /tmp/feedback.json
    echo ""
fi

# Summary
echo -e "${YELLOW}📊 Test Summary${NC}"
if [ "$HEALTH_CODE" == "200" ] && [ "$REPORT_CODE" == "200" ] && [ "$FEEDBACK_CODE" == "200" ]; then
    echo -e "${GREEN}✅ All tests PASSED!${NC}"
    echo "Backend is ready for production use."
else
    echo -e "${RED}❌ Some tests FAILED${NC}"
    echo "Health: $HEALTH_CODE | Report: $REPORT_CODE | Feedback: $FEEDBACK_CODE"
fi
echo ""
