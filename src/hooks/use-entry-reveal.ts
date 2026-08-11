import { useEffect, useState } from "react";
import { useScroll } from "../lib/scroll-context";

/**
 * 入场揭示进度 hook —— 用于内容随"即将进入视口"而渐显的效果
 *
 * 与 useScrollProgress 不同：useScrollProgress 以该元素自身 [0,1] 滚动范围
 * 计算进度（进入该 section 后才开始变化）。而 useEntryReveal 提前感知——
 * 从"视口底部刚接触到该元素顶部"就开始从 0 爬升，到"视口顶部到达该元素顶部"
 * （即该元素刚好铺满整个视口）时刚好到 1。
 *
 * 用途：上一个 section 用 sticky 做退场动效时，最后一帧会在解钉后随文档流
 * 正常滚动，与下一个 section 的开头会有一段（约1屏高）视觉重叠期。让下一个
 * section 的内容用这个 hook 在重叠期内跟上一个 section 的退场动效（如变暗）
 * 同步渐显，而不是在重叠期结束后突然以完全不透明的样子出现。
 */
export function useEntryReveal(ref: React.RefObject<HTMLElement | null>) {
  const scroll = useScroll();
  const [reveal, setReveal] = useState(0);

  useEffect(() => {
    const compute = (scrollTop: number) => {
      const el = ref.current;
      if (!el) return;
      const rectTop = el.offsetTop;
      const vh = window.innerHeight;
      const raw = (scrollTop + vh - rectTop) / vh;
      setReveal(Math.min(1, Math.max(0, raw)));
    };
    return scroll.subscribe(compute);
  }, [ref, scroll]);

  return reveal;
}
