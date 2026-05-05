/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import Footer from '../Footer';

it('renders footer links', () => {
  render(<Footer />);
  expect(screen.getByText(/Source/i)).toBeInTheDocument();
  expect(screen.getByText(/Privacy/i)).toBeInTheDocument();
  expect(screen.getByText(/License/i)).toBeInTheDocument();
});