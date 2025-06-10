'use client';

import { useRef, useEffect } from 'react';
import MatrixEffect, { MatrixEffectRef } from './MatrixEffect';
import { useMatrix } from '@/contexts/MatrixContext';

export default function MatrixEffectWrapper() {
  const matrixRef = useRef<MatrixEffectRef>(null);
  const { setMatrixRef } = useMatrix();

  useEffect(() => {
    setMatrixRef(matrixRef.current);
    
    return () => {
      setMatrixRef(null);
    };
  }, [setMatrixRef]);

  return <MatrixEffect ref={matrixRef} />;
}