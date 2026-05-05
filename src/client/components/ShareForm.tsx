import { useState } from 'react';

export type ShareInput =
  | { kind: 'text'; content: string }
  | { kind: 'file'; file: File };

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB

interface ShareFormProps {
  onShare: (input: ShareInput) => void;
  loading: boolean;
}

export default function ShareForm({ onShare, loading }: ShareFormProps) {
  const [mode, setMode] = useState<'text' | 'file'>('text');
  const [content, setContent] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');

  const handleSubmit = () => {
    if (mode === 'text') {
      onShare({ kind: 'text', content });
      setContent('');
    } else {
      if (!selectedFile) {
        alert('Please select a file');
        return;
      }
      onShare({ kind: 'file', file: selectedFile });
      setSelectedFile(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setFileError('');
    if (file && file.size > MAX_FILE_SIZE) {
      setFileError(`File is too large (${(file.size / 1024 / 1024).toFixed(2)} MB). Maximum size is 1 MB.`);
      setSelectedFile(null);
      e.target.value = '';
      return;
    }
    setSelectedFile(file);
  };

  const masked = content.replace(/[^\n]/g, '•');

  const isSubmitDisabled = loading || (mode === 'file' && (!selectedFile || !!fileError));

  return (
    <div className="form-group">
      <div className="instructions mb-4 text-xs md:text-sm text-gray-700">
        <strong className="text-sm md:text-base block mb-2">How to use</strong>
        <ol className="list-decimal list-inside mt-2 space-y-1 text-xs md:text-sm">
          <li>Enter a secret or upload a file.</li>
          <li>Click <em>Generate Share Link</em>. A link and a short code will be produced.</li>
          <li>Send the link and the code to the recipient separately. The secret is encrypted in your browser; the server never sees the plain text.</li>
          <li>The link expires in 5 minutes and can be opened only once.</li>
        </ol>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          className={`px-4 py-1.5 rounded-md text-sm font-medium border transition-colors ${mode === 'text' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
          onClick={() => setMode('text')}
        >
          Text
        </button>
        <button
          type="button"
          className={`px-4 py-1.5 rounded-md text-sm font-medium border transition-colors ${mode === 'file' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
          onClick={() => setMode('file')}
        >
          File
        </button>
      </div>

      {mode === 'text' ? (
        <>
          <label htmlFor="secretInput" className="text-sm md:text-base">Your Secret</label>
          <div className="textarea-toolbar" style={{display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginBottom: '0.5rem'}}>
            <button
              type="button"
              className="eye-toggle copy-btn"
              onClick={() => setShowSecret((s) => !s)}
              aria-pressed={showSecret}
              title={showSecret ? 'Hide secret' : 'Show secret'}
            >
              {showSecret ? 'Hide' : 'Show'}
            </button>
          </div>

          <div className="textarea-wrapper">
            <textarea
              id="secretInput"
              placeholder="Enter your secret here..."
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={`text-sm md:text-base ${showSecret ? '' : 'masked'}`}
            />

            <pre className={`overlay-mask secret-text masked text-sm md:text-base ${showSecret ? 'hidden' : ''}`} style={{ whiteSpace: 'pre' }}>{masked}</pre>
          </div>
        </>
      ) : (
        <div className="mb-4">
          <label className="text-sm md:text-base block mb-2">Select File <span className="text-gray-500 font-normal">(max 1 MB)</span></label>
          <input
            type="file"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
          {fileError && <p className="mt-2 text-xs text-red-600">{fileError}</p>}
          {selectedFile && !fileError && (
            <p className="mt-2 text-xs text-gray-500">
              {selectedFile.name} &mdash; {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
          )}
        </div>
      )}

      <button
        className="btn btn-primary text-sm md:text-base"
        onClick={handleSubmit}
        disabled={isSubmitDisabled}
      >
        {loading ? 'Generating...' : 'Generate Share Link'}
      </button>
    </div>
  );
}
