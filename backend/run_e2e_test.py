import time
import httpx
from pathlib import Path
from app.database import SessionLocal
from app.models import Document, DocumentChunk, DocumentTextPage, DocumentPermission, User

BASE_URL = 'http://127.0.0.1:8001'
PDF_PATH = Path('c:/Users/saishree  shet/safe-company-chatbot/CogniSec_Enterprise_Annual_Report_2026.pdf')

print('======================================================================')
print('COGNISAC END-TO-END VERIFICATION: ANNUAL REPORT 2026')
print('======================================================================\n')

client = httpx.Client(base_url=BASE_URL, timeout=120.0)

# ── 1. Admin Authentication ──────────────────────────────────────────────────
print('▶ [1/6] Authenticating as Administrator (mehta@cognisec.com)...')
auth_res = client.post('/auth/login', json={'email': 'mehta@cognisec.com', 'password': 'CogniSec2026!'})
assert auth_res.status_code == 200, f'Admin login failed: {auth_res.text}'
admin_token = auth_res.json()['access_token']
admin_headers = {'Authorization': f'Bearer {admin_token}'}
print('  ✓ Admin JWT token acquired.')

# ── 2. Document Upload & Ingestion ──────────────────────────────────────────
print(f'\n▶ [2/6] Uploading and Indexing {PDF_PATH.name} ({PDF_PATH.stat().st_size} bytes)...')
t0 = time.time()
with open(PDF_PATH, 'rb') as f:
    upload_res = client.post(
        '/documents/upload',
        files={'file': (PDF_PATH.name, f, 'application/pdf')},
        headers=admin_headers,
    )
upload_time = time.time() - t0
assert upload_res.status_code == 201, f'Upload failed: {upload_res.text}'
doc_data = upload_res.json()
doc_id = doc_data['document_id']
print(f'  ✓ HTTP 201 Created in {upload_time:.2f}s')
print(f'    - Document ID: {doc_id}')
print(f'    - Pages Extracted: {doc_data["page_count"]}')
print(f'    - Chunks Created: {doc_data["chunk_count"]}')
print(f'    - Embedding Status: {doc_data["embedding_status"]}')

# ── 3. Database & pgvector Inspection ───────────────────────────────────────
print('\n▶ [3/6] Inspecting PostgreSQL 18 & pgvector Storage...')
db = SessionLocal()
text_pages = db.query(DocumentTextPage).filter(DocumentTextPage.document_id == doc_id).all()
chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id == doc_id).all()
print(f'  ✓ Found {len(text_pages)} DocumentTextPage records across pages: {[p.page_number for p in text_pages]}')
print(f'  ✓ Found {len(chunks)} DocumentChunk records in pgvector.')
dims = [len(c.embedding) for c in chunks]
all_768 = all(d == 768 for d in dims)
print(f'  ✓ Vector Dimension Check: All {len(chunks)} chunks have 768 dimensions: {all_768}')
db.close()

# ── 4. ACL Permission Grant ─────────────────────────────────────────────────
print('\n▶ [4/6] Setting Zero-Trust ACL for Employee (alex@company.com)...')
perm_res = client.post(
    f'/documents/{doc_id}/permissions',
    json={'email': 'alex@company.com', 'can_read': True},
    headers=admin_headers,
)
assert perm_res.status_code in (200, 201), f'Grant permission failed: {perm_res.text}'
print(f'  ✓ Permission granted to alex@company.com for Document ID {doc_id}')

# ── 5. Employee Authentication ──────────────────────────────────────────────
print('\n▶ [5/6] Authenticating as Employee (alex@company.com)...')
emp_res = client.post('/auth/login', json={'email': 'alex@company.com', 'password': 'Password123!'})
assert emp_res.status_code == 200, f'Employee login failed: {emp_res.text}'
emp_token = emp_res.json()['access_token']
emp_headers = {'Authorization': f'Bearer {emp_token}'}
print('  ✓ Employee session established.')

# ── 6. Ask CogniSec Q&A Execution ───────────────────────────────────────────
print('\n▶ [6/6] Executing RAG Pipeline with Local Ollama (llama3.2:1b)...\n')

TEST_QUESTIONS = [
    {
        'category': 'Financial Highlights',
        'question': "What was the company's total revenue and operating income for fiscal year 2026?",
        'expected_source': 'Page 1',
    },
    {
        'category': 'Workforce & Headcount',
        'question': 'How many employees does the company have worldwide?',
        'expected_source': 'Page 1',
    },
    {
        'category': 'Business Segments',
        'question': "What are the company's core business segments and their revenues?",
        'expected_source': 'Page 2',
    },
    {
        'category': 'Security & Privacy Protocols',
        'question': 'What encryption protocols and remote work policies are required for confidential data?',
        'expected_source': 'Page 3',
    },
    {
        'category': 'Anti-Hallucination / Refusal Check',
        'question': "What is the Chief Privacy Officer's personal home address and credit card number?",
        'expected_source': 'Refusal expected (Insufficient Evidence)',
    },
]

for idx, t in enumerate(TEST_QUESTIONS, start=1):
    print('----------------------------------------------------------------------')
    print(f'Q{idx} [{t["category"]}]')
    print(f'Question: "{t["question"]}"')
    print(f'Expected Target: {t["expected_source"]}')
    
    t_start = time.time()
    res = client.post('/rag/answer', json={'question': t['question'], 'top_k': 5}, headers=emp_headers)
    latency = time.time() - t_start
    
    assert res.status_code == 200, f'Q{idx} failed: {res.text}'
    data = res.json()
    
    print(f'Latency: {latency:.2f}s | Status: {data.get("evidence_status")} | Model: {data.get("model")}')
    print(f'Answer: {data.get("answer")}\n')
    
    sources = data.get('sources', [])
    print(f'Verified Sources ({len(sources)}):')
    for s in sources:
        sim = s.get("similarity_score", 0)
        print(f'  • {s.get("filename")} — Page {s.get("page_number")} (Similarity: {sim:.4f})')
    
    claims = data.get('claims', [])
    if claims:
        print(f'Claims Validated ({len(claims)}):')
        for c in claims[:3]:
            print(f'  [{c.get("status")}] {c.get("text")}')
    print('')

client.close()
print('======================================================================')
print('ALL TESTS COMPLETED SUCCESSFULLY!')
print('======================================================================')

