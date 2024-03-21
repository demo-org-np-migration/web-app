import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Dashboard } from './Dashboard';
import { api } from '../api';

vi.mock('../api', () => ({
  api: {
    getDashboard: vi.fn(),
  },
}));

describe('Dashboard', () => {
  it('renders the merchant name, balance and recent charges once the api resolves', async () => {
    vi.mocked(api.getDashboard).mockResolvedValue({
      merchant: { id: '11111111-1111-1111-1111-111111111111', name: 'Almacén Bruno', account_id: 'bbbbbbbb-0000-4000-8000-000000000201' },
      account: { id: 'bbbbbbbb-0000-4000-8000-000000000201', currency: 'ARS', balance: '15000.00', status: 'active' },
      payments: [
        {
          id: 'cccccccc-1111-4000-8000-000000000001',
          from_account: 'aaaaaaaa-0000-4000-8000-000000000101',
          to_account: 'bbbbbbbb-0000-4000-8000-000000000201',
          merchant_id: '11111111-1111-1111-1111-111111111111',
          amount: '500.00',
          currency: 'ARS',
          status: 'completed',
          created_at: '2026-09-01T12:00:00Z',
        },
      ],
    });

    render(<Dashboard />);

    expect(await screen.findByText('Almacén Bruno')).toBeInTheDocument();
    expect(screen.getByText(/15000\.00/)).toBeInTheDocument();
    expect(screen.getByText(/500\.00/)).toBeInTheDocument();
  });

  it('shows an error message when the api call fails', async () => {
    vi.mocked(api.getDashboard).mockRejectedValue(new Error('GET /merchant/dashboard -> 401: unauthorized'));

    render(<Dashboard />);

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar el dashboard');
  });
});
