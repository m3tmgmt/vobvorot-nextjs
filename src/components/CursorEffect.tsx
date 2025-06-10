'use client';

import { useEffect, useRef } from 'react';

interface Trail {
  x: number;
  y: number;
  opacity: number;
}

export default function CursorEffect() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const trailsRef = useRef<HTMLDivElement[]>([]);
  const mousePos = useRef({ x: 0, y: 0 });
  const trails = useRef<Trail[]>([]);
  const animationFrame = useRef<number>();

  useEffect(() => {
    // Инициализация трейлов
    trails.current = Array.from({ length: 5 }, () => ({
      x: 0,
      y: 0,
      opacity: 0
    }));

    // Показать курсор сразу при загрузке
    const showCursorOnLoad = () => {
      if (cursorRef.current) {
        cursorRef.current.style.display = 'block';
      }
      trailsRef.current.forEach(trail => {
        if (trail) trail.style.display = 'block';
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      
      if (cursorRef.current) {
        cursorRef.current.style.left = `${e.clientX - 10}px`;
        cursorRef.current.style.top = `${e.clientY - 10}px`;
        cursorRef.current.style.display = 'block';
      }
      
      // Показать трейлы при первом движении мыши
      trailsRef.current.forEach(trail => {
        if (trail) trail.style.display = 'block';
      });
    };

    const updateTrails = () => {
      trails.current.forEach((trail, index) => {
        const targetX = mousePos.current.x;
        const targetY = mousePos.current.y;
        
        // Плавное следование за курсором с задержкой
        const ease = 0.15 - (index * 0.02);
        trail.x += (targetX - trail.x) * ease;
        trail.y += (targetY - trail.y) * ease;
        trail.opacity = Math.max(0, 0.8 - (index * 0.15));

        const trailElement = trailsRef.current[index];
        if (trailElement) {
          trailElement.style.left = `${trail.x - 3}px`;
          trailElement.style.top = `${trail.y - 3}px`;
          trailElement.style.opacity = trail.opacity.toString();
        }
      });

      animationFrame.current = requestAnimationFrame(updateTrails);
    };

    const handleMouseEnter = () => {
      if (cursorRef.current) {
        cursorRef.current.style.display = 'block';
      }
      trailsRef.current.forEach(trail => {
        if (trail) trail.style.display = 'block';
      });
    };

    const handleMouseLeave = () => {
      if (cursorRef.current) {
        cursorRef.current.style.display = 'none';
      }
      trailsRef.current.forEach(trail => {
        if (trail) trail.style.display = 'none';
      });
    };

    const handleElementHover = (e: MouseEvent) => {
      if (cursorRef.current) {
        const target = e.target as HTMLElement;
        const isClickable = target.tagName === 'BUTTON' || 
                           target.tagName === 'A' || 
                           target.closest('button') || 
                           target.closest('a') ||
                           target.hasAttribute('onclick') ||
                           target.style.cursor === 'pointer';
        
        if (isClickable) {
          cursorRef.current.style.transform = 'scale(1.5)';
        } else {
          cursorRef.current.style.transform = 'scale(1)';
        }
      }
    };

    // Проверка на мобильные устройства
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (!isMobile) {
      // Показать курсор сразу
      setTimeout(() => {
        showCursorOnLoad();
        
        // Установить начальную позицию в центр экрана
        mousePos.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        if (cursorRef.current) {
          cursorRef.current.style.left = `${window.innerWidth / 2 - 10}px`;
          cursorRef.current.style.top = `${window.innerHeight / 2 - 10}px`;
        }
      }, 100);
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseenter', handleMouseEnter);
      document.addEventListener('mouseleave', handleMouseLeave);
      document.addEventListener('mouseover', handleElementHover);
      updateTrails();
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseover', handleElementHover);
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, []);

  return (
    <>
      {/* Основной курсор */}
      <div
        ref={cursorRef}
        className="cursor-main"
        style={{
          position: 'fixed',
          width: '20px',
          height: '20px',
          background: 'linear-gradient(45deg, var(--pink-main), var(--cyan-accent))',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 9999,
          transition: 'transform 0.2s ease',
          mixBlendMode: 'difference',
          display: 'block'
        }}
      />
      
      {/* Трейловые точки */}
      {[...Array(5)].map((_, index) => (
        <div
          key={index}
          ref={(el) => {
            if (el) trailsRef.current[index] = el;
          }}
          className="cursor-trail"
          style={{
            position: 'fixed',
            width: '6px',
            height: '6px',
            background: 'var(--pink-neon)',
            borderRadius: '50%',
            pointerEvents: 'none',
            zIndex: 9998,
            opacity: 0.7,
            display: 'block'
          }}
        />
      ))}
    </>
  );
}