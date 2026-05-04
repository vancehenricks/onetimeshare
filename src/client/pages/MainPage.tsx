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
            <div className="bg-green-50 border border-green-100 rounded-md p-4 mb-6 text-sm text-gray-700">
              <h2 className="font-semibold mb-2">How it works</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>Typed secret is encrypted in your browser — only ciphertext is sent to the server.</li>
                <li>The server cannot decrypt or read your secret.</li>
                <li>You get a one-time link and a 6-digit code to share; the code is required to decrypt.</li>
                <li>The link expires in 5 minutes and the secret is deleted immediately after viewing.</li>
                <li>Maximum 50 characters — keep it short and private.</li>
              </ul>
            </div>
            <ShareForm onShare={handleShare} loading={loading} />
          </>
        )}
      </div>
    </div>
  );
}
