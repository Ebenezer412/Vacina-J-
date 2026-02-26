import React, { useState, useEffect } from 'react';
import { 
  Search, 
  UserPlus, 
  ChevronRight, 
  Calendar, 
  Phone, 
  MapPin, 
  IdCard,
  History,
  Syringe,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Users,
  XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Patient, Administration, calculateAge, getVaccineStatus, Vaccine } from '../utils/vaccineRules';

export default function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);

  useEffect(() => {
    fetchPatients();
    fetchVaccines();
  }, []);

  const fetchPatients = async (query = '') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pacientes${query ? `?q=${query}` : ''}`);
      const data = await res.json();
      setPatients(data);
    } catch (error) {
      console.error('Error fetching patients:', error);
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPatients(search);
  };

  const handleSelectPatient = async (id: number) => {
    try {
      const res = await fetch(`/api/pacientes/${id}`);
      const data = await res.json();
      setSelectedPatient(data);
    } catch (error) {
      console.error('Error fetching patient details:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <form onSubmit={handleSearch} className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text"
            placeholder="Pesquisar por nome ou BI..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>
        <button 
          onClick={() => setShowAddForm(true)}
          className="btn-primary"
        >
          <UserPlus size={20} /> Novo Paciente
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Patients List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card p-0 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-semibold text-slate-800">Lista de Pacientes</h2>
            </div>
            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-slate-400">Carregando...</div>
              ) : patients.length > 0 ? (
                patients.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPatient(p.id)}
                    className={`w-full p-4 text-left hover:bg-slate-50 transition-colors flex items-center justify-between group ${
                      selectedPatient?.id === p.id ? 'bg-emerald-50/50' : ''
                    }`}
                  >
                    <div>
                      <p className="font-medium text-slate-800 group-hover:text-emerald-700 transition-colors">{p.nome}</p>
                      <p className="text-xs text-slate-500">BI: {p.numero_identificacao || 'N/A'}</p>
                    </div>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
                  </button>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400">Nenhum paciente encontrado.</div>
              )}
            </div>
          </div>
        </div>

        {/* Patient Details */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {selectedPatient ? (
              <motion.div
                key={selectedPatient.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="card">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex gap-4 items-center">
                      <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center text-2xl font-bold">
                        {selectedPatient.nome.charAt(0)}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-slate-800">{selectedPatient.nome}</h2>
                        <p className="text-slate-500 flex items-center gap-1">
                          <Calendar size={14} /> 
                          {new Date(selectedPatient.data_nascimento).toLocaleDateString('pt-AO')} 
                          ({calculateAge(selectedPatient.data_nascimento).years} anos)
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {selectedPatient.gravida && (
                        <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-xs font-bold uppercase tracking-wider">Grávida</span>
                      )}
                      {selectedPatient.puerpera && (
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold uppercase tracking-wider">Puérpera</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-y border-slate-100">
                    <InfoItem icon={IdCard} label="Identificação" value={selectedPatient.numero_identificacao || 'N/A'} />
                    <InfoItem icon={Phone} label="Contacto" value={selectedPatient.contacto_responsavel || 'N/A'} />
                    <InfoItem icon={MapPin} label="Localidade" value={selectedPatient.localidade || 'N/A'} />
                    <InfoItem icon={Calendar} label="Sexo" value={selectedPatient.sexo === 'M' ? 'Masculino' : 'Feminino'} />
                  </div>

                  <div className="mt-8">
                    <div className="flex gap-4 border-b border-slate-100 mb-6">
                      <button className="pb-4 border-b-2 border-emerald-600 text-emerald-700 font-medium">Calendário Vacinal</button>
                      <button className="pb-4 text-slate-500 hover:text-slate-700 transition-colors">Histórico Completo</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {vaccines.map((v) => {
                        const status = getVaccineStatus(selectedPatient, v, (selectedPatient as any).history || []);
                        return (
                          <div key={v.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/30 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                status.status === 'complete' ? 'bg-emerald-100 text-emerald-600' :
                                status.status === 'due' ? 'bg-amber-100 text-amber-600' :
                                'bg-slate-100 text-slate-400'
                              }`}>
                                <Syringe size={20} />
                              </div>
                              <div>
                                <p className="font-medium text-slate-800">{v.nome}</p>
                                <p className="text-xs text-slate-500">{status.label}</p>
                              </div>
                            </div>
                            {status.status === 'complete' ? (
                              <CheckCircle2 size={20} className="text-emerald-500" />
                            ) : status.status === 'due' ? (
                              <Clock size={20} className="text-amber-500" />
                            ) : (
                              <AlertCircle size={20} className="text-slate-300" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="card h-full flex flex-col items-center justify-center py-24 text-slate-400">
                <Users size={64} strokeWidth={1} className="mb-4" />
                <p className="text-lg">Seleccione um paciente para ver os detalhes</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Add Patient Modal */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h2 className="text-xl font-bold text-slate-800">Novo Cadastro</h2>
                <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>
              <form className="p-8 space-y-6" onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data = Object.fromEntries(formData.entries());
                try {
                  const res = await fetch('/api/pacientes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                  });
                  if (res.ok) {
                    setShowAddForm(false);
                    fetchPatients();
                  }
                } catch (error) {
                  console.error('Error adding patient:', error);
                }
              }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Nome Completo *</label>
                    <input name="nome" required className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Data de Nascimento *</label>
                    <input name="data_nascimento" type="date" required className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Sexo *</label>
                    <select name="sexo" required className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none">
                      <option value="M">Masculino</option>
                      <option value="F">Feminino</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Nº Identificação (BI/Cartão)</label>
                    <input name="numero_identificacao" className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Localidade / Bairro</label>
                    <input name="localidade" className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Contacto Responsável</label>
                    <input name="contacto_responsavel" className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
                  </div>
                </div>

                <div className="flex gap-6 pt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="gravida" className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500" />
                    <span className="text-sm text-slate-700">Está Grávida?</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="puerpera" className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500" />
                    <span className="text-sm text-slate-700">Puérpera?</span>
                  </label>
                </div>

                <div className="flex justify-end gap-4 pt-6 border-t border-slate-100">
                  <button type="button" onClick={() => setShowAddForm(false)} className="btn-secondary">Cancelar</button>
                  <button type="submit" className="btn-primary">Salvar Cadastro</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }: any) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-slate-400 font-medium uppercase tracking-wider flex items-center gap-1">
        <Icon size={12} /> {label}
      </p>
      <p className="text-sm font-semibold text-slate-700">{value}</p>
    </div>
  );
}
