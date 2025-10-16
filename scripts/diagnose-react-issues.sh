#!/bin/bash

# diagnose-react-issues.sh
# Automated diagnostic script for React SSR and performance issues

set -e

COLOR_RED='\033[0;31m'
COLOR_GREEN='\033[0;32m'
COLOR_YELLOW='\033[1;33m'
COLOR_BLUE='\033[0;34m'
COLOR_RESET='\033[0m'

echo -e "${COLOR_BLUE}======================================${COLOR_RESET}"
echo -e "${COLOR_BLUE}  React Issues Diagnostic Tool${COLOR_RESET}"
echo -e "${COLOR_BLUE}======================================${COLOR_RESET}\n"

ISSUES_FOUND=0

# Check 1: SSR Issues - Browser-only libraries without dynamic import
echo -e "${COLOR_YELLOW}[1/5] Checking for SSR issues...${COLOR_RESET}"
SSR_ISSUES=$(grep -rn "import.*DOMPurify\|import.*window\|import.*document" --include="*.tsx" --include="*.ts" app/ components/ 2>/dev/null | grep -v "dynamic\|'use client'" || true)

if [ -n "$SSR_ISSUES" ]; then
  echo -e "${COLOR_RED}❌ Found potential SSR issues:${COLOR_RESET}"
  echo "$SSR_ISSUES"
  echo -e "\n${COLOR_YELLOW}💡 Solution: Use dynamic import with ssr: false${COLOR_RESET}"
  echo "Example:"
  echo "  const Component = dynamic(() => import('./Component'), { ssr: false, loading: () => <div>Loading...</div> });"
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
  echo -e "${COLOR_GREEN}✅ No obvious SSR issues found${COLOR_RESET}"
fi
echo ""

# Check 2: Dynamic imports without loading fallback
echo -e "${COLOR_YELLOW}[2/5] Checking dynamic imports...${COLOR_RESET}"
DYNAMIC_NO_LOADING=$(grep -rn "dynamic.*ssr.*false" --include="*.tsx" app/ components/ 2>/dev/null | while read -r line; do
  FILE=$(echo "$line" | cut -d: -f1)
  LINENUM=$(echo "$line" | cut -d: -f2)

  # Check if next 5 lines contain "loading:"
  if ! sed -n "${LINENUM},$((LINENUM + 5))p" "$FILE" | grep -q "loading:"; then
    echo "$line"
  fi
done)

if [ -n "$DYNAMIC_NO_LOADING" ]; then
  echo -e "${COLOR_RED}❌ Found dynamic imports without loading fallback:${COLOR_RESET}"
  echo "$DYNAMIC_NO_LOADING"
  echo -e "\n${COLOR_YELLOW}💡 Solution: Always provide loading fallback${COLOR_RESET}"
  echo "Example:"
  echo "  const Component = dynamic(() => import('./Component'), { "
  echo "    ssr: false,"
  echo "    loading: () => <div>Loading...</div>"
  echo "  });"
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
  echo -e "${COLOR_GREEN}✅ All dynamic imports have loading fallbacks${COLOR_RESET}"
fi
echo ""

# Check 3: Non-memoized callbacks passed as props
echo -e "${COLOR_YELLOW}[3/5] Checking for non-memoized callbacks...${COLOR_RESET}"
NON_MEMOIZED=$(grep -rn "const handle[A-Z][a-zA-Z]* = (" --include="*.tsx" app/ components/ 2>/dev/null | while read -r line; do
  FILE=$(echo "$line" | cut -d: -f1)
  LINENUM=$(echo "$line" | cut -d: -f2)
  FUNCNAME=$(echo "$line" | grep -o "handle[A-Z][a-zA-Z]*")

  # Check if the function uses useCallback
  if ! sed -n "${LINENUM}p" "$FILE" | grep -q "useCallback"; then
    # Check if this function is passed as a prop (look in next 20 lines)
    if sed -n "${LINENUM},$((LINENUM + 20))p" "$FILE" | grep -q "${FUNCNAME}"; then
      echo "$line"
    fi
  fi
done)

if [ -n "$NON_MEMOIZED" ]; then
  echo -e "${COLOR_RED}❌ Found non-memoized callbacks that might cause re-renders:${COLOR_RESET}"
  echo "$NON_MEMOIZED"
  echo -e "\n${COLOR_YELLOW}💡 Solution: Wrap with useCallback${COLOR_RESET}"
  echo "Example:"
  echo "  const handleChange = useCallback((data) => {"
  echo "    setState(data);"
  echo "  }, []);"
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
  echo -e "${COLOR_GREEN}✅ No obvious non-memoized callback issues${COLOR_RESET}"
fi
echo ""

# Check 4: useEffect with function dependencies
echo -e "${COLOR_YELLOW}[4/5] Checking useEffect dependencies...${COLOR_RESET}"
EFFECT_ISSUES=$(grep -rn "useEffect.*handle[A-Z]" --include="*.tsx" app/ components/ 2>/dev/null || true)

if [ -n "$EFFECT_ISSUES" ]; then
  echo -e "${COLOR_YELLOW}⚠️  Found useEffect with function dependencies:${COLOR_RESET}"
  echo "$EFFECT_ISSUES"
  echo -e "\n${COLOR_YELLOW}💡 Make sure these functions are memoized with useCallback${COLOR_RESET}"
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
  echo -e "${COLOR_GREEN}✅ No useEffect with function dependencies found${COLOR_RESET}"
fi
echo ""

# Check 5: Build check
echo -e "${COLOR_YELLOW}[5/5] Running production build check...${COLOR_RESET}"
if npm run build > /tmp/build-check.log 2>&1; then
  echo -e "${COLOR_GREEN}✅ Build successful - no SSR errors${COLOR_RESET}"
else
  echo -e "${COLOR_RED}❌ Build failed - check for SSR issues${COLOR_RESET}"
  echo -e "\n${COLOR_RED}Error log:${COLOR_RESET}"
  tail -n 20 /tmp/build-check.log
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi
echo ""

# Summary
echo -e "${COLOR_BLUE}======================================${COLOR_RESET}"
echo -e "${COLOR_BLUE}  Summary${COLOR_RESET}"
echo -e "${COLOR_BLUE}======================================${COLOR_RESET}"

if [ $ISSUES_FOUND -eq 0 ]; then
  echo -e "${COLOR_GREEN}✅ No issues found! Your React code looks healthy.${COLOR_RESET}"
  exit 0
else
  echo -e "${COLOR_RED}❌ Found $ISSUES_FOUND potential issue(s).${COLOR_RESET}"
  echo -e "\n${COLOR_YELLOW}📖 For detailed solutions, see: docs/TROUBLESHOOTING.md${COLOR_RESET}"
  exit 1
fi
