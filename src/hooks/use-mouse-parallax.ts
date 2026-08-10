import { useEffect, useRef } from "react";

/**
 * 鼠标视差 hook
 * 返回一个 ref 回调容器，内部用 rAF 平滑鼠标位置到 CSS 变量 --mx / --my（范围 -1~1）。
 * 各图层用 translate(calc(var(--mx) * 深度)) 读取，深度越大挪动越明显。
 * 用 CSS 变量而非 React state，避免每帧 setState 重渲染。
 */
export function useMouseParallax<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const raf = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      // 归一化到 -1 ~ 1，以视口中心为原点
      target.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      target.current.y = (e.clientY / window.innerHeight) * 2 - 1;
      ensure();
    };

    const tick = () => {
      const dx = target.current.x - current.current.x;
      const dy = target.current.y - current.current.y;
      current.current.x += dx * 0.08;
      current.current.y += dy * 0.08;
      el.style.setProperty("--mx", current.current.x.toFixed(4));
      el.style.setProperty("--my", current.current.y.toFixed(4));
      if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) {
        raf.current = 0;
        return;
      }
      raf.current = requestAnimationFrame(tick);
    };

    const ensure = () => {
      if (!raf.current) raf.current = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return ref;
}
