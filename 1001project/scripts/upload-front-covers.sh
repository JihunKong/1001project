#!/bin/bash

# Upload front cover PDF files for all books
SERVER_IP="3.128.143.122"
PEM_FILE="/Users/jihunkong/Downloads/1001project.pem"
LOCAL_BOOKS_DIR="/Users/jihunkong/1001project/1001books"
REMOTE_BOOKS_DIR="/opt/1001-stories/public/books"

echo "📤 Uploading front cover PDF files..."

# Array of book mappings: "local_folder:remote_book_id:front_pdf_file"
declare -a BOOK_MAPPINGS=(
  "01_ Neema_01:neema-01:Neema 01 _ Front.pdf"
  "02_ Neema_02:neema-02:Neema 02 _ Front.pdf"
  "03_ Neema_03:neema-03:Neema 03 _ Front_B.pdf"
  "04_ Second chance:second-chance:The second chance_ Front.pdf"
  "05_ Angel prayer:angel-prayer:Angel s  Prayer _ front.pdf"
  "06_ Martha_01:martha-01:MARTHA _ front.pdf"
)

upload_count=0
total_books=${#BOOK_MAPPINGS[@]}

for mapping in "${BOOK_MAPPINGS[@]}"; do
  IFS=':' read -r local_folder remote_id front_file <<< "$mapping"
  
  local_path="${LOCAL_BOOKS_DIR}/${local_folder}/${front_file}"
  remote_path="${REMOTE_BOOKS_DIR}/${remote_id}/front.pdf"
  
  echo "📖 Processing ${remote_id}..."
  echo "   Local: ${local_path}"
  echo "   Remote: ${remote_path}"
  
  if [ -f "${local_path}" ]; then
    # Create remote directory if it doesn't exist
    ssh -i "${PEM_FILE}" ubuntu@${SERVER_IP} "mkdir -p ${REMOTE_BOOKS_DIR}/${remote_id}"
    
    # Upload the front cover PDF
    if scp -i "${PEM_FILE}" "${local_path}" ubuntu@${SERVER_IP}:"${remote_path}"; then
      echo "   ✅ Uploaded successfully"
      upload_count=$((upload_count + 1))
    else
      echo "   ❌ Upload failed"
    fi
  else
    echo "   ❌ Local file not found: ${local_path}"
  fi
  echo ""
done

echo "📊 Upload Summary:"
echo "   📚 Total books: ${total_books}"
echo "   ✅ Uploaded: ${upload_count}"
echo "   ❌ Failed: $((total_books - upload_count))"

# List uploaded front covers
echo ""
echo "📋 Uploaded front covers:"
ssh -i "${PEM_FILE}" ubuntu@${SERVER_IP} "find ${REMOTE_BOOKS_DIR} -name 'front.pdf' -exec ls -la {} \;"