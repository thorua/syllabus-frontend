import { Link, useLocation } from 'react-router-dom';
import { Construction } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { PageContainer } from '../components/composites';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';

/**
 * Temporal durante la construcción por fases: cada ruta se retira de aquí cuando su
 * pantalla queda lista, y el componente desaparece al cerrar la Fase 6.
 */
export const PENDING_ROUTES: Record<string, { title: string; phase: number }> = {
  '/syllabus': { title: 'Syllabus', phase: 4 },
  '/settings': { title: 'Configuración', phase: 5 },
  '/export': { title: 'Exportar', phase: 6 },
};

export function UnderConstructionPage() {
  const { pathname } = useLocation();
  const route = PENDING_ROUTES[`/${pathname.split('/')[1]}`];

  return (
    <Layout>
      <PageContainer title={route?.title ?? 'En construcción'}>
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="rounded-full bg-amber-50 p-4 text-uam-orange">
              <Construction className="h-8 w-8" />
            </div>
            <p className="text-lg font-semibold text-gray-900">Módulo en construcción</p>
            <p className="max-w-md text-sm text-gray-500">
              Esta sección se habilita en la Fase {route?.phase} del proyecto. Mientras tanto puede
              usar las secciones ya disponibles.
            </p>
            <Link to="/">
              <Button variant="outline" size="sm">
                Volver al Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </PageContainer>
    </Layout>
  );
}
