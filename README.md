# A Safe, Offline Chatbot for Company Files

A local-first AI document assistant designed to help employees search and understand company documents while protecting sensitive information through access control, privacy filtering, and security evaluation.

---

## Overview

Companies maintain documents containing internal processes, project details, employee information, and confidential business data. Employees may use external AI tools to understand these documents, potentially exposing sensitive information.

**A Safe, Offline Chatbot for Company Files** aims to provide an alternative by running a language model locally and retrieving information from authorized company documents.

The system combines document-based question answering, permission-controlled retrieval, sensitive-data detection, and security testing in one application.

---

## Problem Statement

Using external AI services to process confidential company documents can create data exposure risks. At the same time, restricting AI assistance entirely can make it harder for employees to find and understand information.

The project explores how a local AI assistant can provide useful document-based answers while enforcing access permissions and applying privacy safeguards.

---

## Proposed Solution

The application allows users to ask questions about company documents through a web interface.

When a user submits a question, the system:

1. Authenticates the user and checks their document permissions.
2. Retrieves relevant passages from documents the user is authorized to access.
3. Detects and transforms sensitive information according to configured privacy rules.
4. Sends the permitted, processed context to a locally running language model.
5. Returns an answer with source document references.
6. Records relevant events for auditing and security evaluation.

The application also plans to support access requests for restricted documents and controlled security tests.

---

## Key Features

- **Local AI processing:** Run a language model locally using Ollama.
- **Document question answering:** Search PDF and DOCX documents and generate context-based answers.
- **Role-based access control:** Restrict document access according to user permissions.
- **Privacy filtering:** Detect and mask selected sensitive information using Microsoft Presidio and custom rules.
- **Privacy review:** Compare original document text with its transformed version.
- **Source references:** Show document and page references for retrieved information.
- **Access requests:** Allow users to request access to restricted project documents.
- **Security evaluation:** Test unauthorized retrieval, sensitive-data leakage, and prompt injection using controlled test cases.
- **Audit records:** Track important actions and security-related events.

---

## Technology Stack

| Component | Technology | Implementation Status | Purpose |
|---|---|---|---|
| **Backend API** | Python 3.11+, FastAPI | **Implemented (Day 1)** | High-performance REST APIs, endpoints, and application logic |
| **Web Server** | Uvicorn (ASGI) | **Implemented (Day 1)** | Asynchronous ASGI server for development & production |
| **Frontend** | React, TypeScript | *Planned* | User interface and chat workflow |
| **Styling** | Tailwind CSS / Vanilla CSS | *Planned* | Responsive and consistent interface design |
| **Frontend Tooling** | Vite | *Planned* | Modern dev server and optimized production bundler |
| **Database** | PostgreSQL | *Planned* | Stores users, permissions, document chunks, and audit logs |
| **Semantic Retrieval** | pgvector / Full-text search | *Planned* | Vector search for semantic document chunk matching |
| **PDF Processing** | PyMuPDF | *Planned* | Extract text and page coordinates from PDFs |
| **Word Processing** | python-docx | *Planned* | Extract structured text from DOCX files |
| **Local Model Runtime** | Ollama | *Planned* | Runs local open-source LLMs (e.g. Llama 3, Mistral) offline |
| **Privacy Protection** | Microsoft Presidio + Custom Rules | *Planned* | PII detection, redaction, and data masking |
| **Testing** | pytest | *Planned* | Automated backend, integration, and security tests |
| **Version Control** | Git & GitHub | **Active** | Source control with safety guardrails |

---

## System Architecture

```text
                    User
                     |
                     v
          React + TypeScript Frontend
                     |
                     v
               FastAPI Backend
                     |
                     v
        Authentication and Authorization
                     |
                     v
          Permission-Filtered Retrieval
                     |
                     v
           Privacy Processing Pipeline
                     |
                     v
             Ollama + Local LLM
                     |
                     v
            Answer and Source References
                     |
                     v
                  Frontend
```

Supporting workflows include document ingestion, access-request approval, audit logging, and security evaluation.

