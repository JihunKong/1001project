#!/bin/bash

# Complete Book System Deployment Script
# This script prepares and deploys the entire book system to production

echo "📚 Starting Complete Book System Deployment..."

# Configuration
REMOTE_SERVER="1001stories.seedsofempowerment.org"
LOCAL_BOOKS_DIR="/Users/jihunkong/1001project/1001books"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Step 1: Verify all files are ready
print_status "Step 1: Verifying deployment files..."

required_files=(
    "prisma/seed-real-books.ts"
    "prisma/book-metadata.json"
    "app/api/pdf/[...path]/route.ts"
    "app/api/library/books/route.ts"
    "app/api/library/books/[id]/route.ts"
    "lib/book-files.ts"
    "app/demo/library/page.tsx"
    "app/demo/library/books/[id]/page.tsx"
)

missing_files=()
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -ne 0 ]; then
    print_error "Missing required files:"
    for file in "${missing_files[@]}"; do
        echo "  - $file"
    done
    exit 1
fi

print_success "All required files present"

# Step 2: Create deployment summary
print_status "Step 2: Creating deployment summary..."

cat > DEPLOYMENT_NOTES.md << 'EOF'
# Book System Deployment Notes

## 🚀 What's Being Deployed

### Core System Updates
- ✅ Fixed PDF URL routing to use `/api/pdf/books/` format
- ✅ Updated all API routes to return correct PDF URLs
- ✅ Added access control for premium books in PDF API
- ✅ Created comprehensive book metadata for 33 real books
- ✅ Updated demo pages to use real Neema series books

### Database Changes
- 📊 New seed script: `prisma/seed-real-books.ts`
- 📊 Book metadata: `prisma/book-metadata.json`
- 📚 33 books total: 3 free (Neema series) + 30 premium

### Books Included
**Free Books (Demo/Preview):**
1. Neema Part 1 - A Journey of Hope
2. Neema Part 2 - A Journey of Hope  
3. Neema Part 3 - A Journey of Hope

**Premium Books (30 total):**
- Second Chance, Angel's Prayer, Martha series
- Street Boy series, Three Boys series
- Various other inspiring stories from young authors

### File Structure Expected on Server
```
public/books/
├── neema-01/
│   ├── main.pdf
│   ├── front.pdf
│   └── back.pdf
├── neema-02/
│   └── (similar structure)
└── (... 30 more book folders)
```

### API Endpoints Updated
- `GET /api/library/books` - Returns all books with proper PDF URLs
- `GET /api/library/books/[id]` - Returns individual book details
- `GET /api/pdf/books/[id]/[file].pdf` - Serves PDFs with access control

### Access Control
- Free books (neema-01, neema-02, neema-03): Public access
- Premium books: Require subscription or purchase
- Demo mode: Limited to first 3 free books

## 🛠️ Post-Deployment Steps Required

### 1. Database Seeding
Run on production server:
```bash
npx tsx prisma/seed-real-books.ts
```

### 2. PDF File Upload
Upload all PDF files from local `/Users/jihunkong/1001project/1001books` to:
```
server:/path/to/1001-stories/public/books/
```

### 3. Cover Image Generation
Generate cover images from PDF front covers:
```bash
# Create cover images from PDFs
for book in public/books/*/; do
  book_id=$(basename "$book")
  # Convert first page of front.pdf to jpg for cover
  # Or use existing cover image files
done
```

### 4. Testing Checklist
- [ ] Library page shows 33 books
- [ ] Demo library shows 3 Neema books
- [ ] Free books are accessible without login
- [ ] Premium books require subscription/purchase
- [ ] PDF viewer loads correctly
- [ ] Book detail pages work for all books
- [ ] Shop integration works for premium books

### 5. Monitoring
- Check PDF loading performance
- Monitor access control functionality
- Verify database queries are efficient
- Check for any 404 errors on book access

## 🚨 Important Notes
- Books 1-3 (Neema series) are free for demo/preview
- All other books require subscription or purchase
- PDF files must be manually uploaded to server
- Database seed creates all book records with proper metadata
- Cover images will need to be generated from PDF front covers
EOF

print_success "Created DEPLOYMENT_NOTES.md"

# Step 3: Run local tests
print_status "Step 3: Running local validation tests..."

# Check TypeScript compilation
print_status "Checking TypeScript compilation..."
if npm run build > /tmp/build.log 2>&1; then
    print_success "TypeScript compilation passed"
else
    print_error "TypeScript compilation failed. Check /tmp/build.log"
    echo "Recent errors:"
    tail -10 /tmp/build.log
    exit 1
fi

# Check if metadata generation script works
print_status "Testing metadata generation..."
if npx tsx scripts/create-book-data.ts > /tmp/metadata.log 2>&1; then
    print_success "Metadata generation works"
else
    print_warning "Metadata generation had issues. Check /tmp/metadata.log"
fi

# Step 4: Create Git commit
print_status "Step 4: Creating Git commit for deployment..."

# Add all changed files
git add -A

# Check if there are changes to commit
if git diff --cached --quiet; then
    print_warning "No changes to commit"
else
    # Create commit message
    commit_message="feat: Complete book system implementation

- Add 33 real books with proper metadata
- Fix PDF URL routing to use /api/pdf/books/ format  
- Implement access control for premium books
- Update demo pages to use real Neema series
- Create comprehensive seed scripts
- Add book file management system

Books included:
- 3 free books (Neema series) for demo/preview
- 30 premium books requiring subscription/purchase

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

    git commit -m "$commit_message"
    print_success "Created Git commit"
fi

# Step 5: Display deployment instructions
print_status "Step 5: Final deployment instructions..."

echo ""
echo "🎉 DEPLOYMENT READY!"
echo ""
echo "📋 Next Steps:"
echo "1. Push to Git repository:"
echo "   git push origin main"
echo ""
echo "2. On production server, pull changes:"
echo "   git pull origin main"
echo ""
echo "3. Install dependencies and build:"
echo "   npm install"
echo "   npm run build"
echo ""
echo "4. Run database seed:"
echo "   npx tsx prisma/seed-real-books.ts"
echo ""
echo "5. Upload PDF files:"
echo "   # Upload from /Users/jihunkong/1001project/1001books"
echo "   # To server: public/books/ directory"
echo ""
echo "6. Restart application:"
echo "   docker-compose restart app"
echo ""
echo "📊 System Overview:"
echo "- 📚 33 books total (3 free + 30 premium)"
echo "- 🔒 Access control implemented"
echo "- 📱 Demo pages updated with real content"
echo "- 🌐 All API routes fixed for proper PDF serving"
echo ""
echo "🔗 Test URLs after deployment:"
echo "- Library: https://$REMOTE_SERVER/library"
echo "- Demo: https://$REMOTE_SERVER/demo/library"
echo "- Book detail: https://$REMOTE_SERVER/library/books/neema-01"
echo ""
print_success "Deployment preparation complete!"

echo ""
echo "📄 See DEPLOYMENT_NOTES.md for detailed information"
echo "🚀 Ready to deploy to $REMOTE_SERVER"