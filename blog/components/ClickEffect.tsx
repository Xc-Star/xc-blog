"use client";
import { useEffect, useRef } from 'react';

export default function ClickEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const ripples: Ripple[] = [];
    let rafId = 0;
    let cssW = 0;
    let cssH = 0;

    const resize = () => {
      // 上限 2 倍像素比：高分屏下不至于为一层装饰画布吞掉成倍的填充率
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cssW = window.innerWidth;
      cssH = window.innerHeight;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    window.addEventListener('resize', resize);
    resize();

    class Ripple {
      x: number; y: number;
      r: number;        // 半径
      opacity: number;  // 透明度
      velocity: number; // 扩散速度

      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.r = 0;
        this.opacity = 0.6;
        this.velocity = 2.5;
      }

      update() {
        this.r += this.velocity;
        // 随着半径变大，扩散速度减慢（物理模拟）
        this.velocity *= 0.96;
        // 透明度线性衰减
        this.opacity -= 0.015;
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        // 使用你主题里的靛蓝色，并带上动态透明度
        ctx.strokeStyle = `rgba(129, 140, 248, ${this.opacity})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        // 内部再加一个极淡的实心圆，增加“触碰感”
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(129, 140, 248, ${this.opacity * 0.3})`;
        ctx.fill();
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, cssW, cssH);

      // 增加全局模糊，让涟漪更有“云端”质感
      ctx.shadowBlur = 15;
      ctx.shadowColor = 'rgba(129, 140, 248, 0.5)';

      for (let i = ripples.length - 1; i >= 0; i--) {
        ripples[i].update();
        ripples[i].draw();
        if (ripples[i].opacity <= 0) ripples.splice(i, 1);
      }

      // 涟漪散完就停机，不再逐帧空转清全屏
      rafId = ripples.length > 0 ? requestAnimationFrame(animate) : 0;
    };

    const handleClick = (e: MouseEvent) => {
      ripples.push(new Ripple(e.clientX, e.clientY));
      if (!rafId) rafId = requestAnimationFrame(animate);
    };

    window.addEventListener('click', handleClick, { passive: true });

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('click', handleClick);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
    />
  );
}