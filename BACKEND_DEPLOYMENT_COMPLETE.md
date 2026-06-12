# Backend Deploy Verification & Testing Guide

**Deployment Date:** December 6, 2025  
**Backend Service:** `backend-service`  
**Region:** `us-central1`  
**Service URL:** `https://backend-service-263108580734.us-central1.run.app`

---

## ✅ Deployment Status

| Component | Status | Details |
|-----------|--------|---------|
| Cloud Run Service | ✅ **DEPLOYED** | Revision: `backend-service-00007-5jj` |
| Docker Build | ✅ **SUCCESS** | Flask + google-generativeai |
| Environment Variables | ✅ **CONFIGURED** | `GOOGLE_AI_API_KEY` set |
| API Endpoints | ✅ **ACTIVE** | 3 routes deployed |

---

## 🔍 Testing Instructions

Execute these tests to verify the backend is working:

### Test 1: Health Check
```bash
curl -X GET https://backend-service-263108580734.us-central1.run.app/

# Expected response (after latest deploy):
{
  "status": "ready",
  "service": "AcTR-IA-Backend",
  "timestamp": "2025-12-06T...",
  "version": "2.0",
  "model": "gemini-1.5-pro",
  "api_key_configured": true
}
```

### Test 2: Generate Group Report
```bash
curl -X POST https://backend-service-263108580734.us-central1.run.app/generate-group-report \
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
  }'

# Expected response:
{
  "success": true,
  "report": "[AI-generated analysis text...]",
  "group": "Humanidades II",
  "partial": "Primer Parcial"
}
```

### Test 3: Generate Student Feedback
```bash
curl -X POST https://backend-service-263108580734.us-central1.run.app/generate-student-feedback \
  -H "Content-Type: application/json" \
  -d '{
    "student_name": "Juan Pérez",
    "subject": "Humanidades II",
    "grades": [7.5, 8.0, 7.8],
    "attendance": 95,
    "observations": "Participación activa"
  }'

# Expected response:
{
  "success": true,
  "feedback": "[AI-generated feedback text...]",
  "student": "Juan Pérez",
  "subject": "Humanidades II"
}
```

---

## 🛠️ Available Endpoints

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/` | GET | Health check | ✅ Active |
| `/generate-report` | POST | Generic report (alias) | ✅ Active |
| `/generate-group-report` | POST | Group analysis | ✅ Active |
| `/generate-student-feedback` | POST | Student feedback | ✅ Active |

---

## 📋 Frontend Configuration

The frontend is already configured to use this backend via:

**File:** `src/ai/flows/generate-group-report-analysis-flow.ts`
```typescript
const endpoint = process.env.NEXT_PUBLIC_CLOUD_RUN_ENDPOINT 
  || 'https://backend-service-263108580734.us-central1.run.app';
```

**File:** `src/ai/flows/generate-student-feedback-flow.ts`
```typescript
const endpoint = process.env.NEXT_PUBLIC_CLOUD_RUN_ENDPOINT 
  || 'https://backend-service-263108580734.us-central1.run.app';
```

### Optional: Environment Override
To override the backend URL, set in `.env.local`:
```
NEXT_PUBLIC_CLOUD_RUN_ENDPOINT=https://your-custom-backend-url
```

---

## 🔑 Environment Variables

### Cloud Run Service
- ✅ `GOOGLE_AI_API_KEY` - Set to: `AIzaSyDEpQ7ycT3Adc3S3I98v0w4ejyv8aTht_4`
- ✅ `GCP_PROJECT_ID` - Set to: `academic-tracker-qeoxi` (from Dockerfile/code)

### Frontend (.env.local) - Optional
- `NEXT_PUBLIC_CLOUD_RUN_ENDPOINT` - Backend service URL

---

## 🚀 Next Steps

1. **Verify Backend is Running**
   - Execute Test 1 (Health Check) above
   - Confirm all 5 fields are present and model is "gemini-1.5-pro"

2. **Test AI Generation Locally**
   - Execute Test 2 & 3 from a terminal
   - Verify both endpoints return `"success": true`

3. **Test Full End-to-End in App**
   - Open application: https://actr-app.vercel.app (or local instance)
   - Navigate to: **Reportes** → Select group → Click **"✨ Generar con IA"**
   - Expected: 10-15 second wait, then AI analysis appears

4. **Monitor Logs (if needed)**
   ```bash
   gcloud run logs read backend-service --region=us-central1 --limit=50
   ```

---

## ⚠️ Troubleshooting

### Issue: "Model not initialized" Error
**Cause:** API key not loaded  
**Solution:** Verify environment variable in Cloud Run console:
```bash
gcloud run services describe backend-service --region=us-central1 \
  --format='value(spec.template.spec.containers[0].env[?name==`GOOGLE_AI_API_KEY`].value)'
```

### Issue: 500 Error from Backend
**Solution:** Check logs:
```bash
gcloud run logs read backend-service --region=us-central1 --limit=20
```

### Issue: Timeout (>30 seconds)
**Solution:** AI generation can take 10-20 seconds. This is normal for first requests.

---

## 📊 Performance Notes

- **Model:** Gemini 1.5 Pro (faster, cheaper than Pro Extended)
- **Timeout:** 120 seconds (Gunicorn)
- **Workers:** 1 (sufficient for Cloud Run's auto-scaling)
- **Latency:** First request ~10-20s, subsequent requests ~5-15s

---

## ✨ Configuration Summary

**Backend Stack:**
- Flask 2.3.3
- google-generativeai 0.3.0
- Gunicorn 21.2.0
- Python 3.9-slim (Docker image)

**Deployment:**
- Cloud Run (managed)
- Cloud Build (automatic)
- Artifact Registry (source deploy)

**API Model:**
- Gemini 1.5 Pro (latest stable)
- Region: us-central1
- Authentication: API Key

---

**Last Updated:** December 6, 2025 @ 06:14 UTC
