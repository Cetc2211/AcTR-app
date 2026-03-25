#!/bin/bash

BACKEND_URL="https://backend-service-263108580734.us-central1.run.app"

echo "=== Testing AcTR-IA-Backend ==="
echo ""

# Test 1: Health Check
echo "1️⃣  Testing Health Check Endpoint (GET /)"
curl -s -X GET "$BACKEND_URL/" | jq . || echo "Error in health check"
echo ""

# Test 2: Generate Group Report
echo "2️⃣  Testing Generate Group Report Endpoint (POST /generate-group-report)"
curl -s -X POST "$BACKEND_URL/generate-group-report" \
  -H "Content-Type: application/json" \
  -d '{
    "group_name": "Humanidades II",
    "partial": "Primer Parcial",
    "stats": {
      "totalStudents": 30,
      "approvedCount": 25,
      "failedCount": 5,
      "groupAverage": 7.8,
      "attendanceRate": 92.5,
      "atRiskStudentCount": 3
    }
  }' | jq . || echo "Error in generate-group-report"
echo ""

# Test 3: Generate Student Feedback
echo "3️⃣  Testing Generate Student Feedback Endpoint (POST /generate-student-feedback)"
curl -s -X POST "$BACKEND_URL/generate-student-feedback" \
  -H "Content-Type: application/json" \
  -d '{
    "student_name": "Juan Pérez",
    "subject": "Humanidades II",
    "grades": [7.5, 8.0, 7.8],
    "attendance": 95,
    "observations": "Participación activa en clase"
  }' | jq . || echo "Error in generate-student-feedback"
echo ""

echo "=== Testing Complete ==="
