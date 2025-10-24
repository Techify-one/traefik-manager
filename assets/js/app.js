/**
 * Traefik Manager - JavaScript Application
 */

// Global variables
let domains = [];
let currentEditingFile = null;
let currentDeletingDomain = null;
let domainModal, deleteModal, logsModal;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Bootstrap modals
    domainModal = new bootstrap.Modal(document.getElementById('domainModal'));
    deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
    logsModal = new bootstrap.Modal(document.getElementById('logsModal'));

    // Load domains
    loadDomains();
});

/**
 * API Request Helper
 */
async function apiRequest(url, method = 'GET', data = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, options);
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        showToast('Error connecting to API', 'danger');
        return { success: false, message: error.message };
    }
}

/**
 * Load all domains
 */
async function loadDomains() {
    showLoading(true);

    const result = await apiRequest('api/domains.php?action=list');

    if (result.success) {
        domains = result.data.domains;
        renderDomainsTable();
    } else {
        showToast(result.message, 'danger');
    }

    showLoading(false);
}

/**
 * Render domains table
 */
function renderDomainsTable() {
    const tbody = document.getElementById('domainsTableBody');

    if (domains.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted py-4">
                    <i class="fas fa-inbox fa-3x mb-3 d-block"></i>
                    No domains found. Click "Add Domain" to create your first one.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = domains.map(domain => `
        <tr style="cursor: pointer;" onclick="editDomain('${escapeHtml(domain.filename)}')">
            <td>${escapeHtml(domain.domain)}</td>
            <td>
                <span class="badge ${domain.type === 'ssl-termination' ? 'badge-type-ssl' : 'badge-type-passthrough'}">
                    ${domain.type === 'ssl-termination' ? 'SSL Termination' : 'Passthrough'}
                </span>
            </td>
            <td><code>${escapeHtml(domain.ip)}</code></td>
            <td>
                ${domain.isWildcard ? '<i class="fas fa-check text-success"></i>' : '<i class="fas fa-times text-muted"></i>'}
            </td>
            <td onclick="event.stopPropagation()">
                <button class="btn btn-sm btn-primary btn-action" onclick="editDomain('${escapeHtml(domain.filename)}')" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger btn-action" onclick="showDeleteConfirmation('${escapeHtml(domain.filename)}', '${escapeHtml(domain.domain)}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

/**
 * Filter domains by search input
 */
function filterDomains() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const rows = document.querySelectorAll('#domainsTableBody tr');

    rows.forEach(row => {
        // Skip the "no domains" message row
        if (row.cells.length < 5) {
            return;
        }

        const domain = row.cells[0].textContent.toLowerCase();
        const ip = row.cells[2].textContent.toLowerCase();

        if (domain.includes(searchTerm) || ip.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

/**
 * Show add domain modal
 */
function showAddDomainModal() {
    currentEditingFile = null;

    // Reset form
    document.getElementById('domainForm').reset();
    document.getElementById('yamlEditor').value = '';
    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-plus"></i> Add Domain';

    // Switch to simple tab
    document.getElementById('simple-tab').click();

    // Show modal
    domainModal.show();

    updateExample();
}

/**
 * Edit domain
 */
async function editDomain(filename) {
    currentEditingFile = filename;

    // Load domain data
    const result = await apiRequest(`api/domains.php?action=get&file=${filename}`);

    if (!result.success) {
        showToast(result.message, 'danger');
        return;
    }

    const domain = result.data;

    // Populate form
    document.getElementById('domainFilename').value = filename.replace('.yml', '');
    document.getElementById('domainName').value = domain.info.domain;
    document.getElementById('domainIP').value = domain.info.ip;
    document.getElementById('domainWildcard').checked = domain.info.isWildcard;
    document.getElementById('domainEnableHttps').checked = domain.info.enableHttps !== false; // Default true

    // Set type
    if (domain.info.type === 'ssl-termination') {
        document.getElementById('typeSSL').checked = true;
    } else {
        document.getElementById('typePassthrough').checked = true;
    }

    // Set YAML editor content
    document.getElementById('yamlEditor').value = domain.content;

    // Update modal title
    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-edit"></i> Edit Domain';

    // Show modal
    domainModal.show();

    updateExample();
}

/**
 * Save domain
 */
async function saveDomain() {
    // Check which tab is active
    const activeTab = document.querySelector('#domainTabs .nav-link.active').id;

    let result;
    let alreadyProcessed = false;

    if (activeTab === 'simple-tab') {
        // Get form data
        const filename = document.getElementById('domainFilename').value.trim() || generateFilename(document.getElementById('domainName').value);
        const type = document.querySelector('input[name="domainType"]:checked').value;
        const domain = document.getElementById('domainName').value.trim();
        const ip = document.getElementById('domainIP').value.trim();
        const wildcard = document.getElementById('domainWildcard').checked;
        const enableHttps = document.getElementById('domainEnableHttps').checked;

        // Validate
        if (!filename || !domain || !ip) {
            showToast('Please fill all required fields', 'warning');
            return;
        }

        // Check if creating or updating
        if (currentEditingFile) {
            // Editing existing domain
            const newFilename = filename.endsWith('.yml') ? filename : filename + '.yml';
            const filenameChanged = currentEditingFile !== newFilename;

            // First, generate the YAML content
            const generateResult = await apiRequest('api/domains.php', 'POST', {
                action: 'generate',
                type: type,
                domain: domain,
                ip: ip,
                wildcard: wildcard,
                enableHttps: enableHttps,
                name: filename
            });

            if (!generateResult.success) {
                showToast(generateResult.message, 'danger');
                return;
            }

            if (filenameChanged) {
                // Filename changed - create new file and delete old one
                // First create the new file
                const createResult = await apiRequest('api/domains.php', 'POST', {
                    action: 'create',
                    filename: filename,
                    type: type,
                    domain: domain,
                    ip: ip,
                    wildcard: wildcard,
                    enableHttps: enableHttps
                });

                if (!createResult.success) {
                    showToast(createResult.message, 'danger');
                    return;
                }

                // Delete the old file
                const deleteResult = await apiRequest('api/domains.php', 'POST', {
                    action: 'delete',
                    filename: currentEditingFile
                });

                if (!deleteResult.success) {
                    showToast('Warning: Could not delete old file: ' + deleteResult.message, 'warning');
                }

                result = createResult;
                alreadyProcessed = true;
            } else {
                // Filename didn't change - just update the content
                result = await apiRequest('api/domains.php', 'POST', {
                    action: 'update',
                    filename: currentEditingFile,
                    content: generateResult.data.content
                });
                alreadyProcessed = true;
            }
        } else {
            // Creating new domain
            result = await apiRequest('api/domains.php', 'POST', {
                action: 'create',
                filename: filename,
                type: type,
                domain: domain,
                ip: ip,
                wildcard: wildcard,
                enableHttps: enableHttps
            });
            alreadyProcessed = true;
        }
    } else {
        // Advanced editor - update with YAML content
        const filename = currentEditingFile || document.getElementById('domainFilename').value.trim() + '.yml';
        const content = document.getElementById('yamlEditor').value;

        if (!content.trim()) {
            showToast('YAML content cannot be empty', 'warning');
            return;
        }

        // Validate YAML
        const validation = await apiRequest('api/domains.php', 'POST', {
            action: 'validate',
            content: content
        });

        if (!validation.data.valid) {
            showToast('Invalid YAML syntax', 'danger');
            return;
        }

        result = await apiRequest('api/domains.php', 'POST', {
            action: currentEditingFile ? 'update' : 'create',
            filename: filename,
            content: content
        });
        alreadyProcessed = true;
    }

    // Process result
    if (result.success) {
        showToast('Domain saved successfully', 'success');
        domainModal.hide();
        loadDomains();
    } else {
        showToast(result.message, 'danger');
    }
}

/**
 * Show delete confirmation
 */
function showDeleteConfirmation(filename, domain) {
    currentDeletingDomain = filename;

    document.getElementById('deleteFilename').textContent = filename;
    document.getElementById('deleteDomain').textContent = domain;

    deleteModal.show();
}

/**
 * Confirm delete
 */
async function confirmDelete() {
    if (!currentDeletingDomain) return;

    const result = await apiRequest('api/domains.php', 'POST', {
        action: 'delete',
        filename: currentDeletingDomain
    });

    if (result.success) {
        showToast('Domain deleted successfully', 'success');
        deleteModal.hide();
        loadDomains();
    } else {
        showToast(result.message, 'danger');
    }

    currentDeletingDomain = null;
}

/**
 * View logs
 */
async function viewLogs() {
    document.getElementById('logsContent').textContent = 'Loading logs...';
    logsModal.show();

    // Get logs via API
    const result = await apiRequest('api/logs.php?action=get');

    if (result.success && result.data.logs.length > 0) {
        document.getElementById('logsContent').textContent = result.data.logs.join('\n');
    } else {
        document.getElementById('logsContent').textContent = 'No logs available.';
    }
}

/**
 * Update filename from domain
 */
function updateFilenameFromDomain() {
    const domain = document.getElementById('domainName').value;
    if (domain) {
        const filename = generateFilename(domain);
        document.getElementById('domainFilename').value = filename;
    }
}

/**
 * Generate filename from domain
 * Returns the full domain as filename (e.g., "apache1.teste.techify.one")
 */
function generateFilename(domain) {
    // Remove protocol, www, and wildcard
    domain = domain.replace(/^(https?:\/\/)?(www\.)?(\*\.)?/, '');

    // Remove trailing slashes and paths
    domain = domain.replace(/[\/\?#].*$/, '');

    // Remove spaces
    domain = domain.trim();

    return domain;
}

/**
 * Show loading spinner
 */
function showLoading(show) {
    document.getElementById('loadingSpinner').style.display = show ? 'block' : 'none';
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer') || createToastContainer();

    const toast = document.createElement('div');
    toast.className = `alert alert-${type} alert-dismissible fade show`;
    toast.role = 'alert';
    toast.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 5000);
}

/**
 * Create toast container
 */
function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    document.body.appendChild(container);
    return container;
}

/**
 * Format date
 */
function formatDate(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
