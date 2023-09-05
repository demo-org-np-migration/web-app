import { useEffect, useState } from 'react';
import { api, type DashboardResponse } from '../api';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: DashboardResponse };

export function Dashboard() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    api
      .getDashboard()
      .then((data) => {
        if (!cancelled) setState({ status: 'ready', data });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            status: 'error',
            message: err instanceof Error ? err.message : 'error desconocido',
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === 'loading') {
    return <p>Cargando...</p>;
  }

  if (state.status === 'error') {
    return <p role="alert">No pudimos cargar el dashboard: {state.message}</p>;
  }

  const { merchant, account, payments } = state.data;

  return (
    <section>
      <h1>{merchant.name}</h1>
      <p>
        Cuenta {account.currency} · saldo {account.balance} · estado {account.status}
      </p>

      <h2>Cobros recientes</h2>
      {payments.length === 0 ? (
        <p>Todavía no hay cobros.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Monto</th>
              <th>Estado</th>
              <th>Referencia</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id}>
                <td>{new Date(payment.created_at).toLocaleString()}</td>
                <td>
                  {payment.amount} {payment.currency}
                </td>
                <td>{payment.status}</td>
                <td>{payment.id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
