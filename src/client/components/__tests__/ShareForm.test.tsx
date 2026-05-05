/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import ShareForm from '../ShareForm';

it('renders and toggles show/hide and submits', () => {
  const onShare = jest.fn();
  render(<ShareForm onShare={onShare} loading={false} />);

  const textarea = screen.getByPlaceholderText(/enter your secret/i) as HTMLTextAreaElement;
  fireEvent.change(textarea, { target: { value: 'my secret' } });

  // masked overlay should show bullet characters
  expect(screen.getByText(/•/)).toBeInTheDocument();

  const showBtn = screen.getByRole('button', { name: /show/i });
  fireEvent.click(showBtn);
  expect(showBtn).toHaveTextContent(/hide/i);

  const genBtn = screen.getByRole('button', { name: /generate share link/i });
  fireEvent.click(genBtn);

  expect(onShare).toHaveBeenCalledWith({ kind: 'text', content: 'my secret' });
  expect(textarea).toHaveValue('');
});

it('allows file upload, enforces size limit, and submits file', () => {
  const onShare = jest.fn();
  const { container } = render(<ShareForm onShare={onShare} loading={false} />);

  // Switch to file mode
  const fileModeBtn = screen.getByRole('button', { name: /file/i });
  fireEvent.click(fileModeBtn);

  const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
  expect(fileInput).toBeTruthy();

  // Create an oversized file (~2MB)
  const bigBuffer = new ArrayBuffer(2 * 1024 * 1024);
  const bigFile = new File([bigBuffer], 'big.dat', { type: 'application/octet-stream' });

  fireEvent.change(fileInput, { target: { files: [bigFile] } });

  // Should show file size error
  expect(screen.getByText(/file is too large/i)).toBeInTheDocument();

  // Now create a small file and submit
  const smallFile = new File(['hello'], 'hello.txt', { type: 'text/plain' });
  fireEvent.change(fileInput, { target: { files: [smallFile] } });

  // Selected file name should be displayed
  expect(screen.getByText(/hello.txt/i)).toBeInTheDocument();

  const genBtn = screen.getByRole('button', { name: /generate share link/i });
  fireEvent.click(genBtn);

  expect(onShare).toHaveBeenCalledWith({ kind: 'file', file: smallFile });
});

describe('empty text validation', () => {
  it('calls onShare with empty string when text is empty', () => {
    const onShare = jest.fn();
    render(<ShareForm onShare={onShare} loading={false} />);

    const genBtn = screen.getByRole('button', { name: /generate share link/i });
    fireEvent.click(genBtn);

    // ShareForm does not prevent empty text - validation is in MainPage
    expect(onShare).toHaveBeenCalledWith({ kind: 'text', content: '' });
  });

  it('clears textarea after submitting empty text', () => {
    const onShare = jest.fn();
    render(<ShareForm onShare={onShare} loading={false} />);

    const textarea = screen.getByPlaceholderText(/enter your secret/i) as HTMLTextAreaElement;
    const genBtn = screen.getByRole('button', { name: /generate share link/i });
    fireEvent.click(genBtn);

    expect(textarea).toHaveValue('');
  });
});

describe('file mode - empty selection validation', () => {
  it('disables submit button when no file selected (prevents onShare call)', () => {
    const onShare = jest.fn();
    render(<ShareForm onShare={onShare} loading={false} />);

    const fileModeBtn = screen.getByRole('button', { name: /file/i });
    fireEvent.click(fileModeBtn);

    const genBtn = screen.getByRole('button', { name: /generate share link/i }) as HTMLButtonElement;
    expect(genBtn).toBeDisabled();

    // Clicking disabled button should not call onShare
    fireEvent.click(genBtn);
    expect(onShare).not.toHaveBeenCalled();
  });

  it('disables submit button in file mode until a valid file is selected', () => {
    const onShare = jest.fn();
    const { container } = render(<ShareForm onShare={onShare} loading={false} />);

    const fileModeBtn = screen.getByRole('button', { name: /file/i });
    fireEvent.click(fileModeBtn);

    const genBtn = screen.getByRole('button', { name: /generate share link/i }) as HTMLButtonElement;
    expect(genBtn).toBeDisabled();

    // Select a valid file
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['data'], 'test.txt', { type: 'text/plain' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(genBtn).not.toBeDisabled();
  });

  it('disables submit button again after an oversized file is selected', () => {
    const onShare = jest.fn();
    const { container } = render(<ShareForm onShare={onShare} loading={false} />);

    const fileModeBtn = screen.getByRole('button', { name: /file/i });
    fireEvent.click(fileModeBtn);

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const genBtn = screen.getByRole('button', { name: /generate share link/i }) as HTMLButtonElement;

    // Select a valid file first
    const validFile = new File(['data'], 'valid.txt', { type: 'text/plain' });
    fireEvent.change(fileInput, { target: { files: [validFile] } });
    expect(genBtn).not.toBeDisabled();

    // Then select an oversized file
    const bigBuffer = new ArrayBuffer(2 * 1024 * 1024);
    const bigFile = new File([bigBuffer], 'big.dat', { type: 'application/octet-stream' });
    fireEvent.change(fileInput, { target: { files: [bigFile] } });

    // Button should be disabled again due to error
    expect(genBtn).toBeDisabled();
  });
});

describe('loading state', () => {
  it('disables submit button when loading', () => {
    render(<ShareForm onShare={jest.fn()} loading={true} />);
    const genBtn = screen.getByRole('button', { name: /generating/i }) as HTMLButtonElement;
    expect(genBtn).toBeDisabled();
  });

  it('shows "Generating..." text when loading', () => {
    render(<ShareForm onShare={jest.fn()} loading={true} />);
    expect(screen.getByText(/generating/i)).toBeInTheDocument();
  });
});

describe('mode switching', () => {
  it('switches from text mode to file mode and back', () => {
    render(<ShareForm onShare={jest.fn()} loading={false} />);

    expect(screen.getByPlaceholderText(/enter your secret/i)).toBeInTheDocument();

    const fileModeBtn = screen.getByRole('button', { name: /^file$/i });
    fireEvent.click(fileModeBtn);

    expect(screen.queryByPlaceholderText(/enter your secret/i)).not.toBeInTheDocument();

    const textModeBtn = screen.getByRole('button', { name: /^text$/i });
    fireEvent.click(textModeBtn);

    expect(screen.getByPlaceholderText(/enter your secret/i)).toBeInTheDocument();
  });

  it('clears file error when switching back to text mode', () => {
    const { container } = render(<ShareForm onShare={jest.fn()} loading={false} />);

    const fileModeBtn = screen.getByRole('button', { name: /^file$/i });
    fireEvent.click(fileModeBtn);

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const bigBuffer = new ArrayBuffer(2 * 1024 * 1024);
    const bigFile = new File([bigBuffer], 'big.dat', { type: 'application/octet-stream' });
    fireEvent.change(fileInput, { target: { files: [bigFile] } });

    expect(screen.getByText(/file is too large/i)).toBeInTheDocument();

    const textModeBtn = screen.getByRole('button', { name: /^text$/i });
    fireEvent.click(textModeBtn);

    expect(screen.queryByText(/file is too large/i)).not.toBeInTheDocument();
  });
});