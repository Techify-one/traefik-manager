<?php
/**
 * YAML Handler
 * Parse, validate and generate YAML files for Traefik
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/metadata-handler.php';
require_once __DIR__ . '/functions.php';
require_once __DIR__ . '/template-engine.php';

/**
 * Parse YAML file
 */
function parseYamlFile($filename) {
    $filepath = TRAEFIK_CONFIGS_PATH . '/' . $filename;

    if (!file_exists($filepath)) {
        return false;
    }

    try {
        return yaml_parse_file($filepath);
    } catch (Exception $e) {
        return false;
    }
}

/**
 * Validate YAML content
 */
function validateYaml($content) {
    try {
        $parsed = yaml_parse($content);
        return $parsed !== false;
    } catch (Exception $e) {
        return false;
    }
}

require_once __DIR__ . '/functions.php';

/**
 * Generate SSL Termination YAML usando templates
 */
function generateSslTerminationYaml($name, $domain, $ip, $isWildcard = false, $enableHttps = true, $port = 80, $path = '', $pathPrefix = '', $pathPrefixTarget = '') {
    // Normalizar valores
    $normalizedRootTarget = trim($path, '/');
    $normalizedPrefix = sanitizePathPrefix($pathPrefix);
    if ($normalizedPrefix === false) {
        $normalizedPrefix = '';
    }
    $normalizedPrefixTarget = trim($pathPrefixTarget, '/');

    // Dados base para todos os templates
    $data = [
        'NAME' => $name,
        'DOMAIN' => $domain,
        'IP' => $ip,
        'PORT' => $port,
        'RULE' => createTraefikRule($domain, $isWildcard)
    ];

    // Determinar qual template usar baseado nas opções
    $templateName = 'ssl-termination-';

    if (!$enableHttps) {
        // HTTP Only
        if ($normalizedRootTarget !== '' && $normalizedPrefix === '') {
            $templateName .= 'http-only-with-path';
            $data['PATH_REPLACEMENT'] = createPathReplacement($normalizedRootTarget);
        } else {
            $templateName .= 'http-only';
        }
    } else {
        // HTTPS Enabled
        $hasRootPath = $normalizedRootTarget !== '' && $normalizedPrefix === '';
        $hasPrefix = $normalizedPrefix !== '';

        if ($hasRootPath && $hasPrefix) {
            $templateName .= 'https-with-both';
            $data['PATH_REPLACEMENT'] = createPathReplacement($normalizedRootTarget);
            $data['PATH_PREFIX'] = $normalizedPrefix;
            $data['PATH_PREFIX_SLUG'] = createPathPrefixSlug($normalizedPrefix);
            $data['PATH_PREFIX_REGEX'] = sanitizePathPrefixForRegex($normalizedPrefix);
            $data['PATH_PREFIX_REPLACEMENT'] = createPathReplacement($normalizedPrefixTarget);
        } elseif ($hasRootPath) {
            $templateName .= 'https-with-path';
            $data['PATH_REPLACEMENT'] = createPathReplacement($normalizedRootTarget);
        } elseif ($hasPrefix) {
            $templateName .= 'https-with-prefix';
            $data['PATH_PREFIX'] = $normalizedPrefix;
            $data['PATH_PREFIX_SLUG'] = createPathPrefixSlug($normalizedPrefix);
            $data['PATH_PREFIX_REGEX'] = sanitizePathPrefixForRegex($normalizedPrefix);
            $data['PATH_PREFIX_REPLACEMENT'] = createPathReplacement($normalizedPrefixTarget);
        } else {
            $templateName .= 'https';
        }
    }

    // Renderizar template
    $yamlContent = renderTemplate($templateName, $data);

    if ($yamlContent === false) {
        error_log("Falha ao renderizar template: {$templateName}");
        return false;
    }

    // Adicionar comentário indicando o template usado
    $comment = "# Generated using template: {$templateName}.yml\n";
    $yamlContent = $comment . $yamlContent;

    return $yamlContent;
}

/**
 * Generate Passthrough YAML usando templates
 */
