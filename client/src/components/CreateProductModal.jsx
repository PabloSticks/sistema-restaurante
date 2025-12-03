import { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useAuthStore } from '../store/authStore';
import { X, Save, Loader } from 'lucide-react';
import { askConfirmation } from '../utils/sweetAlert';

function CreateProductModal({ onClose, onSuccess, productToEdit }) {
  const token = useAuthStore(state => state.token);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    nombre: '',
    precio: '',
    categoria: 'plato_fondo',
    estacion: 'cocina_caliente',
    disponible: true
  });

 useEffect(() => {
    if (productToEdit) {
      setFormData({
        nombre: productToEdit.nombre,
        precio: productToEdit.precio,
        categoria: productToEdit.categoria,
        estacion: productToEdit.estacion,
        disponible: productToEdit.disponible
      });
    } else {
      setFormData({
        nombre: '',
        precio: '',
        categoria: 'plato_fondo',
        estacion: 'cocina_caliente',
        disponible: true
      });
    }
  }, [productToEdit]);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (productToEdit) {
        await axios.put(`/productos/${productToEdit.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post('/productos', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError('Error al guardar producto');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
  const confirmado = await askConfirmation('¿Cerrar formulario?', 'Perderás los datos del plato.', 'Sí, cerrar');
  if (confirmado) onClose();
};

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-lg animate-fade-in">
        <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-900/50">
          <h2 className="text-lg font-bold text-white">{productToEdit ? 'Editar Plato' : 'Nuevo Plato'}</h2>
            <button onClick={handleClose} className="text-gray-400 hover:text-white transition">
                <X className="w-5 h-5" />
            </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="text-red-500 bg-red-500/10 p-2 rounded">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm text-gray-400 mb-1">Nombre del Plato</label>
              <input name="nombre" value={formData.nombre} onChange={handleChange} required className="w-full bg-gray-700 rounded p-2 text-white border border-gray-600 focus:border-indigo-500 outline-none" placeholder="Ej: Lomo Saltado" />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Precio ($)</label>
              <input type="number" name="precio" value={formData.precio} onChange={handleChange} required className="w-full bg-gray-700 rounded p-2 text-white border border-gray-600 focus:border-indigo-500 outline-none" placeholder="8500" />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Categoría</label>
              <select name="categoria" value={formData.categoria} onChange={handleChange} className="w-full bg-gray-700 rounded p-2 text-white border border-gray-600 outline-none">
                <option value="plato_fondo">Plato de Fondo</option>
                <option value="bebida">Bebida / Trago</option>
                <option value="postre">Postre</option>
                <option value="entrada">Entrada</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Estación (¿Quién lo prepara?)</label>
              <select name="estacion" value={formData.estacion} onChange={handleChange} className="w-full bg-gray-700 rounded p-2 text-white border border-gray-600 outline-none">
                <option value="cocina_caliente">Cocina Caliente (Chef)</option>
                <option value="cocina_fria">Cocina Fría (Entradas)</option>
                <option value="barra">Barra (Bebidas)</option>
                <option value="postres">Estación Postres</option>
              </select>
            </div>

            {productToEdit && (
              <div className="flex items-center gap-2 mt-6">
                <input type="checkbox" name="disponible" checked={formData.disponible} onChange={handleChange} className="w-4 h-4" />
                <label className="text-sm text-gray-300">Disponible (Stock)</label>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="text-gray-300 hover:text-white transition"
            >
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded flex items-center gap-2">
              {loading ? <Loader className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />} Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateProductModal;