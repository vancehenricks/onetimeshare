import { useEffect, useState } from 'react';
import { decryptSecret } from '../utils/encryption';

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
  const [error, setError] = useState('');
  const [code, setCode] = useState('');
  const [decrypting, setDecrypting] = useState(false);
  const [encryptedData, setEncryptedData] = useState<string | null>(null);

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
      // Enforce client-side max length to avoid showing longer secrets
      const trimmed = decrypted.slice(0, 50);
      setContent(trimmed);
      setState('success');
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : 'Decryption failed';
      setError(errMessage);
      setState('error');
    } finally {
      setDecrypting(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
  };

  return (
    <div className="container">
      <div className="card">
        <h1>View Secret</h1>
        
        {state === 'loading' && (
          <div className="loading">
            <p>Loading secret...</p>
          </div>
        )}

        {state === 'decrypt-needed' && (
          <div className="decrypt-container">
            <div className="form-group">
              <label htmlFor="codeInput">Enter 6-digit Code:</label>
              <input
                id="codeInput"
                type="text"
                placeholder="000000"
                maxLength={50}
                value={code}
                onChange={handleCodeChange}
                style={{
                  fontSize: '24px',
                  letterSpacing: '8px',
                  textAlign: 'center',
                  fontFamily: 'monospace',
                  padding: '12px',
                }}
              />
              <button
                className="btn btn-primary"
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
              <h2>Secret Content:</h2>
              <div className="content-box">
                <pre>{content}</pre>
              </div>
              <p className="info-message">
                ℹ️ This secret has been viewed and can no longer be accessed.
              </p>
              <a href="/" className="btn btn-primary">
                Share Another Secret
              </a>
            </div>
          </div>
        )}

        {state === 'error' && (
          <div className="error-container">
            <div className="error-message">
              <h2>Secret Not Found</h2>
              <p>{error}</p>
              <a href="/" className="btn btn-primary">
                Create a New Secret
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
