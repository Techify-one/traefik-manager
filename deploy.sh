#!/bin/bash

# Deploy script for Traefik Manager
# This script builds the frontend and clears PHP cache

set -e  # Exit on error

echo "=========================================="
echo "  Traefik Manager - Deploy Script"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Change to frontend directory
echo -e "${BLUE}[1/4]${NC} Entrando no diretório frontend..."
cd /var/www/html/traefik-manager/frontend

# Build frontend
echo -e "${BLUE}[2/4]${NC} Fazendo build do frontend (Vite + React)..."
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Build concluído com sucesso!"
else
    echo -e "${RED}✗${NC} Erro no build do frontend!"
    exit 1
fi

# Clear PHP OPcache
echo -e "${BLUE}[3/4]${NC} Limpando cache do PHP (OPcache)..."
php -r "if (function_exists('opcache_reset')) { opcache_reset(); echo 'OPcache limpo com sucesso\n'; } else { echo 'OPcache não está habilitado\n'; }"

# Verify build files
echo -e "${BLUE}[4/4]${NC} Verificando arquivos gerados..."
if [ -f "/var/www/html/traefik-manager/frontend/dist/.vite/manifest.json" ]; then
    echo -e "${GREEN}✓${NC} Manifest encontrado!"

    # Show build info
    JS_FILE=$(ls -1 /var/www/html/traefik-manager/frontend/dist/assets/*.js 2>/dev/null | head -1)
    CSS_FILE=$(ls -1 /var/www/html/traefik-manager/frontend/dist/assets/*.css 2>/dev/null | head -1)

    if [ -f "$JS_FILE" ]; then
        JS_SIZE=$(ls -lh "$JS_FILE" | awk '{print $5}')
        echo -e "  JavaScript: ${JS_SIZE}"
    fi

    if [ -f "$CSS_FILE" ]; then
        CSS_SIZE=$(ls -lh "$CSS_FILE" | awk '{print $5}')
        echo -e "  CSS: ${CSS_SIZE}"
    fi
else
    echo -e "${RED}✗${NC} Manifest não encontrado!"
    exit 1
fi

echo ""
echo -e "${GREEN}=========================================="
echo -e "  Deploy concluído com sucesso! ✓"
echo -e "==========================================${NC}"
echo ""
echo "Recarregue a página no navegador (Ctrl+F5 ou Cmd+Shift+R)"
echo "URL: http://10.8.200.253:64780/traefik-manager/"
echo ""
