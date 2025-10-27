import { X } from 'lucide-react';
import { getTagBadgeClasses } from '../../lib/tag-colors';

interface TagBadgeProps {
  tag: string;
  onRemove?: () => void;
  className?: string;
}

export function TagBadge({ tag, onRemove, className = '' }: TagBadgeProps) {
  const colorClasses = getTagBadgeClasses(tag);

  return (
    <span className={`${colorClasses} ${className}`}>
      {tag}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 inline-flex h-3 w-3 items-center justify-center rounded-full hover:bg-black/10"
        >
          <X className="h-2.5 w-2.5" />
        </button>
      )}
    </span>
  );
}
