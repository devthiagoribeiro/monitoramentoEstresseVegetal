import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import AppShell from '../components/AppShell';
import {
  ActivityIcon,
  BatteryIcon,
  ChevronLeftIcon,
  CloseIcon,
  DropletsIcon,
  PlusIcon,
  RadioIcon,
  ThermometerIcon,
} from '../components/Icons';
import { api } from '../lib/api';

type Farm = { id: number; name: string; owner_name: string; address?: string | null };
type Sensor = {
  id: number;
  farm: number;
  mac_address: string;
  description?: string | null;
  is_active: boolean;
};
type Reading = {
  id: number;
  sensor: number;
  timestamp: string;
  dpv_kpa: number;
  humidity: number;
  temperature: number;
  battery: number;
  timeLabel?: string;
};

type ChartCardProps = {
  title: string;
  description: string;
  dataKey: keyof Reading;
  color: string;
  unit: string;
  icon: ReactNode;
  readings: Reading[];
};

function ChartCard({ title, description, dataKey, color, unit, icon, readings }: ChartCardProps) {
  return (
    <article className="chart-card">
      <div className="chart-heading">
        <div className="chart-icon" style={{ color }}>{icon}</div>
        <div><h3>{title}</h3><p>{description}</p></div>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={readings} margin={{ top: 18, right: 10, bottom: 0, left: -12 }}>
            <CartesianGrid stroke="#ecebe5" vertical={false} strokeDasharray="3 5" />
            <XAxis dataKey="timeLabel" stroke="#a8a29e" fontSize={11} axisLine={false} tickLine={false} dy={10} minTickGap={24} />
            <YAxis stroke="#a8a29e" fontSize={11} axisLine={false} tickLine={false} tickFormatter={(value) => `${value}${unit}`} width={55} />
            <Tooltip
              cursor={{ stroke: '#d6d3d1', strokeDasharray: '4 4' }}
              contentStyle={{ borderRadius: 12, border: '1px solid #e7e5e4', boxShadow: '0 12px 30px rgb(28 25 23 / 0.08)', fontSize: 12 }}
              formatter={(value) => [`${value}${unit}`, title]}
              labelStyle={{ color: '#78716c', marginBottom: 4 }}
            />
            <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.25} dot={false} activeDot={{ r: 4, strokeWidth: 2, fill: '#fff' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

export default function FarmDashboard() {
  const { farmId } = useParams();
  const navigate = useNavigate();
  const [farm, setFarm] = useState<Farm | null>(null);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [selectedSensorId, setSelectedSensorId] = useState('');
  const [readings, setReadings] = useState<Reading[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSensorModalOpen, setIsSensorModalOpen] = useState(false);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [sensorError, setSensorError] = useState('');
  const [deactivateError, setDeactivateError] = useState('');
  const [sensorForm, setSensorForm] = useState({ mac_address: '', description: '' });

  const fetchSensors = useCallback(async () => {
    const response = await api.get('/api/devices/sensors/');
    const farmSensors = response.data
      .filter((sensor: Sensor) => sensor.farm.toString() === farmId)
      .sort((first: Sensor, second: Sensor) => {
        if (first.is_active !== second.is_active) return first.is_active ? -1 : 1;
        return second.id - first.id;
      });
    setSensors(farmSensors);
    setSelectedSensorId((current) => {
      const selectionStillExists = farmSensors.some((sensor: Sensor) => sensor.id.toString() === current);
      return selectionStillExists ? current : farmSensors[0]?.id.toString() || '';
    });
    if (farmSensors.length === 0) setReadings([]);
    return farmSensors;
  }, [farmId]);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const [farmResponse] = await Promise.all([
          api.get(`/api/devices/farms/${farmId}/`),
          fetchSensors(),
        ]);
        setFarm(farmResponse.data);
      } finally {
        setIsLoading(false);
      }
    };
    void fetchOverview();
  }, [farmId, fetchSensors]);

  useEffect(() => {
    if (!selectedSensorId) {
      return;
    }
    const fetchReadings = async () => {
      const response = await api.get('/api/devices/readings/');
      const sensorReadings = response.data
        .filter((reading: Reading) => reading.sensor.toString() === selectedSensorId)
        .map((reading: Reading) => ({
          ...reading,
          timeLabel: new Date(reading.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        }))
        .sort((a: Reading, b: Reading) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      setReadings(sensorReadings);
    };
    void fetchReadings();
  }, [selectedSensorId, farmId]);

  useEffect(() => {
    if (!isSensorModalOpen && !isDeactivateModalOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSensorModalOpen(false);
        setIsDeactivateModalOpen(false);
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isSensorModalOpen, isDeactivateModalOpen]);

  const latestReading = readings.at(-1);
  const selectedSensor = useMemo(
    () => sensors.find((sensor) => sensor.id.toString() === selectedSensorId),
    [sensors, selectedSensorId],
  );

  const createSensor = async (event: React.FormEvent) => {
    event.preventDefault();
    setSensorError('');
    setIsSaving(true);
    try {
      const response = await api.post('/api/devices/sensors/', {
        mac_address: sensorForm.mac_address,
        description: sensorForm.description || null,
        farm: Number(farmId),
      });
      await fetchSensors();
      setSelectedSensorId(response.data.id.toString());
      setSensorForm({ mac_address: '', description: '' });
      setIsSensorModalOpen(false);
    } catch (error: unknown) {
      const detail = axios.isAxiosError(error) ? error.response?.data?.detail : null;
      setSensorError(typeof detail === 'string' ? detail : 'Verifique o identificador. O sensor precisa estar autorizado e disponível.');
    } finally {
      setIsSaving(false);
    }
  };

  const deactivateSensor = async () => {
    if (!selectedSensor) return;
    setDeactivateError('');
    setIsDeactivating(true);
    try {
      await api.post(`/api/devices/sensors/${selectedSensor.id}/deactivate/`);
      await fetchSensors();
      setIsDeactivateModalOpen(false);
    } catch (error: unknown) {
      const detail = axios.isAxiosError(error) ? error.response?.data?.detail : null;
      setDeactivateError(typeof detail === 'string' ? detail : 'Não foi possível desativar o sensor. Tente novamente.');
    } finally {
      setIsDeactivating(false);
    }
  };

  const metrics = [
    { label: 'DPV', value: latestReading ? latestReading.dpv_kpa.toFixed(2) : '—', unit: 'kPa', icon: <ActivityIcon />, color: '#b45309', note: 'Estresse atmosférico' },
    { label: 'Umidade', value: latestReading ? latestReading.humidity.toFixed(0) : '—', unit: '%', icon: <DropletsIcon />, color: '#0369a1', note: 'Umidade relativa' },
    { label: 'Temperatura', value: latestReading ? latestReading.temperature.toFixed(1) : '—', unit: '°C', icon: <ThermometerIcon />, color: '#c2410c', note: 'Microclima atual' },
    { label: 'Bateria', value: latestReading ? latestReading.battery.toFixed(0) : '—', unit: '%', icon: <BatteryIcon />, color: '#15803d', note: 'Carga do sensor' },
  ];

  return (
    <AppShell wide>
      <main className="app-container max-w-[1440px] py-7 sm:py-10">
        <button className="back-button" onClick={() => navigate('/dashboard')}><ChevronLeftIcon width={17} height={17} /> Fazendas</button>

        <section className="dashboard-heading">
          <div>
            <div className="flex items-center gap-3">
              <h1>{isLoading ? 'Carregando...' : farm?.name || 'Monitoramento'}</h1>
            </div>
            <p>{farm?.address || 'Dados ambientais e operacionais da propriedade em tempo real.'}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {selectedSensor?.is_active && (
              <button className="danger-button" onClick={() => setIsDeactivateModalOpen(true)}>
                Desativar sensor
              </button>
            )}
            {selectedSensor && (
              <span className={`connection-pill ${selectedSensor.is_active ? 'is-connected' : 'is-disconnected'}`}>
                <span className="status-dot" /> {selectedSensor.is_active ? 'Conectado' : 'Desconectado'}
              </span>
            )}
            <label className="sensor-select-label">
              <span>Sensor</span>
              <select value={selectedSensorId} onChange={(event) => setSelectedSensorId(event.target.value)}>
                {sensors.length === 0 && <option value="">Nenhum sensor conectado</option>}
                {sensors.map((sensor) => (
                  <option key={sensor.id} value={sensor.id}>
                    {sensor.description || sensor.mac_address}</option>
                ))}
              </select>
            </label>
            <button className="primary-button" onClick={() => setIsSensorModalOpen(true)}><PlusIcon width={18} height={18} /> Adicionar sensor</button>
          </div>
        </section>

        <section className="metrics-grid" aria-label="Últimas medições">
          {metrics.map((metric) => (
            <article className="metric-card" key={metric.label}>
              <div className="metric-icon" style={{ color: metric.color }}>{metric.icon}</div>
              <div><p>{metric.label}</p><strong>{metric.value}<small>{metric.unit}</small></strong><span>{metric.note}</span></div>
            </article>
          ))}
        </section>

        <div className="section-title-row">
          <div>
            <h2>Histórico ambiental</h2>
            <p>
              {selectedSensor
                ? `Leituras de ${selectedSensor.description || selectedSensor.mac_address}${selectedSensor.is_active ? '' : ' · instalação encerrada'}`
                : 'Conecte um sensor para começar a receber dados.'}
            </p>
          </div>
          {latestReading && <span>Última atualização: {new Date(latestReading.timestamp).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>}
        </div>

        {readings.length === 0 ? (
          <section className="empty-state compact">
            <div className="empty-icon"><RadioIcon width={24} height={24} /></div>
            <h2>{sensors.length === 0 ? 'Nenhum sensor conectado' : selectedSensor?.is_active ? 'Aguardando primeiras leituras' : 'Sensor desconectado sem leituras'}</h2>
            <p>{sensors.length === 0 ? 'Adicione um dispositivo autorizado para iniciar o monitoramento desta fazenda.' : selectedSensor?.is_active ? 'O sensor está conectado, mas ainda não enviou dados ambientais.' : 'Esta instalação foi encerrada e não recebeu leituras durante o período em que esteve ativa.'}</p>
            {sensors.length === 0 && <button className="secondary-button" onClick={() => setIsSensorModalOpen(true)}><PlusIcon width={17} height={17} /> Adicionar sensor</button>}
          </section>
        ) : (
          <section className="charts-grid">
            <ChartCard title="Déficit de pressão de vapor" description="Relação entre temperatura e umidade" dataKey="dpv_kpa" color="#b45309" unit=" kPa" icon={<ActivityIcon />} readings={readings} />
            <ChartCard title="Umidade relativa" description="Disponibilidade de vapor no ar" dataKey="humidity" color="#0369a1" unit="%" icon={<DropletsIcon />} readings={readings} />
            <ChartCard title="Temperatura" description="Condição térmica no ponto de coleta" dataKey="temperature" color="#c2410c" unit="°C" icon={<ThermometerIcon />} readings={readings} />
            <ChartCard title="Bateria do dispositivo" description="Autonomia disponível em campo" dataKey="battery" color="#15803d" unit="%" icon={<BatteryIcon />} readings={readings} />
          </section>
        )}
      </main>

      {isSensorModalOpen && (
        <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setIsSensorModalOpen(false)}>
          <section className="modal-panel max-w-[500px]" role="dialog" aria-modal="true" aria-labelledby="sensor-modal-title">
            <div className="modal-header">
              <div><p className="eyebrow">Dispositivo IoT</p><h2 id="sensor-modal-title">Conectar sensor</h2></div>
              <button className="icon-button" onClick={() => setIsSensorModalOpen(false)} aria-label="Fechar"><CloseIcon width={19} height={19} /></button>
            </div>
            <form onSubmit={createSensor} className="space-y-4 p-6 sm:p-7">
              <div className="sensor-hint"><RadioIcon width={20} height={20} /><p><strong>Use um dispositivo autorizado</strong><span>Informe o MAC/ID presente na etiqueta do sensor.</span></p></div>
              <div className="field-group">
                <label htmlFor="mac-address">MAC ou ID do sensor</label>
                <input id="mac-address" value={sensorForm.mac_address} onChange={(event) => setSensorForm((current) => ({ ...current, mac_address: event.target.value }))} placeholder="AA:BB:CC:DD:EE:FF" required autoFocus />
              </div>
              <div className="field-group">
                <label htmlFor="sensor-description">Identificação no campo <span>opcional</span></label>
                <input id="sensor-description" value={sensorForm.description} onChange={(event) => setSensorForm((current) => ({ ...current, description: event.target.value }))} placeholder="Ex.: Talhão Norte · Soja" />
              </div>
              {sensorError && <div className="form-error" role="alert">{sensorError}</div>}
              <div className="modal-actions">
                <button type="button" className="ghost-button" onClick={() => setIsSensorModalOpen(false)}>Cancelar</button>
                <button type="submit" className="primary-button" disabled={isSaving}>{isSaving ? <><span className="spinner" /> Conectando...</> : 'Conectar sensor'}</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {isDeactivateModalOpen && selectedSensor && (
        <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setIsDeactivateModalOpen(false)}>
          <section className="modal-panel max-w-[500px]" role="dialog" aria-modal="true" aria-labelledby="deactivate-modal-title">
            <div className="modal-header">
              <div><p className="eyebrow eyebrow-danger">Encerrar instalação</p><h2 id="deactivate-modal-title">Desativar sensor?</h2></div>
              <button className="icon-button" onClick={() => setIsDeactivateModalOpen(false)} aria-label="Fechar"><CloseIcon width={19} height={19} /></button>
            </div>
            <div className="space-y-5 p-6 sm:p-7">
              <div className="deactivate-summary">
                <RadioIcon width={21} height={21} />
                <div>
                  <strong>{selectedSensor.description || selectedSensor.mac_address}</strong>
                  <span>{selectedSensor.mac_address}</span>
                </div>
              </div>
              <p className="text-sm leading-6 text-stone-600">
                O sensor será marcado como desconectado e poderá ser usado em outra fazenda. Esta instalação e todo o histórico de leituras permanecerão disponíveis.
              </p>
              {deactivateError && <div className="form-error" role="alert">{deactivateError}</div>}
              <div className="modal-actions">
                <button type="button" className="ghost-button" onClick={() => setIsDeactivateModalOpen(false)}>Cancelar</button>
                <button type="button" className="danger-button danger-button-solid" onClick={deactivateSensor} disabled={isDeactivating}>
                  {isDeactivating ? <><span className="spinner" /> Desativando...</> : 'Confirmar desativação'}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </AppShell>
  );
}
