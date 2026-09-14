import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [farms, setFarms] = useState([]);
  const [sensors, setSensors] = useState([]); // <-- Novo estado para os sensores
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Buscamos as fazendas e os sensores ao mesmo tempo
        const farmsResponse = await axios.get('/api/devices/farms/');
        const sensorsResponse = await axios.get('/api/devices/sensors/');
        
        setFarms(farmsResponse.data);
        setSensors(sensorsResponse.data);
      } catch (err: any) {
        if (err.response?.status === 403) {
          navigate('/');
        }
        console.error("Erro ao buscar dados:", err);
      }
    };

    fetchData();
  }, [navigate]);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Dashboard IoT</h1>
      
      <h2>Minhas Fazendas:</h2>
      <ul>
        {farms.map((farm: any) => (
          <li key={farm.id}>
            <strong>{farm.name}</strong> - Proprietário: {farm.owner_name}
          </li>
        ))}
      </ul>

      <hr style={{ margin: '20px 0' }} />

      <h2>Meus Sensores em Campo:</h2>
      <ul>
        {sensors.map((sensor: any) => (
          <li key={sensor.id}>
            <strong>ID do Sensor:</strong> {sensor.mac_address || sensor.id} <br />
            {/* Aqui exibimos a sua nova coluna description! */}
            <strong>Localização/Tag:</strong> {sensor.description || 'Sem descrição'} 
          </li>
        ))}
      </ul>
    </div>
  );
}