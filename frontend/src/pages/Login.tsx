import { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { ActivityIcon, LeafIcon, RadioIcon, ShieldIcon } from '../components/Icons';
import { api, saveSession } from '../lib/api';

type AuthMode = 'login' | 'register';

export default function Login({ mode }: { mode: AuthMode }) {
  const isRegister = mode === 'register';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [profession, setProfession] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isRegister && password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    try {
      setIsSubmitting(true);
      const endpoint = isRegister ? '/api/auth/register/' : '/api/auth/login/';
      const payload = isRegister
        ? { name, email, password, phone: phone || null, profession: profession || null }
        : { email, password };
      const response = await api.post(endpoint, payload);
      saveSession(response.data.access_token, response.data.user);
      navigate('/dashboard');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        setError(typeof detail === 'string' ? detail : 'Revise os dados informados e tente novamente.');
      } else {
        setError('Não foi possível concluir. Tente novamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-story" aria-label="Sobre a plataforma">
        <div className="relative z-10 flex h-full flex-col justify-between">
          <div className="auth-brand">
            <span className="brand-mark brand-mark-light"><LeafIcon width={20} height={20} /></span>
            <span className="text-[18px] font-semibold tracking-[-0.03em]">Cultiva</span>
            <span className="rounded-full border border-white/20 px-2 py-0.5 text-[10px] font-bold tracking-[0.16em] text-lime-200">IOT</span>
          </div>

          <div className="max-w-xl pb-10 lg:pb-20">
            <span className="eyebrow eyebrow-dark"><span className="status-dot" /> Inteligência no campo, em tempo real</span>
            <h1 className="mt-6 max-w-lg text-4xl font-medium leading-[1.08] tracking-[-0.045em] text-white lg:text-6xl">
              Cultive decisões com dados vivos.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-emerald-50/70 lg:text-lg">
              Sensores acompanham o microclima da lavoura e transformam sinais do campo em decisões claras para sua operação.
            </p>
            <div className="mt-10 grid max-w-lg grid-cols-3 gap-3">
              <div className="auth-metric"><ActivityIcon /><strong>24/7</strong><span>monitoramento</span></div>
              <div className="auth-metric"><RadioIcon /><strong>IoT</strong><span>em campo</span></div>
              <div className="auth-metric"><ShieldIcon /><strong>Seguro</strong><span>por fazenda</span></div>
            </div>
          </div>

        </div>
        <div className="field-lines" aria-hidden="true" />
        <div className="field-glow" aria-hidden="true" />
      </section>

      <section className="auth-form-side">
        <div className="w-full max-w-[440px]">
          <div className="mb-9">
            <p className="eyebrow">{isRegister ? 'Comece agora' : 'Área do produtor'}</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-stone-900">
              {isRegister ? 'Crie sua conta' : 'Bem-vindo de volta'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-stone-500">
              {isRegister ? 'Cadastre-se para conectar suas fazendas e sensores.' : 'Entre para acompanhar suas lavouras.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div className="field-group">
                <label htmlFor="name">Nome completo</label>
                <input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Como devemos chamar você?" minLength={2} required autoComplete="name" />
              </div>
            )}

            <div className="field-group">
              <label htmlFor="email">E-mail</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@fazenda.com.br" required autoComplete="email" />
            </div>

            {isRegister && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="field-group">
                  <label htmlFor="profession">Profissão <span>opcional</span></label>
                  <input id="profession" value={profession} onChange={(e) => setProfession(e.target.value)} placeholder="Ex.: Agrônomo" autoComplete="organization-title" />
                </div>
                <div className="field-group">
                  <label htmlFor="phone">Telefone <span>opcional</span></label>
                  <input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 00000-0000" autoComplete="tel" />
                </div>
              </div>
            )}

            <div className="field-group">
              <label htmlFor="password">Senha</label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={isRegister ? 'Mínimo de 8 caracteres' : 'Sua senha'} minLength={isRegister ? 8 : 1} required autoComplete={isRegister ? 'new-password' : 'current-password'} />
            </div>

            {isRegister && (
              <div className="field-group">
                <label htmlFor="confirm-password">Confirmar senha</label>
                <input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repita sua senha" minLength={8} required autoComplete="new-password" />
              </div>
            )}

            {error && <div className="form-error" role="alert">{error}</div>}

            <button className="primary-button w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? <><span className="spinner" /> Aguarde...</> : isRegister ? 'Criar conta' : 'Entrar na plataforma'}
            </button>
          </form>

          <div className="mt-7 border-t border-stone-200 pt-6 text-center text-sm text-stone-500">
            {isRegister ? 'Já possui uma conta?' : 'Ainda não possui uma conta?'}{' '}
            <Link className="font-semibold text-emerald-800 underline-offset-4 hover:underline" to={isRegister ? '/' : '/cadastro'}>
              {isRegister ? 'Fazer login' : 'Criar conta gratuitamente'}
            </Link>
          </div>

          {!isRegister && (
            <div className="mt-8 flex items-center justify-center gap-2 text-xs text-stone-400">
              <ShieldIcon width={14} height={14} /> Seus dados são protegidos por autenticação segura.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
