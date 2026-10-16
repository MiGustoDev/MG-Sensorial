import { useState, useEffect } from 'react';
import { EvaluationForm } from './components/EvaluationForm';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthModal } from './components/AuthModal';
import { Database, QrCode } from 'lucide-react';

export function App() {
  const [view, setView] = useState<'form' | 'admin'>('form');
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('mg_sensorial_admin_user');
    if (savedUser && savedUser.endsWith('@migusto.com.ar')) {
      setCurrentUser(savedUser);
    }
  }, []);

  const handleOpenAdmin = () => {
    if (currentUser) {
      setView('admin');
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const handleAuthSuccess = (email: string) => {
    setCurrentUser(email);
    setView('admin');
  };

  const handleLogout = () => {
    localStorage.removeItem('mg_sensorial_admin_user');
    setCurrentUser(null);
    setView('form');
  };

  return (
    <div className="min-h-screen bg-[#05070c] text-slate-100 relative selection:bg-qc-600 selection:text-white font-sans">
      {/* Fondo Ambient Deep Black & QC Blue */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[550px] h-[550px] bg-qc-600/[0.07] rounded-full blur-[140px]" />
        <div className="absolute top-1/2 -left-32 w-[400px] h-[400px] bg-blue-700/[0.05] rounded-full blur-[140px]" />
        <div className="absolute bottom-0 -right-32 w-[450px] h-[450px] bg-qc-900/[0.1] rounded-full blur-[150px]" />
      </div>

      {/* Header Mobile Compacto */}
      <header className="border-b border-qc-500/15 bg-[#05070c]/85 backdrop-blur-md sticky top-0 z-40 px-3.5 py-2.5">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div
            onClick={() => setView('form')}
            className="flex items-center gap-3 cursor-pointer group active:scale-[0.98] transition-all"
          >
            <div className="relative flex items-center">
              <img
                src="/logo-script.png"
                alt="Mi Gusto"
                className="h-8 sm:h-9 w-auto max-w-[130px] object-contain drop-shadow-[0_2px_12px_rgba(56,165,248,0.25)] transition-transform group-hover:scale-105"
              />
            </div>
            <div className="h-6 w-px bg-slate-800/80 hidden xs:block" />
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xs tracking-tight text-white block leading-none">
                  SENSORIAL
                </span>
                <span className="text-[8.5px] font-bold px-1.5 py-0.5 rounded-full bg-qc-500/20 border border-qc-400/30 text-qc-300 uppercase tracking-wide">
                  Cata
                </span>
              </div>
              <span className="text-[9px] uppercase font-semibold tracking-wider text-slate-400 leading-none mt-1">
                Calidad & Desarrollo
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {view === 'form' ? (
              <button
                onClick={handleOpenAdmin}
                className="text-[11px] font-bold px-3 py-1.5 rounded-xl border border-qc-500/30 text-qc-200 hover:text-white bg-gradient-to-b from-qc-900/60 to-qc-950/80 hover:border-qc-400/50 hover:shadow-lg hover:shadow-qc-600/20 active:scale-95 transition-all flex items-center gap-1.5 backdrop-blur-sm"
              >
                <Database className="w-3.5 h-3.5 text-qc-400" />
                <span>{currentUser ? 'Historial' : 'Admin'}</span>
              </button>
            ) : (
              <button
                onClick={() => setView('form')}
                className="text-[11px] font-bold px-3 py-1.5 rounded-xl border border-qc-500/30 text-qc-200 hover:text-white bg-gradient-to-b from-qc-900/60 to-qc-950/80 hover:border-qc-400/50 hover:shadow-lg hover:shadow-qc-600/20 active:scale-95 transition-all flex items-center gap-1.5 backdrop-blur-sm"
              >
                <QrCode className="w-3.5 h-3.5 text-qc-400" />
                <span>Cata Sensorial</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Vista activa */}
      <main>
        {view === 'form' ? (
          <EvaluationForm
            onOpenAdmin={handleOpenAdmin}
          />
        ) : (
          <AdminDashboard
            onBack={() => setView('form')}
            currentUser={currentUser || 'Auditor Calidad'}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Modal de Autenticación */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}

export default App;
