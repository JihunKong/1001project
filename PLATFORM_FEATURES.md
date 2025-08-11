### `PLATFORM_FEATURES.md`

# **1001 Stories Platform: Detailed Feature Specification**

This document provides a detailed breakdown of the features and user flows for each module of the 1001 Stories Platform. It is intended to be a guide for developers, designers, and project managers.

---

## **1. 초기 화면 (Role Selection Screen)**
> Landing Page 이후 사용자가 처음 마주하는 관문

* **(a) 목적:** 사용자가 자신의 주된 역할(`학습자`, `교사`, `학교/기관`)을 선택하여 개인화된 초기 화면과 기능으로 진입하도록 안내합니다.
* **(b) 역할 정의:**
    * **학습자 (Learner):** 영어 학습, 스토리 열람, 커뮤니티 활동 참여가 주 목적인 개인 사용자.
    * **교사 (Teacher):** 학급 운영에 1001 Stories 콘텐츠와 프로그램을 활용하려는 교육자.
    * **학교/기관 (Institution):** 학교 단위의 파트너십, 봉사자 연계, 프로그램 도입을 원하는 단체.
* **(c) 관리자 접근:** 관리자(Admin) 및 PM은 이 화면을 거치지 않고, `/admin`과 같은 별도의 지정된 URL 경로를 통해 관리자 대시보드에 직접 로그인합니다.

---

## **2. 사용자 페이지 (Learner Dashboard)**
> 학습자의 동기 부여와 성장을 위한 개인화된 공간

* **(a) 프로필 영역:**
    * 화면 상단에 사용자의 프로필 이미지, 이름(닉네임), 소속(선택) 등 기본 정보를 표시합니다.
* **(b) 나의 학습 현황 (Learning Status):**
    * 지금까지 완료한 코스, 총 학습 시간, 획득한 포인트/뱃지 등을 시각적인 위젯(그래프, 차트)으로 요약하여 보여줍니다.
* **(c) 오늘의 학습 목표 (Daily Goals):**
    * "스토리 1개 읽기", "단어 10개 퀴즈 풀기" 등 매일 달성 가능한 작은 목표를 제시하여 꾸준한 학습을 유도합니다.
* **(d) 코스 및 활동 (Courses & Activities):**
    * 현재 수강 중인 학습 코스, 참여 중인 커뮤니티 활동 등을 카드 형태로 보여주며, 각 카드는 진행률(progress bar)을 표시합니다.

---

## **3. 관리자 대시보드 (Admin Dashboard)**
> 프로젝트의 모든 과정을 통제하는 통합 관제 센터

* 관리자와 프로젝트 매니저(PM)를 위한 핵심 화면입니다.
* 스토리 출판의 전 과정을 **칸반(Kanban) 보드** 형태로 시각화합니다.
* **워크플로우 단계:** `접수 (Submitted)` → `검수 (Reviewed)` → `번역 (Translating)` → `일러스트 (Illustrating)` → `편집 (Editing)` → `출판 (Published)`.
* 각 스토리 카드는 드래그 앤 드롭으로 단계를 이동시킬 수 있으며, 담당자 할당, 마감일 설정, 진행 상황 메모 등의 기능을 포함합니다.

---

## **4. 봉사자 허브 (Volunteer Hub)**
> 글로벌 재능 기부자들을 위한 네트워킹 및 활동 공간

* **프로젝트 탐색:** 봉사자들이 자신의 스킬(번역, 디자인, 영상 편집 등)에 맞는 참여 가능 프로젝트를 검색하고 필터링할 수 있습니다.
* **활동 이력 관리:** 'My Page'에서 자신의 누적 봉사 시간, 참여 프로젝트 목록, 받은 감사장 및 인증서 등을 확인하고 관리할 수 있습니다.
* **커뮤니티 기능:** 특정 프로젝트나 지역 기반의 봉사자들끼리 소통할 수 있는 그룹 스페이스(게시판, 채팅)를 제공합니다.

---

