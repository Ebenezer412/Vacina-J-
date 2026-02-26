import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  History, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Trash2,
  ChevronRight,
  Search,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StockItem {
  vacina_nome: string;
  vacina_id: number;
  frascos_disponiveis: number;
  frascos_abertos: number;
  validade_proxima: string;
}

export default function Stock() {
  const [activeTab, setActiveTab] = useState<'current' | 'entry' | 'waste'>('current');
  const [stock, setStock] = useState<StockItem[]>([]);
  const [vaccines, setVaccines] = useState<any[]>([]);
  const [waste, setWaste] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStock();
    fetchVaccines();
    fetchWaste();
  }, []);

  const fetchStock = async () => {
    try {
      const res = await fetch('/api/stock');
      const data = await res.json();
      setStock(data);
    } catch (error) {
      console.error('Error fetching stock:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVaccines = async () => {
    try {
      const res = await fetch('/api/vacinas');
      const data = await res.json();
      setVaccines(data);
    } catch (error) {
      console.error('Error fetching vaccines:', error);
    }
  };

  const fetchWaste = async () => {
    try {
      const res = await fetch('/api/cron/check-waste', { method: 'POST' }); // Trigger check
      // Then fetch waste list (need to implement endpoint)
      // For now, just placeholder
    } catch (error) {
      console.error('Error checking waste:', error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex gap-2 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
          <TabButton 
            active={activeTab === 'current'} 
            onClick={() => setActiveTab('current')} 
            icon={Package} 
            label="Stock Actual" 
          />
          <TabButton 
            active={activeTab === 'entry'} 
            onClick={() => setActiveTab('entry')} 
            icon={Plus} 
            label="Entrada de Stock" 
          />
          <TabButton 
            active={activeTab === 'waste'} 
            onClick={() => setActiveTab('waste')} 
            icon={Trash2} 
            label="Desperdício" 
          />
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="btn-primary"
        >
          <Plus size={20} /> Registar Entrada
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'current' && (
          <motion.div 
            key="current"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="card p-0 overflow-hidden"
          >
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Vacina</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Frascos Disp.</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Frascos Abertos</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Próxima Validade</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stock.map((item) => (
                  <tr key={item.vacina_id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-semibold text-slate-800">{item.vacina_nome}</td>
                    <td className="p-4 text-slate-600">{item.frascos_disponiveis || 0}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                        item.frascos_abertos > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {item.frascos_abertos > 0 ? `${item.frascos_abertos} Aberto` : 'Nenhum'}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600">
                      {item.validade_proxima ? new Date(item.validade_proxima).toLocaleDateString('pt-AO') : 'N/A'}
                    </td>
                    <td className="p-4 text-right">
                      {(item.frascos_disponiveis || 0) > 5 ? (
                        <span className="text-emerald-600 flex items-center justify-end gap-1 text-sm font-medium">
                          <CheckCircle2 size={16} /> Suficiente
                        </span>
                      ) : (item.frascos_disponiveis || 0) > 0 ? (
                        <span className="text-amber-600 flex items-center justify-end gap-1 text-sm font-medium">
                          <AlertCircle size={16} /> Baixo
                        </span>
                      ) : (
                        <span className="text-rose-600 flex items-center justify-end gap-1 text-sm font-medium">
                          <XCircle size={16} /> Sem Stock
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}

        {activeTab === 'entry' && (
          <motion.div 
            key="entry"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="card max-w-2xl mx-auto"
          >
            <h2 className="text-xl font-bold text-slate-800 mb-6">Registar Entrada de Stock</h2>
            <form className="space-y-6" onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data = Object.fromEntries(formData.entries());
              try {
                const res = await fetch('/api/stock/entrada', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(data)
                });
                if (res.ok) {
                  setActiveTab('current');
                  fetchStock();
                }
              } catch (error) {
                console.error('Error adding stock:', error);
              }
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Vacina *</label>
                  <select name="vacina_id" required className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none">
                    {vaccines.map(v => <option key={v.id} value={v.id}>{v.nome}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Lote *</label>
                  <input name="lote" required className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Data de Validade *</label>
                  <input name="validade" type="date" required className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Quantidade de Frascos *</label>
                  <input name="quantidade" type="number" min="1" required className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
                </div>
              </div>
              <div className="flex justify-end gap-4 pt-6 border-t border-slate-100">
                <button type="button" onClick={() => setActiveTab('current')} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">Confirmar Entrada</button>
              </div>
            </form>
          </motion.div>
        )}

        {activeTab === 'waste' && (
          <motion.div 
            key="waste"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="card py-24 flex flex-col items-center justify-center text-slate-400"
          >
            <Trash2 size={64} strokeWidth={1} className="mb-4" />
            <p className="text-lg">Nenhum desperdício registado no período.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
        active 
          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
      }`}
    >
      <Icon size={18} />
      <span className="font-medium text-sm">{label}</span>
    </button>
  );
}

function XCircle({ size, className }: { size: number, className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="15" y1="9" x2="9" y2="15"></line>
      <line x1="9" y1="9" x2="15" y2="15"></line>
    </svg>
  );
}
