import { useRef } from "react";
import { useScrollProgress } from "../hooks/use-scroll-progress";
import { useMouseParallax } from "../hooks/use-mouse-parallax";

/**
 * 首页 Hero —— 分层视差 + 太阳下落 + 推进白框
 *
 * 画布 1280×2692（全场景）。初始只看上部 832 区域。
 * 4 层：sky / sun / mtn / trees(带alpha透明)
 *
 * 【比例策略】舞台以高度为基准：height = 100svh * (CH / VIEW_H)，宽度通过
 * aspect-ratio 自动撑开。这保证初始看到的 VIEW_H 区域恰好填满视窗高度，
 * 画面不会被压扁。对于宽屏设备宽度可能超出视窗——完全没问题，
 * sticky 容器有overflow:hidden。
 *
 * 【露边修复】偏移量用百分比（相对自身尺寸的%），配合对应 scale 留余量，
 * 无论屏幕多大都不会露边。
 */

const CW = 1280;
const CH = 2692;
const VIEW_H = 832;

const BOX = { x: 239, y: 1064, w: 865, h: 606 };
const BOX_CX_PCT = (BOX.x + BOX.w / 2) / CW;
const BOX_CY_PCT = (BOX.y + BOX.h / 2) / CH;
const INIT_CY_PCT = VIEW_H / 2 / CH;
const ZOOM_SCALE = CW / BOX.w;

// depth: 最大偏移百分比（相对自身宽度）scale: 预留余量
const LAYERS = [
  { key: "sky", src: "/parallax/sky.webp", x: 0, y: -221, w: 1280, h: 1208, op: 1, z: 1, depth: 1.5, scale: 1.06 },
  { key: "mtn", src: "/parallax/mtn.webp", x: -41, y: 312, w: 1362, h: 810, op: 0.7, z: 3, depth: 3.5, scale: 1.12 },
] as const;

const SUN = { x: 34, y: 327, w: 435, h: 270 };
const SUN_DEPTH = 2.5; // %
const SUN_SCALE = 1.10;

const TREES_DEPTH = 5; // %
const TREES_SCALE = 1.14; // 需>= 1 + depth*2/100单侧

const pct = (v: number, base: number) => `${(v / base) * 100}%`;

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function HeroParallax() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useMouseParallax<HTMLDivElement>();
  const progress = useScrollProgress(sectionRef);

  // 太阳随滚动缓缓下落（百分比，相对太阳自身高度）
  const sunDropPct = progress * 80; // 最多下落自身高度的 80%

  // 推进白框：在 progress=0.25 开始，正好在 progress=1（section滚动结束）完成
  // 这样 hero 结束的瞬间立即无缝衔接简历页的暗层内容，没有空白定格期
  const zoomRaw = Math.max(Math.min((progress - 0.25) / 0.75, 1), 0);
  const zoomP = easeInOut(zoomRaw);

  const INIT_TX = -50;
  const INIT_TY = -(INIT_CY_PCT * 100);
  const txPct = INIT_TX + (-BOX_CX_PCT * 100 - INIT_TX) * zoomP;
  const tyPct = INIT_TY + (-BOX_CY_PCT * 100 - INIT_TY) * zoomP;
  const scale = 1 + (ZOOM_SCALE - 1) * zoomP;

  const textOp = 1 - Math.min(1, progress * 2.5);

  const frameOp =
    zoomRaw > 0.05 && zoomRaw < 0.9
      ? Math.min((zoomRaw - 0.05) * 6, 1) * Math.min(1, (0.9 - zoomRaw) * 6)
      : 0;

  // 【衔接修复】sticky 元素在 progress=1 时就会开始"解钉"随页面正常滚动，
  // 此时画面会冻结在最后一帧，同时下一个 section 从底部露出，两者会同屏
  // 短暂共存（约 1 屏高度）。如果 hero 最后一帧是"明亮无暗层"而简历页
  // 是"暗层覆盖"，滑动交接时会出现两套背景同时可见、明暗断层的诡异感。
  // 因此让暗层在 progress 接近 1 时也淡入到与简历页一致的不透明度，
  // 使冻结帧和滑入的简历页视觉连续。
  const darkOpacity = Math.max(0, Math.min((progress - 0.9) / 0.1, 1)) * 0.75;

  return (
    <section ref={sectionRef} className="relative h-[320svh] bg-[#12111f]">
      <div className="sticky top-0 h-svh w-full overflow-hidden bg-[#f0d9c0]">
        {/* 舞台：以高度为基准，宽度按aspect-ratio 自动撑开 */}
        <div
          ref={stageRef}
          className="absolute left-1/2 top-1/2 will-change-transform"
          style={{
            height: `calc(100svh * ${CH} / ${VIEW_H})`,
            aspectRatio: `${CW} / ${CH}`,
            transform: `translate(${txPct}%, ${tyPct}%) scale(${scale})`,
          }}
        >
          {/* sky + mtn */}
          {LAYERS.map((l) => (
            <img
              key={l.key}
              src={l.src}
              alt=""
              draggable={false}
              className="pointer-events-none absolute select-none will-change-transform"
              style={{
                left: pct(l.x, CW),
                top: pct(l.y, CH),
                width: pct(l.w, CW),
                height: pct(l.h, CH),
                opacity: l.op,
                zIndex: l.z,
                transform: `scale(${l.scale}) translate3d(calc(var(--mx,0) * ${l.depth} * 1%), 0, 0)`,
              }}
            />
          ))}

          {/* 太阳 */}
          <img
            src="/parallax/sun.webp"
            alt=""
            draggable={false}
            className="pointer-events-none absolute select-none will-change-transform"
            style={{
              left: pct(SUN.x, CW),
              top: pct(SUN.y, CH),
              width: pct(SUN.w, CW),
              height: pct(SUN.h, CH),
              zIndex: 2,
              transform: `scale(${SUN_SCALE}) translate3d(calc(var(--mx,0) * ${SUN_DEPTH} * 1%), ${sunDropPct}%, 0)`,
            }}
          />

          {/* trees */}
          <img
            src="/parallax/trees.webp"
            alt=""
            draggable={false}
            className="pointer-events-none absolute inset-0 h-full w-full select-none will-change-transform"
            style={{
              zIndex: 4,
              transform: `scale(${TREES_SCALE}) translate3d(calc(var(--mx,0) * ${TREES_DEPTH} * 1%), 0, 0)`,
            }}
          />

          {/* 白框 */}
          <div
            className="pointer-events-none absolute border-4 border-white/90 rounded-sm"
            style={{
              left: `${(BOX.x / CW) * 100}%`,
              top: `${(BOX.y / CH) * 100}%`,
              width: `${(BOX.w / CW) * 100}%`,
              height: `${(BOX.h / CH) * 100}%`,
              opacity: Math.max(0, frameOp),
            }}
          />
        </div>

        {/* 衔接暗层：跟简历页暗层同色同深度，避免 sticky 解钉时的明暗断层 */}
        <div
          className="pointer-events-none absolute inset-0 z-[5]"
          style={{ backgroundColor: `rgba(18, 17, 31, ${darkOpacity})` }}
        />

        {/* 首页文案 */}
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center"
          style={{ opacity: textOp }}
        >
          <p className="mb-3 text-sm tracking-[0.4em] text-white/85 uppercase drop-shadow">
            Portfolio
          </p>
          <h1 className="text-5xl font-semibold text-white drop-shadow-lg md:text-7xl">
            金玺
          </h1>
          <p className="mt-4 max-w-md text-white/90 drop-shadow md:text-lg">
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
