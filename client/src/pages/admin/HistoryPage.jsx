import { useEffect, useState } from 'react';
import axios from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { Calendar, User, Search, Eye, FileText } from 'lucide-react';

function HistoryPage() {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [selectedVenta, setSelectedVenta] = useState(null);
  const token = useAuthStore(state => state.token);

  const fetchHistorial = async () => {
    try {
      const res = await axios.get('/pedidos/historial', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVentas(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistorial(); }, []);

  const formatMoney = (amount) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
  const formatDate = (dateString) => new Date(dateString).toLocaleString('es-CL');

  // Filtro por nombre de garzón o ID de orden
  const ventasFiltradas = ventas.filter(v => 
    v.usuario.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
    v.id.toString().includes(filtro)
  );

  return (
    <div className="text-gray-900" style={{ minHeight: '100vh', padding: '2rem' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Historial de Ventas</h1>
            <p className="text-gray-600">Registro de mesas cerradas y pagadas.</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Buscar por Garzón o ID..." 
              className="bg-gray-100 border-2 border-gray-300 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-purple-500 w-64 transition"
              onChange={(e) => setFiltro(e.target.value)}
            />
          </div>
        </div>

        <div className="rounded-xl border overflow-hidden shadow-sm" style={{ borderColor: '#e0e0e0' }}>
          <table className="w-full text-left">
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5', color: '#666666' }} className="text-sm uppercase">
                <th className="px-6 py-4"># Orden</th>
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Mesa</th>
                <th className="px-6 py-4">Garzón</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4 text-right">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: '#e0e0e0' }}>
              {loading ? <tr><td colSpan="6" className="text-center py-10">Cargando...</td></tr> : 
               ventasFiltradas.length === 0 ? <tr><td colSpan="6" className="text-center py-10 text-gray-500">No hay registros.</td></tr> :
               ventasFiltradas.map((venta) => (
                <tr key={venta.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-purple-600 font-bold">#{venta.id}</td>
                  <td className="px-6 py-4 text-sm flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" /> {formatDate(venta.fechaTermino)}
                  </td>
                  <td className="px-6 py-4 font-bold">{venta.mesa.numero}</td>
                  <td className="px-6 py-4 flex items-center gap-2 text-sm text-gray-700">
                    <User className="w-4 h-4" /> {venta.usuario.nombre}
                  </td>
                  <td className="px-6 py-4 font-bold text-green-600">{formatMoney(venta.total)}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => setSelectedVenta(venta)} className="p-2 hover:bg-purple-100 rounded-lg text-purple-600 transition">
                      <Eye className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DETALLE */}
      {selectedVenta && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-300">
            <div className="p-4 flex justify-between items-center border-b bg-gray-50">
              <h2 className="text-lg font-bold flex items-center gap-2 text-gray-900">
                <FileText className="text-purple-600" /> Detalle Orden #{selectedVenta.id}
              </h2>
              <button onClick={() => setSelectedVenta(null)} className="text-gray-500 hover:text-gray-800">✕</button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-3 mb-6">
                {selectedVenta.detalles.map((detalle) => (
                  <div key={detalle.id} className="flex justify-between items-center border-b pb-2 border-gray-100">
                    <div className="flex items-center gap-3">
                      <span className="bg-purple-600 text-white w-6 h-6 rounded flex items-center justify-center text-xs font-bold">{detalle.cantidad}</span>
                      <span className="text-gray-800">{detalle.producto.nombre}</span>
                    </div>
                    <span className="text-gray-600 text-sm">{formatMoney(detalle.precioUnit * detalle.cantidad)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <span className="text-xl font-bold text-gray-900">TOTAL PAGADO</span>
                <span className="text-2xl font-bold text-green-600">{formatMoney(selectedVenta.total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HistoryPage;