### Document Ingestion Pipeline

```text
PDF / DOCX Upload
        |
        v
File Validation
        |
        v
Text Extraction (PyMuPDF / python-docx)
        |
        v
Text Chunking & Embedding Generation
        |
        v
PostgreSQL + pgvector Storage
```

---

## User Roles

- **Employee:** Ask questions and access documents permitted for their account.
- **Project Expert:** Review access requests for assigned projects and make approval decisions.
- **Administrator:** Manage user accounts, permissions, privacy rules, and security evaluation settings.

Access is enforced by the backend. A user's role alone does not automatically grant access to every confidential document.

---

## 📅 Implementation Status

### ✅ Implemented — Authentication & Authorization
- [x] Secure user signup (`POST /auth/signup`) with strong password validation and email normalization.
- [x] Login with Argon2 password hashing, JWT access tokens, and sliding-window rate limiting (`POST /auth/login`).
- [x] Authenticated user profile retrieval (`GET /auth/me`).
- [x] Role-based access: `employee`, `project_expert`, `admin`. Roles are server-enforced; admin role alone does not grant document read access.
- [x] Administrator CLI provisioning script (`backend/scripts/create_admin.py`).
- [x] SQL migration: [`database/migrations/001_add_password_hash_to_users.sql`](database/migrations/001_add_password_hash_to_users.sql).

### ✅ Implemented — Secure Document Upload
- [x] `POST /documents/upload` — accepts only `.pdf` and `.docx` files.
- [x] Files streamed to `backend/private_uploads/` using UUID-randomized filenames (never served statically).
- [x] 10 MB upload size limit enforced while streaming.
- [x] Rejects empty files, invalid extensions, corrupt PDFs/DOCX, password-protected PDFs, and documents with no extractable text.
- [x] Atomic transaction: file deleted and DB rolled back on any failure.

### ✅ Implemented — Document Access Control
- [x] `GET /documents` — lists only documents the authenticated user is authorized to access.
- [x] `GET /documents/{id}` — returns safe metadata (no text, no storage path) with IDOR protection.
- [x] `POST /documents/{id}/permissions` — grants read access; restricted to document owner or admin.
- [x] `DELETE /documents/{id}/permissions/{user_id}` — revokes access immediately.
- [x] Prevents self-grant, owner redundant grant, and unauthorized permission management.

### ✅ Implemented — Persistent Extracted Text Storage
- [x] Extracted text persisted atomically with document record in a single DB transaction.
- [x] `GET /documents/{id}/text` — retrieves persisted text pages with zero-trust authorization.
- [x] SQL migration: [`database/migrations/002_create_document_text_pages.sql`](database/migrations/002_create_document_text_pages.sql).
- [x] Full test coverage: PDF persistence, DOCX persistence, authorized access, revocation, zero-trust admin enforcement, DB failure rollback.

### ⏳ Planned for Upcoming Phases
- [ ] **Phase 4:** Ollama integration & local LLM orchestration (RAG pipeline).
- [ ] **Phase 5:** Privacy Guardrails (Presidio PII redaction, prompt injection defense).
- [ ] **Phase 6:** React + Vite frontend web interface.
- [ ] **Phase 7:** Access-request workflow and audit logging.

---

## 🗄️ Database Schema

### `users`
Stores authenticated user accounts. Passwords are stored as Argon2 hashes; plaintext passwords are never persisted.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `INTEGER` | `PRIMARY KEY` | Auto-increment |
| `email` | `VARCHAR(255)` | `UNIQUE NOT NULL` | Normalized to lowercase on write |
| `full_name` | `VARCHAR(150)` | `NOT NULL` | |
| `password_hash` | `VARCHAR(255)` | `NOT NULL` | Argon2 hash only |
| `role` | `VARCHAR(30)` | `NOT NULL DEFAULT 'employee'` | `employee`, `project_expert`, `admin` |
| `is_active` | `BOOLEAN` | `NOT NULL DEFAULT TRUE` | Inactive accounts cannot log in |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | UTC |

