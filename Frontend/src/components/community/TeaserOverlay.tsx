import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';

export default function TeaserOverlay() {
  const navigate = useNavigate();

  return (
    <div className="absolute inset-0 bg-gradient-to-t from-white via-white/95 to-transparent dark:from-gray-900 dark:via-gray-900/95 flex items-end justify-center pb-12 pointer-events-none">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border-2 border-green-500 p-8 max-w-md text-center pointer-events-auto">
        <Lock className="w-12 h-12 text-green-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Want to see more?
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Sign in to view all community posts, vote on topics, and join the conversation!
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate('/signin')}
            className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/signup')}
            className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}