function generatePassthroughYaml($name, $domain, $ip, $isWildcard = false, $enableHttps = true) {
    // Dados para o template
    $data = [
        'NAME' => $name,
        'DOMAIN' => $domain,
        'IP' => $ip,
        'RULE' => createTraefikRule($domain, $isWildcard),
        'TCP_RULE' => createTraefikTcpRule($domain, $isWildcard)
    ];

    // Determinar qual template usar
    $templateName = $enableHttps ? 'passthrough-https' : 'passthrough-http-only';

    // Renderizar template
    $yamlContent = renderTemplate($templateName, $data);

    if ($yamlContent === false) {
        error_log("Falha ao renderizar template: {$templateName}");
        return false;
    }

    // Adicionar comentário indicando o template usado
    $comment = "# Generated using template: {$templateName}.yml\n";
    $yamlContent = $comment . $yamlContent;

    return $yamlContent;
}

/**
 * Extract domain info from YAML content
 */
function extractDomainInfo($yamlContent) {
    $data = yaml_parse($yamlContent);

    if (!$data) {
        return null;
    }

    $info = [
        'type' => 'unknown',
        'domain' => '',
        'ip' => '',
        'isWildcard' => false,
        'enableHttps' => true,
        'port' => 80,
        'path' => '',
        'pathPrefix' => '',
        'pathPrefixTarget' => ''
    ];

    // Check if it's passthrough (has TCP section)
    if (isset($data['tcp']['routers'])) {
        $info['type'] = 'passthrough';
        $info['enableHttps'] = true; // Passthrough always has HTTPS
        $firstRouter = reset($data['tcp']['routers']);
        $rule = $firstRouter['rule'] ?? '';

        // Extract domain from rule
        if (preg_match('/HostSNI(?:Regexp)?\(`([^`]+)`\)/', $rule, $matches)) {
            $domain = $matches[1];
            $info['isWildcard'] = strpos($rule, 'HostSNIRegexp') !== false;
            $info['domain'] = str_replace(['^', '.*', '$'], '', $domain);
        }

        // Extract IP
        $service = reset($data['tcp']['services']);
        $address = $service['loadBalancer']['servers'][0]['address'] ?? '';
        $info['ip'] = preg_replace('/:443$/', '', $address);

    } elseif (isset($data['http']['routers'])) {
        $info['type'] = 'ssl-termination';

        // Check if HTTPS is enabled by looking for websecure routers
        $hasHttpsRouter = false;
        foreach ($data['http']['routers'] as $routerName => $router) {
            if (isset($router['rule']) && strpos($router['rule'], 'PathPrefix(') !== false && $info['pathPrefix'] === '') {
                if (preg_match('/PathPrefix\(`\/([^`]+)`\)/', $router['rule'], $matches)) {
                    $info['pathPrefix'] = trim($matches[1], '/');
                }
            }

            if (isset($router['entryPoints']) && in_array('websecure', $router['entryPoints'])) {
                $hasHttpsRouter = true;
            }
        }
        $info['enableHttps'] = $hasHttpsRouter;

        $firstRouter = reset($data['http']['routers']);
        $rule = $firstRouter['rule'] ?? '';

        // Extract domain from rule
        if (preg_match('/Host(?:Regexp)?\(`([^`]+)`\)/', $rule, $matches)) {
            $domain = $matches[1];
            $info['isWildcard'] = strpos($rule, 'HostRegexp') !== false;
            $info['domain'] = str_replace(['^', '.*', '$'], '', $domain);
        }

        // Extract IP and Port
        $service = reset($data['http']['services']);
        $url = $service['loadBalancer']['servers'][0]['url'] ?? '';
        if (preg_match('/http:\/\/([^:]+):(\d+)/', $url, $matches)) {
            $info['ip'] = $matches[1];
            $info['port'] = (int)$matches[2];
        } elseif (preg_match('/http:\/\/([^:\/]+)/', $url, $matches)) {
            // If no port specified, assume default 80
            $info['ip'] = $matches[1];
            $info['port'] = 80;
        }

        $extractReplacementTarget = static function ($replacement) {
            if (!is_string($replacement) || $replacement === '') {
                return '';
            }
            $clean = str_replace('${1}', '', $replacement);
            $clean = rtrim($clean, '/');
            $clean = ltrim($clean, '/');
            return $clean;
        };

        if (isset($data['http']['middlewares'])) {
            foreach ($data['http']['middlewares'] as $middlewareName => $middleware) {
                // Legacy format: addPrefix
                if (isset($middleware['addPrefix']['prefix'])) {
                    $info['path'] = trim($middleware['addPrefix']['prefix'], '/');
                    continue;
                }

                // Legacy format: redirectRegex
                if ($middlewareName === 'redirect-root-to-path' && isset($middleware['redirectRegex']['replacement'])) {
                    $replacement = $middleware['redirectRegex']['replacement'];
                    if (preg_match('/\$\{1\}\/(.+?)\/$/', $replacement, $matches)) {
                        $info['path'] = $matches[1];
                    }
                    continue;
                }

                // New format: replacePathRegex (root or prefix)
                if (isset($middleware['replacePathRegex'])) {
                    $regex = $middleware['replacePathRegex']['regex'] ?? '';
                    $replacement = $middleware['replacePathRegex']['replacement'] ?? '';

                    if ($regex === '^(?:/(.*))?$') {
                        $info['path'] = $extractReplacementTarget($replacement);
                        continue;
                    }

                    if (preg_match('/^\^\/([^\\(]+)(?:\(\?:|$)/', $regex, $matches)) {
                        $prefixCandidate = trim($matches[1], '/');
                        if ($prefixCandidate !== '') {
                            if ($info['pathPrefix'] === '') {
                                $info['pathPrefix'] = $prefixCandidate;
                            }
                            $info['pathPrefixTarget'] = $extractReplacementTarget($replacement);
                        }
                    }
                }
            }
        }

        if ($info['path'] === '' && $info['pathPrefixTarget'] !== '') {
            $info['path'] = $info['pathPrefixTarget'];
        }
    }

    return $info;
}

