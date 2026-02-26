import React, { useEffect, useState } from 'react';
import { 
  Syringe, 
  Users, 
  Package, 
  Bell, 
  Clock, 
  AlertCircle,
  ChevronRight,
  Plus
} from 'lucide-react';
import { motion } from 'motion/react';

interface Stats {
  dosesHoje: number;
  pacientesHoje: number;
  frascosAbertos: number;
  alertasPendentes: number;
}

interface OpenVial {
  id: number;
  vacina_nome: string;
  doses_restantes: number;
  data_expiracao_uso: string;
  prazo_uso_horas: number;
}

export default function Dashboard({ onNavigate }: { onNavigate: (page: any) => void }) {
  const [stats, setStats] = useState<Stats>({ dosesHoje: 0, pacientesHoje: 0, frascosAbertos: 0, alertasPendentes: 0 });
  const [openVials, setOpenVials] = useState<OpenVial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, vialsRes] = await Promise.all([
          fetch('/api/dashboard/stats'),
          fetch('/api/stock/abertos')
        ]);
        const statsData = await statsRes.json();
        const vialsData = await vialsRes.json();
        setStats(statsData);
        setOpenVials(vialsData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const calculateTimeRemaining = (expiry: string) => {
    const remaining = new Date(expiry).getTime() - Date.now();
    if (remaining <= 0) return 'Expirado';
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}min`;
  };

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Doses Hoje" 
          value={stats.dosesHoje} 
          icon={Syringe} 
          color="bg-emerald-500" 
          delay={0}
        />
        <StatCard 
          title="Pacientes Vacinados" 
          value={stats.pacientesHoje} 
          icon={Users} 
          color="bg-blue-500" 
          delay={0.1}
        />
        <StatCard 
          title="Frascos Abertos" 
          value={stats.frascosAbertos} 
          icon={Package} 
          color="bg-amber-500" 
          delay={0.2}
        />
        <StatCard 
          title="Alertas Pendentes" 
          value={stats.alertasPendentes} 
          icon={Bell} 
          color="bg-rose-500" 
          delay={0.3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Section */}
        <div className="lg:col-span-2 space-y-8">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-800">Lista do Dia</h2>
              <button 
                onClick={() => onNavigate('vaccinate')}
                className="text-emerald-600 text-sm font-medium hover:underline flex items-center gap-1"
              >
                Ver todos <ChevronRight size={16} />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Placeholder for today's list */}
              <div className="flex items-center justify-center py-12 text-slate-400 flex-col gap-2">
                <Users size={48} strokeWidth={1} />
                <p>Nenhum paciente previsto para hoje</p>
                <button 
                  onClick={() => onNavigate('vaccinate')}
                  className="btn-primary mt-4"
                >
                  <Plus size={18} /> Novo Atendimento
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Section */}
        <div className="space-y-8">
          <div className="card">
            <h2 className="text-lg font-semibold text-slate-800 mb-6">Frascos Ativos</h2>
            <div className="space-y-6">
              {openVials.length > 0 ? (
                openVials.map((vial) => (
                  <div key={vial.id} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-slate-700">{vial.vacina_nome}</span>
                      <span className="text-slate-500">{vial.doses_restantes} doses rest.</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full" 
                        style={{ width: `${(vial.doses_restantes / 10) * 100}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-amber-600 font-medium">
                      <Clock size={12} />
                      <span>{calculateTimeRemaining(vial.data_expiracao_uso)} restantes</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400 text-sm">
                  Nenhum frasco aberto no momento
                </div>
              )}
            </div>
          </div>

          <div className="card bg-rose-50 border-rose-100">
            <div className="flex items-center gap-2 text-rose-700 font-semibold mb-4">
              <AlertCircle size={20} />
              <h2>Alertas Críticos</h2>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-rose-600">Nenhum alerta crítico detectado.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, delay }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      className="card flex items-center gap-4"
    >
      <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center text-white shadow-lg shadow-${color.split('-')[1]}-200`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm text-slate-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
    </motion.div>
  );
}
