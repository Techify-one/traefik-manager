import { useState } from 'react';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import type { TagInfo } from '../../types/domain';

interface TagsManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tags: TagInfo[];
  onCreateTag: (tag: string) => Promise<void>;
  onDeleteTag: (tag: string) => Promise<void>;
}

export function TagsManagementDialog({
  open,
  onOpenChange,
  tags,
  onCreateTag,
  onDeleteTag,
}: TagsManagementDialogProps) {
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingTag, setDeletingTag] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!newTag.trim() || loading) return;

    // Validate tag name
    if (!/^[a-zA-Z0-9_-]+$/.test(newTag)) {
      alert('Nome da tag inválido. Use apenas letras, números, traços e underscores.');
      return;
    }

    try {
      setLoading(true);
      await onCreateTag(newTag.trim());
      setNewTag('');
    } catch (error) {
      console.error('Error creating tag:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (tag: string) => {
    if (deletingTag || loading) return;

    const tagInfo = tags.find((t) => t.name === tag);
    const message =
      tagInfo && tagInfo.count > 0
        ? `Tem certeza que deseja remover a tag "${tag}"? Ela será removida de ${tagInfo.count} arquivo(s).`
        : `Tem certeza que deseja remover a tag "${tag}"?`;

    if (!confirm(message)) return;

    try {
      setDeletingTag(tag);
      await onDeleteTag(tag);
    } catch (error) {
      console.error('Error deleting tag:', error);
    } finally {
      setDeletingTag(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Tags</DialogTitle>
          <DialogDescription>
            Crie ou remova tags disponíveis para organizar suas configurações.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create new tag */}
          <div className="space-y-2">
            <Label htmlFor="newTag">Nova Tag</Label>
            <div className="flex gap-2">
              <Input
                id="newTag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    void handleCreate();
                  }
                }}
                placeholder="nome-da-tag"
                disabled={loading}
              />
              <Button onClick={() => void handleCreate()} disabled={loading || !newTag.trim()}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Use apenas letras, números, traços (-) e underscores (_)
            </p>
          </div>

          {/* List of tags */}
          <div className="space-y-2">
            <Label>Tags Disponíveis ({tags.length})</Label>
            {tags.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma tag criada ainda.</p>
            ) : (
              <div className="space-y-2">
                {tags.map((tag) => (
                  <div key={tag.name} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{tag.name}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {tag.count === 0 ? 'Não usado' : `${tag.count} arquivo${tag.count > 1 ? 's' : ''}`}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void handleDelete(tag.name)}
                      disabled={deletingTag === tag.name}
                    >
                      {deletingTag === tag.name ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-destructive" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
