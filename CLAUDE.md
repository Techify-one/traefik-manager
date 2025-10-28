# Traefik Manager - Referência Técnica para IA

## Visão Geral

Aplicação web full-stack para gerenciamento de configurações dinâmicas do Traefik v3. Permite criar, editar e organizar routers, services e middlewares de forma visual, suportando SSL Termination e SSL Passthrough.

**Stack:** PHP 7.4+ (Backend) + React 18 + TypeScript (Frontend) + Vite (Build)

**Armazenamento:** File-based (YAML configs + JSON metadata), sem banco de dados.

---

## Estrutura de Diretórios

```
/var/www/html/traefik-manager/
├── api/                          # REST API Endpoints
│   ├── domains.php              # CRUD domínios + pastas (833 linhas)
│   ├── tags.php                 # Gerenciamento tags (216 linhas)
│   ├── logs.php                 # Audit logs (61 linhas)
│   └── session.php              # Login/logout (75 linhas)
│
├── includes/                     # Módulos Backend
│   ├── auth.php                 # Session + Bearer Token auth (111 linhas)
│   ├── yaml-handler.php         # Parse/gera YAML (569 linhas)
│   ├── metadata-handler.php     # Sistema de tags (204 linhas)
│   ├── functions.php            # Validações e helpers (190 linhas)
│   └── logger.php               # Audit logging (65 linhas)
│
├── frontend/                     # React SPA
│   ├── src/
│   │   ├── components/          # Componentes React
│   │   │   ├── ui/             # 16 componentes shadcn/ui
│   │   │   ├── tags/           # TagBadge, TagsMultiSelect, TagsManagementDialog
│   │   │   ├── folders/        # FolderListItem, BreadcrumbNavigation, FolderDialog
│   │   │   └── filters/        # DomainFilters
│   │   ├── pages/              # dashboard-page.tsx (895 linhas), login-page.tsx, api-docs-page.tsx
│   │   ├── lib/                # api.ts, domains.ts, tags.ts, folders.ts, tag-colors.ts
│   │   └── types/              # domain.ts (interfaces TypeScript)
│   ├── dist/                    # Build output
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── config.php                    # Configurações da aplicação
├── index.php                     # Entry point
├── login.php / logout.php
├── build-frontend.sh             # Script de build
└── deploy.sh                     # Deploy automatizado
```

---

## Stack Tecnológico

### Backend
- **PHP 7.4+** com extensão php-yaml
- **Autenticação:** Session-based (cookies) + Bearer Token (API)
- **Storage:** Filesystem (`/var/www/traefik_configs/`)
- **Logs:** Custom logging system

### Frontend
- **React 18.3.1** + **TypeScript 5.4.2** (strict mode)
- **Build:** Vite 5.2.0
- **Styling:** Tailwind CSS 3.4.3
- **UI:** Radix UI (headless components)
- **Icons:** Lucide React
- **Routing:** React Router DOM 6.22.3
- **Command Palette:** cmdk 1.1.1

### Infraestrutura
- **Traefik v3.3.4** como reverse proxy
- **Docker Swarm** para orquestração
- **Let's Encrypt** para SSL (ACME)
- **Configs Path:** `/var/www/traefik_configs/`
- **Metadata:** `.metadata.json` (tags)

---

## Configurações Principais

### `/var/www/html/traefik-manager/config.php`
```php
APP_NAME = 'Traefik Manager'
APP_VERSION = '1.0.0'
ADMIN_USER = 'admin'
ADMIN_PASS = 'Redes147#@'
API_BEARER_TOKEN = 'traefik_5f4dcc3b5aa765d61d8327deb882cf99_manager_2025'
TRAEFIK_CONFIGS_PATH = '/var/www/traefik_configs'
LOGS_PATH = '/var/www/html/traefik-manager/logs'
YAML_EXT = '.yml'
Timezone = 'America/Sao_Paulo'
```

---

## Estruturas de Dados

