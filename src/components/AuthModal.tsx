import { useState } from 'react';
import { createPortal } from 'react-dom';
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

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#1c1815]/75 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm bg-[#fdfbf7] rounded-3xl p-6 sm:p-7 shadow-2xl border border-[#e2d9c8] text-[#2c2724]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[#f5f0e6] border border-[#e2d9c8] text-[#7c746d] hover:text-[#2c2724] hover:bg-[#ede6d8] flex items-center justify-center text-xs font-bold transition-all"
        >
          ✕
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-[#eeedfc] border border-[#d7d4f9] flex items-center justify-center text-[#5969E6] shadow-xs">
            <Lock className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-base font-black text-[#2c2724] tracking-tight">Panel de Control</h3>
              <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-[#5969E6] text-white uppercase tracking-wider">
                Admin
              </span>
            </div>
            <p className="text-[11px] text-[#7c746d]">Acceso exclusivo para auditores de Calidad</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-[#fdf2f2] border border-[#fecaca] text-[#eb5757] text-xs flex items-center gap-2 font-semibold">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="flex items-center gap-1 text-[11px] font-extrabold text-[#7c746d] uppercase tracking-wider mb-1.5">
              <span>Usuario Autorizado</span>
              <span className="text-red-500 font-extrabold text-xs ml-0.5">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#7c746d] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="ej: admin@migusto.com.ar"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#f5f0e6] border border-[#ded4c3] text-xs font-semibold text-[#2c2724] placeholder-[#a69d91] focus:bg-white focus:border-[#5969E6] focus:ring-2 focus:ring-[#5969E6]/20 transition-all outline-none"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1 text-[11px] font-extrabold text-[#7c746d] uppercase tracking-wider mb-1.5">
              <span>Contraseña</span>
              <span className="text-red-500 font-extrabold text-xs ml-0.5">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#7c746d] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#f5f0e6] border border-[#ded4c3] text-xs font-semibold text-[#2c2724] placeholder-[#a69d91] focus:bg-white focus:border-[#5969E6] focus:ring-2 focus:ring-[#5969E6]/20 transition-all outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-1 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white font-extrabold text-xs tracking-wider uppercase shadow-md shadow-[#4f46e5]/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span>Verificando credenciales...</span>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Ingresar al Historial</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-4 pt-3 border-t border-[#e2d9c8] text-center text-[11px] text-[#7c746d] flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#5969E6]" />
          <span>Control de Calidad • Mi Gusto</span>
        </div>
      </div>
    </div>,
    document.body
  );
};