/**
 * Normalize path for security (prevent path traversal)
 */
function normalizePath($path) {
    // Remove leading/trailing slashes
    $path = trim($path, '/');

    // Check for path traversal attempts
    if (strpos($path, '..') !== false) {
        return false;
    }

    return $path;
}

/**
 * Save YAML file (with folder support)
 */
function saveYamlFile($filename, $content, $folder = '') {
    // Normalize folder path
    if (!empty($folder)) {
        $folder = normalizePath($folder);
        if ($folder === false) {
            return false;
        }
    }

    // Validate filename (no path traversal in filename itself)
    if (strpos($filename, '..') !== false || strpos($filename, '/') !== false) {
        return false;
    }

    // Ensure .yml extension
    if (substr($filename, -4) !== YAML_EXT) {
        $filename .= YAML_EXT;
    }

    // Build full path
    $relativePath = empty($folder) ? $filename : $folder . '/' . $filename;
    $filepath = TRAEFIK_CONFIGS_PATH . '/' . $relativePath;

    // Create folder if it doesn't exist
    if (!empty($folder)) {
        $folderPath = TRAEFIK_CONFIGS_PATH . '/' . $folder;
        if (!is_dir($folderPath)) {
            if (!mkdir($folderPath, 0755, true)) {
                return false;
            }
            // Set ownership to www-data
            chown($folderPath, 'www-data');
            chgrp($folderPath, 'www-data');
        }
    }

    // Validate YAML before saving
    if (!validateYaml($content)) {
        return false;
    }

    $result = file_put_contents($filepath, $content) !== false;

    // Set ownership to www-data
    if ($result) {
        chown($filepath, 'www-data');
        chgrp($filepath, 'www-data');
    }

    return $result;
}

/**
 * Delete YAML file (with folder support)
 */
function deleteYamlFile($filename) {
    // Normalize filename (can include folder path now)
    $filename = normalizePath($filename);
    if ($filename === false) {
        return false;
    }

    $filepath = TRAEFIK_CONFIGS_PATH . '/' . $filename;

    if (!file_exists($filepath)) {
        return false;
    }

    // Don't delete acme.json
    if (basename($filename) === 'acme.json') {
        return false;
    }

    // Remove tags for this file
    removeFileTags($filename);

    return unlink($filepath);
}

/**
 * List all YAML files recursively
 */
