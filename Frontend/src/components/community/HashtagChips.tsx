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
          className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 hover:from-green-200 hover:to-emerald-200 hover:shadow-sm border border-green-200 transition-all duration-300 hover:-translate-y-0.5"
        >
          #{tag}
        </Link>
      ))}
      {remainingCount > 0 && (
        <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
          +{remainingCount} more
        </span>
      )}
    </div>
  );
}
