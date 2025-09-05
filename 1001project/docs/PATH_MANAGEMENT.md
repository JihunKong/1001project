# Path Management Guide - 1001 Stories

This document outlines the comprehensive path management system for book files, covers, and related assets in the 1001 Stories platform.

## Overview

The 1001 Stories platform serves digital books through a multi-layer architecture with clear separation between API routes, file storage, and user-facing URLs.

## Directory Structure

### Local Development
```
/Users/jihunkong/1001project/1001-stories/
├── public/
│   ├── books/                    # Book files directory
│   │   ├── {book-id}/           # Individual book folders
│   │   │   ├── main.pdf         # Primary book content
│   │   │   ├── front.pdf        # Front cover (PDF)
│   │   │   ├── back.pdf         # Back cover (PDF)
│   │   │   └── cover.png        # Cover image (PNG)
│   │   └── books.tar.gz         # Compressed archive of all books
│   ├── images/
│   │   └── placeholder-book.jpg # Fallback book cover
│   └── pdfs/                    # Legacy/sample PDFs
└── app/api/
    ├── pdf/[...path]/           # PDF serving API
    └── covers/[bookId]/         # Dynamic cover API
```

### Production Server
```
/var/www/1001-stories/
├── public/
│   ├── books/                   # Book files (TO BE UPLOADED)
│   └── images/
│       └── placeholder-book.jpg
└── ... (same structure as local)
```

## File Naming Conventions

### Book IDs
- Use kebab-case: `neema-01`, `second-chance`, `the-three-boys-eng`
- Match database Story.id exactly
- No spaces, special characters except hyphens
- Include language suffix when applicable: `-eng`, `-span`, `-fr`

### File Types
- **Main Content**: `main.pdf` - Primary book PDF
- **Front Cover**: `front.pdf` - PDF format front cover
- **Back Cover**: `back.pdf` - PDF format back cover  
- **Cover Image**: `cover.png` - PNG format cover (preferred)
- **Alternative**: `cover.jpg` - JPEG format cover (fallback)

## API Routes

### PDF Serving: `/api/pdf/books/{bookId}/{filename}`
- **Purpose**: Serves PDF files with access control
- **Access Control**: Comprehensive authentication and authorization
- **Examples**:
  - `/api/pdf/books/neema-01/main.pdf`
  - `/api/pdf/books/neema-01/front.pdf`
  - `/api/pdf/books/second-chance/back.pdf`

### Dynamic Covers: `/api/covers/{bookId}`
- **Purpose**: Serves book covers with intelligent fallbacks
- **Fallback Chain**:
  1. PNG cover: `/books/{bookId}/cover.png`
  2. PDF front cover: redirect to `/api/pdf/books/{bookId}/front.pdf`
  3. JPEG cover: `/books/{bookId}/cover.jpg`
  4. Placeholder: `/images/placeholder-book.jpg`

### Book Data: `/api/library/books/{bookId}`
- **Purpose**: Returns book metadata and access information
- **Cover Path**: Uses `/api/covers/{bookId}` for consistent cover serving

## Free Books (Preview Access)

### Hardcoded Free Books
```javascript
const freeBooks = ['neema-01', 'neema-02', 'neema-03'];
```

These books are accessible to all users (authenticated and unauthenticated) for preview purposes.

## File Verification Checklist

### Before Deployment
- [ ] Verify all book folders exist in `/public/books/`
- [ ] Check main.pdf files are not corrupted
- [ ] Confirm cover.png files exist for display
- [ ] Test PDF accessibility through API routes
- [ ] Validate book IDs match database records

### Books with Verified Covers (as of 2025-08-25)
```
a-gril-come-to-stanford, angel-prayer, appreciation, check-point-eng, 
check-point-span, fatuma, girl-with-a-hope-eng, greedy-fisherman, 
kakama-01, kakama-02, martha-01, martha-02, martha-03, mirror, 
my-life-eng, my-life-p-urh-pecha, my-life-span, neema-01, neema-02, 
neema-03, never-give-up, second-chance, steet-boy-part01-span, 
street-boy-part02-eng, test4, the-eyes-of-the-sun, the-indian-boy-s, 
the-story-of-a-thief-eng, the-three-boys-eng, the-three-boys-span, 
who-is-real
```

## Common Issues & Solutions

### "Invalid Root reference" Error
- **Cause**: PDF file missing or corrupted
- **Solution**: Upload/replace the corrupted PDF file
- **Prevention**: Verify file integrity before deployment

### Book Cover Not Displaying
- **Cause**: Missing cover.png file
- **Solution**: Use dynamic cover API (`/api/covers/{bookId}`)
- **Fallback**: Automatically uses placeholder image

### 401/403 Access Errors
- **Cause**: Authentication or authorization failure
- **Solution**: Check access control logic in `/api/pdf/[...path]/route.ts`
- **Free Books**: Ensure hardcoded free books list is updated

## Deployment Process

### Local Testing
```bash
# Verify book structure
ls -la public/books/neema-01/

# Test local API
curl http://localhost:3000/api/covers/neema-01
curl -I http://localhost:3000/api/pdf/books/neema-01/main.pdf
```

### Production Upload
```bash
# Create archive of books
tar -czf books.tar.gz books/

# Upload to server
scp books.tar.gz ubuntu@server:/tmp/

# Extract on server
ssh ubuntu@server "cd /var/www/1001-stories/public && tar -xzf /tmp/books.tar.gz"

# Verify permissions
ssh ubuntu@server "chmod -R 644 /var/www/1001-stories/public/books/"
```

## Path Resolution Logic

### Book Info Page Display
1. User visits: `/library/stories/neema-01`
2. API call: `/api/library/books/neema-01`
3. Cover display: `/api/covers/neema-01`
4. PDF viewer: `/api/pdf/books/neema-01/main.pdf`

### Cover Resolution
1. Check: `/books/neema-01/cover.png`
2. Fallback: Redirect to `/api/pdf/books/neema-01/front.pdf`
3. Final fallback: `/images/placeholder-book.jpg`

## Security Considerations

### Path Traversal Prevention
```javascript
// Sanitize book IDs
const sanitizedBookId = bookId.replace(/[^a-zA-Z0-9-_]/g, '');
```

### Access Control
- Free books: Accessible to all users
- Premium books: Require authentication + entitlement
- Admin access: Full access to all content

## File Size Considerations

### Current Sizes
- Individual PDFs: 10-30MB average
- Complete books.tar.gz: ~168MB
- Timeout considerations for uploads: Use 10-minute timeouts

### Optimization Strategies
- Upload books in batches
- Use rsync for incremental updates
- Compress before transfer

## Troubleshooting Commands

```bash
# Check if books directory exists
ls -la /var/www/1001-stories/public/books/

# Verify specific book files
ls -la /var/www/1001-stories/public/books/neema-01/

# Test PDF accessibility
curl -I https://yourdomain.com/api/pdf/books/neema-01/main.pdf

# Check server logs
docker logs 1001-stories-app

# Verify file permissions
find /var/www/1001-stories/public/books/ -type f -exec ls -l {} \;
```

## Contact & Support

For questions about path management or deployment issues:
- Check deployment logs: `./scripts/deploy.sh logs`
- Review this documentation
- Test locally before production deployment

---

**Last Updated**: 2025-08-25
**Version**: 1.0.0
**Maintainer**: Claude Code Assistant