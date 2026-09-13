import { useState } from 'react';
import axios from 'axios';

// 1. Configurações Globais do Axios
axios.defaults.withCredentials = true;
// Definimos a URL base para não precisarmos digitar o endereço completo toda vez
axios.defaults.baseURL = 'http://localhost:8000'; 

export default function App() {
  // Estados do Formulário
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Estados da Aplicação
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [farms, setFarms] = useState([]);

  // Função disparada ao clicar no botão "Entrar"
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // Impede o navegador de recarregar a página (comportamento padrão do HTML)
    setError(''); // Limpa erros anteriores

    try {
      // 2. Faz o POST para a nossa rota de login no Django
      await axios.post('/api/auth/login/', {
        email: email,
        password: password
      });
      
      // 3. Se a linha acima não der erro, o Django nos deu o Cookie!
      setIsLoggedIn(true);
      fetchFarms(); // Agora que temos o cookie, vamos buscar as fazendas
      
    } catch (err) {
      setError('E-mail ou senha incorretos.');
      console.error(err);
    }
  };

  // Função para buscar as fazendas
  const fetchFarms = async () => {
    try {
      const response = await axios.get('/api/devices/farms/');
      setFarms(response.data);
    } catch (err) {
      console.error("Erro ao buscar fazendas:", err);
    }
  };

  // 4. RENDERIZAÇÃO CONDICIONAL: Se não estiver logado, mostra a tela de Login
  if (!isLoggedIn) {
    return (
      <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
        <h1>Login - IoT Dashboard</h1>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '10px' }}>
            <label>E-mail: </label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Senha: </label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          
          {/* Se houver algum erro, mostra o texto em vermelho */}
          {error && <p style={{ color: 'red' }}>{error}</p>}
          
          <button type="submit">Entrar</button>
        </form>
      </div>
    );
  }

  // 5. Se estiver logado, mostra o Dashboard
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Dashboard IoT</h1>
      <h2>Minhas Fazendas:</h2>
      <ul>
        {farms.map((farm: any) => (
          <li key={farm.id}>
            <strong>{farm.name}</strong> - Proprietário: {farm.owner_name} - Endereço: {farm.address}
          </li>
        ))}
      </ul>
    </div>
  );
}