import { useEffect, useRef } from "react";

/**
 * 全局鼠标视差：指针事件只记录目标位置，真正的缓动和样式写入都在
 * 同一个 rAF 中完成。时间相关的阻尼让 60Hz / 120Hz 屏幕上的手感一致。
 *
 * 输出 --mx / --my（-1~1），由场景中的各个景深层自行决定移动量。
 */
export function useMouseParallax<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const target = { x: 0, y: 0 };
    const smooth = { x: 0, y: 0 };
    let lastWrittenX: number | null = null;
    let lastWrittenY: number | null = null;
    let lastTime = 0;
    let raf = 0;

    const enabled = () => finePointer.matches && !reducedMotion.matches;

    const write = (x: number, y: number) => {
      const roundedX = Math.round(x * 1000) / 1000;
      const roundedY = Math.round(y * 1000) / 1000;
      if (roundedX !== lastWrittenX) {
        el.style.setProperty("--mx", String(roundedX));
        lastWrittenX = roundedX;
      }
      if (roundedY !== lastWrittenY) {
        el.style.setProperty("--my", String(roundedY));
        lastWrittenY = roundedY;
      }
    };

    const tick = (now: number) => {
      const dt = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 1 / 60;
      lastTime = now;

      // 对应参考交互约 0.055 / frame 的柔和追随，但对刷新率无依赖。
      const ease = 1 - Math.pow(0.945, dt * 60);
      smooth.x += (target.x - smooth.x) * ease;
      smooth.y += (target.y - smooth.y) * ease;
      write(smooth.x, smooth.y);

      if (
        Math.abs(target.x - smooth.x) < 0.0005 &&
        Math.abs(target.y - smooth.y) < 0.0005
      ) {
        smooth.x = target.x;
        smooth.y = target.y;
        write(smooth.x, smooth.y);
        raf = 0;
        lastTime = 0;
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    const ensure = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const reset = () => {
      target.x = 0;
      target.y = 0;
      ensure();
    };

    const onMove = (event: PointerEvent) => {
      if (!enabled() || event.pointerType === "touch") return;
      target.x = Math.max(-1, Math.min(1, (event.clientX / window.innerWidth) * 2 - 1));
      target.y = Math.max(-1, Math.min(1, (event.clientY / window.innerHeight) * 2 - 1));
      ensure();
    };

    const onPointerOut = (event: PointerEvent) => {
      if (!event.relatedTarget) reset();
    };

    const onMotionModeChange = () => {
      if (!enabled()) reset();
    };

    write(0, 0);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerout", onPointerOut);
    window.addEventListener("blur", reset);
    finePointer.addEventListener("change", onMotionModeChange);
    reducedMotion.addEventListener("change", onMotionModeChange);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerout", onPointerOut);
      window.removeEventListener("blur", reset);
      finePointer.removeEventListener("change", onMotionModeChange);
      reducedMotion.removeEventListener("change", onMotionModeChange);
      cancelAnimationFrame(raf);
    };
  }, []);

  return ref;
}
