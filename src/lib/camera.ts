/**
 * 相机系统 —— 全站统一的场景坐标与推进数学
 *
 * 首页(hero) → 简历页(resume) → 作品页(work) 三个区域共用同一张画布坐标系，
 * 保证镜头在各区之间衔接时是"同一套渲染"而不是三张不同的图/三套不同的数学，
 * 这是避免"衔接处出现两个不同场景"问题的关键。
 */

export const CW = 1280;
export const CH = 3105;

/** 首页初始只展示的画布高度（决定初始镜头缩放） */
export const VIEW_H = 832;

/** 白框 1：简历页镜头目标区域 */
export const BOX1 = { x: 208, y: 991, w: 865, h: 483 };
/** 白框 2：实习经历页镜头目标区域（新增） */
export const BOX2 = { x: 408, y: 1536, w: 701, h: 468 };
/** 白框 3：作品页镜头目标区域 */
export const BOX3 = { x: 426, y: 2066, w: 701, h: 468 };
/** 白框 4：联系页镜头目标区域（新增底部图层） */
export const BOX4 = { x: 238, y: 2693, w: 813, h: 380 };

export function boxCenterPct(box: { x: number; y: number; w: number; h: number }) {
  return {
    cx: (box.x + box.w / 2) / CW,
    cy: (box.y + box.h / 2) / CH,
  };
}

/**
 * 计算白框的缩放比例（contain 模式）。
 *
 * 保证白框区域**完全可见**在视口中——无论视口宽高比如何，
 * 白框内容都不会被裁切，类似 background-size: contain 的语义。
 * 视口中可能会看到白框之外的少量画布内容（作为背景的"呼吸空间"）。
 *
 * @param box 白框尺寸
 * @param vw 视口宽度（px）
 * @param vh 视口高度（px）
 */
export function boxScale(box: { w: number; h: number }, vw = 1440, vh = 900) {
  // 在 scale=1 时，可见画布区域的宽高（画布坐标系单位）：
  // visibleW = CW（因为 STAGE_HEIGHT_CSS 保证宽度>=视口）
  // visibleH = min(VIEW_H, vh * CW / vw)
  const visibleH = Math.min(VIEW_H, (vh * CW) / vw);
  // contain: 白框必须完全在可见区域内，取较小的缩放比
  return Math.min(CW / box.w, visibleH / box.h);
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
 * 前提：舞台元素本身是 `absolute left-1/2 top-1/2`，
 *       且 transform-origin 为默认值 (50% 50%)。
 *
 * CSS `transform: translate(A%, B%) scale(s)` 实际执行顺序（右到左）：
 *   先 scale(s) 以 transform-origin=center 为中心缩放，
 *   再 translate(A%*W, B%*H) 平移。
 *
 * 推导：要让画布上 (cx, cy) 比例处的点 P 显示在视口中心：
 *   screen(P) = origin + s*(P - origin) + (tx_px, ty_px)
 *   其中 origin = 元素中心 = (W/2, H/2) 本地坐标
 *   要求 screen(P) = (0, 0)（相对于元素初始位置 = 视口中心）
 *
 *   0 = W/2 + s*(cx*W - W/2) + tx_pct/100*W
 *   → tx_pct = 50*(s-1) - 100*s*cx
 *   同理 ty_pct = 50*(s-1) - 100*s*cy
 */
export function cameraCSS(cx: number, cy: number, scale: number) {
  const txPct = 50 * (scale - 1) - 100 * scale * cx;
  const tyPct = 50 * (scale - 1) - 100 * scale * cy;
  return { txPct, tyPct, scale };
}

// 预计算好的常用值（中心点不依赖视口，可以静态计算）
export const BOX1_CENTER = boxCenterPct(BOX1);
export const BOX2_CENTER = boxCenterPct(BOX2);
export const BOX3_CENTER = boxCenterPct(BOX3);
export const BOX4_CENTER = boxCenterPct(BOX4);

// BOX_SCALE 现在需要视口尺寸，不能静态预计算——用 boxScale(BOX, vw, vh) 在运行时算

/** 首页初始镜头（未推进时）的中心 */
export const INIT_CENTER = { cx: 0.5, cy: VIEW_H / 2 / CH };

/**
 * 首页初始缩放（动态，依赖视口宽高比）。
 * 保证设计稿中 1280×832 的区域以 contain 模式完全可见：
 * - 宽屏(16:9)下，高度约束胜出→ scale < 1 → 看到的画布高度覆盖完整 832
 * - 窄屏/正方形下，宽度约束胜出→ scale = 1 → 宽度恰好填满
 */
export function initScale(vw = 1440, vh = 900) {
  const visibleH = Math.min(VIEW_H, (vh * CW) / vw);
  // contain: 确保整个 CW×VIEW_H 区域可见
  // 宽度方向 scale = CW/CW = 1 (始终满足)
  // 高度方向 scale = visibleH/VIEW_H (宽屏时<1，表示需要缩小)
  return Math.min(1, visibleH / VIEW_H);
}

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
