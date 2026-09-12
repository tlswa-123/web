import type { ReactNode } from "react";
import { usePreload } from "../hooks/use-preload";
import { assetPath } from "../lib/asset-path";

const ASSETS = [
  assetPath("parallax/sky.webp"),
  assetPath("parallax/mtn.webp"),
  assetPath("parallax/trees.webp"),
  assetPath("parallax/sun.webp"),
  assetPath("loading-birds.png"),
];

/**
 * 首屏预加载：折纸小鸟环绕旋转 + 中间 Loading... 字样
 * 加载完成后淡出。
 */
export function Preloader({ children }: { children: ReactNode }) {
  const { done } = usePreload(ASSETS);

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-white transition-opacity duration-700"
        style={{
          opacity: done ? 0 : 1,
          pointerEvents: done ? "none" : "auto",
        }}
      >
        {/* 旋转的小鸟圈 */}
        <div className="relative flex items-center justify-center">
          <img
            src={assetPath("loading-birds.png")}
            alt=""
            className="h-[280px] w-[280px] animate-[spin_4s_linear_infinite] object-contain md:h-[360px] md:w-[360px]"
          />
          {/* 中间 Loading 文字 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm tracking-[0.3em] text-[#333] font-medium">
              Loading...
            </span>
          </div>
        </div>
      </div>
      {children}
    </>
  );
}
