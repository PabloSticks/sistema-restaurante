import { useEffect, useState } from 'react';
import axios from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import socket from '../../utils/socket';
import { Clock, Flame, BellRing, CheckCircle } from 'lucide-react';

function CocinaPage() {
  const [pedidos, setPedidos] = useState([]);
  const token = useAuthStore(state => state.token);

  const fetchCola = async () => {
    try {
      const res = await axios.get('/cocina/cola', { headers: { Authorization: `Bearer ${token}` } });
      setPedidos(res.data);
    } catch (error) {
      console.error(error);
    }
  };
  useEffect(() => {
    fetchCola();

    socket.on('cocina:nuevo_pedido', fetchCola);
    
    // --- SOLUCIÓN LIMPIA: Actualización Local ---
    // Si el servidor dice "Refrescar todo", lo hacemos
    socket.on('cocina:actualizado', fetchCola);

    // Si el servidor dice "Saca este ID específico", lo filtramos localmente (INSTANTÁNEO)
    socket.on('cocina:item_retirado', (data) => {
        setPedidos(prev => prev.filter(item => item.id !== data.id));
    });

    return () => {
      socket.off('cocina:nuevo_pedido');
      socket.off('cocina:actualizado');
      socket.off('cocina:item_retirado');
    };
  }, []);
  // Cambiar estado (Backend)
  const moverEstado = async (id, nuevoEstado) => {
    // Optimismo UI: Actualizamos localmente antes de que responda el servidor para que se sienta rápido
    if (nuevoEstado === 'LISTO') {
       // Movemos visualmente a la columna de listos
       setPedidos(prev => prev.map(p => p.id === id ? { ...p, estado: 'LISTO' } : p));
    }

    try {
      await axios.post(`/cocina/${id}/estado`, { estado: nuevoEstado }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error(error);
      fetchCola(); // Si falla, revertimos recargando todo
    }
  };

  // Filtrar por columnas
  const pendientes = pedidos.filter(p => p.estado === 'PENDIENTE');
  const cocinando = pedidos.filter(p => p.estado === 'EN_PREPARACION');
  const listos = pedidos.filter(p => p.estado === 'LISTO');

  // Componente de Tarjeta (Card)
  const TicketCard = ({ item, action, actionLabel, colorBtn, icon: Icon, bgCard, textColor, btnBgColor }) => (
    <div className="rounded-xl p-4 shadow-lg mb-3 animate-fade-in border" style={{ backgroundColor: bgCard || '#F3E101' }}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-white font-bold px-2 py-1 rounded text-sm" style={{ backgroundColor: '#3a2256' }}>
          Mesa {item.pedido.mesa.numero}
        </span>
        <span className="text-xs" style={{ color: '#3a2256' }}>
          Orden #{item.pedido.id}
        </span>
      </div>
      
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold text-white border" style={{ backgroundColor: '#3a2256' }}>
          {item.cantidad}
        </div>
        <h3 className="text-lg font-bold leading-tight" style={{ color: textColor || '#3a2256' }}>{item.producto.nombre}</h3>
      </div>

      {action && (
        <button 
          onClick={() => action(item.id)}
          className="w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg"
          style={{ backgroundColor: btnBgColor || '#3a2256', color: btnBgColor ? '#22C55E' : '#F1A321' }}
        >
          <Icon className="w-5 h-5" />
          {actionLabel}
        </button>
      )}
    </div>
  );

  return (
    <div className="grid grid-cols-3 gap-6 h-full" style={{ backgroundColor: '#111827' }}>
      
      {/* COLUMNA 1: PENDIENTES */}
      <div className="flex flex-col rounded-2xl border overflow-hidden" style={{ backgroundColor: '#3a2256', borderColor: '#f5d590' }}>
        <div className="p-4 border-b flex justify-between items-center" style={{ backgroundColor: 'rgba(245, 213, 144, 0.1)', borderColor: '#f5d590' }}>
          <h2 className="font-bold text-xl flex items-center gap-2" style={{ color: '#f5d590' }}>
            <Clock /> EN COLA
          </h2>
          <span className="font-bold px-3 py-1 rounded-full text-sm text-black" style={{ backgroundColor: '#f5d590' }}>{pendientes.length}</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {pendientes.map(item => (
            <TicketCard 
              key={item.id} 
              item={item} 
              action={(id) => moverEstado(id, 'EN_PREPARACION')}
              actionLabel="COCINAR"
              colorBtn="text-white font-bold hover:opacity-80 transition"
              bgCard="#f5d590"
              textColor="#3a2256"
              icon={Flame}
            />
          ))}
        </div>
      </div>

      {/* COLUMNA 2: EN PREPARACIÓN */}
      <div className="flex flex-col rounded-2xl border overflow-hidden" style={{ backgroundColor: '#3a2256', borderColor: '#F1A321' }}>
        <div className="p-4 border-b flex justify-between items-center" style={{ backgroundColor: 'rgba(241, 163, 33, 0.1)', borderColor: '#F1A321' }}>
          <h2 className="font-bold text-xl flex items-center gap-2" style={{ color: '#F1A321' }}>
            <Flame /> COCINANDO
          </h2>
          <span className="font-bold px-3 py-1 rounded-full text-sm text-white" style={{ backgroundColor: '#F1A321' }}>{cocinando.length}</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {cocinando.map(item => (
            <TicketCard 
              key={item.id} 
              item={item} 
              action={(id) => moverEstado(id, 'LISTO')}
              actionLabel="TERMINAR"
              colorBtn="text-white font-bold hover:opacity-80 transition"
              bgCard="#F1A321"
              textColor="#3a2256"
              btnBgColor="#3a2256"
              icon={CheckCircle}
            />
          ))}
        </div>
      </div>

      {/* COLUMNA 3: LISTOS (Esperando retiro) */}
      <div className="flex flex-col rounded-2xl border overflow-hidden" style={{ backgroundColor: '#3a2256', borderColor: '#22C55E' }}>
        <div className="p-4 border-b flex justify-between items-center" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: '#22C55E' }}>
          <h2 className="font-bold text-xl flex items-center gap-2" style={{ color: '#22C55E' }}>
            <BellRing /> PARA RETIRO
          </h2>
          <span className="font-bold px-3 py-1 rounded-full text-sm text-white" style={{ backgroundColor: '#22C55E' }}>{listos.length}</span>
        </div>        <div className="flex-1 overflow-y-auto p-4">
          {listos.length === 0 && (
            <p className="text-center mt-10" style={{ color: '#22C55E' }}>Todo entregado 👍</p>
          )}
          {listos.map(item => (
            <div key={item.id} className="opacity-70 hover:opacity-100 transition-opacity animate-fade-in">
                <TicketCard 
                  item={item} 
                  action={null} 
                  actionLabel="ESPERANDO GARZÓN..."
                  colorBtn="text-white"
                  bgCard="#22C55E"
                  textColor="#3a2256"
                  style={{ backgroundColor: '#22C55E' }}
                  icon={BellRing}
                />
                <p className="text-center text-xs font-bold -mt-2 mb-4 animate-pulse" style={{ color: '#22C55E' }}>
                    ESPERANDO RETIRO...
                </p>
                {/* ¡AQUÍ BORRAMOS EL BOTÓN FEO! Ya no hace falta. */}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

export default CocinaPage;