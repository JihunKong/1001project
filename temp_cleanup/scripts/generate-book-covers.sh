#!/bin/bash

# Generate PNG covers from PDF front covers for all books
SERVER_IP="3.128.143.122"
PEM_FILE="/Users/jihunkong/Downloads/1001project.pem"
REMOTE_BOOKS_DIR="/opt/1001-stories/public/books"

echo "🎨 Starting book cover generation process..."

# Install required tools on server
echo "📦 Installing PDF conversion tools..."
ssh -i "${PEM_FILE}" ubuntu@${SERVER_IP} "
  sudo apt update && 
  sudo apt install -y poppler-utils imagemagick
"

if [ $? -ne 0 ]; then
  echo "❌ Failed to install conversion tools"
  exit 1
fi

# Create conversion script on server
echo "📝 Creating conversion script on server..."
ssh -i "${PEM_FILE}" ubuntu@${SERVER_IP} "cat > /tmp/convert_covers.sh << 'EOF'
#!/bin/bash

BOOKS_DIR='/opt/1001-stories/public/books'
converted_count=0
total_books=0

echo '🔍 Scanning for books with front cover PDFs...'

# Find all directories with PDF files (potential front covers)
for book_dir in \${BOOKS_DIR}/*/; do
  if [ -d \"\${book_dir}\" ]; then
    book_name=\$(basename \"\${book_dir}\")
    total_books=\$((total_books + 1))
    
    # Look for front cover PDF files with various naming patterns
    front_pdf=\"\"
    
    # Check common front cover filenames
    for pattern in 'front.pdf' 'Front.pdf' '*front*.pdf' '*Front*.pdf' '*_front*.pdf' '*_Front*.pdf'; do
      file_path=\${book_dir}/\${pattern}
      if ls \${file_path} 1> /dev/null 2>&1; then
        front_pdf=\$(ls \${file_path} | head -1)
        break
      fi
    done
    
    if [ -n \"\${front_pdf}\" ] && [ -f \"\${front_pdf}\" ]; then
      echo \"📖 Processing \${book_name}...\"
      echo \"   Found: \$(basename \"\${front_pdf}\")\"
      
      # Convert PDF first page to PNG
      output_file=\"\${book_dir}/cover.png\"
      
      # Use pdftoppm to convert first page of PDF to PNG
      if pdftoppm -png -f 1 -l 1 -scale-to-x 400 -scale-to-y -1 \"\${front_pdf}\" \"\${book_dir}/temp\" 2>/dev/null; then
        # pdftoppm creates temp-1.png, rename it to cover.png
        if [ -f \"\${book_dir}/temp-1.png\" ]; then
          mv \"\${book_dir}/temp-1.png\" \"\${output_file}\"
          echo \"   ✅ Generated cover.png\"
          converted_count=\$((converted_count + 1))
        else
          echo \"   ❌ Conversion failed - no output file\"
        fi
      else
        echo \"   ❌ Conversion failed - pdftoppm error\"
      fi
      
      # Clean up any temporary files
      rm -f \${book_dir}/temp-*.png
    else
      echo \"⚠️  No front cover PDF found for \${book_name}\"
    fi
  fi
done

echo \"\"
echo \"🎉 Cover generation completed!\"
echo \"   📚 Total books processed: \${total_books}\"
echo \"   ✅ Covers generated: \${converted_count}\"
echo \"   ❌ Missing covers: \$((total_books - converted_count))\"
EOF
"

# Make the script executable and run it
echo "🚀 Running cover conversion on server..."
ssh -i "${PEM_FILE}" ubuntu@${SERVER_IP} "
  chmod +x /tmp/convert_covers.sh && 
  /tmp/convert_covers.sh
"

if [ $? -eq 0 ]; then
  echo "✅ Cover generation process completed successfully!"
  
  # List generated covers
  echo "📋 Generated covers:"
  ssh -i "${PEM_FILE}" ubuntu@${SERVER_IP} "find ${REMOTE_BOOKS_DIR} -name 'cover.png' -exec ls -la {} \;"
else
  echo "❌ Cover generation process failed"
fi

echo "🎯 Next steps:"
echo "   1. Update database seed to use all generated covers"
echo "   2. Re-run database seed"
echo "   3. Test library display"