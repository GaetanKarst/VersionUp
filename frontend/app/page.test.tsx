import { render, screen } from '@testing-library/react';
import HomePage from './page';
import { vi } from 'vitest';

// Mock firebase/auth
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  onAuthStateChanged: vi.fn((auth, callback) => {
    callback(null);
    return () => {};
  }),
}));

vi.mock('@/lib/firebase', () => ({
  auth: {},
}));

describe('HomePage', () => {
  it('renders the "Get Started" button for a logged-out user', () => {
    render(<HomePage />);
    const getStartedButton = screen.getByRole('link', { name: /Get Started/i });
    expect(getStartedButton).toBeInTheDocument();
  });
});
