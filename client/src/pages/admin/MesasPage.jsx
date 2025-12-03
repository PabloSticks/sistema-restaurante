import { useEffect, useState } from 'react';
import axios from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { Plus, Trash2, Edit, Coffee } from 'lucide-react';
import CreateMesaModal from '../../components/CreateMesaModal';
import { askConfirmation, showSuccess, showError } from '../../utils/sweetAlert';

function MesasPage() {
  const [mesas, setMesas] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [mesaToEdit, setMesaToEdit] = useState(null);
  const token = useAuthStore(state => state.token);

  const fetchMesas = async () => {
    try {
      const res = await axios.get('/mesas', { headers: { Authorization: `Bearer ${token}` } });
      setMesas(res.data);
    } catch (error) { console.error(error); }
  };

  useEffect(() => { fetchMesas(); }, []);

  const handleDelete = async (id, numero) => {
  // Usamos la alerta bonita
  const confirmado = await askConfirmation(
    `¿Eliminar Mesa ${numero}?`,
    "Si la eliminas, desaparecerá del mapa del restaurante.",
    "Sí, eliminar"
  );

  if (confirmado) {
    try {
      await axios.delete(`/mesas/${id}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      showSuccess('Mesa eliminada');
      fetchMesas();
    } catch (error) { 
      showError('Error', 'No se pudo eliminar la mesa. Verifica que no tenga pedidos activos.'); 
    }
  }
};

  return (
    <div className="text-white">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Mesas</h1>
          <p className="text-gray-400">Configura el salón del restaurante</p>
        </div>
        <button onClick={() => { setMesaToEdit(null); setShowModal(true); }} 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition">
          <Plus className="w-5 h-5" /> Nueva Mesa
        </button>
      </div>

      {/* Grid de Mesas */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {mesas.map((mesa) => (
          <div key={mesa.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700 hover:border-indigo-500 transition shadow-lg relative group">
            
            {/* Cabecera Tarjeta */}
            <div className="flex justify-between items-start mb-2">
              <div className="bg-gray-700 p-2 rounded-lg">
                <Coffee className="w-6 h-6 text-indigo-400" />
              </div>
              <span className={`text-xs px-2 py-1 rounded-full border ${mesa.estado === 'libre' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                {mesa.estado}
              </span>
            </div>

            {/* Info */}
            <h3 className="text-xl font-bold text-white mb-1">{mesa.numero}</h3>
            <p className="text-sm text-gray-400">Capacidad: {mesa.capacidad} personas</p>

            {/* Botones Acciones (Solo visibles al pasar el mouse - group-hover) */}
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900/80 rounded-lg p-1">
              <button onClick={() => { setMesaToEdit(mesa); setShowModal(true); }} className="p-1.5 hover:text-white text-gray-400">
                <Edit className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(mesa.id, mesa.numero)} className="p-1.5 hover:text-red-400 text-gray-400">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <CreateMesaModal 
          onClose={() => setShowModal(false)} 
          onSuccess={fetchMesas} 
          mesaToEdit={mesaToEdit} 
        />
      )}
    </div>
  );
}

export default MesasPage;