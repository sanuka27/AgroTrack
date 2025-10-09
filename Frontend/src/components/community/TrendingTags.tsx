import { useState, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';
import { communityForumApi } from '../../api/communityForum';
import { TrendingTag } from '../../types/community';

interface TrendingTagsProps {
  onTagClick?: (tag: string) => void;
  activeTag?: string;
}

export default function TrendingTags({ onTagClick, activeTag }: TrendingTagsProps) {
  const [tags, setTags] = useState<TrendingTag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTrendingTags = async () => {
      try {
        const response = await communityForumApi.getTrendingTags({ days: 7, limit: 10 });
        setTags(response.data.tags);
      } catch (error) {
        console.error('Failed to load trending tags:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTrendingTags();
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (tags.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 sticky top-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-green-600" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Trending This Week
        </h2>
      </div>

      <div className="space-y-2">
        {tags.map((tag) => (
          <button
            key={tag.tag}
            onClick={() => onTagClick?.(tag.tag)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
              activeTag === tag.tag
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <span className="font-medium">#{tag.tag}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {tag.count}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
