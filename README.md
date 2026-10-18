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

## 📅 Implementation Status: Day 1 Complete

### ✅ Implemented Today (Day 1)
- [x] Standardized project folder hierarchy (`backend/`, `frontend/`, `database/`, `research/`).
- [x] Python virtual environment (`.venv`) initialized inside `backend/`.
- [x] Core dependencies (`FastAPI`, `Uvicorn`) installed and pinned in [`backend/requirements.txt`](backend/requirements.txt).
- [x] Minimal FastAPI application in [`backend/app/main.py`](backend/app/main.py).
- [x] Operational health check endpoint: `GET /health` -> `{"status": "ok"}`.
- [x] Friendly root greeting endpoint: `GET /`.
- [x] Auto-generated interactive API documentation (`/docs` via Swagger UI, `/redoc` via ReDoc).
- [x] Comprehensive `.gitignore` protecting company files, secrets, virtual environments, and build artifacts.

### ⏳ Planned for Upcoming Phases
- [ ] **Phase 2:** PostgreSQL & `pgvector` database setup & migrations.
- [ ] **Phase 3:** Document ingestion pipeline (parsing, chunking, and embedding generation).
- [ ] **Phase 4:** Ollama integration & local LLM orchestration (RAG pipeline).
- [ ] **Phase 5:** Role-Based Access Control (RBAC) & user authentication.
- [ ] **Phase 6:** Privacy Guardrails (Presidio PII redaction, prompt injection defense).
- [ ] **Phase 7:** React + Vite frontend web interface.

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

The project follows a strict local-first design:
- **No External Cloud AI:** No employee prompts or document contents are ever transmitted to third-party cloud APIs.
- **Git Protection:** `.gitignore` excludes company documents (`*.pdf`, `*.docx`), secrets (`.env`), vector caches, and virtual environments from version control.
- **Permission Enforcement:** Permissions will be checked prior to context retrieval in future phases.
- **Sensitive Data Redaction:** PII detection and masking will be applied prior to model ingestion.

---

## 👥 Team and Contributions

This project is being developed collaboratively. Work is organized through GitHub Issues, labels, branches, and pull requests. Each contribution should be reviewed and tested before merging into the `main` branch.

---

## 📄 License

A license will be added once the project team decides how the repository and its source code should be distributed.
