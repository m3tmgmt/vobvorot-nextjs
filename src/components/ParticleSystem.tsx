'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
  life: number;
  maxLife: number;
}

export default function ParticleSystem() {
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrame = useRef<number | undefined>(undefined);
  const lastTime = useRef<number>(0);
  const particleCounter = useRef<number>(0);

  useEffect(() => {
    let mounted = true;

    const createParticle = (): Particle => {
      return {
        id: particleCounter.current++,
        x: Math.random() * window.innerWidth,
        y: window.innerHeight + 10,
        size: Math.random() * 2 + 3, // 3-5px
        opacity: 0,
        speed: Math.random() * 0.5 + 0.3, // 0.3-0.8 pixels per ms
        life: 0,
        maxLife: 6000 + Math.random() * 2000, // 6-8 seconds
      };
    };

    const updateParticles = (currentTime: number) => {
      if (!mounted) return;

      const deltaTime = currentTime - lastTime.current;
      lastTime.current = currentTime;

      // Добавляем новые частицы
      if (Math.random() < 0.3 && particlesRef.current.length < 20) {
        particlesRef.current.push(createParticle());
      }

      // Обновляем существующие частицы
      particlesRef.current = particlesRef.current.filter(particle => {
        particle.life += deltaTime;
        particle.y -= particle.speed * deltaTime;

        // Обновляем прозрачность (fade in/out)
        const progress = particle.life / particle.maxLife;
        if (progress < 0.1) {
          particle.opacity = progress / 0.1; // fade in первые 10%
        } else if (progress > 0.9) {
          particle.opacity = (1 - progress) / 0.1; // fade out последние 10%
        } else {
          particle.opacity = Math.max(0.3, Math.random() * 0.7); // мерцание
        }

        return particle.life < particle.maxLife && particle.y > -20;
      });

      // Обновляем DOM
      if (containerRef.current) {
        // Удаляем старые элементы
        const existingElements = containerRef.current.querySelectorAll('.particle');
        existingElements.forEach(el => {
          const id = parseInt(el.getAttribute('data-id') || '0');
          if (!particlesRef.current.find(p => p.id === id)) {
            el.remove();
          }
        });

        // Добавляем новые элементы
        particlesRef.current.forEach(particle => {
          let element = containerRef.current?.querySelector(`[data-id="${particle.id}"]`) as HTMLDivElement;
          
          if (!element) {
            element = document.createElement('div');
            element.className = 'particle';
            element.setAttribute('data-id', particle.id.toString());
            element.style.position = 'absolute';
            element.style.borderRadius = '50%';
            element.style.pointerEvents = 'none';
            element.style.background = 'var(--pink-main)';
            element.style.boxShadow = '0 0 6px var(--pink-main)';
            containerRef.current?.appendChild(element);
          }

          // Обновляем позицию и стили
          element.style.left = `${particle.x}px`;
          element.style.top = `${particle.y}px`;
          element.style.width = `${particle.size}px`;
          element.style.height = `${particle.size}px`;
          element.style.opacity = particle.opacity.toString();
          element.style.transform = `translate(-50%, -50%) scale(${0.5 + particle.opacity * 0.5})`;
        });
      }

      animationFrame.current = requestAnimationFrame(updateParticles);
    };

    // Проверка на мобильные устройства - меньше частиц
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (!isMobile) {
      lastTime.current = performance.now();
      animationFrame.current = requestAnimationFrame(updateParticles);
    }

    return () => {
      mounted = false;
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="particle-system"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
        overflow: 'hidden'
      }}
    />
  );
}