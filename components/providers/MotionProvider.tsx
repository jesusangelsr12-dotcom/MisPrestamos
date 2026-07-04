"use client";

import { LazyMotion, domAnimation } from "framer-motion";

// Carga sólo el subconjunto de animaciones/gestos que la app usa (fades, slides,
// whileTap) en lugar del runtime completo de framer-motion. Combinado con el
// componente `m`, recorta el JS de primera carga de cada ruta. `strict` obliga a
// usar `m` y falla si queda algún `motion` sin migrar.
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}
