import { React, html } from '../lib/html.js';
import { Link } from 'https://esm.sh/react-router-dom@6.22.3?bundle';
import { useSession } from '../context/session-context.js';
import { useToast } from '../hooks/toast.js';
import { apiGet, apiPost } from '../lib/api.js';
import { sanitizeDomain, generateFilename, ensureYamlExtension } from '../lib/domains.js';
import { Button, Card, CardContent, CardHeader, Badge, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, Label, Switch, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Tabs, Textarea } from '../components/ui.js';
import { FileText, Loader2, LogOut, Plus, RefreshCw, ShieldCheck, Trash2 } from '../components/icons.js';

const defaultFormState = {
  filename: '',
  type: 'ssl-termination',
  domain: '',
  ip: '',
  wildcard: false,
  enableHttps: true,
  yaml: '',
};

function formatDate(dateString) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleString();
}

function DomainDialog({ open, onOpenChange, formState, setFormState, activeTab, setActiveTab, onSave, loading, editingFilename }) {
  const tabs = [
    { value: 'simple', label: 'Modo simples', content: html`<SimpleForm formState=${formState} setFormState=${setFormState} />` },
    { value: 'advanced', label: 'YAML completo', content: html`<AdvancedForm formState=${formState} setFormState=${setFormState} />` },
  ];

  return html`
    <${Dialog} open=${open} onOpenChange=${onOpenChange}>
      <${DialogHeader}>
        <${DialogTitle}>${editingFilename ? 'Editar domínio' : 'Novo domínio'}</${DialogTitle}>
        <${DialogDescription}>
          Configure o roteamento para seu domínio em minutos. Você pode usar o modo simples ou colar um YAML personalizado.
        </${DialogDescription}>
      </${DialogHeader}>
      <${DialogContent}>
        <div class="space-y-6">
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <${Label} for="filename">Nome do arquivo</${Label}>
              <${Input} id="filename" value=${formState.filename} placeholder="ex: api.meudominio" onInput=${(event) => setFormState((state) => ({ ...state, filename: event.target.value }))} />
              <p class="text-xs text-slate-500">Será salvo em <code>data/domains/&lt;nome&gt;.yml</code>.</p>
            </div>
            <div class="space-y-2">
              <${Label} for="domain">Domínio</${Label}>
              <${Input} id="domain" value=${formState.domain} placeholder="dominio.com.br" onInput=${(event) => setFormState((state) => ({ ...state, domain: event.target.value }))} />
            </div>
          </div>

          <${Tabs} value=${activeTab} onValueChange=${setActiveTab} tabs=${tabs} />
        </div>
      </${DialogContent}>
      <${DialogFooter}>
        <${Button} variant="outline" onClick=${() => onOpenChange(false)}>Cancelar</${Button}>
        <${Button} onClick=${onSave} disabled=${loading}>
          ${loading ? html`<${Loader2} class="h-4 w-4 animate-spin" />` : null}
          ${loading ? 'Salvando...' : 'Salvar'}
        </${Button}>
      </${DialogFooter}>
    </${Dialog}>
  `;
}

function SimpleForm({ formState, setFormState }) {
  return html`
    <div class="grid gap-4">
      <div class="grid gap-4 sm:grid-cols-2">
        <div class="space-y-2">
          <${Label} for="ip">Endereço IP</${Label}>
          <${Input} id="ip" value=${formState.ip} placeholder="192.168.0.1" onInput=${(event) => setFormState((state) => ({ ...state, ip: event.target.value }))} />
        </div>
        <div class="space-y-2">
          <${Label}>Tipo</${Label}>
          <div class="flex items-center gap-3">
            <label class="flex items-center gap-2 text-sm">
              <input type="radio" class="h-4 w-4" name="type" value="ssl-termination" checked=${formState.type === 'ssl-termination'} onChange=${(event) => setFormState((state) => ({ ...state, type: event.target.value }))} />
              SSL Termination
            </label>
            <label class="flex items-center gap-2 text-sm">
              <input type="radio" class="h-4 w-4" name="type" value="passthrough" checked=${formState.type === 'passthrough'} onChange=${(event) => setFormState((state) => ({ ...state, type: event.target.value }))} />
              Passthrough
            </label>
          </div>
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <label class="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <div>
            <p class="text-sm font-medium text-slate-900">Wildcard</p>
            <p class="text-xs text-slate-500">Permitir subdomínios automaticamente.</p>
          </div>
          <${Switch} checked=${formState.wildcard} onChange=${(value) => setFormState((state) => ({ ...state, wildcard: value }))} />
        </label>
        <label class="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <div>
            <p class="text-sm font-medium text-slate-900">Forçar HTTPS</p>
            <p class="text-xs text-slate-500">Redirecionar automaticamente para HTTPS.</p>
          </div>
          <${Switch} checked=${formState.enableHttps} onChange=${(value) => setFormState((state) => ({ ...state, enableHttps: value }))} />
        </label>
      </div>
    </div>
  `;
}

