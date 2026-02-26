import React, { useState } from 'react';
import { 
  BarChart3, 
  FileText, 
  Download, 
  Calendar, 
  Users, 
  Trash2, 
  TrendingUp,
  ChevronRight,
  Printer
} from 'lucide-react';
import { motion } from 'motion/react';

export default function Reports() {
  const [activeReport, setActiveReport] = useState<string | null>(null);

  const reportTypes = [
    { 
      id: 'diario', 
      title: 'Registo Diário', 
      desc: 'Equivalente ao livro diário do MINSA. Doses por vacina e grupo.',
      icon: FileText,
      color: 'bg-blue-500'
    },
    { 
      id: 'mensal', 
      title: 'Consolidado Mensal', 
      desc: 'Totais automáticos do mês para reporte oficial.',
      icon: BarChart3,
      color: 'bg-emerald-500'
    },
    { 
      id: 'paciente', 
      title: 'Histórico por Paciente', 
      desc: 'Cartão de vacinação digital completo.',
      icon: Users,
      color: 'bg-purple-500'
    },
    { 
      id: 'desperdicio', 
      title: 'Relatório de Desperdício', 
      desc: 'Frascos expirados e doses perdidas no período.',
      icon: Trash2,
      color: 'bg-rose-500'
    },
    { 
      id: 'cobertura', 
      title: 'Cobertura Vacinal', 
      desc: 'Percentagem de crianças com esquema completo.',
      icon: TrendingUp,
      color: 'bg-amber-500'
    }
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportTypes.map((report) => (
          <motion.button
            key={report.id}
            whileHover={{ y: -4 }}
            onClick={() => setActiveReport(report.id)}
            className="card text-left hover:border-emerald-500 transition-all group"
          >
            <div className={`w-12 h-12 ${report.color} rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-${report.color.split('-')[1]}-200`}>
              <report.icon size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-emerald-700 transition-colors">{report.title}</h3>
            <p className="text-sm text-slate-500 mb-6">{report.desc}</p>
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gerar Agora</span>
              <ChevronRight size={16} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
            </div>
          </motion.button>
        ))}
      </div>

      {activeReport && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
                <Calendar size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">Visualização: {reportTypes.find(r => r.id === activeReport)?.title}</h2>
                <p className="text-sm text-slate-500">Período: {new Date().toLocaleDateString('pt-AO', { month: 'long', year: 'numeric' })}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="btn-secondary">
                <Printer size={18} /> Imprimir
              </button>
              <button className="btn-primary">
                <Download size={18} /> Exportar PDF
              </button>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-12 flex flex-col items-center justify-center text-slate-400">
            <FileText size={64} strokeWidth={1} className="mb-4" />
            <p className="text-lg font-medium">Os dados estão a ser processados...</p>
            <p className="text-sm">Esta funcionalidade requer a base de dados preenchida com registos reais.</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
