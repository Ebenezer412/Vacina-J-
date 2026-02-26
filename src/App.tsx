import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Users, 
  Syringe, 
  Package, 
  Bell, 
  BarChart3, 
  Plus, 
  Search, 
  ChevronRight, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Menu,
  X,
  LogOut,
  UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Pages
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Vaccinate from './pages/Vaccinate';
import Stock from './pages/Stock';
import Alerts from './pages/Alerts';
import Reports from './pages/Reports';

type Page = 'dashboard' | 'patients' | 'vaccinate' | 'stock' | 'alerts' | 'reports';

export default function App() {
  const [activePage, setActivePage] = useState<Page>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'patients', label: 'Pacientes', icon: Users },
    { id: 'vaccinate', label: 'Vacinar', icon: Syringe },
    { id: 'stock', label: 'Estoque', icon: Package },
    { id: 'alerts', label: 'Alertas', icon: Bell },
    { id: 'reports', label: 'Relatórios', icon: BarChart3 },
  ];

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard onNavigate={setActivePage} />;
      case 'patients': return <Patients />;
      case 'vaccinate': return <Vaccinate />;
      case 'stock': return <Stock />;
      case 'alerts': return <Alerts />;
      case 'reports': return <Reports />;
      default: return <Dashboard onNavigate={setActivePage} />;
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-white border-r border-slate-200 transition-all duration-300 flex flex-col fixed h-full z-50`}
      >
        <div className="p-6 flex items-center gap-3 border-b border-slate-100">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">
            F
          </div>
          {isSidebarOpen && (
            <span className="font-bold text-xl tracking-tight text-slate-800">FLAME ME</span>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id as Page)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                activePage === item.id 
                  ? 'bg-emerald-50 text-emerald-700 font-medium' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <item.icon size={20} />
              {isSidebarOpen && <span>{item.label}</span>}
              {activePage === item.id && isSidebarOpen && (
                <motion.div 
                  layoutId="active-pill"
                  className="ml-auto w-1.5 h-1.5 bg-emerald-600 rounded-full"
                />
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full flex items-center gap-3 p-3 text-slate-400 hover:text-slate-600 transition-colors"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            {isSidebarOpen && <span>Recolher</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main 
        className={`flex-1 transition-all duration-300 ${
          isSidebarOpen ? 'ml-64' : 'ml-20'
        }`}
      >
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 px-8 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-slate-800 capitalize">
            {menuItems.find(m => m.id === activePage)?.label}
          </h1>
          
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium text-slate-700">Responsável PAV</span>
              <span className="text-xs text-slate-500">Posto Fixo Angola</span>
            </div>
            <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-600">
              <Users size={20} />
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

