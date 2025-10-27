# Traefik Manager - Documentação de Desenvolvimento

## Visão Geral do Projeto

O **Traefik Manager** é uma aplicação web para gerenciamento de configurações dinâmicas do Traefik. Permite criar, editar e organizar configurações de roteamento (routers, services, middlewares) de forma visual, suportando tanto SSL Termination quanto SSL Passthrough.

### Tecnologias Utilizadas

**Backend:**
- PHP 7.4+
- YAML Parser (Symfony YAML Component)
- Autenticação por Session + Bearer Token
- Sistema de logs

**Frontend:**
- React 18.3.1
- TypeScript
- Vite 5.2.0 (build tool)
- Tailwind CSS 3.4.3
- Radix UI (componentes)
- Lucide React (ícones)

**Infraestrutura:**
- Traefik (reverse proxy)
- Configurações armazenadas em: `/var/www/traefik_configs/`
- Metadata em: `/var/www/traefik_configs/.metadata.json`

---

## Arquitetura do Sistema

```
/var/www/html/traefik-manager/
├── api/                          # Endpoints PHP
│   ├── domains.php              # CRUD de domínios + folders
│   └── tags.php                 # Gerenciamento de tags
├── includes/                     # Módulos PHP
│   ├── auth.php                 # Autenticação
│   ├── functions.php            # Helpers gerais
│   ├── yaml-handler.php         # Manipulação de arquivos YAML
│   ├── metadata-handler.php     # Sistema de tags (NEW)
│   └── logger.php               # Sistema de logs
├── frontend/                     # Aplicação React
│   ├── src/
│   │   ├── components/          # Componentes reutilizáveis
│   │   │   ├── ui/             # Componentes base (shadcn/ui)
│   │   │   ├── tags/           # Sistema de tags (NEW)
│   │   │   ├── folders/        # Sistema de pastas (NEW)
│   │   │   └── filters/        # Sistema de filtros (NEW)
│   │   ├── lib/                # Utilitários e APIs
│   │   │   ├── api.ts          # Cliente HTTP
│   │   │   ├── domains.ts      # Funções de domínio
│   │   │   ├── tags.ts         # API de tags (NEW)
│   │   │   ├── folders.ts      # API de folders (NEW)
│   │   │   └── tag-colors.ts   # Cores de tags (NEW)
│   │   ├── pages/              # Páginas
│   │   │   └── dashboard-page.tsx  # Dashboard principal
│   │   └── types/              # TypeScript types
│   │       └── domain.ts       # Tipos de domínio
│   └── dist/                    # Build (gerado)
└── deploy.sh                    # Script de deploy automatizado
```

---

## Funcionalidades Implementadas

### 1. Sistema de Tags

Permite categorizar configurações com múltiplas tags para melhor organização.

#### Backend - Metadata Handler
**Arquivo:** `/var/www/html/traefik-manager/includes/metadata-handler.php`

Funções principais:
```php
getMetadata()              // Carrega metadata.json
saveMetadata($data)        // Salva metadata.json
getTags($filename)         // Retorna tags de um arquivo
setTags($filename, $tags)  // Define tags para um arquivo
getAllAvailableTags()      // Lista todas as tags disponíveis
addAvailableTag($tag)      // Adiciona nova tag
removeAvailableTag($tag)   // Remove tag do sistema
getTagUsageCount($tag)     // Conta quantos arquivos usam a tag
removeFileTags($filename)  // Remove tags de um arquivo (ao deletar)
renameFileTags($old, $new) // Renomeia arquivo nas tags
```

**Estrutura do metadata.json:**
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

#### API de Tags
**Arquivo:** `/var/www/html/traefik-manager/api/tags.php`

Endpoints:
- `GET /api/tags.php?action=list` - Lista todas as tags disponíveis
- `GET /api/tags.php?action=get&file=arquivo.yml` - Retorna tags de um arquivo
- `POST /api/tags.php` - Ações: set, create, delete

