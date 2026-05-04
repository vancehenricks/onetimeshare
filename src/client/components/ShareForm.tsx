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
