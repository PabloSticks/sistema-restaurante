import { useEffect, useState } from 'react';
import axios from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { Plus, Trash2, Edit, Utensils, Wine } from 'lucide-react';
import CreateProductModal from '../../components/CreateProductModal';
import { askConfirmation, showSuccess, showError } from '../../utils/sweetAlert';

function ProductosPage() {
  const [productos, setProductos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [prodToEdit, setProdToEdit] = useState(null);
  const token = useAuthStore(state => state.token);

  const fetchProductos = async () => {
    try {
      const res = await axios.get('/productos', { headers: { Authorization: `Bearer ${token}` } });
      setProductos(res.data);
    } catch (error) { console.error(error); }
  };

  useEffect(() => { fetchProductos(); }, []);

const handleDelete = async (id, nombre) => {
  const confirmado = await askConfirmation(
    `¿Eliminar "${nombre}"?`,
    "Se borrará del menú y los garzones no podrán pedirlo.",
    "Sí, borrar plato"
  );

  if (confirmado) {
    try {
      await axios.delete(`/productos/${id}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      showSuccess('Producto eliminado');
      fetchProductos();
    } catch (error) { 
      showError('Error', 'No se pudo eliminar el producto.'); 
    }
  }
};

  // Función auxiliar para formatear precio chileno
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
  };

  return (
    <div className="text-white">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Menú y Productos</h1>
          <p className="text-gray-400">Gestiona la carta del restaurante</p>
        </div>
        <button onClick={() => { setProdToEdit(null); setShowModal(true); }} 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition">
          <Plus className="w-5 h-5" /> Nuevo Plato
        </button>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-xl">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-700/50 text-gray-400 text-sm uppercase">
              <th className="px-6 py-4">Nombre</th>
              <th className="px-6 py-4">Categoría</th>
              <th className="px-6 py-4">Estación</th>
              <th className="px-6 py-4">Precio</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {productos.map((prod) => (
              <tr key={prod.id} className="hover:bg-gray-700/30">
                <td className="px-6 py-4 font-medium">{prod.nombre}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 rounded text-xs bg-gray-700 text-gray-300 border border-gray-600 capitalize">
                    {prod.categoria.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs border capitalize ${
                    prod.estacion === 'barra' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 
                    'bg-orange-500/10 text-orange-400 border-orange-500/20'
                  }`}>
                    {prod.estacion.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 font-bold text-green-400">{formatMoney(prod.precio)}</td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <button onClick={() => { setProdToEdit(prod); setShowModal(true); }} className="p-2 hover:bg-gray-600 rounded text-gray-400 hover:text-white">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(prod.id, prod.nombre)} className="p-2 hover:bg-red-500/20 rounded text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <CreateProductModal onClose={() => setShowModal(false)} onSuccess={fetchProductos} productToEdit={prodToEdit} />
      )}
    </div>
  );
}

export default ProductosPage;