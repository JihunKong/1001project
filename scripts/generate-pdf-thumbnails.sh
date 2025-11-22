#!/bin/bash

# PDF → JPG 썸네일 생성 스크립트
# 사용법: ./scripts/generate-pdf-thumbnails.sh

set -e

# 디렉토리 설정
COVERS_DIR="/Users/jihunkong/Downloads/images/covers"
cd "$COVERS_DIR" || exit 1

echo "📂 작업 디렉토리: $COVERS_DIR"
echo ""

# poppler 설치 확인
if ! command -v pdftoppm &> /dev/null; then
    echo "❌ pdftoppm이 설치되지 않았습니다."
    echo "🔧 설치 명령: brew install poppler"
    exit 1
fi

echo "✅ pdftoppm 설치 확인 완료"
echo ""

# PDF 파일 개수 확인
PDF_COUNT=$(ls -1 *.pdf 2>/dev/null | wc -l | tr -d ' ')
echo "📄 발견된 PDF 파일: ${PDF_COUNT}개"

# 이미 생성된 JPG 파일 개수
EXISTING_JPG=$(ls -1 *.jpg 2>/dev/null | wc -l | tr -d ' ')
echo "🖼️  기존 JPG 파일: ${EXISTING_JPG}개"
echo ""

# 카운터 초기화
GENERATED=0
SKIPPED=0
FAILED=0

echo "🚀 썸네일 생성 시작..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 모든 PDF 파일 처리
for pdf_file in *.pdf; do
    # JPG 파일명 생성
    jpg_file="${pdf_file%.pdf}.jpg"

    # 이미 JPG가 있으면 스킵
    if [ -f "$jpg_file" ]; then
        echo "⏭️  스킵: $jpg_file (이미 존재)"
        SKIPPED=$((SKIPPED + 1))
        continue
    fi

    echo "🔄 처리 중: $pdf_file"

    # PDF → JPG 변환 (첫 페이지만, 1200px 너비로)
    if pdftoppm -jpeg -f 1 -l 1 -scale-to-x 1200 -scale-to-y -1 "$pdf_file" "${pdf_file%.pdf}" > /dev/null 2>&1; then
        # pdftoppm은 파일명에 -1을 추가함 (예: BOOK-1.jpg)
        # 파일명 정리
        if [ -f "${pdf_file%.pdf}-1.jpg" ]; then
            mv "${pdf_file%.pdf}-1.jpg" "$jpg_file"
            echo "✅ 생성 완료: $jpg_file"
            GENERATED=$((GENERATED + 1))
        else
            echo "❌ 실패: $jpg_file (파일명 문제)"
            FAILED=$((FAILED + 1))
        fi
    else
        echo "❌ 실패: $jpg_file (변환 오류)"
        FAILED=$((FAILED + 1))
    fi

    echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 작업 완료 요약"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 새로 생성: ${GENERATED}개"
echo "⏭️  스킵: ${SKIPPED}개"
echo "❌ 실패: ${FAILED}개"
echo "📄 총 PDF: ${PDF_COUNT}개"
echo "🖼️  총 JPG: $((EXISTING_JPG + GENERATED))개"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "🎉 모든 썸네일 생성 완료!"
else
    echo "⚠️  일부 파일 처리 실패 (${FAILED}개)"
    exit 1
fi
