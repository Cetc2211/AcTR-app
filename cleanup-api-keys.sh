#!/bin/bash
git add -A
git commit -m "refactor: remove user API key configuration - use Google Cloud Service Account only

Authentication is now handled entirely through Google Cloud Service Account credentials.
Users no longer need to provide their own API keys.

Changes:
- Removed apiKey parameter from generate-student-feedback-flow.ts schema and implementation
- Removed apiKey parameter from generate-group-report-analysis-flow.ts schema and implementation
- Removed api_key from all request payloads (src/app/api/test-ai/route.ts)
- Removed api_key from test payloads (test-ai-integration.js)
- Backend now handles authentication through Cloud Run service account configuration

This simplifies the user experience and improves security by centralizing authentication
at the backend level through Google Cloud's managed credentials."

git push origin main
