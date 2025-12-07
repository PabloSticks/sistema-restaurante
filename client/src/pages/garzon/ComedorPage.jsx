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
    // IMPORTANTE: h-full y overflow-y-auto activan el scroll dentro del layout fijo
    <div className="h-full overflow-y-auto p-4" style={{ backgroundColor: 'transparent' }}>
      
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3" style={{ color: '#111827' }}>
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
                className={`group relative rounded-2xl p-5 border-2 transition-all text-left shadow-lg
                  ${esLibre 
                    ? 'bg-white border-green-500/30 hover:border-green-400 hover:shadow-xl cursor-pointer active:scale-[0.98]' 
                    : ''}
                  ${esMia 
                    ? 'bg-white border-indigo-500/50 hover:shadow-xl cursor-default' 
                    : ''}
                  ${ocupadaPorOtro 
                    ? 'bg-gray-50 border-gray-300/50 opacity-60 cursor-not-allowed' 
                    : ''}
                `}
              >
                {/* Cabecera Tarjeta */}
                <div className="flex justify-between items-start mb-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm transition-colors ${
                      esLibre ? 'bg-green-500 group-hover:bg-green-600' :
                      esMia ? 'bg-indigo-500' :
                      'bg-red-500/50'
                  }`}>
                    {esLibre ? <Coffee className="w-5 h-5" /> : esMia ? <CheckCircle2 className="w-5 h-5"/> : <Lock className="w-5 h-5"/>}
                  </div>

                  {/* Badge de Estado */}
                  <span className={`text-xs px-2 py-1 rounded-full border font-bold ${
                     esLibre ? 'bg-green-100 text-green-800 border-green-300' :
                     esMia ? 'bg-indigo-100 text-indigo-800 border-indigo-300' :
                     'bg-red-100 text-red-800 border-red-300'
                  }`}>
                    {esLibre ? 'DISPONIBLE' : esMia ? 'TUYA' : 'OCUPADA'}
                  </span>
                </div>

                {/* Info */}
                <div className="mt-3">
                  <h3 className="text-xl font-bold text-gray-900" style={{ color: '#111827' }}>
                    Mesa {mesa.numero}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-sm" style={{ color: '#111827' }}>
                    <Users className="w-4 h-4" />
                    <span>{mesa.capacidad} Personas</span>
                  </div>
                </div>

                {/* Decoración Hover (Solo si es libre) */}
                {esLibre && (
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-green-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-b-2xl" />
                )}

                {/* Decoración Hover (Si es mía - azul) */}
                {esMia && (
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-b-2xl" />
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