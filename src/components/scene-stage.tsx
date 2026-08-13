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
  { key: "sky", src: "/parallax/sky.webp", x: 0, y: -221, w: 1280, h: 1208, op: 1, z: 1, depth: 1.5, scale: 1.06 },
  { key: "mtn", src: "/parallax/mtn.webp", x: -41, y: 312, w: 1362, h: 810, op: 0.7, z: 3, depth: 3.5, scale: 1.12 },
] as const;

const SUN = { x: 34, y: 327, w: 435, h: 270 };
const SUN_DEPTH = 2.5;
const SUN_SCALE = 1.1;

const TREES_DEPTH = 5;
const TREES_SCALE = 1.14;

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
    frameBox,
    frameOpacity = 0,
    opacity = 1,
  },
  ref
) {
  const mx = mouseParallax ? "var(--mx,0)" : "0";

  return (
    <div
      ref={ref}
      className="absolute left-1/2 top-1/2 will-change-transform"
      style={{
        height: stageHeight,
        aspectRatio: `${CW} / ${CH}`,
        transform: `translate(${txPct}%, ${tyPct}%) scale(${scale})`,
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
            transform: `scale(${l.scale}) translate3d(calc(${mx} * ${l.depth} * 1%), 0, 0)`,
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
          transform: `scale(${SUN_SCALE}) translate3d(calc(${mx} * ${SUN_DEPTH} * 1%), ${sunDropPct}%, 0)`,
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
          transform: `scale(${TREES_SCALE}) translate3d(calc(${mx} * ${TREES_DEPTH} * 1%), 0, 0)`,
        }}
      />

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
