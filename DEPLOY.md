# 🚀 Deploy - Traefik Manager

Este documento explica como fazer o deploy das modificações do Traefik Manager.

## 📋 Pré-requisitos

- Node.js e NPM instalados
- PHP com OPcache habilitado (opcional, mas recomendado)
- Acesso SSH ao servidor

---

## 🔄 Deploy Automático (Recomendado)

Use o script de deploy que automatiza todo o processo:

```bash
/var/www/html/traefik-manager/deploy.sh
```

**O que o script faz:**
1. ✅ Entra no diretório do frontend
2. ✅ Executa `npm run build` para compilar o React/Vite
3. ✅ Limpa o cache do PHP (OPcache)
4. ✅ Verifica se os arquivos foram gerados corretamente
5. ✅ Mostra o tamanho dos arquivos JS e CSS

**Tempo estimado:** 3-5 segundos

---

## ⚙️ Deploy Manual (Passo a Passo)

Se preferir fazer manualmente:

### 1. Build do Frontend

```bash
cd /var/www/html/traefik-manager/frontend
npm run build
```

**Saída esperada:**
```
vite v5.4.21 building for production...
✓ 1603 modules transformed.
✓ built in 3.50s
```

### 2. Limpar Cache do PHP

```bash
php -r "opcache_reset();"
```

Ou reinicie o PHP-FPM (se estiver usando):
```bash
# Ubuntu/Debian
sudo systemctl restart php8.1-fpm

# ou PHP 8.2
sudo systemctl restart php8.2-fpm
```

### 3. Verificar Arquivos Gerados

```bash
ls -lh /var/www/html/traefik-manager/frontend/dist/assets/
```

Você deve ver:
- `index-XXXXXX.js` (~358KB)
- `index-XXXXXX.css` (~31KB)

### 4. Verificar Manifest

```bash
cat /var/www/html/traefik-manager/frontend/dist/.vite/manifest.json
```

Deve conter referências aos arquivos JS e CSS.

---

## 🌐 Recarregar no Navegador

Após o deploy, **sempre recarregue a página com cache limpo:**

- **Windows/Linux:** `Ctrl + Shift + R` ou `Ctrl + F5`
- **Mac:** `Cmd + Shift + R`

**URL de acesso:**
```
http://10.8.200.253:64780/traefik-manager/
```

---

## 🔍 Verificação de Deploy

### 1. Verificar se o build está carregando

Abra o console do navegador (F12) e procure por:
- ✅ Sem erros 404 em `index-XXXXXX.js`
- ✅ Sem erros 404 em `index-XXXXXX.css`
- ✅ A aplicação React está rodando

### 2. Verificar versão do manifest

```bash
cat /var/www/html/traefik-manager/frontend/dist/.vite/manifest.json
```

O hash no nome do arquivo deve ser diferente após cada build.

### 3. Testar funcionalidades

- ✅ Login funciona
- ✅ Lista de domínios carrega
- ✅ Visualização de pastas funciona
- ✅ Tags coloridas aparecem
- ✅ Filtros funcionam

---

## 🐛 Solução de Problemas

### Problema: "Build não encontrado"

**Causa:** O PHP não está encontrando o manifest do Vite.

**Solução:**
```bash
# Verificar se o manifest existe
ls -la /var/www/html/traefik-manager/frontend/dist/.vite/manifest.json

# Se não existir, rodar o build novamente
cd /var/www/html/traefik-manager/frontend
npm run build
```

### Problema: Mudanças não aparecem no navegador

**Causa:** Cache do navegador.

**Solução:**
1. Limpar cache do navegador (Ctrl+Shift+R)
2. Abrir em aba anônima/privada
3. Limpar cache do PHP: `php -r "opcache_reset();"`

### Problema: CSS não está aplicado

**Causa:** Arquivo CSS não foi gerado ou não foi referenciado.

**Solução:**
```bash
# Limpar node_modules e reinstalar
cd /var/www/html/traefik-manager/frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Problema: Erro "npm command not found"

**Causa:** Node.js não está instalado ou não está no PATH.

**Solução:**
```bash
# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalação
node --version
npm --version
```

---

## 📦 Estrutura de Arquivos Após Build

```
/var/www/html/traefik-manager/
├── frontend/
│   └── dist/
│       ├── .vite/
│       │   └── manifest.json          ← Mapa de arquivos (importante!)
│       ├── assets/
│       │   ├── index-XXXXXX.js        ← JavaScript compilado
│       │   └── index-XXXXXX.css       ← CSS compilado
│       └── index.html                 ← HTML gerado
├── api/                               ← APIs PHP
├── includes/                          ← Funções PHP
└── index.php                          ← Entrada principal
```

---

## ⚡ Dicas de Performance

### 1. Habilitar OPcache no PHP

Edite `/etc/php/8.1/fpm/php.ini`:
```ini
opcache.enable=1
opcache.memory_consumption=128
opcache.max_accelerated_files=10000
opcache.revalidate_freq=2
```

### 2. Habilitar Gzip no Nginx/Apache

**Nginx** (`/etc/nginx/nginx.conf`):
```nginx
gzip on;
gzip_types text/css application/javascript application/json;
gzip_min_length 1024;
```

**Apache** (`.htaccess`):
```apache
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/css application/javascript
</IfModule>
```

### 3. Configurar Cache de Assets

**Nginx:**
```nginx
location ~* \.(js|css)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

**Apache:**
```apache
<FilesMatch "\.(js|css)$">
    Header set Cache-Control "max-age=31536000, public, immutable"
</FilesMatch>
```

---

## 🔐 Permissões

Certifique-se que os arquivos têm as permissões corretas:

```bash
# Definir proprietário
sudo chown -R www-data:www-data /var/www/html/traefik-manager/frontend/dist

# Definir permissões
sudo chmod -R 755 /var/www/html/traefik-manager/frontend/dist
```

---

## 📅 Quando Fazer Deploy?

Faça deploy sempre que:
- ✅ Modificar código TypeScript/React (`frontend/src/**`)
- ✅ Modificar estilos CSS
- ✅ Adicionar/remover dependências NPM
- ✅ Atualizar componentes UI

**NÃO precisa** fazer deploy quando:
- ❌ Modificar apenas código PHP backend
- ❌ Modificar arquivos de configuração PHP
- ❌ Modificar arquivos YAML do Traefik

---

## 🎯 Checklist de Deploy

Antes de fazer deploy em produção:

- [ ] Testar localmente
- [ ] Fazer backup do diretório `frontend/dist` atual
- [ ] Executar `npm run build`
- [ ] Verificar se não há erros no build
- [ ] Limpar cache do PHP
- [ ] Testar no navegador (cache limpo)
- [ ] Verificar funcionalidades críticas
- [ ] Monitorar logs de erro

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs do PHP: `/var/log/php-fpm/error.log`
2. Verifique o console do navegador (F12)
3. Execute o deploy manual passo a passo
4. Verifique as permissões dos arquivos

---

**Última atualização:** 27/10/2024
**Versão:** 1.0.0
