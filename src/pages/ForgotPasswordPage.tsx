import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, MailCheck } from 'lucide-react';
import { authApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { AuthLayout } from '../components/layout/AuthLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { SpinnerLabel } from '../components/ui/spinner-label';

/** UC2: solicitar el enlace de recuperación por correo. */
export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sentMessage, setSentMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { message } = await authApi.forgotPassword(email);
      setSentMessage(message);
    } catch (error) {
      toast.error(getErrorMessage(error, 'No se pudo enviar la solicitud'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Recuperar contraseña" subtitle="Le enviaremos un enlace para restablecerla">
      <Card className="border-0 shadow-uam-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900 text-center">
            {sentMessage ? 'Revise su correo' : 'Recuperar Contraseña'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sentMessage ? (
            <div className="space-y-5 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-uam-blue">
                <MailCheck size={24} />
              </div>
              <p className="text-sm text-gray-600">{sentMessage}</p>
            </div>
          ) : (
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
              <Button
                type="submit"
                className="w-full h-11 bg-uam-blue hover:bg-uam-blue-dark text-white font-medium transition-colors"
                disabled={loading}
              >
                {loading ? <SpinnerLabel>Enviando...</SpinnerLabel> : 'Enviar enlace'}
              </Button>
            </form>
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
