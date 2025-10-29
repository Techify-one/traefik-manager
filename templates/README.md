# Templates YAML para Traefik Manager

Este diretório contém templates YAML que são usados para gerar configurações do Traefik de forma dinâmica.

## Estrutura

### SSL Termination

- **ssl-termination-https.yml** - HTTPS básico com redirect HTTP→HTTPS
- **ssl-termination-http-only.yml** - Apenas HTTP (sem SSL)
- **ssl-termination-https-with-path.yml** - HTTPS com redirect de path raiz
- **ssl-termination-http-only-with-path.yml** - HTTP com redirect de path raiz
- **ssl-termination-https-with-prefix.yml** - HTTPS com path prefix específico
- **ssl-termination-https-with-both.yml** - HTTPS com path raiz E path prefix

### SSL Passthrough

- **passthrough-https.yml** - Passthrough HTTPS (end-to-end encryption)
- **passthrough-http-only.yml** - Apenas HTTP para backend

## Placeholders Disponíveis

Cada template pode usar os seguintes placeholders que serão substituídos automaticamente:

### Básicos
- `{{NAME}}` - Nome da configuração (ex: "apache1")
- `{{DOMAIN}}` - Domínio completo (ex: "apache1.teste.techify.run")
- `{{IP}}` - Endereço IP do backend
- `{{PORT}}` - Porta do backend (padrão: 80)

### Regras Traefik
- `{{RULE}}` - Regra HTTP (ex: "Host(`domain.com`)" ou "HostRegexp(`^.*domain.com$`)")
- `{{TCP_RULE}}` - Regra TCP/SNI (ex: "HostSNI(`domain.com`)")

### Path Redirect
- `{{PATH_REPLACEMENT}}` - Replacement para redirect de path raiz

### Path Prefix
- `{{PATH_PREFIX}}` - Path prefix (ex: "api")
- `{{PATH_PREFIX_SLUG}}` - Slug do path prefix (ex: "api")
- `{{PATH_PREFIX_REGEX}}` - Path prefix escapado para regex
- `{{PATH_PREFIX_REPLACEMENT}}` - Replacement para o path prefix

## Como Adicionar um Novo Template

1. Crie um arquivo `.yml` neste diretório
2. Use os placeholders listados acima
3. O template será automaticamente disponibilizado para uso

### Exemplo de Template Customizado

```yaml
http:
  routers:
    {{NAME}}-custom:
      rule: {{RULE}}
      service: {{NAME}}-service
      entryPoints: [web]
  services:
    {{NAME}}-service:
      loadBalancer:
        servers:
          - url: http://{{IP}}:{{PORT}}
```

## Uso Programático

```php
// Renderizar um template
$yaml = renderTemplate('ssl-termination-https', [
    'NAME' => 'apache1',
    'DOMAIN' => 'apache1.teste.techify.run',
    'IP' => '10.8.100.101',
    'PORT' => 80,
    'RULE' => createTraefikRule('apache1.teste.techify.run', false)
]);

// Listar templates disponíveis
$templates = listTemplates();

// Verificar se template existe
if (templateExists('ssl-termination-https')) {
    // Template existe
}
```

## Funções Helper

As seguintes funções estão disponíveis em `includes/template-engine.php`:

- `renderTemplate($templateName, $data)` - Renderiza um template com dados
- `listTemplates()` - Lista todos os templates disponíveis
- `templateExists($templateName)` - Verifica se um template existe
- `createTraefikRule($domain, $isWildcard)` - Cria regra HTTP
- `createTraefikTcpRule($domain, $isWildcard)` - Cria regra TCP
- `createPathReplacement($targetPath)` - Cria replacement para path
- `sanitizePathPrefixForRegex($pathPrefix)` - Escapa path para regex
- `createPathPrefixSlug($pathPrefix)` - Cria slug de path prefix

## Testes

Execute o script de teste para validar todos os templates:

```bash
php /var/www/html/traefik-manager/test-templates.php
```

Para visualizar um template específico:

```bash
php /var/www/html/traefik-manager/test-single-template.php
```

## Vantagens do Sistema de Templates

✅ **Separação de Responsabilidades** - Lógica separada da estrutura
✅ **Fácil Manutenção** - Editar templates sem alterar código PHP
✅ **Extensibilidade** - Adicionar novos tipos facilmente
✅ **Testabilidade** - Templates podem ser testados isoladamente
✅ **Legibilidade** - YAML puro é mais fácil de entender

## Migração do Sistema Antigo

O sistema antigo usava arrays PHP e `yaml_emit()`. O novo sistema:

1. Carrega templates YAML pré-formatados
2. Substitui placeholders com valores reais
3. Retorna YAML pronto para uso

**Vantagens:**
- Código PHP reduzido de ~600 linhas para ~100 linhas
- Templates visuais e editáveis
- Mais fácil adicionar variações

---

**Última Atualização:** 2025-10-29
**Versão:** 2.1.0
