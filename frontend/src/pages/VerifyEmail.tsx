import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useSearchParams } from 'react-router-dom';
import AuthActionLayout from '../components/AuthActionLayout';
import { CheckIcon, MailIcon } from '../components/Icons';
import { api } from '../lib/api';

type VerificationState = 'loading' | 'success' | 'error';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [state, setState] = useState<VerificationState>(token ? 'loading' : 'error');
  const [message, setMessage] = useState(token
    ? 'Estamos validando seu link com segurança.'
    : 'O link de confirmação está incompleto. Solicite um novo link.');

  useEffect(() => {
    if (!token) return;
    api.post('/api/auth/verify-email/', { token })
      .then((response) => {
        setState('success');
        setMessage(response.data.detail);
      })
      .catch((err: unknown) => {
        setState('error');
        setMessage(axios.isAxiosError(err) ? err.response?.data?.detail ?? 'Não foi possível confirmar o e-mail.' : 'Não foi possível confirmar o e-mail.');
      });
  }, [token]);

  return (
    <AuthActionLayout
      eyebrow="Validação de identidade"
      title={state === 'loading' ? 'Confirmando seu e-mail' : state === 'success' ? 'E-mail confirmado' : 'Link inválido'}
      description={message}
    >
      <div className="account-action-result" role="status">
        <span className={`account-action-icon ${state === 'success' ? 'is-success' : state === 'error' ? 'is-error' : ''}`}>
          {state === 'loading' ? <span className="spinner spinner-dark" /> : state === 'success' ? <CheckIcon /> : <MailIcon />}
        </span>
        {state === 'success' && <strong>Sua conta está pronta para uso.</strong>}
        {state === 'error' && <strong>Não conseguimos validar este endereço.</strong>}
      </div>
      {state !== 'loading' && <Link className="primary-button mt-7 w-full" to={state === 'success' ? '/' : '/'}>{state === 'success' ? 'Entrar na plataforma' : 'Voltar para o login'}</Link>}
    </AuthActionLayout>
  );
}
