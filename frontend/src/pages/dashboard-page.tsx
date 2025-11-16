import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Textarea } from '../components/ui/textarea';
import { useSession } from '../context/session-context';
import { useToast } from '../hooks/use-toast';
import { apiGet, apiPost, disableDomain, enableDomain } from '../lib/api';
import { ensureYamlExtension, generateFilename, sanitizeDomain } from '../lib/domains';
import type { DomainDetails, DomainListResponse, DomainSummary, TagInfo } from '../types/domain';
import { Copy, FileText, FolderTree, Grid3x3, Loader2, LogOut, FolderOpen, Plus, Power, RefreshCw, ShieldCheck, Tags, Trash2 } from 'lucide-react';
import { DomainFilters, type FilterState } from '../components/filters/domain-filters';
import { TagsManagementDialog } from '../components/tags/tags-management-dialog';
import { TagsMultiSelect } from '../components/tags/tags-multi-select';
import { TagBadge } from '../components/tags/tag-badge';
import { FolderDialog } from '../components/folders/folder-dialog';
import { BreadcrumbNavigation } from '../components/folders/breadcrumb-navigation';
import { FolderListItem, FileListItem } from '../components/folders/folder-list-item';
import { fetchAvailableTags, createTag, deleteTag, updateFileTags } from '../lib/tags';
import { fetchFolders, createFolder, moveFile } from '../lib/folders';

interface DomainFormState {
  type: 'ssl-termination' | 'passthrough';
  domain: string;
  pathPrefix: string;
  ip: string;
  wildcard: boolean;
  enableHttps: boolean;
  yaml: string;
  folder: string;
  tags: string[];
  port: number | string;
  path: string;
}

const defaultFormState: DomainFormState = {
  type: 'ssl-termination',
  domain: '',
  pathPrefix: '',
  ip: '',
  wildcard: false,
  enableHttps: true,
  yaml: '',
  folder: '',
  tags: [],
  port: 80,
  path: ''
};

const formatDisplayDomain = (domain: string, pathPrefix?: string) => {
  if (!domain) {
    return pathPrefix ? `/${pathPrefix}` : '';
  }
  return pathPrefix ? `${domain}/${pathPrefix}` : domain;
};

const normalizePathSegment = (value: string) => value.trim().replace(/^\/+/, '').replace(/\/+$/, '');

export function DashboardPage() {
  const { info, logout } = useSession();
  const { toast } = useToast();
  const [domains, setDomains] = useState<DomainSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [formState, setFormState] = useState<DomainFormState>(defaultFormState);
  const [domainInputValue, setDomainInputValue] = useState('');
  const [activeTab, setActiveTab] = useState<'simple' | 'advanced'>('simple');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ filename: string; domain: string } | null>(null);
  const [editingFilename, setEditingFilename] = useState<string | null>(null);
  const [dialogLoading, setDialogLoading] = useState(false);

  // New features states
  const [viewMode, setViewMode] = useState<'list' | 'folders'>('list');
  const [currentFolder, setCurrentFolder] = useState<string>('');
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    type: 'all',
    wildcard: 'all',
    tags: []
  });
  const [availableTags, setAvailableTags] = useState<TagInfo[]>([]);
  const [availableFolders, setAvailableFolders] = useState<string[]>([]);
  const [tagsDialogOpen, setTagsDialogOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [moveTarget, setMoveTarget] = useState<DomainSummary | null>(null);

  const loadDomains = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiGet<DomainListResponse>('/api/domains.php?action=list');
      const normalizedDomains = response.data.domains.map((domain) => ({
        ...domain,
        pathPrefix: domain.pathPrefix ?? ''
      }));
      setDomains(normalizedDomains);
    } catch (error) {
      console.error(error);
      toast({ title: 'Erro ao carregar domínios', description: error instanceof Error ? error.message : 'Tente novamente', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadTags = useCallback(async () => {
    try {
      const tags = await fetchAvailableTags();
      setAvailableTags(tags);
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  }, []);

  const loadFolders = useCallback(async () => {
    try {
      const folders = await fetchFolders();
      setAvailableFolders(folders);
    } catch (error) {
      console.error('Error loading folders:', error);
    }
  }, []);

  useEffect(() => {
    void loadDomains();
    void loadTags();
    void loadFolders();
  }, [loadDomains, loadTags, loadFolders]);

  // Calculate available subfolders in current folder
  const availableSubfolders = useMemo(() => {
    const foldersInCurrent = new Map<string, number>();

    domains.forEach((domain) => {
      // Only process domains that match current folder depth
      if (currentFolder === '') {
        // Root level - show first level folders
        const parts = domain.folder.split('/').filter(Boolean);
        if (parts.length > 0) {
          const firstFolder = parts[0];
          foldersInCurrent.set(firstFolder, (foldersInCurrent.get(firstFolder) || 0) + 1);
        }
      } else {
        // Inside a folder - show subfolders
        if (domain.folder.startsWith(currentFolder + '/')) {
          const relativePath = domain.folder.substring(currentFolder.length + 1);
          const parts = relativePath.split('/').filter(Boolean);
          if (parts.length > 0) {
            const subfolder = parts[0];
            const fullPath = currentFolder + '/' + subfolder;
            foldersInCurrent.set(fullPath, (foldersInCurrent.get(fullPath) || 0) + 1);
          }
        }
      }
    });

    return Array.from(foldersInCurrent.entries()).map(([path, count]) => ({
      name: path.split('/').pop() || path,
      path,
      filesCount: count,
    }));
  }, [domains, currentFolder]);

  const filteredDomains = useMemo(() => {
    let result = domains;

    // Filter by folder if in folder view mode
    if (viewMode === 'folders') {
      result = result.filter(d => d.folder === currentFolder);
    }

    // Filter by search (domain/IP)
    if (filters.search.trim()) {
      const term = filters.search.trim().toLowerCase();
      result = result.filter(d =>
        formatDisplayDomain(d.domain, d.pathPrefix).toLowerCase().includes(term) ||
        d.ip.toLowerCase().includes(term) ||
        d.filename.toLowerCase().includes(term)
      );
    }

    // Filter by type
    if (filters.type !== 'all') {
      result = result.filter(d => d.type === filters.type);
    }

    // Filter by wildcard
    if (filters.wildcard !== 'all') {
      const isWildcard = filters.wildcard === 'yes';
      result = result.filter(d => d.isWildcard === isWildcard);
    }

    // Filter by tags (AND - all tags must be present)
    if (filters.tags.length > 0) {
      result = result.filter(d =>
        filters.tags.every(tag => d.tags.includes(tag))
      );
    }

    return result;
  }, [domains, filters, viewMode, currentFolder]);

  const resetForm = useCallback(() => {
    setFormState(defaultFormState);
    setDomainInputValue('');
    setActiveTab('simple');
    setEditingFilename(null);
  }, []);

  const handleDomainInputChange = useCallback((rawValue: string) => {
    const trimmed = rawValue.trim();
    const withoutProtocol = trimmed.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
    const normalized = withoutProtocol.replace(/\/{2,}/g, '/');
    const segments = normalized.split('/');
    const baseDomain = segments[0] ?? '';
    const remainingSegments = segments.slice(1).filter(Boolean);
    const rawPrefix = remainingSegments.join('/').replace(/\/{2,}/g, '/');
    const cleanedPrefix = normalizePathSegment(rawPrefix);
    const sanitizedDomain = sanitizeDomain(baseDomain);

    let displayValue = sanitizedDomain;
    if (cleanedPrefix) {
      displayValue = sanitizedDomain ? `${sanitizedDomain}/${cleanedPrefix}` : `/${cleanedPrefix}`;
    } else if (!cleanedPrefix && trimmed.endsWith('/') && sanitizedDomain) {
      displayValue = `${sanitizedDomain}/`;
    }
    setDomainInputValue(displayValue);

    setFormState((prev) => ({
      ...prev,
      domain: sanitizedDomain,
      pathPrefix: cleanedPrefix
    }));
  }, []);

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = async (filename: string) => {
    setDialogLoading(true);
    setDialogOpen(true);
    try {
      const response = await apiGet<DomainDetails>(`/api/domains.php?action=get&file=${encodeURIComponent(filename)}`);
      const { info: details, content } = response.data;

      // Find domain in list to get tags and folder
      const domainInfo = domains.find(d => d.filename === filename);

      setFormState({
        type: details.type,
        domain: details.domain,
        pathPrefix: details.pathPrefix ?? '',
        ip: details.ip,
        wildcard: details.isWildcard,
        enableHttps: details.enableHttps !== false,
        yaml: content,
        folder: domainInfo?.folder || '',
        tags: domainInfo?.tags || [],
        port: details.port ?? 80,
        path: details.path ?? ''
      });
      setDomainInputValue(formatDisplayDomain(details.domain, details.pathPrefix ?? ''));
      setActiveTab('simple');
      setEditingFilename(filename);
    } catch (error) {
      console.error(error);
      toast({ title: 'Não foi possível carregar o domínio', description: error instanceof Error ? error.message : 'Tente novamente', variant: 'destructive' });
      setDialogOpen(false);
    } finally {
      setDialogLoading(false);
    }
  };

  const handleSave = async () => {
    if (saving) return;

    if (!formState.domain.trim() || !formState.ip.trim()) {
      toast({ title: 'Campos obrigatórios', description: 'Preencha domínio e IP.', variant: 'destructive' });
      return;
    }

    if (formState.type === 'passthrough' && formState.pathPrefix) {
      toast({ title: 'Configuração inválida', description: 'Prefixos de caminho não são suportados em Passthrough.', variant: 'destructive' });
      return;
    }

    // Generate filename automatically from domain
    const filenameBase = generateFilename(formState.domain);
    if (!filenameBase) {
      toast({ title: 'Informe um domínio válido', description: 'Preencha o nome do domínio para continuar.', variant: 'destructive' });
      return;
    }

    const newBaseFilename = ensureYamlExtension(filenameBase);
    // Build full path with folder for proper comparison
    const finalFilename = formState.folder ? `${formState.folder}/${newBaseFilename}` : newBaseFilename;

    const normalizedPath = normalizePathSegment(formState.path);
    // pathPrefixTarget pode ser vazio para ir para raiz (/) do backend
    const normalizedPathPrefixTarget = normalizePathSegment(formState.path);
    // Porta padrão 80 se vazia
    const normalizedPort = formState.port === '' ? 80 : Number(formState.port);

    try {
      setSaving(true);
      if (activeTab === 'simple') {
        if (editingFilename) {
          const generated = await apiPost<{ content: string }>('/api/domains.php', {
            action: 'generate',
            type: formState.type,
            domain: sanitizeDomain(formState.domain),
            ip: formState.ip,
            wildcard: formState.wildcard,
            enableHttps: formState.enableHttps,
            name: filenameBase,
            port: normalizedPort,
            path: normalizedPath,
            pathPrefix: formState.pathPrefix,
            pathPrefixTarget: normalizedPathPrefixTarget
          });

          // Compare with folder path included
          if (editingFilename !== finalFilename) {
            // Domain or folder changed - create new and delete old
            await apiPost('/api/domains.php', {
              action: 'create',
              filename: filenameBase,
              type: formState.type,
              domain: formState.domain,
              ip: formState.ip,
              wildcard: formState.wildcard,
              enableHttps: formState.enableHttps,
              folder: formState.folder,
              tags: formState.tags,
              port: formState.port,
              path: normalizedPath,
              pathPrefix: formState.pathPrefix,
              pathPrefixTarget: normalizedPathPrefixTarget
            });

            await apiPost('/api/domains.php', {
              action: 'delete',
              filename: editingFilename
            });
          } else {
            // Same file - just update content and tags
            await apiPost('/api/domains.php', {
              action: 'update',
              filename: editingFilename,
              content: generated.data.content
            });

            // Update tags separately
            await updateFileTags(editingFilename, formState.tags);
          }
        } else {
          await apiPost('/api/domains.php', {
            action: 'create',
            filename: filenameBase,
            type: formState.type,
            domain: formState.domain,
            ip: formState.ip,
            wildcard: formState.wildcard,
            enableHttps: formState.enableHttps,
            folder: formState.folder,
            tags: formState.tags,
            port: normalizedPort,
            path: normalizedPath,
            pathPrefix: formState.pathPrefix,
            pathPrefixTarget: normalizedPathPrefixTarget
          });
        }
      } else {
        // Advanced mode (YAML)
        if (editingFilename) {
          // Editing existing file
          await apiPost('/api/domains.php', {
            action: 'update',
            filename: editingFilename,
            content: formState.yaml
          });

          // Update tags separately
          await updateFileTags(editingFilename, formState.tags);
        } else {
          // Creating new file
          await apiPost('/api/domains.php', {
            action: 'create',
            filename: filenameBase,
            type: formState.type,
            domain: formState.domain,
            ip: formState.ip,
            wildcard: formState.wildcard,
            enableHttps: formState.enableHttps,
            folder: formState.folder,
            tags: formState.tags,
            port: normalizedPort,
            path: normalizedPath,
            pathPrefix: formState.pathPrefix,
            pathPrefixTarget: normalizedPathPrefixTarget
          });
        }
      }

      toast({ title: 'Domínio salvo', description: `As configurações para ${formatDisplayDomain(formState.domain, formState.pathPrefix)} foram atualizadas.` });
      setDialogOpen(false);
      await loadDomains();
    } catch (error) {
      console.error(error);
      toast({ title: 'Erro ao salvar', description: error instanceof Error ? error.message : 'Tente novamente.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const openDeleteDialog = (domain: DomainSummary) => {
    setDeleteTarget({ filename: domain.filename, domain: formatDisplayDomain(domain.domain, domain.pathPrefix) });
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setSaving(true);
      await apiPost('/api/domains.php', {
        action: 'delete',
        filename: deleteTarget.filename
      });
      toast({ title: 'Domínio removido', description: `${deleteTarget.domain} foi excluído.` });
      setDeleteOpen(false);
      setDeleteTarget(null);
      await loadDomains();
    } catch (error) {
      console.error(error);
      toast({ title: 'Erro ao remover', description: error instanceof Error ? error.message : 'Tente novamente.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (domain: DomainSummary, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      if (domain.enabled) {
        await disableDomain(domain.filename);
        toast({
          title: 'Domínio desativado',
          description: `${formatDisplayDomain(domain.domain, domain.pathPrefix)} foi desativado.`
        });
      } else {
        await enableDomain(domain.filename);
        toast({
          title: 'Domínio ativado',
          description: `${formatDisplayDomain(domain.domain, domain.pathPrefix)} foi ativado.`
        });
      }
      await loadDomains();
    } catch (error) {
      console.error(error);
      toast({
        title: 'Erro ao alterar status',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive'
      });
    }
  };

  const openLogsDialog = async () => {
    setLogsOpen(true);
    try {
      const response = await apiGet<{ logs: string[] }>('/api/logs.php?action=get');
      setLogs(response.data.logs);
    } catch (error) {
      console.error(error);
      toast({ title: 'Erro ao carregar logs', description: error instanceof Error ? error.message : 'Tente novamente.', variant: 'destructive' });
      setLogs([]);
    }
  };

  const signOut = async () => {
    await logout();
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      // Try modern clipboard API first (requires HTTPS or localhost)
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        toast({ title: 'Copiado!', description: `${label} copiado para a área de transferência.` });
        return;
      }

      // Fallback for HTTP (creates a temporary textarea)
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();

      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);

      if (successful) {
        toast({ title: 'Copiado!', description: `${label} copiado para a área de transferência.` });
      } else {
        throw new Error('execCommand failed');
      }
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({ title: 'Erro ao copiar', description: 'Não foi possível copiar para a área de transferência.', variant: 'destructive' });
    }
  };

  // Tags handlers
  const handleCreateTag = async (tag: string) => {
    try {
      await createTag(tag);
      toast({ title: 'Tag criada', description: `Tag "${tag}" foi criada com sucesso.` });
      await loadTags();
    } catch (error) {
      console.error('Error creating tag:', error);
      toast({ title: 'Erro ao criar tag', description: error instanceof Error ? error.message : 'Tente novamente.', variant: 'destructive' });
      throw error;
    }
  };

  const handleDeleteTag = async (tag: string) => {
    try {
      await deleteTag(tag);
      toast({ title: 'Tag removida', description: `Tag "${tag}" foi removida.` });
      await loadTags();
    } catch (error) {
      console.error('Error deleting tag:', error);
      toast({ title: 'Erro ao remover tag', description: error instanceof Error ? error.message : 'Tente novamente.', variant: 'destructive' });
      throw error;
    }
  };

  // Folder handlers
  const openMoveDialog = (domain: DomainSummary) => {
    setMoveTarget(domain);
    setFolderDialogOpen(true);
  };

  const handleMoveFile = async (targetFolder: string) => {
    if (!moveTarget) return;

    try {
      await moveFile(moveTarget.filename, targetFolder);
      const displayDomain = formatDisplayDomain(moveTarget.domain, moveTarget.pathPrefix);
      toast({ title: 'Arquivo movido', description: `${displayDomain} foi movido para ${targetFolder || 'raiz'}.` });
      setFolderDialogOpen(false);
      setMoveTarget(null);
      await loadDomains();
      await loadFolders();
    } catch (error) {
      console.error('Error moving file:', error);
      toast({ title: 'Erro ao mover arquivo', description: error instanceof Error ? error.message : 'Tente novamente.', variant: 'destructive' });
      throw error;
    }
  };

  const handleCreateFolder = async (folderPath: string) => {
    try {
      await createFolder(folderPath);
      toast({ title: 'Pasta criada', description: `Pasta "${folderPath}" foi criada.` });
      await loadFolders();
    } catch (error) {
      console.error('Error creating folder:', error);
      toast({ title: 'Erro ao criar pasta', description: error instanceof Error ? error.message : 'Tente novamente.', variant: 'destructive' });
      throw error;
    }
  };

  const headerActions = (
    <div className="flex flex-wrap items-center gap-2">
      <Button className="btn-info" onClick={() => void loadDomains()} title="Atualizar">
        <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
      </Button>
      <Button variant="secondary" onClick={() => setTagsDialogOpen(true)} title="Gerenciar tags">
        <Tags className="mr-2 h-4 w-4" /> Tags
      </Button>
      <Button
        variant={viewMode === 'list' ? 'default' : 'secondary'}
        onClick={() => setViewMode(viewMode === 'list' ? 'folders' : 'list')}
        title={viewMode === 'list' ? 'Visualização por pastas' : 'Visualização em lista'}
      >
        {viewMode === 'list' ? <FolderTree className="mr-2 h-4 w-4" /> : <Grid3x3 className="mr-2 h-4 w-4" />}
        {viewMode === 'list' ? 'Pastas' : 'Lista'}
      </Button>
      <Button variant="secondary" onClick={openLogsDialog} title="Ver logs">
        <FileText className="mr-2 h-4 w-4" /> Logs
      </Button>
      <Button asChild variant="secondary">
        <Link to="/api-docs.php" className="inline-flex items-center">
          <ShieldCheck className="mr-2 h-4 w-4" /> API
        </Link>
      </Button>
      <Button variant="destructive" onClick={signOut} title="Sair">
        <LogOut className="mr-2 h-4 w-4" /> Sair
      </Button>
    </div>
  );

  return (
    <div className="mx-auto flex min-h-screen w-full flex-col">
      <header className="app-header flex flex-col justify-between gap-4 px-6 py-6 shadow-lg sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-semibold">{info?.appName ?? 'Traefik Manager'}</h1>
        </div>
        {headerActions}
      </header>
      <div className="flex flex-col gap-6 px-6 py-8">

      <section className="flex flex-col gap-4">
        {/* Breadcrumb navigation for folder view */}
        {viewMode === 'folders' && (
          <BreadcrumbNavigation currentFolder={currentFolder} onNavigate={setCurrentFolder} />
        )}

        {/* Filters */}
        <DomainFilters
          filters={filters}
          onFiltersChange={setFilters}
          availableTags={availableTags.map((t) => t.name)}
          resultsCount={filteredDomains.length}
        />

        <div className="flex flex-col gap-4">

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Domínios encontrados</p>
                <p className="text-2xl font-bold">{domains.length}</p>
              </div>
              <Button className="btn-dark-blue" onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" /> Novo domínio
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : viewMode === 'folders' ? (
                /* Folder view - Show folders first, then files */
                <div className="space-y-2">
                  {/* Show subfolders */}
                  {availableSubfolders.map((folder) => (
                    <FolderListItem
                      key={folder.path}
                      name={folder.name}
                      path={folder.path}
                      filesCount={folder.filesCount}
                      onClick={() => setCurrentFolder(folder.path)}
                    />
                  ))}

                  {/* Show files in current folder */}
                  {filteredDomains.length === 0 && availableSubfolders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
                      <FileText className="h-10 w-10" />
                      <p>Nenhum domínio ou pasta encontrado.</p>
                    </div>
                  ) : (
                    filteredDomains.map((domain) => (
                      <FileListItem
                        key={domain.filename}
                        domain={formatDisplayDomain(domain.domain, domain.pathPrefix)}
                        type={domain.type}
                        ip={domain.ip}
                        tags={domain.tags}
                        isWildcard={domain.isWildcard}
                        enabled={domain.enabled}
                        onEdit={() => void openEditDialog(domain.filename)}
                        onMove={() => openMoveDialog(domain)}
                        onDelete={() => openDeleteDialog(domain)}
                        onToggleStatus={async () => {
                          try {
                            if (domain.enabled) {
                              await disableDomain(domain.filename);
                              toast({ title: 'Domínio desativado', description: `${formatDisplayDomain(domain.domain, domain.pathPrefix)} foi desativado.` });
                            } else {
                              await enableDomain(domain.filename);
                              toast({ title: 'Domínio ativado', description: `${formatDisplayDomain(domain.domain, domain.pathPrefix)} foi ativado.` });
                            }
                            await loadDomains();
                          } catch (error) {
                            console.error(error);
                            toast({ title: 'Erro ao alterar status', description: error instanceof Error ? error.message : 'Tente novamente.', variant: 'destructive' });
                          }
                        }}
                        onCopy={(text) => void copyToClipboard(text, 'Domínio')}
                      />
                    ))
                  )}
                </div>
              ) : (
                /* List view - Show table */
                filteredDomains.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
                    <FileText className="h-10 w-10" />
                    <p>Nenhum domínio encontrado.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Domínio</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>IP</TableHead>
                        <TableHead>Tags</TableHead>
                        <TableHead>Wildcard</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDomains.map((domain) => {
                        const displayDomain = formatDisplayDomain(domain.domain, domain.pathPrefix);
                        return (
                          <TableRow
                            key={domain.filename}
                            className={`cursor-pointer ${!domain.enabled ? 'opacity-50' : ''}`}
                            onClick={() => void openEditDialog(domain.filename)}
                          >
                            <TableCell>
                              <Badge
                                variant={domain.enabled ? 'default' : 'destructive'}
                                className={domain.enabled ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                              >
                                {domain.enabled ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <span>{displayDomain}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    void copyToClipboard(displayDomain, 'Domínio');
                                  }}
                                  title="Copiar domínio"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={domain.type === 'ssl-termination' ? 'default' : 'secondary'}>
                                {domain.type === 'ssl-termination' ? 'SSL Termination' : 'Passthrough'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <code>{domain.ip}</code>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {domain.tags.length > 0 ? (
                                  domain.tags.map((tag) => (
                                    <TagBadge key={tag} tag={tag} />
                                  ))
                                ) : (
                                  <span className="text-sm text-muted-foreground">—</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{domain.isWildcard ? 'Sim' : 'Não'}</TableCell>
                            <TableCell className="flex justify-end gap-2">
                              <Button
                                className={domain.enabled ? 'btn-power-off' : 'btn-power-on'}
                                size="sm"
                                onClick={(event) => void handleToggleStatus(domain, event)}
                                title={domain.enabled ? 'Desativar domínio' : 'Ativar domínio'}
                              >
                                <Power className="mr-1 h-4 w-4" /> {domain.enabled ? 'Desativar' : 'Ativar'}
                              </Button>
                              <Button className="btn-info" size="sm" onClick={(event) => { event.stopPropagation(); openMoveDialog(domain); }}>
                                <FolderOpen className="mr-1 h-4 w-4" /> Mover
                              </Button>
                              <Button variant="destructive" size="sm" onClick={(event) => { event.stopPropagation(); openDeleteDialog(domain); }}>
                                <Trash2 className="mr-1 h-4 w-4" /> Remover
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )
              )}
            </CardContent>
          </Card>
        </div>
      </section>
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); resetForm(); } }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingFilename ? 'Editar domínio' : 'Novo domínio'}</DialogTitle>
            <DialogDescription>
              Configure as opções básicas ou edite o YAML avançado para personalizar o comportamento do Traefik.
            </DialogDescription>
          </DialogHeader>

          {dialogLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'simple' | 'advanced')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="simple">Formulário</TabsTrigger>
                <TabsTrigger value="advanced">YAML</TabsTrigger>
              </TabsList>
              <TabsContent value="simple" className="border-none bg-transparent p-0 shadow-none">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Tipo de proxy</Label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => setFormState((prev) => ({ ...prev, type: 'ssl-termination' }))}
                        className={`flex flex-col rounded-lg border p-4 text-left transition hover:border-primary ${formState.type === 'ssl-termination' ? 'border-primary bg-primary/5' : 'border-border'}`}
                      >
                        <span className="font-medium">SSL Termination</span>
                        <span className="text-sm text-muted-foreground">O Traefik gerencia certificados e HTTPS.</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormState((prev) => ({ ...prev, type: 'passthrough' }))}
                        className={`flex flex-col rounded-lg border p-4 text-left transition hover:border-primary ${formState.type === 'passthrough' ? 'border-primary bg-primary/5' : 'border-border'}`}
                      >
                        <span className="font-medium">Passthrough</span>
                        <span className="text-sm text-muted-foreground">O backend fornece o certificado TLS.</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="domain">Domínio</Label>
                      <Input
                        id="domain"
                        value={domainInputValue}
                        onChange={(event) => handleDomainInputChange(event.target.value)}
                        placeholder="dominio.com/app"
                      />
                      <p className="text-xs text-muted-foreground">
                        Você pode incluir um caminho, por exemplo <code>dominio.com/app</code>, para mapear apenas esse prefixo.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ip">Backend IP ou Domínio</Label>
                      <Input
                        id="ip"
                        value={formState.ip}
                        onChange={(event) => setFormState((prev) => ({ ...prev, ip: event.target.value }))}
                        placeholder="10.8.100.10 ou backend.exemplo.com"
                      />
                    </div>
                  </div>

                  {/* Port e Path - apenas para SSL Termination */}
                  {formState.type === 'ssl-termination' && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="port">Porta (opcional)</Label>
                        <Input
                          id="port"
                          type="number"
                          min="1"
                          max="65535"
                          value={formState.port}
                          onChange={(event) => setFormState((prev) => ({ ...prev, port: event.target.value === '' ? '' : parseInt(event.target.value) || '' }))}
                          placeholder="80"
                        />
                        <p className="text-xs text-muted-foreground">Porta do servidor web. Padrão: 80</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="path">Caminho raiz (opcional)</Label>
                        <Input
                          id="path"
                          value={formState.path}
                          onChange={(event) => {
                            const value = event.target.value;
                            setFormState((prev) => ({ ...prev, path: value }));
                          }}
                          placeholder="traefik-manager"
                        />
                        <p className="text-xs text-muted-foreground">Redireciona / para /caminho/ ao remover o prefixo na resposta.</p>
                      </div>
                    </div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-center justify-between rounded-lg border border-border p-4">
                      <div>
                        <p className="font-medium">Usar wildcard</p>
                        <p className="text-sm text-muted-foreground">Habilita suporte a *.domínio.com.</p>
                      </div>
                      <Switch checked={formState.wildcard} onCheckedChange={(value) => setFormState((prev) => ({ ...prev, wildcard: value }))} />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-border p-4">
                      <div>
                        <p className="font-medium">Habilitar HTTPS</p>
                        <p className="text-sm text-muted-foreground">Disponível para SSL termination.</p>
                      </div>
                      <Switch checked={formState.enableHttps} onCheckedChange={(value) => setFormState((prev) => ({ ...prev, enableHttps: value }))} />
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags</Label>
                    <TagsMultiSelect
                      availableTags={availableTags.map((t) => t.name)}
                      selectedTags={formState.tags}
                      onChange={(tags) => setFormState((prev) => ({ ...prev, tags }))}
                      placeholder="Selecionar tags..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Adicione tags para organizar suas configurações. Gerencie tags disponíveis no menu principal.
                    </p>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="advanced" className="border-none bg-transparent p-0 shadow-none">
                <div className="space-y-3">
                  <Label htmlFor="yaml">Conteúdo YAML</Label>
                  <Textarea id="yaml" value={formState.yaml} onChange={(event) => setFormState((prev) => ({ ...prev, yaml: event.target.value }))} rows={16} className="font-mono text-sm" />
                  <p className="text-xs text-muted-foreground">Cole ou edite o YAML diretamente. Utilize esta aba para ajustes finos.</p>
                </div>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter className="pt-6">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => void handleSave()} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover domínio</DialogTitle>
            <DialogDescription>Esta ação não pode ser desfeita. O arquivo YAML será removido.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Tem certeza de que deseja excluir <span className="font-medium text-foreground">{deleteTarget?.domain}</span>?</p>
            <p className="text-xs text-muted-foreground">Arquivo: <code>{deleteTarget?.filename}</code></p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => void confirmDelete()} disabled={saving}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={logsOpen} onOpenChange={setLogsOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Logs recentes</DialogTitle>
            <DialogDescription>Últimas entradas registradas pelas operações do Traefik Manager.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum log disponível.</p>
            ) : (
              <pre className="whitespace-pre-wrap rounded-lg bg-muted/60 p-4 text-xs text-muted-foreground">{logs.join('\n')}</pre>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Tags Management Dialog */}
      <TagsManagementDialog
        open={tagsDialogOpen}
        onOpenChange={setTagsDialogOpen}
        tags={availableTags}
        onCreateTag={handleCreateTag}
        onDeleteTag={handleDeleteTag}
      />

      {/* Folder Dialog */}
      {moveTarget && (
        <FolderDialog
          open={folderDialogOpen}
          onOpenChange={setFolderDialogOpen}
          filename={formatDisplayDomain(moveTarget.domain, moveTarget.pathPrefix)}
          currentFolder={moveTarget.folder}
          folders={availableFolders}
          onMove={handleMoveFile}
          onCreateFolder={handleCreateFolder}
        />
      )}
      </div>
    </div>
  );
}
