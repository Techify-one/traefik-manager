<?php
/**
 * Dashboard - Main Interface
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/functions.php';

// Require login
requireLogin();

$csrfToken = generateCsrfToken();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo APP_NAME; ?> - Dashboard</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="assets/css/custom.css">
</head>
<body>
    <!-- Navbar -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
        <div class="container-fluid">
            <a class="navbar-brand" href="#">
                <i class="fas fa-network-wired"></i> <?php echo APP_NAME; ?>
            </a>
            <div class="d-flex align-items-center">
                <span class="text-white me-3">
                    <i class="fas fa-user"></i> <?php echo getCurrentUser(); ?>
                </span>
                <a href="api-docs.php" class="btn btn-outline-light btn-sm">
                    <i class="fas fa-code"></i> API
                </a>
                <button class="btn btn-outline-light btn-sm ms-2" onclick="viewLogs()">
                    <i class="fas fa-file-alt"></i> Logs
                </button>
                <a href="logout.php" class="btn btn-outline-light btn-sm ms-2">
                    <i class="fas fa-sign-out-alt"></i> Logout
                </a>
            </div>
        </div>
    </nav>

    <!-- Main Content -->
    <div class="container-fluid mt-4">
        <!-- Header -->
        <div class="row mb-4">
            <div class="col">
                <h2><i class="fas fa-globe"></i> Domains Management</h2>
                <p class="text-muted">Manage Traefik dynamic configurations</p>
            </div>
            <div class="col-auto">
                <button class="btn btn-primary btn-lg" onclick="showAddDomainModal()">
                    <i class="fas fa-plus"></i> Add Domain
                </button>
            </div>
        </div>

        <!-- Loading Spinner -->
        <div id="loadingSpinner" class="text-center py-5" style="display: none;">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>

        <!-- Domains Table -->
        <div class="card shadow-sm">
            <div class="card-body">
                <!-- Search Bar -->
                <div class="row mb-3">
                    <div class="col-md-6">
                        <div class="input-group">
                            <span class="input-group-text">
                                <i class="fas fa-search"></i>
                            </span>
                            <input type="text" class="form-control" id="searchInput" placeholder="Search by domain or IP..." onkeyup="filterDomains()">
                        </div>
                    </div>
                </div>
                <div class="table-responsive">
                    <table class="table table-hover" id="domainsTable">
                        <thead>
                            <tr>
                                <th>Domain</th>
                                <th>Type</th>
                                <th>IP</th>
                                <th>Wildcard</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="domainsTableBody">
                            <!-- Populated by JavaScript -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <!-- Add/Edit Domain Modal -->
    <div class="modal fade" id="domainModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="modalTitle">
                        <i class="fas fa-plus"></i> Add Domain
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <!-- Tabs -->
                    <ul class="nav nav-tabs mb-3" id="domainTabs" role="tablist">
                        <li class="nav-item" role="presentation">
                            <button class="nav-link active" id="simple-tab" data-bs-toggle="tab" data-bs-target="#simple" type="button">
                                <i class="fas fa-edit"></i> Simple Form
                            </button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" id="advanced-tab" data-bs-toggle="tab" data-bs-target="#advanced" type="button">
                                <i class="fas fa-code"></i> Advanced Editor
                            </button>
                        </li>
                    </ul>

                    <!-- Tab Content -->
                    <div class="tab-content" id="domainTabContent">
                        <!-- Simple Form Tab -->
                        <div class="tab-pane fade show active" id="simple" role="tabpanel">
                            <form id="domainForm">
                                <!-- Hidden filename field (auto-generated) -->
                                <input type="hidden" id="domainFilename">

                                <div class="mb-3">
                                    <label class="form-label">Type</label>
                                    <div>
                                        <div class="form-check form-check-inline">
                                            <input class="form-check-input" type="radio" name="domainType" id="typeSSL" value="ssl-termination" checked>
                                            <label class="form-check-label" for="typeSSL">
                                                <i class="fas fa-lock"></i> SSL Termination (Traefik manages certificate)
                                            </label>
                                        </div>
                                        <div class="form-check form-check-inline">
                                            <input class="form-check-input" type="radio" name="domainType" id="typePassthrough" value="passthrough">
                                            <label class="form-check-label" for="typePassthrough">
                                                <i class="fas fa-arrow-right"></i> Passthrough (Backend manages certificate)
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label for="domainName" class="form-label">Domain</label>
                                        <input type="text" class="form-control" id="domainName" placeholder="example.teste.techify.one" required onkeyup="updateFilenameFromDomain()">
                                        <small class="text-muted">Protocol and paths will be removed automatically</small>
                                    </div>

                                    <div class="col-md-6 mb-3">
                                        <label for="domainIP" class="form-label">Backend IP</label>
                                        <input type="text" class="form-control" id="domainIP" placeholder="10.8.100.xxx" required pattern="^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$">
                                    </div>
                                </div>

                                <div class="mb-3">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="domainWildcard">
                                        <label class="form-check-label" for="domainWildcard">
                                            Use Wildcard (matches *.domain.com)
                                        </label>
                                    </div>
                                    <div class="form-check mt-2">
                                        <input class="form-check-input" type="checkbox" id="domainEnableHttps" checked>
                                        <label class="form-check-label" for="domainEnableHttps">
                                            Enable HTTPS proxy (uncheck for HTTP-only)
                                        </label>
                                    </div>
                                </div>
                            </form>
                        </div>

                        <!-- Advanced Editor Tab -->
                        <div class="tab-pane fade" id="advanced" role="tabpanel">
                            <div class="mb-3">
                                <label for="yamlEditor" class="form-label">YAML Content</label>
                                <textarea class="form-control font-monospace" id="yamlEditor" rows="15" style="font-size: 12px;"></textarea>
                                <small class="text-muted">Edit the YAML content directly. Syntax will be validated before saving.</small>
                            </div>
                            <div id="yamlValidationResult"></div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-primary" onclick="saveDomain()">
                        <i class="fas fa-save"></i> Save
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div class="modal fade" id="deleteModal" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header bg-danger text-white">
                    <h5 class="modal-title">
                        <i class="fas fa-exclamation-triangle"></i> Confirm Delete
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <p>Are you sure you want to delete this domain?</p>
                    <div class="alert alert-warning">
                        <strong>File:</strong> <span id="deleteFilename"></span><br>
                        <strong>Domain:</strong> <span id="deleteDomain"></span>
                    </div>
                    <p class="text-danger">This action cannot be undone.</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-danger" onclick="confirmDelete()">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Logs Modal -->
    <div class="modal fade" id="logsModal" tabindex="-1">
        <div class="modal-dialog modal-xl">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">
                        <i class="fas fa-file-alt"></i> Audit Logs
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="font-monospace" id="logsContent" style="max-height: 500px; overflow-y: auto; font-size: 12px;">
                        Loading...
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    <script src="assets/js/app.js"></script>
    <script>
        // Pass CSRF token to JavaScript
        window.CSRF_TOKEN = '<?php echo $csrfToken; ?>';
    </script>
</body>
</html>
