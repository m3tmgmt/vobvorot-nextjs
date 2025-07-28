'use client';

import { createContext, useContext, useRef, ReactNode } from 'react';
import { MatrixEffectRef } from '@/components/MatrixEffect';

interface MatrixContextType {
  activateMatrix: (duration?: number) => void;
  deactivateMatrix: () => void;
  setMatrixRef: (ref: MatrixEffectRef | null) => void;
}

const MatrixContext = createContext<MatrixContextType | undefined>(undefined);

export function MatrixProvider({ children }: { children: ReactNode }) {
  const matrixRef = useRef<MatrixEffectRef | null>(null);

  const activateMatrix = (duration = 10000) => {
    if (matrixRef.current) {
      matrixRef.current.activate(duration);
    }
  };

  const deactivateMatrix = () => {
    if (matrixRef.current) {
      matrixRef.current.deactivate();
    }
  };

  const setMatrixRef = (ref: MatrixEffectRef | null) => {
    matrixRef.current = ref;
  };

  return (
    <MatrixContext.Provider
      value={{
        activateMatrix,
        deactivateMatrix,
        setMatrixRef,
      }}
    >
      {children}
    </MatrixContext.Provider>
  );
}

export function useMatrix() {
  const context = useContext(MatrixContext);
  if (context === undefined) {
    throw new Error('useMatrix must be used within a MatrixProvider');
  }
  return context;
}