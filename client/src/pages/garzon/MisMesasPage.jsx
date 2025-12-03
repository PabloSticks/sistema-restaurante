import { useEffect, useState } from 'react';
import axios from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { Coffee, Utensils, XCircle, ArrowRight, ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { askConfirmation, showSuccess, showError } from '../../utils/sweetAlert';
import socket from '../../utils/socket';

function MisMesasPage() {
  const [mesas, setMesas] = useState([]);
  const token = useAuthStore(state => state.token);
  const navigate = useNavigate();

  const fetchMisMesas = async () => {
    try {
      const res = await axios.get('/mesas/mis-mesas', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMesas(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchMisMesas();

    // Escuchar cuando alguien paga una cuenta para recargar las mesas
    socket.on('mesas:actualizado', () => {
      fetchMisMesas();
    });

    return () => socket.off('mesas:actualizado');
  }, []);

  const handleLiberar = async (e, mesa) => {
    e.stopPropagation();
    const confirmado = await askConfirmation(
      `¿Liberar Mesa ${mesa.numero}?`,
      "Quedará disponible para otros garzones.",
      "Sí, liberar"
    );

    if (confirmado) {
      try {
        await axios.post(`/mesas/${mesa.id}/liberar`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showSuccess('Mesa Liberada');
        fetchMisMesas();
      } catch (error) {
        showError('No se pudo liberar', error.response?.data?.message);
      }
    }
  };

  return (
    // IMPORTANTE: h-full y overflow-y-auto activan el scroll dentro del layout fijo
    <div className="h-full overflow-y-auto bg-gray-900 p-4">
      
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
            <Utensils className="w-6 h-6" />
          </div>
          Mis Mesas Activas
        </h2>
        
        {mesas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-gray-800/30 rounded-3xl border-2 border-dashed border-gray-700">
            <ClipboardList className="w-16 h-16 text-gray-600 mb-4" />
            <p className="text-gray-400 text-lg">No estás atendiendo ninguna mesa.</p>
            <button 
              onClick={() => navigate('/garzon/comedor')}
              className="mt-6 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition shadow-lg shadow-indigo-900/20"
            >
              Ir al Comedor
            </button>
          </div>
        ) : (
          // GRID RESPONSIVO: 1 col en movil muy chico, 2 en tablet, 3 en desktop, 4 en pantallas grandes
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
            {mesas.map((mesa) => (
              <div 
                key={mesa.id} 
                onClick={() => navigate(`/garzon/mesa/${mesa.id}`)}
                className="group relative bg-gray-800 rounded-2xl p-5 border border-gray-700 hover:border-indigo-500 hover:bg-gray-750 transition-all cursor-pointer shadow-lg hover:shadow-indigo-500/10 active:scale-[0.98]"
              >
                {/* Cabecera Tarjeta */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-500/20 p-3 rounded-xl text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                      <Coffee className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{mesa.numero}</h3>
                      <p className="text-xs text-gray-400">{mesa.capacidad} Personas</p>
                    </div>
                  </div>

                  {/* Botón Liberar (Discreto) */}
                  <button
                    onClick={(e) => handleLiberar(e, mesa)}
                    className="text-gray-500 hover:text-red-400 p-2 hover:bg-gray-700 rounded-full transition"
                    title="Liberar mesa"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>                {/* Estado / Pedidos */}
                <div className="flex items-center justify-between mt-2 pt-4 border-t border-gray-700/50">
                   {(() => {
                      // Lógica corregida para contar ITEMS, no pedidos
                      const pedidoActivo = mesa.pedidos?.[0]; // Tomamos el primer pedido activo
                      const cantidadItems = pedidoActivo?.detalles?.length || 0;

                      if (cantidadItems > 0) {
                        return (
                          <div className="flex items-center gap-2">
                             <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-pulse"></span>
                             <span className="text-sm font-medium text-orange-200">
                                {cantidadItems} Productos
                             </span>
                          </div>
                        );
                      } else {
                        return (
                          <div className="flex items-center gap-2">
                             <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
                             <span className="text-sm font-medium text-green-200">
                                Mesa abierta
                             </span>
                          </div>
                        );
                      }
                   })()}
                   
                   <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MisMesasPage;