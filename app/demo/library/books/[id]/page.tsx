'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  BookOpen, 
  Clock, 
  Star, 
  Crown,
  Eye,
  Users,
  ArrowRight,
  Download,
  Share2
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import PDFThumbnailImageWrapper from '@/components/shop/PDFThumbnailImageWrapper';
import dynamic from 'next/dynamic';

// Dynamically import PDFViewer to avoid SSR issues
const PDFViewer = dynamic(
  () => import('@/components/library/PDFViewer'),
  { 
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50">
        <div className="text-white text-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p>Loading PDF viewer...</p>
        </div>
      </div>
    )
  }
);

interface DemoBook {
  id: string;
  title: string;
  authorName: string;
  authorAge: number;
  authorLocation: string;
  summary: string;
  coverImage?: string;
  pdfKey: string;
  pageCount: number;
  language: string;
  ageRange: string;
  category: string;
  rating: number;
  isPremium: boolean;
  estimatedReadTime: number;
  description?: string;
}

// Sample demo books data (same as in listing page)
const demoBooks: DemoBook[] = [
  {
    id: 'demo-1',
    title: 'My Friend Phong',
    authorName: 'Little Writer',
    authorAge: 10,
    authorLocation: 'Vietnam',
    summary: 'A heartwarming tale about friendship and cultural understanding between children from different backgrounds.',
    description: 'This beautiful story follows the adventures of two children from different cultural backgrounds as they navigate friendship, understanding, and the joy of learning from each other. Through colorful illustrations and engaging narrative, young readers will discover the universal language of friendship that transcends all boundaries.',
    coverImage: '/images/book-covers/My friend Phong.jpg',
    pdfKey: '/api/pdf/My friend Phong.pdf',
    pageCount: 20,
    language: 'en',
    ageRange: '6-10',
    category: 'Friendship',
    rating: 4.8,
    isPremium: false,
    estimatedReadTime: 15
  },
  {
    id: 'demo-2',
    title: "Let's Run!",
    authorName: 'Running Star',
    authorAge: 9,
    authorLocation: 'Active Community',
    summary: 'An energetic story about the joy of running and staying active. Follow our young protagonist as they discover the fun of sports.',
    description: 'Join our energetic young hero on an exciting journey of discovering the joy of running and physical activity! This vibrant story promotes healthy living and shows children that exercise can be fun and rewarding. Perfect for encouraging an active lifestyle from an early age.',
    coverImage: "/images/book-covers/let's run!.jpg",
    pdfKey: "/api/pdf/let's run!.pdf",
    pageCount: 16,
    language: 'en',
    ageRange: '6-12',
    category: 'Sports',
    rating: 4.6,
    isPremium: false,
    estimatedReadTime: 12
  },
  {
    id: 'demo-3',
    title: 'My Friend Puru',
    authorName: "Puru's Friend",
    authorAge: 11,
    authorLocation: 'Imaginative Land',
    summary: 'Meet Puru, a delightful character who brings joy and laughter to everyone around. A story about friendship and imagination.',
    description: 'Enter the magical world of Puru, where imagination knows no bounds! This enchanting tale teaches children about the power of creativity, friendship, and believing in themselves. With whimsical illustrations and a heartwarming message, this premium story is perfect for dreamers of all ages.',
    coverImage: '/images/book-covers/my friend puru.jpg',
    pdfKey: '/api/pdf/my friend puru.pdf',
    pageCount: 24,
    language: 'en',
    ageRange: '8-12',
    category: 'Adventure',
    rating: 4.7,
    isPremium: true,
    estimatedReadTime: 18
  }
];

