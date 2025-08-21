#!/bin/bash

# Google Cloud Functions 배포 스크립트

PROJECT_ID="seoha-469403"
REGION="asia-northeast3"
SERVICE_ACCOUNT_EMAIL="seohabogogayo@seoha-469403.iam.gserviceaccount.com"

echo "🚀 Deploying Cloud Functions..."

echo "Deploying getRandomImage function..."
gcloud functions deploy getRandomImage \
  --gen2 \
  --runtime nodejs20 \
  --trigger-http \
  --allow-unauthenticated \
  --entry-point getRandomImage \
  --region $REGION \
  --set-env-vars GOOGLE_DRIVE_FOLDER_ID=$GOOGLE_DRIVE_FOLDER_ID,GOOGLE_DRIVE_DATA_JSON_ID=$GOOGLE_DRIVE_DATA_JSON_ID \
  --service-account $SERVICE_ACCOUNT_EMAIL \
  --project $PROJECT_ID \
  --source .

echo "Deploying likeImage function..."
gcloud functions deploy likeImage \
  --gen2 \
  --runtime nodejs20 \
  --trigger-http \
  --allow-unauthenticated \
  --entry-point likeImage \
  --region $REGION \
  --set-env-vars GOOGLE_DRIVE_FOLDER_ID=$GOOGLE_DRIVE_FOLDER_ID,GOOGLE_DRIVE_DATA_JSON_ID=$GOOGLE_DRIVE_DATA_JSON_ID \
  --service-account $SERVICE_ACCOUNT_EMAIL \
  --project $PROJECT_ID \
  --source .

echo "✅ Deployment complete!"
echo ""
echo "Random Image: https://$REGION-$PROJECT_ID.cloudfunctions.net/getRandomImage"
echo "Like Image: https://$REGION-$PROJECT_ID.cloudfunctions.net/likeImage"