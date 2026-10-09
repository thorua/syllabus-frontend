import type { ReactNode } from 'react';
import { GraduationCap } from 'lucide-react';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

/** Pantalla dividida del login (panel de marca UAM + formulario), compartida por las páginas de acceso. */
export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo - Branding UAM */}
      <div className="hidden lg:flex lg:w-1/2 uam-gradient relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-uam-yellow rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12">
          <div className="bg-white rounded-xl p-4 mb-8 shadow-lg flex items-center justify-center">
            <img
              src="/images/uam_acreditacion25_vertical_COLOR.jpg"
              alt="Universidad Autónoma de Manizales"
              className="h-32 w-auto object-contain"
            />
          </div>
          <h1 className="text-4xl font-bold text-white text-center mb-4 leading-tight">
            Sistema de Gestión
            <br />
            de Syllabus
          </h1>
          <p className="text-blue-100 text-center text-lg max-w-md">
            Plataforma integral para la administración, edición y control de syllabus académicos
          </p>
          <div className="mt-12 flex items-center gap-3 text-blue-200 text-sm">
            <GraduationCap size={20} />
            <span>Universidad Autónoma de Manizales</span>
          </div>
        </div>
      </div>

      {/* Panel derecho - Formulario */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gray-50">
        <div className="w-full max-w-md space-y-8">
          {/* Logo mobile */}
          <div className="lg:hidden text-center flex justify-center mb-6">
            <div className="bg-white rounded-lg p-2 shadow-sm inline-block">
              <img
                src="/images/uam_acreditacion25_vertical_COLOR.jpg"
                alt="UAM"
                className="h-20 w-auto object-contain"
              />
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            <p className="text-gray-500 mt-1">{subtitle}</p>
          </div>

          {children}

          <p className="text-center text-xs text-gray-400">
            Universidad Autónoma de Manizales — Acreditación Institucional de Alta Calidad
          </p>
        </div>
      </div>
    </div>
  );
}
