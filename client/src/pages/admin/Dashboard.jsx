import { useEffect, useState } from 'react';
import axios from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { 
  Lock, 
  Unlock, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  DollarSign,
  ShoppingBag
} from 'lucide-react';
import { askConfirmation, showSuccess, showError } from '../../utils/sweetAlert';

function Dashboard() {
  const [turno, setTurno] = useState(null); // null, 'abierto', 'cerrado'
  const [datosTurno, setDatosTurno] = useState(null);
  const [loading, setLoading] = useState(true);
  const { token, user } = useAuthStore();

  // 1. Cargar estado del turno al entrar
  const fetchTurno = async () => {
    try {
      const res = await axios.get('/turnos', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTurno(res.data.estado);
      setDatosTurno(res.data.turno);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTurno();
  }, []);

  // 2. Función para Abrir/Cerrar
  const handleToggleTurno = async () => {
    // PREGUNTA DE SEGURIDAD
    if (turno === 'abierto') {
      const confirmado = await askConfirmation(
        '¿Cerrar Turno?', 
        'Los garzones y cocineros perderán acceso al sistema.'
      );
      if (!confirmado) return; // Si dice cancelar, no hacemos nada
    } else {
       const confirmado = await askConfirmation(
        '¿Abrir Turno?', 
        'Se habilitará el acceso al personal.'
      );
      if (!confirmado) return;
    }

    setLoading(true);
    try {
      if (turno === 'cerrado') {
        await axios.post('/turnos/abrir', { userId: user.id }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showSuccess('¡Turno Abierto!'); // <--- Feedback visual
      } else {
        await axios.post('/turnos/cerrar', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showSuccess('Turno Cerrado Correctamente'); // <--- Feedback visual
      }
      fetchTurno();
    } catch (error) {
      showError('Error', 'No se pudo cambiar el estado del turno'); // <--- Feedback error
      setLoading(false);
    }
  };

  return (
    <div className="text-white">
      <h1 className="text-2xl font-bold mb-6">Panel de Control</h1>

      {/* SECCIÓN DE ESTADO DEL RESTAURANTE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Tarjeta de Estado del Turno */}
        <div className={`p-6 rounded-2xl border-2 flex flex-col justify-between transition-colors shadow-2xl ${
          turno === 'abierto' 
            ? 'bg-green-900/20 border-green-500/50 shadow-green-900/20' 
            : 'bg-red-900/20 border-red-500/50 shadow-red-900/20'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-200">Estado del Restaurante</h2>
              {turno === 'abierto' ? (
                <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full flex items-center gap-1 animate-pulse">
                  <CheckCircle2 className="w-3 h-3" /> OPERATIVO
                </span>
              ) : (
                <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                  <Lock className="w-3 h-3" /> CERRADO
                </span>
              )}
            </div>
            
            <p className="text-gray-400 mb-6">
              {turno === 'abierto' 
                ? `Turno iniciado el ${new Date(datosTurno?.fechaInicio).toLocaleTimeString()} por ${datosTurno?.usuario?.nombre || 'Admin'}.`
                : "El sistema está bloqueado para Garzones y Cocina. Abre turno para comenzar a operar."
              }
            </p>
          </div>

          <button
            onClick={handleToggleTurno}
            disabled={loading}
            className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-transform active:scale-95 ${
              turno === 'abierto'
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/50'
                : 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-900/50'
            }`}
          >
            {loading ? (
               "Procesando..."
            ) : turno === 'abierto' ? (
              <> <Lock className="w-6 h-6" /> CERRAR TURNO </>
            ) : (
              <> <Unlock className="w-6 h-6" /> ABRIR TURNO </>
            )}
          </button>
        </div>

        {/* Tarjeta de Resumen Rápido (Placeholder para futuro) */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 flex flex-col items-center justify-center text-center">
             <div className="p-3 bg-indigo-500/20 rounded-full mb-3 text-indigo-400">
                <DollarSign className="w-8 h-8" />
             </div>
             <h3 className="text-2xl font-bold text-white">$0</h3>
             <p className="text-sm text-gray-400">Ventas Hoy</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 flex flex-col items-center justify-center text-center">
             <div className="p-3 bg-orange-500/20 rounded-full mb-3 text-orange-400">
                <ShoppingBag className="w-8 h-8" />
             </div>
             <h3 className="text-2xl font-bold text-white">0</h3>
             <p className="text-sm text-gray-400">Pedidos Activos</p>
          </div>
        </div>

      </div>

      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center gap-3 mb-4 text-gray-300">
            <Clock className="w-5 h-5" />
            <h3 className="font-semibold">Historial de Turnos Recientes</h3>
        </div>
        <p className="text-gray-500 text-sm italic">Aquí verás la lista de los últimos cierres de caja (Próximamente en Fase 4).</p>
      </div>
    </div>
  );
}

export default Dashboard;