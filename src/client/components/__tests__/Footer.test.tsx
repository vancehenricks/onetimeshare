/** @jest-environment jsdom */
import React from 'react';
import { render, screen } from '@testing-library/react';
import Footer from '../Footer';

test('renders footer links', () => {
  render(<Footer />);
  expect(screen.getByText(/Source/i)).toBeInTheDocument();
  expect(screen.getByText(/Privacy/i)).toBeInTheDocument();
  expect(screen.getByText(/License/i)).toBeInTheDocument();
});