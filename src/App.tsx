import { useState, useEffect, useCallback } from 'react';
import { EvaluationForm } from './components/EvaluationForm';
import { SimpleEvaluationForm } from './components/SimpleEvaluationForm';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthModal } from './components/AuthModal';
import { QrCode, FileText, SlidersHorizontal } from 'lucide-react';

export function App() {
  const [view, setView] = useState<'form' | 'admin'>('form');
  const [evaluationMode, setEvaluationMode] = useState<'simple' | 'avanzada'>('simple');
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Helper para verificar si la URL actual corresponde a /admin
  const checkIsAdminRoute = useCallback(() => {
    const path = window.location.pathname.toLowerCase().replace(/\/+$/, '');
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();

    return (
      path.endsWith('/admin') ||
      path === '/admin' ||
      hash === '#admin' ||
      hash === '#/admin' ||
      search.includes('admin')
    );
  }, []);

  // Sincronizar ruta al cargar y escuchar navegación del navegador (atrás/adelante)
  useEffect(() => {
    const savedUser = localStorage.getItem('mg_sensorial_admin_user');
    const isValidUser = Boolean(savedUser && savedUser.endsWith('@migusto.com.ar'));
    if (isValidUser && savedUser) {
      setCurrentUser(savedUser);
    }

    if (checkIsAdminRoute()) {
      if (isValidUser) {
        setView('admin');
      } else {
        setView('form');
        setIsAuthModalOpen(true);
      }
    }

    const handleLocationChange = () => {
      const user = localStorage.getItem('mg_sensorial_admin_user');
      const hasAuth = Boolean(user && user.endsWith('@migusto.com.ar'));
      if (checkIsAdminRoute()) {
        if (hasAuth) {
          setView('admin');
        } else {
          setView('form');
          setIsAuthModalOpen(true);
        }
      } else {
        setView('form');
        setIsAuthModalOpen(false);
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, [checkIsAdminRoute]);

  const handleOpenAdmin = () => {
    if (currentUser) {
      setView('admin');
      const basePath = import.meta.env.BASE_URL.replace(/\/+$/, '');
      window.history.pushState({}, '', `${basePath}/admin`);
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const handleAuthSuccess = (email: string) => {
    setCurrentUser(email);
    setView('admin');
    const basePath = import.meta.env.BASE_URL.replace(/\/+$/, '');
    window.history.replaceState({}, '', `${basePath}/admin`);
  };

  const handleBackToForm = () => {
    setView('form');
    window.history.replaceState({}, '', import.meta.env.BASE_URL);
  };

  const handleLogout = () => {
    localStorage.removeItem('mg_sensorial_admin_user');
    setCurrentUser(null);
    setView('form');
    window.history.replaceState({}, '', import.meta.env.BASE_URL);
  };

  const handleCloseAuthModal = () => {
    setIsAuthModalOpen(false);
    if (view !== 'admin') {
      window.history.replaceState({}, '', import.meta.env.BASE_URL);
    }
  };

  return (
    <div className="min-h-screen bg-[#ebdccb] text-[#2c2724] flex flex-col selection:bg-[#4f46e5] selection:text-white font-sans">
      {/* Header Compacto - Rojo Coral (#FC7572) con CATA (#5969E6) */}
      <header className="border-b border-[#e86360] bg-[#FC7572] sticky top-0 z-40 px-3.5 py-2.5 shadow-md">
        <div className="w-full max-w-xl sm:max-w-3xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto px-0 sm:px-2 flex items-center justify-between transition-all">
          <div
            onClick={handleBackToForm}
            className="flex items-center gap-3 cursor-pointer group active:scale-[0.98] transition-all"
          >
            <div className="relative flex items-center">
              <img
                src={`${import.meta.env.BASE_URL}logo-script.png`}
                alt="Mi Gusto"
                className="h-8 sm:h-9 w-auto max-w-[130px] object-contain brightness-0 invert drop-shadow-sm transition-transform group-hover:scale-105"
              />
            </div>
            <div className="h-6 w-px bg-white/30 hidden xs:block" />
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xs sm:text-sm tracking-tight text-white block leading-none drop-shadow-sm">
                  SENSORIAL
                </span>
              </div>
              <span className="text-[9px] uppercase font-bold tracking-wider text-white/90 leading-none mt-1">
                Calidad & Desarrollo
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* SWITCH MODO: SIMPLE / AVANZADA */}
            {view === 'form' && (
              <div className="bg-black/20 p-1 rounded-xl flex items-center gap-1 shadow-inner backdrop-blur-sm border border-white/20">
                <button
                  type="button"
                  onClick={() => setEvaluationMode('simple')}
                  className={`text-xs font-black px-2.5 sm:px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
                    evaluationMode === 'simple'
                      ? 'bg-white text-[#FC7572] shadow-md scale-100'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Simple</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEvaluationMode('avanzada')}
                  className={`text-xs font-black px-2.5 sm:px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
                    evaluationMode === 'avanzada'
                      ? 'bg-[#5969E6] text-white shadow-md scale-100'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Avanzada</span>
                </button>
              </div>
            )}

            {view === 'admin' && (
              <button
                onClick={handleBackToForm}
                className="text-[11px] font-bold px-3 py-1.5 rounded-xl border border-white/30 text-white bg-white/20 hover:bg-white/30 active:scale-95 transition-all flex items-center gap-1.5 shadow-sm"
              >
                <QrCode className="w-3.5 h-3.5 text-white" />
                <span>Cata Sensorial</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Vista activa con transición fluida GSAP */}
      <main key={`${view}_${evaluationMode}`} className="flex-1 flex flex-col animate-fade-in">
        {view === 'form' ? (
          evaluationMode === 'simple' ? (
            <SimpleEvaluationForm onOpenAdmin={handleOpenAdmin} />
          ) : (
            <EvaluationForm onOpenAdmin={handleOpenAdmin} />
          )
        ) : (
          <AdminDashboard
            onBack={handleBackToForm}
            currentUser={currentUser || 'Auditor Calidad'}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Modal de Autenticación */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={handleCloseAuthModal}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}

export default App;
