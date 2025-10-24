<?php
/**
 * YAML Handler
 * Parse, validate and generate YAML files for Traefik
 */

require_once __DIR__ . '/../config.php';

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
function generateSslTerminationYaml($name, $domain, $ip, $isWildcard = false, $enableHttps = true) {
    $rule = $isWildcard
        ? "HostRegexp(`^.*{$domain}$`)"
        : "Host(`{$domain}`)";

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
                                ['url' => "http://{$ip}:80"]
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
                                ['url' => "http://{$ip}:80"]
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
        'enableHttps' => true
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

        // Extract IP
        $service = reset($data['http']['services']);
        $url = $service['loadBalancer']['servers'][0]['url'] ?? '';
        if (preg_match('/http:\/\/([^:]+):/', $url, $matches)) {
            $info['ip'] = $matches[1];
        }
    }

    return $info;
}

/**
 * Save YAML file
 */
function saveYamlFile($filename, $content) {
    // Validate filename (no path traversal)
    if (strpos($filename, '..') !== false || strpos($filename, '/') !== false) {
        return false;
    }

    // Ensure .yml extension
    if (substr($filename, -4) !== YAML_EXT) {
        $filename .= YAML_EXT;
    }

    $filepath = TRAEFIK_CONFIGS_PATH . '/' . $filename;

    // Validate YAML before saving
    if (!validateYaml($content)) {
        return false;
    }

    return file_put_contents($filepath, $content) !== false;
}

/**
 * Delete YAML file
 */
function deleteYamlFile($filename) {
    // Validate filename (no path traversal)
    if (strpos($filename, '..') !== false || strpos($filename, '/') !== false) {
        return false;
    }

    $filepath = TRAEFIK_CONFIGS_PATH . '/' . $filename;

    if (!file_exists($filepath)) {
        return false;
    }

    // Don't delete acme.json
    if ($filename === 'acme.json') {
        return false;
    }

    return unlink($filepath);
}

/**
 * List all YAML files
 */
function listYamlFiles() {
    $files = glob(TRAEFIK_CONFIGS_PATH . '/*' . YAML_EXT);
    $result = [];

    foreach ($files as $file) {
        $filename = basename($file);
        $content = file_get_contents($file);
        $info = extractDomainInfo($content);

        $result[] = [
            'filename' => $filename,
            'type' => $info['type'] ?? 'unknown',
            'domain' => $info['domain'] ?? '',
            'ip' => $info['ip'] ?? '',
            'isWildcard' => $info['isWildcard'] ?? false,
            'size' => filesize($file),
            'modified' => filemtime($file)
        ];
    }

    return $result;
}
