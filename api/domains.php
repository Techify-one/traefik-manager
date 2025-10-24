<?php
/**
 * Domains API - CRUD Operations
 * Supports both Session and Bearer Token authentication
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/yaml-handler.php';
require_once __DIR__ . '/../includes/logger.php';

// Check authentication (Session OR Bearer Token)
checkAuth();

// Get action from GET, POST or JSON body
$jsonData = json_decode(file_get_contents('php://input'), true);
$action = $_GET['action'] ?? $_POST['action'] ?? ($jsonData['action'] ?? '');

switch ($action) {
    case 'list':
        listDomains();
        break;

    case 'get':
        getDomain();
        break;

    case 'create':
        createDomain();
        break;

    case 'update':
        updateDomain();
        break;

    case 'delete':
        deleteDomain();
        break;

    case 'validate':
        validateYamlContent();
        break;

    case 'generate':
        generateYamlContent();
        break;

    default:
        jsonResponse(false, 'Invalid action');
}

/**
 * List all domains
 * GET /api/domains.php?action=list
 */
function listDomains() {
    try {
        $domains = listYamlFiles();
        jsonResponse(true, 'Domains retrieved successfully', ['domains' => $domains]);
    } catch (Exception $e) {
        jsonResponse(false, 'Error listing domains: ' . $e->getMessage());
    }
}

/**
 * Get single domain
 * GET /api/domains.php?action=get&file=apache1.yml
 */
function getDomain() {
    $filename = $_GET['file'] ?? '';

    if (empty($filename)) {
        jsonResponse(false, 'Filename is required');
    }

    $filepath = TRAEFIK_CONFIGS_PATH . '/' . $filename;

    if (!file_exists($filepath)) {
        jsonResponse(false, 'File not found');
    }

    $content = file_get_contents($filepath);
    $info = extractDomainInfo($content);

    jsonResponse(true, 'Domain retrieved successfully', [
        'filename' => $filename,
        'content' => $content,
        'info' => $info
    ]);
}

/**
 * Create new domain
 * POST /api/domains.php
 * Body: {
 *   "action": "create",
 *   "filename": "apache3.yml",
 *   "type": "ssl-termination",  // or "passthrough"
 *   "domain": "apache3.teste.techify.run",
 *   "ip": "10.8.100.103",
 *   "wildcard": false
 * }
 */
function createDomain() {
    $data = getJsonInput();

    // Validate required fields
    $requiredFields = ['filename', 'type', 'domain', 'ip'];
    foreach ($requiredFields as $field) {
        if (empty($data[$field])) {
            jsonResponse(false, "Field '{$field}' is required");
        }
    }

    $filename = $data['filename'];
    $type = $data['type'];
    $domain = sanitizeDomain($data['domain']);
    $ip = $data['ip'];
    $wildcard = $data['wildcard'] ?? false;
    $enableHttps = $data['enableHttps'] ?? true;

    // Validate domain
    if (!validateDomain($domain)) {
        jsonResponse(false, 'Invalid domain format');
    }

    // Validate IP
    if (!validateIp($ip)) {
        jsonResponse(false, 'Invalid IP address');
    }

    // Ensure .yml extension
    if (substr($filename, -4) !== YAML_EXT) {
        $filename .= YAML_EXT;
    }

    // Check if file already exists
    if (file_exists(TRAEFIK_CONFIGS_PATH . '/' . $filename)) {
        jsonResponse(false, 'File already exists');
    }

    // Generate YAML content
    $name = str_replace(YAML_EXT, '', $filename);

    if ($type === 'ssl-termination') {
        $yamlContent = generateSslTerminationYaml($name, $domain, $ip, $wildcard, $enableHttps);
    } elseif ($type === 'passthrough') {
        $yamlContent = generatePassthroughYaml($name, $domain, $ip, $wildcard, $enableHttps);
    } else {
        jsonResponse(false, 'Invalid type. Use "ssl-termination" or "passthrough"');
    }

    // Save file
    if (saveYamlFile($filename, $yamlContent)) {
        writeLog('CREATE', $filename, "Domain: {$domain}, IP: {$ip}, Type: {$type}");
        jsonResponse(true, 'Domain created successfully', [
            'filename' => $filename,
            'content' => $yamlContent
        ]);
    } else {
        jsonResponse(false, 'Failed to create domain file');
    }
}

