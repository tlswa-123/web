import { useEffect, useRef, useState } from "react";

/**
 * 环形画廊 —— 纯 CSS 3D 实现
 *
 * 交互：滚轮横向滚 / 拖拽 / 点击居中卡片打开 / 点击侧边卡片使其居中
 */

export type GalleryItem = {
  id: string;
  title: string;
  meta: string;
  image?: string;
};

type Props = {
  items: GalleryItem[];
  bend?: number;
  onItemClick?: (id: string) => void;
};

const CARD_W = 360;
const CARD_H = 240;
const GAP = 44;

export function CircularGallery({ items, bend = 3, onItemClick }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const offset = useRef(0);
  const target = useRef(0);
  const raf = useRef(0);
  const [, force] = useState(0);
  const dragging = useRef(false);
  const lastX = useRef(0);
  const dragStartX = useRef(0); // 记录按下位置
  const dragDist = useRef(0);

  const step = CARD_W + GAP;
  const total = step * items.length;

  const ensureRef = useRef<() => void>(() => {});
  const onItemClickRef = useRef(onItemClick);
  onItemClickRef.current = onItemClick;
  // 保存当前各卡片的 x 位置供点击判断
  const cardPositions = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const animate = () => {
      const diff = target.current - offset.current;
      offset.current += diff * 0.09;
      force((n) => n + 1);
      if (Math.abs(diff) < 0.3) {
        offset.current = target.current;
        raf.current = 0;
  force((n) => n + 1);
        return;
      }
      raf.current = requestAnimationFrame(animate);
    };
    const ensure = () => {
  if (!raf.current) raf.current = requestAnimationFrame(animate);
    };
    ensureRef.current = ensure;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
  target.current += (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * 0.8;
      ensure();
    };

    const onDown = (e: PointerEvent) => {
      dragging.current = true;
      dragDist.current = 0;
      dragStartX.current = e.clientX;
    lastX.current = e.clientX;
      wrap.setPointerCapture(e.pointerId);
    };

    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - lastX.current;
      dragDist.current += Math.abs(dx);
      target.current -= dx * 1.4;
      lastX.current = e.clientX;
  ensure();
  };

const onUp = (e: PointerEvent) => {
  if (!dragging.current) return;
      dragging.current = false;

      // 如果拖拽距离很小（< 8px），视为点击
      if (dragDist.current < 8) {
        handleClick(e.clientX, e.clientY);
      }
    };

    const handleClick = (clientX: number, _clientY: number) => {
      // 找到最近的卡片
    const wrapRect = wrap.getBoundingClientRect();
    const centerX = wrapRect.left + wrapRect.width / 2;
      // 点击位置相对于画廊中心的 x
      const clickRelX = clientX - centerX;

      // 从 cardPositions 找到最接近点击位置的卡片
      let bestId: string | null = null;
      let bestDist = Infinity;

      for (const [id, cardX] of cardPositions.current.entries()) {
        const d = Math.abs(cardX - clickRelX);
   if (d < bestDist) {
          bestDist = d;
          bestId = id;
        }
      }

      if (!bestId) return;
   const cardX = cardPositions.current.get(bestId)!;

      if (Math.abs(cardX) < step * 0.4) {
        // 居中卡片 → 触发查看回调
    onItemClickRef.current?.(bestId);
      } else {
// 侧边卡片 → 滑动到居中
      target.current += cardX;
        ensure();
      }
    };

    wrap.addEventListener("wheel", onWheel, { passive: false });
 wrap.addEventListener("pointerdown", onDown);
    wrap.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerup", onUp);
wrap.addEventListener("pointercancel", () => { dragging.current = false; });

    return () => {
      wrap.removeEventListener("wheel", onWheel);
      wrap.removeEventListener("pointerdown", onDown);
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerup", onUp);
      cancelAnimationFrame(raf.current);
    };
  }, [items.length]);

  const edgeX = step * 3;
  const edgeAngle = (Math.min(Math.max(bend, 0.1), 8) * 4.8 * Math.PI) / 180;
  const R = edgeX / Math.sin(edgeAngle);

  // 计算并缓存各卡片位置
  const positions: { id: string; x: number }[] = [];
  for (let i = 0; i < items.length; i++) {
    let x = i * step - offset.current;
    x = ((x % total) + total) % total;
    if (x > total / 2) x -= total;
    positions.push({ id: items[i].id, x });
  }
  // 更新 ref（供 pointerup 读取）
  const posMap = new Map<string, number>();
  positions.forEach((p) => posMap.set(p.id, p.x));
  cardPositions.current = posMap;

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
        {positions.map(({ id, x }) => {
       const item = items.find((it) => it.id === id)!;

          const clampedX = Math.min(Math.abs(x), R * 0.98);
          const arc = R - Math.sqrt(Math.max(R * R - clampedX * clampedX, 0));
          const rotZ = (Math.sign(x) * Math.asin(clampedX / R) * 180) / Math.PI;

          const dist = Math.abs(x) / (step * 1.6);
      const z = -Math.min(dist, 2.2) * 180;
          // 只有很远的卡片才轻微模糊
   const blur = dist > 1.5 ? Math.min((dist - 1.5) * 2, 2.5) : 0;
     const opacity = Math.max(1 - dist * 0.25, 0);
     const visible = Math.abs(x) < step * 3.5;
          const isCentered = Math.abs(x) < step * 0.4;

          return (
     <figure
          key={id}
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
  cursor: isCentered ? "pointer" : "grab",
        pointerEvents: "none", // 让容器统一处理pointer事件
              }}
            >
              <div
 className="h-full w-full"
             style={{ filter: blur > 0.05 ? `blur(${blur}px)` : undefined }}
   >
 {item.image ? (
      <img
       src={item.image}
            alt={item.title}
          draggable={false}
                 className="h-full w-full object-contain drop-shadow-[0_6px_20px_rgba(0,0,0,0.5)]"
   />
         ) : (
     <div className="flex h-full w-full items-center justify-center text-sm text-white/35">
           图片待填充
         </div>
         )}
              </div>
   </figure>
  );
        })}
      </div>
  </div>
  );
}
