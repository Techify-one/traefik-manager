import { Filter, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { TagsMultiSelect } from '../tags/tags-multi-select';
import { Card, CardContent } from '../ui/card';

export interface FilterState {
  search: string;
  type: 'all' | 'ssl-termination' | 'passthrough';
  wildcard: 'all' | 'yes' | 'no';
  tags: string[];
}

interface DomainFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  availableTags: string[];
  resultsCount?: number;
}

export function DomainFilters({ filters, onFiltersChange, availableTags, resultsCount }: DomainFiltersProps) {
  const hasActiveFilters =
    filters.search !== '' ||
    filters.type !== 'all' ||
    filters.wildcard !== 'all' ||
    filters.tags.length > 0;

  const handleClearFilters = () => {
    onFiltersChange({
      search: '',
      type: 'all',
      wildcard: 'all',
      tags: [],
    });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Label className="text-base font-semibold">Filtros</Label>
              {resultsCount !== undefined && (
                <span className="text-sm text-muted-foreground">({resultsCount} resultado{resultsCount !== 1 ? 's' : ''})</span>
              )}
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                <X className="mr-2 h-4 w-4" />
                Limpar
              </Button>
            )}
          </div>

          {/* Filters Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="filter-search" className="text-sm">
                Buscar
              </Label>
              <Input
                id="filter-search"
                placeholder="Domínio ou IP..."
                value={filters.search}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    search: e.target.value,
                  })
                }
              />
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label htmlFor="filter-type" className="text-sm">
                Tipo
              </Label>
              <Select
                value={filters.type}
                onValueChange={(value: 'all' | 'ssl-termination' | 'passthrough') =>
                  onFiltersChange({
                    ...filters,
                    type: value,
                  })
                }
              >
                <SelectTrigger id="filter-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="ssl-termination">SSL Termination</SelectItem>
                  <SelectItem value="passthrough">Passthrough</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Wildcard */}
            <div className="space-y-2">
              <Label htmlFor="filter-wildcard" className="text-sm">
                Wildcard
              </Label>
              <Select
                value={filters.wildcard}
                onValueChange={(value: 'all' | 'yes' | 'no') =>
                  onFiltersChange({
                    ...filters,
                    wildcard: value,
                  })
                }
              >
                <SelectTrigger id="filter-wildcard">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="yes">Sim</SelectItem>
                  <SelectItem value="no">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="filter-tags" className="text-sm">
                Tags
              </Label>
              <TagsMultiSelect
                availableTags={availableTags}
                selectedTags={filters.tags}
                onChange={(tags) =>
                  onFiltersChange({
                    ...filters,
                    tags,
                  })
                }
                placeholder="Selecionar tags..."
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
