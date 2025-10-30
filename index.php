<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/functions.php';

// O React Router decide se mostra login ou dashboard
// Não força autenticação aqui

$assets = getReactAssets();
$bootstrap = [
    'appName' => APP_NAME,
    'version' => APP_VERSION,
    'basePath' => BASE_PATH,
];
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo APP_NAME; ?></title>
<?php if ($assets['loaded']): ?>
<?php foreach ($assets['css'] as $css): ?>
    <link rel="stylesheet" href="<?php echo htmlspecialchars($css, ENT_QUOTES); ?>">
<?php endforeach; ?>
<?php endif; ?>
    <style>
        body { margin: 0; font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f6f8; }
    </style>
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
        <strong>Build não encontrado.</strong> Execute <code>npm install</code> e <code>npm run build</code> em <code>frontend/</code>.
    </div>
<?php endif; ?>
</body>
</html>
