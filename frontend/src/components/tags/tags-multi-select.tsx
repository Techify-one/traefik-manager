import { type KeyboardEvent, useMemo, useState } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { TagBadge } from './tag-badge';
import { cn } from '../../lib/utils';

interface TagsMultiSelectProps {
  availableTags: string[];
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export function TagsMultiSelect({
  availableTags,
  selectedTags,
  onChange,
  placeholder = 'Selecionar tags...',
}: TagsMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const normalizedTags = useMemo(
    () => Array.from(new Set(availableTags)).sort((a, b) => a.localeCompare(b)),
    [availableTags]
  );

  const filteredTags = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (query === '') {
      return normalizedTags;
    }
    return normalizedTags.filter((tag) => tag.toLowerCase().includes(query));
  }, [normalizedTags, searchTerm]);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter((currentTag) => currentTag !== tag));
      return;
    }
    onChange([...selectedTags, tag]);
  };

  const handleRemove = (tag: string) => {
    onChange(selectedTags.filter((currentTag) => currentTag !== tag));
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') {
      return;
    }

    event.preventDefault();
    if (filteredTags.length === 0) {
      return;
    }
    toggleTag(filteredTags[0]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <div className="flex flex-wrap gap-1">
            {selectedTags.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              selectedTags.map((tag) => (
                <TagBadge key={tag} tag={tag} onRemove={() => handleRemove(tag)} />
              ))
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popper-anchor-width] p-0" align="start">
        <div className="flex flex-col gap-2 p-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Buscar tags..."
              className="pl-8"
            />
          </div>
          <div className="max-h-56 overflow-y-auto rounded-md border border-border bg-background">
            {filteredTags.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                Nenhuma tag encontrada.
              </p>
            ) : (
              filteredTags.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
                      isSelected
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <Check
                      className={cn(
                        'h-4 w-4 shrink-0 transition-opacity',
                        isSelected ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <span className="flex-1 truncate">{tag}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
