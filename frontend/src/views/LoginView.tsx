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
      setError('Por favor ingresa tu nombre de usuario');
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
    <div class="min-h-full flex items-center justify-center p-4 bg-[#09090b] select-none">
      <div class="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-lg p-6 sm:p-7 shadow-xl">
        {/* Brand */}
        <div class="flex flex-col items-center text-center mb-6">
          <div class="w-9 h-9 rounded-md bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-zinc-100 mb-2.5">
            <svg class="w-4 h-4 fill-current ml-0.5 text-zinc-200" viewBox="0 0 24 24">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
          <h1 class="text-base sm:text-lg font-semibold text-zinc-100 tracking-tight">
            Verlet Cine
          </h1>
          <p class="text-xs text-zinc-400 mt-0.5">
            Inicia sesión para acceder al catálogo
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div class="mb-4 p-2.5 rounded bg-rose-950/40 border border-rose-800 text-rose-300 text-xs font-mono text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} class="space-y-3.5">
          <div>
            <label class="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1">
              Usuario
            </label>
            <input
              ref={usernameRef}
              data-nav="item"
              data-nav-default="true"
              type="text"
              value={username}
              onInput={(e) => setUsername((e.target as HTMLInputElement).value)}
              placeholder="Nombre de usuario"
              autocomplete="username"
              class="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-500 text-xs sm:text-sm outline-none focus:border-zinc-500 transition-colors font-mono"
            />
          </div>

          <div>
            <label class="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1">
              Contraseña
            </label>
            <input
              data-nav="item"
              type="password"
              value={password}
              onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
              placeholder="••••••••"
              autocomplete="current-password"
              class="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-500 text-xs sm:text-sm outline-none focus:border-zinc-500 transition-colors font-mono"
            />
          </div>

          <button
            data-nav="item"
            type="submit"
            disabled={loading}
            class="w-full mt-4 py-2 px-3 bg-zinc-100 hover:bg-white disabled:opacity-50 text-zinc-950 font-medium rounded text-xs sm:text-sm transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span class="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></span>
                <span>Conectando...</span>
              </>
            ) : (
              <span>Iniciar sesión</span>
            )}
          </button>
        </form>

        <div class="mt-6 pt-4 border-t border-zinc-800/80 text-center">
          <p class="text-[11px] text-zinc-500 font-mono">
            Conexión directa con el servidor local.
          </p>
        </div>
      </div>
    </div>
  );
}