### TypeScript: DomainSummary
```typescript
interface DomainSummary {
  filename: string;          // Pode incluir path: "redes/apache1.yml"
  type: 'ssl-termination' | 'passthrough';
  domain: string;            // Ex: "apache1.teste.techify.run"
  ip: string;                // IPv4 ou domain name
  isWildcard: boolean;       // Suporta *.domain.com
  enableHttps: boolean;      // SSL Termination only
  port: number;              // Backend port (padrão: 80)
  path: string;              // Path redirect (opcional)
  tags: string[];            // Ex: ["PRODUCAO", "BRASIL"]
  folder: string;            // Ex: "redes/brasil"
  size: number;              // Bytes
  modified: number;          // Unix timestamp
}
```

### TypeScript: FilterState
```typescript
interface FilterState {
  search: string;           // Busca por domínio ou IP
  type: 'all' | 'ssl-termination' | 'passthrough';
  wildcard: 'all' | 'yes' | 'no';
  tags: string[];          // Múltiplas tags (AND logic)
}
```

### JSON: Metadata Structure
```json
{
  "files": {
    "apache1.yml": {
      "tags": ["REDES-BRASIL", "PRODUCAO"]
    },
    "redes/servidor2.yml": {
      "tags": ["TECHIFY", "TESTE"]
    }
  },
  "availableTags": ["REDES-BRASIL", "PRODUCAO", "TECHIFY", "TESTE"]
}
```

### YAML: SSL Termination (Básico)
```yaml
http:
  routers:
    apache1-http:
      entryPoints: ["web"]
      rule: "Host(`apache1.teste.techify.run`)"
      service: "apache1-http"
      middlewares: ["redirect-https"]
    apache1-https:
      entryPoints: ["websecure"]
      rule: "Host(`apache1.teste.techify.run`)"
      service: "apache1-https"
      tls:
        certResolver: "letsencrypt"
  services:
    apache1-http:
      loadBalancer:
        servers:
          - url: "http://10.8.100.101:80"
    apache1-https:
      loadBalancer:
        servers:
          - url: "http://10.8.100.101:80"
```

### YAML: SSL Termination (Porta + Path Customizado)
```yaml
http:
  routers:
    proxy-http:
      rule: Host(`proxy.teste.techify.run`)
      service: proxy-service
      entryPoints: [web]
      middlewares: [redirect-to-https]
    proxy-https:
      rule: Host(`proxy.teste.techify.run`)
      service: proxy-service
      entryPoints: [websecure]
      middlewares: [redirect-root-to-path]  # Path redirect
      tls:
        certResolver: letsencrypt
  services:
    proxy-service:
      loadBalancer:
        servers:
          - url: http://10.50.50.50:64780  # Porta customizada
  middlewares:
    redirect-to-https:
      redirectScheme:
        scheme: https
        permanent: true
    redirect-root-to-path:
      redirectRegex:
        regex: "^(https?://[^/]+)/?$"
        replacement: "${1}/traefik-manager/"
        permanent: false
```

### YAML: SSL Passthrough
```yaml
tcp:
  routers:
    apache1-tcp:
      entryPoints: ["websecure"]
      rule: "HostSNI(`apache1.teste.techify.run`)"
      service: "apache1-tcp"
      tls:
        passthrough: true
  services:
    apache1-tcp:
      loadBalancer:
        servers:
          - address: "10.8.100.101:443"
```

---

## API Endpoints

### Autenticação
Dois métodos suportados:
1. **Session:** Cookie-based (login via formulário)
2. **Bearer Token:** Header `Authorization: Bearer {API_BEARER_TOKEN}`

### Domains API (`/api/domains.php`)

**Listar:**
```
GET /api/domains.php?action=list
Response: { success: true, data: { domains: DomainSummary[] } }
```

**Obter:**
```
GET /api/domains.php?action=get&file=apache1.yml
Response: { success: true, data: { domain: DomainDetails } }
```

**Criar:**
```
POST /api/domains.php
{
  "action": "create",
  "filename": "apache1",
  "folder": "redes",           // Opcional
  "type": "ssl-termination",
  "domain": "apache1.teste.techify.run",
  "ip": "10.8.100.101",
  "wildcard": false,
  "enableHttps": true,
  "port": 80,                  // Opcional, padrão 80
  "path": ""                   // Opcional, ex: "app"
}
```

