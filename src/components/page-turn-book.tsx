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
  const turnRef = useRef<Turn | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [turn, setTurn] = useState<Turn | null>(null);

  useEffect(() => {
    turnRef.current = turn;
  }, [turn]);

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
  }, []);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const finishTurn = (active: Turn, commit: boolean) => {
    const settled: Turn = { ...active, settling: commit ? "commit" : "cancel", progress: commit ? 1 : 0 };
    turnRef.current = settled;
    setTurn(settled);
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      if (commit) setPageIndex(active.to);
      turnRef.current = null;
      setTurn(null);
      timerRef.current = null;
    }, 540);
  };

  const startTurn = (direction: "next" | "prev") => {
    if (turnRef.current) return false;
    const to = direction === "next" ? pageIndex + 1 : pageIndex - 1;
    if (to < 0 || to >= PAGE_COUNT) return false;
    const nextTurn: Turn = { direction, from: pageIndex, to, progress: 0 };
    turnRef.current = nextTurn;
    setTurn(nextTurn);
    return true;
  };

  const step = (direction: "next" | "prev") => {
    if (!startTurn(direction)) return;
    // Start the CSS rotation on the next frame so a click still has a visible
    // page lift instead of jumping straight to the settled spread.
    requestAnimationFrame(() => {
      const active = turnRef.current;
      if (!active || active.direction !== direction || active.settling) return;
      const settled: Turn = { ...active, settling: "commit", progress: 1 };
      turnRef.current = settled;
      setTurn(settled);
    });
    clearTimer();
    const target = direction === "next" ? pageIndex + 1 : pageIndex - 1;
    timerRef.current = window.setTimeout(() => {
      setPageIndex(target);
      turnRef.current = null;
      setTurn(null);
      timerRef.current = null;
    }, 540);
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    step(event.key === "ArrowRight" ? "next" : "prev");
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const stage = stageRef.current;
    const zone = (event.target as HTMLElement).closest<HTMLElement>("[data-turn-zone]");
    if (!stage || !zone || event.button !== 0 || turnRef.current) return;
    const direction = zone.dataset.turnZone as "next" | "prev";
    const to = direction === "next" ? pageIndex + 1 : pageIndex - 1;
    if (to < 0 || to >= PAGE_COUNT) return;
    event.preventDefault();
    stage.setPointerCapture(event.pointerId);
    const nextTurn: Turn = { direction, from: pageIndex, to, progress: 0 };
    turnRef.current = nextTurn;
    setTurn(nextTurn);
    dragRef.current = { direction, startX: event.clientX, width: stage.clientWidth, moved: 0 };
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) {
      const stage = stageRef.current;
      if (stage) {
        const rect = stage.getBoundingClientRect();
        const nx = Math.max(-1, Math.min(1, (event.clientX - (rect.left + rect.width / 2)) / Math.max(1, rect.width * .62)));
        const ny = Math.max(-1, Math.min(1, (event.clientY - (rect.top + rect.height / 2)) / Math.max(1, rect.height * .9)));
        stage.style.setProperty("--book-rx", `${(-ny * 3.2).toFixed(2)}deg`);
        stage.style.setProperty("--book-ry", `${(nx * 5.2).toFixed(2)}deg`);
      }
      return;
    }
    drag.moved = Math.max(drag.moved, Math.abs(event.clientX - drag.startX));
    const raw = (drag.direction === "next" ? drag.startX - event.clientX : event.clientX - drag.startX) / Math.max(1, drag.width * .62);
    setTurn((active) => {
      if (!active || active.settling) return active;
      const next = { ...active, progress: clamp(raw) };
      turnRef.current = next;
      return next;
    });
  };

  const resetTilt = () => {
    const stage = stageRef.current;
    if (!stage || dragRef.current) return;
    stage.style.setProperty("--book-rx", "0deg");
    stage.style.setProperty("--book-ry", "0deg");
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    const active = turnRef.current;
    if (!active) return;
    if (drag.moved < 7) finishTurn(active, true);
    else finishTurn(active, active.progress > .42);
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
        <div ref={stageRef} className="page-turn-stage" tabIndex={0} role="region" aria-label="创业项目翻页册，使用左右方向键翻页" onKeyDown={onKeyDown} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onPointerLeave={resetTilt}>
          <div className="page-turn-book-surface">
            <SpreadView spread={currentSpread} />
            <div className="page-turn-paper-shine" aria-hidden="true" />
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