### `documents`
Stores metadata for uploaded company documents. File contents are never exposed through this table.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `INTEGER` | `PRIMARY KEY` | |
| `title` | `VARCHAR(255)` | `NOT NULL` | Original filename |
| `filename` | `VARCHAR(255)` | `NOT NULL` | Original filename |
| `storage_path` | `VARCHAR(500)` | `NOT NULL` | Private filesystem path; never served publicly |
| `owner_id` | `INTEGER` | `FK → users.id NOT NULL` | |
| `status` | `VARCHAR(30)` | `NOT NULL DEFAULT 'uploaded'` | |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | UTC |

### `document_permissions`
Explicit per-user read grants. An admin role alone does not grant read access without a row in this table.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `INTEGER` | `PRIMARY KEY` | |
| `document_id` | `INTEGER` | `FK → documents.id ON DELETE CASCADE` | |
| `user_id` | `INTEGER` | `FK → users.id ON DELETE CASCADE` | |
| `can_read` | `BOOLEAN` | `NOT NULL DEFAULT TRUE` | |
| `granted_by` | `INTEGER` | `FK → users.id NULLABLE` | |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | UTC |

**Unique constraint:** `(document_id, user_id)` — one permission row per user per document.

### `document_text_pages`
Persists extracted text from uploaded documents at the page level. Cascades on document deletion.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `INTEGER` | `PRIMARY KEY` | |
| `document_id` | `INTEGER` | `FK → documents.id ON DELETE CASCADE NOT NULL` | Indexed |
| `page_number` | `INTEGER` | `NULLABLE` | `1`-indexed for PDFs; `NULL` for DOCX files |
| `text_content` | `TEXT` | `NOT NULL` | Extracted text for this page/section |
| `char_count` | `INTEGER` | `NOT NULL` | Character count of `text_content` |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | UTC |

**Indexes:** `idx_document_text_pages_document_id`, `idx_document_text_pages_doc_page (document_id, page_number)`.

> **Known Limitation — DOCX Page Boundaries:** The `python-docx` library extracts text at the paragraph level and does not provide reliable page number information. DOCX documents are stored as a single row with `page_number = NULL`. PDF documents produced by PyMuPDF preserve page-level boundaries with 1-indexed page numbers.

---

## 🔄 Database Migrations

Migrations are plain SQL scripts in [`database/migrations/`](database/migrations/). They are designed to be **idempotent** (safe to run multiple times) and **non-destructive** (they never drop or recreate existing tables).

### Applying Migrations

From the `backend/` directory with the `.venv` activated:

```powershell
# Apply migration 001 (adds password_hash to users)
Get-Content ..\ database\migrations\001_add_password_hash_to_users.sql | psql -U <username> -d safe_company_chatbot

# Apply migration 002 (creates document_text_pages table)
Get-Content ..\database\migrations\002_create_document_text_pages.sql | psql -U <username> -d safe_company_chatbot
```

Or using the Python helper (which uses the configured `DATABASE_URL` from `.env`):

```powershell
.venv\Scripts\python.exe -c "
from app.database import engine
from sqlalchemy import text
from pathlib import Path
sql = Path('../database/migrations/002_create_document_text_pages.sql').read_text()
with engine.begin() as conn: conn.execute(text(sql))
print('Migration applied.')
"
```

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `POST` | `/auth/signup` | No | Register a new employee account |
| `POST` | `/auth/login` | No | Obtain a JWT access token |
| `GET` | `/auth/me` | Bearer JWT | Return the authenticated user's profile |

### Documents
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `POST` | `/documents/upload` | Bearer JWT | Upload and process a PDF or DOCX document |
| `GET` | `/documents` | Bearer JWT | List authorized documents (owned or explicitly granted) |
| `GET` | `/documents/{id}` | Bearer JWT | Retrieve safe document metadata (no text exposed) |
| `GET` | `/documents/{id}/text` | Bearer JWT | Retrieve persisted extracted text (zero-trust; see below) |
| `POST` | `/documents/{id}/permissions` | Bearer JWT | Grant read access (owner or admin only) |
| `DELETE` | `/documents/{id}/permissions/{user_id}` | Bearer JWT | Revoke access (owner or admin only; immediate effect) |

