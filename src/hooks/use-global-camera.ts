import { useEffect, useRef, useState } from "react";
import { useScroll } from "../lib/scroll-context";
import {
  BOX1_CENTER,
  BOX2_CENTER,
  BOX3_CENTER,
  BOX1_SCALE,
  BOX2_SCALE,
  BOX3_SCALE,
  INIT_CENTER,
  INIT_SCALE,
  cameraCSS,
  lerp,
  easeInOut,
  clamp01,
} from "../lib/camera";

/**
 * 全局镜头 hook —— 整站唯一背景层的驱动逻辑
 *
 * 阶段（按绝对 scrollTop 划分）：
 * 1. 首页阶段：INIT 镜头 → 白框1（沿用 hero 原有推进节奏）
 * 2. 简历锁定阶段：镜头锁定白框1，翻阅卡片期间纹丝不动
 * 3. 推进阶段A：白框1 → 白框2（简历卡片区末尾的缓冲空间内）
 * 4. 实习经历锁定阶段：镜头锁定白框2，翻4屏实习内容
 * 5. 推进阶段B：白框2 → 白框3（实习经历区末尾的缓冲空间内）
 * 6. 作品锁定阶段：镜头锁定白框3
 */

const PUSH_A_DISTANCE_VH = 1.3; // 白框1→白框2 推进占的屏数
const HOLD_A_DISTANCE_VH = 0.6; // 推进A完成后停留
const PUSH_B_DISTANCE_VH = 1.3; // 白框2→白框3 推进占的屏数
const HOLD_B_DISTANCE_VH = 0.8; // 推进B完成后停留
const FADE_DISTANCE_VH = 0.8; // 作品区结束后背景淡出
const DARK_MAX = 0.75;

type Bounds = {
  heroTop: number;
  heroHeight: number;
  pushAMarkerTop: number; // #resume-cards-end 的位置
  expTop: number; // #experience 的位置
  pushBMarkerTop: number; // #experience-end 的位置
  workTop: number;
  workHeight: number;
};

