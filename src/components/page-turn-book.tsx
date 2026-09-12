import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";

type Turn = {
  direction: "next" | "prev";
  from: number;
  to: number;
  progress: number;
  settling?: "commit" | "cancel";
};

const PAGE_COUNT = 4;
const clamp = (value: number) => Math.min(1, Math.max(0, value));

function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;",
  })[character] ?? character);
}

function makeBlankSpread(index: number) {
  const page = String(index * 2 + 1).padStart(2, "0");
  const nextPage = String(index * 2 + 2).padStart(2, "0");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 920">
    <defs>
      <linearGradient id="paper" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f0e9e4"/><stop offset=".55" stop-color="#e3d8d7"/><stop offset="1" stop-color="#cfc0c3"/></linearGradient>
      <linearGradient id="left" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".13"/><stop offset=".84" stop-color="#432e43" stop-opacity=".02"/><stop offset="1" stop-color="#342536" stop-opacity=".16"/></linearGradient>
      <linearGradient id="right" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".11"/><stop offset=".84" stop-color="#432e43" stop-opacity=".02"/><stop offset="1" stop-color="#342536" stop-opacity=".14"/></linearGradient>
      <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".78" numOctaves="3" seed="${index + 3}"/><feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 .055 0"/></filter>
    </defs>
    <rect x="16" y="18" width="1368" height="884" rx="30" fill="url(#paper)"/>
    <rect x="16" y="18" width="684" height="884" rx="30" fill="url(#left)"/>
    <rect x="700" y="18" width="684" height="884" rx="30" fill="url(#right)"/>
    <rect x="16" y="18" width="1368" height="884" rx="30" filter="url(#grain)" opacity=".9"/>
    <path d="M700 18V902" stroke="#5c4558" stroke-opacity=".20"/><path d="M697 18V902" stroke="#fff" stroke-opacity=".22"/>
    <style>text{font-family:Inter,'PingFang SC','Microsoft YaHei',sans-serif;fill:#342836}.k{font-weight:700;letter-spacing:7px;fill:#8c6570}.n{font-weight:700;fill:#aa6f63}</style>
    <text x="642" y="830" text-anchor="end" class="n" font-size="18">${escapeXml(page)}</text><text x="1318" y="830" text-anchor="end" class="n" font-size="18">${escapeXml(nextPage)}</text>
    <path d="M82 650H315" stroke="#a56d66" stroke-width="2" stroke-opacity=".65"/><path d="M762 650H995" stroke="#a56d66" stroke-width="2" stroke-opacity=".65"/>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function PageTurnBook() {
  const pages = useMemo(() => Array.from({ length: PAGE_COUNT }, (_, index) => makeBlankSpread(index)), []);
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

  const currentImage = pages[pageIndex];
  const turnImage = turn ? pages[turn.from] : currentImage;
  const nextImage = turn ? pages[turn.to] : currentImage;
  const rotation = turn ? (turn.direction === "next" ? -180 : 180) * turn.progress : 0;

  return (
    <div className="page-turn-book" aria-label="创业项目翻页册">
      <div className="page-turn-row">
        <button type="button" className="page-turn-arrow" onClick={() => step("prev")} disabled={pageIndex === 0 || Boolean(turn)} aria-label="上一页">←</button>
        <div ref={stageRef} className="page-turn-stage" tabIndex={0} role="region" aria-label="创业项目翻页册，使用左右方向键翻页" onKeyDown={onKeyDown} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
          <div className="page-turn-book-surface">
            <img src={currentImage} alt="空白项目页" />
            {turn && (
              <div className={`page-turn-leaf ${turn.direction}`} style={{ transform: `rotateY(${rotation}deg)`, transition: turn.settling ? "transform 520ms cubic-bezier(.22,1,.36,1)" : undefined }}>
                <div className="page-turn-face front" style={{ backgroundImage: `url(${turnImage})` }} />
                <div className="page-turn-face back" style={{ backgroundImage: `url(${nextImage})` }} />
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
          {pages.map((_, index) => <button key={index} type="button" aria-label={`打开第 ${index + 1} 页`} aria-current={index === pageIndex} onClick={() => { if (!turn) setPageIndex(index); }} />)}
        </div>
        <small>拖动纸张翻页</small>
      </div>
    </div>
  );
}