**Exemplos de uso:**
```javascript
// Listar tags disponíveis
GET /api/tags.php?action=list
Response: {
  "success": true,
  "data": {
    "tags": [
      {"name": "REDES-BRASIL", "count": 3},
      {"name": "TECHIFY", "count": 1}
    ]
  }
}

// Criar nova tag
POST /api/tags.php
{
  "action": "create",
  "tag": "NOVA-TAG"
}

// Atribuir tags a um arquivo
POST /api/tags.php
{
  "action": "set",
  "filename": "apache1.yml",
  "tags": ["TAG1", "TAG2"]
}

// Deletar tag
POST /api/tags.php
{
  "action": "delete",
  "tag": "TAG-ANTIGA"
}
```

#### Frontend - Componentes de Tags

**1. TagBadge** - `/frontend/src/components/tags/tag-badge.tsx`
- Exibe tag com cor específica
- 17 esquemas de cores diferentes (hash-based para consistência)
- Suporta botão de remoção

**2. TagsMultiSelect** - `/frontend/src/components/tags/tags-multi-select.tsx`
- Dropdown de seleção múltipla de tags
- Auto-complete com busca
- Exibe tags selecionadas com badges coloridos
- Permite adicionar/remover tags facilmente

**3. TagsManagementDialog** - `/frontend/src/components/tags/tags-management-dialog.tsx`
- Dialog para gerenciar tags globais
- Criar novas tags
- Excluir tags existentes (mostra contagem de uso)

#### Cores de Tags
**Arquivo:** `/frontend/src/lib/tag-colors.ts`

Sistema de cores baseado em hash do nome da tag:
```typescript
// 17 esquemas de cores diferentes
const colors = [
  'bg-red-100 text-red-800 border-red-300',
  'bg-orange-100 text-orange-800 border-orange-300',
  'bg-amber-100 text-amber-800 border-amber-300',
  // ... 14 cores adicionais
];

// Hash function para consistência
function getTagColor(tagName: string): string {
  // Sempre retorna a mesma cor para o mesmo nome
}
```

---

### 2. Sistema de Pastas

Organiza configurações em estrutura de diretórios no filesystem.

#### Backend - YAML Handler Extendido
**Arquivo:** `/var/www/html/traefik-manager/includes/yaml-handler.php`

Novas funções:
```php
normalizePath($path)                    // Normaliza e valida path (segurança)
createFolder($folderPath)               // Cria pasta com permissões corretas
listFolders()                           // Lista todas as pastas recursivamente
moveFile($currentPath, $targetFolder)   // Move arquivo entre pastas
deleteFolder($folderPath)               // Remove pasta vazia

// Função modificada:
saveYamlFile($filename, $content, $folder = '')  // Aceita pasta como parâmetro
listYamlFiles()  // Agora usa RecursiveIteratorIterator para subpastas
```

**Segurança:**
```php
function normalizePath($path) {
    // Remove ../ para prevenir path traversal
    // Remove barras duplas
    // Valida que não sai do diretório base
}
```

#### API de Folders
**Arquivo:** `/var/www/html/traefik-manager/api/domains.php`

Novos endpoints:
```javascript
// Criar pasta
POST /api/domains.php
{
  "action": "create-folder",
  "folderPath": "servidores/producao"
}

// Listar pastas
GET /api/domains.php?action=list-folders
Response: {
  "success": true,
  "data": {
    "folders": ["redes", "servidores", "servidores/producao"]
  }
}

// Mover arquivo
POST /api/domains.php
{
  "action": "move",
  "filename": "apache1.yml",
  "targetFolder": "servidores/producao"  // ou "" para raiz
}

// Deletar pasta vazia
POST /api/domains.php
{
  "action": "delete-folder",
  "folderPath": "servidores/old"
}
```

#### Frontend - Componentes de Pastas

**1. FolderListItem** - `/frontend/src/components/folders/folder-list-item.tsx`
- Componente visual de pasta (estilo N8N)
- Mostra ícone de pasta, nome e contagem de arquivos
- Clickável para navegar

**2. FileListItem** - `/frontend/src/components/folders/folder-list-item.tsx`
- Componente visual de arquivo
- Mostra domínio, tipo, IP e tags
- Botão de edição

**3. BreadcrumbNavigation** - `/frontend/src/components/folders/breadcrumb-navigation.tsx`
- Navegação em breadcrumb
- Permite voltar para pastas pai
- Visual limpo e intuitivo

