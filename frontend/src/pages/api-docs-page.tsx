import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { useSession } from '../context/session-context';
import { useToast } from '../hooks/use-toast';
import { FileText, LinkIcon, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const endpoints = [
  {
    method: 'GET',
    title: 'Listar domínios',
    description: 'Recupera todos os arquivos YAML disponíveis.',
    path: '/domains.php?action=list'
  },
  {
    method: 'GET',
    title: 'Obter domínio',
    description: 'Retorna detalhes de um domínio específico.',
    path: '/domains.php?action=get&file=FILENAME.yml'
  },
  {
    method: 'POST',
    title: 'Criar domínio',
    description: 'Cria um novo arquivo YAML a partir de um payload JSON.',
    path: '/domains.php',
    bodyExample: `{
  "action": "create",
  "filename": "exemplo.yml",
  "type": "ssl-termination",
  "domain": "app.seudominio.com",
  "ip": "10.8.100.10",
  "wildcard": false
}`
  },
  {
    method: 'POST',
    title: 'Atualizar domínio',
    description: 'Sobrescreve o conteúdo YAML existente.',
    path: '/domains.php',
    bodyExample: `{
  "action": "update",
  "filename": "exemplo.yml",
  "content": "...yaml..."
}`
  },
  {
    method: 'POST',
    title: 'Excluir domínio',
    description: 'Remove um arquivo YAML definitivamente.',
    path: '/domains.php',
    bodyExample: `{
  "action": "delete",
  "filename": "exemplo.yml"
}`
  }
] as const;

export function ApiDocsPage() {
  const { info } = useSession();
  const { toast } = useToast();

  const baseUrl = info.apiBaseUrl ?? `${window.location.origin}/api`;
  const bearerToken = info.bearerToken ?? 'TOKEN_INDICADO_EM_config.php';

  const copy = async (value: string, message = 'Copiado!') => {
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: message });
    } catch (error) {
      console.error(error);
      toast({ title: 'Falha ao copiar', description: error instanceof Error ? error.message : 'Tente novamente', variant: 'destructive' });
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-8">
      <header className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-semibold">Documentação da API</h1>
          <p className="text-sm text-muted-foreground">Token e endpoints para integrações automatizadas.</p>
        </div>
        <Button asChild variant="secondary">
          <Link to="/">Voltar ao dashboard</Link>
        </Button>
      </header>

      <section className="grid gap-4">
        <Card>
          <CardHeader className="space-y-2">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <Shield className="h-5 w-5 text-primary" /> Token de autenticação
            </div>
            <p className="text-sm text-muted-foreground">Inclua este token no header Authorization como Bearer token.</p>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 p-4 font-mono text-sm">
              <span className="truncate">{bearerToken}</span>
              <Button size="sm" variant="ghost" onClick={() => void copy(bearerToken)}>
                Copiar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-2">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <LinkIcon className="h-5 w-5 text-primary" /> Base URL
            </div>
            <p className="text-sm text-muted-foreground">Combine com os caminhos abaixo para montar as requisições.</p>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 p-4 font-mono text-sm">
              <span className="truncate">{baseUrl}</span>
              <Button size="sm" variant="ghost" onClick={() => void copy(baseUrl)}>
                Copiar
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4">
        {endpoints.map((endpoint) => {
          const url = `${baseUrl}${endpoint.path}`;
          const curl = endpoint.method === 'GET'
            ? `curl -H "Authorization: Bearer ${bearerToken}" "${url}"`
            : `curl -X ${endpoint.method} -H "Authorization: Bearer ${bearerToken}" -H "Content-Type: application/json" -d '${endpoint.bodyExample ?? '{}'}' "${url}"`;

          return (
            <Card key={endpoint.title}>
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-md px-2 py-1 text-xs font-semibold ${endpoint.method === 'GET' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                    {endpoint.method}
                  </span>
                  <span className="font-medium">{endpoint.title}</span>
                </div>
                <p className="text-sm text-muted-foreground">{endpoint.description}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => void copy(url, 'Endpoint copiado!')}>
                Copiar endpoint
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border border-border bg-muted/30 p-3 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span>{endpoint.method} {url}</span>
                  <Button size="sm" variant="ghost" onClick={() => void copy(curl, 'cURL copiado!')}>
                    Copiar cURL
                  </Button>
                </div>
                {endpoint.bodyExample ? (
                  <pre className="mt-3 whitespace-pre-wrap text-muted-foreground">{endpoint.bodyExample}</pre>
                ) : null}
              </div>
            </CardContent>
            </Card>
          );
        })}
      </section>

      <section>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-lg font-semibold">
              <FileText className="h-5 w-5 text-primary" /> Observações
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Todas as rotas exigem autenticação via Bearer token ou sessão ativa.</p>
            <p>• Respostas seguem o formato JSON com chaves <code>success</code>, <code>message</code> e <code>data</code>.</p>
            <p>• Utilize <code>Content-Type: application/json</code> para requisições POST.</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
