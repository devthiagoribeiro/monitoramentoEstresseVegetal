import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

axios.defaults.withCredentials = true;
axios.defaults.baseURL = 'http://127.0.0.1:8000';

export default function FarmDashboard() {
  const { farmId } = useParams(); // Pega o ID da URL
  const navigate = useNavigate();
  
  const [sensors, setSensors] = useState<any[]>([]);
  const [selectedSensorId, setSelectedSensorId] = useState<string>('');
  const [readings, setReadings] = useState<any[]>([]);

  useEffect(() => {
    // Busca os sensores que pertencem a esta fazenda
    const fetchSensors = async () => {
      try {
        const res = await axios.get('/api/devices/sensors/');
        // Filtra no frontend (idealmente faríamos na API futuramente)
        const farmSensors = res.data.filter((s: any) => s.farm.toString() === farmId);
        setSensors(farmSensors);
        
        if (farmSensors.length > 0) {
          setSelectedSensorId(farmSensors[0].id.toString());
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchSensors();
  }, [farmId]);

  useEffect(() => {
    if (!selectedSensorId) return;

    const fetchReadings = async () => {
      try {
        // Buscamos todas as leituras da API
        const res = await axios.get('/api/devices/readings/');
        
        // Filtramos pelo sensor selecionado e garantimos que o carimbo da fazenda confere
        const sensorReadings = res.data
          .filter((r: any) => r.sensor.toString() === selectedSensorId && r.farm?.toString() === farmId)
          .map((r: any) => {
            const date = new Date(r.timestamp);
            return {
              ...r,
              horaFormatada: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
          })
          .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        setReadings(sensorReadings);
      } catch (err) {
        console.error(err);
      }
    };
    fetchReadings();
  }, [selectedSensorId, farmId]);
  // Função auxiliar para renderizar cada um dos 4 gráficos padronizados
  const renderChart = (title: string, dataKey: string, color: string, unit: string) => (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
      <h3 className="text-lg font-bold text-gray-700 mb-4">{title}</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={readings} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis dataKey="horaFormatada" stroke="#6b7280" fontSize={12} />
            <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(val) => `${val}${unit}`} />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              labelStyle={{ fontWeight: 'bold', color: '#374151' }}
            />
            <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={3} dot={{ r: 4, fill: color }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-blue-600 text-white p-4 shadow-md flex justify-between items-center">
        <button onClick={() => navigate('/dashboard')} className="font-bold hover:underline">
          &larr; Voltar às Fazendas
        </button>
        <button className="bg-blue-500 hover:bg-blue-700 px-4 py-2 rounded text-sm font-semibold transition">
          + Adicionar Sensor
        </button>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Monitoramento da Fazenda</h1>
          
          {/* Filtro de Sensores */}
          <div className="flex items-center gap-3">
            <label className="font-semibold text-gray-600">Visualizando Sensor:</label>
            <select 
              className="bg-white border border-gray-300 text-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 shadow-sm"
              value={selectedSensorId}
              onChange={(e) => setSelectedSensorId(e.target.value)}
            >
              {sensors.length === 0 && <option value="">Nenhum sensor encontrado</option>}
              {sensors.map(s => (
                <option key={s.id} value={s.id}>
                  {s.description || s.mac_address || `Sensor #${s.id}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {readings.length === 0 ? (
          <div className="bg-white p-10 text-center rounded-xl shadow-sm border border-gray-200">
            <p className="text-gray-500">Nenhuma leitura encontrada para este sensor no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {renderChart("Déficit de Pressão de Vapor (DPV)", "dpv_kpa", "#ef4444", "kPa")}
            {renderChart("Umidade do Ar", "humidity", "#3b82f6", "%")}
            {renderChart("Temperatura", "temperature", "#f97316", "°C")}
            {renderChart("Nível de Bateria do Sensor", "battery", "#22c55e", "%")}
          </div>
        )}
      </main>
    </div>
  );
}