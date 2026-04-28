# Traefik Manager

Sistema web para gerenciamento de configurações do Traefik via interface gráfica e API REST.

**Tutorial completo no blog da Techify:** [Traefik Manager: economize IPs públicos e gerencie SSL Termination e Passthrough com interface gráfica](https://techify.one/blog/traefik-manager-economize-ips-publicos-e-gerencie-ssl-termination-e-passthrough)

## Características

- Interface web intuitiva para gerenciamento de domínios
- API REST completa com autenticação Bearer Token
- Gerenciamento de configurações YAML do Traefik
- Sistema de logs de auditoria
- Autenticação por sessão para interface web

## Requisitos

- PHP 7.4 ou superior
- Servidor web (Apache/Nginx)
- Node.js 18+ e npm para compilar o frontend React
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

5. **Compile o frontend React para produção:**
```bash
./build-frontend.sh
```

Ou manualmente:
```bash
cd frontend
npm install
npm run build
cd ..
```

> **Nota:** O frontend React é compilado para arquivos estáticos (HTML, CSS, JS) que são servidos diretamente pelo PHP. Você **NÃO precisa** rodar `npm run dev` ou manter o Node.js em execução em produção. Após executar `npm run build`, todos os arquivos necessários estarão na pasta `frontend/dist/` e serão carregados automaticamente pelo `index.php`.

6. Certifique-se de que o diretório de configurações do Traefik tem as permissões corretas:
```bash
chmod 755 /var/www/traefik_configs
```

## Uso

### Interface Web

Acesse via navegador: `http://seu-servidor/traefik-manager`

O frontend é uma SPA criada com React, Vite e shadcn-ui que é **servida como arquivos estáticos** pelo PHP. Basta acessar o endereço acima após realizar o build.

**Importante:** A aplicação está configurada para rodar no subdiretório `/traefik-manager`. Se você instalou em um caminho diferente, será necessário:
1. Ajustar o `BASE_PATH` em [frontend/src/config.ts](frontend/src/config.ts)
2. Ajustar o `BASE_PATH` em [frontend/vite.config.ts](frontend/vite.config.ts)
3. Recompilar o frontend com `./build-frontend.sh`

#### Modo Desenvolvimento (Opcional)

Se você estiver desenvolvendo o frontend, pode executar o servidor de desenvolvimento do Vite:

```bash
cd frontend
npm install
npm run dev
```

O Vite será executado em `http://localhost:5173` com hot-reload. Configure um proxy/reverse proxy para encaminhar as chamadas `/api` para o backend PHP.

**Importante:** Em produção, use apenas o build compilado (`npm run build`). Não é necessário rodar o servidor de desenvolvimento.

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
├── frontend/         # Aplicação React (Vite + shadcn-ui)
├── templates/        # Templates YAML
├── config.php        # Configuração (não versionado)
├── config.example.php # Exemplo de configuração
├── index.php         # Interface principal
└── login.php         # Página de login
```

## Licença

Propriedade da Techify - Uso interno

## Suporte

Para suporte e questões, entre em contato com a equipe de desenvolvimento da Techify.
