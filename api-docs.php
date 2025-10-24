<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/functions.php';

requireLogin();

$assets = getReactAssets();
$bootstrap = [
    'appName' => APP_NAME,
    'version' => APP_VERSION,
];
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo APP_NAME; ?> - API Docs</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@3.4.3/dist/tailwind.min.css">
<?php if ($assets['loaded']): ?>
<?php foreach ($assets['css'] as $css): ?>
    <link rel="stylesheet" href="<?php echo htmlspecialchars($css, ENT_QUOTES); ?>">
<?php endforeach; ?>
<?php endif; ?>
</head>
<body>
    <div id="root"></div>
    <script>
        window.__APP_CONFIG__ = <?php echo json_encode($bootstrap, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE); ?>;
    </script>
<?php if ($assets['loaded'] && $assets['js']): ?>
    <script type="module" src="<?php echo htmlspecialchars($assets['js'], ENT_QUOTES); ?>"></script>
<?php else: ?>
    <div style="padding:2rem; font-family: sans-serif;">
        <strong>Build não encontrado.</strong> Certifique-se de publicar o conteúdo de <code>frontend/dist</code> no servidor.
    </div>
<?php endif; ?>
</body>
</html>