**Atualizar:**
```
POST /api/domains.php
{
  "action": "update",
  "filename": "apache1.yml",
  "content": "yaml content here..."
}
```

**Deletar:**
```
POST /api/domains.php
{ "action": "delete", "filename": "apache1.yml" }
```

**Validar YAML:**
```
POST /api/domains.php
{ "action": "validate", "content": "yaml..." }
Response: { success: true/false, message: "..." }
```

**Gerar YAML:**
```
POST /api/domains.php
{
  "action": "generate",
  "type": "ssl-termination",
  "domain": "...",
  "ip": "...",
  // ... outros campos
}
Response: { success: true, data: { yaml: "..." } }
```

### Folders API (`/api/domains.php`)

**Criar Pasta:**
```
POST /api/domains.php
{ "action": "create-folder", "folderPath": "servidores/producao" }
```

**Listar Pastas:**
```
GET /api/domains.php?action=list-folders
Response: { success: true, data: { folders: ["redes", "servidores", ...] } }
```

**Mover Arquivo:**
```
POST /api/domains.php
{
  "action": "move",
  "filename": "apache1.yml",
  "targetFolder": "servidores/producao"  // ou "" para raiz
}
```

**Deletar Pasta:**
```
POST /api/domains.php
{ "action": "delete-folder", "folderPath": "servidores/old" }
```

### Tags API (`/api/tags.php`)

**Listar:**
```
GET /api/tags.php?action=list
Response: {
  success: true,
  data: {
    tags: [
      { name: "PRODUCAO", count: 5 },
      { name: "BRASIL", count: 3 }
    ]
  }
}
```

**Obter tags de arquivo:**
```
GET /api/tags.php?action=get&file=apache1.yml
Response: { success: true, data: { tags: ["PRODUCAO", "BRASIL"] } }
```

**Definir tags:**
```
POST /api/tags.php
{
  "action": "set",
  "filename": "apache1.yml",
  "tags": ["PRODUCAO", "BRASIL"]
}
```

**Criar tag:**
```
POST /api/tags.php
{ "action": "create", "tag": "NOVA-TAG" }
```

**Deletar tag:**
```
POST /api/tags.php
{ "action": "delete", "tag": "TAG-ANTIGA" }
```

### Logs API (`/api/logs.php`)
```
GET /api/logs.php
Response: { success: true, data: { logs: [...] } }
```

### Session API (`/api/session.php`)

**Info:**
```
GET /api/session.php?action=info
Response: { success: true, data: { user: "admin" } }
```

**Login:**
```
POST /api/session.php
{ "action": "login", "username": "admin", "password": "..." }
```

**Logout:**
```
POST /api/session.php
{ "action": "logout" }
```

---

## Funcionalidades Core

### 1. Dois Tipos de Configuração

**SSL Termination:**
- Traefik descriptografa SSL e encaminha HTTP ao backend
- Gera certificado Let's Encrypt automaticamente
- Suporta wildcard domains (`*.example.com`)
- HTTP → HTTPS redirect automático
- Porta customizada (padrão: 80)
- Path redirect opcional (ex: `/` → `/app/`)

**SSL Passthrough:**
- End-to-end encryption (sem descriptografia no Traefik)
- Roteamento TCP com SNI matching
- Certificado gerenciado no backend

### 2. Sistema de Tags

- Múltiplas tags por configuração
- 17 cores diferentes (hash-based para consistência)
- Contagem de uso por tag
- CRUD de tags via API
- Filtro por múltiplas tags (AND logic)

**Implementação:**
- Backend: `metadata-handler.php`
- Storage: `.metadata.json`
- Frontend: `TagBadge`, `TagsMultiSelect`, `TagsManagementDialog`

### 3. Organização por Pastas

- Estrutura hierárquica de diretórios
- Criar/deletar/mover pastas
- Breadcrumb navigation
- Dois modos de visualização:
  - **Lista:** Tabela tradicional com todos os arquivos
  - **Pastas:** Vista hierárquica estilo N8N

**Segurança:**
- `normalizePath()` previne path traversal
- Validação de caracteres especiais

