#!/bin/bash

# Book Upload Script for 1001 Stories
# This script uploads all books from local folder to the server and organizes them

# Configuration
SERVER_IP="13.209.14.175"
PEM_KEY="/Users/jihunkong/Downloads/1001project.pem"
LOCAL_BOOKS_DIR="/Users/jihunkong/1001project/1001books"
REMOTE_PUBLIC_DIR="/home/ubuntu/1001-stories/public/books"
REMOTE_USER="ubuntu"

echo "🚀 Starting Book Upload Process..."

# Function to normalize book folder name
normalize_folder_name() {
    local original_name="$1"
    echo "$original_name" | \
    sed 's/^[0-9]*[_ ]*//g' | \
    tr '[:upper:]' '[:lower:]' | \
    sed 's/[^a-z0-9]/-/g' | \
    sed 's/--*/-/g' | \
    sed 's/^-\|-$//g'
}

# Function to identify main PDF file in a folder
identify_main_pdf() {
    local folder="$1"
    # Look for files with "inside" in name first
    local main_file=$(find "$folder" -name "*inside*.pdf" | head -1)
    if [ -z "$main_file" ]; then
        # Look for files with "Edit" in name (Neema series pattern)
        main_file=$(find "$folder" -name "*Edit*.pdf" | head -1)
    fi
    if [ -z "$main_file" ]; then
        # Find the largest PDF file that's not front/back cover
        main_file=$(find "$folder" -name "*.pdf" ! -name "*front*.pdf" ! -name "*Front*.pdf" ! -name "*back*.pdf" ! -name "*Back*.pdf" ! -name "*black*.pdf" -exec ls -la {} \; | sort -k5 -nr | head -1 | awk '{print $NF}')
    fi
    echo "$main_file"
}

# Function to identify front cover PDF
identify_front_pdf() {
    local folder="$1"
    local front_file=$(find "$folder" -name "*front*.pdf" -o -name "*Front*.pdf" | head -1)
    echo "$front_file"
}

# Function to identify back cover PDF  
identify_back_pdf() {
    local folder="$1"
    local back_file=$(find "$folder" -name "*back*.pdf" -o -name "*Back*.pdf" | head -1)
    echo "$back_file"
}

# Create remote directory structure
echo "📁 Creating remote directory structure..."
ssh -i "$PEM_KEY" "$REMOTE_USER@$SERVER_IP" "mkdir -p $REMOTE_PUBLIC_DIR"

# Counter for progress tracking
counter=0
total=$(find "$LOCAL_BOOKS_DIR" -maxdepth 1 -type d ! -path "$LOCAL_BOOKS_DIR" | wc -l)

echo "📚 Found $total book folders to upload"

# Process each book folder
for book_folder in "$LOCAL_BOOKS_DIR"/*; do
    if [ -d "$book_folder" ]; then
        counter=$((counter + 1))
        original_name=$(basename "$book_folder")
        normalized_name=$(normalize_folder_name "$original_name")
        
        echo "[$counter/$total] Processing: $original_name → $normalized_name"
        
        # Create remote book directory
        remote_book_dir="$REMOTE_PUBLIC_DIR/$normalized_name"
        ssh -i "$PEM_KEY" "$REMOTE_USER@$SERVER_IP" "mkdir -p $remote_book_dir"
        
        # Identify and upload main PDF
        main_pdf=$(identify_main_pdf "$book_folder")
        if [ -n "$main_pdf" ] && [ -f "$main_pdf" ]; then
            echo "  📄 Uploading main PDF..."
            scp -i "$PEM_KEY" "$main_pdf" "$REMOTE_USER@$SERVER_IP:$remote_book_dir/main.pdf"
        else
            echo "  ⚠️  No main PDF found for $original_name"
        fi
        
        # Identify and upload front cover
        front_pdf=$(identify_front_pdf "$book_folder")
        if [ -n "$front_pdf" ] && [ -f "$front_pdf" ]; then
            echo "  🎨 Uploading front cover..."
            scp -i "$PEM_KEY" "$front_pdf" "$REMOTE_USER@$SERVER_IP:$remote_book_dir/front.pdf"
        fi
        
        # Identify and upload back cover
        back_pdf=$(identify_back_pdf "$book_folder")
        if [ -n "$back_pdf" ] && [ -f "$back_pdf" ]; then
            echo "  🎨 Uploading back cover..."
            scp -i "$PEM_KEY" "$back_pdf" "$REMOTE_USER@$SERVER_IP:$remote_book_dir/back.pdf"
        fi
        
        echo "  ✅ Completed: $normalized_name"
    fi
done

# Set proper permissions on server
echo "🔒 Setting proper file permissions..."
ssh -i "$PEM_KEY" "$REMOTE_USER@$SERVER_IP" "chmod -R 755 $REMOTE_PUBLIC_DIR"
ssh -i "$PEM_KEY" "$REMOTE_USER@$SERVER_IP" "find $REMOTE_PUBLIC_DIR -name '*.pdf' -exec chmod 644 {} \;"

echo "🎉 Book upload completed!"
echo "📁 Books uploaded to: $REMOTE_PUBLIC_DIR"
echo "🔗 Accessible via: /api/pdf/books/[book-id]/[file].pdf"

# Show summary
echo ""
echo "📊 Upload Summary:"
ssh -i "$PEM_KEY" "$REMOTE_USER@$SERVER_IP" "find $REMOTE_PUBLIC_DIR -name '*.pdf' | wc -l" | xargs echo "  Total PDF files:"
ssh -i "$PEM_KEY" "$REMOTE_USER@$SERVER_IP" "find $REMOTE_PUBLIC_DIR -mindepth 1 -maxdepth 1 -type d | wc -l" | xargs echo "  Book directories:"