export function useGlobalCamera() {
  const scroll = useScroll();
  const [scrollTop, setScrollTop] = useState(0);
  const [vh, setVh] = useState(() =>
    typeof window !== "undefined" ? window.innerHeight : 900
  );
  const boundsRef = useRef<Bounds | null>(null);
  const [, force] = useState(0);

  useEffect(() => {
    const absoluteTop = (el: HTMLElement) => {
      const rect = el.getBoundingClientRect();
      return rect.top + window.scrollY;
    };

    const measure = () => {
      const hero = document.getElementById("hero");
      const markerA = document.getElementById("resume-cards-end");
      const exp = document.getElementById("experience");
      const markerB = document.getElementById("experience-end");
      const work = document.getElementById("work");
      if (!hero || !markerA || !work) return;
      boundsRef.current = {
        heroTop: absoluteTop(hero),
        heroHeight: hero.offsetHeight,
        pushAMarkerTop: absoluteTop(markerA),
        expTop: exp ? absoluteTop(exp) : absoluteTop(markerA) + PUSH_A_DISTANCE_VH * window.innerHeight + HOLD_A_DISTANCE_VH * window.innerHeight,
        pushBMarkerTop: markerB ? absoluteTop(markerB) : absoluteTop(work) - (PUSH_B_DISTANCE_VH + HOLD_B_DISTANCE_VH) * window.innerHeight,
        workTop: absoluteTop(work),
        workHeight: work.offsetHeight,
      };
      force((n) => n + 1);
    };
    measure();
    const onResize = () => {
      setVh(window.innerHeight);
      measure();
    };
    window.addEventListener("resize", onResize);
    const t1 = setTimeout(measure, 300);
    const t2 = setTimeout(measure, 1200);
    const unsub = scroll.subscribe((y) => setScrollTop(y));
    return () => {
      window.removeEventListener("resize", onResize);
      unsub();
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [scroll]);

  const bounds = boundsRef.current;

  if (!bounds) {
    const init = cameraCSS(INIT_CENTER.cx, INIT_CENTER.cy, INIT_SCALE);
    return {
      txPct: init.txPct,
      tyPct: init.tyPct,
      scale: INIT_SCALE,
      sunDropPct: 0,
      darkOpacity: 0,
      sceneOpacity: 1,
      parallaxStrength: 1,
      marginScale: 1,
    };
  }

  const heroActiveEnd = bounds.heroTop + bounds.heroHeight - vh;

  // 推进A: BOX1→BOX2 (简历→实习)
  const pushAStart = bounds.pushAMarkerTop;
  const pushARawEnd = pushAStart + PUSH_A_DISTANCE_VH * vh;
  const holdAEnd = pushARawEnd + HOLD_A_DISTANCE_VH * vh;

  // 推进B: BOX2→BOX3 (实习→作品)
  const pushBStart = bounds.pushBMarkerTop;
  const pushBRawEnd = pushBStart + PUSH_B_DISTANCE_VH * vh;
  const holdBEnd = pushBRawEnd + HOLD_B_DISTANCE_VH * vh;

  let cx: number;
  let cy: number;
  let scale: number;
  let darkOpacity: number;
  let parallaxStrength: number;
  let marginScale: number;
  let sunDropPct = 80;

  if (scrollTop <= heroActiveEnd) {
    // 阶段1：首页 INIT -> BOX1
    const heroRange = Math.max(1, bounds.heroHeight - vh);
    const p = clamp01((scrollTop - bounds.heroTop) / heroRange);
    const zoomRaw = clamp01((p - 0.25) / 0.75);
    const zoomP = easeInOut(zoomRaw);
    cx = lerp(INIT_CENTER.cx, BOX1_CENTER.cx, zoomP);
    cy = lerp(INIT_CENTER.cy, BOX1_CENTER.cy, zoomP);
    scale = lerp(INIT_SCALE, BOX1_SCALE, zoomP);
    darkOpacity = clamp01((p - 0.9) / 0.1) * DARK_MAX;
    parallaxStrength = 1;
    marginScale = 1 - zoomP;
    sunDropPct = p * 80;
  } else if (scrollTop <= pushAStart) {
    // 阶段2：简历锁定 (BOX1)
    cx = BOX1_CENTER.cx;
    cy = BOX1_CENTER.cy;
    scale = BOX1_SCALE;
    darkOpacity = DARK_MAX;
    parallaxStrength = 0;
    marginScale = 0;
  } else if (scrollTop <= pushARawEnd) {
    // 阶段3：推进A (BOX1→BOX2)
    const p = clamp01((scrollTop - pushAStart) / Math.max(1, pushARawEnd - pushAStart));
    const ep = easeInOut(p);
    cx = lerp(BOX1_CENTER.cx, BOX2_CENTER.cx, ep);
    cy = lerp(BOX1_CENTER.cy, BOX2_CENTER.cy, ep);
    scale = lerp(BOX1_SCALE, BOX2_SCALE, ep);
    darkOpacity = DARK_MAX;
    parallaxStrength = 0;
    marginScale = 0;
  } else if (scrollTop <= holdAEnd) {
    // 阶段3.5：推进A完成后停留（BOX2锁定开始前的缓冲）
    cx = BOX2_CENTER.cx;
    cy = BOX2_CENTER.cy;
    scale = BOX2_SCALE;
    darkOpacity = DARK_MAX;
    parallaxStrength = 0;
    marginScale = 0;
  } else if (scrollTop <= pushBStart) {
    // 阶段4：实习经历锁定 (BOX2)
    cx = BOX2_CENTER.cx;
    cy = BOX2_CENTER.cy;
    scale = BOX2_SCALE;
    darkOpacity = DARK_MAX;
    parallaxStrength = 0;
    marginScale = 0;
  } else if (scrollTop <= pushBRawEnd) {
    // 阶段5：推进B (BOX2→BOX3)
    const p = clamp01((scrollTop - pushBStart) / Math.max(1, pushBRawEnd - pushBStart));
    const ep = easeInOut(p);
    cx = lerp(BOX2_CENTER.cx, BOX3_CENTER.cx, ep);
    cy = lerp(BOX2_CENTER.cy, BOX3_CENTER.cy, ep);
    scale = lerp(BOX2_SCALE, BOX3_SCALE, ep);
    darkOpacity = DARK_MAX;
    parallaxStrength = 0;
    marginScale = 0;
  } else if (scrollTop <= holdBEnd) {
    // 阶段5.5：推进B完成后停留
    cx = BOX3_CENTER.cx;
    cy = BOX3_CENTER.cy;
    scale = BOX3_SCALE;
    darkOpacity = DARK_MAX;
    parallaxStrength = 0;
    marginScale = 0;
  } else {
    // 阶段6：作品锁定 (BOX3)
    cx = BOX3_CENTER.cx;
    cy = BOX3_CENTER.cy;
    scale = BOX3_SCALE;
    darkOpacity = DARK_MAX;
    parallaxStrength = 0;
    marginScale = 0;
  }

  const { txPct, tyPct } = cameraCSS(cx, cy, scale);

  // 淡出阶段：work区域结束后
  const workBottom = bounds.workTop + bounds.workHeight;
  const fadeStart = workBottom;
  const fadeEnd = workBottom + FADE_DISTANCE_VH * vh;
  let sceneOpacity = 1;
  if (scrollTop > fadeStart) {
    sceneOpacity = 1 - clamp01((scrollTop - fadeStart) / Math.max(1, fadeEnd - fadeStart));
  }

  return { txPct, tyPct, scale, sunDropPct, darkOpacity, sceneOpacity, parallaxStrength, marginScale };
}
