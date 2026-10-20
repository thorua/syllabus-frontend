import { useEffect, useRef, useState } from 'react';
import type React from 'react';
import { Eraser, Save } from 'lucide-react';
import { Button } from './ui/button';

const TINTA = '#10205f';

/**
 * Recuadro para dibujar la firma manuscrita con el mouse, el dedo o un lápiz. Entrega un PNG con
 * fondo transparente; el backend lo recorta antes de guardarlo.
 */
export function SignaturePad({ onSave, saving }: { onSave: (png: Blob) => void; saving: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dibujando = useRef(false);
  const [vacio, setVacio] = useState(true);

  // El lienzo se dimensiona a su tamaño en pantalla por la densidad de píxeles, para un trazo nítido.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const escala = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * escala;
    canvas.height = canvas.offsetHeight * escala;
    ctx.lineWidth = 2.5 * escala;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = TINTA;
  }, []);

  const punto = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = e.currentTarget;
    const r = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) * canvas.width) / r.width,
      y: ((e.clientY - r.top) * canvas.height) / r.height,
    };
  };

  const empezar = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = e.currentTarget.getContext('2d');
    if (!ctx) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const { x, y } = punto(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    dibujando.current = true;
  };

  const trazar = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = e.currentTarget.getContext('2d');
    if (!dibujando.current || !ctx) return;
    const { x, y } = punto(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setVacio(false);
  };

  const terminar = () => {
    dibujando.current = false;
  };

  const borrar = () => {
    const canvas = canvasRef.current;
    canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    setVacio(true);
  };

  const guardar = () => canvasRef.current?.toBlob((png) => png && onSave(png), 'image/png');

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        aria-label="Recuadro para dibujar la firma"
        className="h-40 w-full cursor-crosshair touch-none rounded-lg border-2 border-dashed border-gray-300 bg-white"
        onPointerDown={empezar}
        onPointerMove={trazar}
        onPointerUp={terminar}
        onPointerCancel={terminar}
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={borrar} disabled={vacio}>
          <Eraser className="mr-2 h-3 w-3" /> Borrar
        </Button>
        <Button type="button" size="sm" onClick={guardar} disabled={vacio || saving}>
          <Save className="mr-2 h-3 w-3" /> {saving ? 'Guardando...' : 'Guardar firma'}
        </Button>
      </div>
    </div>
  );
}
