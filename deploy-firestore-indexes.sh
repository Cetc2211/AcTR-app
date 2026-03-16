#!/bin/bash
echo "Deploying Firestore Indexes..."
firebase deploy --only firestore:indexes
echo "Done! Real-time updates should work now."
