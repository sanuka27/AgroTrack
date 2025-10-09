import { Link } from 'react-router-dom';

interface HashtagChipsProps {
  tags: string[];
  maxDisplay?: number;
  onTagClick?: (tag: string) => void;
}

export default function HashtagChips({ tags, maxDisplay, onTagClick }: HashtagChipsProps) {
  const displayTags = maxDisplay ? tags.slice(0, maxDisplay) : tags;
  const remainingCount = maxDisplay && tags.length > maxDisplay ? tags.length - maxDisplay : 0;

  const handleTagClick = (e: React.MouseEvent, tag: string) => {
    if (onTagClick) {
      e.preventDefault();
      onTagClick(tag);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {displayTags.map((tag) => (
        <Link
          key={tag}
          to={`/community?tag=${encodeURIComponent(tag)}`}
          onClick={(e) => handleTagClick(e, tag)}
          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
        >
          #{tag}
        </Link>
      ))}
      {remainingCount > 0 && (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
          +{remainingCount}
        </span>
      )}
    </div>
  );
}
