import { useEffect, useRef } from "react";

type DockItem = {
  el: HTMLElement;
  width: number;
  height: number;
  value: number;
  velocity: number;
  target: number;
  angle: number;
  targetAngle: number;
  brightness: number;
  targetBrightness: number;
  focused: boolean;
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const smoothstep = (value: number) => value * value * (3 - 2 * value);

/**
 * 导航的距离感应交互：鼠标事件只记录坐标，尺寸读取、弹簧和高光均在
 * 一个动画帧里计算，避免指针移动时反复触发布局。
 */
export function useProximityNav<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const items: DockItem[] = Array.from(
      root.querySelectorAll<HTMLElement>("[data-nav-proximity]")
    ).map((el) => ({
      el,
      width: 0,
      height: 0,
      value: 0,
      velocity: 0,
      target: 0,
      angle: 2.4,
      targetAngle: 2.4,
      brightness: 0,
      targetBrightness: 0,
      focused: false,
    }));

    let aimX = 0;
    let aimY = 0;
    let aimSeen = false;
    let aimMoved = false;
    let keyboardOwnsDock = false;
    let dirty = true;
    let raf = 0;
    let lastTime = 0;

    const enabled = () => finePointer.matches && !reducedMotion.matches;
    const unit = () => Math.max(0.82, Math.min(1.08, window.innerWidth / 1440));

    const clearItemStyles = (item: DockItem) => {
      item.el.style.removeProperty("width");
      item.el.style.removeProperty("height");
      item.el.style.removeProperty("transform");
      item.el.style.setProperty("--spec-bright", "0");
      item.el.dataset.near = "false";
    };

    const measure = () => {
      items.forEach((item) => {
        clearItemStyles(item);
        item.value = 0;
        item.velocity = 0;
        item.target = 0;
      });
      items.forEach((item) => {
        const rect = item.el.getBoundingClientRect();
        item.width = rect.width;
        item.height = rect.height;
      });
      dirty = true;
      ensureFrame();
    };

    const rest = () => {
      items.forEach((item) => {
        item.target = 0;
        item.targetBrightness = item.focused ? 0.9 : 0;
        item.el.dataset.near = "false";
      });
      dirty = true;
      ensureFrame();
    };

    const updatePointerTargets = () => {
      if (!aimSeen || !aimMoved || keyboardOwnsDock) return;
      const rootRect = root.getBoundingClientRect();
      const u = unit();
      const insideCatchArea =
        aimX > rootRect.left - 48 &&
        aimX < rootRect.right + 48 &&
        aimY > rootRect.top - 44 &&
        aimY < rootRect.bottom + 104;

      items.forEach((item) => {
        const rect = item.el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;

        if (insideCatchArea) {
          const proximity = clamp01(1 - Math.abs(aimX - cx) / (128 * u));
          item.target = smoothstep(proximity);
        } else {
          item.target = 0;
        }
        item.el.dataset.near = item.target > 0.08 ? "true" : "false";

        const dx = Math.max(rect.left - aimX, 0, aimX - rect.right);
        const dy = Math.max(rect.top - aimY, 0, aimY - rect.bottom);
        const distance = Math.hypot(dx, dy);
        item.targetAngle =
          distance === 0
            ? Math.atan2(2 / Math.max(rect.height, 1), -2 / Math.max(rect.width, 1)) +
              ((aimX - cx) / Math.max(rect.width / 2, 1)) * 0.3 +
              ((cy - aimY) / Math.max(rect.height / 2, 1)) * 0.15
            : Math.atan2(cy - aimY, aimX - cx);
        const light = clamp01(1 - distance / (180 * u));
        item.targetBrightness = Math.max(smoothstep(light), item.focused ? 0.9 : 0);
      });
      aimMoved = false;
    };

    const draw = (now: number) => {
      raf = 0;
      if (!enabled()) {
        items.forEach(clearItemStyles);
        dirty = false;
        return;
      }

      const dt = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 1 / 60;
      lastTime = now;
      updatePointerTargets();

      let moving = false;
      const u = unit();
      items.forEach((item) => {
        item.velocity += (item.target - item.value) * 190 * dt;
        item.velocity *= Math.exp(-23 * dt);
        item.value += item.velocity * dt;
        if (
          Math.abs(item.target - item.value) < 0.001 &&
          Math.abs(item.velocity) < 0.004
        ) {
          item.value = item.target;
          item.velocity = 0;
        } else {
          moving = true;
        }

        const value = Math.max(0, Math.min(1.08, item.value));
        const widthGrowth = Math.min(18 * u, item.width * 0.24);
        const heightGrowth = 14 * u;
        item.el.style.width = `${(item.width + widthGrowth * value).toFixed(2)}px`;
        item.el.style.height = `${(item.height + heightGrowth * value).toFixed(2)}px`;
        item.el.style.transform = `translateY(${(value * 3.5 * u).toFixed(2)}px)`;

        const angleDiff =
          ((item.targetAngle - item.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
        item.angle += angleDiff * (1 - Math.exp(-dt * 8));
        item.brightness +=
          (item.targetBrightness - item.brightness) * (1 - Math.exp(-dt * 9));
        if (Math.abs(angleDiff) > 0.001 || Math.abs(item.targetBrightness - item.brightness) > 0.002) {
          moving = true;
        }
        item.el.style.setProperty("--spec-angle", `${item.angle.toFixed(4)}rad`);
        item.el.style.setProperty(
          "--spec-bright",
          String((clamp01(item.brightness) * 0.82).toFixed(3))
        );
      });

      dirty = moving;
      if (dirty) ensureFrame();
      else lastTime = 0;
    };

    function ensureFrame() {
      if (!raf) raf = requestAnimationFrame(draw);
    }

    const onPointerMove = (event: PointerEvent) => {
      if (!enabled() || event.pointerType === "touch") return;
      aimX = event.clientX;
      aimY = event.clientY;
      aimSeen = true;
      aimMoved = true;
      keyboardOwnsDock = false;
      dirty = true;
      ensureFrame();
    };

    const onPointerOut = (event: PointerEvent) => {
      if (event.relatedTarget) return;
      aimSeen = false;
      rest();
    };

    const onFocusIn = (event: FocusEvent) => {
      const target = event.target instanceof HTMLElement
        ? event.target.closest<HTMLElement>("[data-nav-proximity]")
        : null;
      if (!target) return;
      const index = items.findIndex((item) => item.el === target);
      if (index < 0) return;
      keyboardOwnsDock = true;
      items.forEach((item, itemIndex) => {
        item.focused = itemIndex === index;
        item.target = itemIndex === index ? 1 : Math.abs(itemIndex - index) === 1 ? 0.24 : 0;
        item.targetBrightness = item.focused ? 0.9 : 0;
        item.el.dataset.near = item.target > 0.08 ? "true" : "false";
      });
      dirty = true;
      ensureFrame();
    };

    const onFocusOut = () => {
      requestAnimationFrame(() => {
        if (!root.contains(document.activeElement)) {
          keyboardOwnsDock = false;
          items.forEach((item) => {
            item.focused = false;
          });
          rest();
        }
      });
    };

    const onModeChange = () => {
      if (!enabled()) {
        aimSeen = false;
        items.forEach(clearItemStyles);
      } else {
        measure();
      }
    };

    measure();
    document.fonts?.ready.then(measure);
    window.addEventListener("resize", measure);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerout", onPointerOut);
    root.addEventListener("focusin", onFocusIn);
    root.addEventListener("focusout", onFocusOut);
    finePointer.addEventListener("change", onModeChange);
    reducedMotion.addEventListener("change", onModeChange);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerout", onPointerOut);
      root.removeEventListener("focusin", onFocusIn);
      root.removeEventListener("focusout", onFocusOut);
      finePointer.removeEventListener("change", onModeChange);
      reducedMotion.removeEventListener("change", onModeChange);
      items.forEach(clearItemStyles);
    };
  }, []);

  return ref;
}
