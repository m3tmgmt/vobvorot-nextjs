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
  const animationFrame = useRef<number | undefined>(undefined);
  const lastHoverTime = useRef<number>(0);

  useEffect(() => {
    // Инициализация трейлов
    trails.current = Array.from({ length: 5 }, () => ({
      x: 0,
      y: 0,
      opacity: 0
    }));

    // Показать курсор сразу при загрузке
    const showCursorOnLoad = () => {
      // Добавляем класс для прогрессивного скрытия браузерного курсора
      document.body.classList.add('custom-cursor-ready');
      
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
        // Используем transform для лучшей производительности
        cursorRef.current.style.transform = `translate3d(${e.clientX - 10}px, ${e.clientY - 10}px, 0)`;
        cursorRef.current.style.display = 'block';
      }
      
      // Показать трейлы при первом движении мыши
      trailsRef.current.forEach(trail => {
        if (trail) trail.style.display = 'block';
      });
    };

    const updateTrails = () => {
      if (!cursorRef.current) return;
      
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
          // Используем transform вместо left/top для лучшей производительности
          trailElement.style.transform = `translate3d(${trail.x - 3}px, ${trail.y - 3}px, 0)`;
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
      if (!cursorRef.current) return;
      
      // Throttling для производительности
      const now = Date.now();
      if (now - lastHoverTime.current < 16) return; // ~60fps
      lastHoverTime.current = now;
      
      const target = e.target as HTMLElement;
      
      // Проверяем, не находимся ли мы в навигационном меню
      const isInNavigation = target.closest('.navigation') || target.closest('.nav-toggle') || target.closest('.nav-close');
      
      if (isInNavigation) {
        // В навигации уменьшаем воздействие кастомного курсора
        cursorRef.current.style.opacity = '0.3';
        cursorRef.current.style.pointerEvents = 'none';
        return;
      } else {
        cursorRef.current.style.opacity = '1';
        cursorRef.current.style.pointerEvents = 'none';
      }
      
      const isClickable = target.tagName === 'BUTTON' || 
                         target.tagName === 'A' || 
                         target.closest('button') || 
                         target.closest('a') ||
                         target.hasAttribute('onclick') ||
                         target.style.cursor === 'pointer';
      
      // Получаем текущую позицию
      const currentTransform = cursorRef.current.style.transform;
      const translateMatch = currentTransform.match(/translate3d\([^)]+\)/);
      const translatePart = translateMatch ? translateMatch[0] : 'translate3d(0px, 0px, 0px)';
      
      if (isClickable) {
        cursorRef.current.style.transform = `${translatePart} scale(1.5)`;
      } else {
        cursorRef.current.style.transform = `${translatePart} scale(1)`;
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
          cursorRef.current.style.transform = `translate3d(${window.innerWidth / 2 - 10}px, ${window.innerHeight / 2 - 10}px, 0)`;
        }
      }, 100);
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseenter', handleMouseEnter);
      document.addEventListener('mouseleave', handleMouseLeave);
      document.addEventListener('mouseover', handleElementHover);
      updateTrails();
    }

    return () => {
      // Убираем класс при размонтировании
      document.body.classList.remove('custom-cursor-ready');
      
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
          left: 0,
          top: 0,
          width: '20px',
          height: '20px',
          background: 'linear-gradient(45deg, var(--pink-main), var(--cyan-accent))',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 'var(--z-cursor)' as any,
          transition: 'opacity 0.2s ease',
          mixBlendMode: 'difference',
          display: 'block',
          willChange: 'transform'
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
            left: 0,
            top: 0,
            width: '6px',
            height: '6px',
            background: 'var(--pink-neon)',
            borderRadius: '50%',
            pointerEvents: 'none',
            zIndex: 'var(--z-cursor-trail)' as any,
            opacity: 0.7,
            display: 'block',
            willChange: 'transform'
          }}
        />
      ))}
    </>
  );
}