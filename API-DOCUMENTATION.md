# Traefik Manager API Documentation

## Authentication

The API supports two authentication methods:

### 1. Session-based (Web Interface)
- Login via `/login.php`
- Session is maintained automatically

### 2. Bearer Token (External Access)
- Include the token in the Authorization header
- **Token:** `traefik_5f4dcc3b5aa765d61d8327deb882cf99_manager_2025`

**Example:**
```bash
curl -H "Authorization: Bearer traefik_5f4dcc3b5aa765d61d8327deb882cf99_manager_2025" \
     http://YOUR_IP/traefik-manager/api/domains.php?action=list
```

---

## API Endpoints

### Base URL
```
http://YOUR_IP/traefik-manager/api/
```

---

## Domains API

### 1. List All Domains
**Endpoint:** `GET /api/domains.php?action=list`

**Response:**
```json
{
  "success": true,
  "message": "Domains retrieved successfully",
  "data": {
    "domains": [
      {
        "filename": "apache1.yml",
        "type": "ssl-termination",
        "domain": "apache1.teste.techify.run",
        "ip": "10.8.100.101",
        "isWildcard": false,
        "size": 677,
        "modified": 1729754400
      }
    ]
  }
}
```

**cURL Example:**
```bash
curl -H "Authorization: Bearer traefik_5f4dcc3b5aa765d61d8327deb882cf99_manager_2025" \
     http://YOUR_IP/traefik-manager/api/domains.php?action=list
```

---

### 2. Get Single Domain
**Endpoint:** `GET /api/domains.php?action=get&file=apache1.yml`

**Response:**
```json
{
  "success": true,
  "message": "Domain retrieved successfully",
  "data": {
    "filename": "apache1.yml",
    "content": "http:\n  routers:...",
    "info": {
      "type": "ssl-termination",
      "domain": "apache1.teste.techify.run",
      "ip": "10.8.100.101",
      "isWildcard": false
    }
  }
}
```

**cURL Example:**
```bash
curl -H "Authorization: Bearer traefik_5f4dcc3b5aa765d61d8327deb882cf99_manager_2025" \
     "http://YOUR_IP/traefik-manager/api/domains.php?action=get&file=apache1.yml"
```

---

### 3. Create New Domain
**Endpoint:** `POST /api/domains.php`

**Request Body:**
```json
{
  "action": "create",
  "filename": "apache3",
  "type": "ssl-termination",
  "domain": "apache3.teste.techify.run",
  "ip": "10.8.100.103",
  "wildcard": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Domain created successfully",
  "data": {
    "filename": "apache3.yml",
    "content": "http:\n  routers:..."
  }
}
```

**cURL Example:**
```bash
curl -X POST \
     -H "Authorization: Bearer traefik_5f4dcc3b5aa765d61d8327deb882cf99_manager_2025" \
     -H "Content-Type: application/json" \
     -d '{
       "action": "create",
       "filename": "apache3",
       "type": "ssl-termination",
       "domain": "apache3.teste.techify.run",
       "ip": "10.8.100.103",
       "wildcard": false
     }' \
     http://YOUR_IP/traefik-manager/api/domains.php
```

**Domain Types:**
- `ssl-termination` - Traefik manages SSL certificate (Let's Encrypt)
- `passthrough` - Backend manages SSL certificate

---

### 4. Update Domain
**Endpoint:** `POST /api/domains.php`

**Request Body:**
```json
{
  "action": "update",
  "filename": "apache3.yml",
  "content": "http:\n  routers:\n    apache3-http:..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Domain updated successfully",
  "data": {
    "filename": "apache3.yml"
  }
}
```

**cURL Example:**
```bash
curl -X POST \
     -H "Authorization: Bearer traefik_5f4dcc3b5aa765d61d8327deb882cf99_manager_2025" \
     -H "Content-Type: application/json" \
     -d '{
       "action": "update",
       "filename": "apache3.yml",
       "content": "http:\n  routers:..."
     }' \
     http://YOUR_IP/traefik-manager/api/domains.php
```

---

### 5. Delete Domain
**Endpoint:** `POST /api/domains.php`

**Request Body:**
```json
{
  "action": "delete",
  "filename": "apache3.yml"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Domain deleted successfully"
}
```

**cURL Example:**
```bash
curl -X POST \
     -H "Authorization: Bearer traefik_5f4dcc3b5aa765d61d8327deb882cf99_manager_2025" \
     -H "Content-Type: application/json" \
     -d '{
       "action": "delete",
       "filename": "apache3.yml"
     }' \
     http://YOUR_IP/traefik-manager/api/domains.php
```

---

### 6. Validate YAML
**Endpoint:** `POST /api/domains.php`

**Request Body:**
```json
{
  "action": "validate",
  "content": "http:\n  routers:..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Valid YAML",
  "data": {
    "valid": true
  }
}
```

---

## Logs API

### 1. Get Logs
**Endpoint:** `GET /api/logs.php?action=get`

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [
      "[2025-10-24 10:30:45] admin - CREATE - apache3.yml - Domain: apache3.teste.techify.run",
      "[2025-10-24 10:31:12] api-user - UPDATE - apache2.yml - Domain: apache2.teste.techify.run"
    ]
  }
}
```

**cURL Example:**
```bash
curl -H "Authorization: Bearer traefik_5f4dcc3b5aa765d61d8327deb882cf99_manager_2025" \
     http://YOUR_IP/traefik-manager/api/logs.php?action=get
```

---

## Error Responses

All errors return:
```json
{
  "success": false,
  "message": "Error description"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `401` - Unauthorized (invalid or missing token)
- `400` - Bad Request (invalid parameters)
- `500` - Internal Server Error

---

## Security Notes

1. **Bearer Token:** Keep the token secret and secure
2. **HTTPS:** Always use HTTPS in production
3. **CORS:** API allows cross-origin requests (configured for external access)
4. **Audit Logs:** All operations are logged with timestamp and user

---

## Web Interface

Access the web interface at:
```
http://YOUR_IP/traefik-manager/
```

**Credentials:**
- Username: `admin`
- Password: (Olhar no arquivo config.php)

---

## Complete Example: Create Wildcard Passthrough Domain

```bash
curl -X POST \
     -H "Authorization: Bearer traefik_5f4dcc3b5aa765d61d8327deb882cf99_manager_2025" \
     -H "Content-Type: application/json" \
     -d '{
       "action": "create",
       "filename": "coolify",
       "type": "passthrough",
       "domain": ".thiago.teste.techify.run",
       "ip": "10.8.100.100",
       "wildcard": true
     }' \
     http://YOUR_IP/traefik-manager/api/domains.php
```

This will create a wildcard passthrough configuration for `*.thiago.teste.techify.run` pointing to `10.8.100.100`.
