# DocuSmart: Integrated Document Management System (IDMS)
## Arsitektur & Spesifikasi Teknis MVP

### 1. Arsitektur Microservices
Sistem dibagi menjadi layanan independen yang berjalan di atas container (Docker) dan dikelola oleh API Gateway.

- **API Gateway**: Entry point tunggal. Menangani terminasi SSL, Rate Limiting, dan validasi JWT.
- **Auth & User Service**: Manajemen identitas, RBAC (Role-Based Access Control), dan sesi (Redis).
- **Document Management Service**: Logika inti (CRUD, Versioning Otomatis, Manajemen Folder).
- **Search Service**: Menggunakan Elasticsearch untuk pencarian teks penuh (Full-text search) di bawah 2 detik.
- **Audit & Permission Service**: Pencatatan log persisten dan manajemen ACL (Access Control List).
- **Notification Service**: Worker untuk pengiriman email via SMTP/SendGrid.

### 2. Skema Database Relasional (PostgreSQL)

```sql
-- Core Schema untuk DocuSmart

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'user', -- 'admin', 'user'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    parent_id UUID REFERENCES folders(id),
    owner_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folder_id UUID REFERENCES folders(id),
    owner_id UUID REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50),
    current_version_id UUID, -- Denormalisasi untuk performa pencarian
    is_encrypted BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    file_path TEXT NOT NULL, -- Path ke storage (S3/Local) dengan enkripsi AES-256
    file_size BIGINT, -- Max 50MB
    file_format VARCHAR(10), -- pdf, docx, xlsx
    uploaded_by UUID REFERENCES users(id),
    checksum TEXT, -- Untuk integritas data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id),
    user_id UUID REFERENCES users(id),
    access_level VARCHAR(20), -- 'view', 'edit', 'download'
    shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL, -- 'UPLOAD', 'RESTORE', 'SHARE', etc.
    resource_type VARCHAR(50), -- 'DOCUMENT', 'FOLDER'
    resource_id UUID,
    metadata JSONB, -- Detail perubahan (misal: "version 2 to version 1")
    ip_address VARCHAR(45),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Logika Bisnis: Versioning Otomatis (UC-07)
Ketika dokumen diunggah ke ID dokumen yang sudah ada:
1. Hitung `version_number` terakhir dari `document_versions`.
2. Simpan file baru dengan AES-256 encryption.
3. Masukkan record baru ke `document_versions` dengan `version_number++`.
4. Update `documents.current_version_id`.
5. Picu `Audit Log` entry.

### 4. Strategi Backup & Keamanan
- **Backup**: Cron job setiap 24 jam untuk dumping database ke storage terpisah (Off-site backup).
- **Keamanan**: Data-at-rest menggunakan AES-256. Data-in-transit menggunakan TLS 1.3. Pengecekan Magic Number untuk validasi format file (bukan sekadar ekstensi).
