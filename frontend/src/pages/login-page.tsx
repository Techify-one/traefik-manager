import { FormEvent, useEffect, useState } from 'react';
import { useLocation, useNavigate, type Location } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useSession } from '../context/session-context';
import { useToast } from '../hooks/use-toast';

interface LoginPageProps {
  title: string;
}

export function LoginPage({ title }: LoginPageProps) {
  const { info, login, loading } = useSession();
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = (location.state as { from?: Location })?.from?.pathname ?? '/';

  useEffect(() => {
    if (info.authenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [info.authenticated, navigate, redirectTo]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const response = await login(username, password);

    if (response.success) {
      toast({ title: 'Login successful', description: `Bem-vindo, ${response.data.username ?? 'usuário'}!` });
      navigate(redirectTo, { replace: true });
    } else {
      setError(response.message ?? 'Invalid credentials');
      toast({ title: 'Falha no login', description: response.message ?? 'Usuário ou senha inválidos', variant: 'destructive' });
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_hsla(210,82%,72%,0.35),_transparent_55%),_radial-gradient(circle_at_bottom,_hsla(230,70%,84%,0.28),_transparent_60%)]"
      />
      <Card className="relative w-full max-w-md shadow-xl">
        <CardHeader>
          <div className="flex flex-col items-center space-y-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l9-5 9 5-9 5-9-5zm0 5l9 5 9-5" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-semibold">{title}</h1>
              <p className="text-sm text-muted-foreground">Gerencie domínios e configurações do Traefik com facilidade.</p>
            </div>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <CardContent className="space-y-4">
            {error ? <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div> : null}
            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <Input id="username" name="username" value={username} onChange={(event) => setUsername(event.target.value)} required autoFocus disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" name="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required disabled={loading} />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
            <p className="text-center text-xs text-muted-foreground">Versão {info.version}</p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
