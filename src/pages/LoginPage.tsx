import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getErrorMessage } from '../api/client';
import { AuthLayout } from '../components/layout/AuthLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { SpinnerLabel } from '../components/ui/spinner-label';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      toast.success('Inicio de sesión exitoso');
      navigate('/');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Error al iniciar sesión'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Bienvenido" subtitle="Ingrese sus credenciales para acceder">
      <Card className="border-0 shadow-uam-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900 text-center">
            Iniciar Sesión
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Correo Electrónico
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="correo@autonoma.edu.co"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 border-gray-200 focus:border-uam-blue focus:ring-uam-blue/20"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Contraseña
                </Label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-uam-blue hover:text-uam-blue-dark transition-colors"
                >
                  ¿Olvidó su contraseña?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 border-gray-200 focus:border-uam-blue focus:ring-uam-blue/20 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-11 bg-uam-blue hover:bg-uam-blue-dark text-white font-medium transition-colors"
              disabled={loading}
            >
              {loading ? <SpinnerLabel>Ingresando...</SpinnerLabel> : 'Iniciar Sesión'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
