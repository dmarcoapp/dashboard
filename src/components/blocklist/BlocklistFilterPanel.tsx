import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUrlFilters } from '@/hooks/use-url-filters';

interface BlocklistFilterPanelProps {
  urlFilters: ReturnType<typeof useUrlFilters>;
}

function DebouncedPatternSearch({ value, onSearch }: { value: string; onSearch: (value: string) => void }) {
  const [localValue, setLocalValue] = useState(value);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setLocalValue(newValue);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      onSearch(newValue);
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className="relative w-full sm:w-72">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search sender pattern..."
        value={localValue}
        onChange={handleChange}
        className="pl-10"
      />
    </div>
  );
}

export function BlocklistFilterPanel({ urlFilters }: BlocklistFilterPanelProps) {
  const { setFilter, removeFilter, clearFilters, hasActiveFilters, getFilterValue } = urlFilters;

  const patternValue = getFilterValue('pattern', 'contains') ?? '';
  const handlePatternSearch = (value: string) => {
    const trimmed = value.trim();
    if (trimmed) {
      setFilter({ field: 'pattern', operator: 'contains', value: trimmed });
    } else {
      removeFilter('pattern', 'contains');
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {hasActiveFilters && (
            <Button variant="ghost" className="text-muted-foreground" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear filters
            </Button>
          )}
        </div>

        <div className="lg:ml-auto">
          <DebouncedPatternSearch value={patternValue} onSearch={handlePatternSearch} />
        </div>
      </div>
    </div>
  );
}
