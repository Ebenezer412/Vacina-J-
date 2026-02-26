import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Syringe, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ChevronRight, 
  UserPlus,
  X,
  Info,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Patient, Vaccine, Administration, getVaccineStatus, calculateAge } from '../utils/vaccineRules';

export default function Vaccinate() {
  const [search, setSearch] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState<Vaccine | null>(null);
  const [responsible, setResponsible] = useState('Enfermeiro de Turno');

  useEffect(() => {
    fetchVaccines();
  }, []);

  const fetchVaccines = async () => {
    try {
      const res = await fetch('/api/vacinas');
      const data = await res.json();
      setVaccines(data);
    } catch (error) {
      console.error('Error fetching vaccines:', error);
    }
  };

  const handleSearch = async (query: string) => {
    setSearch(query);
    if (query.length < 2) {
      setPatients([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/pacientes?q=${query}`);
      const data = await res.json();
      setPatients(data);
    } catch (error) {
      console.error('Error searching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPatient = async (patient: Patient) => {
    try {
      const res = await fetch(`/api/pacientes/${patient.id}`);
      const data = await res.json();
      setSelectedPatient(data);
      setPatients([]);
      setSearch('');
    } catch (error) {
      console.error('Error fetching patient details:', error);
    }
  };

  const handleAdminister = async (vaccine: Vaccine) => {
    try {
      const res = await fetch('/api/administrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paciente_id: selectedPatient?.id,
          vacina_id: vaccine.id,
          responsavel: responsible,
          observacoes: ''
        })
      });
      
      if (res.ok) {
        setShowConfirm(null);
        // Refresh patient data
        if (selectedPatient) handleSelectPatient(selectedPatient);
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao administrar vacina');
      }
    } catch (error) {
      console.error('Error administering vaccine:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Search Section */}
      <div className="relative z-50">
        <div className="card p-4 flex items-center gap-4">
          <Search className="text-slate-400" size={24} />
          <input 
            type="text"
            placeholder="Pesquisar paciente por nome ou BI..."
            className="flex-1 bg-transparent border-none outline-none text-lg text-slate-800 placeholder:text-slate-400"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
          {loading && <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />}
        </div>

        <AnimatePresence>
          {patients.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden"
            >
              {patients.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectPatient(p)}
                  className="w-full p-4 text-left hover:bg-slate-50 flex items-center justify-between group border-b border-slate-100 last:border-0"
                >
                  <div>
                    <p className="font-semibold text-slate-800 group-hover:text-emerald-700">{p.nome}</p>
                    <p className="text-xs text-slate-500">BI: {p.numero_identificacao || 'N/A'} • {calculateAge(p.data_nascimento).years} anos</p>
                  </div>
                  <ChevronRight size={18} className="text-slate-300 group-hover:text-emerald-500" />
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Patient Profile & Calendar */}
      <AnimatePresence mode="wait">
        {selectedPatient ? (
          <motion.div
            key={selectedPatient.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="card bg-emerald-600 text-white border-none flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-bold">
                  {selectedPatient.nome.charAt(0)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{selectedPatient.nome}</h2>
                  <p className="text-emerald-100 flex items-center gap-1">
                    <Clock size={14} /> 
                    {calculateAge(selectedPatient.data_nascimento).years} anos, {calculateAge(selectedPatient.data_nascimento).months} meses
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedPatient(null)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vaccines.map((v) => {
                const status = getVaccineStatus(selectedPatient, v, (selectedPatient as any).history || []);
                return (
                  <button
                    key={v.id}
                    disabled={status.status === 'complete' || status.status === 'blocked'}
                    onClick={() => setShowConfirm(v)}
                    className={`p-5 rounded-2xl border text-left transition-all flex items-center justify-between group ${
                      status.status === 'complete' ? 'bg-emerald-50 border-emerald-100 opacity-80 cursor-default' :
                      status.status === 'due' ? 'bg-white border-slate-200 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/10' :
                      'bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        status.status === 'complete' ? 'bg-emerald-100 text-emerald-600' :
                        status.status === 'due' ? 'bg-emerald-600 text-white' :
                        'bg-slate-200 text-slate-400'
                      }`}>
                        <Syringe size={24} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{v.nome}</p>
                        <p className={`text-xs font-medium ${
                          status.status === 'complete' ? 'text-emerald-600' :
                          status.status === 'due' ? 'text-amber-600' :
                          'text-slate-400'
                        }`}>
                          {status.label}
                        </p>
                      </div>
                    </div>
                    {status.status === 'due' && (
                      <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus size={18} />
                      </div>
                    )}
                    {status.status === 'complete' && <CheckCircle2 size={24} className="text-emerald-500" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <div className="card py-24 flex flex-col items-center justify-center text-slate-400">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <Search size={40} strokeWidth={1} />
            </div>
            <h2 className="text-xl font-semibold text-slate-600 mb-2">Pronto para Vacinar</h2>
            <p className="text-center max-w-sm">Pesquise um paciente para ver o calendário vacinal e registar novas doses com apenas 3 cliques.</p>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-8 text-center space-y-6">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <Syringe size={40} />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-slate-800">Confirmar Administração</h3>
                  <p className="text-slate-500">
                    Está prestes a registar a vacina <span className="font-bold text-slate-800">{showConfirm.nome}</span> para <span className="font-bold text-slate-800">{selectedPatient?.nome}</span>.
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl text-left space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Responsável:</span>
                    <input 
                      className="font-bold text-slate-800 bg-transparent border-none text-right outline-none focus:ring-0"
                      value={responsible}
                      onChange={(e) => setResponsible(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Data:</span>
                    <span className="font-bold text-slate-800">{new Date().toLocaleDateString('pt-AO')}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => handleAdminister(showConfirm)}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
                  >
                    Confirmar e Registar
                  </button>
                  <button 
                    onClick={() => setShowConfirm(null)}
                    className="w-full py-4 text-slate-400 font-medium hover:text-slate-600 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Plus({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );
}