/**
 * Update existing domain
 * POST /api/domains.php
 * Body: {
 *   "action": "update",
 *   "filename": "apache3.yml",
 *   "content": "yaml content here..."
 * }
 */
function updateDomain() {
    $data = getJsonInput();

    if (empty($data['filename']) || empty($data['content'])) {
        jsonResponse(false, 'Filename and content are required');
    }

    $filename = $data['filename'];
    $content = $data['content'];

    // Check if file exists
    if (!file_exists(TRAEFIK_CONFIGS_PATH . '/' . $filename)) {
        jsonResponse(false, 'File not found');
    }

    // Validate YAML
    if (!validateYaml($content)) {
        jsonResponse(false, 'Invalid YAML syntax');
    }

    // Save file
    if (saveYamlFile($filename, $content)) {
        $info = extractDomainInfo($content);
        writeLog('UPDATE', $filename, "Domain: " . ($info['domain'] ?? 'unknown'));
        jsonResponse(true, 'Domain updated successfully', [
            'filename' => $filename
        ]);
    } else {
        jsonResponse(false, 'Failed to update domain file');
    }
}

/**
 * Delete domain
 * POST /api/domains.php
 * Body: {
 *   "action": "delete",
 *   "filename": "apache3.yml"
 * }
 */
function deleteDomain() {
    $data = getJsonInput();

    if (empty($data['filename'])) {
        jsonResponse(false, 'Filename is required');
    }

    $filename = $data['filename'];

    // Get domain info before deleting
    $filepath = TRAEFIK_CONFIGS_PATH . '/' . $filename;
    if (file_exists($filepath)) {
        $content = file_get_contents($filepath);
        $info = extractDomainInfo($content);
    }

    // Delete file
    if (deleteYamlFile($filename)) {
        writeLog('DELETE', $filename, "Domain: " . ($info['domain'] ?? 'unknown'));
        jsonResponse(true, 'Domain deleted successfully');
    } else {
        jsonResponse(false, 'Failed to delete domain file');
    }
}

/**
 * Validate YAML content
 * POST /api/domains.php
 * Body: {
 *   "action": "validate",
 *   "content": "yaml content here..."
 * }
 */
function validateYamlContent() {
    $data = getJsonInput();

    if (empty($data['content'])) {
        jsonResponse(false, 'Content is required');
    }

    $isValid = validateYaml($data['content']);

    jsonResponse(true, $isValid ? 'Valid YAML' : 'Invalid YAML', [
        'valid' => $isValid
    ]);
}

/**
 * Generate YAML content without saving
 * POST /api/domains.php
 * Body: {
 *   "action": "generate",
 *   "type": "ssl-termination",
 *   "domain": "example.com",
 *   "ip": "10.8.100.100",
 *   "wildcard": false,
 *   "name": "example" // optional, defaults to domain
 * }
 */
function generateYamlContent() {
    $data = getJsonInput();

    // Validate required fields
    $requiredFields = ['type', 'domain', 'ip'];
    foreach ($requiredFields as $field) {
        if (empty($data[$field])) {
            jsonResponse(false, "Field '{$field}' is required");
        }
    }

    $type = $data['type'];
    $domain = sanitizeDomain($data['domain']);
    $ip = $data['ip'];
    $wildcard = $data['wildcard'] ?? false;
    $enableHttps = $data['enableHttps'] ?? true;
    $name = $data['name'] ?? str_replace('.', '-', $domain);

    // Validate domain
    if (!validateDomain($domain)) {
        jsonResponse(false, 'Invalid domain format');
    }

    // Validate IP
    if (!validateIp($ip)) {
        jsonResponse(false, 'Invalid IP address');
    }

    // Generate YAML content
    if ($type === 'ssl-termination') {
        $yamlContent = generateSslTerminationYaml($name, $domain, $ip, $wildcard, $enableHttps);
    } elseif ($type === 'passthrough') {
        $yamlContent = generatePassthroughYaml($name, $domain, $ip, $wildcard, $enableHttps);
    } else {
        jsonResponse(false, 'Invalid type. Use "ssl-termination" or "passthrough"');
    }

    jsonResponse(true, 'YAML generated successfully', [
        'content' => $yamlContent
    ]);
}
