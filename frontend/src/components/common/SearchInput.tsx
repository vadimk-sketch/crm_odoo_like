import { useState, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import clsx from 'clsx';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchInputProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  delay?: number;
}

export function SearchInput({
  value: controlledValue,
  onChange,
  placeholder = 'Search...',
  className,
  delay = 300,
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(controlledValue ?? '');
  const debouncedValue = useDebounce(localValue, delay);

  useEffect(() => {
    onChange(debouncedValue);
  }, [debouncedValue, onChange]);

  useEffect(() => {
    if (controlledValue !== undefined) {
      setLocalValue(controlledValue);
    }
  }, [controlledValue]);

  const handleClear = useCallback(() => {
    setLocalValue('');
  }, []);

  return (
    <div className={clsx('relative', className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        className="block w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-9 text-sm placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      />
      {localValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
