import { useEffect, useState } from 'react';
import axios from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { 
  Lock, Unlock, CheckCircle2, DollarSign, ShoppingBag, Users, Activity, ChefHat, Filter 
} from 'lucide-react';
import { askConfirmation, showSuccess, showError } from '../../utils/sweetAlert';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [turno, setTurno] = useState(null);
  const [datosTurno, setDatosTurno] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Estado para las pestañas del gráfico
  const [chartCategory, setChartCategory] = useState('global');

  const { token, user } = useAuthStore();

  const fetchData = async () => {
    try {
      const resTurno = await axios.get('/turnos', { headers: { Authorization: `Bearer ${token}` } });
      setTurno(resTurno.data.estado);
      setDatosTurno(resTurno.data.turno);

      const resStats = await axios.get('/stats/dashboard', { headers: { Authorization: `Bearer ${token}` } });
      setStats(resStats.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleTurno = async () => {
    const accion = turno === 'abierto' ? 'Cerrar' : 'Abrir';
    const confirmado = await askConfirmation(`¿${accion} Turno?`, 'Esto afectará la operación del local.');
    if (confirmado) {
      try {
        if (turno === 'cerrado') {
          await axios.post('/turnos/abrir', { userId: user.id }, { headers: { Authorization: `Bearer ${token}` } });
        } else {
          await axios.post('/turnos/cerrar', {}, { headers: { Authorization: `Bearer ${token}` } });
        }
        showSuccess(`Turno ${accion === 'Abrir' ? 'Abierto' : 'Cerrado'}`);
        fetchData();
      } catch (error) {
        showError('Error', 'No se pudo cambiar el estado');
      }
    }
  };

  const formatMoney = (amount) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);

  const BAR_COLORS = ['#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'];

  const categories = [
    { id: 'global', label: 'Todo' },
    { id: 'plato_fondo', label: 'Platos' },
    { id: 'bebida', label: 'Bebidas' },
    { id: 'entrada', label: 'Entradas' },
    { id: 'postre', label: 'Postres' },
  ];

  return (
    <div className="text-gray-900" style={{ minHeight: '100vh', padding: '2rem' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Panel de Control</h1>
            <p className="text-gray-600">Resumen operativo del restaurante</p>
          </div>
        </div>

        {/* --- SECCIÓN 1: ESTADO Y KPIs --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Tarjeta Turno */}
          <div className={`p-6 rounded-2xl border-2 flex flex-col justify-between shadow-lg`} style={{
            backgroundColor: turno === 'abierto' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            borderColor: turno === 'abierto' ? '#22C55E' : '#EF4444'
          }}>
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-lg">Estado Operativo</h2>
                {turno === 'abierto' 
                  ? <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full flex items-center gap-1 animate-pulse"><CheckCircle2 className="w-3 h-3"/> ABIERTO</span>
                  : <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center gap-1"><Lock className="w-3 h-3"/> CERRADO</span>
                }
              </div>
              <p className="text-sm text-gray-700 mb-6">
                {turno === 'abierto' 
                  ? <span>Iniciado: {new Date(datosTurno?.fechaInicio).toLocaleTimeString()} por {datosTurno?.usuario?.nombre}</span>
                  : "Local cerrado. Abre turno para operar."}
              </p>
            </div>
            <button onClick={handleToggleTurno} className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 text-white shadow-md ${turno === 'abierto' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>
              {turno === 'abierto' ? <><Lock className="w-5 h-5"/> CERRAR CAJA</> : <><Unlock className="w-5 h-5"/> ABRIR RESTAURANTE</>}
            </button>
          </div>

          {/* KPIs */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-2xl border border-gray-200 flex items-center gap-4 shadow-md">
                  <div className="p-4 rounded-full bg-purple-100 text-purple-600"><DollarSign className="w-8 h-8" /></div>
                  <div>
                      <p className="text-gray-500 text-sm font-medium">Ventas del Día</p>
                      <h3 className="text-3xl font-bold text-gray-900">{stats ? formatMoney(stats.ventasTotal) : '$0'}</h3>
                      <p className="text-xs text-green-600 flex items-center gap-1 font-medium"><Activity className="w-3 h-3" /> {stats?.pedidosCount || 0} pedidos pagados</p>
                  </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-gray-200 flex items-center gap-4 shadow-md">
                  <div className="p-4 rounded-full bg-blue-100 text-blue-600"><Users className="w-8 h-8" /></div>
                  <div>
                      <p className="text-gray-500 text-sm font-medium">Ocupación</p>
                      <h3 className="text-3xl font-bold text-gray-900">{stats ? `${stats.mesas.ocupadas}/${stats.mesas.total}` : '0/0'}</h3>
                      <div className="w-24 h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                          <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: stats ? `${(stats.mesas.ocupadas / stats.mesas.total) * 100}%` : '0%' }} />
                      </div>
                  </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-gray-200 flex items-center gap-4 shadow-md sm:col-span-2">
                  <div className="p-4 rounded-full bg-orange-100 text-orange-600"><ChefHat className="w-8 h-8" /></div>
                  <div>
                      <p className="text-gray-500 text-sm font-medium">Cocina en Vivo</p>
                      <h3 className="text-3xl font-bold text-gray-900">{stats?.cocinaPendientes || 0}</h3>
                      <p className="text-sm text-gray-500">Platos pendientes de preparación</p>
                  </div>
              </div>
          </div>
        </div>

        {/* --- SECCIÓN 2: GRÁFICOS --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xl flex flex-col">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5 text-purple-500" /> 
                      Top Ventas
                  </h3>
                  
                  {/* Selector de Categoría */}
                  <div className="flex bg-gray-100 p-1 rounded-lg">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setChartCategory(cat.id)}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                                chartCategory === cat.id 
                                ? 'bg-white text-purple-600 shadow-sm' 
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                  </div>
              </div>

              {/* GRÁFICO ARREGLADO: Altura fija de 400px */}
              <div className="w-full" style={{ height: '400px' }}>
                  {stats && stats.graficos && stats.graficos[chartCategory] && stats.graficos[chartCategory].length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                          <BarChart 
                            data={stats.graficos[chartCategory]} 
                            layout="vertical" 
                            margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                          >
                              <XAxis type="number" hide />
                              
                              <YAxis 
                                type="category" 
                                dataKey="name" 
                                width={150} /* Ancho suficiente para nombres largos */
                                tick={{ fill: '#374151', fontSize: 12, fontWeight: 500 }} 
                                tickLine={false} 
                                axisLine={false} 
                                interval={0} 
                              />
                              
                              <Tooltip 
                                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', color: '#333' }}
                                  cursor={{ fill: '#f3f4f6' }}
                              />
                              
                              <Bar dataKey="ventas" radius={[0, 4, 4, 0]} barSize={32}>
                                  {stats.graficos[chartCategory].map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                                  ))}
                              </Bar>
                          </BarChart>
                      </ResponsiveContainer>
                  ) : (
                      <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                          <Filter className="w-8 h-8 mb-2 opacity-50" />
                          <p className="text-sm">Sin datos para esta categoría</p>
                      </div>
                  )}
              </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xl flex items-center justify-center text-gray-400 border-dashed">
              <div className="text-center">
                <Activity className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>Próximamente: Rendimiento por Garzón</p>
              </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Dashboard;