### 4. Filtros Avançados

Combinação de filtros (AND logic):
- Busca por texto (domínio ou IP)
- Tipo de configuração
- Wildcard sim/não
- Múltiplas tags (todas devem estar presentes)

**Implementação:**
```typescript
const filteredDomains = useMemo(() => {
  return domains
    .filter(d => currentFolder === '' || d.folder === currentFolder)
    .filter(d => !filters.search ||
      d.domain.toLowerCase().includes(filters.search.toLowerCase()) ||
      d.ip.includes(filters.search))
    .filter(d => filters.type === 'all' || d.type === filters.type)
    .filter(d => filters.wildcard === 'all' ||
      (filters.wildcard === 'yes' && d.isWildcard) ||
      (filters.wildcard === 'no' && !d.isWildcard))
    .filter(d => filters.tags.length === 0 ||
      filters.tags.every(tag => d.tags.includes(tag)));
}, [domains, currentFolder, filters]);
```

### 5. Dual Editing Modes

**Simple Mode:**
- Formulário visual com campos
- Auto-geração de YAML
- Validação de campos
- Ideal para casos de uso comuns

**Advanced Mode:**
- Editor YAML raw
- Full control sobre configuração
- Validação de sintaxe
- Para configurações complexas

### 6. Campos Opcionais SSL Termination

**Porta (Port):**
- Padrão: 80
- Validação: 1-65535
- Exemplo: 64780 para apps em portas não-padrão

**Caminho (Path):**
- Opcional
- Redireciona `/` para `/path/`
- Exemplo: "traefik-manager" → acessar `/` redireciona para `/traefik-manager/`
- Gera middleware `redirect-root-to-path` automaticamente

---

## Módulos Backend Principais

### yaml-handler.php

**Funções principais:**
```php
// YAML
generateSslTerminationYaml($name, $domain, $ip, $isWildcard, $enableHttps, $port, $path)
generatePassthroughYaml($name, $domain, $ip)
parseYamlFile($filename)
validateYaml($content)

// Arquivos
saveYamlFile($filename, $content, $folder = '')
deleteYamlFile($filename)
listYamlFiles()  // Retorna array de DomainSummary
getYamlFileDetails($filename)

// Pastas
normalizePath($path)  // Segurança contra path traversal
createFolder($folderPath)
listFolders()
moveFile($currentPath, $targetFolder)
deleteFolder($folderPath)
```

### metadata-handler.php

**Funções principais:**
```php
getMetadata()              // Carrega .metadata.json
saveMetadata($data)        // Salva .metadata.json
getTags($filename)         // Tags de um arquivo
setTags($filename, $tags)  // Define tags
getAllAvailableTags()      // Lista todas as tags
addAvailableTag($tag)      // Cria nova tag
removeAvailableTag($tag)   // Remove tag
getTagUsageCount($tag)     // Conta uso da tag
removeFileTags($filename)  // Remove tags ao deletar arquivo
renameFileTags($old, $new) // Renomeia arquivo nas tags
```

### auth.php

**Funções principais:**
```php
checkAuth()          // Valida session OU bearer token
isLoggedInSession()  // Verifica cookie de session
isValidToken($token) // Valida Bearer token
login($user, $pass)  // Cria session
logout()             // Destroi session
```

**Flow de autenticação:**
1. Verifica session cookie primeiro
2. Se não logado, tenta Bearer token no header
3. Se ambos falham: retorna 401 Unauthorized

### functions.php

**Helpers úteis:**
```php
validateDomain($domain)        // RFC-compliant domain validation
validateIP($ip)                // IPv4 validation
sanitizeFilename($filename)    // Remove caracteres perigosos
ensureYamlExtension($filename) // Adiciona .yml se necessário
getViteAsset($entry)           // Retorna path do asset buildado
```

---

## Frontend: Componentes Principais

### dashboard-page.tsx (895 linhas)

**Responsabilidades:**
- Lista de configurações
- Criar/editar domínios (dual mode)
- Sistema de filtros
- Navegação de pastas
- Gerenciamento de tags

