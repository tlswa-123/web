import { useEffect, useRef } from "react";

/**
 * 全局鼠标视差：指针事件只记录目标位置，真正的缓动和样式写入都在
 * 同一个 rAF 中完成。时间相关的阻尼让 60Hz / 120Hz 屏幕上的手感一致。
 *
 * 输出 --mx / --my（-1~1），由场景中的各个景深层自行决定移动量；
 * 同时输出 --light-x / --light-y（0~100%）给背景聚光效果使用。
 */
export function useMouseParallax<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // React controls the outer background's `style` prop (opacity/camera state).
    // Keep spotlight variables on the spotlight node itself so a camera rerender
    // can never clear the light's position or visibility.
    const lightEl = el.querySelector<HTMLElement>(".scene-pointer-light") ?? el;
    const lightPassEl = el.querySelector<HTMLElement>(".scene-light-pass");

    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const target = { x: 0, y: 0 };
    const smooth = { x: 0, y: 0 };
    // 光照使用真实的视口坐标（百分比），不要把光斑限制在屏幕中央附近。
    // 这样背景光会准确跟随指针，而景深层仍然使用 -1~1 的视差坐标。
    const lightTarget = { x: 50, y: 50 };
    const lightSmooth = { x: 50, y: 50 };
    let lastWrittenX: number | null = null;
    let lastWrittenY: number | null = null;
    let lastLightX: number | null = null;
    let lastLightY: number | null = null;
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
      const lightX = Math.round(lightSmooth.x * 10) / 10;
      const lightY = Math.round(lightSmooth.y * 10) / 10;
      if (lightX !== lastLightX) {
        lightEl.style.setProperty("--light-x", `${lightX}%`);
        lightPassEl?.style.setProperty("--light-x", `${lightX}%`);
        lastLightX = lightX;
      }
      if (lightY !== lastLightY) {
        lightEl.style.setProperty("--light-y", `${lightY}%`);
        lightPassEl?.style.setProperty("--light-y", `${lightY}%`);
        lastLightY = lightY;
      }
    };

    const tick = (now: number) => {
      const dt = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 1 / 60;
      lastTime = now;

      // 对应参考交互约 0.055 / frame 的柔和追随，但对刷新率无依赖。
      const ease = 1 - Math.pow(0.945, dt * 60);
      smooth.x += (target.x - smooth.x) * ease;
      smooth.y += (target.y - smooth.y) * ease;
      lightSmooth.x += (lightTarget.x - lightSmooth.x) * ease;
      lightSmooth.y += (lightTarget.y - lightSmooth.y) * ease;
      write(smooth.x, smooth.y);

      if (
        Math.abs(target.x - smooth.x) < 0.0005 &&
        Math.abs(target.y - smooth.y) < 0.0005 &&
        Math.abs(lightTarget.x - lightSmooth.x) < 0.02 &&
        Math.abs(lightTarget.y - lightSmooth.y) < 0.02
      ) {
        smooth.x = target.x;
        smooth.y = target.y;
        lightSmooth.x = lightTarget.x;
        lightSmooth.y = lightTarget.y;
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
      lightEl.style.setProperty("--light-opacity", "0");
      lightPassEl?.style.setProperty("--light-opacity", "0");
      ensure();
    };

    const onMove = (event: PointerEvent) => {
      if (!enabled() || event.pointerType === "touch") return;
      target.x = Math.max(-1, Math.min(1, (event.clientX / window.innerWidth) * 2 - 1));
      target.y = Math.max(-1, Math.min(1, (event.clientY / window.innerHeight) * 2 - 1));
      lightTarget.x = Math.max(0, Math.min(100, (event.clientX / window.innerWidth) * 100));
      lightTarget.y = Math.max(0, Math.min(100, (event.clientY / window.innerHeight) * 100));
      lightEl.style.setProperty("--light-opacity", "1");
      lightPassEl?.style.setProperty("--light-opacity", "1");
      ensure();
    };

    const onPointerOut = (event: PointerEvent) => {
      if (!event.relatedTarget) reset();
    };

    const onMotionModeChange = () => {
      if (!enabled()) reset();
    };

    write(0, 0);
    lightEl.style.setProperty("--light-opacity", "0");
    lightPassEl?.style.setProperty("--light-opacity", "0");
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
