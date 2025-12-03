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
  const TicketCard = ({ item, action, actionLabel, colorBtn, icon: Icon }) => (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 shadow-lg mb-3 animate-fade-in">
      <div className="flex justify-between items-start mb-2">
        <span className="bg-gray-700 text-white font-bold px-2 py-1 rounded text-sm">
          Mesa {item.pedido.mesa.numero}
        </span>
        <span className="text-xs text-gray-500">
          Orden #{item.pedido.id}
        </span>
      </div>
      
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center text-xl font-bold text-white border border-gray-600">
          {item.cantidad}
        </div>
        <h3 className="text-lg font-bold text-white leading-tight">{item.producto.nombre}</h3>
      </div>

      {action && (
        <button 
          onClick={() => action(item.id)}
          className={`w-full py-3 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg ${colorBtn}`}
        >
          <Icon className="w-5 h-5" />
          {actionLabel}
        </button>
      )}
    </div>
  );

  return (
    <div className="grid grid-cols-3 gap-6 h-full">
      
      {/* COLUMNA 1: PENDIENTES */}
      <div className="flex flex-col bg-gray-800/50 rounded-2xl border border-gray-700 overflow-hidden">
        <div className="bg-yellow-500/10 p-4 border-b border-yellow-500/20 flex justify-between items-center">
          <h2 className="text-yellow-500 font-bold text-xl flex items-center gap-2">
            <Clock /> EN COLA
          </h2>
          <span className="bg-yellow-500 text-black font-bold px-3 py-1 rounded-full text-sm">{pendientes.length}</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {pendientes.map(item => (
            <TicketCard 
              key={item.id} 
              item={item} 
              action={(id) => moverEstado(id, 'EN_PREPARACION')}
              actionLabel="COCINAR"
              colorBtn="bg-yellow-600 hover:bg-yellow-500"
              icon={Flame}
            />
          ))}
        </div>
      </div>

      {/* COLUMNA 2: EN PREPARACIÓN */}
      <div className="flex flex-col bg-gray-800/50 rounded-2xl border border-gray-700 overflow-hidden">
        <div className="bg-orange-500/10 p-4 border-b border-orange-500/20 flex justify-between items-center">
          <h2 className="text-orange-500 font-bold text-xl flex items-center gap-2">
            <Flame /> COCINANDO
          </h2>
          <span className="bg-orange-500 text-white font-bold px-3 py-1 rounded-full text-sm">{cocinando.length}</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {cocinando.map(item => (
            <TicketCard 
              key={item.id} 
              item={item} 
              action={(id) => moverEstado(id, 'LISTO')}
              actionLabel="TERMINAR"
              colorBtn="bg-orange-600 hover:bg-orange-500"
              icon={CheckCircle}
            />
          ))}
        </div>
      </div>

      {/* COLUMNA 3: LISTOS (Esperando retiro) */}
      <div className="flex flex-col bg-gray-800/50 rounded-2xl border border-gray-700 overflow-hidden">
        <div className="bg-green-500/10 p-4 border-b border-green-500/20 flex justify-between items-center">
          <h2 className="text-green-500 font-bold text-xl flex items-center gap-2">
            <BellRing /> PARA RETIRO
          </h2>
          <span className="bg-green-500 text-white font-bold px-3 py-1 rounded-full text-sm">{listos.length}</span>
        </div>        <div className="flex-1 overflow-y-auto p-4">
          {listos.length === 0 && (
            <p className="text-center text-gray-500 mt-10">Todo entregado 👍</p>
          )}
          {listos.map(item => (
            <div key={item.id} className="opacity-70 hover:opacity-100 transition-opacity animate-fade-in">
                <TicketCard 
                  item={item} 
                  action={null} 
                  actionLabel="ESPERANDO GARZÓN..."
                  colorBtn="bg-green-600"
                  icon={BellRing}
                />
                <p className="text-center text-green-400 text-xs font-bold -mt-2 mb-4 animate-pulse">
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