function listYamlFiles() {
    $result = [];
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator(TRAEFIK_CONFIGS_PATH, RecursiveDirectoryIterator::SKIP_DOTS),
        RecursiveIteratorIterator::SELF_FIRST
    );

    foreach ($iterator as $file) {
        if ($file->isFile() && substr($file->getFilename(), -4) === YAML_EXT) {
            $filename = $file->getFilename();

            // Skip acme.json and metadata files
            if ($filename === 'acme.json' || $filename === '.metadata.json') {
                continue;
            }

            $fullPath = $file->getPathname();
            $relativePath = str_replace(TRAEFIK_CONFIGS_PATH . '/', '', $fullPath);

            // Get folder (everything except filename)
            $folder = dirname($relativePath);
            if ($folder === '.') {
                $folder = '';
            }

            $content = file_get_contents($fullPath);
            $info = extractDomainInfo($content);

            // Get tags for this file
            $tags = getTags($relativePath);

            $result[] = [
                'filename' => $relativePath, // Full relative path
                'type' => $info['type'] ?? 'unknown',
                'domain' => $info['domain'] ?? '',
                'ip' => $info['ip'] ?? '',
                'isWildcard' => $info['isWildcard'] ?? false,
                'enableHttps' => $info['enableHttps'] ?? true,
                'port' => $info['port'] ?? 80,
                'path' => $info['path'] ?? '',
                'pathPrefix' => $info['pathPrefix'] ?? '',
                'pathPrefixTarget' => $info['pathPrefixTarget'] ?? '',
                'tags' => $tags,
                'folder' => $folder,
                'size' => filesize($fullPath),
                'modified' => filemtime($fullPath)
            ];
        }
    }

    return $result;
}

/**
 * Create a folder in traefik configs
 */
function createFolder($folderPath) {
    $folderPath = normalizePath($folderPath);
    if ($folderPath === false || empty($folderPath)) {
        return false;
    }

    $fullPath = TRAEFIK_CONFIGS_PATH . '/' . $folderPath;

    if (is_dir($fullPath)) {
        return true; // Already exists
    }

    if (!mkdir($fullPath, 0755, true)) {
        return false;
    }

    // Set ownership to www-data
    chown($fullPath, 'www-data');
    chgrp($fullPath, 'www-data');

    return true;
}

/**
 * List folder structure
 */
function listFolders() {
    $folders = [];
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator(TRAEFIK_CONFIGS_PATH, RecursiveDirectoryIterator::SKIP_DOTS),
        RecursiveIteratorIterator::SELF_FIRST
    );

    foreach ($iterator as $file) {
        if ($file->isDir()) {
            $relativePath = str_replace(TRAEFIK_CONFIGS_PATH . '/', '', $file->getPathname());
            $folders[] = $relativePath;
        }
    }

    sort($folders);
    return $folders;
}

/**
 * Move file to another folder
 */
function moveFile($currentPath, $targetFolder) {
    $currentPath = normalizePath($currentPath);
    if ($currentPath === false) {
        return false;
    }

    $currentFullPath = TRAEFIK_CONFIGS_PATH . '/' . $currentPath;
    if (!file_exists($currentFullPath)) {
        return false;
    }

    // Normalize target folder
    if (!empty($targetFolder)) {
        $targetFolder = normalizePath($targetFolder);
        if ($targetFolder === false) {
            return false;
        }
    }

    // Build target path
    $filename = basename($currentPath);
    $targetPath = empty($targetFolder) ? $filename : $targetFolder . '/' . $filename;
    $targetFullPath = TRAEFIK_CONFIGS_PATH . '/' . $targetPath;

    // Check if target already exists
    if (file_exists($targetFullPath)) {
        return false;
    }

    // Create target folder if needed
    if (!empty($targetFolder)) {
        createFolder($targetFolder);
    }

    // Move file
    if (!rename($currentFullPath, $targetFullPath)) {
        return false;
    }

    // Update tags reference
    renameFileTags($currentPath, $targetPath);

    return true;
}

/**
 * Delete empty folder
 */
function deleteFolder($folderPath) {
    $folderPath = normalizePath($folderPath);
    if ($folderPath === false || empty($folderPath)) {
        return false;
    }

    $fullPath = TRAEFIK_CONFIGS_PATH . '/' . $folderPath;

    if (!is_dir($fullPath)) {
        return false;
    }

    // Check if folder is empty
    $files = scandir($fullPath);
    if (count($files) > 2) { // . and ..
        return false; // Not empty
    }

    return rmdir($fullPath);
}
