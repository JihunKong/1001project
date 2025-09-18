import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import UXResearchDashboard from '@/components/admin/UXResearchDashboard'

export default async function UXResearchPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/login')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">UX Research Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Monitor user feedback and validate role system changes with comprehensive analytics
        </p>
      </div>
      
      <Suspense fallback={<div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>}>
        <UXResearchDashboard />
      </Suspense>
    </div>
  )
}