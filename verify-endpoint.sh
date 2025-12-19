#!/bin/bash
# Script to verify the generate-group-report endpoint

ENDPOINT="https://ai-report-service-jjaeoswhya-uc.a.run.app"

echo "Testing endpoint: $ENDPOINT/generate-group-report"

curl -X POST "$ENDPOINT/generate-group-report" \
  -H "Content-Type: application/json" \
  -d '{
    "group_name": "Test Group",
    "partial": "Test Partial",
    "stats": {
      "totalStudents": 10,
      "approvedCount": 8,
      "failedCount": 2,
      "groupAverage": 85.5,
      "attendanceRate": 95.0,
      "atRiskStudentCount": 1
    }
  }'

echo ""
echo "Done."
