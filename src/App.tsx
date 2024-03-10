import { useState } from 'react';
import { Dashboard } from './pages/Dashboard';
import { NewCharge } from './pages/NewCharge';
import { logout } from './auth';

type View = 'dashboard' | 'new-charge';

export function App() {
  const [view, setView] = useState<View>('dashboard');

  return (
    <div>
      <header>
        <nav>
          <button type="button" onClick={() => setView('dashboard')}>
            Dashboard
          </button>
          <button type="button" onClick={() => setView('new-charge')}>
            Nuevo cobro
          </button>
        </nav>
        <button type="button" onClick={logout}>
          Salir
        </button>
      </header>

      <main>{view === 'dashboard' ? <Dashboard /> : <NewCharge />}</main>
    </div>
  );
}
