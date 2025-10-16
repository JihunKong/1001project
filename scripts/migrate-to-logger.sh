#!/bin/bash

set -euo pipefail

REPORT_FILE="console-log-migration-report.md"

echo "# Console.log Migration Report" > "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "Generated: $(date)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "## Files with console statements"  >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

find app lib components -type f \( -name "*.ts" -o -name "*.tsx" \) \
  -exec grep -l "console\." {} \; | while read -r file; do

  count=$(grep -c "console\." "$file" || echo "0")

  if [ "$count" -gt 0 ]; then
    echo "- \`$file\`: $count statements" >> "$REPORT_FILE"
  fi
done

echo "" >> "$REPORT_FILE"
echo "## Total Statistics" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

total_files=$(find app lib components -type f \( -name "*.ts" -o -name "*.tsx" \) -exec grep -l "console\." {} \; | wc -l | tr -d ' ')
total_statements=$(find app lib components -type f \( -name "*.ts" -o -name "*.tsx" \) -exec grep -h "console\." {} \; | wc -l | tr -d ' ')

echo "- Total files with console statements: $total_files" >> "$REPORT_FILE"
echo "- Total console statements: $total_statements" >> "$REPORT_FILE"

echo "" >> "$REPORT_FILE"
echo "## Migration Progress" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "✅ Completed:" >> "$REPORT_FILE"
echo "- lib/auth.ts (16 statements)" >> "$REPORT_FILE"
echo "- lib/redis.ts (10 statements)" >> "$REPORT_FILE"
echo "- lib/rate-limit.ts (1 statement)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "📋 Remaining: $total_files files, $total_statements statements" >> "$REPORT_FILE"

echo "Migration report generated: $REPORT_FILE"
cat "$REPORT_FILE"
