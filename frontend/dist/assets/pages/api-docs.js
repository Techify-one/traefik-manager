import { React, html } from '../lib/html.js';
import { Link } from 'https://esm.sh/react-router-dom@6.22.3?bundle';
import { useSession } from '../context/session-context.js';
import { Button, Card, CardContent, CardHeader } from '../components/ui.js';
import { Copy, ExternalLink, RefreshCw } from '../components/icons.js';
import { useToast } from '../hooks/toast.js';

function CodeBlock({ title, description, code }) {
  const { pushToast } = useToast();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code.trim());
      pushToast({ title: 'Copiado', description: `${title} copiado para a área de transferência.` });
    } catch (error) {
      pushToast({ title: 'Não foi possível copiar', description: error instanceof Error ? error.message : 'Tente novamente.', variant: 'destructive' });
    }
  };

  return html`
    <div class="rounded-lg border border-slate-200 bg-slate-900 text-slate-100 shadow-sm">
      <div class="flex items-center justify-between border-b border-slate-700 px-4 py-3">
        <div>
          <p class="text-sm font-semibold">${title}</p>
          ${description ? html`<p class="text-xs text-slate-400">${description}</p>` : null}
        </div>
        <button class="inline-flex items-center gap-2 rounded-md border border-slate-700 px-3 py-1 text-xs font-medium text-slate-200 transition hover:bg-slate-800" onClick=${copy}>
          <${Copy} class="h-3.5 w-3.5" /> Copiar
        </button>
      </div>
      <pre class="overflow-x-auto px-4 py-3 text-sm"><code>${code.trim()}</code></pre>
    </div>
  `;
}

function ApiDocsPage() {
  const { info, refresh, loading } = useSession();

  const endpoints = info?.apiBaseUrl ? [
    {
      method: 'GET',
      path: `${info.apiBaseUrl}/domains.php?action=list`,
      description: 'Lista todos os domínios cadastrados.',
    },
    {
      method: 'POST',
      path: `${info.apiBaseUrl}/domains.php`,
      description: 'Cria, atualiza ou remove domínios. Utilize o campo `action` no corpo JSON.',
    },
    {
      method: 'GET',
      path: `${info.apiBaseUrl}/domains.php?action=logs&file=<arquivo>`,
      description: 'Retorna as últimas linhas do log para o domínio informado.',
    },
  ] : [];

  const bearerSnippet = info?.bearerToken ? `Authorization: Bearer ${info.bearerToken}` : 'Autentique-se para ver o token.';

  return html`
    <div class="min-h-screen bg-slate-50">
      <header class="border-b border-slate-200 bg-white">
        <div class="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <h1 class="text-xl font-semibold text-slate-900">Documentação da API</h1>
            <p class="text-sm text-slate-500">Utilize estes endpoints para integrar com outros sistemas.</p>
          </div>
          <div class="flex items-center gap-3">
            <${Button} variant="ghost" asChild>
              <${Link} to="/" class="flex items-center gap-2">
                ← Voltar ao painel
              </${Link}>
            </${Button}>
            <${Button} variant="outline" onClick=${refresh} disabled=${loading}>
              ${loading ? html`<${RefreshCw} class="h-4 w-4 animate-spin" />` : 'Atualizar sessão'}
            </${Button}>
          </div>
        </div>
      </header>

      <main class="mx-auto max-w-5xl space-y-6 px-6 py-8">
        <section class="grid gap-4 sm:grid-cols-2">
          <${Card}>
            <${CardHeader}>
              <p class="text-sm font-semibold text-slate-900">Token Bearer</p>
              <p class="text-xs text-slate-500">Use este token em conjunto com um cookie de sessão válido.</p>
            </${CardHeader}>
            <${CardContent}>
              <${CodeBlock} title="Authorization" description="Cabeçalho HTTP para autenticação" code=${bearerSnippet} />
            </${CardContent}>
          </${Card}>
          <${Card}>
            <${CardHeader}>
              <p class="text-sm font-semibold text-slate-900">Base da API</p>
              <p class="text-xs text-slate-500">URL base utilizada nas requisições.</p>
            </${CardHeader}>
            <${CardContent}>
              <div class="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                ${info?.apiBaseUrl || 'Autentique-se para visualizar.'}
              </div>
            </${CardContent}>
          </${Card}>
        </section>

        <section class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-slate-900">Endpoints disponíveis</h2>
            <a href="https://github.com/techify-br/traefik-manager" target="_blank" rel="noopener" class="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
              <${ExternalLink} class="h-4 w-4" /> Repositório
            </a>
          </div>

          ${endpoints.length === 0 ? html`<p class="text-sm text-slate-500">Nenhum endpoint disponível. Verifique se você está autenticado.</p>` :
            endpoints.map((endpoint) => html`
              <${Card} key=${endpoint.path}>
                <${CardHeader}>
                  <div class="flex items-center gap-2">
                    <span class="inline-flex items-center rounded-md bg-slate-900 px-2.5 py-1 text-xs font-medium uppercase text-white">${endpoint.method}</span>
                    <code class="text-sm text-slate-600">${endpoint.path}</code>
                  </div>
                </${CardHeader}>
                <${CardContent}>
                  <p class="text-sm text-slate-600">${endpoint.description}</p>
                </${CardContent}>
              </${Card}>
            `)
          }
        </section>

        <section class="space-y-4">
          <h2 class="text-lg font-semibold text-slate-900">Exemplo de requisição</h2>
          <${CodeBlock}
            title="curl"
            description="Criação de domínio utilizando o modo simples"
            code=${`curl -X POST ${info?.apiBaseUrl || 'https://seu-servidor/api'}/domains.php \
  -H "Content-Type: application/json" \
  -H "${bearerSnippet}" \
  -d '{
    "action": "create",
    "filename": "meu-servico",
    "type": "ssl-termination",
    "domain": "app.dominio.com",
    "ip": "192.168.0.10",
    "wildcard": false,
    "enableHttps": true
  }'
`}
          />
        </section>
      </main>
    </div>
  `;
}

export default ApiDocsPage;