function AdvancedForm({ formState, setFormState }) {
  return html`
    <div class="space-y-2">
      <${Label} for="yaml">Arquivo YAML</${Label}>
      <${Textarea} id="yaml" rows=${16} value=${formState.yaml} onInput=${(event) => setFormState((state) => ({ ...state, yaml: event.target.value }))} placeholder="Cole seu YAML completo aqui"></${Textarea}>
      <p class="text-xs text-slate-500">Use este modo para colar arquivos prontos exportados de outra instância.</p>
    </div>
  `;
}

function ConfirmDialog({ open, onConfirm, onCancel, domain }) {
  return html`
    <${Dialog} open=${open} onOpenChange=${(value) => !value && onCancel()}>
      <${DialogHeader}>
        <${DialogTitle}>Remover domínio</${DialogTitle}>
        <${DialogDescription}>Tem certeza que deseja remover ${domain}?</${DialogDescription}>
      </${DialogHeader}>
      <${DialogFooter}>
        <${Button} variant="outline" onClick=${onCancel}>Cancelar</${Button}>
        <${Button} variant="destructive" onClick=${onConfirm}>Remover</${Button}>
      </${DialogFooter}>
    </${Dialog}>
  `;
}

function LogsDialog({ open, onClose, lines, title }) {
  return html`
    <${Dialog} open=${open} onOpenChange=${(value) => !value && onClose()}>
      <${DialogHeader}>
        <${DialogTitle}>Logs de ${title || 'domínio'}</${DialogTitle}>
        <${DialogDescription}>Últimas linhas registradas.</${DialogDescription}>
      </${DialogHeader}>
      <${DialogContent}>
        <pre class="max-h-96 overflow-auto rounded-md bg-slate-900 p-4 text-xs text-slate-100">${lines.join('\n') || 'Sem registros.'}</pre>
      </${DialogContent}>
      <${DialogFooter}>
        <${Button} onClick=${onClose}>Fechar</${Button}>
      </${DialogFooter}>
    </${Dialog}>
  `;
}

