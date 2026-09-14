import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function FarmsList() {
  const [farms, setFarms] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estados para todos os campos do modelo de Fazenda
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    owner_name: '',
    contact_phone: '',
    contact_email: ''
  });
  
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchFarms = async () => {
    try {
      const response = await axios.get('/api/devices/farms/');
      setFarms(response.data);
    } catch (err: any) {
      if (err.response?.status === 403) navigate('/');
    }
  };

  useEffect(() => {
    fetchFarms();
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // Envia todos os dados preenchidos para a API
      await axios.post('/api/devices/farms/', formData);
      
      // Limpa o formulário e fecha o modal
      setFormData({ name: '', address: '', owner_name: '', contact_phone: '', contact_email: '' });
      setIsModalOpen(false);
      fetchFarms(); 
    } catch (err: any) {
      setError('Erro ao cadastrar a fazenda. Verifique os campos.');
      console.error(err.response?.data || err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Minhas Fazendas</h1>
            <p className="text-gray-500 text-sm mt-1">Selecione uma fazenda para visualizar o monitoramento</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold shadow transition duration-200 flex items-center gap-2"
          >
            <span>+</span> Adicionar Fazenda
          </button>
        </div>

        {/* Lista de Fazendas */}
        {farms.length === 0 ? (
          <div className="bg-white p-10 text-center rounded-xl shadow-sm border border-gray-200">
            <p className="text-gray-500 mb-4">Você ainda não possui nenhuma fazenda cadastrada.</p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="text-blue-600 font-semibold hover:underline"
            >
              Clique aqui para cadastrar a primeira fazenda
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {farms.map((farm: any) => (
              <div 
                key={farm.id} 
                onClick={() => navigate(`/dashboard/${farm.id}`)}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-400 cursor-pointer transition transform hover:-translate-y-1"
              >
                <h2 className="text-xl font-bold text-blue-600">{farm.name}</h2>
                <p className="text-gray-600 mt-2 text-sm">Proprietário: {farm.owner_name}</p>
                {farm.address && <p className="text-gray-400 text-xs mt-1">📍 {farm.address}</p>}
                <div className="mt-4 text-sm text-blue-500 font-semibold flex items-center justify-end">
                  Acessar Dashboard &rarr;
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de Cadastro de Fazenda Completo */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg my-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Cadastrar Nova Fazenda</h2>
              
              <form onSubmit={handleCreateFarm} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Fazenda *</label>
                  <input 
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Ex: Fazenda Santa Clara"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Proprietário *</label>
                  <input 
                    type="text" 
                    name="owner_name"
                    value={formData.owner_name}
                    onChange={handleChange}
                    placeholder="Ex: Carlos Silva"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                  <textarea 
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Ex: Rodovia BR-101, km 20"
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefone de Contato</label>
                    <input 
                      type="text" 
                      name="contact_phone"
                      value={formData.contact_phone}
                      onChange={handleChange}
                      placeholder="(00) 00000-0000"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">E-mail de Contato</label>
                    <input 
                      type="email" 
                      name="contact_email"
                      value={formData.contact_email}
                      onChange={handleChange}
                      placeholder="contato@fazenda.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <div className="flex justify-end gap-3 mt-6 pt-2 border-t border-gray-100">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow transition"
                  >
                    Salvar Fazenda
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}