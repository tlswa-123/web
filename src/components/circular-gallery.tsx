import { useEffect, useRef, useState } from "react";

/**
 * 环形画廊 —— 纯 CSS 3D 实现（对应 komato3 里 ogl/WebGL 版的 CircularGallery）
 *
 * 弧线数学（与参考实现一致）：
 *   给定弯曲半径 R，卡片横向偏移 x 时
 *     下沉  arc = R - √(R² - x²)
 *     倾斜  rotZ = asin(x / R)
 *   再叠加景深：|x| 越大 → translateZ 越负（后退）、blur 越强、透明度越低
 *   → 天然得到「中间大而清晰，两侧小而虚化」
 *
 * 无限循环：卡片超出视野边界后整体挪一个 totalWidth 到队尾（取模实现）
 * 交互：滚轮横向滚 / 拖拽 / 点击两侧卡片居中
 */

export type GalleryItem = {
  id: string;
  title: string;
  meta: string;
  image?: string;
};

type Props = {
  items: GalleryItem[];
  /** 弯曲强度，0 为直线，越大弧度越明显 */
  bend?: number;
};

const CARD_W = 260;
const CARD_H = 350;
const GAP = 44;

export function CircularGallery({ items, bend = 3 }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  // 当前滚动偏移（px），阻尼跟随 target
  const offset = useRef(0);
  const target = useRef(0);
  const raf = useRef(0);
  const [, force] = useState(0);
  const dragging = useRef(false);
  const lastX = useRef(0);

  const step = CARD_W + GAP;
  const total = step * items.length;

  // 阻尼推进器：把 offset 平滑逼近 target，收敛后停机
  const ensureRef = useRef<() => void>(() => {});

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const tick = () => {
      const diff = target.current - offset.current;
      offset.current += diff * 0.09;
      force((n) => n + 1);
      if (Math.abs(diff) < 0.3) {
        offset.current = target.current;
        raf.current = 0;
        force((n) => n + 1);
        return;
      }
      raf.current = requestAnimationFrame(tick);
    };
    const ensure = () => {
      if (!raf.current) raf.current = requestAnimationFrame(tick);
    };
    ensureRef.current = ensure;

    // 滚轮横向滚动（在画廊内拦截，避免带动页面纵向滚动）
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      target.current += (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * 0.8;
      ensure();
    };

    const onDown = (e: PointerEvent) => {
      dragging.current = true;
      lastX.current = e.clientX;
      wrap.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      target.current -= (e.clientX - lastX.current) * 1.4;
      lastX.current = e.clientX;
      ensure();
    };
    const onUp = () => {
      dragging.current = false;
    };

    wrap.addEventListener("wheel", onWheel, { passive: false });
    wrap.addEventListener("pointerdown", onDown);
    wrap.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerup", onUp);
    wrap.addEventListener("pointercancel", onUp);

    return () => {
      wrap.removeEventListener("wheel", onWheel);
      wrap.removeEventListener("pointerdown", onDown);
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerup", onUp);
      wrap.removeEventListener("pointercancel", onUp);
      cancelAnimationFrame(raf.current);
    };
  }, [items.length]);

  /**
   * 弧线半径：必须远大于卡片横向跨度，否则 asin 会算出极大角度把卡片转飞。
   * 以「最边缘可见卡片(约 3×step)的倾斜角」反推：
   *   bend=3 时边缘倾斜约 14°，R = 3×step / sin(14°)
   * bend 越大 → 目标角度越大 → R 越小 → 弧度越明显。
   */
  const edgeX = step * 3;
  const edgeAngle = (Math.min(Math.max(bend, 0.1), 8) * 4.8 * Math.PI) / 180;
  const R = edgeX / Math.sin(edgeAngle);

  return (
    <div
      ref={wrapRef}
      className="relative h-[480px] w-full cursor-grab overflow-hidden active:cursor-grabbing"
      style={{ perspective: "1400px", perspectiveOrigin: "50% 45%" }}
    >
      <div
        className="absolute left-1/2 top-1/2 h-0 w-0"
        style={{ transformStyle: "preserve-3d" }}
      >
        {items.map((item, i) => {
          // 取模让卡片首尾相接、无限循环
          let x = i * step - offset.current;
          x = ((x % total) + total) % total;
          if (x > total / 2) x -= total;

          // 弧线：下沉 + 倾斜。R 远大于卡片跨度，保证是平缓弧线而非急弯
          const clampedX = Math.min(Math.abs(x), R * 0.98);
          const arc = R - Math.sqrt(Math.max(R * R - clampedX * clampedX, 0));
          const rotZ = (Math.sign(x) * Math.asin(clampedX / R) * 180) / Math.PI;

          // 景深：离中心越远越后退、越虚化
          const dist = Math.abs(x) / (step * 1.6);
          const z = -Math.min(dist, 2.2) * 220;
          const blur = Math.min(dist * 2.6, 6);
          const opacity = Math.max(1 - dist * 0.42, 0);
          // 超出可见范围的直接隐藏，省渲染
          const visible = Math.abs(x) < step * 3.2;

          return (
            <figure
              key={item.id}
              onClick={() => {
                if (Math.abs(x) < 4) return; // 已居中的不响应
                target.current += x; // 点击侧边卡片使其居中
                ensureRef.current();
              }}
              className="absolute select-none"
              style={{
                width: CARD_W,
                height: CARD_H,
                left: -CARD_W / 2,
                top: -CARD_H / 2,
                transform: `translate3d(${x}px, ${arc * 0.55}px, ${z}px) rotateZ(${rotZ}deg)`,
                opacity,
                visibility: visible ? "visible" : "hidden",
                zIndex: Math.round(1000 - Math.abs(x)),
              }}
            >
              {/* blur 放在内层：filter 会创建新层叠上下文，放外层会破坏 3D 变换 */}
              <div
                className="h-full w-full overflow-hidden rounded-2xl border-2 border-white/25 bg-[#25233a] shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
                style={{ filter: blur > 0.05 ? `blur(${blur}px)` : undefined }}
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.title}
                    draggable={false}
                    className="h-[76%] w-full object-cover"
                  />
                ) : (
                  <div className="flex h-[76%] w-full items-center justify-center bg-white/8 text-sm text-white/35">
                    图片待填充
                  </div>
                )}
                <figcaption className="px-4 py-3">
                  <h4 className="truncate text-base font-medium text-white">
                    {item.title}
                  </h4>
                  <p className="mt-0.5 truncate text-xs text-white/50">
                    {item.meta}
                  </p>
                </figcaption>
              </div>
            </figure>
          );
        })}
      </div>
    </div>
  );
}