function DashboardPage() {
  const { info, logout } = useSession();
  const { pushToast } = useToast();
  const [domains, setDomains] = React.useState([]);
  const [search, setSearch] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [logsOpen, setLogsOpen] = React.useState(false);
  const [logs, setLogs] = React.useState([]);
  const [logsTitle, setLogsTitle] = React.useState('');
  const [formState, setFormState] = React.useState(defaultFormState);
  const [activeTab, setActiveTab] = React.useState('simple');
  const [saving, setSaving] = React.useState(false);
  const [editingFilename, setEditingFilename] = React.useState(null);
  const [deleteTarget, setDeleteTarget] = React.useState(null);

  const loadDomains = React.useCallback(async () => {
    try {
      setLoading(true);
      const result = await apiGet('/api/domains.php?action=list');
      setDomains(result.data.domains);
    } catch (error) {
      console.error(error);
      pushToast({ title: 'Erro ao carregar domínios', description: error instanceof Error ? error.message : 'Tente novamente', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  React.useEffect(() => {
    loadDomains();
  }, [loadDomains]);

  const filteredDomains = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return domains;
    return domains.filter((domain) => domain.domain.toLowerCase().includes(term) || domain.ip.toLowerCase().includes(term));
  }, [domains, search]);

  const openCreate = () => {
    setFormState(defaultFormState);
    setActiveTab('simple');
    setEditingFilename(null);
    setDialogOpen(true);
  };

  const openEdit = async (filename) => {
    try {
      setDialogOpen(true);
      setSaving(true);
      const response = await apiGet(`/api/domains.php?action=get&file=${encodeURIComponent(filename)}`);
      const { info: details, content } = response.data;
      setFormState({
        filename: filename.replace(/\.yml$/, ''),
        type: details.type,
        domain: details.domain,
        ip: details.ip,
        wildcard: details.isWildcard,
        enableHttps: details.enableHttps !== false,
        yaml: content,
      });
      setActiveTab('simple');
      setEditingFilename(filename);
    } catch (error) {
      console.error(error);
      pushToast({ title: 'Não foi possível carregar o domínio', description: error instanceof Error ? error.message : 'Tente novamente', variant: 'destructive' });
      setDialogOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (saving) return;
    const filenameBase = (formState.filename.trim() || generateFilename(formState.domain)).replace(/\s+/g, '');
    if (!filenameBase || !formState.domain.trim() || !formState.ip.trim()) {
      pushToast({ title: 'Preencha os campos obrigatórios', description: 'Informe domínio, IP e nome do arquivo.', variant: 'destructive' });
      return;
    }

    const finalFilename = ensureYamlExtension(filenameBase);

    try {
      setSaving(true);
      if (activeTab === 'simple') {
        if (editingFilename) {
          const generated = await apiPost('/api/domains.php', {
            action: 'generate',
            type: formState.type,
            domain: sanitizeDomain(formState.domain),
            ip: formState.ip,
            wildcard: formState.wildcard,
            enableHttps: formState.enableHttps,
            name: filenameBase,
          });

          if (editingFilename !== finalFilename) {
            await apiPost('/api/domains.php', {
              action: 'create',
              filename: filenameBase,
              type: formState.type,
              domain: formState.domain,
              ip: formState.ip,
              wildcard: formState.wildcard,
              enableHttps: formState.enableHttps,
            });

            await apiPost('/api/domains.php', { action: 'delete', filename: editingFilename });
          } else {
            await apiPost('/api/domains.php', {
              action: 'update',
              filename: editingFilename,
              content: generated.data.content,
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
            enableHttps: formState.enableHttps,
          });
        }
      } else {
        const action = editingFilename ? 'update' : 'create';
        await apiPost('/api/domains.php', { action, filename: editingFilename ?? finalFilename, content: formState.yaml });
      }

      pushToast({ title: 'Domínio salvo', description: `As configurações para ${formState.domain} foram atualizadas.` });
      setDialogOpen(false);
      await loadDomains();
    } catch (error) {
      console.error(error);
      pushToast({ title: 'Erro ao salvar', description: error instanceof Error ? error.message : 'Tente novamente.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const closeDelete = React.useCallback(() => {
    setDeleteOpen(false);
    setDeleteTarget(null);
  }, []);

  const openDelete = (domain) => {
    setDeleteTarget(domain);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiPost('/api/domains.php', { action: 'delete', filename: deleteTarget.filename });
      pushToast({ title: 'Domínio removido', description: `${deleteTarget.domain} foi excluído.` });
      closeDelete();
      await loadDomains();
    } catch (error) {
      pushToast({ title: 'Não foi possível remover', description: error instanceof Error ? error.message : 'Tente novamente.', variant: 'destructive' });
    }
  };

  const closeLogs = React.useCallback(() => {
    setLogsOpen(false);
    setLogsTitle('');
    setLogs([]);
  }, []);

  const openLogs = async (filename) => {
    try {
      const response = await apiGet(`/api/domains.php?action=logs&file=${encodeURIComponent(filename)}`);
      setLogs(response.data.logs || []);
      const domain = domains.find((item) => item.filename === filename);
      setLogsTitle(domain ? domain.domain : filename);
      setLogsOpen(true);
    } catch (error) {
      pushToast({ title: 'Não foi possível carregar os logs', description: error instanceof Error ? error.message : 'Tente novamente.', variant: 'destructive' });
    }
  };

  return html`
    <div class="min-h-screen bg-slate-50">
      <header class="border-b border-slate-200 bg-white">
        <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 class="text-xl font-semibold text-slate-900">${info?.appName || 'Traefik Manager'}</h1>
            <p class="text-sm text-slate-500">Versão ${info?.version || '—'}</p>
          </div>
          <div class="flex items-center gap-3">
            <${Button} variant="ghost" asChild>
              <${Link} to="/api-docs" class="flex items-center gap-2">
                <${FileText} class="h-4 w-4" /> API Docs
              </${Link}>
            </${Button}>
            <span class="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">${info?.username || 'Usuário'}</span>
            <${Button} variant="outline" onClick=${logout}>
              <${LogOut} class="h-4 w-4" /> Sair
            </${Button}>
          </div>
        </div>
      </header>

      <main class="mx-auto max-w-6xl px-6 py-8 space-y-6">
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 class="text-2xl font-bold text-slate-900">Domínios</h2>
            <p class="text-sm text-slate-500">Gerencie arquivos YAML do Traefik com visualização amigável.</p>
          </div>
          <div class="flex gap-3">
            <${Button} variant="outline" onClick=${loadDomains} disabled=${loading}>
              ${loading ? html`<${Loader2} class="h-4 w-4 animate-spin" />` : html`<${RefreshCw} class="h-4 w-4" />`} Atualizar
            </${Button}>
            <${Button} onClick=${openCreate}>
              <${Plus} class="h-4 w-4" /> Novo domínio
            </${Button}>
          </div>
        </div>

        <Card>
          <${CardHeader}>
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div class="flex items-center gap-2">
                <${ShieldCheck} class="h-5 w-5 text-emerald-600" />
                <p class="text-sm text-slate-600">${domains.length} domínios cadastrados</p>
              </div>
              <div class="w-full sm:w-64">
                <${Input} value=${search} placeholder="Buscar por domínio ou IP" onInput=${(event) => setSearch(event.target.value)} />
              </div>
            </div>
          </${CardHeader}>
          <${CardContent} className="p-0">
            ${loading ? html`<div class="flex items-center justify-center py-16"><${Loader2} class="h-8 w-8 animate-spin text-slate-500" /></div>` :
              filteredDomains.length === 0 ? html`<div class="py-16 text-center text-sm text-slate-500">Nenhum domínio encontrado.</div>` :
              html`<${Table}>
                <${TableHeader}>
                  <${TableRow}>
                    <${TableHead}>Domínio</${TableHead}>
                    <${TableHead}>IP</${TableHead}>
                    <${TableHead}>Tipo</${TableHead}>
                    <${TableHead}>Atualizado em</${TableHead}>
                    <${TableHead} className="w-32 text-right">Ações</${TableHead}>
                  </${TableRow}>
                </${TableHeader}>
                <${TableBody}>
                  ${filteredDomains.map((domain) => html`<${TableRow} key=${domain.filename}>
                    <${TableCell}>
                      <div class="flex flex-col">
                        <span class="font-medium text-slate-900">${domain.domain}</span>
                        <span class="text-xs text-slate-500">${domain.filename}</span>
                      </div>
                    </${TableCell}>
                    <${TableCell}>${domain.ip}</${TableCell}>
                    <${TableCell}>
                      <${Badge} variant=${domain.type === 'passthrough' ? 'outline' : 'success'}>
                        ${domain.type === 'passthrough' ? 'Passthrough' : 'SSL Termination'}
                      </${Badge}>
                    </${TableCell}>
                    <${TableCell}>${formatDate(domain.updated_at)}</${TableCell}>
                    <${TableCell} className="flex justify-end gap-2">
                      <${Button} variant="ghost" onClick=${() => openLogs(domain.filename)}>
                        <${FileText} class="h-4 w-4" /> Logs
                      </${Button}>
                      <${Button} variant="ghost" onClick=${() => openEdit(domain.filename)}>
                        <${ShieldCheck} class="h-4 w-4" /> Editar
                      </${Button}>
                      <${Button} variant="ghost" onClick=${() => openDelete(domain)}>
                        <${Trash2} class="h-4 w-4 text-red-500" />
                      </${Button}>
                    </${TableCell}>
                  </${TableRow}>`)}
                </${TableBody}>
              </${Table}>`}
          </${CardContent}>
        </Card>
      </main>

      <${DomainDialog}
        open=${dialogOpen}
        onOpenChange=${setDialogOpen}
        formState=${formState}
        setFormState=${setFormState}
        activeTab=${activeTab}
        setActiveTab=${setActiveTab}
        onSave=${handleSave}
        loading=${saving}
        editingFilename=${editingFilename}
      />

      <${ConfirmDialog}
        open=${deleteOpen}
        onConfirm=${confirmDelete}
        onCancel=${closeDelete}
        domain=${deleteTarget?.domain}
      />

      <${LogsDialog}
        open=${logsOpen}
        onClose=${closeLogs}
        lines=${logs}
        title=${logsTitle}
      />
    </div>
  `;
}

export default DashboardPage;
