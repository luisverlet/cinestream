import { useState, useRef, useEffect } from 'preact/hooks';
import { api } from '../services/api';

interface LoginViewProps {
  onLoginSuccess: () => void;
}

export function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const usernameRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (usernameRef.current) {
      usernameRef.current.focus();
    }
  }, []);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Por favor ingresa tu usuario de Jellyfin');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await api.login(username.trim(), password);
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Usuario o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="min-h-full flex items-center justify-center p-4 bg-[#090d16] select-none">
      <div class="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl">
        {/* Brand */}
        <div class="flex flex-col items-center text-center mb-8">
          <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-xl shadow-emerald-500/25 mb-3">
            <svg class="w-8 h-8 text-slate-950 fill-current ml-0.5" viewBox="0 0 24 24">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
          <h1 class="text-2xl font-black text-white tracking-wider">
            VERLET<span class="text-emerald-400">CINE</span>
          </h1>
          <p class="text-xs text-slate-400 mt-1">
            Inicia sesión con tu cuenta de Jellyfin para comenzar
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div class="mb-6 p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs font-medium text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Usuario Jellyfin
            </label>
            <input
              ref={usernameRef}
              data-nav="item"
              data-nav-default="true"
              type="text"
              value={username}
              onInput={(e) => setUsername((e.target as HTMLInputElement).value)}
              placeholder="Ej: luis"
              autocomplete="username"
              class="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-sm outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Contraseña
            </label>
            <input
              data-nav="item"
              type="password"
              value={password}
              onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
              placeholder="••••••••"
              autocomplete="current-password"
              class="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-sm outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <button
            data-nav="item"
            type="submit"
            disabled={loading}
            class="w-full mt-6 py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 active:scale-95"
          >
            {loading ? (
              <>
                <span class="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                <span>Conectando...</span>
              </>
            ) : (
              <span>Entrar</span>
            )}
          </button>
        </form>

        <div class="mt-8 pt-6 border-t border-slate-800/80 text-center">
          <p class="text-[11px] text-emerald-400/80 font-medium mb-1">
            ✓ Sesión persistente activa (se recordará automáticamente en este dispositivo)
          </p>
          <p class="text-[11px] text-slate-500">
            Conexión directa y cifrada al servidor personal Jellyfin.
          </p>
        </div>
      </div>
    </div>
  );
}