### Text Retrieval Authorization Policy (`GET /documents/{id}/text`)
- ✅ **Document owner** — always authorized.
- ✅ **Employee with `can_read=True` explicit grant** — authorized.
- ❌ **Administrator without explicit grant** — `403 Forbidden`. Admin role alone does not grant text access.
- ❌ **Unauthorized employee** — `403 Forbidden`.
- ❌ **Revoked permission** — immediately `403 Forbidden` (no caching).
- ❌ **Unauthenticated** — `401 Unauthorized`.
- ❌ **Nonexistent document** — `404 Not Found`.

---

## 🚀 Getting Started (Day 1 Backend Setup)

### 1. Prerequisites
Ensure you have the following installed on your machine:
- **Python**: Version 3.10+ (tested on Python 3.11.9)
- **Git**: Version 2.x
- **Node.js & npm**: (For future frontend phase)
- **Ollama**: (For future local LLM phase)

---

### 2. Activate the Virtual Environment (Windows)

Open **PowerShell** or **Command Prompt** and navigate to the `backend/` directory:

```powershell
cd backend
```

#### In PowerShell:
```powershell
.\.venv\Scripts\Activate.ps1
```

> **Note for PowerShell Users:**
> If script execution is restricted, run this one-time command in PowerShell:
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
> ```

#### In Command Prompt (`cmd.exe`):
```cmd
.venv\Scripts\activate.bat
```

Once activated, `(.venv)` will appear in your prompt prefix.

---

### 3. Install Dependencies

If setting up on a fresh machine or teammate's clone:

```bash
pip install -r requirements.txt
```

---

### 4. Run the Backend Server

From the `backend/` directory (with `.venv` activated):

```bash
uvicorn app.main:app --reload
```

- `--reload` enables auto-reload so the server automatically refreshes whenever you edit Python files.

---

## 🔍 Verification & Endpoints

| Resource | URL | Expected Response |
|---|---|---|
| **Health Check** | [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health) | `{"status": "ok"}` |
| **Root Welcome** | [http://127.0.0.1:8000/](http://127.0.0.1:8000/) | `{"message": "Welcome to Safe Company Chatbot API", ...}` |
| **Interactive Docs (Swagger UI)** | [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) | Interactive API exploration page |
| **Alternative Docs (ReDoc)** | [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc) | Clean documentation view |

---

## 🔒 Security and Privacy Considerations

The project follows a strict local-first, zero-trust design:

- **No External Cloud AI:** No employee prompts or document contents are transmitted to third-party cloud APIs.
- **Git Protection:** `.gitignore` excludes company documents (`*.pdf`, `*.docx`), secrets (`.env`), private upload directories, vector caches, and virtual environments from version control.
- **Zero-Trust Authorization:** An administrator role alone does not grant read access to confidential documents or their extracted text. Every read request requires either document ownership or an explicit per-document `can_read=True` grant.
- **IDOR Prevention:** All document and permission operations perform server-side identity verification. Client-supplied user IDs are never trusted; the authenticated user is always derived from the signed JWT.
- **Atomic Transactions:** Document upload, text extraction, and text persistence are wrapped in a single DB transaction. Any failure rolls back the database and removes the uploaded file from disk.
- **Immediate Revocation:** Permission revocation takes effect on the next request — there is no caching of authorization decisions.
- **No Sensitive Field Exposure:** `storage_path`, `password_hash`, and `text_content` are never returned by list or metadata endpoints.
- **Sensitive Data Redaction:** PII detection and masking will be applied prior to LLM model ingestion in a future phase.

---

## 👥 Team and Contributions

This project is being developed collaboratively. Work is organized through GitHub Issues, labels, branches, and pull requests. Each contribution should be reviewed and tested before merging into the `main` branch.

---

## 📄 License

A license will be added once the project team decides how the repository and its source code should be distributed.
