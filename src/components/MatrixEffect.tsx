'use client';

import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

interface MatrixColumn {
  x: number;
  y: number;
  speed: number;
  chars: string[];
  maxLength: number;
  opacity: number[];
  startTime: number;
  isVisible: boolean;
}

export interface MatrixEffectRef {
  activate: (duration?: number) => void;
  deactivate: () => void;
}

const MatrixEffect = forwardRef<MatrixEffectRef>((props, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrame = useRef<number>();
  const isActive = useRef<boolean>(false);
  const columns = useRef<MatrixColumn[]>([]);
  const deactivateTimer = useRef<NodeJS.Timeout>();
  const fadeTimer = useRef<NodeJS.Timeout>();
  const globalOpacity = useRef<number>(0);
  const isActivating = useRef<boolean>(false);
  const isDeactivating = useRef<boolean>(false);

  // Matrix символы: катакана, хирагана, цифры, английские буквы
  const matrixChars = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンあいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  const playActivationSound = () => {
    try {
      // Создаем простой звук активации с Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Быстрый sweep звук
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.3);
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      // Игнорируем ошибки аудио на старых браузерах
      console.log('Audio not supported');
    }
  };

  const fadeIn = () => {
    isActivating.current = true;
    isDeactivating.current = false;
    globalOpacity.current = 0;
    
    // Проигрываем звук активации
    playActivationSound();
    
    const startTime = Date.now();
    const fadeDuration = 1000; // 1 секунда на появление
    
    const fadeStep = () => {
      if (!isActivating.current) return;
      
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / fadeDuration, 1);
      
      // Ease-in-out функция
      globalOpacity.current = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      
      if (progress < 1) {
        fadeTimer.current = setTimeout(fadeStep, 16); // ~60fps
      } else {
        isActivating.current = false;
        globalOpacity.current = 1;
      }
    };
    
    fadeStep();
  };
  
  const playDeactivationSound = () => {
    try {
      // Создаем звук деактивации - обратный sweep
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Медленный sweep вниз
      oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.8);
      
      gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.8);
    } catch (error) {
      console.log('Audio not supported');
    }
  };

  const fadeOut = () => {
    isDeactivating.current = true;
    isActivating.current = false;
    
    // Проигрываем звук деактивации
    playDeactivationSound();
    
    // Останавливаем появление новых колонок
    columns.current.forEach(column => {
      column.isVisible = true; // Все видимые колонки остаются видимыми
      // Ускоряем их движение вниз
      column.speed = Math.max(column.speed * 1.5, 3); // Минимум 3px/frame
    });
    
    // Проверяем каждые 100ms, ушли ли все колонки за экран
    const checkColumnsGone = () => {
      if (!isDeactivating.current) return;
      
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const allColumnsGone = columns.current.every(column => {
        const columnBottom = column.y;
        return columnBottom > canvas.height + 50; // +50px буфер
      });
      
      if (allColumnsGone) {
        completeDeactivation();
      } else {
        fadeTimer.current = setTimeout(checkColumnsGone, 100);
      }
    };
    
    checkColumnsGone();
  };
  
  const completeDeactivation = () => {
    isDeactivating.current = false;
    isActive.current = false;
    globalOpacity.current = 0;
    
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
    }
    
    // Очищаем canvas
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  useImperativeHandle(ref, () => ({
    activate: (duration = 10000) => {
      if (isActive.current || isActivating.current) return;
      
      // Останавливаем любое текущее исчезновение
      if (isDeactivating.current) {
        isDeactivating.current = false;
        if (fadeTimer.current) {
          clearTimeout(fadeTimer.current);
        }
      }
      
      isActive.current = true;
      initializeColumns();
      animate();
      fadeIn();
      
      // Автоматическое отключение через заданное время (минус время появления)
      if (deactivateTimer.current) {
        clearTimeout(deactivateTimer.current);
      }
      
      deactivateTimer.current = setTimeout(() => {
        fadeOut();
      }, duration - 3000); // Начинаем движение вниз за 3 секунды до конца
    },
    
    deactivate: () => {
      if (!isActive.current && !isActivating.current) return;
      
      // Останавливаем появление если оно идет
      if (isActivating.current) {
        isActivating.current = false;
        if (fadeTimer.current) {
          clearTimeout(fadeTimer.current);
        }
      }
      
      if (deactivateTimer.current) {
        clearTimeout(deactivateTimer.current);
      }
      
      fadeOut();
    }
  }));


  const initializeColumns = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const fontSize = 14;
    const columnCount = Math.floor(canvas.width / fontSize);
    
    columns.current = [];
    
    for (let i = 0; i < columnCount; i++) {
      const maxLength = Math.floor(Math.random() * 15) + 5; // 5-20 символов
      const startDelay = Math.random() * 2000; // Задержка появления до 2 секунд
      
      columns.current.push({
        x: i * fontSize,
        y: Math.random() * canvas.height - canvas.height, // Начинаем выше экрана
        speed: Math.random() * 2 + 1, // 1-3 пикселя за кадр
        chars: [],
        maxLength: maxLength,
        opacity: [],
        startTime: Date.now() + startDelay, // Время начала для этой колонки
        isVisible: false
      });
      
      // Заполняем колонку символами
      for (let j = 0; j < maxLength; j++) {
        columns.current[i].chars.push(
          matrixChars[Math.floor(Math.random() * matrixChars.length)]
        );
        columns.current[i].opacity.push(Math.max(0, 1 - (j / maxLength) * 0.8));
      }
    }
  };

  const animate = () => {
    if (!isActive.current && !isDeactivating.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    if (!ctx || !canvas) return;

    // Затемнение предыдущего кадра для эффекта следа
    const trailOpacity = 0.1;
    ctx.fillStyle = `rgba(0, 0, 0, ${trailOpacity})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = '14px JetBrains Mono, monospace';
    
    columns.current.forEach(column => {
      const currentTime = Date.now();
      
      // Проверяем, должна ли колонка уже быть видимой
      if (!column.isVisible && currentTime >= column.startTime) {
        column.isVisible = true;
      }
      
      // Рисуем только видимые колонки
      if (column.isVisible) {
        // Рисуем символы в колонке
        column.chars.forEach((char, index) => {
          const y = column.y - (index * 16);
          
          if (y > -20 && y < canvas.height + 50) { // Увеличиваем видимость внизу
            // Цвет с прозрачностью
            const opacity = column.opacity[index];
            const isHead = index === 0;
            
            if (isHead) {
              // Голова колонки - ярко-белая
              ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
            } else {
              // Остальные символы - зеленые
              ctx.fillStyle = `rgba(57, 255, 20, ${opacity * 0.8})`;
            }
            
            ctx.fillText(char, column.x, y);
          }
        });
        
        // Обновляем позицию колонки
        column.y += column.speed;
      
        // Если колонка ушла за экран, перезапускаем её сверху (только если не деактивируемся)
        if (column.y - (column.chars.length * 16) > canvas.height && !isDeactivating.current) {
          column.y = -column.chars.length * 16;
          column.speed = Math.random() * 2 + 1;
          
          // Обновляем символы
          for (let i = 0; i < column.chars.length; i++) {
            if (Math.random() < 0.1) { // 10% шанс смены символа
              column.chars[i] = matrixChars[Math.floor(Math.random() * matrixChars.length)];
            }
          }
        }
        
        // Случайное изменение символов
        if (Math.random() < 0.02) { // 2% шанс
          const randomIndex = Math.floor(Math.random() * column.chars.length);
          column.chars[randomIndex] = matrixChars[Math.floor(Math.random() * matrixChars.length)];
        }
      }
    });

    animationFrame.current = requestAnimationFrame(animate);
  };

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    if (isActive.current) {
      initializeColumns();
    }
  };

  useEffect(() => {
    resizeCanvas();
    
    const handleResize = () => {
      resizeCanvas();
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
      if (deactivateTimer.current) {
        clearTimeout(deactivateTimer.current);
      }
      if (fadeTimer.current) {
        clearTimeout(fadeTimer.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="matrix-effect"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.6,
        mixBlendMode: 'screen'
      }}
    />
  );
});

MatrixEffect.displayName = 'MatrixEffect';

export default MatrixEffect;