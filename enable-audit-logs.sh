#!/bin/bash

# Script to enable Cloud Audit Logs for Firebase Authentication
# This enables logging of authentication events including failed login attempts

PROJECT_ID="academic-tracker-qeoxi"
BUCKET_NAME="academic-tracker-audit-logs"

echo "Enabling Cloud Audit Logs for Firebase Authentication..."

# Check if Cloud Storage bucket exists, create if it doesn't
echo "Checking Cloud Storage bucket for audit logs..."
gcloud storage buckets describe gs://$BUCKET_NAME --project=$PROJECT_ID >/dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Storage bucket already exists: $BUCKET_NAME"
else
    echo "Creating Cloud Storage bucket for audit logs..."
    gcloud storage buckets create gs://$BUCKET_NAME \
      --project=$PROJECT_ID \
      --location=us-central1 \
      --uniform-bucket-level-access

    if [ $? -ne 0 ]; then
        echo "❌ Failed to create storage bucket"
        exit 1
    fi

    echo "✅ Storage bucket created successfully"
fi

# Enable Data Access audit logs for Firebase Authentication
echo "Creating logging sink for authentication events..."
gcloud logging sinks describe auth-audit-logs --project=$PROJECT_ID >/dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Logging sink already exists: auth-audit-logs"
else
    gcloud logging sinks create auth-audit-logs \
      storage.googleapis.com/$BUCKET_NAME \
      --log-filter='resource.type="firebaseauth.googleapis.com/Project" AND (protoPayload.methodName="google.firebase.auth.v1.AuthenticationService.SignInWithPassword" OR protoPayload.methodName="google.firebase.auth.v1.AuthenticationService.SignInWithEmailLink")' \
      --project=$PROJECT_ID

    if [ $? -ne 0 ]; then
        echo "❌ Failed to create logging sink"
        exit 1
    fi

    echo "✅ Logging sink created successfully"
fi

echo "Note: Firebase Auth automatically logs authentication events to GCP Cloud Logging"
echo "You can view these logs in GCP Console > Logging > Logs Explorer"