import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import { authApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { AuthLayout } from '../components/layout/AuthLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { SpinnerLabel } from '../components/ui/spinner-label';

const MIN_LENGTH = 8;

/** UC2: fijar una nueva contraseña con el token recibido por correo. */
export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < MIN_LENGTH) {
      toast.error(`La contraseña debe tener al menos ${MIN_LENGTH} caracteres`);
      return;
    }
    if (password !== confirm) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    try {
      const { message } = await authApi.resetPassword(token, password);
      toast.success(message);
      navigate('/login');
    } catch (error) {
      toast.error(getErrorMessage(error, 'No se pudo restablecer la contraseña'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Nueva contraseña" subtitle="Defina la contraseña con la que ingresará">
      <Card className="border-0 shadow-uam-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900 text-center">
            Restablecer Contraseña
          </CardTitle>
        </CardHeader>
        <CardContent>
          {token ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Nueva contraseña
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 border-gray-200 focus:border-uam-blue focus:ring-uam-blue/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm" className="text-sm font-medium text-gray-700">
                  Confirmar contraseña
                </Label>
                <Input
                  id="confirm"
                  type="password"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  className="h-11 border-gray-200 focus:border-uam-blue focus:ring-uam-blue/20"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-11 bg-uam-blue hover:bg-uam-blue-dark text-white font-medium transition-colors"
                disabled={loading}
              >
                {loading ? <SpinnerLabel>Guardando...</SpinnerLabel> : 'Restablecer contraseña'}
              </Button>
            </form>
          ) : (
            <p className="text-sm text-gray-600 text-center">
              El enlace no es válido. Solicite uno nuevo desde «¿Olvidó su contraseña?».
            </p>
          )}
          <Link
            to="/login"
            className="mt-5 flex items-center justify-center gap-1 text-sm font-medium text-uam-blue hover:text-uam-blue-dark transition-colors"
          >
            <ArrowLeft size={14} /> Volver a iniciar sesión
          </Link>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
