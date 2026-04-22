import { useRef } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';

interface ContentItem {
  id: string;
  title: string;
  subtitle?: string;
  metric?: string;
  color?: string;
}

interface ContentRow {
  title: string;
  items: ContentItem[];
}

interface ContentGridProps {
  rows: ContentRow[];
}

function ScrollRow({ title, items }: ContentRow) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = 320;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
        <div className="flex gap-1">
          <button
            onClick={() => scroll('left')}
            className="rounded-full p-1 text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
            aria-label={`Scroll ${title} left`}
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="rounded-full p-1 text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
            aria-label={`Scroll ${title} right`}
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((item) => (
          <Card
            key={item.id}
            hoverable
            padding="none"
            className="flex-shrink-0 w-72 overflow-hidden group"
          >
            {/* Color accent bar */}
            <div
              className="h-1.5"
              style={{ backgroundColor: item.color || '#E50914' }}
            />
            <div className="p-4 space-y-2">
              <h3 className="font-medium text-text-primary group-hover:text-white transition-colors truncate">
                {item.title}
              </h3>
              {item.subtitle && (
                <p className="text-sm text-text-muted truncate">{item.subtitle}</p>
              )}
              {item.metric && (
                <p className="text-2xl font-bold text-text-primary">{item.metric}</p>
              )}
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

export default function ContentGrid({ rows }: ContentGridProps) {
  return (
    <div className="space-y-8">
      {rows.map((row) => (
        <ScrollRow key={row.title} title={row.title} items={row.items} />
      ))}
    </div>
  );
}
