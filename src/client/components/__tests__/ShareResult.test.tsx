/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ShareResult from '../ShareResult';

beforeEach(() => {
  (navigator as any).clipboard = { writeText: jest.fn().mockResolvedValue(undefined) };
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
  jest.resetAllMocks();
});

it('displays link and copies link and code', async () => {
  const now = Date.now();
  const data = {
    id: '1',
    shareUrl: 'https://example.com/share/1',
    expiresAt: now + 5000,
    expiresIn: 300,
    code: 'ABC123'
  } as any;
  const onCreateNew = jest.fn();

  render(<ShareResult data={data} onCreateNew={onCreateNew} />);

  expect(screen.getByDisplayValue(data.shareUrl)).toBeInTheDocument();
  expect(screen.getByDisplayValue(data.code)).toBeInTheDocument();

  const copyLinkBtn = screen.getByRole('button', { name: /copy link/i });
  await act(async () => {
    fireEvent.click(copyLinkBtn);
  });
  expect((navigator as any).clipboard.writeText).toHaveBeenCalledWith(data.shareUrl);
  expect(copyLinkBtn).toHaveTextContent(/copied/i);

  const copyCodeBtn = screen.getByRole('button', { name: /copy code/i });
  await act(async () => {
    fireEvent.click(copyCodeBtn);
  });
  expect((navigator as any).clipboard.writeText).toHaveBeenCalledWith(data.code);

  // advance timers to let expiry update
  act(() => {
    jest.advanceTimersByTime(2000);
  });
  expect(screen.getByText(/seconds|Expired/)).toBeInTheDocument();

  const shareAnother = screen.getByRole('button', { name: /share another secret/i });
  fireEvent.click(shareAnother);
  expect(onCreateNew).toHaveBeenCalled();
});

describe('without code (file share or no-code scenario)', () => {
  it('hides the code section when code is not provided', () => {
    const data = {
      id: '2',
      shareUrl: 'https://example.com/share/2',
      expiresAt: Date.now() + 300000,
      expiresIn: 300,
    } as any;

    render(<ShareResult data={data} onCreateNew={jest.fn()} />);

    expect(screen.getByDisplayValue(data.shareUrl)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /copy code/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/share this code separately/i)).not.toBeInTheDocument();
  });

  it('still shows share url and copy link button without code', () => {
    const data = {
      id: '2',
      shareUrl: 'https://example.com/share/2',
      expiresAt: Date.now() + 300000,
      expiresIn: 300,
    } as any;

    render(<ShareResult data={data} onCreateNew={jest.fn()} />);

    expect(screen.getByDisplayValue(data.shareUrl)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy link/i })).toBeInTheDocument();
  });
});

describe('expiry display', () => {
  it('shows "Expired" when expiry time has passed', () => {
    const data = {
      id: '3',
      shareUrl: 'https://example.com/share/3',
      expiresAt: Date.now() - 1000, // already expired
      expiresIn: 300,
      code: '123456',
    } as any;

    render(<ShareResult data={data} onCreateNew={jest.fn()} />);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.getByText(/Expired/)).toBeInTheDocument();
  });

  it('counts down expiry seconds', () => {
    const data = {
      id: '4',
      shareUrl: 'https://example.com/share/4',
      expiresAt: Date.now() + 10000,
      expiresIn: 10,
      code: '123456',
    } as any;

    render(<ShareResult data={data} onCreateNew={jest.fn()} />);

    act(() => { jest.advanceTimersByTime(1000); });
    expect(screen.getByText(/seconds/)).toBeInTheDocument();

    act(() => { jest.advanceTimersByTime(9000); });
    expect(screen.getByText(/Expired/)).toBeInTheDocument();
  });
});

describe('copy button reset', () => {
  it('copy link label resets back after timeout', async () => {
    const data = {
      id: '5',
      shareUrl: 'https://example.com/share/5',
      expiresAt: Date.now() + 300000,
      expiresIn: 300,
      code: '123456',
    } as any;

    render(<ShareResult data={data} onCreateNew={jest.fn()} />);

    const copyLinkBtn = screen.getByRole('button', { name: /copy link/i });
    await act(async () => { fireEvent.click(copyLinkBtn); });

    expect(copyLinkBtn).toHaveTextContent(/copied/i);

    act(() => { jest.advanceTimersByTime(2001); });

    expect(copyLinkBtn).toHaveTextContent(/copy link/i);
  });

  it('copy code label resets back after timeout', async () => {
    const data = {
      id: '6',
      shareUrl: 'https://example.com/share/6',
      expiresAt: Date.now() + 300000,
      expiresIn: 300,
      code: '654321',
    } as any;

    render(<ShareResult data={data} onCreateNew={jest.fn()} />);

    const copyCodeBtn = screen.getByRole('button', { name: /copy code/i });
    await act(async () => { fireEvent.click(copyCodeBtn); });

    expect(copyCodeBtn).toHaveTextContent(/copied/i);

    act(() => { jest.advanceTimersByTime(2001); });

    expect(copyCodeBtn).toHaveTextContent(/copy code/i);
  });
});