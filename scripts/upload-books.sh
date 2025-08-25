#!/bin/bash

# Upload Books to Production Server
# This script uploads book files to the production server in batches

set -e

SERVER="3.128.143.122"
PEM_FILE="/Users/jihunkong/Downloads/1001project.pem"
BOOKS_DIR="public/books"
REMOTE_DIR="/var/www/1001-stories/public/books"

echo "🚀 Starting book upload to production server..."

# Check if PEM file exists
if [[ ! -f "$PEM_FILE" ]]; then
    echo "❌ PEM file not found: $PEM_FILE"
    exit 1
fi

# Set correct permissions for PEM file
chmod 400 "$PEM_FILE"

# Function to upload a single book
upload_book() {
    local book_id="$1"
    local local_path="$BOOKS_DIR/$book_id"
    
    if [[ ! -d "$local_path" ]]; then
        echo "⚠️  Book directory not found: $local_path"
        return 1
    fi
    
    echo "📚 Uploading $book_id..."
    
    # Create remote directory
    ssh -o StrictHostKeyChecking=no -i "$PEM_FILE" ubuntu@"$SERVER" \
        "mkdir -p '$REMOTE_DIR/$book_id'"
    
    # Upload files with timeout and retry
    for file in "$local_path"/*; do
        if [[ -f "$file" ]]; then
            local filename=$(basename "$file")
            local remote_file="$REMOTE_DIR/$book_id/$filename"
            
            echo "  📄 Uploading $filename..."
            
            # Try upload with timeout
            timeout 300 scp -o StrictHostKeyChecking=no -i "$PEM_FILE" \
                "$file" ubuntu@"$SERVER":"$remote_file" || {
                echo "  ⚠️  Upload failed for $filename, retrying..."
                timeout 300 scp -o StrictHostKeyChecking=no -i "$PEM_FILE" \
                    "$file" ubuntu@"$SERVER":"$remote_file" || {
                    echo "  ❌ Failed to upload $filename after retry"
                    return 1
                }
            }
        fi
    done
    
    echo "✅ $book_id uploaded successfully"
}

# Priority books (free books that need to work first)
PRIORITY_BOOKS=("neema-01" "neema-02" "neema-03")

echo "📋 Uploading priority books first..."
for book in "${PRIORITY_BOOKS[@]}"; do
    upload_book "$book"
done

echo "🎉 Priority books uploaded successfully!"

# Set correct permissions
echo "🔒 Setting file permissions..."
ssh -o StrictHostKeyChecking=no -i "$PEM_FILE" ubuntu@"$SERVER" \
    "find '$REMOTE_DIR' -type f -exec chmod 644 {} \; && find '$REMOTE_DIR' -type d -exec chmod 755 {} \;"

echo "✅ Book upload completed!"
echo "🔍 Testing PDF availability..."
echo "Testing: https://1001stories.seedsofempowerment.org/api/pdf/books/neema-01/main.pdf"
