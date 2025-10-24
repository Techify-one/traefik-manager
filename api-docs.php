<?php
/**
 * API Documentation Page
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/auth.php';

// Require login
requireLogin();

// Get server IP
$serverIP = $_SERVER['SERVER_ADDR'] ?? 'YOUR_IP';
$serverPort = $_SERVER['SERVER_PORT'] ?? '64780';
$baseUrl = "http://{$serverIP}:{$serverPort}/traefik-manager/api";
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo APP_NAME; ?> - API Documentation</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="assets/css/custom.css">
    <style>
        .code-block {
            background-color: #1e1e1e;
            color: #d4d4d4;
            padding: 15px;
            border-radius: 8px;
            overflow-x: auto;
            margin-bottom: 20px;
            position: relative;
        }
        .code-block pre {
            margin: 0;
            color: #d4d4d4;
        }
        .copy-btn {
            position: absolute;
            top: 10px;
            right: 10px;
            padding: 5px 10px;
            font-size: 12px;
        }
        .endpoint {
            background-color: #f8f9fa;
            padding: 15px;
            border-left: 4px solid #0d6efd;
            margin-bottom: 20px;
            border-radius: 4px;
        }
        .method-badge {
            font-weight: bold;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
        }
        .method-get {
            background-color: #28a745;
            color: white;
        }
        .method-post {
            background-color: #007bff;
            color: white;
        }
        .token-box {
            background-color: #fff3cd;
            border: 2px solid #ffc107;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
    </style>
</head>
<body>
    <!-- Navbar -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
        <div class="container-fluid">
            <a class="navbar-brand" href="index.php">
                <i class="fas fa-arrow-left"></i> Back to Dashboard
            </a>
            <div class="d-flex align-items-center">
                <span class="text-white me-3">
                    <i class="fas fa-user"></i> <?php echo getCurrentUser(); ?>
                </span>
                <a href="logout.php" class="btn btn-outline-light btn-sm">
                    <i class="fas fa-sign-out-alt"></i> Logout
                </a>
            </div>
        </div>
    </nav>

    <!-- Main Content -->
    <div class="container-fluid mt-4">
        <div class="row">
            <div class="col-lg-10 offset-lg-1">
                <h1 class="mb-4"><i class="fas fa-book"></i> API Documentation</h1>

                <!-- Bearer Token Section -->
                <div class="token-box">
                    <h4><i class="fas fa-key"></i> Authentication Token</h4>
                    <p>Use this Bearer Token to authenticate your API requests:</p>
                    <div class="code-block">
                        <button class="btn btn-sm btn-light copy-btn" onclick="copyToClipboard(this)">
                            <i class="fas fa-copy"></i> Copy
                        </button>
                        <pre><?php echo API_BEARER_TOKEN; ?></pre>
                    </div>
                    <small class="text-muted">
                        <i class="fas fa-info-circle"></i> Keep this token secret and secure. Include it in the Authorization header of all API requests.
                    </small>
                </div>

                <!-- Base URL -->
                <div class="card mb-4">
                    <div class="card-body">
                        <h5><i class="fas fa-link"></i> Base URL</h5>
                        <code><?php echo $baseUrl; ?></code>
                    </div>
                </div>

                <!-- List Domains -->
                <div class="endpoint">
                    <h4>
                        <span class="method-badge method-get">GET</span>
                        List All Domains
                    </h4>
                    <p>Retrieve a list of all configured domains.</p>

                    <strong>Endpoint:</strong>
                    <div class="code-block">
                        <button class="btn btn-sm btn-light copy-btn" onclick="copyToClipboard(this)">
                            <i class="fas fa-copy"></i> Copy
                        </button>
                        <pre>GET <?php echo $baseUrl; ?>/domains.php?action=list</pre>
                    </div>

                    <strong>cURL Example:</strong>
                    <div class="code-block">
                        <button class="btn btn-sm btn-light copy-btn" onclick="copyToClipboard(this)">
                            <i class="fas fa-copy"></i> Copy
                        </button>
                        <pre>curl -H "Authorization: Bearer <?php echo API_BEARER_TOKEN; ?>" \
     "<?php echo $baseUrl; ?>/domains.php?action=list"</pre>
                    </div>

                    <strong>Response Example:</strong>
                    <div class="code-block">
                        <pre>{
  "success": true,
  "message": "Domains retrieved successfully",
  "data": {
    "domains": [
      {
        "filename": "apache1.teste.techify.one.yml",
        "type": "ssl-termination",
        "domain": "apache1.teste.techify.one",
        "ip": "10.8.100.101",
        "isWildcard": false
      }
    ]
  }
}</pre>
                    </div>
                </div>

                <!-- Get Single Domain -->
                <div class="endpoint">
                    <h4>
                        <span class="method-badge method-get">GET</span>
                        Get Single Domain
                    </h4>
                    <p>Retrieve details of a specific domain configuration.</p>

                    <strong>Endpoint:</strong>
                    <div class="code-block">
                        <button class="btn btn-sm btn-light copy-btn" onclick="copyToClipboard(this)">
                            <i class="fas fa-copy"></i> Copy
                        </button>
                        <pre>GET <?php echo $baseUrl; ?>/domains.php?action=get&file=FILENAME.yml</pre>
                    </div>

                    <strong>cURL Example:</strong>
                    <div class="code-block">
                        <button class="btn btn-sm btn-light copy-btn" onclick="copyToClipboard(this)">
                            <i class="fas fa-copy"></i> Copy
                        </button>
                        <pre>curl -H "Authorization: Bearer <?php echo API_BEARER_TOKEN; ?>" \
     "<?php echo $baseUrl; ?>/domains.php?action=get&file=apache1.teste.techify.one.yml"</pre>
                    </div>
                </div>

                <!-- Create Domain -->
                <div class="endpoint">
                    <h4>
                        <span class="method-badge method-post">POST</span>
                        Create New Domain
                    </h4>
                    <p>Create a new domain configuration.</p>

                    <strong>Parameters:</strong>
                    <ul>
                        <li><code>action</code> (string): "create"</li>
                        <li><code>filename</code> (string): Desired filename (without .yml)</li>
                        <li><code>type</code> (string): "ssl-termination" or "passthrough"</li>
                        <li><code>domain</code> (string): Domain name</li>
                        <li><code>ip</code> (string): Backend IP address</li>
                        <li><code>wildcard</code> (boolean): Use wildcard domain (optional)</li>
                    </ul>

                    <strong>cURL Example (SSL Termination):</strong>
                    <div class="code-block">
                        <button class="btn btn-sm btn-light copy-btn" onclick="copyToClipboard(this)">
                            <i class="fas fa-copy"></i> Copy
                        </button>
                        <pre>curl -X POST \
     -H "Authorization: Bearer <?php echo API_BEARER_TOKEN; ?>" \
     -H "Content-Type: application/json" \
     -d '{
       "action": "create",
       "filename": "myapp.example.com",
       "type": "ssl-termination",
       "domain": "myapp.example.com",
       "ip": "10.8.100.200",
       "wildcard": false
     }' \
     "<?php echo $baseUrl; ?>/domains.php"</pre>
                    </div>

                    <strong>cURL Example (Passthrough):</strong>
                    <div class="code-block">
                        <button class="btn btn-sm btn-light copy-btn" onclick="copyToClipboard(this)">
                            <i class="fas fa-copy"></i> Copy
                        </button>
                        <pre>curl -X POST \
     -H "Authorization: Bearer <?php echo API_BEARER_TOKEN; ?>" \
     -H "Content-Type: application/json" \
     -d '{
       "action": "create",
       "filename": "myapp.example.com",
       "type": "passthrough",
       "domain": "myapp.example.com",
       "ip": "10.8.100.200",
       "wildcard": false
     }' \
     "<?php echo $baseUrl; ?>/domains.php"</pre>
                    </div>

                    <strong>cURL Example (Wildcard Domain):</strong>
                    <div class="code-block">
                        <button class="btn btn-sm btn-light copy-btn" onclick="copyToClipboard(this)">
                            <i class="fas fa-copy"></i> Copy
                        </button>
                        <pre>curl -X POST \
     -H "Authorization: Bearer <?php echo API_BEARER_TOKEN; ?>" \
     -H "Content-Type: application/json" \
     -d '{
       "action": "create",
       "filename": "apps.example.com",
       "type": "passthrough",
       "domain": ".apps.example.com",
       "ip": "10.8.100.100",
       "wildcard": true
     }' \
     "<?php echo $baseUrl; ?>/domains.php"</pre>
                    </div>
                </div>

                <!-- Update Domain -->
                <div class="endpoint">
                    <h4>
                        <span class="method-badge method-post">POST</span>
                        Update Domain
                    </h4>
                    <p>Update an existing domain configuration with custom YAML content.</p>

                    <strong>cURL Example:</strong>
                    <div class="code-block">
                        <button class="btn btn-sm btn-light copy-btn" onclick="copyToClipboard(this)">
                            <i class="fas fa-copy"></i> Copy
                        </button>
                        <pre>curl -X POST \
     -H "Authorization: Bearer <?php echo API_BEARER_TOKEN; ?>" \
     -H "Content-Type: application/json" \
     -d '{
       "action": "update",
       "filename": "myapp.example.com.yml",
       "content": "http:\n  routers:\n    myapp-http:\n      rule: Host(`myapp.example.com`)\n      service: myapp-service\n..."
     }' \
     "<?php echo $baseUrl; ?>/domains.php"</pre>
                    </div>
                </div>

                <!-- Delete Domain -->
                <div class="endpoint">
                    <h4>
                        <span class="method-badge method-post">POST</span>
                        Delete Domain
                    </h4>
                    <p>Delete a domain configuration.</p>

                    <strong>cURL Example:</strong>
                    <div class="code-block">
                        <button class="btn btn-sm btn-light copy-btn" onclick="copyToClipboard(this)">
                            <i class="fas fa-copy"></i> Copy
                        </button>
                        <pre>curl -X POST \
     -H "Authorization: Bearer <?php echo API_BEARER_TOKEN; ?>" \
     -H "Content-Type: application/json" \
     -d '{
       "action": "delete",
       "filename": "myapp.example.com.yml"
     }' \
     "<?php echo $baseUrl; ?>/domains.php"</pre>
                    </div>
                </div>

                <!-- Validate YAML -->
                <div class="endpoint">
                    <h4>
                        <span class="method-badge method-post">POST</span>
                        Validate YAML
                    </h4>
                    <p>Validate YAML syntax before saving.</p>

                    <strong>cURL Example:</strong>
                    <div class="code-block">
                        <button class="btn btn-sm btn-light copy-btn" onclick="copyToClipboard(this)">
                            <i class="fas fa-copy"></i> Copy
                        </button>
                        <pre>curl -X POST \
     -H "Authorization: Bearer <?php echo API_BEARER_TOKEN; ?>" \
     -H "Content-Type: application/json" \
     -d '{
       "action": "validate",
       "content": "http:\n  routers:\n    test:\n      rule: Host(`test.com`)"
     }' \
     "<?php echo $baseUrl; ?>/domains.php"</pre>
                    </div>
                </div>

                <!-- Get Logs -->
                <div class="endpoint">
                    <h4>
                        <span class="method-badge method-get">GET</span>
                        Get Audit Logs
                    </h4>
                    <p>Retrieve audit logs of all operations.</p>

                    <strong>cURL Example:</strong>
                    <div class="code-block">
                        <button class="btn btn-sm btn-light copy-btn" onclick="copyToClipboard(this)">
                            <i class="fas fa-copy"></i> Copy
                        </button>
                        <pre>curl -H "Authorization: Bearer <?php echo API_BEARER_TOKEN; ?>" \
     "<?php echo $baseUrl; ?>/logs.php?action=get"</pre>
                    </div>
                </div>

                <!-- Error Responses -->
                <div class="card mb-4">
                    <div class="card-header">
                        <h5><i class="fas fa-exclamation-triangle"></i> Error Responses</h5>
                    </div>
                    <div class="card-body">
                        <p>All errors return a JSON response with the following structure:</p>
                        <div class="code-block">
                            <pre>{
  "success": false,
  "message": "Error description"
}</pre>
                        </div>
                        <strong>HTTP Status Codes:</strong>
                        <ul>
                            <li><code>200</code> - Success</li>
                            <li><code>401</code> - Unauthorized (invalid or missing token)</li>
                            <li><code>400</code> - Bad Request (invalid parameters)</li>
                            <li><code>500</code> - Internal Server Error</li>
                        </ul>
                    </div>
                </div>

                <!-- Notes -->
                <div class="alert alert-info">
                    <h5><i class="fas fa-info-circle"></i> Important Notes</h5>
                    <ul class="mb-0">
                        <li>Always include the Bearer token in the <code>Authorization</code> header</li>
                        <li>All POST requests must have <code>Content-Type: application/json</code></li>
                        <li>Filenames are automatically generated from domain names</li>
                        <li>YAML syntax is validated before saving</li>
                        <li>All operations are logged in the audit log</li>
                    </ul>
                </div>

            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        function copyToClipboard(buttonElement) {
            let textToCopy = '';

            // If it's a button element, find the <pre> element in the same parent
            if (typeof buttonElement === 'object' && buttonElement.tagName === 'BUTTON') {
                // Get the parent div.code-block
                const codeBlock = buttonElement.closest('.code-block');
                if (codeBlock) {
                    const preElement = codeBlock.querySelector('pre');
                    if (preElement) {
                        textToCopy = preElement.textContent.trim();
                    }
                }
            } else {
                // If a string was passed directly
                textToCopy = buttonElement;
            }

            if (!textToCopy) {
                alert('Nothing to copy');
                return;
            }

            // Try modern clipboard API first
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(textToCopy).then(function() {
                    showCopySuccess();
                }).catch(function(err) {
                    // Fallback to old method
                    copyToClipboardFallback(textToCopy);
                });
            } else {
                // Use fallback method for HTTP or older browsers
                copyToClipboardFallback(textToCopy);
            }
        }

        function copyToClipboardFallback(text) {
            // Create temporary textarea
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.left = '-999999px';
            textarea.style.top = '-999999px';
            document.body.appendChild(textarea);

            // Select and copy
            textarea.focus();
            textarea.select();

            try {
                const successful = document.execCommand('copy');
                if (successful) {
                    showCopySuccess();
                } else {
                    alert('Failed to copy. Please copy manually.');
                }
            } catch (err) {
                alert('Failed to copy: ' + err);
            }

            // Remove temporary textarea
            document.body.removeChild(textarea);
        }

        function showCopySuccess() {
            // Show success message
            const toast = document.createElement('div');
            toast.className = 'alert alert-success';
            toast.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999;';
            toast.innerHTML = '<i class="fas fa-check"></i> Copied to clipboard!';
            document.body.appendChild(toast);

            setTimeout(function() {
                toast.remove();
            }, 2000);
        }
    </script>
</body>
</html>
