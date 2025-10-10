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
      <div className="bg-white rounded-2xl shadow-[0_2px_8px_hsl(120_100%_25%_/_0.08)] border border-green-100 p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg w-2/3"></div>
          <div className="h-4 bg-green-50 rounded-lg"></div>
          <div className="h-4 bg-green-50 rounded-lg"></div>
          <div className="h-4 bg-green-50 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (tags.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_8px_hsl(120_100%_25%_/_0.08)] border border-green-100 p-6 sticky top-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-50 to-emerald-50 rounded-full blur-2xl opacity-50 -z-10" />
      
      <div className="flex items-center gap-2 mb-5">
        <div className="p-1.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-sm">
          <TrendingUp className="w-4 h-4 text-white" />
        </div>
        <h2 className="text-lg font-bold bg-gradient-to-r from-green-800 to-emerald-700 bg-clip-text text-transparent">
          Trending This Week
        </h2>
      </div>

      <div className="space-y-2">
        {tags.map((tag, index) => (
          <button
            key={tag.tag}
            onClick={() => onTagClick?.(tag.tag)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all duration-300 group ${
              activeTag === tag.tag
                ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 shadow-sm border border-green-300'
                : 'hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 text-gray-700 hover:shadow-sm border border-transparent hover:border-green-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                activeTag === tag.tag 
                  ? 'bg-green-200 text-green-800' 
                  : 'bg-gray-100 text-gray-600 group-hover:bg-green-200 group-hover:text-green-700'
              }`}>
                #{index + 1}
              </span>
              <span className="font-semibold">#{tag.tag}</span>
            </div>
            <span className={`text-sm font-medium px-2.5 py-1 rounded-lg ${
              activeTag === tag.tag
                ? 'bg-green-200 text-green-800'
                : 'bg-gray-100 text-gray-600 group-hover:bg-green-100 group-hover:text-green-700'
            }`}>
              {tag.count}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
