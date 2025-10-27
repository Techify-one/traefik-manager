<?php
/**
 * Tags API - Manage tags and file associations
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
require_once __DIR__ . '/../includes/metadata-handler.php';
require_once __DIR__ . '/../includes/logger.php';

// Check authentication (Session OR Bearer Token)
checkAuth();

// Get action from GET, POST or JSON body
$jsonData = json_decode(file_get_contents('php://input'), true);
$action = $_GET['action'] ?? $_POST['action'] ?? ($jsonData['action'] ?? '');

switch ($action) {
    case 'list':
        listAvailableTags();
        break;

    case 'get':
        getFileTags();
        break;

    case 'set':
        setFileTags();
        break;

    case 'create':
        createTag();
        break;

    case 'delete':
        deleteTag();
        break;

    default:
        jsonResponse(false, 'Invalid action');
}

/**
 * List all available tags
 * GET /api/tags.php?action=list
 */
function listAvailableTags() {
    try {
        $tags = getAllAvailableTags();

        // Get usage count for each tag
        $tagsWithCount = array_map(function($tag) {
            return [
                'name' => $tag,
                'count' => getTagUsageCount($tag)
            ];
        }, $tags);

        jsonResponse(true, 'Tags retrieved successfully', [
            'tags' => $tagsWithCount
        ]);
    } catch (Exception $e) {
        jsonResponse(false, 'Error listing tags: ' . $e->getMessage());
    }
}

/**
 * Get tags for a specific file
 * GET /api/tags.php?action=get&file=apache1.yml
 */
function getFileTags() {
    $filename = $_GET['file'] ?? '';

    if (empty($filename)) {
        jsonResponse(false, 'Filename is required');
    }

    try {
        $tags = getTags($filename);
        jsonResponse(true, 'File tags retrieved successfully', [
            'filename' => $filename,
            'tags' => $tags
        ]);
    } catch (Exception $e) {
        jsonResponse(false, 'Error getting file tags: ' . $e->getMessage());
    }
}

/**
 * Set tags for a file
 * POST /api/tags.php
 * Body: {
 *   "action": "set",
 *   "filename": "apache1.yml",
 *   "tags": ["producao", "web"]
 * }
 */
function setFileTags() {
    $data = getJsonInput();

    if (empty($data['filename'])) {
        jsonResponse(false, 'Filename is required');
    }

    if (!isset($data['tags']) || !is_array($data['tags'])) {
        jsonResponse(false, 'Tags must be an array');
    }

    $filename = $data['filename'];
    $tags = $data['tags'];

    try {
        // Validate that all tags exist in available tags
        $availableTags = getAllAvailableTags();
        foreach ($tags as $tag) {
            if (!in_array($tag, $availableTags)) {
                jsonResponse(false, "Tag '{$tag}' is not in available tags list");
            }
        }

        if (setTags($filename, $tags)) {
            writeLog('TAGS_SET', $filename, 'Tags: ' . implode(', ', $tags));
            jsonResponse(true, 'Tags updated successfully', [
                'filename' => $filename,
                'tags' => $tags
            ]);
        } else {
            jsonResponse(false, 'Failed to update tags');
        }
    } catch (Exception $e) {
        jsonResponse(false, 'Error setting tags: ' . $e->getMessage());
    }
}

/**
 * Create a new available tag
 * POST /api/tags.php
 * Body: {
 *   "action": "create",
 *   "tag": "kubernetes"
 * }
 */
function createTag() {
    $data = getJsonInput();

    if (empty($data['tag'])) {
        jsonResponse(false, 'Tag name is required');
    }

    $tag = trim($data['tag']);

    // Validate tag name (alphanumeric, dash, underscore only)
    if (!preg_match('/^[a-zA-Z0-9_-]+$/', $tag)) {
        jsonResponse(false, 'Tag name can only contain letters, numbers, dashes and underscores');
    }

    try {
        if (addAvailableTag($tag)) {
            writeLog('TAG_CREATE', '', "New tag: {$tag}");
            jsonResponse(true, 'Tag created successfully', [
                'tag' => $tag
            ]);
        } else {
            jsonResponse(false, 'Failed to create tag');
        }
    } catch (Exception $e) {
        jsonResponse(false, 'Error creating tag: ' . $e->getMessage());
    }
}

/**
 * Delete an available tag
 * POST /api/tags.php
 * Body: {
 *   "action": "delete",
 *   "tag": "kubernetes"
 * }
 */
function deleteTag() {
    $data = getJsonInput();

    if (empty($data['tag'])) {
        jsonResponse(false, 'Tag name is required');
    }

    $tag = $data['tag'];

    try {
        $usageCount = getTagUsageCount($tag);

        if (removeAvailableTag($tag)) {
            writeLog('TAG_DELETE', '', "Deleted tag: {$tag} (was used by {$usageCount} files)");
            jsonResponse(true, 'Tag deleted successfully', [
                'tag' => $tag,
                'removedFrom' => $usageCount
            ]);
        } else {
            jsonResponse(false, 'Failed to delete tag');
        }
    } catch (Exception $e) {
        jsonResponse(false, 'Error deleting tag: ' . $e->getMessage());
    }
}
