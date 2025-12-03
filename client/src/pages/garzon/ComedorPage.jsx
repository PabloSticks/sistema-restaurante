import { useEffect, useState } from 'react';
import axios from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { showSuccess, showError, askConfirmation } from '../../utils/sweetAlert';
import { Coffee, Store, Users, Lock, CheckCircle2 } from 'lucide-react';
import socket from '../../utils/socket';

function ComedorPage() {
  const [mesas, setMesas] = useState([]);
  const token = useAuthStore(state => state.token);
  const user = useAuthStore(state => state.user);

  const fetchMesas = async () => {
    try {
      const res = await axios.get('/mesas', { headers: { Authorization: `Bearer ${token}` } });
      setMesas(res.data);
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    fetchMesas();

    // Escuchar cuando alguien paga una cuenta para recargar las mesas
    socket.on('mesas:actualizado', () => {
      fetchMesas();
    });

    // Polling: Actualizar cada 5 segundos para ver si otro garzón ocupó una mesa
    const interval = setInterval(fetchMesas, 5000);
    
    return () => {
      socket.off('mesas:actualizado');
      clearInterval(interval);
    };
  }, []);

  const handleOcupar = async (mesa) => {
    if (mesa.estado !== 'libre') return;

    const ok = await askConfirmation(`¿Atender Mesa ${mesa.numero}?`, 'Se agregará a tus mesas pendientes.');
    if (ok) {
      try {
        await axios.post(`/mesas/${mesa.id}/ocupar`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showSuccess('Mesa Asignada');
        fetchMesas();
      } catch (error) {
        showError('Error', error.response?.data?.message);
      }
    }
  };

  return (
    // 1. SCROLL FIX: h-full y overflow
    <div className="h-full overflow-y-auto bg-gray-900 p-4">
      
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
            <Store className="w-6 h-6" />
          </div>
          Mapa del Comedor
        </h2>
        
        {/* 2. GRID RESPONSIVO (Igual que en Mis Mesas) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
          {mesas.map((mesa) => {
            const esMia = mesa.usuarioId === user.id;
            const esLibre = mesa.estado === 'libre';
            const ocupadaPorOtro = !esLibre && !esMia;

            return (
              <button
                key={mesa.id}
                onClick={() => handleOcupar(mesa)}
                disabled={!esLibre}
                className={`group relative rounded-2xl p-5 border transition-all text-left shadow-lg
                  ${esLibre 
                    ? 'bg-gray-800 border-green-500/30 hover:border-green-400 hover:bg-gray-750 cursor-pointer active:scale-[0.98]' 
                    : ''}
                  ${esMia 
                    ? 'bg-indigo-900/10 border-indigo-500/50 cursor-default' 
                    : ''}
                  ${ocupadaPorOtro 
                    ? 'bg-gray-800/50 border-red-500/10 opacity-60 cursor-not-allowed grayscale-[0.5]' 
                    : ''}
                `}
              >
                {/* Cabecera Tarjeta */}
                <div className="flex justify-between items-start mb-3">
                  <div className={`p-3 rounded-xl transition-colors ${
                      esLibre ? 'bg-green-500/20 text-green-400 group-hover:bg-green-500 group-hover:text-white' :
                      esMia ? 'bg-indigo-500/20 text-indigo-400' :
                      'bg-red-500/10 text-red-400'
                  }`}>
                    {esLibre ? <Coffee className="w-6 h-6" /> : esMia ? <CheckCircle2 className="w-6 h-6"/> : <Lock className="w-6 h-6"/>}
                  </div>

                  {/* Badge de Estado */}
                  <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full border ${
                     esLibre ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                     esMia ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                     'bg-red-500/10 text-red-500 border-red-500/20'
                  }`}>
                    {esLibre ? 'DISPONIBLE' : esMia ? 'TUYA' : 'OCUPADA'}
                  </span>
                </div>

                <div className="mt-2">
                  <h3 className={`text-2xl font-bold ${esLibre ? 'text-white' : 'text-gray-300'}`}>
                    {mesa.numero}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-gray-400 text-sm">
                    <Users className="w-4 h-4" />
                    <span>{mesa.capacidad} Personas</span>
                  </div>
                </div>

                {/* Decoración Hover (Solo si es libre) */}
                {esLibre && (
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-green-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-b-2xl" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ComedorPage;