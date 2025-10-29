<?php
/**
 * Helper Functions
 */

/**
 * Sanitize domain input
 * Removes http://, https://, www., trailing slashes, etc.
 */
function sanitizeDomain($domain) {
    // Remove protocol
    $domain = preg_replace('#^https?://#', '', $domain);

    // Remove www.
    $domain = preg_replace('#^www\.#', '', $domain);

    // Remove trailing slashes and paths
    $domain = preg_replace('#[/\?].*$#', '', $domain);

    // Remove spaces
    $domain = trim($domain);

    return $domain;
}

/**
 * Sanitize path prefix for routing (e.g., "api/v1")
 * Returns cleaned prefix without leading/trailing slashes or false if invalid
 */
function sanitizePathPrefix($prefix) {
    if (!is_string($prefix)) {
        return false;
    }

    $prefix = trim($prefix);
    if ($prefix === '') {
        return '';
    }

    // Normalize slashes
    $prefix = preg_replace('#/+#', '/', $prefix);
    $prefix = trim($prefix, '/');

    if ($prefix === '') {
        return '';
    }

    // Allow alphanumeric, dash, underscore, dot and additional "/" for nested paths
    if (!preg_match('/^[A-Za-z0-9._\-\/]+$/', $prefix)) {
        return false;
    }

    return $prefix;
}

/**
 * Validate IP address or domain
 * Accepts both IP addresses (IPv4/IPv6) and domain names
 */
function validateIp($ip) {
    // Trim whitespace
    $ip = trim($ip);

    // Check if it's a valid IP address (IPv4 or IPv6)
    if (filter_var($ip, FILTER_VALIDATE_IP) !== false) {
        return true;
    }

    // Check if it's a valid domain name
    // Allow alphanumeric, hyphens, and dots
    // Must have at least one dot (e.g., example.com or subdomain.example.com)
    if (preg_match('/^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/', $ip)) {
        return true;
    }

    // Also allow localhost and simple hostnames (without dots)
    if (preg_match('/^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?$/', $ip)) {
        return true;
    }

    return false;
}

/**
 * Validate domain
 */
function validateDomain($domain) {
    // Allow wildcards
    $domain = str_replace('*', '', $domain);

    // Basic domain validation
    return preg_match('/^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/', $domain);
}

/**
 * Generate filename from domain
 * Returns the full domain as filename (e.g., "apache1.teste.techify.one")
 */
function generateFilename($domain) {
    // Remove protocol, www, and wildcard
    $domain = preg_replace('/^(https?:\/\/)?(www\.)?(\*\.)?/', '', $domain);

    // Remove trailing slashes and paths
    $domain = preg_replace('/[\/\?].*$/', '', $domain);

    // Remove spaces
    $domain = trim($domain);

    return $domain;
}

/**
 * JSON Response
 */
function jsonResponse($success, $message = '', $data = null) {
    header('Content-Type: application/json');
    $response = [
        'success' => $success,
        'message' => $message
    ];

    if ($data !== null) {
        $response['data'] = $data;
    }

    echo json_encode($response, JSON_PRETTY_PRINT);
    exit;
}

/**
 * Get POST JSON data
 */
function getJsonInput() {
    $input = file_get_contents('php://input');
    return json_decode($input, true);
}

/**
 * Format file size
 */
function formatFileSize($bytes) {
    if ($bytes >= 1073741824) {
        return number_format($bytes / 1073741824, 2) . ' GB';
    } elseif ($bytes >= 1048576) {
        return number_format($bytes / 1048576, 2) . ' MB';
    } elseif ($bytes >= 1024) {
        return number_format($bytes / 1024, 2) . ' KB';
    } else {
        return $bytes . ' bytes';
    }
}

/**
 * Format date
 */
function formatDate($timestamp) {
    return date('Y-m-d H:i:s', $timestamp);
}

/**
 * Load Vite manifest entry for the React frontend
 */
function getReactAssets($entry = 'index.html') {
    $manifestPath = __DIR__ . '/../frontend/dist/.vite/manifest.json';

    if (!file_exists($manifestPath)) {
        return [
            'loaded' => false,
            'js' => null,
            'css' => [],
        ];
    }

    $manifest = json_decode(file_get_contents($manifestPath), true);

    if (!isset($manifest[$entry])) {
        return [
            'loaded' => false,
            'js' => null,
            'css' => [],
        ];
    }

    $entryData = $manifest[$entry];
    $base = 'frontend/dist/';

    return [
        'loaded' => true,
        'js' => $base . ($entryData['file'] ?? ''),
        'css' => array_map(function ($css) use ($base) {
            return $base . $css;
        }, $entryData['css'] ?? []),
    ];
}

/**
 * Generate CSRF Token
 */
function generateCsrfToken() {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }

    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }

    return $_SESSION['csrf_token'];
}

/**
 * Validate CSRF Token
 */
function validateCsrfToken($token) {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }

    return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}
