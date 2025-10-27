import { Folder, ChevronRight, FileText } from 'lucide-react';
import { Button } from '../ui/button';

interface FolderListItemProps {
  name: string;
  path: string;
  filesCount: number;
  onClick: () => void;
}

export function FolderListItem({ name, filesCount, onClick }: FolderListItemProps) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-lg border border-border bg-card p-4 text-left transition hover:border-primary hover:bg-accent"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
          <Folder className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-medium">{name}</p>
          <p className="text-sm text-muted-foreground">
            {filesCount} arquivo{filesCount !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </button>
  );
}

interface FileListItemProps {
  domain: string;
  type: 'ssl-termination' | 'passthrough';
  ip: string;
  tags: string[];
  onEdit: () => void;
}

export function FileListItem({ domain, type, ip, tags, onEdit }: FileListItemProps) {
  return (
    <button
      onClick={onEdit}
      className="flex w-full items-center justify-between rounded-lg border border-border bg-card p-4 text-left transition hover:border-primary hover:bg-accent"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary">
          <FileText className="h-5 w-5 text-secondary-foreground" />
        </div>
        <div className="flex-1">
          <p className="font-medium">{domain}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{ip}</span>
            <span>•</span>
            <span>{type === 'ssl-termination' ? 'SSL Termination' : 'Passthrough'}</span>
            {tags.length > 0 && (
              <>
                <span>•</span>
                <span>{tags.length} tag{tags.length > 1 ? 's' : ''}</span>
              </>
            )}
          </div>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </button>
  );
}
