# A Safe, Offline Chatbot for Company Files

A local-first AI document assistant designed to help employees search and understand company documents while protecting sensitive information through access control, privacy filtering, and security evaluation.

## Overview

Companies maintain documents containing internal processes, project details, employee information, and confidential business data. Employees may use external AI tools to understand these documents, potentially exposing sensitive information.

**A Safe, Offline Chatbot for Company Files** aims to provide an alternative by running a language model locally and retrieving information from authorized company documents.

The system combines document-based question answering, permission-controlled retrieval, sensitive-data detection, and security testing in one application.

## Problem Statement

Using external AI services to process confidential company documents can create data exposure risks. At the same time, restricting AI assistance entirely can make it harder for employees to find and understand information.

The project explores how a local AI assistant can provide useful document-based answers while enforcing access permissions and applying privacy safeguards.

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

These are the planned capabilities; individual features will be marked complete as implementation and testing progress.

## Technology Stack

| Component | Technology | Purpose |
|---|---|---|
| Frontend | React, TypeScript | User interface and application workflows |
| Styling | Tailwind CSS | Responsive and consistent interface design |
| Frontend tooling | Vite | Development server and production builds |
| Backend | Python, FastAPI | APIs, application logic, and security enforcement |
| Database | PostgreSQL | Users, permissions, documents, chunks, and audit records |
| PDF processing | PyMuPDF | Extract text and page information from PDFs |
| Word processing | python-docx | Extract text from DOCX files |
| Local model runtime | Ollama | Run the language model locally |
| Privacy protection | Microsoft Presidio, custom rules | Detect and transform sensitive information |
| Testing | pytest | Automated backend and security tests |
| Version control | Git, GitHub | Source control and team collaboration |

PostgreSQL full-text search is the proposed starting point for document retrieval. Semantic search using a local embedding model and pgvector may be added if evaluation shows that it is needed.

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

### Document Ingestion

```text
PDF / DOCX Upload
        |
        v
File Validation
        |
        v
Text Extraction
        |
        v
Text Chunking
        |
        v
PostgreSQL Storage and Indexing
```

### Question Answering

The application follows a Retrieval-Augmented Generation (RAG) approach. Relevant document chunks are retrieved and supplied as context to the language model, allowing it to generate answers grounded in the available documents.

Document permissions are enforced before retrieval. Privacy filtering is an additional safeguard and does not replace authorization.

## User Roles

- **Employee:** Ask questions and access documents permitted for their account.
- **Project Expert:** Review access requests for assigned projects and make approval decisions.
- **Administrator:** Manage user accounts, permissions, privacy rules, and security evaluation settings.

Access is enforced by the backend. A user's role alone does not automatically grant access to every confidential document.

## Security and Privacy Considerations

The project follows a local-first design, but local model execution alone does not guarantee complete security.

The implementation aims to:

- Enforce permissions before retrieving document content.
- Process sensitive information before sending context to the model.
- Avoid external AI API fallbacks.
- Protect original documents, extracted text, and transformation mappings.
- Minimize sensitive information in logs.
- Test security controls using predefined scenarios.
- Measure privacy protection alongside answer quality.

The system is a prototype and will not claim to eliminate every possible data leak or attack.

## Evaluation Plan

The system will be evaluated using fictional company documents and controlled test cases.

Planned evaluation criteria include:

- Retrieval of relevant document passages.
- Answer correctness and source accuracy.
- Detection of planted sensitive values.
- Unauthorized document access attempts.
- Resistance to selected prompt-injection attacks.
- Response time and the effect of privacy filtering on answer quality.

Results will be recorded from actual tests rather than assumed in advance.

## Project Structure

The following is the proposed structure; directories can be adjusted during implementation.

```text
safe-company-chatbot/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── types/
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── auth/
│   │   ├── database/
│   │   ├── documents/
│   │   ├── rag/
│   │   ├── privacy/
│   │   ├── security/
│   │   └── main.py
│   ├── tests/
│   └── requirements.txt
├── database/
│   └── migrations/
├── docs/
│   ├── architecture.md
│   └── database-design.md
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

Install the following before running the application:

- Python
- Node.js and npm
- PostgreSQL
- Ollama
- Git

A compatible local language model must be downloaded before offline operation can be demonstrated.

### Setup

The installation instructions will be finalized as the application implementation progresses.

The intended setup process is:

1. Clone the repository.
2. Configure the local PostgreSQL database.
3. Set up the Python virtual environment and backend dependencies.
4. Install frontend dependencies.
5. Install and configure Ollama with a compatible local model.
6. Configure local environment variables.
7. Run the database migrations.
8. Start the backend and frontend services.

Do not commit passwords, API keys, local database credentials, or sensitive company documents to GitHub.

## Current Status

**Status: In development**

The project is being designed around a local-first architecture with document retrieval, access control, privacy processing, and security evaluation.

Implementation status will be updated as each component is completed and tested.

## Future Improvements

- Semantic retrieval using local embeddings and pgvector.
- Support for additional document formats.
- OCR for scanned PDFs.
- More configurable privacy policies.
- Improved retrieval and answer-quality evaluation.
- Stronger audit controls and document-retention policies.

## Team and Contributions

This project is being developed collaboratively by a team of four. Work is organized through GitHub Issues, labels, branches, and pull requests.

Each contribution should be reviewed and tested before merging into the main branch.

## License

A license will be added once the project team decides how the repository and its source code should be distributed.

---

**Note:** This project is intended for educational and prototype evaluation. It should not be used with real confidential company data until its security, privacy, and operational controls have been appropriately reviewed and validated.
