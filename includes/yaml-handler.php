<?php
/**
 * YAML Handler
 * Parse, validate and generate YAML files for Traefik
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/metadata-handler.php';

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

/**
 * Generate SSL Termination YAML
 */
function generateSslTerminationYaml($name, $domain, $ip, $isWildcard = false, $enableHttps = true, $port = 80, $path = '') {
    $rule = $isWildcard
        ? "HostRegexp(`^.*{$domain}$`)"
        : "Host(`{$domain}`)";

    // Use porta customizada ou padrão 80
    $backendUrl = "http://{$ip}:{$port}";

    if (!$enableHttps) {
        // HTTP-only configuration
        $yaml = [
            'http' => [
                'routers' => [
                    "{$name}-http" => [
                        'rule' => $rule,
                        'service' => "{$name}-service",
                        'entryPoints' => ['web']
                    ]
                ],
                'services' => [
                    "{$name}-service" => [
                        'loadBalancer' => [
                            'servers' => [
                                ['url' => $backendUrl]
                            ]
                        ]
                    ]
                ]
            ]
        ];
    } else {
        // HTTPS with SSL termination
        $yaml = [
            'http' => [
                'routers' => [
                    "{$name}-http" => [
                        'rule' => $rule,
                        'service' => "{$name}-service",
                        'entryPoints' => ['web'],
                        'middlewares' => ['redirect-to-https']
                    ],
                    "{$name}-https" => [
                        'rule' => $rule,
                        'service' => "{$name}-service",
                        'entryPoints' => ['websecure'],
                        'tls' => [
                            'certResolver' => 'letsencrypt'
                        ]
                    ]
                ],
                'services' => [
                    "{$name}-service" => [
                        'loadBalancer' => [
                            'servers' => [
                                ['url' => $backendUrl]
                            ]
                        ]
                    ]
                ],
                'middlewares' => [
                    'redirect-to-https' => [
                        'redirectScheme' => [
                            'scheme' => 'https',
                            'permanent' => true
                        ]
                    ]
                ]
            ]
        ];

        // Se um caminho foi especificado, adiciona middleware de addPrefix
        if (!empty($path)) {
            $pathNormalized = '/' . trim($path, '/');
            $yaml['http']['middlewares']["{$name}/add-prefix"] = [
                'addPrefix' => [
                    'prefix' => $pathNormalized
                ]
            ];

            // Adiciona o middleware ao router HTTPS
            $yaml['http']['routers']["{$name}-https"]['middlewares'] = ["{$name}/add-prefix"];
        }
    }

    return yaml_emit($yaml, YAML_UTF8_ENCODING);
}

/**
 * Generate Passthrough YAML
 */
function generatePassthroughYaml($name, $domain, $ip, $isWildcard = false, $enableHttps = true) {
    $httpRule = $isWildcard
        ? "HostRegexp(`^.*{$domain}$`)"
        : "Host(`{$domain}`)";

    $tcpRule = $isWildcard
        ? "HostSNIRegexp(`^.*{$domain}$`)"
        : "HostSNI(`{$domain}`)";

    if (!$enableHttps) {
        // HTTP-only configuration
        $yaml = [
            'http' => [
                'routers' => [
                    "{$name}-http" => [
                        'rule' => $httpRule,
                        'service' => "{$name}-http-service",
                        'entryPoints' => ['web']
                    ]
                ],
                'services' => [
                    "{$name}-http-service" => [
                        'loadBalancer' => [
                            'servers' => [
                                ['url' => "http://{$ip}:80"]
                            ]
                        ]
                    ]
                ]
            ]
        ];
    } else {
        // HTTPS with passthrough
        $yaml = [
            'tcp' => [
                'routers' => [
                    "{$name}-https" => [
                        'rule' => $tcpRule,
                        'service' => "{$name}-service",
                        'entryPoints' => ['websecure'],
                        'tls' => [
                            'passthrough' => true
                        ]
                    ]
                ],
                'services' => [
                    "{$name}-service" => [
                        'loadBalancer' => [
                            'servers' => [
                                ['address' => "{$ip}:443"]
                            ]
                        ]
                    ]
                ]
            ],
            'http' => [
                'routers' => [
                    "{$name}-http" => [
                        'rule' => $httpRule,
                        'service' => "{$name}-http-service",
                        'entryPoints' => ['web'],
                        'priority' => 1000
                    ]
                ],
                'services' => [
                    "{$name}-http-service" => [
                        'loadBalancer' => [
                            'servers' => [
                                ['url' => "http://{$ip}:80"]
                            ]
                        ]
                    ]
                ]
            ]
        ];
    }

    return yaml_emit($yaml, YAML_UTF8_ENCODING);
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
        'path' => ''
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
            if (isset($router['entryPoints']) && in_array('websecure', $router['entryPoints'])) {
                $hasHttpsRouter = true;
                break;
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

        // Extract Path from middleware (supports both addPrefix and old redirectRegex)
        $info['path'] = '';
        if (isset($data['http']['middlewares'])) {
            foreach ($data['http']['middlewares'] as $middlewareName => $middleware) {
                // New format: addPrefix
                if (isset($middleware['addPrefix']['prefix'])) {
                    $info['path'] = trim($middleware['addPrefix']['prefix'], '/');
                    break;
                }
                // Old format: redirectRegex (backward compatibility)
                if ($middlewareName === 'redirect-root-to-path' && isset($middleware['redirectRegex']['replacement'])) {
                    $replacement = $middleware['redirectRegex']['replacement'];
                    if (preg_match('/\$\{1\}\/(.+?)\/$/', $replacement, $matches)) {
                        $info['path'] = $matches[1];
                    }
                    break;
                }
            }
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
