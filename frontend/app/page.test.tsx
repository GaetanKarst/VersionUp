import { render, screen, fireEvent } from '@testing-library/react';
import HomePage from './page';
import { vi } from 'vitest';
import { User, onAuthStateChanged } from 'firebase/auth';
import axios from 'axios';

vi.mock('axios');

const mockUser = {
  uid: '123',
  getIdToken: async () => 'test-token',
};

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  onAuthStateChanged: vi.fn(),
}));

vi.mock('@/lib/firebase', () => ({
  auth: {},
}));

describe('HomePage', () => {
  describe('when user is logged out', () => {
    beforeEach(() => {
      (onAuthStateChanged as vi.Mock).mockImplementation((__, callback: (user: User | null) => void) => {
        callback(null);
        return () => {};
      });
    });

    it('renders the "Get Started" button', () => {
      render(<HomePage />);
      const getStartedButton = screen.getByRole('link', { name: /Get Started/i });
      expect(getStartedButton).toBeInTheDocument();
      expect(getStartedButton).toHaveAttribute('href', '/login');
    });
  });

  describe('when user is logged in', () => {
    beforeEach(() => {
      (onAuthStateChanged as vi.Mock).mockImplementation((__, callback: (user: User | null) => void) => {
        callback(mockUser as unknown as User);
        return () => {}; // Return an unsubscribe function
      });
      vi.clearAllMocks();
    });

    it('renders the "Connect with Strava!" button', () => {
      render(<HomePage />);
      const connectButton = screen.getByRole('button', { name: /Connect with Strava!/i });
      expect(connectButton).toBeInTheDocument();
    });

    it('shows loading state while fetching workouts', () => {
      render(<HomePage />);
      expect(screen.getByText(/Loading your workout.../i)).toBeInTheDocument();
    });

    it('displays the latest workout when fetch is successful', async () => {
      const mockWorkout = {
        id: '1',
        suggestion: 'Test workout suggestion',
        created_at: { _seconds: 1678886400 },
      };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [mockWorkout],
      });

      render(<HomePage />);

      expect(await screen.findByText(/Workout Plan/i)).toBeInTheDocument();
      expect(screen.getByText(/Test workout suggestion/i)).toBeInTheDocument();
    });

    it('displays an error message when workout fetch fails', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ detail: 'Failed to fetch' }),
      });

      render(<HomePage />);

      expect(await screen.findByText(/Failed to fetch/i)).toBeInTheDocument();
    });

    it('opens and closes the workout modal', async () => {
      const mockWorkout = {
        id: '1',
        suggestion: 'Full workout suggestion text',
        created_at: { _seconds: 1678886400 },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [mockWorkout],
      });

      render(<HomePage />);

      const viewButton = await screen.findByRole('button', { name: /View Full Workout/i });
      fireEvent.click(viewButton);

      expect(screen.getByText(/Full Workout Plan/i)).toBeInTheDocument();
      expect(screen.getByText('Full workout suggestion text')).toBeInTheDocument();

      const closeButton = screen.getByRole('button', { name: /Close/i });
      fireEvent.click(closeButton);

      expect(screen.queryByText(/Full Workout Plan/i)).not.toBeInTheDocument();
    });

    it('displays an error message if strava connection fails', async () => {
      (axios.get as vi.Mock).mockRejectedValue(new Error('Network error'));

      render(<HomePage />);
      
      const connectButton = screen.getByRole('button', { name: /Connect with Strava!/i });
      fireEvent.click(connectButton);

      expect(await screen.findByText(/Network error/i)).toBeInTheDocument();
    });
  });
});
