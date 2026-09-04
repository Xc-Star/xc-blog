"use client";

import { useEffect, useState } from 'react';

// 更新萤火虫的数据结构，增加独立的移动动画属性
interface Firefly {
  id: number;
  top: string;
  left: string;
  size: number;
  breatheDuration: number; // 呼吸闪烁的周期
  breatheDelay: number;
  floatDuration: number;   // 缓慢飞行的周期
  floatDelay: number;
  floatPath: string;       // 随机分配飞行轨迹
}

export default function Fireflies() {
  const [flies, setFlies] = useState<Firefly[]>([]);

  useEffect(() => {
    const generated: Firefly[] = Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      // 初始出生点
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: 3 + Math.random() * 4,

      // 呼吸闪烁：较快，3 到 8 秒一个来回
      breatheDuration: 3 + Math.random() * 5,
      breatheDelay: Math.random() * -10,

      // 飞行移动：极其缓慢，15 到 35 秒一个来回，营造漫游感
      floatDuration: 15 + Math.random() * 20,
      floatDelay: Math.random() * -20,

      // 随机分配 4 种不同的飞行轨迹，避免大家往同一个方向飞
      floatPath: `float${Math.floor(Math.random() * 4) + 1}`,
    }));
    setFlies(generated);
  }, []);

  return (
    <div className="fx-layer fixed inset-0 w-full h-full pointer-events-none z-10 overflow-hidden mix-blend-screen">

      {/* 动画引擎 */}
      <style>{`
        /* 呼吸闪烁：用独立的 scale 属性，才能和下面的 translate 动画共存于同一元素 */
        @keyframes fireflyBreathe {
          0%, 100% { 
            opacity: 0; 
            scale: 0.3;
          }
          50% { 
            opacity: 1; 
            scale: 1.2; 
          }
        }

        /* 四种不同的大范围随机漂浮轨迹 (利用 vw 和 vh 跨越屏幕) */
        @keyframes float1 {
          0%, 100% { translate: 0 0; }
          33% { translate: 10vw -15vh; }
          66% { translate: -5vw -20vh; }
        }
        @keyframes float2 {
          0%, 100% { translate: 0 0; }
          33% { translate: -12vw 10vh; }
          66% { translate: 8vw 15vh; }
        }
        @keyframes float3 {
          0%, 100% { translate: 0 0; }
          33% { translate: 15vw 15vh; }
          66% { translate: -10vw 5vh; }
        }
        @keyframes float4 {
          0%, 100% { translate: 0 0; }
          33% { translate: -15vw -10vh; }
          66% { translate: 10vw -15vh; }
        }
      `}</style>

      {flies.map(fly => (
        // 漫游与呼吸合并到同一个元素上：translate 走轨迹，scale/opacity 管呼吸，互不冲突
        <div
          key={fly.id}
          className="absolute rounded-full"
          style={{
            top: fly.top,
            left: fly.left,
            width: `${fly.size}px`,
            height: `${fly.size}px`,
            backgroundColor: 'rgba(200, 255, 200, 0.9)',
            boxShadow: '0 0 10px 3px rgba(100, 255, 150, 0.8), 0 0 20px 6px rgba(50, 255, 100, 0.4)',
            animation: `${fly.floatPath} ${fly.floatDuration}s ease-in-out infinite, fireflyBreathe ${fly.breatheDuration}s ease-in-out infinite`,
            animationDelay: `${fly.floatDelay}s, ${fly.breatheDelay}s`,
          }}
        ></div>
      ))}
    </div>
  );
}