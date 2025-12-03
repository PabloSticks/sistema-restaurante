import { useState, useEffect } from 'react'; // Agregamos useEffect
import axios from '../api/axios';
import { useAuthStore } from '../store/authStore';
import { X, Save, Loader } from 'lucide-react';
import { askConfirmation } from '../utils/sweetAlert';

// Agregamos prop 'userToEdit'
function CreateUserModal({ onClose, onSuccess, userToEdit }) {
  const token = useAuthStore(state => state.token);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'GARZON',
    activo: true
  });

  // Si llega un usuario para editar, rellenamos el form
useEffect(() => {
    if (userToEdit) {
      // Si hay usuario para editar, rellenamos
      setFormData({
        nombre: userToEdit.nombre,
        email: userToEdit.email,
        password: '',
        rol: userToEdit.rol,
        activo: userToEdit.activo
      });
    } else {
      setFormData({
        nombre: '',
        email: '',
        password: '',
        rol: 'GARZON',
        activo: true
      });
    }
  }, [userToEdit]);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (userToEdit) {
        // MODO EDICIÓN (PUT)
        await axios.put(`/users/${userToEdit.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        // MODO CREACIÓN (POST)
        await axios.post('/users', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

const handleClose = async () => {
  const confirmado = await askConfirmation(
    '¿Cancelar edición?',
    'Se perderán los datos no guardados.',
    'Sí, cerrar'
  );
  if (confirmado) onClose();
};

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
        
        <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-900/50">
          <h2 className="text-lg font-bold text-white">
            {userToEdit ? 'Editar Usuario' : 'Registrar Nuevo Personal'}
          </h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500 text-red-500 text-sm p-3 rounded">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Nombre</label>
            <input type="text" name="nombre" required value={formData.nombre} onChange={handleChange}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
            <input type="email" name="email" required value={formData.email} onChange={handleChange}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                {userToEdit ? 'Nueva Contraseña (Opcional)' : 'Contraseña'}
              </label>
              <input type="password" name="password" 
                required={!userToEdit} // Solo obligatoria si es nuevo
                value={formData.password} onChange={handleChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none" 
                placeholder={userToEdit ? "Dejar vacío para mantener" : "••••••"}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Rol</label>
              <select name="rol" value={formData.rol} onChange={handleChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="GARZON">Garzón</option>
                <option value="COCINA">Cocina</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>
          </div>

          {/* Switch de Activo/Inactivo (Solo al editar) */}
          {userToEdit && (
            <div className="flex items-center gap-2">
              <input type="checkbox" name="activo" id="activo" checked={formData.activo} onChange={handleChange} className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 bg-gray-700 border-gray-600"/>
              <label htmlFor="activo" className="text-sm font-medium text-gray-300">Usuario Activo</label>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-300 hover:text-white transition"
            >
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition disabled:opacity-50">
              {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {userToEdit ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateUserModal;