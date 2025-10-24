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
import { apiGet, apiPost } from '../lib/api';
import { ensureYamlExtension, generateFilename, sanitizeDomain } from '../lib/domains';
import type { DomainDetails, DomainListResponse, DomainSummary } from '../types/domain';
import { FileText, Loader2, LogOut, Plus, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react';

interface DomainFormState {
  filename: string;
  type: 'ssl-termination' | 'passthrough';
  domain: string;
  ip: string;
  wildcard: boolean;
  enableHttps: boolean;
  yaml: string;
}

const defaultFormState: DomainFormState = {
  filename: '',
  type: 'ssl-termination',
  domain: '',
  ip: '',
  wildcard: false,
  enableHttps: true,
  yaml: ''
};

export function DashboardPage() {
  const { info, logout } = useSession();
  const { toast } = useToast();
  const [domains, setDomains] = useState<DomainSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formState, setFormState] = useState<DomainFormState>(defaultFormState);
  const [activeTab, setActiveTab] = useState<'simple' | 'advanced'>('simple');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ filename: string; domain: string } | null>(null);
  const [editingFilename, setEditingFilename] = useState<string | null>(null);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [filenameTouched, setFilenameTouched] = useState(false);

  const loadDomains = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiGet<DomainListResponse>('/api/domains.php?action=list');
      setDomains(response.data.domains);
    } catch (error) {
      console.error(error);
      toast({ title: 'Erro ao carregar domínios', description: error instanceof Error ? error.message : 'Tente novamente', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadDomains();
  }, [loadDomains]);

  const filteredDomains = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return domains;
    }
    return domains.filter((domain) => domain.domain.toLowerCase().includes(term) || domain.ip.toLowerCase().includes(term));
  }, [domains, search]);

  const resetForm = useCallback(() => {
    setFormState(defaultFormState);
    setActiveTab('simple');
    setEditingFilename(null);
    setFilenameTouched(false);
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
      setFormState({
        filename: filename.replace(/\.yml$/, ''),
        type: details.type,
        domain: details.domain,
        ip: details.ip,
        wildcard: details.isWildcard,
        enableHttps: details.enableHttps !== false,
        yaml: content
      });
      setActiveTab('simple');
      setEditingFilename(filename);
      setFilenameTouched(true);
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

    const filenameBase = (formState.filename.trim() || generateFilename(formState.domain)).replace(/\s+/g, '');
    if (!filenameBase) {
      toast({ title: 'Informe um domínio válido', description: 'Preencha o nome do domínio para continuar.', variant: 'destructive' });
      return;
    }

    if (!formState.domain.trim() || !formState.ip.trim()) {
      toast({ title: 'Campos obrigatórios', description: 'Preencha domínio e IP.', variant: 'destructive' });
      return;
    }

    const finalFilename = ensureYamlExtension(filenameBase);

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
            name: filenameBase
          });

          if (editingFilename !== finalFilename) {
            await apiPost('/api/domains.php', {
              action: 'create',
              filename: filenameBase,
              type: formState.type,
              domain: formState.domain,
              ip: formState.ip,
              wildcard: formState.wildcard,
              enableHttps: formState.enableHttps
            });

            await apiPost('/api/domains.php', {
              action: 'delete',
              filename: editingFilename
            });
          } else {
            await apiPost('/api/domains.php', {
              action: 'update',
              filename: editingFilename,
              content: generated.data.content
            });
          }
        } else {
          await apiPost('/api/domains.php', {
            action: 'create',
            filename: filenameBase,
            type: formState.type,
            domain: formState.domain,
            ip: formState.ip,
            wildcard: formState.wildcard,
            enableHttps: formState.enableHttps
          });
        }
      } else {
        const payloadFilename = editingFilename ?? finalFilename;
        await apiPost('/api/domains.php', {
          action: editingFilename ? 'update' : 'create',
          filename: payloadFilename,
          content: formState.yaml
        });
      }

      toast({ title: 'Domínio salvo', description: `As configurações para ${formState.domain} foram atualizadas.` });
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
    setDeleteTarget({ filename: domain.filename, domain: domain.domain });
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

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button variant="secondary" onClick={() => void loadDomains()} title="Atualizar">
        <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
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
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-8">
      <header className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-semibold">{info.appName}</h1>
          <p className="text-sm text-muted-foreground">Olá, {info.username ?? 'usuário'}! Gerencie seus domínios Traefik.</p>
        </div>
        {headerActions}
      </header>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-semibold">Domínios</h2>
            <p className="text-sm text-muted-foreground">Crie, edite e remova configurações dinâmicas.</p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" /> Novo domínio
          </Button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative w-full max-w-sm">
              <Input placeholder="Buscar por domínio ou IP" value={search} onChange={(event) => setSearch(event.target.value)} className="pl-10" />
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-4.35-4.35m0 0A6.5 6.5 0 1010.3 17.3l6.35 6.35z" />
                </svg>
              </span>
            </div>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Domínios encontrados</p>
                <p className="text-2xl font-bold">{domains.length}</p>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredDomains.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
                  <FileText className="h-10 w-10" />
                  <p>Nenhum domínio encontrado.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Domínio</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>Wildcard</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDomains.map((domain) => (
                      <TableRow key={domain.filename} className="cursor-pointer" onClick={() => void openEditDialog(domain.filename)}>
                        <TableCell className="font-medium">{domain.domain}</TableCell>
                        <TableCell>
                          <Badge variant={domain.type === 'ssl-termination' ? 'default' : 'secondary'}>
                            {domain.type === 'ssl-termination' ? 'SSL Termination' : 'Passthrough'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <code>{domain.ip}</code>
                        </TableCell>
                        <TableCell>{domain.isWildcard ? 'Sim' : 'Não'}</TableCell>
                        <TableCell className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={(event) => { event.stopPropagation(); void openEditDialog(domain.filename); }}>
                            Editar
                          </Button>
                          <Button variant="destructive" size="sm" onClick={(event) => { event.stopPropagation(); openDeleteDialog(domain); }}>
                            <Trash2 className="mr-1 h-4 w-4" /> Remover
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
                        value={formState.domain}
                        onChange={(event) => {
                          const value = event.target.value;
                          setFormState((prev) => ({
                            ...prev,
                            domain: value,
                            filename: !filenameTouched ? generateFilename(value) : prev.filename
                          }));
                        }}
                        placeholder="exemplo.seudominio.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ip">Backend IP</Label>
                      <Input
                        id="ip"
                        value={formState.ip}
                        onChange={(event) => setFormState((prev) => ({ ...prev, ip: event.target.value }))}
                        placeholder="10.8.100.10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="filename">Nome do arquivo</Label>
                    <Input
                      id="filename"
                      value={formState.filename}
                      onChange={(event) => {
                        setFilenameTouched(true);
                        setFormState((prev) => ({ ...prev, filename: event.target.value }));
                      }}
                      placeholder="exemplo"
                    />
                    <p className="text-xs text-muted-foreground">A extensão <code>.yml</code> será adicionada automaticamente.</p>
                  </div>

                  <div className="space-y-1 text-sm text-muted-foreground">
                    <span className="font-medium">Arquivo gerado:</span> <code>{ensureYamlExtension(formState.filename || generateFilename(formState.domain) || 'dominio')}</code>
                  </div>

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
    </div>
  );
}
