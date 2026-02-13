#!/usr/bin/env python3
"""
학습지원 소프트웨어 필수기준 체크리스트 PDF 생성 스크립트
1001 Stories 개인정보보호 기준 충족 여부 문서
"""

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from datetime import datetime
import os

# 한글 폰트 설정 (macOS)
font_paths = [
    "/System/Library/Fonts/AppleSDGothicNeo.ttc",
    "/System/Library/Fonts/Supplemental/AppleGothic.ttf",
    "/Library/Fonts/NanumGothic.ttf",
]

font_registered = False
for font_path in font_paths:
    if os.path.exists(font_path):
        try:
            pdfmetrics.registerFont(TTFont('Korean', font_path))
            font_registered = True
            break
        except:
            continue

if not font_registered:
    print("Warning: Korean font not found, using default font")
    FONT_NAME = "Helvetica"
else:
    FONT_NAME = "Korean"

def create_checklist_pdf(output_path):
    c = canvas.Canvas(output_path, pagesize=A4)
    width, height = A4

    # Title
    c.setFont(FONT_NAME, 18)
    c.drawCentredString(width/2, height - 40*mm, "학습지원 소프트웨어 필수기준 체크리스트")

    # Subtitle
    c.setFont(FONT_NAME, 12)
    c.drawCentredString(width/2, height - 50*mm, "1001 Stories 개인정보보호 기준 충족 현황")

    y = height - 70*mm

    # Section 1: Product Overview
    c.setFont(FONT_NAME, 14)
    c.drawString(20*mm, y, "1. 제품/서비스 개요")
    y -= 10*mm

    c.setFont(FONT_NAME, 10)
    items = [
        ("제품/서비스명:", "1001 Stories"),
        ("공급자:", "Seeds of Empowerment"),
        ("접속경로:", "https://1001stories.seedsofempowerment.org"),
        ("주요 내용:", "AI 기반 글로벌 교육 플랫폼, 아동 스토리 출판 및 학습 지원"),
    ]

    for label, value in items:
        c.drawString(25*mm, y, f"{label} {value}")
        y -= 6*mm

    y -= 10*mm

    # Section 2: Privacy Compliance Checklist
    c.setFont(FONT_NAME, 14)
    c.drawString(20*mm, y, "2. 개인정보보호 기준 충족여부")
    y -= 12*mm

    checklist_items = [
        ("1-1", "개인정보 최소 수집", "충족", "개인정보 처리방침 Section 1 (수집하는 정보)"),
        ("1-2", "수집·이용 목적 기재", "충족", "개인정보 처리방침 Section 2 (정보 사용 방법)"),
        ("1-3", "수집항목, 보유기간 기재", "충족", "개인정보 처리방침 Section 1, 10 (보유 및 파기)"),
        ("2-1", "안전성 확보 조치", "충족", "개인정보 처리방침 Section 5 (데이터 보안)"),
        ("3-1", "열람/정정/삭제/처리정지 절차", "충족", "개인정보 처리방침 Section 6, 7 (귀하의 권리, 보호책임자)"),
        ("4-1", "만 14세 미만 아동 보호", "충족", "개인정보 처리방침 Section 4, 11, 12 (아동 보호, 법령준수)"),
        ("5-1", "보호책임자 정보", "충족", "개인정보 처리방침 Section 7 (개인정보 보호책임자)"),
        ("5-2", "제3자 제공 정보", "충족", "개인정보 처리방침 Section 3 (정보 공유)"),
        ("5-3", "위·수탁 관계 정보", "충족", "개인정보 처리방침 Section 9 (개인정보 처리 위탁)"),
    ]

    c.setFont(FONT_NAME, 9)

    # Table header
    c.setFillColorRGB(0.9, 0.9, 0.9)
    c.rect(20*mm, y - 3*mm, width - 40*mm, 8*mm, fill=1)
    c.setFillColorRGB(0, 0, 0)

    c.drawString(22*mm, y, "항목")
    c.drawString(38*mm, y, "세부 내용")
    c.drawString(100*mm, y, "충족여부")
    c.drawString(120*mm, y, "근거")
    y -= 10*mm

    for code, desc, status, reference in checklist_items:
        # Draw checkbox
        if status == "충족":
            c.setFillColorRGB(0.2, 0.7, 0.2)
            c.drawString(100*mm, y, "✓ 충족")
            c.setFillColorRGB(0, 0, 0)
        else:
            c.drawString(100*mm, y, "○ 미충족")

        c.drawString(22*mm, y, code)
        c.drawString(38*mm, y, desc[:20])
        c.drawString(120*mm, y, reference[:30])
        y -= 7*mm

        if y < 40*mm:
            c.showPage()
            y = height - 30*mm
            c.setFont(FONT_NAME, 9)

    y -= 10*mm

    # Section 3: Detailed Evidence
    c.setFont(FONT_NAME, 14)
    c.drawString(20*mm, y, "3. 상세 근거")
    y -= 10*mm

    c.setFont(FONT_NAME, 9)
    details = [
        "• 수집 정보: 이름, 이메일, 교육 역할, 기관 소속 (개인정보 처리방침 Section 1)",
        "• 사용 목적: 교육 서비스 제공, 학습 경험 개인화, 보안 유지 등 6가지 (Section 2)",
        "• 보유 기간: 독서 기록 24개월, 활동 로그 12개월, 부모 동의 기록 36개월 (Section 10)",
        "• 보안 조치: SSL/TLS 암호화, 암호화된 DB 저장, 정기 보안 감사 (Section 5)",
        "• 권리 행사: 이메일(privacy@1001stories.org) 또는 설정 페이지, 10일 이내 처리 (Section 7)",
        "• 아동 보호: 14세 미만 법정대리인 동의 필수, COPPA/PIPA 준수 (Section 4, 11)",
        "• 보호책임자: Seeds of Empowerment, privacy@1001stories.org (Section 7)",
        "• 제3자 제공: 교사(교육 데이터), 서비스 제공업체, 법적 요청 시 (Section 3)",
        "• 위탁 업체: OpenAI(이미지/TTS 생성, 미국), 위탁 내용 명시 (Section 9)",
    ]

    for detail in details:
        if y < 30*mm:
            c.showPage()
            y = height - 30*mm
            c.setFont(FONT_NAME, 9)
        c.drawString(22*mm, y, detail[:80])
        y -= 6*mm

    y -= 10*mm

    # Section 4: Complaint Channels
    c.setFont(FONT_NAME, 14)
    c.drawString(20*mm, y, "4. 권익침해 구제방법")
    y -= 10*mm

    c.setFont(FONT_NAME, 9)
    complaints = [
        "• 개인정보보호위원회 (www.pipc.go.kr) - 1833-6972",
        "• 개인정보침해신고센터 (privacy.kisa.or.kr) - 118",
        "• 대검찰청 사이버수사과 (www.spo.go.kr) - 1301",
        "• 경찰청 사이버안전국 (cyberbureau.police.go.kr) - 182",
    ]

    for complaint in complaints:
        c.drawString(22*mm, y, complaint)
        y -= 6*mm

    y -= 15*mm

    # Footer
    c.setFont(FONT_NAME, 10)
    c.drawString(20*mm, y, f"작성일: {datetime.now().strftime('%Y년 %m월 %d일')}")
    y -= 7*mm
    c.drawString(20*mm, y, "문의처: privacy@1001stories.org")
    y -= 7*mm
    c.drawString(20*mm, y, "개인정보 처리방침: https://1001stories.seedsofempowerment.org/privacy")

    # Page footer
    c.setFont(FONT_NAME, 8)
    c.drawCentredString(width/2, 15*mm, "1001 Stories - Seeds of Empowerment")

    c.save()
    print(f"PDF created: {output_path}")

if __name__ == "__main__":
    output_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(output_dir, "..", "public", "documents", "privacy-checklist-2026.pdf")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    create_checklist_pdf(output_path)
