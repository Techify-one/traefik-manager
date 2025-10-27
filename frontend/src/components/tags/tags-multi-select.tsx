import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '../ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
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

  const handleSelect = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter((t) => t !== tag));
    } else {
      onChange([...selectedTags, tag]);
    }
  };

  const handleRemove = (tag: string) => {
    onChange(selectedTags.filter((t) => t !== tag));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
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
                <div key={tag}>
                  <TagBadge tag={tag} onRemove={() => handleRemove(tag)} />
                </div>
              ))
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar tags..." />
          <CommandList>
            <CommandEmpty>Nenhuma tag encontrada.</CommandEmpty>
            <CommandGroup>
              {availableTags.map((tag) => (
                <CommandItem key={tag} value={tag} onSelect={(value) => handleSelect(value)}>
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      selectedTags.includes(tag) ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <span>{tag}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
