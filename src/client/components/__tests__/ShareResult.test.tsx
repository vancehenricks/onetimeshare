/** @jest-environment jsdom */
import React from 'react';
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

test('displays link and copies link and code', async () => {
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