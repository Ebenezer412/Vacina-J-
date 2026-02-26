import React from 'react';
import { AlertCircle, Clock, Bell, Package, Info } from 'lucide-react';
import { motion } from 'motion/react';

export default function Alerts() {
  const alerts = [
    { 
      id: 1, 
      level: 'URGENTE', 
      type: 'Frasco Quase Expirado', 
      message: 'Frasco de Penta expira em 2 horas — 3 doses restantes',
      icon: Clock,
      color: 'rose'
    },
    { 
      id: 2, 
      level: 'ATENÇÃO', 
      type: 'Dose em Atraso', 
      message: 'Maria Silva — 2ª dose Polio estava prevista para 12/01/2025',
      icon: AlertCircle,
      color: 'amber'
    },
    { 
      id: 3, 
      level: 'INFO', 
      type: 'Stock Baixo', 
      message: 'BCG — apenas 2 frascos em stock',
      icon: Package,
      color: 'blue'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Central de Alertas</h2>
          <p className="text-slate-500">Monitorização em tempo real das actividades do posto.</p>
        </div>
        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
          <Bell size={24} />
        </div>
      </div>

      <div className="space-y-4">
        {alerts.map((alert) => (
          <motion.div 
            key={alert.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`card border-l-4 ${
              alert.color === 'rose' ? 'border-l-rose-500 bg-rose-50/30' :
              alert.color === 'amber' ? 'border-l-amber-500 bg-amber-50/30' :
              'border-l-blue-500 bg-blue-50/30'
            } flex items-start gap-4 p-5`}
          >
            <div className={`p-3 rounded-xl ${
              alert.color === 'rose' ? 'bg-rose-100 text-rose-600' :
              alert.color === 'amber' ? 'bg-amber-100 text-amber-600' :
              'bg-blue-100 text-blue-600'
            }`}>
              <alert.icon size={24} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${
                  alert.color === 'rose' ? 'text-rose-600' :
                  alert.color === 'amber' ? 'text-amber-600' :
                  'text-blue-600'
                }`}>
                  {alert.level}
                </span>
                <span className="text-xs text-slate-400">Há 5 min</span>
              </div>
              <h3 className="font-bold text-slate-800">{alert.type}</h3>
              <p className="text-slate-600 text-sm mt-1">{alert.message}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="card bg-slate-50 border-dashed border-slate-300 flex flex-col items-center justify-center py-12 text-slate-400">
        <Info size={32} strokeWidth={1} className="mb-2" />
        <p className="text-sm">O sistema verifica automaticamente novas regras a cada 30 minutos.</p>
      </div>
    </div>
  );
}
