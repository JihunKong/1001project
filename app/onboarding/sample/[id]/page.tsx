'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface SampleStory {
  id: string
  title: string
  content: string
  author: string
  readingTime: number
  description: string
}

export default function SampleStoryPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const [story, setStory] = useState<SampleStory | null>(null)
  const [startTime, setStartTime] = useState<number>(Date.now())
  const [loading, setLoading] = useState(true)

  // 샘플 스토리 데이터 (실제로는 API에서 가져와야 함)
  const sampleStories: { [key: string]: SampleStory } = {
    'kamala': {
      id: 'kamala',
      title: '카말라의 꿈',
      author: '라지 (13세, 네팔)',
      readingTime: 5,
      description: '네팔 산간 마을에 사는 소녀 카말라가 교육을 통해 꿈을 이루어가는 이야기',
      content: `
히말라야 산맥의 작은 마을에 카말라라는 소녀가 살고 있었습니다. 

매일 아침, 카말라는 해가 뜨기 전에 일어나 물을 길러 가야 했습니다. 학교는 산 너머에 있어서 걸어서 두 시간이 걸렸지만, 카말라는 한 번도 학교 가기를 포기한 적이 없었습니다.

"왜 그렇게 힘들게 학교에 가려고 하니?" 마을 사람들이 물었습니다.

"공부를 해서 의사가 되고 싶어요. 우리 마을에 병원을 짓고 싶거든요." 카말라가 대답했습니다.

카말라의 가족은 가난했지만, 부모님은 딸의 꿈을 응원해주었습니다. 아버지는 "교육이 가장 좋은 선물이다"라고 늘 말씀하셨습니다.

어느 날, 카말라는 학교에서 열린 글쓰기 대회에서 1등을 했습니다. 상금으로 받은 책들을 보며 카말라는 더욱 열심히 공부하겠다고 다짐했습니다.

몇 년 후, 카말라는 장학금을 받아 수도 카트만두의 의과대학에 진학할 수 있었습니다. 

지금 카말라는 의사가 되어 고향 마을에 작은 진료소를 운영하고 있습니다. 그리고 마을의 다른 아이들에게도 "꿈을 포기하지 말라"고 이야기해줍니다.

"교육은 우리에게 날개를 달아줍니다. 어떤 산이든 넘을 수 있는 힘을 주지요." 카말라가 말했습니다.
      `
    },
    'inventor': {
      id: 'inventor',
      title: '미래의 발명가',
      author: '아미드 (12세, 방글라데시)',
      readingTime: 4,
      description: '작은 마을 소년이 발명을 통해 마을의 문제를 해결해나가는 이야기',
      content: `
방글라데시의 작은 마을에 아미드라는 소년이 살고 있었습니다.

아미드는 늘 "왜?"라는 질문을 입에 달고 살았습니다. "왜 정전이 자주 일어나지?" "왜 우물물이 더러워졌지?" "왜 농사가 잘 안 되지?"

마을 사람들은 처음에 아미드를 이상하게 여겼습니다. 하지만 아미드는 포기하지 않고 계속 관찰하고 생각했습니다.

어느 날, 아미드는 버려진 자전거 바퀴와 구리선으로 작은 발전기를 만들었습니다. 바람이 불면 전기가 만들어져서 작은 전구에 불이 들어왔습니다.

"우와! 정말 신기하다!" 마을 아이들이 모여들었습니다.

아미드는 더 큰 발전기를 만들어 집에 전기를 공급했습니다. 이제 밤에도 책을 읽을 수 있게 되었습니다.

다음으로 아미드는 물 정화 장치를 만들었습니다. 간단한 필터를 통해 더러운 물을 깨끗하게 만드는 장치였습니다.

"어떻게 이런 걸 생각해냈니?" 선생님이 물으셨습니다.

"문제가 있으면 해결 방법도 있다고 생각해요. 포기하지 않고 계속 시도하면 답을 찾을 수 있어요." 아미드가 대답했습니다.

아미드의 발명품들은 마을 전체에 도움이 되었습니다. 그리고 아미드는 다른 아이들에게도 발명하는 방법을 가르쳐주기 시작했습니다.

지금 아미드는 공과대학에서 공부하며 더 큰 발명을 준비하고 있습니다. "작은 아이디어가 세상을 바꿀 수 있어요"라고 아미드는 믿고 있습니다.
      `
    },
    'bridge': {
      id: 'bridge',
      title: '우정의 다리',
      author: '마리아 (11세, 페루)',
      readingTime: 6,
      description: '서로 다른 문화를 가진 두 마을 아이들이 우정으로 하나가 되는 이야기',
      content: `
안데스 산맥의 두 마을 사이에는 깊은 계곡이 있었습니다.

한쪽은 스페인어를 쓰는 마을, 다른 쪽은 케추아어를 쓰는 원주민 마을이었습니다. 두 마을은 오랫동안 서로 교류하지 않고 살아왔습니다.

마리아는 스페인어 마을에 사는 소녀였습니다. 어느 날, 강에서 물을 길러 가다가 다리 건너편에서 혼자 놀고 있는 소녀를 보았습니다.

"안녕!" 마리아가 손을 흔들었습니다.

건너편 소녀도 수줍게 손을 흔들어 주었습니다. 그 소녀의 이름은 추스피였습니다.

언어는 달랐지만, 두 소녀는 손짓과 몸짓으로 대화하기 시작했습니다. 마리아는 스페인어 단어를 가르쳐주고, 추스피는 케추아어를 알려주었습니다.

"아미가(친구)" "일라파(친구)"

같은 뜻의 다른 말이었지만, 두 소녀에게는 같은 마음이었습니다.

어느 날, 추스피의 마을에 큰 병이 돌았습니다. 마리아는 자신의 마을 의사 아저씨에게 도움을 요청했습니다.

"우리가 도와야 해요. 그들도 우리와 같은 사람이에요." 마리아가 말했습니다.

처음에는 망설이던 어른들도 마리아의 말에 감동받아 도움을 주기로 했습니다.

의사 아저씨와 약을 가지고 건너편 마을로 갔습니다. 추스피의 마을 사람들은 너무나 고마워했습니다.

그날 이후로 두 마을은 서로 도우며 살게 되었습니다. 한쪽 마을에서 기른 감자와 다른 마을에서 만든 직물을 나누어 썼습니다.

마리아와 추스피는 두 언어를 모두 배워서 마을 사람들이 소통할 수 있도록 도와주었습니다.

"다른 것이 나쁜 게 아니에요. 다름이 있어야 더 풍성한 세상이 돼요." 마리아가 말했습니다.

지금도 그 두 마을은 '우정의 다리'로 이어져 있습니다. 그리고 마리아와 추스피는 평생 친구로 지내고 있습니다.
      `
    }
  }

  useEffect(() => {
    if (!session) {
      router.push('/login?callbackUrl=/onboarding')
      return
    }

    const storyId = params?.id as string
    if (storyId && sampleStories[storyId]) {
      setStory(sampleStories[storyId])
      setStartTime(Date.now())
      
      // 접근 기록
      recordAccess(storyId)
    }
    
    setLoading(false)
  }, [session, params, router])

  const recordAccess = async (storyId: string) => {
    try {
      await fetch('/api/onboarding/sample-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ storyId }),
      })
    } catch (error) {
      console.error('Failed to record access:', error)
    }
  }

  const handleComplete = async () => {
    if (!story) return

    const timeSpent = Math.round((Date.now() - startTime) / 1000 / 60) // minutes

    try {
      await fetch('/api/onboarding/sample-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          storyId: story.id, 
          timeSpent 
        }),
      })

      // 온보딩 진행상황도 업데이트
      await fetch('/api/onboarding/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stepIndex: 2, // SAMPLE_STORIES step
          completed: true,
          activityType: 'STORY_VIEW',
          contentId: story.id,
          timeSpent
        }),
      })

      router.push('/onboarding')
    } catch (error) {
      console.error('Failed to record completion:', error)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg">로딩 중...</div>
    </div>
  }

  if (!story) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            스토리를 찾을 수 없습니다
          </h1>
          <Link 
            href="/onboarding"
            className="text-blue-500 hover:text-blue-700 underline"
          >
            온보딩 존으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/onboarding"
              className="flex items-center text-gray-600 hover:text-gray-800"
            >
              <span className="mr-2">←</span>
              온보딩 존으로 돌아가기
            </Link>
            <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
              샘플 스토리
            </div>
          </div>
        </div>
      </div>

      {/* 스토리 콘텐츠 */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <article className="bg-white rounded-lg shadow-sm p-8">
          {/* 스토리 헤더 */}
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {story.title}
            </h1>
            <div className="flex items-center text-gray-600 mb-4">
              <span className="mr-6">작가: {story.author}</span>
              <span>예상 읽기 시간: {story.readingTime}분</span>
            </div>
            <p className="text-gray-700 text-lg leading-relaxed">
              {story.description}
            </p>
          </header>

          {/* 스토리 본문 */}
          <div className="prose max-w-none">
            {story.content.split('\n').map((paragraph, index) => (
              paragraph.trim() && (
                <p key={index} className="text-gray-800 leading-relaxed mb-4">
                  {paragraph.trim()}
                </p>
              )
            ))}
          </div>

          {/* 완료 버튼 */}
          <div className="mt-12 text-center">
            <button
              onClick={handleComplete}
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-colors"
            >
              읽기 완료 🎉
            </button>
            <p className="text-gray-500 text-sm mt-3">
              완료 버튼을 누르면 온보딩 진행률이 업데이트됩니다
            </p>
          </div>
        </article>

        {/* 다른 샘플 스토리 추천 */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            다른 샘플 스토리
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {Object.values(sampleStories)
              .filter(s => s.id !== story.id)
              .map((otherStory) => (
                <Link
                  key={otherStory.id}
                  href={`/onboarding/sample/${otherStory.id}`}
                  className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <h3 className="font-semibold text-lg mb-2">
                    {otherStory.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    {otherStory.author}
                  </p>
                  <p className="text-gray-700 text-sm">
                    {otherStory.description}
                  </p>
                </Link>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}