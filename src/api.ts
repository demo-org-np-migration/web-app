import { getToken } from './auth';

// Tipos que reflejan lo que devuelve merchant-portal-bff, que a su vez pasa casi sin tocar
// lo que le contestan payments-api y accounts-api (las convenciones internas de API). No repetimos acá su
// documentación completa, solo los campos que esta pantalla pinta.
export interface Merchant {
  id: string;
  name: string;
  account_id: string;
}

export interface Account {
  id: string;
  currency: string;
  balance: string;
  status: string;
}

export interface Payment {
  id: string;
  from_account: string;
  to_account: string;
  merchant_id: string | null;
  amount: string;
  currency: string;
  status: string;
  created_at: string;
}

export interface DashboardResponse {
  merchant: Merchant;
  account: Account;
  payments: Payment[];
}

export interface CreateChargeBody {
  from_account: string;
  amount: string;
  currency: string;
  reference: string;
}

// Mismo origen: en el cluster el gateway rutea `/merchant` al BFF (las convenciones internas de API); en local
// lo hace el proxy de Vite (ver vite.config.ts). Nunca hardcodeamos un host acá.
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(path, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${init?.method ?? 'GET'} ${path} -> ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  getDashboard(): Promise<DashboardResponse> {
    return request<DashboardResponse>('/merchant/dashboard');
  },

  createCharge(body: CreateChargeBody): Promise<Payment> {
    return request<Payment>('/merchant/charges', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
};
