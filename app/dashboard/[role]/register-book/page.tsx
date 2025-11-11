import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { canDirectRegisterBook } from '@/lib/validation/book-registration.schema';
import { BookRegistrationForm } from '@/components/book-registration';

export const metadata = {
  title: 'Register Book | 1001 Stories',
  description: 'Register a new book directly to the library',
};

export default async function RegisterBookPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  if (!canDirectRegisterBook(session.user.role)) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Register New Book</h1>
          <p className="mt-2 text-gray-600">
            Publish a book directly to the library without approval workflow
          </p>
          <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Book will be published immediately upon submission
          </div>
        </div>

        <BookRegistrationForm />
      </div>
    </div>
  );
}
