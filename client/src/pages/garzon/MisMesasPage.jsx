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
    <div className="h-full overflow-y-auto p-4" style={{ backgroundColor: 'transparent' }}>
      
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3" style={{ color: '#111827' }}>
          <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
            <Utensils className="w-6 h-6" />
          </div>
          Mis Mesas Activas
        </h2>
        
        {mesas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 rounded-3xl border-2 border-dashed" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(0, 0, 0, 0.2)' }}>
            <ClipboardList className="w-16 h-16 mb-4" style={{ color: '#111827', opacity: 0.5 }} />
            <p className="text-lg" style={{ color: '#111827' }}>No estás atendiendo ninguna mesa.</p>
            <button 
              onClick={() => navigate('/garzon/comedor')}
              className="mt-6 px-6 py-3 text-white rounded-xl font-bold transition shadow-lg"
              style={{ backgroundColor: '#9B6BA8' }}
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
                className="group relative rounded-2xl p-5 border-2 transition-all text-left shadow-lg hover:shadow-xl cursor-pointer active:scale-[0.98]"
                style={{ 
                  backgroundColor: 'white',
                  borderColor: '#A62858'
                }}
              >
                {/* Cabecera Tarjeta */}
                <div className="flex justify-between items-start mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm transition-colors" style={{ backgroundColor: '#A62858' }}>
                    <Coffee className="w-5 h-5" />
                  </div>

                  {/* Botón Liberar (Discreto) */}
                  <button
                    onClick={(e) => handleLiberar(e, mesa)}
                    className="p-2 rounded-full transition"
                    style={{ color: '#111827' }}
                    title="Liberar mesa"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                {/* Info */}
                <div className="mt-3">
                  <h3 className="text-xl font-bold" style={{ color: '#111827' }}>Mesa {mesa.numero}</h3>
                  <div className="flex items-center gap-2 mt-1 text-sm" style={{ color: '#111827' }}>
                    {`${mesa.capacidad} Personas`}
                  </div>
                </div>

                {/* Estado / Pedidos */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: 'rgba(0, 0, 0, 0.1)' }}>
                   {(() => {
                      // Lógica corregida para contar ITEMS, no pedidos
                      const pedidoActivo = mesa.pedidos?.[0]; // Tomamos el primer pedido activo
                      const cantidadItems = pedidoActivo?.detalles?.length || 0;

                      if (cantidadItems > 0) {
                        return (
                          <div className="flex items-center gap-2">
                             <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-pulse"></span>
                             <span className="text-sm font-medium" style={{ color: '#111827' }}>
                                {cantidadItems} Productos
                             </span>
                          </div>
                        );
                      } else {
                        return (
                          <div className="flex items-center gap-2">
                             <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
                             <span className="text-sm font-medium" style={{ color: '#111827' }}>
                                Mesa abierta
                             </span>
                          </div>
                        );
                      }
                   })()}
                   
                   <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-all" style={{ color: '#111827' }} />
                </div>

                {/* Barra de animación al pasar el cursor */}
                <div className="absolute bottom-0 left-0 w-full h-1 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-b-2xl" style={{ backgroundColor: '#A62858' }} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MisMesasPage;