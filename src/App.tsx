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
    <div className="min-h-screen bg-[#ebdccb] text-[#2c2724] flex flex-col selection:bg-[#4f46e5] selection:text-white font-sans">
      {/* Header Mobile Compacto - Rojo Coral (#FC7572) con CATA (#5969E6) */}
      <header className="border-b border-[#e86360] bg-[#FC7572] sticky top-0 z-40 px-3.5 py-2.5 shadow-md">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div
            onClick={() => setView('form')}
            className="flex items-center gap-3 cursor-pointer group active:scale-[0.98] transition-all"
          >
            <div className="relative flex items-center">
              <img
                src="/logo-script.png"
                alt="Mi Gusto"
                className="h-8 sm:h-9 w-auto max-w-[130px] object-contain brightness-0 invert drop-shadow-sm transition-transform group-hover:scale-105"
              />
            </div>
            <div className="h-6 w-px bg-white/30 hidden xs:block" />
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xs tracking-tight text-white block leading-none drop-shadow-sm">
                  SENSORIAL
                </span>
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-[#5969E6] text-white uppercase tracking-wider shadow-md border border-white/20">
                  Cata
                </span>
              </div>
              <span className="text-[9px] uppercase font-bold tracking-wider text-white/90 leading-none mt-1">
                Calidad & Desarrollo
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {view === 'admin' && (
              <button
                onClick={() => setView('form')}
                className="text-[11px] font-bold px-3 py-1.5 rounded-xl border border-white/30 text-white bg-white/20 hover:bg-white/30 active:scale-95 transition-all flex items-center gap-1.5 shadow-sm"
              >
                <QrCode className="w-3.5 h-3.5 text-white" />
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