**4. FolderDialog** - `/frontend/src/components/folders/folder-dialog.tsx`
- Dialog para criar novas pastas
- Validação de nomes
- Preview do caminho completo

---

### 3. Sistema de Filtros

Filtros combinados para pesquisa avançada de configurações.

#### Frontend - Componente de Filtros
**Arquivo:** `/frontend/src/components/filters/domain-filters.tsx`

Interface de filtros:
```typescript
export interface FilterState {
  search: string;           // Busca por domínio ou IP
  type: 'all' | 'ssl-termination' | 'passthrough';
  wildcard: 'all' | 'yes' | 'no';
  tags: string[];          // Múltiplas tags (AND logic)
}
```

**Lógica de filtros combinados:**
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
      filters.tags.every(tag => d.tags.includes(tag)));  // AND logic
}, [domains, currentFolder, filters]);
```

**Características:**
- Busca por texto (domínio ou IP)
- Filtro por tipo de configuração
- Filtro por wildcard
- Filtro por múltiplas tags (todas devem estar presentes)
- Filtros se combinam (AND entre todos os filtros)

---

### 4. Dois Modos de Visualização

#### Modo Lista
- Exibe todas as configurações em tabela
- Colunas: Domínio, IP, Tipo, Wildcard, Tags
- Ordenação e filtros
- Ações: Editar, Deletar

#### Modo Pastas
- Visualização hierárquica estilo N8N
- Pastas aparecem primeiro (com contagem de arquivos)
- Arquivos aparecem depois
- Breadcrumb para navegação
- Clickável para entrar em subpastas

**Implementação:**
```typescript
// Dashboard state
const [viewMode, setViewMode] = useState<'list' | 'folders'>('list');

// Cálculo de subpastas disponíveis
const availableSubfolders = useMemo(() => {
  const subfolders = new Map<string, number>();

  domains.forEach(domain => {
    if (!domain.folder) return;

    const parts = domain.folder.split('/');
    const immediateSubfolder = currentFolder
      ? (domain.folder.startsWith(currentFolder + '/')
          ? domain.folder.substring(currentFolder.length + 1).split('/')[0]
          : null)
      : parts[0];

    if (immediateSubfolder) {
      const fullPath = currentFolder
        ? `${currentFolder}/${immediateSubfolder}`
        : immediateSubfolder;
      subfolders.set(fullPath, (subfolders.get(fullPath) || 0) + 1);
    }
  });

  return Array.from(subfolders.entries()).map(([path, count]) => ({
    path,
    name: path.split('/').pop() || path,
    filesCount: count
  }));
}, [domains, currentFolder]);

// Renderização condicional
{viewMode === 'folders' ? (
  <div className="space-y-2">
    {/* Pastas primeiro */}
    {availableSubfolders.map(folder => (
      <FolderListItem key={folder.path} {...folder}
        onClick={() => setCurrentFolder(folder.path)} />
    ))}

    {/* Arquivos depois */}
    {filteredDomains.map(domain => (
      <FileListItem key={domain.filename} {...domain} />
    ))}
  </div>
) : (
  <Table>
    {/* Tabela tradicional */}
  </Table>
)}
```

---

## Fluxo de Dados

### Criar/Editar Configuração

**1. Modo Formulário (Simple)**
```
User Input → Form State → Generate YAML → Save File → Update Tags → Reload
```

**2. Modo YAML (Advanced)**
```
User Input → YAML Editor → Validate → Save File → Update Tags → Reload
```

### Implementação de Save
```typescript
const handleSave = async () => {
  // Gera filename baseado no domínio
  const filenameBase = generateFilename(formState.domain);
  const newBaseFilename = ensureYamlExtension(filenameBase);
  const finalFilename = formState.folder
    ? `${formState.folder}/${newBaseFilename}`
    : newBaseFilename;

  if (activeTab === 'simple') {
    if (editingFilename) {
      // EDITANDO: compara paths completos
      if (editingFilename !== finalFilename) {
        // Domínio ou pasta mudou: create + delete
        await create(...);
        await delete(editingFilename);
      } else {
        // Mesmo arquivo: apenas update
        await update(editingFilename, content);
        await updateFileTags(editingFilename, tags);
      }
    } else {
      // CRIANDO: create normal
      await create(...);
    }
  } else {
    // Modo YAML
    if (editingFilename) {
      await update(editingFilename, yaml);
      await updateFileTags(editingFilename, tags);
    } else {
      await create(...);
    }
  }
};
```

**Importante:** A comparação de paths agora inclui a pasta para evitar o erro "File already exists" ao editar apenas tags ou outros campos sem mudar o domínio.

---

## Tipos TypeScript

**Arquivo:** `/frontend/src/types/domain.ts`

```typescript
export interface DomainSummary {
  filename: string;          // Pode incluir path: "redes/arquivo.yml"
  type: 'ssl-termination' | 'passthrough';
  domain: string;
  ip: string;
  isWildcard: boolean;
  enableHttps: boolean;
  tags: string[];           // NEW
  folder: string;           // NEW - path da pasta (ex: "redes/brasil")
  size: number;
  modified: number;
}

