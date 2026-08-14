import { useEffect, useRef, useState } from "react";
import { useScroll } from "../lib/scroll-context";
import {
  BOX1_CENTER,
  BOX2_CENTER,
  BOX1_SCALE,
  BOX2_SCALE,
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
 * 【核心原则】背景只有一个 DOM 实例（挂载在 GlobalBackground，App 顶层只渲染
 * 一次，永不卸载重建）。首页→简历→作品的镜头变化，全部是这同一个实例的
 * transform 参数随全局 scrollTop 连续变化——物理上不存在"切换到另一张图/
 * 另一个组件"的时刻，因此不可能出现"两个不同背景"的错觉，也不会有衔接断层。
 *
 * 阶段（按绝对 scrollTop 划分）：
 * 1. 首页阶段：INIT 镜头 → 白框1（沿用 hero 原有推进节奏，滚动结束时到位）
 * 2. 简历锁定阶段：镜头锁定白框1，翻阅卡片期间纹丝不动
 * 3. 推进阶段：白框1 → 白框2 连续推进 —— 发生在简历卡片区末尾的"缓冲滚动
 *    空间"内（不是独立的新section，只是简历区自身多留出的一段滚动距离，
 *    这段时间背景本身就是唯一的视觉内容，不会显得空白）
 * 4. 作品锁定阶段：镜头锁定白框2
 *
 * 推进的起止点用 DOM 标记元素（#resume-cards-end）的实际渲染位置来定位，
 * 不依赖简历卡片高度的百分比换算，因此不受响应式换行/断点影响。
 */

const PUSH_DISTANCE_VH = 1.3; // 白框1→白框2 推进所占的屏数
const HOLD_DISTANCE_VH = 1.0; // 推进完成后镜头在白框2停留的屏数，避免仓促挤入作品内容
const FADE_DISTANCE_VH = 0.8; // 作品区结束后背景淡出所占的屏数
const DARK_MAX = 0.75;

type Bounds = {
  heroTop: number;
  heroHeight: number;
  pushMarkerTop: number;
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
    // 【关键修复】用 getBoundingClientRect().top + scrollY 计算绝对页面坐标，
    // 不能用 element.offsetTop —— offsetTop 是相对于 offsetParent（最近的
    // 已定位祖先元素）的坐标，而 #resume-cards-end 所在的祖先链上有
    // `relative` 定位的容器，导致 offsetTop 算出的是"相对局部容器"的坐标
    // （曾经算出 marker 比 resume 区起点还小），而不是页面绝对坐标，
    // 这会让推进起止点完全算错，导致背景在错误的时机推进/锁定。
    const absoluteTop = (el: HTMLElement) => {
      const rect = el.getBoundingClientRect();
      return rect.top + window.scrollY;
    };

    const measure = () => {
      const hero = document.getElementById("hero");
      const marker = document.getElementById("resume-cards-end");
      const work = document.getElementById("work");
      if (!hero || !marker || !work) return;
      boundsRef.current = {
        heroTop: absoluteTop(hero),
        heroHeight: hero.offsetHeight,
        pushMarkerTop: absoluteTop(marker),
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
    // 图片/字体异步加载可能改变布局高度，多测几次兜底
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
  const pushStart = bounds.pushMarkerTop;
  // 推进本身占 PUSH_DISTANCE_VH 屏，推进完成后再留 HOLD_DISTANCE_VH 屏
  // 让镜头在白框2稳稳停留一下，才进入作品内容区——避免"推进完立刻挤进
  // 作品页"的仓促感。两段总长度受 workTop 上限约束（不能超出简历区）。
  const pushRawEnd = pushStart + PUSH_DISTANCE_VH * vh;
  const holdEnd = pushRawEnd + HOLD_DISTANCE_VH * vh;
  const pushEnd = Math.min(pushRawEnd, bounds.workTop);
  const lockEnd = Math.min(holdEnd, bounds.workTop);

  let cx: number;
  let cy: number;
  let scale: number;
  let darkOpacity: number;
  let parallaxStrength: number;
  let marginScale: number;
  let sunDropPct = 80;

  if (scrollTop <= heroActiveEnd) {
    // 首页阶段：INIT -> 白框1
    const heroRange = Math.max(1, bounds.heroHeight - vh);
    const p = clamp01((scrollTop - bounds.heroTop) / heroRange);
    const zoomRaw = clamp01((p - 0.25) / 0.75);
    const zoomP = easeInOut(zoomRaw);
    cx = lerp(INIT_CENTER.cx, BOX1_CENTER.cx, zoomP);
    cy = lerp(INIT_CENTER.cy, BOX1_CENTER.cy, zoomP);
    scale = lerp(INIT_SCALE, BOX1_SCALE, zoomP);
    darkOpacity = clamp01((p - 0.9) / 0.1) * DARK_MAX;
    parallaxStrength = 1;
    // marginScale 随推进同步从 1 降到 0：推进到白框1完成时，防露边余量
    // 缩放已经完全撤销，之后简历/推进/作品所有锁定阶段都不再有这个
    // 会导致白框位置偏移的额外缩放源
    marginScale = 1 - zoomP;
    sunDropPct = p * 80;
  } else if (scrollTop <= pushStart) {
    // 简历锁定阶段：白框1，纹丝不动
    cx = BOX1_CENTER.cx;
    cy = BOX1_CENTER.cy;
    scale = BOX1_SCALE;
    darkOpacity = DARK_MAX;
    parallaxStrength = 0;
    marginScale = 0;
  } else if (scrollTop <= pushEnd) {
    // 推进阶段：白框1 -> 白框2（发生在简历区尾部的缓冲滚动空间内）
    const p = clamp01((scrollTop - pushStart) / Math.max(1, pushEnd - pushStart));
    const ep = easeInOut(p);
    cx = lerp(BOX1_CENTER.cx, BOX2_CENTER.cx, ep);
    cy = lerp(BOX1_CENTER.cy, BOX2_CENTER.cy, ep);
    scale = lerp(BOX1_SCALE, BOX2_SCALE, ep);
    darkOpacity = DARK_MAX;
    parallaxStrength = 0;
    marginScale = 0;
  } else if (scrollTop <= lockEnd) {
    // 停留阶段：镜头已到白框2，稳定停留，给用户一点喘息空间再进入作品内容
    cx = BOX2_CENTER.cx;
    cy = BOX2_CENTER.cy;
    scale = BOX2_SCALE;
    darkOpacity = DARK_MAX;
    parallaxStrength = 0;
    marginScale = 0;
  } else {
    // 作品锁定阶段：白框2，纹丝不动
    cx = BOX2_CENTER.cx;
    cy = BOX2_CENTER.cy;
    scale = BOX2_SCALE;
    darkOpacity = DARK_MAX;
    parallaxStrength = 0;
    marginScale = 0;
  }

  const { txPct, tyPct } = cameraCSS(cx, cy, scale);

  // 淡出阶段：work 区域内容全部滚过之后（work-section 不再是 sticky，
  // 是普通文档流高度），在其后留一段距离让背景层淡出，露出 About/Contact
  // 的纯色背景。以 workTop+workHeight（work区域底部）为基准，而不是
  // "sticky释放点"（work-section 已改为普通高度，没有释放点概念）
  const workBottom = bounds.workTop + bounds.workHeight;
  const fadeStart = workBottom;
  const fadeEnd = workBottom + FADE_DISTANCE_VH * vh;
  let sceneOpacity = 1;
  if (scrollTop > fadeStart) {
    sceneOpacity = 1 - clamp01((scrollTop - fadeStart) / Math.max(1, fadeEnd - fadeStart));
  }

  return { txPct, tyPct, scale, sunDropPct, darkOpacity, sceneOpacity, parallaxStrength, marginScale };
}
