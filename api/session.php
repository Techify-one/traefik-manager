<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

switch ($method) {
    case 'GET':
        respond(true, 'Session info', buildSessionPayload());
        break;
    case 'POST':
        handleLogin();
        break;
    case 'DELETE':
        logout();
        respond(true, 'Logged out', buildSessionPayload());
        break;
    default:
        http_response_code(405);
        respond(false, 'Method not allowed');
}

function handleLogin(): void
{
    $data = getJsonInput();
    $username = trim($data['username'] ?? '');
    $password = $data['password'] ?? '';

    if ($username === '' || $password === '') {
        respond(false, 'Usuário e senha são obrigatórios', buildSessionPayload());
    }

    if (login($username, $password)) {
        respond(true, 'Authenticated', buildSessionPayload());
    }

    http_response_code(401);
    respond(false, 'Credenciais inválidas', buildSessionPayload());
}

function buildSessionPayload(): array
{
    $authenticated = isAuthenticated();
    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? ($_SERVER['SERVER_NAME'] ?? 'localhost');
    $apiBase = rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? '/api'), '/');
    if ($apiBase === '' || $apiBase === '.') {
        $apiBase = '/api';
    }

    $payload = [
        'authenticated' => $authenticated,
        'username' => $authenticated ? getCurrentUser() : null,
        'appName' => APP_NAME,
        'version' => APP_VERSION,
        'bearerToken' => $authenticated ? API_BEARER_TOKEN : null,
        'apiBaseUrl' => $authenticated ? sprintf('%s://%s%s', $scheme, $host, $apiBase) : null,
        'csrfToken' => $authenticated ? generateCsrfToken() : null,
    ];

    return $payload;
}

function respond(bool $success, string $message, array $data = []): void
{
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data,
    ], JSON_PRETTY_PRINT);
    exit;
}
