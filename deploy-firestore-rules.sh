#!/bin/bash
echo "Deploying Firestore Rules..."
firebase deploy --only firestore:rules
echo "Done! Please test creating a justification or announcement again."
