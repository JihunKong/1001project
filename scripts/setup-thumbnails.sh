#!/bin/bash

# PDF Thumbnail System Setup Script
# This script sets up the dependencies and directories needed for the PDF thumbnail generation system

set -e

echo "🎯 Setting up PDF Thumbnail Generation System..."

# Check if running as root (needed for system package installation)
if [[ $EUID -eq 0 ]]; then
   echo "⚠️  This script should not be run as root (except for Docker installations)"
   echo "   Run without sudo for local development setup"
fi

# Detect operating system
OS="unknown"
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    OS="windows"
fi

echo "📋 Detected OS: $OS"

# Function to install poppler-utils based on OS
install_poppler() {
    echo "📦 Installing poppler-utils for PDF processing..."
    
    case $OS in
        "linux")
            # Check if we're in a Debian/Ubuntu system
            if command -v apt-get &> /dev/null; then
                echo "   Using apt-get (Debian/Ubuntu)..."
                if [[ $EUID -eq 0 ]]; then
                    apt-get update && apt-get install -y poppler-utils
                else
                    sudo apt-get update && sudo apt-get install -y poppler-utils
                fi
            # Check if we're in a Red Hat/CentOS system
            elif command -v yum &> /dev/null; then
                echo "   Using yum (Red Hat/CentOS)..."
                if [[ $EUID -eq 0 ]]; then
                    yum install -y poppler-utils
                else
                    sudo yum install -y poppler-utils
                fi
            # Check if we're in an Alpine system (Docker)
            elif command -v apk &> /dev/null; then
                echo "   Using apk (Alpine Linux)..."
                if [[ $EUID -eq 0 ]]; then
                    apk add --no-cache poppler-utils
                else
                    sudo apk add --no-cache poppler-utils
                fi
            else
                echo "❌ Unsupported Linux distribution. Please install poppler-utils manually."
                exit 1
            fi
            ;;
        "macos")
            if command -v brew &> /dev/null; then
                echo "   Using Homebrew..."
                brew install poppler
            elif command -v port &> /dev/null; then
                echo "   Using MacPorts..."
                sudo port install poppler
            else
                echo "❌ Please install Homebrew or MacPorts first, then run:"
                echo "   brew install poppler"
                echo "   or"
                echo "   sudo port install poppler"
                exit 1
            fi
            ;;
        "windows")
            echo "❌ Windows is not fully supported. Please install poppler manually:"
            echo "   1. Download poppler-utils from: https://github.com/oschwartz10612/poppler-windows"
            echo "   2. Extract to a folder (e.g., C:\\poppler)"
            echo "   3. Add C:\\poppler\\bin to your PATH environment variable"
            exit 1
            ;;
        *)
            echo "❌ Unsupported operating system: $OSTYPE"
            exit 1
            ;;
    esac
}

# Function to verify poppler installation
verify_poppler() {
    echo "🔍 Verifying poppler installation..."
    if command -v pdftoppm &> /dev/null; then
        echo "✅ pdftoppm found: $(which pdftoppm)"
        pdftoppm -h | head -1 || true
    else
        echo "❌ pdftoppm not found in PATH"
        return 1
    fi
}

# Function to create necessary directories
create_directories() {
    echo "📁 Creating thumbnail directories..."
    
    # Get the script directory and project root
    SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
    PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
    
    # Create thumbnail directories
    mkdir -p "$PROJECT_ROOT/public/thumbnails"
    chmod 755 "$PROJECT_ROOT/public/thumbnails"
    
    echo "✅ Created: $PROJECT_ROOT/public/thumbnails"
}

