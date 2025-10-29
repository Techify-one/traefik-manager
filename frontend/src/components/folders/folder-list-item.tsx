import { Folder, ChevronRight, FileText, FolderOpen, Power, Trash2, Copy } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { TagBadge } from '../tags/tag-badge';

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
  isWildcard: boolean;
  enabled: boolean;
  onEdit: () => void;
  onMove: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
  onCopy: (text: string) => void;
}

export function FileListItem({ domain, type, ip, tags, isWildcard, enabled, onEdit, onMove, onDelete, onToggleStatus, onCopy }: FileListItemProps) {
  return (
    <div
      onClick={onEdit}
      className={`flex w-full items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:bg-secondary/40 cursor-pointer ${!enabled ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary flex-shrink-0">
          <FileText className="h-5 w-5 text-secondary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">{domain}</p>
            <Badge variant={enabled ? 'default' : 'secondary'} className="text-xs">
              {enabled ? 'Ativo' : 'Inativo'}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 flex-shrink-0"
              onClick={(event) => {
                event.stopPropagation();
                onCopy(domain);
              }}
              title="Copiar domínio"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-1">
            <code className="text-xs">{ip}</code>
            <span>•</span>
            <Badge variant={type === 'ssl-termination' ? 'default' : 'secondary'} className="text-xs">
              {type === 'ssl-termination' ? 'SSL Termination' : 'Passthrough'}
            </Badge>
            <span>•</span>
            <span className="text-xs">{isWildcard ? 'Sim' : 'Não'}</span>
            {tags.length > 0 && (
              <>
                <span>•</span>
                <div className="flex flex-wrap gap-1">
                  {tags.map((tag) => (
                    <TagBadge key={tag} tag={tag} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-2 ml-4 flex-shrink-0">
        <Button
          variant={enabled ? 'outline' : 'default'}
          size="sm"
          onClick={(event) => {
            event.stopPropagation();
            onToggleStatus();
          }}
          title={enabled ? 'Desativar domínio' : 'Ativar domínio'}
        >
          <Power className="mr-1 h-4 w-4" /> {enabled ? 'Desativar' : 'Ativar'}
        </Button>
        <Button variant="secondary" size="sm" onClick={(event) => { event.stopPropagation(); onMove(); }}>
          <FolderOpen className="mr-1 h-4 w-4" /> Mover
        </Button>
        <Button variant="destructive" size="sm" onClick={(event) => { event.stopPropagation(); onDelete(); }}>
          <Trash2 className="mr-1 h-4 w-4" /> Remover
        </Button>
      </div>
    </div>
  );
}
