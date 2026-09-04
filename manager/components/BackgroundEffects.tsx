"use client";
import { useEffect, useState } from 'react';
import { useTheme } from './ThemeProvider';
import Fireflies from './Fireflies';
import Sakura from './Sakura';
import WindyGrass from './WindyGrass';

export default function BackgroundEffects() {
  const { isDark } = useTheme();
  // 等 1s 淡出跑完再让隐藏的那一组停机，过渡期间画面不会凝固
  const [dormant, setDormant] = useState<'fireflies' | 'sakura' | null>(null);

  useEffect(() => {
    setDormant(null);
    const timer = setTimeout(() => setDormant(isDark ? 'sakura' : 'fireflies'), 1100);
    return () => clearTimeout(timer);
  }, [isDark]);

  // 与当前主题双重校验，确保停机标记永远只落在不可见的那一组上
  const firefliesDormant = !isDark && dormant === 'fireflies';
  const sakuraDormant = isDark && dormant === 'sakura';

  return (
    <>
      {/* 核心魔法：根据 isDark 切换特效组件 */}
      <div className={`transition-opacity duration-1000 ${isDark ? 'opacity-100' : 'opacity-0'} ${firefliesDormant ? 'fx-dormant' : ''}`}>
        <Fireflies />
      </div>
      <div className={`transition-opacity duration-1000 ${isDark ? 'opacity-0' : 'opacity-100'} ${sakuraDormant ? 'fx-dormant' : ''}`}>
        <Sakura />
      </div>

      {/* 草地一直存在，但它内部会自动改变颜色 */}
      <WindyGrass />
    </>
  );
}