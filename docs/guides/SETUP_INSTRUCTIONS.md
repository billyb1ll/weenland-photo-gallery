## Copy this into your .env file (replace with your actual values):

# Replace "weenland-photo-gallery" with your actual project ID
GOOGLE_CLOUD_PROJECT_ID=weenland-photo-gallery

# Replace with your actual bucket name from step 4
GOOGLE_CLOUD_BUCKET_NAME=weenland-photos-YOUR-INITIALS-2025

# This stays the same - points to your credentials file
GOOGLE_APPLICATION_CREDENTIALS=./credentials/gcp-service-account.json

# Replace with your actual bucket name
NEXT_PUBLIC_BUCKET_BASE_URL=https://storage.googleapis.com/weenland-photos-YOUR-INITIALS-2025

# This can stay the same
NEXT_PUBLIC_APP_URL=http://localhost:3000

## Commands to run:

# 1. Move your downloaded JSON file to the credentials folder:
mv ~/Downloads/weenland-*.json ./credentials/gcp-service-account.json

# 2. Test the connection:
node test-gcs-connection.js

# 3. Start the development server:
npm run dev

## Then visit: http://localhost:3000
