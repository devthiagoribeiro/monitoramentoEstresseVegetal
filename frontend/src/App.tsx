import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Login from './pages/Login';
import FarmsList from './pages/FarmsList';
import FarmDashboard from './pages/FarmDashboard';

// Configurações globais
axios.defaults.withCredentials = true;
axios.defaults.baseURL = 'http://127.0.0.1:8000';

// Função auxiliar para ler o cookie do CSRF diretamente do navegador
function getCookie(name: string) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

// Interceptor: Antes de qualquer requisição sair, pegamos o token e colocamos no cabeçalho
axios.interceptors.request.use((config) => {
  const token = getCookie('csrftoken');
  if (token) {
    config.headers['X-CSRFToken'] = token;
  }
  return config;
});

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<FarmsList />} />
        <Route path="/dashboard/:farmId" element={<FarmDashboard />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}