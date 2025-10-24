<?php
/**
 * Traefik Manager - Configuration Example
 *
 * Copie este arquivo para config.php e preencha com suas credenciais
 * Copy this file to config.php and fill in your credentials
 */

// Security
define('APP_NAME', 'Traefik Manager');
define('APP_VERSION', '1.0.0');

// Authentication
// IMPORTANTE: Altere o usuário e senha padrão!
define('ADMIN_USER', 'admin');
define('ADMIN_PASS', 'change-this-password');

// Bearer Token for External API Access
// IMPORTANTE: Gere um token seguro e único!
// Use: openssl rand -hex 32
define('API_BEARER_TOKEN', 'your-secure-bearer-token-here');

// Paths
define('TRAEFIK_CONFIGS_PATH', '/var/www/traefik_configs');
define('LOGS_PATH', __DIR__ . '/logs');
define('TEMPLATES_PATH', __DIR__ . '/templates');

// YAML file extension
define('YAML_EXT', '.yml');

// Timezone
date_default_timezone_set('America/Sao_Paulo');

// Session configuration
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
