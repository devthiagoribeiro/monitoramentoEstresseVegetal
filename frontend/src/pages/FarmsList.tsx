import { useEffect, useMemo, useState } from 'react';
import AppShell from '../components/AppShell';
import { ArrowRightIcon, CloseIcon, LeafIcon, MapPinIcon, PlusIcon, RadioIcon, TrashIcon } from '../components/Icons';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';

type Farm = {
  id: number;
  name: string;
  address?: string | null;
  owner_name: string;
  contact_phone?: string | null;
  contact_email?: string | null;
};

type Sensor = { id: number; farm: number; is_active: boolean };

const emptyForm = {
  name: '',
  address: '',
  owner_name: '',
  contact_phone: '',
  contact_email: '',
};

export default function FarmsList() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [farmToDelete, setFarmToDelete] = useState<Farm | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [error, setError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [farmsResponse, sensorsResponse] = await Promise.all([
        api.get('/api/devices/farms/'),
        api.get('/api/devices/sensors/'),
      ]);
      setFarms(farmsResponse.data);
      setSensors(sensorsResponse.data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void fetchData(); }, []);

  useEffect(() => {
    if (!isModalOpen && !farmToDelete) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsModalOpen(false);
        setFarmToDelete(null);
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isModalOpen, farmToDelete]);

  const activeSensors = useMemo(() => sensors.filter((sensor) => sensor.is_active).length, [sensors]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleCreateFarm = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsSaving(true);
    try {
      await api.post('/api/devices/farms/', {
        ...formData,
        address: formData.address || null,
        contact_phone: formData.contact_phone || null,
        contact_email: formData.contact_email || null,
      });
      setFormData(emptyForm);
      setIsModalOpen(false);
      await fetchData();
    } catch {
      setError('Não foi possível cadastrar. Revise os campos informados.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteFarm = async () => {
    if (!farmToDelete) return;
    setDeleteError('');
    setIsDeleting(true);
    try {
      await api.delete(`/api/devices/farms/${farmToDelete.id}/`);
      setFarmToDelete(null);
      await fetchData();
    } catch {
      setDeleteError('Não foi possível remover a fazenda. Tente novamente.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AppShell>
      <main className="app-container max-w-6xl py-8 sm:py-12">
        <section className="page-heading">
          <div>
            <p className="eyebrow">Visão geral</p>
            <h1>Suas fazendas</h1>
            <p>Acompanhe a saúde das lavouras e acesse os sensores de cada propriedade.</p>
          </div>
          <button className="primary-button" onClick={() => setIsModalOpen(true)}>
            <PlusIcon width={18} height={18} /> Nova fazenda
          </button>
        </section>

        <section className="summary-strip" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }} aria-label="Resumo da operação">
          <div><span>Fazendas conectadas</span><strong>{farms.length}</strong></div>
          <div><span>Instalações registradas</span><strong>{sensors.length}</strong></div>
          <div><span>Sensores ativos</span><strong className="text-emerald-700">{activeSensors}</strong></div>
        </section>

        {isLoading ? (
          <div className="farm-grid" aria-label="Carregando fazendas">
            {[1, 2].map((item) => <div key={item} className="farm-card skeleton-card" />)}
          </div>
        ) : farms.length === 0 ? (
          <section className="empty-state">
            <div className="empty-icon"><LeafIcon width={25} height={25} /></div>
            <h2>Comece pela sua primeira fazenda</h2>
            <p>Organize sensores e leituras por propriedade para ter uma visão clara da sua operação.</p>
            <button className="secondary-button" onClick={() => setIsModalOpen(true)}>
              <PlusIcon width={17} height={17} /> Cadastrar fazenda
            </button>
          </section>
        ) : (
          <section className="farm-grid" aria-label="Lista de fazendas">
            {farms.map((farm, index) => {
              const farmSensors = sensors.filter((sensor) => sensor.farm === farm.id);
              const activeFarmSensors = farmSensors.filter((sensor) => sensor.is_active);
              return (
                <article
                  key={farm.id}
                  className="farm-card"
                  style={{ '--card-index': index } as React.CSSProperties}
                >
                  <div className="flex items-start justify-between gap-5">
                    <div className="farm-symbol"><LeafIcon width={21} height={21} /></div>
                    <div className="farm-card-actions">
                      <span className={`online-pill ${activeFarmSensors.length === 0 ? 'is-offline' : ''}`}>
                        <span className="status-dot" /> {activeFarmSensors.length > 0 ? 'Monitorada' : 'Sem sensor ativo'}
                      </span>
                      <button
                        className="farm-remove-button"
                        onClick={() => { setDeleteError(''); setFarmToDelete(farm); }}
                        aria-label={`Remover ${farm.name}`}
                        title="Remover fazenda"
                      >
                        <TrashIcon width={16} height={16} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-8 text-left">
                    <h2>{farm.name}</h2>
                    <p className="mt-1 text-sm text-stone-500">Responsável: {farm.owner_name}</p>
                    <div className="mt-4 flex min-h-5 items-center gap-2 text-xs text-stone-500">
                      <MapPinIcon width={15} height={15} />
                      <span className="line-clamp-1">{farm.address || 'Localização não informada'}</span>
                    </div>
                  </div>
                  <div className="farm-card-footer">
                    <span><RadioIcon width={16} height={16} /> {activeFarmSensors.length} ativos · {farmSensors.length} instalações</span>
                    <button className="card-link" onClick={() => navigate(`/dashboard/${farm.id}`)}>
                      Abrir painel <ArrowRightIcon width={16} height={16} />
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>

      {isModalOpen && (
        <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setIsModalOpen(false)}>
          <section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="farm-modal-title">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Nova propriedade</p>
                <h2 id="farm-modal-title">Cadastrar fazenda</h2>
              </div>
              <button className="icon-button" onClick={() => setIsModalOpen(false)} aria-label="Fechar">
                <CloseIcon width={19} height={19} />
              </button>
            </div>

            <form onSubmit={handleCreateFarm} className="space-y-4 p-6 sm:p-7">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="field-group sm:col-span-2">
                  <label htmlFor="farm-name">Nome da fazenda</label>
                  <input id="farm-name" name="name" value={formData.name} onChange={handleChange} placeholder="Ex.: Fazenda Santa Clara" required autoFocus />
                </div>
                <div className="field-group sm:col-span-2">
                  <label htmlFor="owner-name">Nome do proprietário</label>
                  <input id="owner-name" name="owner_name" value={formData.owner_name} onChange={handleChange} placeholder="Ex.: Carlos Silva" required />
                </div>
                <div className="field-group sm:col-span-2">
                  <label htmlFor="address">Endereço <span>opcional</span></label>
                  <textarea id="address" name="address" value={formData.address} onChange={handleChange} placeholder="Rodovia, município e estado" rows={2} />
                </div>
                <div className="field-group">
                  <label htmlFor="contact-phone">Telefone <span>opcional</span></label>
                  <input id="contact-phone" name="contact_phone" value={formData.contact_phone} onChange={handleChange} placeholder="(00) 00000-0000" />
                </div>
                <div className="field-group">
                  <label htmlFor="contact-email">E-mail <span>opcional</span></label>
                  <input id="contact-email" type="email" name="contact_email" value={formData.contact_email} onChange={handleChange} placeholder="contato@fazenda.com" />
                </div>
              </div>

              {error && <div className="form-error" role="alert">{error}</div>}

              <div className="modal-actions">
                <button type="button" className="ghost-button" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="primary-button" disabled={isSaving}>
                  {isSaving ? <><span className="spinner" /> Salvando...</> : 'Salvar fazenda'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {farmToDelete && (
        <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setFarmToDelete(null)}>
          <section className="modal-panel max-w-[500px]" role="dialog" aria-modal="true" aria-labelledby="delete-farm-title">
            <div className="modal-header">
              <div><p className="eyebrow eyebrow-danger">Ação permanente</p><h2 id="delete-farm-title">Remover fazenda?</h2></div>
              <button className="icon-button" onClick={() => setFarmToDelete(null)} aria-label="Fechar"><CloseIcon width={19} height={19} /></button>
            </div>
            <div className="space-y-5 p-6 sm:p-7">
              <div className="deactivate-summary">
                <LeafIcon width={21} height={21} />
                <div><strong>{farmToDelete.name}</strong><span>{farmToDelete.owner_name}</span></div>
              </div>
              <p className="text-sm leading-6 text-stone-600">
                Esta ação remove permanentemente a fazenda, suas instalações de sensores e todo o histórico de leituras associado. Dispositivos ativos serão liberados para uso em outra fazenda.
              </p>
              {deleteError && <div className="form-error" role="alert">{deleteError}</div>}
              <div className="modal-actions">
                <button type="button" className="ghost-button" onClick={() => setFarmToDelete(null)}>Cancelar</button>
                <button type="button" className="danger-button danger-button-solid" onClick={handleDeleteFarm} disabled={isDeleting}>
                  {isDeleting ? <><span className="spinner" /> Removendo...</> : 'Remover permanentemente'}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </AppShell>
  );
}
