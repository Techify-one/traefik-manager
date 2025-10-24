<?php
/**
 * Logs API
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/logger.php';

// Check authentication
checkAuth();

header('Content-Type: application/json');

$action = $_GET['action'] ?? 'get';

switch ($action) {
    case 'get':
        getLogs();
        break;

    case 'clear':
        clearLogsAction();
        break;

    default:
        jsonResponse(false, 'Invalid action');
}

function getLogs() {
    $logs = getRecentLogs(100);

    echo json_encode([
        'success' => true,
        'data' => [
            'logs' => $logs
        ]
    ]);
}

function clearLogsAction() {
    if (clearLogs()) {
        echo json_encode([
            'success' => true,
            'message' => 'Logs cleared successfully'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Failed to clear logs'
        ]);
    }
}

function jsonResponse($success, $message) {
    echo json_encode([
        'success' => $success,
        'message' => $message
    ]);
    exit;
}
