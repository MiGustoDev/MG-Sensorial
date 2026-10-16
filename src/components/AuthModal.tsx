import { useState } from 'react';
import { LogIn, Lock, Mail, ShieldAlert, ShieldCheck } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (email: string) => void;
}

// Cuentas administradoras autorizadas
const AUTHORIZED_ACCOUNTS: Record<string, string> = {
  'admin@migusto.com.ar': 'MiGusto123.',
  'marcelobuscalia@migusto.com.ar': 'MiGusto123.'
};

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    setTimeout(() => {
      // Validar cuenta autorizada
      if (!(cleanEmail in AUTHORIZED_ACCOUNTS)) {
        setError('Cuenta no autorizada para el panel de administración.');
        setLoading(false);
        return;
      }

      // Validar contraseña
      if (AUTHORIZED_ACCOUNTS[cleanEmail] !== cleanPassword) {
        setError('Contraseña incorrecta.');
        setLoading(false);
        return;
      }

      // Login exitoso
      localStorage.setItem('mg_sensorial_admin_user', cleanEmail);
      onSuccess(cleanEmail);
      setLoading(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 animate-fade-in">
      <div className="relative w-full max-w-sm glass-panel rounded-2xl p-6 shadow-2xl border border-[#1f293d]">
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 text-slate-400 hover:text-white p-1"
        >
          ✕
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#0c121e] border border-[#1f293d] flex items-center justify-center text-qc-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">Panel Calidad</h3>
            <p className="text-[11px] text-slate-400">Acceso exclusivo auditores</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
              <span>Usuario Autorizado</span>
              <span className="text-red-500 font-extrabold text-xs ml-0.5">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="ej: admin@migusto.com.ar"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl glass-input text-xs text-white placeholder-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
              <span>Contraseña</span>
              <span className="text-red-500 font-extrabold text-xs ml-0.5">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl glass-input text-xs text-white placeholder-slate-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-2 rounded-xl bg-gradient-to-r from-qc-600 to-blue-600 hover:from-qc-500 hover:to-blue-500 text-white font-bold text-xs tracking-wider uppercase shadow-lg shadow-qc-600/30 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span>Verificando credenciales...</span>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Ingresar al Historial
              </>
            )}
          </button>
        </form>

        <div className="mt-4 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-qc-400" />
          <span>Control de Calidad • Mi Gusto</span>
        </div>
      </div>
    </div>
  );
};
