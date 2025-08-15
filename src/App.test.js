
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders interior design generator header', () => {
  render(<App />);
  const headerElement = screen.getByText(/Interior Design Generator/i);
  expect(headerElement).toBeInTheDocument();
});
