import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

type StarRatingProps = {
  count?: number;
  value: number;
  onChange: (value: number) => void;
  size?: number;
  className?: string;
  disabled?: boolean;
};

export const StarRating = ({ count = 5, value, onChange, size = 24, className, disabled = false }: StarRatingProps) => {
  const [hoverValue, setHoverValue] = useState<number | undefined>(undefined);

  const stars = Array.from({ length: count }, (_, i) => i + 1);

  const handleClick = (newValue: number) => {
    if (!disabled) {
      onChange(newValue);
    }
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {stars.map((starValue) => (
        <Star
          key={starValue}
          size={size}
          className={cn(
            "cursor-pointer transition-colors",
            (hoverValue || value) >= starValue ? "text-amber-400 fill-amber-400" : "text-gray-300",
            disabled && "cursor-not-allowed opacity-70"
          )}
          onClick={() => handleClick(starValue)}
          onMouseEnter={() => !disabled && setHoverValue(starValue)}
          onMouseLeave={() => !disabled && setHoverValue(undefined)}
        />
      ))}
    </div>
  );
};