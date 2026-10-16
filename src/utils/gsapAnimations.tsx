import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';

/**
 * Conteo numérico fluido estilo GSAP (enteros o decimales)
 */
interface AnimatedNumberProps {
  value: number | string;
  decimals?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  decimals = 0,
  duration = 0.9,
  prefix = '',
  suffix = '',
  className = ''
}) => {
  const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0;
  const [displayValue, setDisplayValue] = useState(0);
  const targetRef = useRef({ val: 0 });

  useEffect(() => {
    const obj = targetRef.current;
    const tween = gsap.to(obj, {
      val: numericValue,
      duration,
      ease: 'power2.out',
      onUpdate: () => {
        setDisplayValue(obj.val);
      }
    });

    return () => {
      tween.kill();
    };
  }, [numericValue, duration]);

  const formatted = decimals > 0 ? displayValue.toFixed(decimals) : Math.round(displayValue);

  return (
    <span className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
};

/**
 * Barra de progreso animada con GSAP (crece suavemente de 0 al target)
 */
interface AnimatedBarProps {
  targetWidthPercent: number;
  duration?: number;
  className?: string;
  barClassName?: string;
  delay?: number;
}

export const AnimatedBar: React.FC<AnimatedBarProps> = ({
  targetWidthPercent,
  duration = 0.85,
  className = 'w-full h-2.5 rounded-full bg-[#ede6d8] overflow-hidden',
  barClassName = 'h-full rounded-full bg-[#4f46e5]',
  delay = 0.05
}) => {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!barRef.current) return;
    const el = barRef.current;
    gsap.fromTo(
      el,
      { width: '0%' },
      {
        width: `${Math.max(0, Math.min(100, targetWidthPercent))}%`,
        duration,
        delay,
        ease: 'power2.out'
      }
    );
  }, [targetWidthPercent, duration, delay]);

  return (
    <div className={className}>
      <div ref={barRef} className={barClassName} style={{ width: '0%' }} />
    </div>
  );
};

/**
 * Modal Wrapper fluido con animación de apertura Y CIERRE estilo GSAP
 */
interface SmoothModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: (closeWithAnimation: () => void) => React.ReactNode;
  backdropClassName?: string;
  contentClassName?: string;
  zIndex?: number;
}

export const SmoothModal: React.FC<SmoothModalProps> = ({
  isOpen,
  onClose,
  children,
  backdropClassName = 'fixed inset-0 flex items-center justify-center p-3 sm:p-4 bg-[#1c1815]/75 backdrop-blur-md',
  contentClassName = 'relative w-full max-w-lg bg-[#fdfbf7] rounded-3xl shadow-2xl border border-[#ded4c3] text-[#2c2724]',
  zIndex = 9999
}) => {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const backdropRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const isClosingRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      isClosingRef.current = false;
    } else if (shouldRender && !isClosingRef.current) {
      // Si el prop cambia externamente a false, animamos salida
      handleClose();
    }
  }, [isOpen]);

  // Al montarse el modal, animamos entrada suave
  useEffect(() => {
    if (!shouldRender || !backdropRef.current || !cardRef.current) return;

    gsap.killTweensOf([backdropRef.current, cardRef.current]);

    gsap.fromTo(
      backdropRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.32, ease: 'power2.out' }
    );

    gsap.fromTo(
      cardRef.current,
      { opacity: 0, scale: 0.94, y: 16 },
      { opacity: 1, scale: 1, y: 0, duration: 0.38, ease: 'power3.out' }
    );
  }, [shouldRender]);

  const handleClose = () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    if (!backdropRef.current || !cardRef.current) {
      setShouldRender(false);
      onClose();
      return;
    }

    gsap.killTweensOf([backdropRef.current, cardRef.current]);

    gsap.to(cardRef.current, {
      opacity: 0,
      scale: 0.95,
      y: 10,
      duration: 0.22,
      ease: 'power2.in'
    });

    gsap.to(backdropRef.current, {
      opacity: 0,
      duration: 0.25,
      ease: 'power2.in',
      onComplete: () => {
        setShouldRender(false);
        isClosingRef.current = false;
        onClose();
      }
    });
  };

  if (!shouldRender) return null;

  return createPortal(
    <div
      ref={backdropRef}
      style={{ zIndex }}
      className={backdropClassName}
      onClick={handleClose}
    >
      <div
        ref={cardRef}
        className={contentClassName}
        onClick={(e) => e.stopPropagation()}
      >
        {children(handleClose)}
      </div>
    </div>,
    document.body
  );
};
