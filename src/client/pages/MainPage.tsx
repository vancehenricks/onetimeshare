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
        body: JSON.stringify({ encryptedContent, secretLength: content.length }),
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
        {secretData ? (
          <ShareResult 
            data={secretData} 
            onCreateNew={() => setSecretData(null)}
          />
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Share a Secret</h1>
            <ol className="list-decimal list-inside space-y-2 text-gray-600 mb-6 text-sm">
              <li>Type your secret below (max 50 characters).</li>
              <li>It gets encrypted in your browser — the server never sees the plaintext.</li>
              <li>You'll receive a one-time link and a 6-digit code to share.</li>
              <li>The recipient opens the link, enters the code, and reads the secret.</li>
              <li>The secret is deleted immediately after being viewed. Link expires in 5 minutes.</li>
            </ol>
            <ShareForm onShare={handleShare} loading={loading} />
          </>
        )}
      </div>
    </div>
  );
}
