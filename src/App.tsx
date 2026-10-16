import { useState, useEffect } from 'react';
import { EvaluationForm } from './components/EvaluationForm';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthModal } from './components/AuthModal';
import { QrCode } from 'lucide-react';

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
    <div className="min-h-screen bg-[#f4f6f8] text-slate-800 flex flex-col selection:bg-[#3b68ff] selection:text-white font-sans">
      {/* Header Mobile Compacto - Gama Sólida Mi Gusto */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-40 px-3.5 py-2.5 shadow-sm">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div
            onClick={() => setView('form')}
            className="flex items-center gap-3 cursor-pointer group active:scale-[0.98] transition-all"
          >
            <div className="relative flex items-center">
              <img
                src="/logo-script.png"
                alt="Mi Gusto"
                className="h-8 sm:h-9 w-auto max-w-[130px] object-contain brightness-0 transition-transform group-hover:scale-105"
              />
            </div>
            <div className="h-6 w-px bg-slate-200 hidden xs:block" />
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xs tracking-tight text-slate-900 block leading-none">
                  SENSORIAL
                </span>
                <span className="text-[8.5px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[#3b68ff] uppercase tracking-wide">
                  Cata
                </span>
              </div>
              <span className="text-[9px] uppercase font-semibold tracking-wider text-slate-500 leading-none mt-1">
                Calidad & Desarrollo
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {view === 'admin' && (
              <button
                onClick={() => setView('form')}
                className="text-[11px] font-bold px-3 py-1.5 rounded-xl border border-slate-200 text-[#3b68ff] hover:text-slate-900 bg-slate-50 hover:bg-slate-100 active:scale-95 transition-all flex items-center gap-1.5 shadow-sm"
              >
                <QrCode className="w-3.5 h-3.5 text-[#3b68ff]" />
                <span>Cata Sensorial</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Vista activa */}
      <main className="flex-1 flex flex-col">
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
