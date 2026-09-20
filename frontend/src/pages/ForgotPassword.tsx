import { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import AuthActionLayout from '../components/AuthActionLayout';
import { CheckIcon, MailIcon } from '../components/Icons';
import { api } from '../lib/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      setIsSubmitting(true);
      await api.post('/api/auth/forgot-password/', { email });
      setSent(true);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.detail ?? 'Não foi possível enviar as instruções.');
      } else {
        setError('Não foi possível enviar as instruções.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthActionLayout
      eyebrow="Recuperação de acesso"
      title={sent ? 'Confira seu e-mail' : 'Esqueceu sua senha?'}
      description={sent
        ? 'Se houver uma conta com esse endereço, as instruções de recuperação chegarão em instantes.'
        : 'Informe o e-mail da sua conta. Enviaremos um link seguro para criar uma nova senha.'}
    >
      {sent ? (
        <div className="account-action-result" role="status">
          <span className="account-action-icon is-success"><CheckIcon /></span>
          <strong>Solicitação recebida</strong>
          <span>O link expira em 30 minutos e pode ser usado uma única vez.</span>
          <button className="secondary-button w-full" type="button" onClick={() => setSent(false)}>Tentar outro e-mail</button>
        </div>
      ) : (
        <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
          <div className="field-group">
            <label htmlFor="recovery-email">E-mail</label>
            <div className="input-with-icon">
              <MailIcon />
              <input id="recovery-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@fazenda.com.br" autoComplete="email" required autoFocus />
            </div>
          </div>
          {error && <div className="form-error" role="alert">{error}</div>}
          <button className="primary-button w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? <><span className="spinner" /> Enviando...</> : 'Enviar link de recuperação'}
          </button>
        </form>
      )}
      <Link className="account-action-link" to="/">Voltar para o login</Link>
    </AuthActionLayout>
  );
}
