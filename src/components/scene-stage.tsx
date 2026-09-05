import { forwardRef } from "react";
import { CW, CH } from "../lib/camera";

/**
 * 共享场景舞台 —— sky/sun/mtn/trees 四层，供 hero/resume/work 三处共用
 *
 * 保证三个区域渲染的是"同一套图层+同一套数学"，而不是各自维护一份，
 * 这样镜头在不同区域间衔接时画面在像素级别是连续的，不会出现"两个场景"的错觉。
 */

const pct = (v: number, base: number) => `${(v / base) * 100}%`;

const LAYERS = [
  { key: "sky", src: "/parallax/sky.webp", x: 0, y: -221, w: 1280, h: 1208, op: 1, z: 1, depth: 8, rotate: 0.018, scale: 1.06 },
  { key: "mtn", src: "/parallax/mtn.webp", x: -41, y: 312, w: 1362, h: 810, op: 0.7, z: 3, depth: 20, rotate: 0.035, scale: 1.12 },
  { key: "trees", src: "/parallax/trees.webp", x: -36, y: 208, w: 1477, h: 2626, op: 1, z: 4, depth: 36, rotate: 0.052, scale: 1.14 },
  { key: "grass", src: "/parallax/grass.webp", x: -132, y: 1200, w: 1739, h: 3091, op: 1, z: 5, depth: 46, rotate: 0.062, scale: 1.14 },
] as const;

const SUN = { x: 34, y: 327, w: 435, h: 270 };
const SUN_DEPTH = 14;
const SUN_ROTATE = 0.028;
const SUN_SCALE = 1.1;

// trees 现在也走 LAYERS 统一定位（坐标来自SVG中的实际位置）
// 不再使用 inset-0 h-full w-full，避免在 CH=3105 画布上拉伸 2692 高的图片

type Props = {
  /** 舞台高度（决定整体缩放基准），一般用 `calc(100svh * CH / X)` */
  stageHeight: string;
  /** transform: translate(txPct%, tyPct%) scale(scale) */
  txPct: number;
  tyPct: number;
  scale: number;
  /** 太阳下落百分比，0~80，默认 0（不下落） */
  sunDropPct?: number;
  /** 是否启用鼠标视差（读取 --mx CSS变量），默认开启 */
  mouseParallax?: boolean;
  /**
   * 各图层"防露边余量缩放"的生效程度，0~1，默认 1（完全生效）。
   *
   * 【为什么需要这个参数】sky/mtn/sun/trees 各层都有一个固定的
   * scale（如trees的1.14），本意是给鼠标视差的depth位移留出画面边缘
   * 余量。但这个缩放是围绕各层自身中心进行的，会导致图层内容的
   * 视觉位置整体偏移——偏移量随"距图层中心的距离"增大。对于离中心近的
   * 白框（如BOX1，距中心仅约31px）偏移只有几像素，几乎不可见；但对于
   * 离中心远的白框（如BOX2，距中心约808px），1.14倍缩放会造成上百
   * 像素的可见偏移，导致镜头定格位置与实际画面内容错位。
   * 解决方式：不再让这个余量缩放"始终100%生效"，而是随镜头远离初始
   * 视角（即随首页推进的zoomP）从1平滑降到0——推进到白框1完成时余量
   * 缩放已经降到0，之后简历/推进/作品所有锁定阶段都不再有这个偏移源，
   * 白框位置与画面内容精确对齐。因为是随首页原有的easing曲线平滑过渡，
   * 不会有额外的跳变。
   */
  marginScale?: number;
  /** 白框高亮：传入 box 和透明度 */
  frameBox?: { x: number; y: number; w: number; h: number };
  frameOpacity?: number;
  /** 整体透明度（用于淡出） */
  opacity?: number;
};

export const SceneStage = forwardRef<HTMLDivElement, Props>(function SceneStage(
  {
    stageHeight,
    txPct,
    tyPct,
    scale,
    sunDropPct = 0,
    mouseParallax = true,
    marginScale = 1,
    frameBox,
    frameOpacity = 0,
    opacity = 1,
  },
  ref
) {
  const mx = mouseParallax ? "var(--mx, 0)" : "0";
  const my = mouseParallax ? "var(--my, 0)" : "0";
  // 各层有效缩放 = 1 + (基础余量-1) * marginScale，marginScale=0时完全不缩放
  const effScale = (base: number) => 1 + (base - 1) * marginScale;

  return (
    <div
      ref={ref}
      className="absolute left-1/2 top-1/2 will-change-transform"
      style={{
        height: stageHeight,
        aspectRatio: `${CW} / ${CH}`,
        transform: `translate(${txPct}%, ${tyPct}%) scale(${scale})`,
        perspective: "1400px",
        transformStyle: "preserve-3d",
        opacity,
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
            transform: `translate3d(calc(${mx} * ${-l.depth}px), calc(${my} * ${(-l.depth * 0.62).toFixed(2)}px), 0) rotateY(calc(${mx} * ${l.rotate}deg)) rotateX(calc(${my} * ${(-l.rotate * 0.7).toFixed(4)}deg)) scale(${effScale(l.scale)})`,
            transformOrigin: "50% 50%",
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
          transform: `translate3d(calc(${mx} * ${-SUN_DEPTH}px), calc(${sunDropPct}% + ${my} * ${(-SUN_DEPTH * 0.62).toFixed(2)}px), 0) rotateY(calc(${mx} * ${SUN_ROTATE}deg)) rotateX(calc(${my} * ${(-SUN_ROTATE * 0.7).toFixed(4)}deg)) scale(${effScale(SUN_SCALE)})`,
          transformOrigin: "50% 50%",
        }}
      />

      {/* trees 现在走 LAYERS 统一坐标定位 */}

      {/* 白框高亮（可选） */}
      {frameBox && (
        <div
          className="pointer-events-none absolute border-4 border-white/90 rounded-sm"
          style={{
            left: `${(frameBox.x / CW) * 100}%`,
            top: `${(frameBox.y / CH) * 100}%`,
            width: `${(frameBox.w / CW) * 100}%`,
            height: `${(frameBox.h / CH) * 100}%`,
            opacity: Math.max(0, frameOpacity),
          }}
        />
      )}
    </div>
  );
});
