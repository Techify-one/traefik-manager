# Changelog - Path Prefix com Destino Vazio

## Mudanças Implementadas

### 1. Frontend - dashboard-page.tsx (Linha 310-311)

**Antes:**
```typescript
const normalizedPathPrefixTarget = normalizedPath || normalizePathSegment(formState.pathPrefix);
```

**Depois:**
```typescript
// pathPrefixTarget pode ser vazio para ir para raiz (/) do backend
const normalizedPathPrefixTarget = normalizePathSegment(formState.path);
```

**Motivo:** Remover o fallback incorreto que usava `pathPrefix` quando `path` estava vazio. Agora, se o usuário não preencher o campo "Caminho de Destino", o `pathPrefixTarget` será vazio e o sistema enviará requisições para a raiz (`/`) do backend.

### 2. Templates - Middleware de Ensure Slash

**Templates atualizados:**
- `templates/ssl-termination-https-with-prefix.yml`
- `templates/ssl-termination-https-with-both.yml`

**Adicionado middleware:**
```yaml
# garante /{{PATH_PREFIX}}/ (com barra final) quando acessarem /{{PATH_PREFIX}}
{{NAME}}/ensure-{{PATH_PREFIX_SLUG}}-slash:
  redirectRegex:
    regex: '^(https?://[^/]+/{{PATH_PREFIX_REGEX}})$'
    replacement: '${1}/'
    permanent: true
```

**Motivo:** Garantir que acessos a `/teste123` sejam redirecionados para `/teste123/` antes de aplicar o replacePathRegex.

## Comportamento Atual

### Exemplo: Path Prefix sem Caminho de Destino

**Configuração:**
- URL base: `https://apache10.teste.techify.run`
- Path Prefix: `/teste123`
- Caminho de Destino: (vazio)
- Backend: `http://10.8.200.253:64780`

**URLs e Comportamento:**

| URL Acessada | Ação | Backend Recebe |
|--------------|------|----------------|
| `https://apache10.teste.techify.run/teste123` | Redirect 301 → `/teste123/` | - |
| `https://apache10.teste.techify.run/teste123/` | Proxy | `http://10.8.200.253:64780/` |
| `https://apache10.teste.techify.run/teste123/api` | Proxy | `http://10.8.200.253:64780/api` |
| `https://apache10.teste.techify.run/teste123/app/index.html` | Proxy | `http://10.8.200.253:64780/app/index.html` |

### Exemplo: Path Prefix com Caminho de Destino

**Configuração:**
- URL base: `https://app.teste.techify.run`
- Path Prefix: `/api`
- Caminho de Destino: `v1/api`
- Backend: `http://10.8.100.100:80`

**URLs e Comportamento:**

| URL Acessada | Ação | Backend Recebe |
|--------------|------|----------------|
| `https://app.teste.techify.run/api` | Redirect 301 → `/api/` | - |
| `https://app.teste.techify.run/api/` | Proxy | `http://10.8.100.100/v1/api/` |
| `https://app.teste.techify.run/api/users` | Proxy | `http://10.8.100.100/v1/api/users` |

## YAML Gerado (Exemplo Completo)

```yaml
# Generated using template: ssl-termination-https-with-prefix.yml
http:
  routers:
    apache10.teste.techify.run-http:
      rule: Host(`apache10.teste.techify.run`)
      service: apache10.teste.techify.run-service
      entryPoints: [web]
      middlewares: [redirect-to-https]
    apache10.teste.techify.run-https-teste123:
      rule: Host(`apache10.teste.techify.run`) && PathPrefix(`/teste123`)
      service: apache10.teste.techify.run-service
      entryPoints: [websecure]
      middlewares:
        - apache10.teste.techify.run/ensure-teste123-slash
        - apache10.teste.techify.run/rx-teste123
      priority: 1000
      tls:
        certResolver: letsencrypt
  services:
    apache10.teste.techify.run-service:
      loadBalancer:
        servers:
          - url: http://10.8.200.253:64780
  middlewares:
    redirect-to-https:
      redirectScheme:
        scheme: https
        permanent: true
    # garante /teste123/ (com barra final) quando acessarem /teste123
    apache10.teste.techify.run/ensure-teste123-slash:
      redirectRegex:
        regex: '^(https?://[^/]+/teste123)$'
        replacement: '${1}/'
        permanent: true
    apache10.teste.techify.run/rx-teste123:
      replacePathRegex:
        regex: '^/teste123(?:/(.*))?$'
        replacement: /${1}
```

## Ordem de Execução dos Middlewares

1. **redirect-to-https** - Redireciona HTTP para HTTPS (apenas no router HTTP)
2. **ensure-{{PATH_PREFIX_SLUG}}-slash** - Garante barra final no path prefix
3. **rx-{{PATH_PREFIX_SLUG}}** - Reescreve o path para o backend

## Testes

Execute o script de teste:
```bash
php /var/www/html/traefik-manager/test-prefix-empty-target.php
```

## Compatibilidade

✅ Retrocompatível com configurações existentes
✅ Backend já suporta `pathPrefixTarget` vazio
✅ Templates antigos continuam funcionando
✅ Novos middlewares não afetam configurações sem path prefix

---

**Data:** 2025-10-29
**Versão:** 2.2.0
