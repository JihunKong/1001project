'use client';

import React from 'react';
import Link from 'next/link';

export default function KoreanPrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-soe-green-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="mb-8">
          <Link href="/" className="text-soe-green-600 hover:text-soe-green-700 flex items-center gap-2">
            ← 홈으로 돌아가기
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">개인정보처리방침</h1>
          <p className="text-gray-600 mb-2">Seeds of Empowerment (&ldquo;1001 Stories&rdquo;)</p>
          <p className="text-sm text-gray-500 mb-8">시행일: 2026년 2월 16일 | 최종 수정일: 2026년 2월 16일</p>

          <div className="prose prose-lg max-w-none text-gray-900">

            {/* 제1조 - 목적 */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제1조 (개인정보의 처리 목적)</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Seeds of Empowerment(이하 &ldquo;회사&rdquo;)은 1001 Stories 플랫폼(이하 &ldquo;서비스&rdquo;)의 운영과 관련하여 다음의 목적으로 개인정보를 처리합니다. 처리하는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 「개인정보 보호법」 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
              </p>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-300 text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-2 text-left">구분</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">처리 목적</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 font-medium">회원 관리</td>
                      <td className="border border-gray-300 px-4 py-2">회원제 서비스 이용에 따른 본인확인, 개인 식별, 가입 의사 확인, 연령 확인, 법정대리인 동의 확인, 불량회원의 부정이용 방지, 비인가 사용 방지, 가입 및 가입횟수 제한, 분쟁 조정을 위한 기록보존, 불만처리 등 민원처리, 고지사항 전달</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 font-medium">교육 서비스 제공</td>
                      <td className="border border-gray-300 px-4 py-2">교사-학생 매칭, 도서 배정, 독서 진행도 추적, 학습 성취 분석, 맞춤형 학습 콘텐츠 제공</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 font-medium">AI 기반 학습 지원</td>
                      <td className="border border-gray-300 px-4 py-2">AI를 활용한 글쓰기 리뷰 및 피드백, 이미지 생성(텍스트 전용 스토리), 텍스트 음성 변환(TTS), 단어 설명 및 퀴즈 생성</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 font-medium">콘텐츠 출판</td>
                      <td className="border border-gray-300 px-4 py-2">스토리 제출, 리뷰, 승인 및 출판 워크플로 관리</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 font-medium">서비스 개선</td>
                      <td className="border border-gray-300 px-4 py-2">접속빈도 파악, 서비스 이용 통계, 서비스 품질 개선</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* 제2조 - 수집항목 */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제2조 (수집하는 개인정보의 항목)</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                회사는 서비스 제공을 위해 필요한 최소한의 개인정보만을 수집합니다.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">1. 필수 수집 항목</h3>
              <div className="overflow-x-auto mb-4">
                <table className="min-w-full border-collapse border border-gray-300 text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-2 text-left">수집 시점</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">수집 항목</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">수집 목적</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2">회원가입 시</td>
                      <td className="border border-gray-300 px-4 py-2">이메일 주소, 이름, 역할(학생/교사/작가 등)</td>
                      <td className="border border-gray-300 px-4 py-2">회원 식별 및 서비스 제공</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2">아동 가입 시</td>
                      <td className="border border-gray-300 px-4 py-2">생년월일, 법정대리인 이메일</td>
                      <td className="border border-gray-300 px-4 py-2">연령 확인, 법정대리인 동의 취득</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2">교육 활동 시</td>
                      <td className="border border-gray-300 px-4 py-2">학급 코드, 독서 진행 기록, 학습 성취도</td>
                      <td className="border border-gray-300 px-4 py-2">교사-학생 매칭, 학습 관리</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">2. 선택 수집 항목</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-1 mb-4">
                <li>프로필 사진, 소속 기관명, 선호 언어</li>
                <li>스토리 콘텐츠 (본인이 작성·제출한 글)</li>
                <li>도서 리뷰 및 평점, 토론 참여 내용</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">3. 자동 수집 항목</h3>
              <p className="text-gray-700 mb-2">서비스 이용 과정에서 아래 정보가 자동으로 생성·수집될 수 있습니다:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-1">
                <li>IP 주소, 브라우저 종류 및 버전, 운영체제</li>
                <li>쿠키(Cookie), 접속 일시, 서비스 이용 기록</li>
                <li>기기 정보 (기기 유형, 화면 해상도)</li>
              </ul>
            </section>

            {/* 제3조 - 보유기간 */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제3조 (개인정보의 보유 및 이용 기간)</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                회사는 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 다만, 관계법령에 의해 보존할 필요가 있는 경우 아래와 같이 일정 기간 보관합니다.
              </p>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-300 text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-2 text-left">보유 정보</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">보유 기간</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">보유 근거</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2">회원 계정 정보</td>
                      <td className="border border-gray-300 px-4 py-2">회원 탈퇴 시까지</td>
                      <td className="border border-gray-300 px-4 py-2">서비스 이용 계약</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2">독서 진행 기록</td>
                      <td className="border border-gray-300 px-4 py-2">24개월</td>
                      <td className="border border-gray-300 px-4 py-2">교육 목적</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2">학습 활동 로그</td>
                      <td className="border border-gray-300 px-4 py-2">12개월</td>
                      <td className="border border-gray-300 px-4 py-2">서비스 개선</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2">퀴즈 결과</td>
                      <td className="border border-gray-300 px-4 py-2">24개월</td>
                      <td className="border border-gray-300 px-4 py-2">학습 평가</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2">법정대리인 동의 기록</td>
                      <td className="border border-gray-300 px-4 py-2">36개월</td>
                      <td className="border border-gray-300 px-4 py-2">COPPA/개인정보보호법 준수</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2">접속 및 감사 로그</td>
                      <td className="border border-gray-300 px-4 py-2">36개월</td>
                      <td className="border border-gray-300 px-4 py-2">정보통신망법, FERPA 준수</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2">결제 및 기부 기록</td>
                      <td className="border border-gray-300 px-4 py-2">5년</td>
                      <td className="border border-gray-300 px-4 py-2">전자상거래법</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2">불만 및 분쟁 처리 기록</td>
                      <td className="border border-gray-300 px-4 py-2">3년</td>
                      <td className="border border-gray-300 px-4 py-2">전자상거래법</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* 제4조 - 제3자 제공 */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제4조 (개인정보의 제3자 제공)</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                회사는 이용자의 개인정보를 제1조에서 명시한 범위 내에서만 처리하며, 이용자의 동의 없이 제3자에게 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다.
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-6">
                <li>이용자가 사전에 동의한 경우</li>
                <li>법률에 특별한 규정이 있거나 법령상 의무를 준수하기 위하여 불가피한 경우</li>
                <li>교사-학생 관계에서 교육 데이터의 공유 (학습 진행도, 과제 현황 등)</li>
              </ul>

              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">AI 서비스를 위한 개인정보 제3자 제공</h3>
                <p className="text-gray-700 mb-3">
                  본 서비스는 AI 기반 학습 지원 기능 제공을 위해 다음과 같이 개인정보를 제3자에게 제공합니다.
                </p>
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse border border-gray-300 text-sm">
                    <thead>
                      <tr className="bg-amber-100">
                        <th className="border border-gray-300 px-4 py-2 text-left">항목</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">내용</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2 font-medium">제공받는 자</td>
                        <td className="border border-gray-300 px-4 py-2">OpenAI, Inc. (미국 소재)</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2 font-medium">제공 항목</td>
                        <td className="border border-gray-300 px-4 py-2">이용자가 작성한 스토리 본문 텍스트, AI 리뷰 요청 텍스트</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2 font-medium">제공 목적</td>
                        <td className="border border-gray-300 px-4 py-2">AI 글쓰기 리뷰(문법·구조 분석), 이미지 생성, 텍스트 음성 변환(TTS), 퀴즈 생성</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2 font-medium">보유 기간</td>
                        <td className="border border-gray-300 px-4 py-2">API 호출 시 일시적 처리 후 미보관 (OpenAI API 정책에 따라 남용 모니터링 목적으로 최대 30일 보관 가능)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-gray-700 mt-3 font-medium">
                  ※ 학생의 성명, 이메일 주소 등 직접 식별 가능한 개인정보는 OpenAI에 전송되지 않습니다. 오직 이용자가 작성한 콘텐츠 텍스트만 전송됩니다.
                </p>
              </div>
            </section>

            {/* 제5조 - 위탁 */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제5조 (개인정보 처리의 위탁)</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                회사는 서비스 제공에 관한 계약을 이행하고 이용자의 편의 증진 등을 위하여 아래와 같이 개인정보 처리를 위탁하고 있습니다.
              </p>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-300 text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-2 text-left">수탁자</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">위탁 업무</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">보유 및 이용 기간</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2">Amazon Web Services, Inc. (미국)</td>
                      <td className="border border-gray-300 px-4 py-2">클라우드 서버 호스팅, 데이터 저장 및 백업</td>
                      <td className="border border-gray-300 px-4 py-2">서비스 제공 기간</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2">Google LLC (미국)</td>
                      <td className="border border-gray-300 px-4 py-2">OAuth 소셜 로그인 연동, SMTP 이메일 발송</td>
                      <td className="border border-gray-300 px-4 py-2">계정 연동 해제 시 / 발송 완료 시</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2">OpenAI, Inc. (미국)</td>
                      <td className="border border-gray-300 px-4 py-2">AI 콘텐츠 분석·생성 (글쓰기 리뷰, 이미지 생성, TTS)</td>
                      <td className="border border-gray-300 px-4 py-2">API 처리 즉시 삭제 (남용 모니터링: 최대 30일)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-gray-700 mt-4">
                회사는 위탁계약 체결 시 「개인정보 보호법」 제26조에 따라 위탁업무 수행 목적 외 개인정보 처리 금지, 기술적·관리적 보호조치, 재위탁 제한, 수탁자에 대한 관리·감독, 손해배상 등 책임에 관한 사항을 계약서 등 문서에 명시하고, 수탁자가 개인정보를 안전하게 처리하는지를 감독하고 있습니다.
              </p>
            </section>

            {/* 제6조 - 파기 */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제6조 (개인정보의 파기 절차 및 방법)</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다.
              </p>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">1. 파기 절차</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>이용자가 회원가입 등을 위해 입력한 정보는 목적이 달성된 후 별도의 DB로 옮겨져 내부 방침 및 기타 관련 법령에 의한 정보보호 사유에 따라 일정기간 저장된 후 파기됩니다.</li>
                <li>별도 DB로 옮겨진 개인정보는 법률에 의한 경우가 아니고서는 보유 이외의 다른 목적으로 이용되지 않습니다.</li>
                <li>GDPR 제17조(잊힐 권리)에 따른 삭제 요청 시 소프트 삭제(7일 복구 기간) 후 하드 삭제를 실행합니다.</li>
              </ul>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">2. 파기 방법</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>전자적 파일:</strong> 기록을 재생할 수 없도록 안전한 방법으로 삭제 (데이터베이스 레코드 삭제 및 익명화 처리)</li>
                <li><strong>종이 문서:</strong> 분쇄기로 분쇄하거나 소각</li>
                <li><strong>익명화 처리:</strong> 재식별이 불가능하도록 개인정보를 처리하여 통계·연구 등의 목적으로만 보관</li>
              </ul>
            </section>

            {/* 제7조 - 정보주체 권리 */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제7조 (정보주체의 권리·의무 및 행사방법)</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                이용자는 개인정보주체로서 다음과 같은 권리를 행사할 수 있습니다.
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li><strong>열람 요구:</strong> 자신의 개인정보 처리 현황을 열람 요구할 수 있습니다.</li>
                <li><strong>정정·삭제 요구:</strong> 개인정보의 오류 등에 대한 정정 또는 삭제를 요구할 수 있습니다.</li>
                <li><strong>처리정지 요구:</strong> 개인정보의 처리정지를 요구할 수 있습니다.</li>
                <li><strong>동의 철회:</strong> 개인정보 수집·이용에 대한 동의를 철회할 수 있습니다.</li>
                <li><strong>데이터 이동권:</strong> 자신의 개인정보를 구조화되고 기계 판독 가능한 형식으로 내보내기 할 수 있습니다.</li>
              </ul>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">권리 행사 방법</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li><strong>이메일:</strong> info@seedsofempowerment.org 로 요청서 발송</li>
                  <li><strong>온라인:</strong> 로그인 후 계정 설정 &gt; 개인정보 관리에서 직접 처리</li>
                  <li><strong>처리 기간:</strong> 요청일로부터 10일 이내 (「개인정보 보호법」 제38조)</li>
                  <li><strong>필요 정보:</strong> 본인 확인을 위한 이름, 이메일 주소, 요청 내용</li>
                </ul>
              </div>
            </section>

            {/* 제8조 - 보호책임자 */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제8조 (개인정보 보호책임자)</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 이용자의 개인정보 관련 불만처리 및 피해구제를 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
              </p>
              <div className="bg-blue-50 rounded-lg p-6 mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">개인정보 보호책임자</h3>
                <ul className="text-gray-700 space-y-1">
                  <li><strong>단체명:</strong> Seeds of Empowerment</li>
                  <li><strong>직위:</strong> 개인정보보호책임자 (Data Protection Officer)</li>
                  <li><strong>이메일:</strong> info@seedsofempowerment.org</li>
                </ul>
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">
                이용자는 서비스를 이용하면서 발생한 모든 개인정보 보호 관련 문의, 불만처리, 피해구제 등에 관한 사항을 개인정보 보호책임자에게 문의하실 수 있습니다. 회사는 이용자의 문의에 대해 지체 없이 답변 및 처리해 드릴 것입니다.
              </p>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">권익침해 구제방법</h3>
              <p className="text-gray-700 mb-3">
                개인정보침해로 인한 구제를 받으실 수 있는 기관은 아래와 같습니다.
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>개인정보보호위원회 (www.pipc.go.kr) — 전화: 1833-6972</li>
                <li>개인정보침해신고센터 (privacy.kisa.or.kr) — 전화: 118</li>
                <li>대검찰청 사이버수사과 (www.spo.go.kr) — 전화: 1301</li>
                <li>경찰청 사이버안전국 (cyberbureau.police.go.kr) — 전화: 182</li>
              </ul>
            </section>

            {/* 제9조 - 안전조치 */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제9조 (개인정보의 안전성 확보조치)</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                회사는 「개인정보 보호법」 제29조에 따라 다음과 같이 안전성 확보에 필요한 기술적·관리적 및 물리적 조치를 하고 있습니다.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">1. 기술적 조치</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>모든 데이터 전송에 SSL/TLS 암호화 적용 (HTTPS 강제)</li>
                <li>비밀번호 bcrypt 해싱 (솔트 라운드 12) 저장</li>
                <li>JWT 기반 세션 관리 및 httpOnly, secure, sameSite=strict 쿠키 설정</li>
                <li>Content Security Policy(CSP), X-Frame-Options, X-Content-Type-Options 등 보안 헤더 적용</li>
                <li>인증 엔드포인트 Rate Limiting (15분간 5회 제한)</li>
                <li>CSRF 토큰을 통한 교차 사이트 요청 위조 방지</li>
                <li>데이터베이스 암호화 저장 및 접근 통제</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">2. 관리적 조치</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>개인정보에 대한 접근 권한을 최소 인원으로 제한 (역할 기반 접근 통제: 8개 역할)</li>
                <li>개인정보를 처리하는 모든 행위에 대한 감사 로그(Audit Log) 기록</li>
                <li>개인정보 삭제 요청에 대한 전체 감사 추적(Audit Trail) 유지</li>
                <li>보안 사고 대응 절차 수립 및 운영</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">3. 물리적 조치</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>AWS 클라우드 인프라 내 데이터센터 물리적 보안 (AWS SOC 2 인증)</li>
                <li>서버 접근 시 SSH 키 기반 인증 (비밀번호 로그인 비활성화)</li>
                <li>정기적인 데이터 백업 및 복구 테스트</li>
              </ul>
            </section>

            {/* 제10조 - 쿠키 */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제10조 (쿠키의 설치·운영 및 거부)</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                회사는 이용자에게 개별적인 맞춤 서비스를 제공하기 위해 이용 정보를 저장하고 수시로 불러오는 &lsquo;쿠키(Cookie)&rsquo;를 사용합니다.
              </p>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">1. 쿠키의 사용 목적</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li><strong>인증 쿠키:</strong> 로그인 상태 유지 및 세션 관리 (next-auth.session-token)</li>
                <li><strong>CSRF 보호:</strong> 교차 사이트 요청 위조 방지 (next-auth.csrf-token)</li>
                <li><strong>언어 설정:</strong> 이용자 선호 언어 저장 (preferred-language)</li>
                <li><strong>보안:</strong> 쿠키에 httpOnly, secure, sameSite 속성 적용</li>
              </ul>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">2. 쿠키의 설치·운영 및 거부</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>이용자는 웹브라우저 설정을 통해 쿠키 저장을 거부할 수 있습니다.</li>
                <li>다만, 쿠키를 거부할 경우 로그인이 필요한 일부 서비스 이용이 어려울 수 있습니다.</li>
                <li>설정 방법: 브라우저 상단의 도구 &gt; 인터넷 옵션 &gt; 개인정보에서 쿠키 차단 설정</li>
              </ul>
            </section>

            {/* 만14세 미만 아동 보호 */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">부칙: 만14세 미만 아동의 개인정보 보호</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                회사는 만14세 미만 아동(이하 &ldquo;아동&rdquo;)의 개인정보 보호를 위해 「개인정보 보호법」 및 미국 COPPA(아동 온라인 개인정보 보호법)에 따라 다음과 같은 추가적인 보호조치를 취하고 있습니다.
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>아동의 개인정보를 수집하기 위해서는 법정대리인의 동의가 필요합니다.</li>
                <li>법정대리인은 아동의 개인정보 열람·정정·삭제·처리정지를 요구할 수 있습니다.</li>
                <li>아동의 개인정보는 교육 목적에 필요한 최소한의 항목만 수집합니다.</li>
                <li>아동을 대상으로 타겟 광고를 하지 않으며, 제3자에게 마케팅 목적으로 제공하지 않습니다.</li>
                <li>아동의 행동 데이터 수집 및 위치 정보 수집을 하지 않습니다.</li>
                <li>법정대리인 동의는 이메일 인증 방식으로 취득하며, 동의 기록은 36개월간 보관합니다.</li>
                <li>교사와 법정대리인은 학생 계정을 관리할 수 있습니다.</li>
              </ul>
              <p className="text-gray-700">
                ※ 본 서비스에서는 COPPA(미국, 만13세 미만)와 한국 개인정보보호법(만14세 미만) 중 더 엄격한 기준인 만14세 미만 기준을 적용합니다.
              </p>
            </section>

            {/* 법령 준수 */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">관련 법령 준수</h2>
              <p className="text-gray-700 leading-relaxed mb-4">본 서비스는 다음의 국내외 관련 법규를 준수합니다:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>대한민국 개인정보 보호법:</strong> 만14세 미만 아동 법정대리인 동의, 개인정보 처리방침 공개, 안전성 확보조치</li>
                <li><strong>초·중등교육법 제29조의2:</strong> 학습지원 소프트웨어 선정 기준 준수 (2026.3.1 시행)</li>
                <li><strong>COPPA (미국 아동 온라인 개인정보 보호법):</strong> 만13세 미만 아동의 부모 동의 필수</li>
                <li><strong>FERPA (미국 가족교육권리개인정보보호법):</strong> 학생 교육 기록 보호 및 부모의 접근 권리</li>
                <li><strong>GDPR (EU 일반 개인정보 보호규정):</strong> 데이터 이동권, 잊힐 권리, 명시적 동의</li>
              </ul>
            </section>

            {/* 고지 의무 */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">개인정보처리방침의 변경</h2>
              <p className="text-gray-700 leading-relaxed">
                이 개인정보처리방침은 2026년 2월 16일부터 적용됩니다. 법령, 정책 또는 보안 기술의 변경에 따라 내용의 추가·삭제 및 수정이 있을 시에는 변경사항의 시행 7일 전부터 서비스 공지사항 또는 이메일을 통하여 고지할 것입니다.
              </p>
            </section>

          </div>

          <div className="mt-12 pt-8 border-t border-gray-200 flex flex-wrap gap-4">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-soe-green-600 text-white rounded-lg hover:bg-soe-green-700 transition-colors"
            >
              홈으로 돌아가기
            </Link>
            <Link
              href="/legal/privacy"
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Privacy Policy (English)
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
