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

  const masked = content.replace(/[^]/g, '•');

  return (
    <div className="form-group">
      <label htmlFor="secretInput">Your Secret:</label>
      <div className="textarea-wrapper">
        <button
          type="button"
          className="eye-toggle"
          onClick={() => setShowSecret((s) => !s)}
          aria-pressed={showSecret}
          title={showSecret ? 'Hide secret' : 'Show secret'}
        >
          {showSecret ? '🙈' : '👁️'}
        </button>

        <textarea
          id="secretInput"
          placeholder="Enter your secret here..."
          rows={6}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className={showSecret ? '' : 'masked'}
        />

        <pre className={`overlay-mask ${showSecret ? 'hidden' : ''}`}>{masked}</pre>
      </div>

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
