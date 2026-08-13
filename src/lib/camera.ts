/**
 * 相机系统 —— 全站统一的场景坐标与推进数学
 *
 * 首页(hero) → 简历页(resume) → 作品页(work) 三个区域共用同一张画布坐标系，
 * 保证镜头在各区之间衔接时是"同一套渲染"而不是三张不同的图/三套不同的数学，
 * 这是避免"衔接处出现两个不同场景"问题的关键。
 */

export const CW = 1280;
export const CH = 2692;

/** 首页初始只展示的画布高度（决定初始镜头缩放） */
export const VIEW_H = 832;

/** 白框 1：简历页镜头目标区域 */
export const BOX1 = { x: 239, y: 1064, w: 865, h: 606 };
/** 白框 2：作品页镜头目标区域 */
export const BOX2 = { x: 435, y: 1920, w: 701, h: 468 };

export function boxCenterPct(box: { x: number; y: number; w: number; h: number }) {
  return {
    cx: (box.x + box.w / 2) / CW,
    cy: (box.y + box.h / 2) / CH,
  };
}

export function boxScale(box: { w: number }) {
  return CW / box.w;
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

/**
 * 给定镜头中心百分比 (cx, cy) 和缩放 scale，
 * 返回可以直接用在 `translate(tx%, ty%) scale(s)` 的 CSS transform 参数。
 * 前提：舞台元素本身是 `absolute left-1/2 top-1/2`。
 */
export function cameraCSS(cx: number, cy: number, scale: number) {
  return { txPct: -cx * 100, tyPct: -cy * 100, scale };
}

// 预计算好的常用值
export const BOX1_CENTER = boxCenterPct(BOX1);
export const BOX2_CENTER = boxCenterPct(BOX2);
export const BOX1_SCALE = boxScale(BOX1);
export const BOX2_SCALE = boxScale(BOX2);

/** 首页初始镜头（未推进时）的中心与缩放 */
export const INIT_CENTER = { cx: 0.5, cy: VIEW_H / 2 / CH };
export const INIT_SCALE = 1;

/** 太阳在 hero 结束（progress=1）时的下落百分比，供 resume/work 静态渲染太阳位置对齐 */
export const SUN_DROP_AT_REST = 80;

/**
 * 舞台基准高度 CSS —— 保证任意窗口宽高比下都能"cover"满整个视窗，不露边。
 *
 * 【为什么之前会露边】舞台宽度是通过 aspect-ratio 由高度反推出来的
 * （height: 100svh*CH/VIEW_H，width 自动 = height*(CW/CH)）。这只在
 * "视窗宽高比 <= CW/VIEW_H（≈1.538）"时才会让宽度天然铺满或溢出视窗；
 * 一旦浏览器窗口比这个比例更"宽扁"（例如常见的16:9/16:10宽屏窗口，
 * 比例通常在1.6~1.8），单纯按高度撑开的宽度就会小于视窗宽度，两侧露边。
 *
 * 【修复】用 CSS max() 同时满足"按高度撑满"和"按宽度撑满"两个约束，
 * 取两者中更大的高度值——这样无论视窗宽高比如何，舞台一定完全覆盖
 * 视窗（类似 background-size:cover 的效果），代价是极宽视窗下初始
 * 会比预想略"zoom in"一点（也就是看到的初始区域比 VIEW_H 略小），
 * 但绝不会有黑边。这个常量被 GlobalBackground 唯一引用，因此对首页/
 * 简历锁定/作品锁定所有阶段的舞台尺寸一次性生效。
 */
export const STAGE_HEIGHT_CSS = `max(calc(100svh * ${CH} / ${VIEW_H}), calc(100svw * ${CH} / ${CW}))`;
