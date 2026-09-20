import { useState } from 'react';
import axios from 'axios';
import { Link, useSearchParams } from 'react-router-dom';
import AuthActionLayout from '../components/AuthActionLayout';
import { CheckIcon, KeyIcon } from '../components/Icons';
import { api } from '../lib/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState(token ? '' : 'O link de recuperação está incompleto.');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (password !== confirmation) {
      setError('As senhas não coincidem.');
      return;
    }
    if (!token) {
      setError('O link de recuperação está incompleto.');
      return;
    }
    try {
      setIsSubmitting(true);
      await api.post('/api/auth/reset-password/', { token, new_password: password });
      setSuccess(true);
    } catch (err: unknown) {
      setError(axios.isAxiosError(err) ? err.response?.data?.detail ?? 'Não foi possível redefinir a senha.' : 'Não foi possível redefinir a senha.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthActionLayout
      eyebrow="Nova credencial"
      title={success ? 'Senha atualizada' : 'Crie uma nova senha'}
      description={success ? 'Sua nova senha já está ativa e o link de recuperação não pode mais ser reutilizado.' : 'Escolha uma senha com pelo menos 8 caracteres para proteger sua conta.'}
    >
      {success ? (
        <div className="account-action-result" role="status">
          <span className="account-action-icon is-success"><CheckIcon /></span>
          <strong>Alteração concluída com segurança.</strong>
          <Link className="primary-button mt-4 w-full" to="/">Entrar com a nova senha</Link>
        </div>
      ) : (
        <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
          <span className="account-action-icon"><KeyIcon /></span>
          <div className="field-group">
            <label htmlFor="new-password">Nova senha</label>
            <input id="new-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} maxLength={128} autoComplete="new-password" required autoFocus />
          </div>
          <div className="field-group">
            <label htmlFor="confirm-new-password">Confirmar nova senha</label>
            <input id="confirm-new-password" type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} minLength={8} maxLength={128} autoComplete="new-password" required />
          </div>
          {error && <div className="form-error" role="alert">{error}</div>}
          <button className="primary-button w-full" type="submit" disabled={isSubmitting || !token}>
            {isSubmitting ? <><span className="spinner" /> Salvando...</> : 'Salvar nova senha'}
          </button>
        </form>
      )}
      {!success && <Link className="account-action-link" to="/">Voltar para o login</Link>}
    </AuthActionLayout>
  );
}
