<?php
/**
 * Template Engine
 * Renderiza templates YAML com substituição de placeholders
 */

/**
 * Renderiza um template YAML com os dados fornecidos
 *
 * @param string $templateName Nome do template (sem extensão .yml)
 * @param array $data Array associativo com os dados para substituição
 * @return string|false Conteúdo renderizado ou false em caso de erro
 */
function renderTemplate($templateName, $data) {
    $templatePath = __DIR__ . '/../templates/' . $templateName . '.yml';

    if (!file_exists($templatePath)) {
        error_log("Template não encontrado: {$templatePath}");
        return false;
    }

    $template = file_get_contents($templatePath);

    if ($template === false) {
        error_log("Erro ao ler template: {$templatePath}");
        return false;
    }

    // Substituir placeholders
    foreach ($data as $key => $value) {
        $placeholder = '{{' . $key . '}}';
        $template = str_replace($placeholder, $value, $template);
    }

    // Verificar se ainda existem placeholders não substituídos
    if (preg_match('/\{\{[A-Z_]+\}\}/', $template, $matches)) {
        error_log("Placeholders não substituídos encontrados: " . implode(', ', $matches));
        // Não retorna false aqui, pois alguns placeholders podem ser opcionais
    }

    return $template;
}

/**
 * Lista todos os templates disponíveis
 *
 * @return array Lista de nomes de templates (sem extensão)
 */
function listTemplates() {
    $templatesDir = __DIR__ . '/../templates/';
    $templates = [];

    if (!is_dir($templatesDir)) {
        return $templates;
    }

    $files = scandir($templatesDir);

    foreach ($files as $file) {
        if (substr($file, -4) === '.yml') {
            $templates[] = substr($file, 0, -4);
        }
    }

    return $templates;
}

/**
 * Valida se um template existe
 *
 * @param string $templateName Nome do template (sem extensão .yml)
 * @return bool True se o template existe, false caso contrário
 */
function templateExists($templateName) {
    $templatePath = __DIR__ . '/../templates/' . $templateName . '.yml';
    return file_exists($templatePath);
}

/**
 * Cria a regra do Traefik baseado no domínio e wildcard
 *
 * @param string $domain Domínio
 * @param bool $isWildcard Se é wildcard
 * @return string Regra formatada para o Traefik
 */
function createTraefikRule($domain, $isWildcard = false) {
    if ($isWildcard) {
        return "HostRegexp(\"^.*{$domain}$\")";
    }
    return "Host(\"{$domain}\")";
}

/**
 * Cria a regra TCP do Traefik baseado no domínio e wildcard
 *
 * @param string $domain Domínio
 * @param bool $isWildcard Se é wildcard
 * @return string Regra TCP formatada para o Traefik
 */
function createTraefikTcpRule($domain, $isWildcard = false) {
    if ($isWildcard) {
        return "HostSNIRegexp(\"^.*{$domain}$\")";
    }
    return "HostSNI(\"{$domain}\")";
}

/**
 * Cria o replacement para path redirect
 *
 * @param string $targetPath Path de destino
 * @return string Replacement formatado
 */
function createPathReplacement($targetPath) {
    $target = trim($targetPath, '/');
    if ($target === '') {
        return '/${1}';
    }
    return '/' . $target . '/${1}';
}

/**
 * Sanitiza path prefix para uso em regex
 *
 * @param string $pathPrefix Path prefix
 * @return string Path prefix escapado para regex
 */
function sanitizePathPrefixForRegex($pathPrefix) {
    return preg_quote($pathPrefix, '/');
}

/**
 * Cria slug a partir de path prefix
 *
 * @param string $pathPrefix Path prefix
 * @return string Slug formatado
 */
function createPathPrefixSlug($pathPrefix) {
    $slug = preg_replace('/[^A-Za-z0-9\-]+/', '-', $pathPrefix);
    $slug = trim($slug, '-');
    if ($slug === '') {
        $slug = 'path';
    }
    return $slug;
}
