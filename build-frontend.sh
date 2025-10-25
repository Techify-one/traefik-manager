#!/bin/bash

# Script para compilar o frontend React para produção
# Uso: ./build-frontend.sh

set -e

echo "🔨 Compilando frontend React para produção..."
echo ""

cd "$(dirname "$0")/frontend"

echo "📦 Instalando dependências..."
npm install

echo ""
echo "🏗️  Gerando bundle de produção..."
npm run build

echo ""
echo "📋 Copiando manifest..."
cp dist/.vite/manifest.json dist/manifest.json

echo ""
echo "✅ Build concluído com sucesso!"
echo ""
echo "Os arquivos estáticos estão disponíveis em: frontend/dist/"
echo "O PHP irá carregá-los automaticamente ao acessar index.php"
echo ""
echo "Você pode acessar a aplicação em: http://seu-servidor/traefik-manager"
