import { useState } from 'react';

interface ShareFormProps {
  onShare: (content: string) => void;
  loading: boolean;
}

export default function ShareForm({ onShare, loading }: ShareFormProps) {
  const [content, setContent] = useState('');
  const [showSecret, setShowSecret] = useState(false);

  const handleSubmit = () => {
    onShare(content);
    setContent('');
  };

  const masked = content.replace(/[^\s]/g, '•');

  return (
    <div className="form-group">
      <div className="instructions mb-4 text-xs md:text-sm text-gray-700">
        <strong className="text-sm md:text-base block mb-2">How to use</strong>
        <ol className="list-decimal list-inside mt-2 space-y-1 text-xs md:text-sm">
          <li>Enter the secret (max 500 characters).</li>
          <li>Click <em>Generate Share Link</em>. A link and a short code will be produced.</li>
          <li>Send the link and the code to the recipient separately. The secret is encrypted in your browser; the server never sees the plain text.</li>
          <li>The link expires in 5 minutes and can be opened only once.</li>
        </ol>
      </div>
      <label htmlFor="secretInput" className="text-sm md:text-base">Your Secret:</label>
      <div className="textarea-wrapper">
        <button
          type="button"
          className="eye-toggle text-lg md:text-xl"
          onClick={() => setShowSecret((s) => !s)}
          aria-pressed={showSecret}
          title={showSecret ? 'Hide secret' : 'Show secret'}
        >
          {showSecret ? '🙈' : '👁️'}
        </button>

        <textarea
          id="secretInput"
          placeholder="Enter your secret here..."
          rows={5}
          maxLength={500}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className={`text-sm md:text-base ${showSecret ? '' : 'masked'}`}
        />

        <pre className={`overlay-mask secret-text masked text-sm md:text-base ${showSecret ? 'hidden' : ''}`} style={{ whiteSpace: 'pre' }}>{masked}</pre>
      </div>

      <button
        className="btn btn-primary text-sm md:text-base"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? 'Generating...' : 'Generate Share Link'}
      </button>
    </div>
  );
}