export default function DemoBookDetail() {
  const params = useParams();
  const router = useRouter();
  const [book, setBook] = useState<DemoBook | null>(null);
  const [showPDFModal, setShowPDFModal] = useState(false);

  useEffect(() => {
    const foundBook = demoBooks.find(b => b.id === params.id);
    setBook(foundBook || null);
  }, [params.id]);

  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Book Not Found</h2>
          <p className="text-gray-600 mb-4">The demo book you requested could not be found.</p>
          <Link
            href="/demo/library"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Demo Library
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Banner */}
      <div className="bg-yellow-400 text-black py-3">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-3 text-sm font-medium">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              <span>🎭 Demo Book</span>
            </div>
            <span>|</span>
            <span>You can read the full content when you purchase!</span>
            <Link 
              href="/signup"
              className="ml-4 px-4 py-1 bg-black text-yellow-400 rounded-full text-xs font-semibold hover:bg-gray-800 transition-colors"
            >
              Sign Up →
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link href="/demo/library" className="hover:text-blue-600 transition-colors">
            Demo Library
          </Link>
          <span>/</span>
          <span className="text-gray-900">{book.title}</span>
        </div>

        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Go Back</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Book Cover */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative aspect-[3/4] bg-white rounded-xl shadow-lg overflow-hidden"
              >
                {book.isPremium && (
                  <div className="absolute top-4 right-4 z-10">
                    <div className="flex items-center gap-1 px-3 py-1 bg-yellow-500 text-white rounded-full text-sm font-medium">
                      <Crown className="w-4 h-4" />
                      <span>Premium</span>
                    </div>
                  </div>
                )}
                
                <PDFThumbnailImageWrapper
                  pdfUrl={book.pdfKey}
                  bookId={book.id}
                  title={book.title}
                  fallbackImage={book.coverImage}
                  className="w-full h-full object-cover"
                />
              </motion.div>

              {/* Action Buttons */}
              <div className="mt-6 space-y-3">
                <button
                  onClick={() => setShowPDFModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <BookOpen className="w-5 h-5" />
                  Read Now (Demo)
                </button>
                
                <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center justify-center gap-2 text-yellow-800 mb-2">
                    <Eye className="w-5 h-5" />
                    <span className="font-medium">Demo Mode</span>
                  </div>
                  <p className="text-sm text-yellow-700">
                    Sign up and purchase to read the full content
                  </p>
                  <Link
                    href="/shop"
                    className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-yellow-800 hover:text-yellow-900"
                  >
                    Go to Purchase
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Book Details */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {/* Title and Rating */}
              <div className="mb-6">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                  {book.title}
                </h1>
                
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-5 h-5 ${
                            i < Math.floor(book.rating) 
                              ? 'text-yellow-500 fill-current' 
                              : 'text-gray-300'
                          }`} 
                        />
                      ))}
                    </div>
                    <span className="text-lg font-medium text-gray-900">{book.rating}</span>
                    <span className="text-gray-500">(Demo)</span>
                  </div>
                </div>

                {/* Author Info */}
                <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
                  <h3 className="font-medium text-gray-900 mb-2">Author Info</h3>
                  <div className="text-gray-700">
                    <p><span className="font-medium">{book.authorName}</span> (Age {book.authorAge})</p>
                    <p className="text-sm text-gray-600">{book.authorLocation}</p>
                  </div>
                </div>
              </div>

              {/* Book Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                  <BookOpen className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <div className="text-sm text-gray-600">Pages</div>
                  <div className="font-semibold">{book.pageCount} pages</div>
                </div>
                <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                  <Clock className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <div className="text-sm text-gray-600">Est. Time</div>
                  <div className="font-semibold">{book.estimatedReadTime} min</div>
                </div>
                <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                  <Users className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                  <div className="text-sm text-gray-600">Age Range</div>
                  <div className="font-semibold">Age {book.ageRange}</div>
                </div>
                <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                  <Star className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                  <div className="text-sm text-gray-600">Category</div>
                  <div className="font-semibold">{book.category}</div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Book Description</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  {book.description || book.summary}
                </p>
                
                {book.isPremium && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-800 mb-2">
                      <Crown className="w-5 h-5" />
                      <span className="font-medium">Premium Book</span>
                    </div>
                    <p className="text-sm text-yellow-700">
                      This is a premium book. Purchase is required to read the full content.
                    </p>
                  </div>
                )}
              </div>

              {/* CTA Section */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
                <h3 className="text-xl font-semibold mb-3">Do you like this book?</h3>
                <p className="text-blue-100 mb-4">
                  Sign up to read the full content. More books are waiting for you!
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/signup"
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    <Users className="w-5 h-5" />
                    Sign Up
                  </Link>
                  <Link
                    href="/shop"
                    className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-white text-white rounded-lg hover:bg-white hover:text-blue-600 transition-colors font-medium"
                  >
                    <BookOpen className="w-5 h-5" />
                    Go to Purchase
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Related Books */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Other Demo Books</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {demoBooks
              .filter(b => b.id !== book.id)
              .slice(0, 3)
              .map((relatedBook) => (
                <Link
                  key={relatedBook.id}
                  href={`/demo/library/books/${relatedBook.id}`}
                  className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow group"
                >
                  <div className="flex gap-4">
                    <div className="relative w-16 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                      <PDFThumbnailImageWrapper
                        pdfUrl={relatedBook.pdfKey}
                        bookId={relatedBook.id}
                        title={relatedBook.title}
                        fallbackImage={relatedBook.coverImage}
                        className="w-full h-full object-cover"
                      />
                      {relatedBook.isPremium && (
                        <Crown className="absolute top-1 right-1 w-3 h-3 text-yellow-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {relatedBook.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {relatedBook.authorName} (Age {relatedBook.authorAge})
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-500 fill-current" />
                          <span className="text-xs text-gray-600">{relatedBook.rating}</span>
                        </div>
                        <span className="text-xs text-gray-500">•</span>
                        <span className="text-xs text-gray-500">{relatedBook.category}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </div>

      {/* PDF Viewer */}
      {showPDFModal && (
        <PDFViewer
          pdfUrl={book.pdfKey}
          title={book.title}
          onClose={() => setShowPDFModal(false)}
          isDemo={true}
          maxPages={3}
        />
      )}
    </div>
  );
}