export interface DomainDetails {
  type: 'ssl-termination' | 'passthrough';
  domain: string;
  ip: string;
  isWildcard: boolean;
  enableHttps: boolean;
}

export interface TagInfo {  // NEW
  name: string;
  count: number;           // Quantos arquivos usam essa tag
}
```

---

## Problemas Corrigidos

### 1. Build não encontrado
**Problema:** Vite mudou local do manifest.json para `.vite/manifest.json`
**Solução:** Atualizado `/includes/functions.php` linha 113
```php
$manifestPath = __DIR__ . '/../frontend/dist/.vite/manifest.json';
```

### 2. Folders não apareciam no UI
**Problema:** Apenas tabela era exibida, folders não tinham visualização
**Solução:**
- Criado componentes `FolderListItem` e `FileListItem`
- Implementado cálculo de `availableSubfolders`
- Adicionado modo de visualização folders/list

### 3. Tags não eram salvas ao editar
**Problema:** Tags criadas mas não atribuídas às configs
**Solução:**
- Adicionado `updateFileTags()` após salvar YAML
- Garantido que tags são sempre enviadas no payload

### 4. Tags não selecionavam ao clicar
**Problema:** TagBadge dentro de CommandItem bloqueava evento de click
**Solução:**
- Removido TagBadge do dropdown
- Dropdown usa texto simples para melhor UX
- Badges coloridos mantidos na área de selecionados

### 5. Erro "File already exists" ao editar
**Problema:** Sistema tentava criar novo arquivo ao editar configs em pastas
**Causa:** Comparação de paths incorreta
- `editingFilename`: "redes/arquivo.yml" (com pasta)
- `finalFilename`: "arquivo.yml" (sem pasta)
**Solução:**
- Ajustado `finalFilename` para incluir pasta na comparação
- Lógica agora distingue corretamente update vs create+delete

---

## Deploy

### Script Automatizado
**Arquivo:** `/var/www/html/traefik-manager/deploy.sh`

```bash
#!/bin/bash
cd /var/www/html/traefik-manager/frontend
npm run build
php -r "if(function_exists('opcache_reset')) opcache_reset();"
# Verifica arquivos gerados e mostra tamanhos
```

### Processo Manual
```bash
# 1. Build do frontend
cd /var/www/html/traefik-manager/frontend
npm run build

# 2. Limpar cache PHP
php -r "if(function_exists('opcache_reset')) opcache_reset();"

# 3. Verificar permissões
chown -R www-data:www-data /var/www/traefik_configs/
chmod -R 755 /var/www/traefik_configs/

# 4. Recarregar navegador (Ctrl+Shift+R)
```

---

## Campos Opcionais SSL Termination

### Porta Customizada e Redirecionamento de Caminho

Para configurações SSL Termination, foram adicionados dois campos opcionais:

1. **Porta (Port)** - Padrão: 80
   - Permite especificar porta customizada do servidor web backend
   - Validação: 1-65535
   - Exemplo: 64780 para aplicações em portas não-padrão

2. **Caminho (Path)** - Opcional
   - Redireciona raiz (/) para um caminho específico
   - Útil para aplicações que rodam em subpaths
   - Exemplo: "traefik-manager" → redireciona / para /traefik-manager/

### Comportamento

**Sem Path:**
- Acessa: `https://proxy.teste.techify.run/`
- Redireciona para: Backend na porta especificada

