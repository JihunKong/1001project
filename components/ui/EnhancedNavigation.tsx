'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { ExtendedSession } from '@/types/api'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Bars3Icon,
  XMarkIcon,
  BookOpenIcon,
  HomeIcon,
  UserGroupIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  QuestionMarkCircleIcon,
  BellIcon,
  ChevronDownIcon,
  AcademicCapIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { UserIcon } from '@heroicons/react/24/solid'

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  current?: boolean
  badge?: number
  roles?: string[]
  description?: string
}

interface UserMenuProps {
  session: ExtendedSession
  onSignOut: () => void
  onTriggerOnboarding?: () => void
}

const UserMenu = ({ session, onSignOut, onTriggerOnboarding }: UserMenuProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
        buttonRef.current?.focus()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'LEARNER':
        return 'bg-soe-green-50 text-soe-green-800'
      case 'TEACHER':
        return 'bg-green-100 text-green-800'
      case 'WRITER':
        return 'bg-purple-100 text-purple-800'
      case 'STORY_MANAGER':
      case 'BOOK_MANAGER':
      case 'CONTENT_ADMIN':
        return 'bg-orange-100 text-orange-800'
      case 'ADMIN':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'LEARNER':
        return '학습자'
      case 'TEACHER':
        return '교사'
      case 'WRITER':
        return '작가'
      case 'STORY_MANAGER':
        return '스토리 관리자'
      case 'BOOK_MANAGER':
        return '북 관리자'
      case 'CONTENT_ADMIN':
        return '콘텐츠 관리자'
      case 'ADMIN':
        return '시스템 관리자'
      default:
        return role
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        ref={buttonRef}
        type="button"
        className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-soe-green-400 hover:bg-gray-100 p-2 transition-colors"
        id="user-menu-button"
        aria-expanded={isOpen}
        aria-haspopup="true"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`사용자 메뉴 ${isOpen ? '닫기' : '열기'}`}
      >
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-soe-green-400 to-soe-green-600 rounded-full flex items-center justify-center">
            <UserIcon className="w-5 h-5 text-white" />
          </div>
          <div className="hidden md:block text-left">
            <div className="text-sm font-medium text-gray-700">
              {session.user?.name || session.user?.email?.split('@')[0]}
            </div>
            <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(session.user?.role)}`}>
              {getRoleDisplayName(session.user?.role)}
            </div>
          </div>
          <ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div
          className="origin-top-right absolute right-0 mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="user-menu-button"
          tabIndex={-1}
        >
          <div className="py-1" role="none">
            {/* User info header */}
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900">
                {session.user?.name || '사용자'}
              </p>
              <p className="text-sm text-gray-500 truncate">
                {session.user?.email}
              </p>
            </div>

            {/* Menu items */}
            <Link
              href="/dashboard/profile"
              className="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              role="menuitem"
              onClick={() => setIsOpen(false)}
            >
              <UserIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
              프로필 설정
            </Link>

            {onTriggerOnboarding && (
              <button
                className="group flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                role="menuitem"
                onClick={() => {
                  onTriggerOnboarding()
                  setIsOpen(false)
                }}
              >
                <QuestionMarkCircleIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                사용법 다시 보기
              </button>
            )}

            <Link
              href="/help"
              className="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              role="menuitem"
              onClick={() => setIsOpen(false)}
            >
              <QuestionMarkCircleIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
              도움말
            </Link>

            <div className="border-t border-gray-100 my-1"></div>

            <button
              className="group flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 hover:text-red-900"
              role="menuitem"
              onClick={() => {
                onSignOut()
                setIsOpen(false)
              }}
            >
              <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-red-400 group-hover:text-red-500" />
              로그아웃
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

interface EnhancedNavigationProps {
  onTriggerOnboarding?: () => void
}

export default function EnhancedNavigation({ onTriggerOnboarding }: EnhancedNavigationProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState(3) // Mock notification count

  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null)

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  // Handle mobile menu keyboard navigation
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false)
        mobileMenuButtonRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isMobileMenuOpen])

  // Get navigation items based on user role
  const getNavigationItems = useCallback((): NavigationItem[] => {
    if (!session?.user?.role) return []

    const commonItems: NavigationItem[] = [
      {
        name: '홈',
        href: '/',
        icon: HomeIcon,
        current: pathname === '/',
        description: '메인 페이지로 이동'
      },
      {
        name: '도서관',
        href: '/library',
        icon: BookOpenIcon,
        current: pathname.startsWith('/library'),
        description: '전체 도서 목록 보기'
      }
    ]

    switch (session.user.role) {
      case 'LEARNER':
        return [
          ...commonItems,
          {
            name: '내 책장',
            href: '/dashboard/learner',
            icon: AcademicCapIcon,
            current: pathname.startsWith('/dashboard/learner'),
            description: '배정받은 책과 읽기 진도 확인'
          },
          {
            name: '북클럽',
            href: '/dashboard/bookclub',
            icon: UserGroupIcon,
            current: pathname.startsWith('/dashboard/bookclub'),
            description: '친구들과 함께 읽기'
          }
        ]

      case 'TEACHER':
        return [
          ...commonItems,
          {
            name: '대시보드',
            href: '/dashboard/teacher',
            icon: AcademicCapIcon,
            current: pathname.startsWith('/dashboard/teacher'),
            description: '클래스와 학생 관리'
          },
          {
            name: '클래스 관리',
            href: '/dashboard/teacher/classes',
            icon: UserGroupIcon,
            current: pathname.startsWith('/dashboard/teacher/classes'),
            description: '클래스 생성 및 학생 초대'
          },
          {
            name: '책 배정',
            href: '/dashboard/teacher/assignments',
            icon: BookOpenIcon,
            current: pathname.startsWith('/dashboard/teacher/assignments'),
            description: '학생들에게 책 배정하기'
          }
        ]

      case 'WRITER':
        return [
          ...commonItems,
          {
            name: '대시보드',
            href: '/dashboard/writer',
            icon: SparklesIcon,
            current: pathname.startsWith('/dashboard/writer'),
            description: '기여 현황과 영향력 확인'
          },
          {
            name: '이야기 작성',
            href: '/dashboard/writer/submit',
            icon: DocumentTextIcon,
            current: pathname.startsWith('/dashboard/writer/submit'),
            description: '새로운 이야기 작성하기'
          }
        ]

      case 'STORY_MANAGER':
      case 'BOOK_MANAGER':
      case 'CONTENT_ADMIN':
        return [
          ...commonItems,
          {
            name: '관리 대시보드',
            href: '/dashboard/manager',
            icon: Cog6ToothIcon,
            current: pathname.startsWith('/dashboard/manager'),
            description: '콘텐츠 관리 및 검토'
          },
          {
            name: '제출 검토',
            href: '/dashboard/manager/reviews',
            icon: DocumentTextIcon,
            current: pathname.startsWith('/dashboard/manager/reviews'),
            badge: 5, // Mock pending reviews
            description: '제출된 이야기 검토하기'
          }
        ]

      case 'ADMIN':
        return [
          ...commonItems,
          {
            name: '관리자 패널',
            href: '/admin',
            icon: Cog6ToothIcon,
            current: pathname.startsWith('/admin'),
            description: '시스템 전체 관리'
          }
        ]

      default:
        return commonItems
    }
  }, [session?.user?.role, pathname])

  const navigationItems = getNavigationItems()

  const handleSignOut = async () => {
    await signOut({
      callbackUrl: '/',
      redirect: true
    })
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  if (status === 'loading') {
    return (
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-300 rounded animate-pulse"></div>
              <div className="ml-2 w-32 h-6 bg-gray-300 rounded animate-pulse"></div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-20 h-8 bg-gray-300 rounded animate-pulse"></div>
              <div className="w-24 h-8 bg-gray-300 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <>
      {/* Skip to main content link */}
      <a
        href="#main-content"
        className="skip-link"
        tabIndex={1}
      >
        메인 콘텐츠로 건너뛰기
      </a>

      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40" role="navigation" aria-label="메인 네비게이션">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and brand */}
            <div className="flex items-center">
              <Link
                href="/"
                className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-soe-green-400 focus:ring-offset-2 rounded-lg p-1"
                aria-label="1001 Stories 홈페이지"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-soe-green-400 to-soe-green-600 rounded-lg flex items-center justify-center">
                  <BookOpenIcon className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-gray-900">1001 Stories</span>
                  <span className="text-xs text-gray-500 hidden sm:block">Seeds of Empowerment</span>
                </div>
              </Link>
            </div>

            {/* Desktop navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {session ? (
                <>
                  {/* Navigation items */}
                  {navigationItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`
                        relative inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all
                        ${item.current
                          ? 'bg-soe-green-50 text-soe-green-700 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }
                      `}
                      aria-current={item.current ? 'page' : undefined}
                      title={item.description}
                    >
                      <item.icon className="w-4 h-4 mr-2" />
                      {item.name}
                      {item.badge && (
                        <span className="ml-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  ))}

                  {/* Notifications */}
                  <button
                    className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-soe-green-400"
                    aria-label={`알림 ${notifications}개`}
                  >
                    <BellIcon className="w-5 h-5" />
                    {notifications > 0 && (
                      <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                        {notifications}
                      </span>
                    )}
                  </button>

                  {/* User menu */}
                  <UserMenu
                    session={session}
                    onSignOut={handleSignOut}
                    onTriggerOnboarding={onTriggerOnboarding}
                  />
                </>
              ) : (
                /* Unauthenticated user navigation */
                <div className="flex items-center space-x-4">
                  <Link
                    href="/library"
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    도서관
                  </Link>
                  <Link
                    href="/login"
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    로그인
                  </Link>
                  <Link
                    href="/signup"
                    className="btn btn-primary"
                  >
                    시작하기
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center space-x-2">
              {session && notifications > 0 && (
                <button
                  className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-soe-green-400"
                  aria-label={`알림 ${notifications}개`}
                >
                  <BellIcon className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                    {notifications}
                  </span>
                </button>
              )}

              <button
                ref={mobileMenuButtonRef}
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-soe-green-400 transition-colors"
                aria-controls="mobile-menu"
                aria-expanded={isMobileMenuOpen}
                onClick={toggleMobileMenu}
                aria-label={`메뉴 ${isMobileMenuOpen ? '닫기' : '열기'}`}
              >
                {isMobileMenuOpen ? (
                  <XMarkIcon className="block h-6 w-6" />
                ) : (
                  <Bars3Icon className="block h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div
            ref={mobileMenuRef}
            className="md:hidden bg-white border-t border-gray-200 shadow-lg"
            id="mobile-menu"
            role="menu"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              {session ? (
                <>
                  {/* User info in mobile */}
                  <div className="px-3 py-3 bg-gray-50 rounded-lg mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-soe-green-400 to-soe-green-600 rounded-full flex items-center justify-center">
                        <UserIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {session.user?.name || session.user?.email?.split('@')[0]}
                        </p>
                        <p className="text-xs text-gray-500">{session.user?.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Mobile navigation items */}
                  {navigationItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`
                        flex items-center px-3 py-3 rounded-lg text-base font-medium transition-all
                        ${item.current
                          ? 'bg-soe-green-50 text-soe-green-700 border-l-4 border-soe-green-400'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }
                      `}
                      role="menuitem"
                      aria-current={item.current ? 'page' : undefined}
                    >
                      <item.icon className="w-5 h-5 mr-3" />
                      <span className="flex-1">{item.name}</span>
                      {item.badge && (
                        <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  ))}

                  <div className="border-t border-gray-200 my-2"></div>

                  {/* Mobile user actions */}
                  <Link
                    href="/dashboard/profile"
                    className="flex items-center px-3 py-3 rounded-lg text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                    role="menuitem"
                  >
                    <UserIcon className="w-5 h-5 mr-3" />
                    프로필 설정
                  </Link>

                  {onTriggerOnboarding && (
                    <button
                      className="flex items-center w-full px-3 py-3 rounded-lg text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                      role="menuitem"
                      onClick={() => {
                        onTriggerOnboarding()
                        setIsMobileMenuOpen(false)
                      }}
                    >
                      <QuestionMarkCircleIcon className="w-5 h-5 mr-3" />
                      사용법 다시 보기
                    </button>
                  )}

                  <button
                    className="flex items-center w-full px-3 py-3 rounded-lg text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                    role="menuitem"
                    onClick={() => {
                      handleSignOut()
                      setIsMobileMenuOpen(false)
                    }}
                  >
                    <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
                    로그아웃
                  </button>
                </>
              ) : (
                /* Mobile unauthenticated navigation */
                <>
                  <Link
                    href="/library"
                    className="flex items-center px-3 py-3 rounded-lg text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                    role="menuitem"
                  >
                    <BookOpenIcon className="w-5 h-5 mr-3" />
                    도서관
                  </Link>
                  <Link
                    href="/login"
                    className="flex items-center px-3 py-3 rounded-lg text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                    role="menuitem"
                  >
                    <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
                    로그인
                  </Link>
                  <Link
                    href="/signup"
                    className="flex items-center px-3 py-3 rounded-lg text-base font-medium bg-soe-green-400 text-white hover:bg-soe-green-500 transition-colors"
                    role="menuitem"
                  >
                    <SparklesIcon className="w-5 h-5 mr-3" />
                    시작하기
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  )
}