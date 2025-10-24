# Traefik Manager

Sistema web para gerenciamento de configurações do Traefik via interface gráfica e API REST.

## Características

- Interface web intuitiva para gerenciamento de domínios
- API REST completa com autenticação Bearer Token
- Gerenciamento de configurações YAML do Traefik
- Sistema de logs de auditoria
- Autenticação por sessão para interface web

## Requisitos

- PHP 7.4 ou superior
- Servidor web (Apache/Nginx)
- Acesso de escrita ao diretório de configurações do Traefik
- Biblioteca YAML do PHP (php-yaml)

## Instalação

1. Clone o repositório:
```bash
git clone <repository-url>
cd traefik-manager
```

2. Configure as permissões:
```bash
chmod 755 /var/www/html/traefik-manager
mkdir -p logs
chmod 755 logs
```

3. Copie e configure o arquivo de configuração:
```bash
cp config.example.php config.php
nano config.php
```

4. Edite o `config.php` e configure:
   - `ADMIN_USER`: Usuário de login
   - `ADMIN_PASS`: Senha do administrador
   - `API_BEARER_TOKEN`: Token para acesso à API (gere um seguro)
   - `TRAEFIK_CONFIGS_PATH`: Caminho para os arquivos de configuração do Traefik

5. Certifique-se de que o diretório de configurações do Traefik tem as permissões corretas:
```bash
chmod 755 /var/www/traefik_configs
```

## Uso

### Interface Web

Acesse via navegador: `http://seu-servidor/traefik-manager`

O frontend é uma SPA React compilada e publicada em `frontend/dist`. Basta garantir que este diretório esteja disponível junto aos arquivos PHP — não é necessário instalar Node.js no servidor. A aplicação carrega React, React Router e shadcn-ui por meio de módulos ESM servidos via CDN.

> ⚠️ Caso deseje personalizar o frontend, instale Node.js localmente, adapte os módulos ESM conforme necessário e recompile os arquivos em `frontend/dist` antes do deploy.

> ℹ️ O frontend consome módulos a partir de `https://esm.sh` e estilos do `https://cdn.jsdelivr.net`. Garanta que o servidor tenha acesso de saída a esses domínios ou hospede os arquivos localmente caso deseje operar em ambiente isolado.

### API REST

A API está disponível em: `http://seu-servidor/traefik-manager/api/`

Documentação completa da API disponível na interface em **API Docs** ou diretamente via [API-DOCUMENTATION.md](API-DOCUMENTATION.md).

Exemplo de uso:
```bash
curl -X GET "http://seu-servidor/traefik-manager/api/domains.php" \
  -H "Authorization: Bearer seu-token-aqui"
```

## Segurança

- O arquivo `config.php` contém credenciais sensíveis e **NÃO** deve ser commitado ao Git
- Use sempre HTTPS em produção
- Altere as credenciais padrão imediatamente após a instalação
- Gere um Bearer Token forte e único

## Estrutura do Projeto

```
traefik-manager/
├── api/              # Endpoints da API REST
├── includes/         # Arquivos auxiliares (auth, logger, etc)
├── logs/             # Logs de auditoria
├── frontend/dist/    # Bundle React compilado (ESM + shadcn-ui)
├── config.php        # Configuração (não versionado)
├── config.example.php # Exemplo de configuração
├── index.php         # Interface principal
├── login.php         # Página de login
└── logout.php        # Encerramento de sessão (limpa cookies)
```

## Licença

Propriedade da Techify - Uso interno

## Suporte

Para suporte e questões, entre em contato com a equipe de desenvolvimento da Techify.
