#!/bin/bash

# Create sample PDFs for premium books
# This script creates sample.pdf files using the front.pdf as sample content

PREMIUM_BOOKS=("appreciation" "angel-prayer" "fatuma" "greedy-fisherman" "martha-01" "never-give-up" "second-chance" "test4" "who-is-real")

echo "📚 Creating sample PDFs for premium books..."

for book in "${PREMIUM_BOOKS[@]}"; do
    book_dir="public/books/$book"
    
    if [[ -d "$book_dir" ]]; then
        echo "📖 Processing $book..."
        
        # Use front.pdf as sample if it exists
        if [[ -f "$book_dir/front.pdf" ]]; then
            cp "$book_dir/front.pdf" "$book_dir/sample.pdf"
            echo "  ✅ Created sample.pdf from front.pdf"
        # If no front.pdf, create a simple sample indicating it's a sample
        elif [[ -f "$book_dir/main.pdf" ]]; then
            # For now, just copy the first part of main.pdf
            # This would ideally use PDF manipulation tools like pdftk or similar
            cp "$book_dir/main.pdf" "$book_dir/sample.pdf"
            echo "  ⚠️  Used main.pdf as sample (should be truncated in production)"
        else
            echo "  ❌ No PDF found for $book"
        fi
    else
        echo "  ❌ Directory not found: $book_dir"
    fi
done

echo "🎉 Sample PDF creation completed!"
echo ""
echo "📋 Created samples for:"
for book in "${PREMIUM_BOOKS[@]}"; do
    if [[ -f "public/books/$book/sample.pdf" ]]; then
        echo "  ✅ $book"
    fi
done