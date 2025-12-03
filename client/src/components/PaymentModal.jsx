import { useState } from 'react';
import { X, CreditCard, Banknote, Receipt } from 'lucide-react';
import { askConfirmation } from '../utils/sweetAlert';

function PaymentModal({ total, onClose, onConfirm }) {
  const propinaSugerida = Math.round(total * 0.1);
  const [conPropina, setConPropina] = useState(true);
  const [metodoPago, setMetodoPago] = useState('TARJETA'); // 'TARJETA' o 'EFECTIVO'

  const totalFinal = conPropina ? total + propinaSugerida : total;

  const formatMoney = (amount) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);

  const handlePagar = async () => {
    const confirmado = await askConfirmation(
      `¿Confirmar Pago de ${formatMoney(totalFinal)}?`,
      `Método: ${metodoPago} ${conPropina ? '(Incluye Propina)' : '(Sin Propina)'}`,
      'Sí, COBRAR'
    );

    if (confirmado) {
      onConfirm({
        totalConPropina: totalFinal,
        propina: conPropina ? propinaSugerida : 0,
        metodoPago
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-gray-800 border border-gray-600 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        
        <div className="bg-gray-900 p-4 flex justify-between items-center border-b border-gray-700">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Receipt className="text-indigo-400" /> Cerrar Cuenta
          </h2>
          <button onClick={onClose}><X className="text-gray-400" /></button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Desglose */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-300">
              <span>Consumo</span>
              <span>{formatMoney(total)}</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg border border-gray-600">
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  checked={conPropina} 
                  onChange={(e) => setConPropina(e.target.checked)}
                  className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 bg-gray-600 border-gray-500"
                />
                <span className="text-white font-medium">Propina Sugerida (10%)</span>
              </div>
              <span className="text-green-400 font-bold">+ {formatMoney(propinaSugerida)}</span>
            </div>

            <div className="flex justify-between text-white text-xl font-bold pt-4 border-t border-gray-700">
              <span>TOTAL A PAGAR</span>
              <span>{formatMoney(totalFinal)}</span>
            </div>
          </div>

          {/* Método de Pago */}
          <div>
            <p className="text-gray-400 text-xs uppercase font-bold mb-2">Medio de Pago</p>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setMetodoPago('TARJETA')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition ${
                  metodoPago === 'TARJETA' 
                    ? 'bg-indigo-600 text-white border-indigo-500' 
                    : 'bg-gray-700 text-gray-400 border-gray-600 hover:bg-gray-600'
                }`}
              >
                <CreditCard className="w-6 h-6" />
                <span className="text-xs font-bold">TRANSBANK / TARJETA</span>
              </button>

              <button 
                onClick={() => setMetodoPago('EFECTIVO')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition ${
                  metodoPago === 'EFECTIVO' 
                    ? 'bg-green-600 text-white border-green-500' 
                    : 'bg-gray-700 text-gray-400 border-gray-600 hover:bg-gray-600'
                }`}
              >
                <Banknote className="w-6 h-6" />
                <span className="text-xs font-bold">EFECTIVO</span>
              </button>
            </div>
          </div>

          <button 
            onClick={handlePagar}
            className="w-full bg-indigo-500 hover:bg-indigo-400 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-indigo-500/20 active:scale-95 transition-transform"
          >
            COBRAR {formatMoney(totalFinal)}
          </button>

        </div>
      </div>
    </div>
  );
}

export default PaymentModal;