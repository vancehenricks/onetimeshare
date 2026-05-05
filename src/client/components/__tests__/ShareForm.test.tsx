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

  expect(onShare).toHaveBeenCalledWith('my secret');
  expect(textarea).toHaveValue('');
});