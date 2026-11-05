/**
 * DocumentUploadModal — Upload PDF or DOCX to POST /documents/upload.
 *
 * Enforces:
 * - File type validation (.pdf, .docx only)
 * - Maximum file size validation (10 MB)
 * - Drag-and-drop & file picker support
 * - Upload progress indicator
 * - Displays returned document info, chunk count, and embedding status
 * - Never logs sensitive file contents
 */
import React, { useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, FileUp, Loader2, Upload, X } from 'lucide-react';
import { uploadDocument } from '../../api/documents';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_EXTENSIONS = ['.pdf', '.docx'];

export default function DocumentUploadModal({ isOpen, onClose, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const inputRef = useRef(null);

  if (!isOpen) return null;

  function handleFileSelected(selectedFile) {
    setError('');
    setResult(null);

    if (!selectedFile) return;

    const ext = '.' + selectedFile.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError('Only PDF (.pdf) and Word (.docx) files are supported.');
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError('File exceeds the 10 MB limit.');
      return;
    }

    if (selectedFile.size === 0) {
      setError('The selected file is empty.');
      return;
    }

    setFile(selectedFile);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  }

  async function handleUpload() {
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setError('');

    try {
      const data = await uploadDocument(file, (pct) => setProgress(pct));
      setResult(data);
      setFile(null);
      if (onUploadSuccess) {
        onUploadSuccess(data);
      }
    } catch (err) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail;

      if (status === 413) {
        setError('File exceeds the server 10 MB limit.');
      } else if (status === 422) {
        setError(detail || 'Could not extract text. Scanned or image-only documents are unsupported.');
      } else if (status === 400) {
        setError(detail || 'Invalid or password-protected document.');
      } else {
        setError(detail || 'Upload failed. Please check your connection and try again.');
      }
    } finally {
      setUploading(false);
    }
  }

  function handleClose() {
    setFile(null);
    setError('');
    setResult(null);
    setProgress(0);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-2xl border border-gray-200/80 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-mint-100 border border-mint-border flex items-center justify-center text-darkGreen">
              <FileUp className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-darkGreen tracking-tight">
                Upload Document
              </h3>
              <p className="text-xs text-charcoal/60">
                Authorized documents are indexed and made available for private RAG retrieval.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg text-charcoal/40 hover:text-charcoal/80 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Success state */}
          {result ? (
            <div className="p-5 rounded-xl bg-mint-50 border border-mint-border text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-mint-100 border border-mint-border text-darkGreen flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6 stroke-[2]" />
              </div>
              <h4 className="text-sm font-semibold text-darkGreen">
                Document Uploaded & Processed
              </h4>
              <p className="text-xs text-charcoal/70">
                <strong className="font-medium text-darkGreen">{result.filename}</strong> has been
                persisted and indexed securely.
              </p>
              <div className="pt-2 border-t border-mint-border/60 grid grid-cols-2 gap-2 text-left text-xs font-mono">
                <div>
                  <span className="text-charcoal/50">Chunks indexed:</span>{' '}
                  <span className="font-semibold text-darkGreen">{result.chunk_count ?? 'N/A'}</span>
                </div>
                <div>
                  <span className="text-charcoal/50">Embedding status:</span>{' '}
                  <span className="font-semibold text-darkGreen uppercase">
                    {result.embedding_status ?? 'completed'}
                  </span>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="mt-3 w-full py-2.5 px-4 rounded-lg bg-darkGreen text-white text-xs font-medium hover:bg-darkGreen/90 transition-all"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              {/* Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                  isDragging
                    ? 'border-darkGreen bg-mint-50'
                    : file
                    ? 'border-softGreen bg-mint-50/40'
                    : 'border-gray-200 hover:border-darkGreen/40 hover:bg-gray-50/50'
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(e) => handleFileSelected(e.target.files?.[0])}
                  className="hidden"
                />

                <div className="w-12 h-12 rounded-full bg-mint-100 border border-mint-border flex items-center justify-center text-darkGreen mb-3">
                  <Upload className="w-5 h-5 stroke-[2]" />
                </div>

                {file ? (
                  <div className="text-center">
                    <p className="text-sm font-semibold text-darkGreen">{file.name}</p>
                    <p className="text-xs text-charcoal/50 mt-0.5">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB · Click or drag to change
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm font-medium text-darkGreen">
                      Drag & drop your document here, or <span className="underline">browse</span>
                    </p>
                    <p className="text-xs text-charcoal/50 mt-1">
                      PDF or Word (.docx) up to 10 MB
                    </p>
                  </div>
                )}
              </div>

              {/* Progress bar */}
              {uploading && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-charcoal/60">
                    <span className="flex items-center gap-1.5 font-mono">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-darkGreen" />
                      Uploading & processing…
                    </span>
                    <span className="font-mono font-medium">{progress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-darkGreen transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Error banner */}
              {error && (
                <div
                  role="alert"
                  className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Privacy disclaimer */}
              <p className="text-[11px] text-charcoal/50 leading-relaxed">
                <strong className="text-darkGreen font-semibold">Privacy by design:</strong> Text is
                extracted and indexed locally. Confidential entities will be automatically detected
                and sanitized before context is sent to the local language model.
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        {!result && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50/70 border-t border-gray-100">
            <button
              type="button"
              onClick={handleClose}
              disabled={uploading}
              className="px-4 py-2 text-xs font-medium text-charcoal/70 hover:text-darkGreen transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={!file || uploading}
              className="px-5 py-2 rounded-lg bg-darkGreen text-white text-xs font-medium hover:bg-darkGreen/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-xs"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing…</span>
                </>
              ) : (
                'Upload & Index'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

