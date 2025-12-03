import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { askConfirmation, showSuccess, showError } from '../../utils/sweetAlert';
import socket from '../../utils/socket';
import { ChefHat, ArrowLeft, Minus, Plus, Trash2, CheckCircle, Clock, Loader, BellRing, UtensilsCrossed, Receipt, HandPlatter } from 'lucide-react';
import PaymentModal from '../../components/PaymentModal'; // <--- Importar Modal Pago

function MesaPedidoPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = useAuthStore(state => state.token);

  const [productos, setProductos] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState('todos');
  const [carrito, setCarrito] = useState({}); 
  const [pedidoActual, setPedidoActual] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false); // <--- Estado Modal Pago

  const fetchData = async () => {
    try {
      const resProd = await axios.get('/productos', { headers: { Authorization: `Bearer ${token}` } });
      setProductos(resProd.data);
      const resPedido = await axios.get(`/pedidos/mesa/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setPedidoActual(resPedido.data);
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    fetchData();
    socket.on('pedido:actualizado', () => fetchData());
    return () => socket.off('pedido:actualizado');
  }, [id, token]);

  // ... (agregarAlCarrito y quitarDelCarrito son iguales que antes) ...
  const agregarAlCarrito = (prod) => {
    setCarrito(prev => ({ ...prev, [prod.id]: { ...prod, cantidad: (prev[prod.id]?.cantidad || 0) + 1 } }));
  };
  const quitarDelCarrito = (prodId) => {
    setCarrito(prev => {
      const actual = prev[prodId];
      if (!actual) return prev;
      if (actual.cantidad === 1) { const n = {...prev}; delete n[prodId]; return n; }
      return { ...prev, [prodId]: { ...actual, cantidad: actual.cantidad - 1 } };
    });
  };

  const handleEnviarCocina = async () => {
    const items = Object.values(carrito);
    if (items.length === 0) return;
    const total = items.reduce((acc, i) => acc + (i.precio * i.cantidad), 0);
    const count = items.reduce((acc, i) => acc + i.cantidad, 0);

    if (await askConfirmation(`¿Marchar ${count} productos?`, `Total: $${formatMoney(total)}`, "Sí, ENVIAR")) {
      setLoading(true);
      try {
        await axios.post(`/pedidos/mesa/${id}`, { 
          items: items.map(i => ({ productoId: i.id, cantidad: i.cantidad, precio: i.precio })) 
        }, { headers: { Authorization: `Bearer ${token}` } });
        showSuccess('Comanda enviada');
        setCarrito({});
      } catch (e) { showError('Error', 'No se pudo enviar'); } 
      finally { setLoading(false); }
    }
  };

  // CAMBIAR ESTADO (Retirar o Entregar)
  const handleCambiarEstado = async (detalleId, nuevoEstado, nombreProducto) => {
    try {
        await axios.post(`/pedidos/detalle/${detalleId}/estado`, { estado: nuevoEstado }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        // Feedback visual sutil
        if (nuevoEstado === 'RETIRADO') showSuccess(`Retiraste: ${nombreProducto}`);
        if (nuevoEstado === 'ENTREGADO') showSuccess(`Entregado: ${nombreProducto}`);
    } catch (error) {
        showError('Error', 'No se pudo actualizar estado');
    }
  };

  // PROCESAR PAGO (Viene del Modal)
  const handleConfirmarPago = async (datosPago) => {
    try {
      await axios.post(`/pedidos/mesa/${id}/pagar`, datosPago, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowPayment(false);
      showSuccess('¡Cuenta Pagada!');
      navigate('/garzon/mis-mesas'); // Sacamos al garzón de la mesa
    } catch (error) {
      setShowPayment(false);
      showError('No se pudo cobrar', error.response?.data?.message);
    }
  };

  const formatMoney = (amount) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
  
  const productosFiltrados = categoriaActiva === 'todos' ? productos : productos.filter(p => p.categoria === categoriaActiva);
  const itemsCarrito = Object.values(carrito);
  const totalCarrito = itemsCarrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);

  return (
    <div className="flex h-full bg-gray-900 overflow-hidden">
      
      {/* IZQUIERDA: MENÚ (60%) - (Igual que antes) */}
      <div className="w-[60%] flex flex-col h-full border-r border-gray-700">
        <div className="p-4 flex items-center gap-4 bg-gray-800 shrink-0">
            <button onClick={() => navigate('/garzon/mis-mesas')} className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg text-white"><ArrowLeft /></button>
            <h2 className="text-xl font-bold text-white">Carta & Menú</h2>
        </div>
        <div className="px-4 py-2 flex gap-2 overflow-x-auto bg-gray-900 shrink-0 border-b border-gray-800">
            {['todos', 'bebida', 'plato_fondo', 'entrada', 'postre'].map(cat => (
            <button key={cat} onClick={() => setCategoriaActiva(cat)} className={`px-5 py-3 rounded-xl text-sm font-bold capitalize transition-all ${categoriaActiva === cat ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-105' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'}`}>{cat.replace('_', ' ')}</button>
            ))}
        </div>
        <div className="flex-1 overflow-y-auto p-4 bg-gray-900">
            <div className="grid grid-cols-3 gap-3">
                {productosFiltrados.map(prod => {
                    const enCarrito = carrito[prod.id]?.cantidad || 0;
                    return (
                        <button key={prod.id} onClick={() => agregarAlCarrito(prod)} className={`relative p-4 rounded-xl text-left transition-all border-2 active:scale-95 flex flex-col justify-between min-h-[140px] ${enCarrito > 0 ? 'bg-indigo-900/20 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'bg-gray-800 border-gray-700 hover:border-gray-500'}`}>
                            {enCarrito > 0 && <div className="absolute top-2 right-2 bg-indigo-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-lg">{enCarrito}</div>}
                            <div>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider ${prod.estacion === 'barra' ? 'bg-purple-500/20 text-purple-300' : 'bg-orange-500/20 text-orange-300'}`}>{prod.estacion}</span>
                                <h3 className="text-white font-bold text-lg leading-tight mt-2">{prod.nombre}</h3>
                            </div>
                            <p className="text-green-400 font-bold text-lg mt-2">{formatMoney(prod.precio)}</p>
                        </button>
                    )
                })}
            </div>
        </div>
      </div>

      {/* DERECHA: ESTADO Y COBRO (40%) */}
      <div className="w-[40%] bg-gray-800 flex flex-col h-full shadow-2xl z-10 border-l border-gray-700">
        
        {/* HEADER CUENTA */}
        <div className="p-4 bg-gray-900 border-b border-gray-700 shrink-0 flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold text-white">Mesa {pedidoActual?.mesaId}</h1>
                <p className="text-gray-400 text-xs">Orden #{pedidoActual?.id || '---'}</p>
            </div>
            
            {/* BOTÓN COBRAR */}
            {pedidoActual && pedidoActual.total > 0 && (
                <button 
                    onClick={() => setShowPayment(true)}
                    className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-green-900/30 flex items-center gap-2 animate-pulse"
                >
                    <Receipt className="w-5 h-5" />
                    COBRAR
                </button>
            )}
        </div>

        {/* CARRITO */}
        {itemsCarrito.length > 0 && (
            <div className="p-4 bg-indigo-900/20 border-b-4 border-indigo-500 shrink-0 max-h-[35%] overflow-y-auto">
                {/* ... (Mismo código de carrito de antes) ... */}
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-indigo-300 font-bold flex items-center gap-2 text-sm"><Plus className="w-4 h-4" /> POR AGREGAR</h3>
                    <button onClick={() => setCarrito({})} className="text-xs text-red-400 hover:text-white flex items-center gap-1"><Trash2 className="w-3 h-3" /> Cancelar</button>
                </div>
                <div className="space-y-2">
                    {itemsCarrito.map(item => (
                        <div key={item.id} className="flex justify-between items-center bg-gray-900 p-2 rounded-lg border border-indigo-500/30">
                            <div className="flex-1"><p className="text-white font-medium text-sm">{item.nombre}</p></div>
                            <div className="flex items-center gap-3 bg-gray-800 rounded p-1">
                                <button onClick={() => quitarDelCarrito(item.id)} className="text-red-400 p-1"><Minus className="w-4 h-4"/></button>
                                <span className="text-white font-bold w-6 text-center">{item.cantidad}</span>
                                <button onClick={() => agregarAlCarrito(item)} className="text-green-400 p-1"><Plus className="w-4 h-4"/></button>
                            </div>
                        </div>
                    ))}
                </div>
                <button onClick={handleEnviarCocina} disabled={loading} className="w-full mt-4 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95">
                    {loading ? <Loader className="animate-spin" /> : <ChefHat />} ENVIAR A COCINA
                </button>
            </div>
        )}

        {/* LISTA DE PEDIDOS (Con nuevos estados) */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-850">
            <div className="flex justify-between items-end mb-3">
                <h3 className="text-gray-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2"><UtensilsCrossed className="w-4 h-4" /> Consumo Actual</h3>
                <p className="text-xl font-bold text-white">{formatMoney((pedidoActual?.total || 0) + totalCarrito)}</p>
            </div>
            
            {!pedidoActual || !pedidoActual.detalles || pedidoActual.detalles.length === 0 ? (
                <div className="text-center text-gray-600 py-10 border-2 border-dashed border-gray-700 rounded-xl"><p>Mesa sin pedidos activos</p></div>
            ) : (
                <div className="space-y-3">
                    {pedidoActual.detalles.map((detalle) => {
                        const esBarra = detalle.producto.estacion === 'barra';
                        const estado = detalle.estado;

                        return (
                            <div key={detalle.id} className={`flex justify-between items-center p-3 rounded-xl border ${estado === 'ENTREGADO' ? 'bg-gray-800 border-gray-700 opacity-60' : 'bg-gray-800 border-gray-600'}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${esBarra ? 'bg-purple-500/20 text-purple-300' : 'bg-orange-500/20 text-orange-300'}`}>{detalle.cantidad}</div>
                                    <div>
                                        <p className={`font-bold text-sm ${estado === 'ENTREGADO' ? 'text-gray-400 line-through' : 'text-white'}`}>{detalle.producto.nombre}</p>
                                        <p className="text-gray-500 text-xs">{formatMoney(detalle.precioUnit)}</p>
                                    </div>
                                </div>

                                <div>
                                    {/* ESTADO FINAL: ENTREGADO */}
                                    {estado === 'ENTREGADO' && (
                                        <div className="flex items-center gap-1 text-gray-500 text-xs font-bold"><CheckCircle className="w-4 h-4" /> OK</div>
                                    )}

                                    {/* BARRA (Directo a Entregar) */}
                                    {estado !== 'ENTREGADO' && esBarra && (
                                        <button onClick={() => handleCambiarEstado(detalle.id, 'ENTREGADO', detalle.producto.nombre)} className="bg-green-600 hover:bg-green-500 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-lg active:scale-95 transition-all flex items-center gap-1">
                                            ENTREGAR
                                        </button>
                                    )}

                                    {/* COCINA (Flujo Complejo) */}
                                    {estado !== 'ENTREGADO' && !esBarra && (
                                        <>
                                            {estado === 'PENDIENTE' && <div className="flex items-center gap-1 text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded text-xs border border-yellow-500/20"><Clock className="w-3 h-3 animate-pulse" /> En Cola</div>}
                                            {estado === 'EN_PREPARACION' && <div className="flex items-center gap-1 text-orange-400 bg-orange-500/10 px-2 py-1 rounded text-xs border border-orange-500/20 font-bold"><ChefHat className="w-3 h-3 animate-bounce" /> Cocinando</div>}
                                            
                                            {/* PASO 1: RETIRAR DE COCINA */}
                                            {estado === 'LISTO' && (
                                                <button onClick={() => handleCambiarEstado(detalle.id, 'RETIRADO', detalle.producto.nombre)} className="bg-indigo-500 hover:bg-indigo-400 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-lg animate-pulse active:scale-95 transition-all flex items-center gap-1">
                                                    <BellRing className="w-4 h-4" /> RETIRAR
                                                </button>
                                            )}

                                            {/* PASO 2: ENTREGAR EN MESA (El garzón ya lo tiene) */}
                                            {estado === 'RETIRADO' && (
                                                <button onClick={() => handleCambiarEstado(detalle.id, 'ENTREGADO', detalle.producto.nombre)} className="bg-green-500 hover:bg-green-400 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-lg active:scale-95 transition-all flex items-center gap-1">
                                                    <HandPlatter className="w-4 h-4" /> SERVIR
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
      </div>

      {/* MODAL DE PAGO */}
      {showPayment && pedidoActual && (
        <PaymentModal 
            total={pedidoActual.total} 
            onClose={() => setShowPayment(false)}
            onConfirm={handleConfirmarPago}
        />
      )}
    </div>
  );
}

export default MesaPedidoPage;