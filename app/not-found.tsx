export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl font-bold text-white">404</span>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Page Not Found
          </h1>
          
          <p className="text-gray-600 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
          
          <div className="space-y-3">
            <a
              href="/"
              className="block w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:shadow-lg transition-shadow"
            >
              Go to Homepage
            </a>
            
            <a
              href="/library"
              className="block w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Browse Stories
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}