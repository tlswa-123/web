import { useGlobalCamera } from "../hooks/use-global-camera";
import { useMouseParallax } from "../hooks/use-mouse-parallax";
import { SceneStage } from "./scene-stage";
import { STAGE_HEIGHT_CSS } from "../lib/camera";

/**
 * 全局背景层 —— 整站唯一实例，fixed 定位挂在最外层，从加载到结束不会
 * 被卸载重建。首页→简历→作品的镜头变化，全部是这同一个 DOM 节点的
 * transform 参数随 scrollTop 连续变化。
 *
 * 【为什么必须做成唯一实例】之前每个 section 各自内嵌一份 sticky+SceneStage，
 * 即使参数算得再精确，也是三个独立的 React 组件实例、三个独立的 <img>
 * 标签——切换时浏览器需要"卸载一个、挂载另一个"，哪怕视觉参数完全相同，
 * 用户也会感知到"变了一下"（重绘、可能的裁切边缘对不齐、滚动条与内容的
 * 实际位置偏差都会放大这种感觉）。做成 fixed 全局唯一实例后，这些问题
 * 从物理上不存在——background 从始至终就是同一个元素。
 *
 * 各 section 不再各自渲染背景，只需要放透明内容（卡片、画廊等）叠在上面，
 * 用 z-index 让内容显示在这个 fixed 背景之上即可。
 */
export function GlobalBackground() {
  const cam = useGlobalCamera();
  const stageRef = useMouseParallax<HTMLDivElement>();

  return (
    <div
      className="fixed inset-0 z-0 overflow-hidden bg-[#12111f]"
      style={{ opacity: cam.sceneOpacity }}
      aria-hidden
    >
      <SceneStage
        ref={stageRef}
        stageHeight={STAGE_HEIGHT_CSS}
        txPct={cam.txPct}
        tyPct={cam.tyPct}
        scale={cam.scale}
        sunDropPct={cam.sunDropPct}
        mouseParallax={cam.parallaxStrength > 0}
        marginScale={cam.marginScale}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundColor: `rgba(18, 17, 31, ${cam.darkOpacity})` }}
      />
    </div>
  );
}
