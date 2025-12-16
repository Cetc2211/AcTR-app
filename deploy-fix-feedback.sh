#!/bin/bash
echo "Deploying fix for AI Feedback display..."

# Add changes
git add src/ai/flows/generate-student-feedback-flow.ts

# Commit
git commit -m "fix: update AI feedback response property access (report -> feedback)"

# Push
git push origin main

echo "Fix deployed! Please wait for Vercel to rebuild."
