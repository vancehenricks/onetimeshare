import { useEffect, useState } from 'react';
import { decryptSecret, isFilePayload, parseFilePayload } from '../utils/encryption';
import type { FilePayload } from '../utils/encryption';
import Footer from '../components/Footer';

interface SecretContentResponse {
  encryptedContent: string;
}

interface ViewPageProps {
  secretId: string;
}

type LoadingState = 'loading' | 'decrypt-needed' | 'success' | 'error';

export default function ViewPage({ secretId }: ViewPageProps) {
  const [state, setState] = useState<LoadingState>('loading');
  const [content, setContent] = useState('');
  const [filePayload, setFilePayload] = useState<FilePayload | null>(null);
  const [error, setError] = useState('');
  const [code, setCode] = useState('');
  const [decrypting, setDecrypting] = useState(false);
  const [encryptedData, setEncryptedData] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchSecret(secretId)
      .then((encrypted) => {
        setEncryptedData(encrypted);
        setState('decrypt-needed');
      })
      .catch((err) => {
        setError(err.message);
        setState('error');
      });
  }, [secretId]);

  async function fetchSecret(id: string): Promise<string> {
    const response = await fetch(`/api/secrets/${id}`);

    if (response.status === 404) {
      throw new Error('Secret not found or has expired.');
    }

    if (!response.ok) {
      throw new Error('Failed to retrieve secret.');
    }

    const data = (await response.json()) as SecretContentResponse;
    return data.encryptedContent;
  }

  const handleDecrypt = async () => {
    if (!code.trim()) {
      alert('Please enter the 6-digit code');
      return;
    }

    if (!/^\d{6}$/.test(code)) {
      alert('Code must be exactly 6 digits');
      return;
    }

    setDecrypting(true);
    try {
      if (!encryptedData) {
        throw new Error('No encrypted data available');
      }
      const decrypted = await decryptSecret(encryptedData, code);
      if (isFilePayload(decrypted)) {
        setFilePayload(parseFilePayload(decrypted));
      } else {
        setContent(decrypted);
      }
      setState('success');
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : 'Decryption failed';
      setError(errMessage);
      setState('error');
    } finally {
      setDecrypting(false);
    }
  };

  const handleCopy = async () => {
    try {
      if (!content) return;
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      alert('Failed to copy secret');
    }
  };

  const handleDownload = () => {
    if (!filePayload) return;
    const byteChars = atob(filePayload.data);
    const byteArray = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
      byteArray[i] = byteChars.charCodeAt(i);
    }
    const blob = new Blob([byteArray], { type: filePayload.mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filePayload.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
  };

  return (
    <div className="container">
      <div className="card">
        <h1 className="text-xl md:text-2xl">View Secret</h1>
        
        {state === 'loading' && (
          <div className="loading">
            <p className="text-sm md:text-base">Loading secret...</p>
          </div>
        )}

        {state === 'decrypt-needed' && (
          <div className="decrypt-container">
            <div className="form-group">
              <label htmlFor="codeInput" className="text-sm md:text-base">Enter 6-digit Code:</label>
              <input
                id="codeInput"
                type="text"
                placeholder="000000"
                maxLength={6}
                value={code}
                onChange={handleCodeChange}
                className="code-input text-lg md:text-2xl"
              />
              <button
                className="btn btn-primary text-sm md:text-base"
                onClick={handleDecrypt}
                disabled={decrypting || code.length !== 6}
              >
                {decrypting ? 'Decrypting...' : 'Decrypt Secret'}
              </button>
            </div>
          </div>
        )}

        {state === 'success' && (
          <div className="secret-container">
            <div className="secret-content">
              {filePayload ? (
                <>
                  <div className="content-box" style={{ padding: '1rem' }}>
                    <p className="text-sm md:text-base font-medium text-gray-800 mb-1">📎 {filePayload.name}</p>
                    <p className="text-xs text-gray-500">{filePayload.mimeType}</p>
                  </div>
                  <button
                    className="btn btn-primary text-sm md:text-base mt-3"
                    onClick={handleDownload}
                    type="button"
                  >
                    Download File
                  </button>
                </>
              ) : (
                <>
                  <div className="secret-toolbar" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="eye-toggle copy-btn"
                        onClick={() => setShowSecret((s) => !s)}
                        aria-pressed={showSecret}
                        title={showSecret ? 'Hide secret' : 'Show secret'}
                        type="button"
                        style={{ cursor: 'pointer' }}
                      >
                        {showSecret ? 'Hide' : 'Show'}
                      </button>

                      <button
                        className="eye-toggle copy-btn"
                        onClick={handleCopy}
                        title="Copy secret"
                        type="button"
                      >
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <div className="content-box">
                    <pre
                      className={`secret-text text-xs md:text-sm ${showSecret ? '' : 'masked'}`}
                      style={{
                        whiteSpace: 'pre',
                        textAlign: 'left',
                        userSelect: 'text',
                        overflowX: 'auto',
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", "Courier New", monospace',
                        padding: 0,
                        background: 'transparent',
                        borderRadius: '6px'
                      }}
                    >
                      {showSecret ? content : content.replace(/[^\n]/g, '•')}
                    </pre>
                  </div>
                </>
              )}
              <p className="info-message text-xs md:text-sm">
                ℹ️ This secret has been viewed and can no longer be accessed.
              </p>
              <a href="/" className="btn btn-primary text-sm md:text-base block">
                Share Another Secret
              </a>
            </div>
          </div>
        )}

        {state === 'error' && (
          <div className="error-container">
            <div className="error-message">
              <h2 className="text-base md:text-lg">Secret Not Found</h2>
              <p className="text-xs md:text-sm">{error}</p>
              <a href="/" className="btn btn-primary text-sm md:text-base block">
                Create a New Secret
              </a>
            </div>
          </div>
        )}
        <Footer />
      </div>
    </div>
  );
}