## **5. 디지털 라이브러리 및 상점 (Digital Library & Shop)**
> 콘텐츠 소비와 가치 소비가 함께 일어나는 공간

* **디지털 라이브러리:**
    * 출판된 모든 스토리를 전자책(eBook) 형태로 제공합니다.
    * 사용자는 무료 샘플을 읽거나, 개별 구매 또는 프리미엄 구독을 통해 전체 콘텐츠를 열람할 수 있습니다.
* **상점 (E-commerce):**
    * **책 구매:** 출판된 스토리의 실물 도서(종이책)를 구매할 수 있습니다.
    * **굿즈 구매:** 1001 Stories의 로고, 캐릭터, 삽화를 활용한 공식 굿즈(문구, 의류, 액세서리 등)를 판매합니다.
    * 모든 판매 수익은 **Seeds of Empowerment** 프로그램을 통해 프로젝트에 재투자됨을 명시합니다.

---

## **6. 유료 기능 및 가치 제안 (Premium & Donation Modal)**
> 사용자의 결제가 어떻게 세상을 바꾸는지 보여주는 감동적인 장치

* **(a) 목적:** 유료 결제(구독, 구매, 기부)의 목적이 단순한 소비가 아닌, '기부', '재투자', '장학금'으로 이어지는 가치 있는 행동임을 명확하고 감동적으로 전달합니다.
* **(b) 구현 형태:** 사용자가 유료 콘텐츠를 클릭하거나 기부 버튼을 눌렀을 때, 현재 화면 위에 **팝업(Modal) 창** 형태로 표시됩니다.
* **(c) 핵심 내용:**
    * **제목:** "이야기로 세상을 바꾸는 방법 (How Your Support Changes the World)"
    * **가치 제안 (아이콘과 함께 시각화):**
        1.  **🌱 프로젝트 재투자 (Reinvesting in Projects):** 더 많은 아이들의 이야기를 발굴하고 책으로 만듭니다.
        2.  **🎓 학생 장학금 (Funding Scholarships):** 이야기의 주인공인 아이들에게 교육의 기회를 선물합니다.
        3.  **❤️ Seeds of Empowerment 운영 (Supporting the Mission):** 플랫폼을 지속 가능하게 운영합니다.
    * **Call to Action (CTA) 버튼:**
        * `[프리미엄 구독으로 모든 스토리 읽기]`
        * `[$50 기부로 아이의 꿈을 응원하기]` (금액은 예시)

---

## **7. 랜딩 페이지 (Landing Page)**
> 플랫폼의 모든 가치를 잠재적 사용자에게 소개하는 첫인상

* **(a) Hero Section:** "Empower Young Voices, Inspire the World"와 같이 플랫폼의 핵심 비전을 간결하고 강력한 헤드라인으로 소개합니다.
* **(b) Impact Section:** Seed of Empowerment 기부의 3가지 핵심 가치(재투자, 장학금, 기부)를 아이콘과 함께 시각적으로 설명합니다.
* **(c) Volunteer Section:**
    * **Headline:** "Empowering Global Volunteers, Amplifying Impact"
    * **Key Features:** `Centralized Volunteer Database`, `Skills-Based Matching`, `Progress Tracking & Communication`.
* **(d) School Section:**
    * **Headline:** "Bring Global Stories to Your Classroom"
    * **Subheadline:** "We partner with schools to offer engaging storytelling programs and connect them with talented volunteers."
    * **Key Benefits for Schools:** `Access to Diverse Programs`, `Volunteer Connection`, `Enriching Educational Content`, `Easy Application Process`.
* **(e) Call to Action (CTA) Section:**
    * **For Volunteers:** `[Join Our Global Volunteer Network]`
    * **For Donors/Supporters:** `[Donate to Seeds of Empowerment]`
    * **For Schools:** `[Explore Programs for Your School]`
* **(f) Footer:** 저작권 정보, 파트너사 로고, 소셜 미디어 링크, 연락처 등 신뢰도를 높이는 정보를 제공합니다.