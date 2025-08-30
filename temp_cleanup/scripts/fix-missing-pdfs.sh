#!/bin/bash

# Fix missing PDF files for Neema books
# Server details
SERVER_IP="3.128.143.122"
PEM_FILE="/Users/jihunkong/Downloads/1001project.pem"
LOCAL_BOOKS_DIR="/Users/jihunkong/1001project/1001books"
REMOTE_BOOKS_DIR="/opt/1001-stories/public/books"

echo "🔧 Fixing missing PDF files for Neema books..."

# Upload neema-02 PDF
echo "📤 Uploading neema-02 PDF..."
scp -i "${PEM_FILE}" "${LOCAL_BOOKS_DIR}/02_ Neema_02/02_ Neema_part two_Edit_0716.pdf" \
  ubuntu@${SERVER_IP}:"${REMOTE_BOOKS_DIR}/neema-02/main.pdf"

if [ $? -eq 0 ]; then
  echo "✅ neema-02/main.pdf uploaded successfully"
else
  echo "❌ Failed to upload neema-02/main.pdf"
fi

# Upload neema-03 PDF
echo "📤 Uploading neema-03 PDF..."
scp -i "${PEM_FILE}" "${LOCAL_BOOKS_DIR}/03_ Neema_03/03_ Neema_part three_Edit_0717.pdf" \
  ubuntu@${SERVER_IP}:"${REMOTE_BOOKS_DIR}/neema-03/main.pdf"

if [ $? -eq 0 ]; then
  echo "✅ neema-03/main.pdf uploaded successfully"
else
  echo "❌ Failed to upload neema-03/main.pdf"
fi

# Verify the files exist
echo "🔍 Verifying uploaded files..."
ssh -i "${PEM_FILE}" ubuntu@${SERVER_IP} "ls -la ${REMOTE_BOOKS_DIR}/neema-02/main.pdf ${REMOTE_BOOKS_DIR}/neema-03/main.pdf"

echo "🎉 PDF upload process completed!"