**Estados principais:**
```typescript
const [domains, setDomains] = useState<DomainSummary[]>([]);
const [viewMode, setViewMode] = useState<'list' | 'folders'>('list');
const [currentFolder, setCurrentFolder] = useState('');
const [filters, setFilters] = useState<FilterState>({...});
const [activeTab, setActiveTab] = useState<'simple' | 'advanced'>('simple');
```

**Lógica de Save:**
```typescript
// Ao salvar, decide entre create, update ou create+delete
if (editingFilename) {
  if (editingFilename !== finalFilename) {
    // Domínio ou pasta mudou
    await createDomain(...);
    await deleteDomain(editingFilename);
  } else {
    // Apenas update
    await updateDomain(editingFilename, content);
    await updateFileTags(editingFilename, tags);
  }
} else {
  // Novo domínio
  await createDomain(...);
}
```

### Tags Components

**TagBadge:** Exibe tag com cor baseada em hash
**TagsMultiSelect:** Dropdown multi-select com search
**TagsManagementDialog:** CRUD global de tags

### Folders Components

**FolderListItem:** Visual de pasta (ícone + nome + count)
**FileListItem:** Visual de arquivo (domínio + tipo + IP + tags)
**BreadcrumbNavigation:** Navegação hierárquica
**FolderDialog:** Criar nova pasta

### Filters Component

**DomainFilters:** Interface unificada de filtros
- Search input
- Type select
- Wildcard select
- Tags multi-select

---

## Build e Deploy

### Build Frontend
```bash
cd /var/www/html/traefik-manager/frontend
npm run build
```

**Output:** `frontend/dist/` com manifest em `.vite/manifest.json`

### Deploy Automatizado
```bash
./deploy.sh
```

**Script faz:**
1. Build do frontend (Vite)
2. Reset OPcache PHP
3. Verifica arquivos gerados

### Acesso
- **UI:** `http://server/traefik-manager/`
- **Login:** `http://server/traefik-manager/login.php`
- **API:** `http://server/traefik-manager/api/domains.php`
- **Docs:** `http://server/traefik-manager/api-docs.php`

---

## Convenções de Código

### PHP
- PSR-12 coding style
- Validação de entrada em todos os endpoints
- `normalizePath()` para segurança
- Logs detalhados de operações
- PHPDoc em todas as funções

### TypeScript/React
- Functional components + hooks
- TypeScript strict mode
- `useMemo` para otimização de cálculos pesados
- `useCallback` para funções passadas como props
- Nomenclatura clara e descritiva

### Tratamento de Erros
```typescript
try {
  await operation();
  toast({ title: 'Sucesso', description: 'Operação concluída' });
} catch (error) {
  console.error(error);
  toast({
    title: 'Erro',
    description: error instanceof Error ? error.message : 'Tente novamente',
    variant: 'destructive'
  });
}
```

---

## Debugging

### Logs
```bash
tail -f /var/www/html/traefik-manager/logs/*.log
```

### Problemas Comuns

**"File already exists":**
- Lógica de update vs create está usando paths incorretos
- Verificar comparação de `editingFilename` vs `finalFilename`

**Tags não aparecem:**
- Permissões do `.metadata.json`
- PHP precisa read/write em `/var/www/traefik_configs/`

**Build não reflete mudanças:**
- Limpar dist: `rm -rf frontend/dist/`
- Force reload: Ctrl+Shift+R
- Limpar OPcache PHP

**Pastas não aparecem:**
- Permissões: `ls -la /var/www/traefik_configs/`
- Verificar API `list-folders`
- Console do navegador (F12)

---

## Notas de Segurança

1. **Path Traversal:** `normalizePath()` remove `../` e valida paths
2. **Input Validation:** Todos os endpoints validam entrada
3. **Domain Validation:** RFC-compliant via `validateDomain()`
4. **IP Validation:** IPv4 via `validateIP()`
5. **Filename Sanitization:** Remove caracteres perigosos
6. **Authentication:** Dual-mode (session + token) obrigatória em todas as APIs
7. **YAML Injection:** Validação de sintaxe antes de salvar

---

**Versão:** 2.1.0
**Última atualização:** 28 de Outubro de 2025
