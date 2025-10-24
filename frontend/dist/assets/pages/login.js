import { React, html } from '../lib/html.js';
import { useNavigate, useLocation, Link, Navigate } from 'https://esm.sh/react-router-dom@6.22.3?bundle';
import { Button, Card, CardContent, CardHeader, Input, Label } from '../components/ui.js';
import { useSession } from '../context/session-context.js';
import { useToast } from '../hooks/toast.js';
import { Loader2 } from '../components/icons.js';

function LoginPage() {
  const { info, login, loading } = useSession();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = React.useState({ username: '', password: '' });
  const [submitting, setSubmitting] = React.useState(false);
  const loggedOut = React.useMemo(() => new URLSearchParams(location.search).get('loggedOut'), [location.search]);

  React.useEffect(() => {
    if (loggedOut) {
      pushToast({ title: 'Sessão encerrada', description: 'Você saiu com sucesso.' });
    }
  }, [loggedOut, pushToast]);

  if (!loading && info?.authenticated) {
    return html`<${Navigate} to="/" replace />`;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    try {
      setSubmitting(true);
      const result = await login(form.username, form.password);
      if (result.success) {
        const redirect = (location.state && location.state.from) || '/';
        navigate(redirect, { replace: true });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return html`
    <div class="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-purple-100 px-4 py-12">
      <${Card} className="w-full max-w-md">
        <${CardHeader}>
          <div class="space-y-1">
            <h1 class="text-2xl font-semibold text-slate-900">Acessar painel</h1>
            <p class="text-sm text-slate-500">Entre com suas credenciais definidas no backend.</p>
          </div>
        </${CardHeader}>
        <${CardContent}>
          <form class="space-y-6" onSubmit=${handleSubmit}>
            <div class="space-y-2">
              <${Label} htmlFor="username">Usuário</${Label}>
              <${Input} id="username" required value=${form.username} onInput=${(event) => setForm((state) => ({ ...state, username: event.target.value }))} placeholder="admin" />
            </div>
            <div class="space-y-2">
              <${Label} htmlFor="password">Senha</${Label}>
              <${Input} id="password" type="password" required value=${form.password} onInput=${(event) => setForm((state) => ({ ...state, password: event.target.value }))} />
            </div>
            <${Button} type="submit" className="w-full" disabled=${submitting}>
              ${submitting ? html`<${Loader2} class="h-4 w-4 animate-spin" /> Autenticando...` : 'Entrar'}
            </${Button}>
          </form>
          <p class="mt-6 text-center text-xs text-slate-500">
            Precisa de acesso? <${Link} to="https://github.com/techify-br/traefik-manager" target="_blank" rel="noopener" class="text-slate-700 underline">Confira a documentação</${Link}>.
          </p>
        </${CardContent}>
      </${Card}>
    </div>
  `;
}

export default LoginPage;
