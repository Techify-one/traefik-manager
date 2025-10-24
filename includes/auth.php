<?php
/**
 * Authentication Handler
 * Supports both Session-based (web) and Bearer Token (API) authentication
 */

require_once __DIR__ . '/../config.php';

/**
 * Check if user is authenticated via session
 */
function isAuthenticated() {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    return isset($_SESSION['authenticated']) && $_SESSION['authenticated'] === true;
}

/**
 * Check if request has valid Bearer Token
 */
function isValidBearerToken() {
    $headers = getallheaders();

    if (isset($headers['Authorization'])) {
        $auth = $headers['Authorization'];
        if (preg_match('/Bearer\s+(.+)/', $auth, $matches)) {
            return $matches[1] === API_BEARER_TOKEN;
        }
    }

    return false;
}

/**
 * Check authentication (Session OR Bearer Token)
 * Used in API endpoints
 */
function checkAuth() {
    if (isAuthenticated() || isValidBearerToken()) {
        return true;
    }

    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Unauthorized. Please login or provide valid Bearer token.'
    ]);
    exit;
}

/**
 * Check authentication (Session ONLY)
 * Used in web pages
 */
function requireLogin() {
    if (!isAuthenticated()) {
        header('Location: login.php');
        exit;
    }
}

/**
 * Perform login
 */
function login($username, $password) {
    if ($username === ADMIN_USER && $password === ADMIN_PASS) {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        session_regenerate_id(true);
        $_SESSION['authenticated'] = true;
        $_SESSION['username'] = $username;
        $_SESSION['login_time'] = time();
        return true;
    }
    return false;
}

/**
 * Perform logout
 */
function logout() {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    $_SESSION = array();
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    session_destroy();
}

/**
 * Get current username
 */
function getCurrentUser() {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }

    if (isValidBearerToken()) {
        return 'api-user';
    }

    return $_SESSION['username'] ?? 'unknown';
}
