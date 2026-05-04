import { useState } from 'react';
import ShareForm from '../components/ShareForm';
import ShareResult from '../components/ShareResult';
import { generateCode, encryptSecret } from '../utils/encryption';

interface SecretResponse {
  id: string;
  shareUrl: string;
  expiresAt: number;
  expiresIn: number;
  code?: string;
}

export default function MainPage() {
  const [secretData, setSecretData] = useState<SecretResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleShare = async (content: string) => {
    if (!content.trim()) {
      alert('Please enter a secret');
      return;
    }

    if (content.length > 50) {
      alert('Secret must be 50 characters or fewer');
      return;
    }

    setLoading(true);
    try {
      // Generate code and encrypt content on client-side
      const code = generateCode();
      const encryptedContent = await encryptSecret(content, code);

      const response = await fetch('/api/secrets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ encryptedContent }),
      });

      if (!response.ok) throw new Error('Failed to create secret');

      const data = (await response.json()) as SecretResponse;
      data.code = code;
      setSecretData(data);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to create secret. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-2xl p-10 max-w-2xl w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Share a Secret</h1>
        <p className="text-gray-600 mb-4">
          Share sensitive information via a one-time link. Links expire in 5 minutes.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          The secret is encrypted locally in your browser before upload — the server never sees the plaintext.
        </p>

        {secretData ? (
          <ShareResult 
            data={secretData} 
            onCreateNew={() => setSecretData(null)}
          />
        ) : (
          <ShareForm onShare={handleShare} loading={loading} />
        )}
      </div>
    </div>
  );
}