# Function to run database migration
run_migration() {
    echo "🗃️  Running database migration..."
    
    # Get the script directory and project root
    SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
    PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
    
    cd "$PROJECT_ROOT"
    
    # Check if DATABASE_URL is set
    if [[ -z "${DATABASE_URL}" ]]; then
        echo "⚠️  DATABASE_URL not set. Skipping migration."
        echo "   Please set DATABASE_URL and run: npx prisma migrate dev"
        return 0
    fi
    
    # Check if we can connect to the database
    if npx prisma db pull --preview-feature >/dev/null 2>&1; then
        echo "   Running Prisma migration..."
        npx prisma migrate dev --name add_book_thumbnails
        echo "✅ Database migration completed"
    else
        echo "⚠️  Cannot connect to database. Please run migration manually:"
        echo "   npx prisma migrate dev --name add_book_thumbnails"
    fi
}

# Function to verify Next.js dependencies
verify_dependencies() {
    echo "📋 Checking Node.js dependencies..."
    
    # Get the script directory and project root
    SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
    PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
    
    cd "$PROJECT_ROOT"
    
    # Check if package.json exists
    if [[ ! -f "package.json" ]]; then
        echo "❌ package.json not found. Are you in the correct directory?"
        return 1
    fi
    
    # Check for required dependencies
    REQUIRED_DEPS=("sharp" "pdfjs-dist")
    MISSING_DEPS=()
    
    for dep in "${REQUIRED_DEPS[@]}"; do
        if ! npm list "$dep" >/dev/null 2>&1; then
            MISSING_DEPS+=("$dep")
        fi
    done
    
    if [[ ${#MISSING_DEPS[@]} -gt 0 ]]; then
        echo "❌ Missing dependencies: ${MISSING_DEPS[*]}"
        echo "   Installing missing dependencies..."
        npm install "${MISSING_DEPS[@]}"
    else
        echo "✅ All required dependencies are installed"
    fi
}

# Function to create test thumbnail
test_thumbnail_generation() {
    echo "🧪 Testing thumbnail generation..."
    
    # This is a simple test - in a real scenario you'd test with a sample PDF
    echo "   Thumbnail generation test would require a sample PDF file."
    echo "   Manual test: Upload a PDF via /admin/books/upload to test the system."
}

# Main execution
main() {
    echo "🚀 Starting PDF Thumbnail System Setup"
    echo "======================================"
    
    # Install poppler-utils
    if ! command -v pdftoppm &> /dev/null; then
        install_poppler
    else
        echo "✅ poppler-utils already installed"
    fi
    
    # Verify poppler installation
    verify_poppler
    
    # Create directories
    create_directories
    
    # Verify dependencies
    verify_dependencies
    
    # Run database migration (optional)
    echo ""
    read -p "🗃️  Run database migration now? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        run_migration
    else
        echo "⚠️  Skipping migration. Run manually with: npx prisma migrate dev"
    fi
    
    # Test thumbnail generation
    test_thumbnail_generation
    
    echo ""
    echo "🎉 PDF Thumbnail System Setup Complete!"
    echo "======================================"
    echo ""
    echo "Next steps:"
    echo "1. Ensure your .env file has DATABASE_URL configured"
    echo "2. Run database migration if you haven't: npx prisma migrate dev"
    echo "3. Start your development server: npm run dev"
    echo "4. Test by uploading a PDF via /admin/books/upload"
    echo ""
    echo "📚 See docs/PDF_THUMBNAIL_SYSTEM.md for detailed usage instructions"
    echo ""
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "PDF Thumbnail System Setup Script"
        echo ""
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h          Show this help message"
        echo "  --verify-only       Only verify installation, don't install"
        echo "  --no-migration      Skip database migration"
        echo ""
        exit 0
        ;;
    --verify-only)
        echo "🔍 Verification Mode"
        verify_poppler
        verify_dependencies
        exit 0
        ;;
    --no-migration)
        echo "🚀 Setup without migration"
        install_poppler
        verify_poppler
        create_directories
        verify_dependencies
        test_thumbnail_generation
        echo "✅ Setup complete (migration skipped)"
        exit 0
        ;;
    "")
        # No arguments, run full setup
        main
        ;;
    *)
        echo "❌ Unknown argument: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac