import { useEffect, useState } from "react";
import { useScroll } from "../lib/scroll-context";

/**
 * 归一化进度 hook —— 整站动效的通用底座
 * 传入一个 ref（通常是 h-[Nsvh] 的高 section），
 * 返回该元素滚过视口的进度 0~1。
 *
 * 计算：progress = (scrollTop - elTop) / (elHeight - viewportH)
 * 对应 komato3 里在 4 个组件重复写的逻辑，这里抽成单一来源。
 */
export function useScrollProgress(ref: React.RefObject<HTMLElement | null>) {
  const scroll = useScroll();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const compute = (scrollTop: number) => {
      const el = ref.current;
      if (!el) return;
      // offsetTop is relative to the nearest positioned ancestor (the
      // experience cards wrapper is one such nested element), so it can be
      // zero even when the element starts far down the document. Resolve the
      // actual document position from its viewport rect instead.
      const rectTop = el.getBoundingClientRect().top + scrollTop;
      const range = el.offsetHeight - window.innerHeight;
      const p = range > 0 ? (scrollTop - rectTop) / range : 0;
      const clamped = Math.min(1, Math.max(0, p));
      setProgress(clamped);
    };
    return scroll.subscribe(compute);
  }, [ref, scroll]);

  return progress;
}
