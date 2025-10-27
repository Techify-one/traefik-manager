import { ChevronRight, Home } from 'lucide-react';
import { Button } from '../ui/button';

interface BreadcrumbNavigationProps {
  currentFolder: string;
  onNavigate: (folder: string) => void;
}

export function BreadcrumbNavigation({ currentFolder, onNavigate }: BreadcrumbNavigationProps) {
  const segments = currentFolder ? currentFolder.split('/').filter(Boolean) : [];

  const handleNavigate = (index: number) => {
    if (index === -1) {
      // Navigate to root
      onNavigate('');
    } else {
      // Navigate to specific segment
      const newPath = segments.slice(0, index + 1).join('/');
      onNavigate(newPath);
    }
  };

  return (
    <div className="flex items-center gap-1 text-sm">
      <Button
        variant={currentFolder === '' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleNavigate(-1)}
        className="h-8 gap-1"
      >
        <Home className="h-4 w-4" />
        <span>Raiz</span>
      </Button>

      {segments.map((segment, index) => (
        <div key={index} className="flex items-center gap-1">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <Button
            variant={index === segments.length - 1 ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleNavigate(index)}
            className="h-8"
          >
            {segment}
          </Button>
        </div>
      ))}
    </div>
  );
}
