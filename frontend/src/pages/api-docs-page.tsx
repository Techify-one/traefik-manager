import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { useSession } from '../context/session-context';
import { useToast } from '../hooks/use-toast';
import { FileText, LinkIcon, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Endpoint {
  method: 'GET' | 'POST';
  title: string;
  description: string;
  path: string;
  bodyExample?: string;
  responseExample?: string;
}

const endpoints: Endpoint[] = [
  {
    method: 'GET',
    title: 'Listar domínios',
    description: 'Recupera todos os arquivos YAML disponíveis.',
    path: '/domains.php?action=list',
    responseExample: `{
  "success": true,
  "message": "Domains retrieved successfully",
  "data": {
    "domains": [
      {
        "filename": "apache1.yml",
        "type": "ssl-termination",
        "domain": "apache1.teste.techify.run",
        "ip": "10.8.100.101",
        "isWildcard": false,
        "enableHttps": true,
        "port": 80,
        "path": "",
        "tags": ["PRODUCAO", "BRASIL"],
        "folder": "",
        "size": 1024,
        "modified": 1704067200
      }
    ]
  }
}`
  },
  {
    method: 'GET',
    title: 'Obter domínio',
    description: 'Retorna detalhes de um domínio específico.',
    path: '/domains.php?action=get&file=FILENAME.yml',
    responseExample: `{
  "success": true,
  "message": "Domain retrieved successfully",
  "data": {
    "filename": "apache1.yml",
    "content": "http:\\n  routers:...",
    "info": {
      "domain": "apache1.teste.techify.run",
      "ip": "10.8.100.101",
      "type": "ssl-termination",
      "isWildcard": false,
      "enableHttps": true,
      "port": 80,
      "path": ""
    }
  }
}`
  },
  {
    method: 'POST',
    title: 'Criar domínio',
    description: 'Cria um novo arquivo YAML a partir de um payload JSON.',
    path: '/domains.php',
    bodyExample: `{
  "action": "create",
  "filename": "exemplo",
  "folder": "servidores",
  "type": "ssl-termination",
  "domain": "app.seudominio.com",
  "ip": "10.8.100.10",
  "wildcard": false,
  "enableHttps": true,
  "port": 8080,
  "path": "admin",
  "tags": ["PRODUCAO", "TECHIFY"]
}`,
    responseExample: `{
  "success": true,
  "message": "Domain created successfully",
  "data": {
    "filename": "servidores/exemplo.yml",
    "content": "http:\\n  routers:..."
  }
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
  "content": "http:\\n  routers:\\n    exemplo-http:\\n      rule: Host(\`exemplo.com\`)\\n      service: exemplo-service\\n      entryPoints: [web]\\n  services:\\n    exemplo-service:\\n      loadBalancer:\\n        servers:\\n          - url: http://10.8.100.10:80"
}`,
    responseExample: `{
  "success": true,
  "message": "Domain updated successfully",
  "data": {
    "filename": "exemplo.yml"
  }
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
}`,
    responseExample: `{
  "success": true,
  "message": "Domain deleted successfully"
}`
  },
  {
    method: 'POST',
    title: 'Validar YAML',
    description: 'Valida a sintaxe de um conteúdo YAML sem salvar.',
    path: '/domains.php',
    bodyExample: `{
  "action": "validate",
  "content": "http:\\n  routers:..."
}`,
    responseExample: `{
  "success": true,
  "message": "Valid YAML",
  "data": {
    "valid": true
  }
}`
  },
  {
    method: 'POST',
    title: 'Gerar YAML',
    description: 'Gera conteúdo YAML sem salvar no disco.',
    path: '/domains.php',
    bodyExample: `{
  "action": "generate",
  "type": "ssl-termination",
  "domain": "exemplo.teste.com",
  "ip": "10.8.100.100",
  "wildcard": false,
  "enableHttps": true,
  "name": "exemplo",
  "port": 3000,
  "path": "app"
}`,
    responseExample: `{
  "success": true,
  "message": "YAML generated successfully",
  "data": {
    "content": "http:\\n  routers:\\n    exemplo-http:..."
  }
}`
  },
  {
    method: 'POST',
    title: 'Criar pasta',
    description: 'Cria uma nova pasta na estrutura de configurações.',
    path: '/domains.php',
    bodyExample: `{
  "action": "create-folder",
  "folderPath": "servidores/producao"
}`,
    responseExample: `{
  "success": true,
  "message": "Folder created successfully",
  "data": {
    "folderPath": "servidores/producao"
  }
}`
  },
  {
    method: 'GET',
    title: 'Listar pastas',
    description: 'Lista todas as pastas disponíveis.',
    path: '/domains.php?action=list-folders',
    responseExample: `{
  "success": true,
  "message": "Folders retrieved successfully",
  "data": {
    "folders": ["redes", "servidores", "servidores/producao"]
  }
}`
  },
  {
    method: 'POST',
    title: 'Mover arquivo',
    description: 'Move um arquivo para outra pasta.',
    path: '/domains.php',
    bodyExample: `{
  "action": "move",
  "filename": "apache1.yml",
  "targetFolder": "servidores/producao"
}`,
    responseExample: `{
  "success": true,
  "message": "File moved successfully",
  "data": {
    "filename": "apache1.yml",
    "targetFolder": "servidores/producao"
  }
}`
  },
  {
    method: 'POST',
    title: 'Deletar pasta',
    description: 'Remove uma pasta vazia.',
    path: '/domains.php',
    bodyExample: `{
  "action": "delete-folder",
  "folderPath": "servidores/old"
}`,
    responseExample: `{
  "success": true,
  "message": "Folder deleted successfully",
  "data": {
    "folderPath": "servidores/old"
  }
}`
  },
  {
    method: 'GET',
    title: 'Listar tags',
    description: 'Lista todas as tags disponíveis com contagem de uso.',
    path: '/tags.php?action=list',
    responseExample: `{
  "success": true,
  "message": "Tags retrieved successfully",
  "data": {
    "tags": [
      { "name": "PRODUCAO", "count": 5 },
      { "name": "BRASIL", "count": 3 },
      { "name": "TECHIFY", "count": 2 }
    ]
  }
}`
  },
  {
    method: 'GET',
    title: 'Obter tags de arquivo',
    description: 'Retorna as tags associadas a um arquivo específico.',
    path: '/tags.php?action=get&file=apache1.yml',
    responseExample: `{
  "success": true,
  "message": "Tags retrieved successfully",
  "data": {
    "tags": ["PRODUCAO", "BRASIL"]
  }
}`
  },
  {
    method: 'POST',
    title: 'Definir tags',
    description: 'Associa um conjunto de tags a um arquivo.',
    path: '/tags.php',
    bodyExample: `{
  "action": "set",
  "filename": "apache1.yml",
  "tags": ["PRODUCAO", "BRASIL", "TECHIFY"]
}`,
    responseExample: `{
  "success": true,
  "message": "Tags updated successfully"
}`
  },
  {
    method: 'POST',
    title: 'Criar tag',
    description: 'Cria uma nova tag no sistema.',
    path: '/tags.php',
    bodyExample: `{
  "action": "create",
  "tag": "NOVA-TAG"
}`,
    responseExample: `{
  "success": true,
  "message": "Tag created successfully"
}`
  },
  {
    method: 'POST',
    title: 'Deletar tag',
    description: 'Remove uma tag do sistema (não afeta arquivos).',
    path: '/tags.php',
    bodyExample: `{
  "action": "delete",
  "tag": "TAG-ANTIGA"
}`,
    responseExample: `{
  "success": true,
  "message": "Tag deleted successfully"
}`
  },
  {
    method: 'GET',
    title: 'Listar logs',
    description: 'Retorna os logs de auditoria do sistema.',
    path: '/logs.php',
    responseExample: `{
  "success": true,
  "message": "Logs retrieved successfully",
  "data": {
    "logs": [
      "[2025-01-15 10:30:45] CREATE - apache1.yml - Domain: apache1.teste.com",
      "[2025-01-15 10:25:30] UPDATE - proxy.yml - Domain: proxy.teste.com"
    ]
  }
}`
  },
  {
    method: 'GET',
    title: 'Info da sessão',
    description: 'Retorna informações do usuário logado.',
    path: '/session.php?action=info',
    responseExample: `{
  "success": true,
  "message": "Session info retrieved",
  "data": {
    "user": "admin"
  }
}`
  },
  {
    method: 'POST',
    title: 'Login',
    description: 'Autentica um usuário e cria uma sessão.',
    path: '/session.php',
    bodyExample: `{
  "action": "login",
  "username": "admin",
  "password": "senha_segura"
}`,
    responseExample: `{
  "success": true,
  "message": "Login successful"
}`
  },
  {
    method: 'POST',
    title: 'Logout',
    description: 'Encerra a sessão atual.',
    path: '/session.php',
    bodyExample: `{
  "action": "logout"
}`,
    responseExample: `{
  "success": true,
  "message": "Logout successful"
}`
  }
];

export function ApiDocsPage() {
  const { info } = useSession();
  const { toast } = useToast();
  const [expandedResponses, setExpandedResponses] = useState<Set<number>>(new Set());

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

  const toggleResponse = (index: number) => {
    setExpandedResponses((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
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
        {endpoints.map((endpoint, index) => {
          const url = `${baseUrl}${endpoint.path}`;
          const curl = endpoint.method === 'GET'
            ? `curl -H "Authorization: Bearer ${bearerToken}" "${url}"`
            : `curl -X ${endpoint.method} -H "Authorization: Bearer ${bearerToken}" -H "Content-Type: application/json" -d '${endpoint.bodyExample ?? '{}'}' "${url}"`;

          const isExpanded = expandedResponses.has(index);

          return (
            <Card key={`${endpoint.title}-${index}`}>
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
                    <span className="break-all">{endpoint.method} {url}</span>
                    <Button size="sm" variant="ghost" onClick={() => void copy(curl, 'cURL copiado!')}>
                      Copiar cURL
                    </Button>
                  </div>
                  {endpoint.bodyExample ? (
                    <pre className="mt-3 whitespace-pre-wrap text-muted-foreground">{endpoint.bodyExample}</pre>
                  ) : null}
                </div>

                {/* Response Section */}
                {endpoint.responseExample && (
                  <div className="space-y-2">
                    <button
                      onClick={() => toggleResponse(index)}
                      className="flex w-full items-center justify-between rounded-lg border border-border bg-background p-3 text-left transition-colors hover:bg-muted/50"
                    >
                      <span className="font-semibold text-sm">Response</span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="rounded-lg border border-border bg-muted/30 p-3 font-mono text-xs">
                        <pre className="whitespace-pre-wrap text-muted-foreground">{endpoint.responseExample}</pre>
                      </div>
                    )}
                  </div>
                )}
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
            <p>• Os campos <code>port</code> e <code>path</code> são exclusivos para o tipo <code>ssl-termination</code>.</p>
            <p>• Tags são opcionais e podem ser utilizadas para organizar configurações.</p>
            <p>• Pastas (folders) permitem hierarquia de arquivos como <code>servidores/producao/apache1.yml</code>.</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
