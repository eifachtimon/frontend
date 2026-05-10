import { render, screen } from '@testing-library/react';
import App from './App';

test('renders main heading', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /Lehrplan 21 Suche/i })).toBeInTheDocument();
});
