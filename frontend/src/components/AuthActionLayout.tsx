import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LeafIcon } from './Icons';

type AuthActionLayoutProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export default function AuthActionLayout({ eyebrow, title, description, children }: AuthActionLayoutProps) {
  return (
    <main className="account-action-page">
      <Link className="account-action-brand" to="/" aria-label="Ir para o login">
        <span className="brand-mark"><LeafIcon width={19} height={19} /></span>
        <span>Cultiva</span>
        <small>IOT</small>
      </Link>
      <section className="account-action-card">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="account-action-description">{description}</p>
        {children}
      </section>
      <p className="account-action-footer">Monitoramento inteligente para decisões melhores no campo.</p>
    </main>
  );
}
