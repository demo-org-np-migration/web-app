import { useState, type FormEvent } from 'react';
import { api } from '../api';

type SubmitState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'done'; paymentId: string }
  | { status: 'error'; message: string };

export function NewCharge() {
  const [fromAccount, setFromAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('ARS');
  const [reference, setReference] = useState('');
  const [submit, setSubmit] = useState<SubmitState>({ status: 'idle' });

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmit({ status: 'submitting' });

    try {
      const payment = await api.createCharge({
        from_account: fromAccount,
        amount,
        currency,
        reference,
      });
      setSubmit({ status: 'done', paymentId: payment.id });
      setFromAccount('');
      setAmount('');
      setReference('');
    } catch (err) {
      setSubmit({
        status: 'error',
        message: err instanceof Error ? err.message : 'error desconocido',
      });
    }
  }

  return (
    <section>
      <h1>Nuevo cobro</h1>
      <form onSubmit={onSubmit}>
        <label>
          Cuenta del cliente
          <input
            value={fromAccount}
            onChange={(e) => setFromAccount(e.target.value)}
            placeholder="uuid de la cuenta a debitar"
            required
          />
        </label>

        <label>
          Monto
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            placeholder="1250.50"
            required
          />
        </label>

        <label>
          Moneda
          <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option value="ARS">ARS</option>
            <option value="USD">USD</option>
            <option value="BRL">BRL</option>
          </select>
        </label>

        <label>
          Referencia
          <input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="orden #1234"
            required
          />
        </label>

        <button type="submit" disabled={submit.status === 'submitting'}>
          Cobrar
        </button>
      </form>

      {submit.status === 'done' && <p>Cobro creado: {submit.paymentId}</p>}
      {submit.status === 'error' && <p role="alert">No pudimos crear el cobro: {submit.message}</p>}
    </section>
  );
}
