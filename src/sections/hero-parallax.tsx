import { useRef } from "react";
import { useScrollProgress } from "../hooks/use-scroll-progress";

/**
 * 首页 Hero —— 文案 + 滚动提示
 *
 * 【重要】背景已迁移到全局唯一的 GlobalBackground 组件（fixed定位，挂载
 * 在 App 顶层）。这里只负责文案的淡入淡出，不再渲染任何场景图层。
 * section 本身仍然保留 h-[320svh] 的滚动高度，为 GlobalBackground 提供
 * "首页阶段"的滚动距离依据（use-global-camera.ts 会读取 #hero 的位置和高度）。
 */
export function HeroParallax() {
  const sectionRef = useRef<HTMLElement>(null);
  const progress = useScrollProgress(sectionRef);

  const textOp = 1 - Math.min(1, progress * 2.5);

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative z-10 h-[320svh]"
    >
      <div className="sticky top-0 h-svh w-full overflow-hidden">
        {/* 首页文案：放在右上角纯色天空区域，不居中 */}
        <div
          className="absolute right-6 top-24 z-10 max-w-xs text-right md:right-16 md:top-32 md:max-w-sm"
          style={{ opacity: textOp }}
        >
          <p className="mb-3 text-sm tracking-[0.4em] text-white/85 uppercase drop-shadow">
            Portfolio
          </p>
          <h1 className="text-5xl font-semibold text-white drop-shadow-lg md:text-7xl">
            金玺
          </h1>
          <p className="mt-4 text-white/90 drop-shadow md:text-lg">
            产品策划 · 在腾讯做AI 产品，也从零搭过自己的创业项目
          </p>
        </div>

        {/* 滚动提示 */}
        <div
          className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-white/80"
          style={{ opacity: 1 - Math.min(1, progress * 3) }}
        >
          <span className="text-xs tracking-[0.3em]">SCROLL</span>
        </div>
      </div>
    </section>
  );
}
