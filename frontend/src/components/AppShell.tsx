import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, getStoredUser } from '../lib/api';
import { LeafIcon, LogOutIcon } from './Icons';

type AppShellProps = {
  children: ReactNode;
  wide?: boolean;
};

export default function AppShell({ children, wide = false }: AppShellProps) {
  const navigate = useNavigate();
  const user = getStoredUser();

  const logout = () => {
    clearSession();
    navigate('/');
  };

  return (
    <div className="app-surface min-h-screen">
      <header className="app-header">
        <div className={`app-container ${wide ? 'max-w-[1440px]' : 'max-w-6xl'} flex h-17 items-center justify-between`}>
          <button className="brand-button" onClick={() => navigate('/dashboard')} aria-label="Ir para fazendas">
            <span className="brand-mark"><LeafIcon width={19} height={19} /></span>
            <span className="brand-name">Cultiva</span>
            <span className="brand-tag">IoT</span>
          </button>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-[13px] font-semibold text-stone-800">{user?.name ?? 'Produtor'}</p>
              <p className="text-[11px] text-stone-500">{user?.profession || user?.email || 'Monitoramento rural'}</p>
            </div>
            <div className="user-avatar" aria-hidden="true">{user?.name?.charAt(0).toUpperCase() ?? 'P'}</div>
            <button className="icon-button" onClick={logout} title="Sair" aria-label="Sair da conta">
              <LogOutIcon width={18} height={18} />
            </button>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}

