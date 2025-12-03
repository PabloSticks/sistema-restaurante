import Swal from 'sweetalert2';

// Configuración base para modo oscuro (Dark Mode)
const darkOptions = {
  background: '#1f2937', // bg-gray-800
  color: '#fff',
  confirmButtonColor: '#4f46e5', // indigo-600
  cancelButtonColor: '#ef4444', // red-500
  iconColor: '#f87171', // red-400
  customClass: {
    popup: 'border border-gray-700 rounded-xl shadow-2xl'
  }
};

// 1. CONFIRMACIÓN (Pregunta de Sí/No)
export const askConfirmation = async (titulo, texto, textoBoton = 'Sí, continuar') => {
  const result = await Swal.fire({
    ...darkOptions,
    title: titulo,
    text: texto,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: textoBoton,
    cancelButtonText: 'Cancelar',
    reverseButtons: true // Pone el botón de cancelar a la izquierda (mejor UX)
  });

  return result.isConfirmed; // Retorna true si dijo que SÍ, false si canceló
};

// 2. ÉXITO (Notificación verde)
export const showSuccess = (titulo) => {
  Swal.fire({
    ...darkOptions,
    icon: 'success',
    title: titulo,
    iconColor: '#4ade80', // green-400
    confirmButtonColor: '#10b981', // green-500
    timer: 2000,
    showConfirmButton: false
  });
};

// 3. ERROR (Notificación roja)
export const showError = (titulo, texto) => {
  Swal.fire({
    ...darkOptions,
    icon: 'error',
    title: titulo,
    text: texto,
    confirmButtonText: 'Entendido'
  });
};