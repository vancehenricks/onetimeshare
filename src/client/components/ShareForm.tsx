import { useState } from 'react';

interface ShareFormProps {
  onShare: (content: string) => void;
  loading: boolean;
}

export default function ShareForm({ onShare, loading }: ShareFormProps) {
  const [content, setContent] = useState('');

  const handleSubmit = () => {
    onShare(content);
    setContent('');
  };

  return (
    <div className="form-group">
      <div className="instructions mb-4 text-sm text-gray-700">
        <strong>How to use</strong>
        <ol className="list-decimal list-inside mt-2">
          <li>Enter the secret (max 50 characters).</li>
          <li>Click <em>Generate Share Link</em>. A link and a short code will be produced.</li>
          <li>Send the link and the code to the recipient separately. The secret is encrypted in your browser; the server never sees the plain text.</li>
          <li>The link expires in 5 minutes and can be opened only once.</li>
        </ol>
      </div>
      <label htmlFor="secretInput">Your Secret:</label>
      <textarea
        id="secretInput"
        placeholder="Enter your secret here..."
        rows={6}
        maxLength={50}
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <button
        className="btn btn-primary"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? 'Generating...' : 'Generate Share Link'}
      </button>
    </div>
  );
}
