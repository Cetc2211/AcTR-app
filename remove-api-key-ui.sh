#!/bin/bash
git add -A
git commit -m "refactor: remove all UI components for manual API key configuration

- Removed apiKey parameter from reports group analysis call
- Removed apiKey validation logic from reports page (handleGenerateAnalysis)
- Removed useEffect that was resetting API key validation
- Removed apiKey state and validation checks from settings page
- Removed API Key input field, test button, and validation UI from settings
- Updated AI Integration card description to reflect Google Cloud authentication
- Removed testApiKeyAction import from settings page
- Removed isTestingKey state (no longer needed)

Users no longer need to configure API keys manually. The app uses Google Cloud
Service Account credentials configured on the backend for all IA operations."

git push origin main