**Com Path:**
- Acessa: `https://proxy.teste.techify.run/`
- Redireciona para: `https://proxy.teste.techify.run/traefik-manager/`
- Middleware: `redirect-root-to-path` usando redirectRegex

### Implementação Backend

**Arquivo:** `/var/www/html/traefik-manager/includes/yaml-handler.php`

```php
function generateSslTerminationYaml($name, $domain, $ip, $isWildcard = false,
                                    $enableHttps = true, $port = 80, $path = '') {
    // Usa porta customizada
    $backendUrl = "http://{$ip}:{$port}";

    // Se path foi especificado, adiciona middleware
    if (!empty($path)) {
        $pathWithSlashes = '/' . trim($path, '/') . '/';
        $yaml['http']['middlewares']['redirect-root-to-path'] = [
            'redirectRegex' => [
                'regex' => '^(https?://[^/]+)/?$',
                'replacement' => '${1}' . $pathWithSlashes,
                'permanent' => false
            ]
        ];

        // Aplica middleware apenas no router HTTPS
        $yaml['http']['routers']["{$name}-https"]['middlewares'] = ['redirect-root-to-path'];
    }
}
```

### API

**Criar domínio com porta e path:**
```json
POST /api/domains.php
{
  "action": "create",
  "filename": "proxy",
  "type": "ssl-termination",
  "domain": "proxy.teste.techify.run",
  "ip": "10.50.50.50",
  "port": 64780,
  "path": "traefik-manager",
  "wildcard": false,
  "enableHttps": true
}
```

### Frontend

**Interface TypeScript:**
```typescript
interface DomainFormState {
  // ... outros campos
  port: number;    // Padrão: 80
  path: string;    // Padrão: ''
}
```

**Campos do formulário:**
- Aparecem apenas quando `type === 'ssl-termination'`
- Porta: Input numérico (1-65535)
- Path: Input texto com hint sobre redirecionamento

---

## Estrutura de Dados

### Arquivo YAML (SSL Termination) - Exemplo Básico
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

