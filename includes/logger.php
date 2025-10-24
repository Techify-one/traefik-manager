<?php
/**
 * Audit Logger
 * Logs all actions to a text file
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/auth.php';

/**
 * Write log entry
 * Format: [2025-10-24 10:30:45] username - ACTION - file.yml - Details
 */
function writeLog($action, $filename, $details = '') {
    $logFile = LOGS_PATH . '/audit.log';

    // Create logs directory if it doesn't exist
    if (!is_dir(LOGS_PATH)) {
        mkdir(LOGS_PATH, 0755, true);
    }

    $username = getCurrentUser();
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = sprintf(
        "[%s] %s - %s - %s%s\n",
        $timestamp,
        $username,
        $action,
        $filename,
        $details ? ' - ' . $details : ''
    );

    file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
}

/**
 * Get recent logs
 */
function getRecentLogs($limit = 100) {
    $logFile = LOGS_PATH . '/audit.log';

    if (!file_exists($logFile)) {
        return [];
    }

    $lines = file($logFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

    // Return last N lines
    return array_slice($lines, -$limit);
}

/**
 * Clear logs
 */
function clearLogs() {
    $logFile = LOGS_PATH . '/audit.log';

    if (file_exists($logFile)) {
        writeLog('SYSTEM', 'audit.log', 'Logs cleared by ' . getCurrentUser());
        file_put_contents($logFile, '');
        return true;
    }

    return false;
}
