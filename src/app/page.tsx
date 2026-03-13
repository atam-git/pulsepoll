'use client'

import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Welcome to <span className="text-blue-600">PulsePoll</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Create engaging polls and surveys with real-time results. 
            Share with your audience and get instant feedback.
          </p>
          <div className="space-x-4">
            <Link href="/poll/create">
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors">
                Create Poll
              </button>
            </Link>
            <Link href="/directory">
              <button className="border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-3 px-8 rounded-lg transition-colors">
                Browse Polls
              </button>
            </Link>
          </div>
        </div>
        
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Real-time Results</h3>
            <p className="text-gray-600">
              Watch votes come in live with beautiful charts and analytics.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Multiple Poll Types</h3>
            <p className="text-gray-600">
              Single choice, multiple choice, ranking, and survey polls.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Easy Sharing</h3>
            <p className="text-gray-600">
              Share via link, QR code, or embed directly on your website.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}