### Arquivo YAML (SSL Termination) - Com Porta e Path Customizado
```yaml
http:
  routers:
    proxy-http:
      rule: Host(`proxy.teste.techify.run`)
      service: proxy-service
      entryPoints:
        - web
      middlewares:
        - redirect-to-https

    proxy-https:
      rule: Host(`proxy.teste.techify.run`)
      service: proxy-service
      entryPoints:
        - websecure
      middlewares:
        - redirect-root-to-path
      tls:
        certResolver: letsencrypt

  services:
    proxy-service:
      loadBalancer:
        servers:
          - url: http://10.50.50.50:64780

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

### Arquivo YAML (Passthrough)
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

### Metadata JSON
```json
{
  "files": {
    "apache1.yml": {
      "tags": ["PRODUCAO", "BRASIL"]
    },
    "redes/servidor2.yml": {
      "tags": ["TESTE"]
    }
  },
  "availableTags": ["PRODUCAO", "BRASIL", "TESTE", "TECHIFY"]
}
```

---

## Convenções de Código

### PHP
- PSR-12 coding style
- Funções documentadas com PHPDoc
- Validação de entrada em todos os endpoints
- Logs detalhados de operações
- `normalizePath()` para prevenir path traversal

### TypeScript/React
- Functional components com hooks
- TypeScript strict mode
- useMemo para otimização de cálculos pesados
- useCallback para funções passadas como props
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

## Autenticação

### Métodos Suportados
1. **Session** - Cookie-based (login via formulário)
2. **Bearer Token** - API token no header `Authorization: Bearer TOKEN`

### Implementação
```php
// includes/auth.php
function checkAuth() {
    // Verifica session primeiro
    if (isLoggedInSession()) return;

    // Tenta Bearer token
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';

    if (preg_match('/Bearer\s+(.+)/', $authHeader, $matches)) {
        if (isValidToken($matches[1])) return;
    }

    // Não autenticado
    http_response_code(401);
    jsonResponse(false, 'Unauthorized');
}
```

---

## Próximos Passos Sugeridos

### Features Potenciais
1. **Export/Import**: Backup de configurações em ZIP
2. **Templates**: Configurações pré-definidas
3. **Histórico**: Versionamento de mudanças (Git integration?)
4. **Bulk Actions**: Editar múltiplas configs simultaneamente
5. **Dashboard Analytics**: Gráficos de uso por tag, pasta, etc.
6. **Drag & Drop**: Mover arquivos entre pastas visualmente
7. **Search Global**: Busca no conteúdo YAML completo
8. **Favorites**: Marcar configs favoritas
9. **Comments**: Adicionar comentários nas configs

### Melhorias Técnicas
1. **Testes**: Unit tests (Jest) e E2E (Playwright)
2. **Validação YAML**: Validação mais robusta com feedback específico
3. **Dark Mode**: Tema escuro
4. **Responsivo**: Melhorar mobile
5. **WebSocket**: Updates em tempo real
6. **Docker**: Containerização do projeto
7. **API Docs**: Swagger/OpenAPI
8. **Performance**: Lazy loading, pagination

---

## Debugging

### Logs PHP
```bash
tail -f /var/log/traefik-manager.log
```

### Logs Frontend (Browser)
- Console do navegador: F12
- Network tab para ver requisições
- React DevTools para componentes

### Problemas Comuns

**1. "File already exists"**
- Verifique se está tentando criar arquivo com nome duplicado
- Certifique-se de que a lógica de update está sendo usada corretamente

**2. Tags não aparecem**
- Verifique permissões do arquivo `.metadata.json`
- Confirme que o PHP pode ler/escrever em `/var/www/traefik_configs/`

**3. Build não reflete mudanças**
- Limpe o cache: `rm -rf frontend/dist/` e rebuild
- Force reload: Ctrl+Shift+R
- Limpe OPcache do PHP

**4. Pastas não aparecem**
- Verifique permissões: `ls -la /var/www/traefik_configs/`
- Confirme que API list-folders retorna as pastas
- Verifique console do navegador por erros

---

## Contatos e Recursos

### Documentação Oficial
- **Traefik:** https://doc.traefik.io/traefik/
- **React:** https://react.dev/
- **Vite:** https://vitejs.dev/
- **Radix UI:** https://www.radix-ui.com/
- **Tailwind CSS:** https://tailwindcss.com/

### Estrutura de Suporte
- Logs: `/var/log/traefik-manager.log`
- Config Traefik: `/var/www/traefik_configs/`
- Metadata: `/var/www/traefik_configs/.metadata.json`

---

## Changelog

### v2.1.0 (2025-10-27)
- ✨ **NOVO**: Campos Port e Path para SSL Termination
  - Porta customizada (padrão 80, validação 1-65535)
  - Caminho opcional para redirect automático de / para /path/
  - Middleware `redirect-root-to-path` gerado automaticamente
  - Campos aparecem apenas para tipo SSL Termination
- 📝 Documentação atualizada com exemplos de YAML com porta/path

### v2.0.0 (2025-10-27)
- ✨ Adicionado sistema completo de tags
- ✨ Adicionado organização por pastas
- ✨ Implementado dois modos de visualização (lista/pastas)
- ✨ Adicionado sistema de filtros avançado
- ✨ Tags com 17 cores diferentes (hash-based)
- 🐛 Corrigido erro "File already exists" ao editar
- 🐛 Corrigido seleção de tags por click
- 🐛 Corrigido path do manifest Vite
- 📝 Documentação completa criada
- 🚀 Script de deploy automatizado

### v1.0.0 (Original)
- ⚡ CRUD básico de configurações Traefik
- 🔐 Autenticação por session e Bearer token
- 📝 Editor YAML com validação
- 🎨 Interface moderna com Tailwind

---

**Última atualização:** 27 de Outubro de 2025
**Desenvolvido com assistência do Claude (Anthropic)**
