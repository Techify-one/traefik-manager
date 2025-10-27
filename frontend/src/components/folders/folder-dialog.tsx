import { useState } from 'react';
import { Folder, FolderPlus, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface FolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filename: string;
  currentFolder: string;
  folders: string[];
  onMove: (targetFolder: string) => Promise<void>;
  onCreateFolder: (folderPath: string) => Promise<void>;
}

export function FolderDialog({
  open,
  onOpenChange,
  filename,
  currentFolder,
  folders,
  onMove,
  onCreateFolder,
}: FolderDialogProps) {
  const [newFolderPath, setNewFolderPath] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);

  const handleMove = async () => {
    if (loading) return;

    try {
      setLoading(true);
      await onMove(selectedFolder);
      onOpenChange(false);
    } catch (error) {
      console.error('Error moving file:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderPath.trim() || creatingFolder) return;

    // Validate folder path
    if (!/^[a-zA-Z0-9_\-\/]+$/.test(newFolderPath)) {
      alert('Caminho inválido. Use apenas letras, números, traços, underscores e barras.');
      return;
    }

    try {
      setCreatingFolder(true);
      await onCreateFolder(newFolderPath.trim());
      setNewFolderPath('');
      setSelectedFolder(newFolderPath.trim());
    } catch (error) {
      console.error('Error creating folder:', error);
    } finally {
      setCreatingFolder(false);
    }
  };

  // Unique folders sorted
  const uniqueFolders = Array.from(new Set([...folders, ''])).sort();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mover para Pasta</DialogTitle>
          <DialogDescription>
            Mova <strong>{filename}</strong> para outra pasta.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create new folder */}
          <div className="space-y-2">
            <Label htmlFor="newFolder">Nova Pasta</Label>
            <div className="flex gap-2">
              <Input
                id="newFolder"
                value={newFolderPath}
                onChange={(e) => setNewFolderPath(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    void handleCreateFolder();
                  }
                }}
                placeholder="servers/production"
                disabled={creatingFolder}
              />
              <Button onClick={() => void handleCreateFolder()} disabled={creatingFolder || !newFolderPath.trim()}>
                {creatingFolder ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderPlus className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Use / para criar subpastas (ex: servers/production)</p>
          </div>

          {/* Select existing folder */}
          <div className="space-y-2">
            <Label>Pastas Existentes</Label>
            <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border p-2">
              {uniqueFolders.map((folder) => {
                const isCurrentFolder = folder === currentFolder;
                const isSelected = folder === selectedFolder;

                return (
                  <button
                    key={folder}
                    onClick={() => setSelectedFolder(folder)}
                    disabled={isCurrentFolder}
                    className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition ${
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : isCurrentFolder
                          ? 'cursor-not-allowed opacity-50'
                          : 'hover:bg-accent'
                    }`}
                  >
                    <Folder className="h-4 w-4 shrink-0" />
                    <span className="flex-1">{folder || 'Raiz'}</span>
                    {isCurrentFolder && <span className="text-xs">(atual)</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => void handleMove()} disabled={loading || selectedFolder === currentFolder}>
            {loading ? 'Movendo...' : 'Mover'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
