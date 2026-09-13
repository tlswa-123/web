import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { assetPath } from "../lib/asset-path";

type Turn = {
  direction: "next" | "prev";
  from: number;
  to: number;
  progress: number;
  settling?: "commit" | "cancel";
};

const clamp = (value: number) => Math.min(1, Math.max(0, value));

type Spread = {
  left: string;
  right: string;
  leftPage: number;
  rightPage: number;
};

// The selected pitch-deck pages are paired exactly as requested:
// 10/7, 11/12, 13/6, and 8/9 (left/right).
const SPREADS: Spread[] = [
  { left: assetPath("works/maipal/pages/page-10.png"), right: assetPath("works/maipal/pages/page-07.png"), leftPage: 10, rightPage: 7 },
  { left: assetPath("works/maipal/pages/page-11.png"), right: assetPath("works/maipal/pages/page-12.png"), leftPage: 11, rightPage: 12 },
  { left: assetPath("works/maipal/pages/page-13.png"), right: assetPath("works/maipal/pages/page-06.png"), leftPage: 13, rightPage: 6 },
  { left: assetPath("works/maipal/pages/page-08.png"), right: assetPath("works/maipal/pages/page-09.png"), leftPage: 8, rightPage: 9 },
];
const PAGE_COUNT = SPREADS.length;

function SpreadView({ spread }: { spread: Spread }) {
  return (
    <div className="page-turn-spread">
      <div className="page-turn-page left">
        <img src={spread.left} alt={`MaiPal 项目第 ${spread.leftPage} 页`} draggable={false} />
      </div>
      <div className="page-turn-gutter" aria-hidden="true" />
      <div className="page-turn-page right">
        <img src={spread.right} alt={`MaiPal 项目第 ${spread.rightPage} 页`} draggable={false} />
      </div>
    </div>
  );
}

export function PageTurnBook() {
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ direction: "next" | "prev"; startX: number; width: number; moved: number } | null>(null);
  const timerRef = useRef<number | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [turn, setTurn] = useState<Turn | null>(null);

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
  }, []);

  const finishTurn = (direction: "next" | "prev", commit: boolean) => {
    if (!turn) return;
    const next = turn.to;
    setTurn({ ...turn, direction, settling: commit ? "commit" : "cancel", progress: commit ? 1 : 0 });
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setTurn(null);
      if (commit) setPageIndex(next);
      timerRef.current = null;
    }, 560);
  };

  const startTurn = (direction: "next" | "prev") => {
    if (turn) return;
    const to = direction === "next" ? pageIndex + 1 : pageIndex - 1;
    if (to < 0 || to >= PAGE_COUNT) return;
    setTurn({ direction, from: pageIndex, to, progress: 0 });
  };

  const step = (direction: "next" | "prev") => {
    startTurn(direction);
    window.setTimeout(() => setTurn((active) => active && !active.settling ? { ...active, settling: "commit", progress: 1 } : active), 24);
    window.setTimeout(() => setPageIndex((current) => direction === "next" ? Math.min(PAGE_COUNT - 1, current + 1) : Math.max(0, current - 1)), 580);
    window.setTimeout(() => setTurn(null), 600);
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    step(event.key === "ArrowRight" ? "next" : "prev");
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const stage = stageRef.current;
    const zone = (event.target as HTMLElement).closest<HTMLElement>("[data-turn-zone]");
    if (!stage || !zone || event.button !== 0 || turn) return;
    const direction = zone.dataset.turnZone as "next" | "prev";
    const to = direction === "next" ? pageIndex + 1 : pageIndex - 1;
    if (to < 0 || to >= PAGE_COUNT) return;
    event.preventDefault();
    stage.setPointerCapture(event.pointerId);
    setTurn({ direction, from: pageIndex, to, progress: 0 });
    dragRef.current = { direction, startX: event.clientX, width: stage.clientWidth, moved: 0 };
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    drag.moved = Math.max(drag.moved, Math.abs(event.clientX - drag.startX));
    const raw = (drag.direction === "next" ? drag.startX - event.clientX : event.clientX - drag.startX) / Math.max(1, drag.width * .62);
    setTurn((active) => active && !active.settling ? { ...active, progress: clamp(raw) } : active);
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    const active = turn;
    if (!active) return;
    if (drag.moved < 7) finishTurn(drag.direction, true);
    else finishTurn(drag.direction, active.progress > .42);
    if (stageRef.current?.hasPointerCapture(event.pointerId)) stageRef.current.releasePointerCapture(event.pointerId);
  };

  const currentSpread = SPREADS[pageIndex];
  const turnFront = turn
    ? (turn.direction === "next" ? SPREADS[turn.from].right : SPREADS[turn.from].left)
    : null;
  const turnBack = turn
    ? (turn.direction === "next" ? SPREADS[turn.to].left : SPREADS[turn.to].right)
    : null;
  const rotation = turn ? (turn.direction === "next" ? -180 : 180) * turn.progress : 0;

  return (
    <div className="page-turn-book" aria-label="创业项目翻页册">
      <div className="page-turn-row">
        <button type="button" className="page-turn-arrow" onClick={() => step("prev")} disabled={pageIndex === 0 || Boolean(turn)} aria-label="上一页">←</button>
        <div ref={stageRef} className="page-turn-stage" tabIndex={0} role="region" aria-label="创业项目翻页册，使用左右方向键翻页" onKeyDown={onKeyDown} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
          <div className="page-turn-book-surface">
            <SpreadView spread={currentSpread} />
            {turn && (
              <div className={`page-turn-leaf ${turn.direction}`} style={{ transform: `rotateY(${rotation}deg)`, transition: turn.settling ? "transform 520ms cubic-bezier(.22,1,.36,1)" : undefined }}>
                <div className="page-turn-face front"><img src={turnFront ?? ""} alt="" draggable={false} /></div>
                <div className="page-turn-face back"><img src={turnBack ?? ""} alt="" draggable={false} /></div>
              </div>
            )}
            <button type="button" data-turn-zone="prev" className="page-turn-zone prev" aria-label="拖动到上一页" />
            <button type="button" data-turn-zone="next" className="page-turn-zone next" aria-label="拖动到下一页" />
          </div>
        </div>
        <button type="button" className="page-turn-arrow" onClick={() => step("next")} disabled={pageIndex === PAGE_COUNT - 1 || Boolean(turn)} aria-label="下一页">→</button>
      </div>
      <div className="page-turn-meta">
        <span>创业项目</span>
        <div className="page-turn-dots" aria-label="选择项目页">
          {SPREADS.map((spread, index) => <button key={`${spread.leftPage}-${spread.rightPage}`} type="button" aria-label={`打开第 ${index + 1} 组`} aria-current={index === pageIndex} onClick={() => { if (!turn) setPageIndex(index); }} />)}
        </div>
        <small>拖动纸张翻页</small>
      </div>
    </div>
  );
}
