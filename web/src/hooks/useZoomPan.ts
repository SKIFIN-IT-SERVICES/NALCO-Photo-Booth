import { useRef, useState } from "react";

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const STEP = 0.5;

function clampScale(scale: number) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

function distance(touches: React.TouchList): number {
  const [a, b] = [touches[0], touches[1]];
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

/**
 * Pinch-to-zoom + drag-to-pan for a single image, plus +/-/reset controls
 * for non-touch input. Works via touch events (pinch with two fingers,
 * drag with one) and mouse wheel + drag as a desktop fallback.
 */
export function useZoomPan() {
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const pinchStart = useRef<{ distance: number; scale: number } | null>(null);
  const dragStart = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);

  function reset() {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }

  function zoomIn() {
    setScale((s) => clampScale(s + STEP));
  }

  function zoomOut() {
    setScale((s) => {
      const next = clampScale(s - STEP);
      if (next === MIN_SCALE) setTranslate({ x: 0, y: 0 });
      return next;
    });
  }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    setScale((s) => {
      const next = clampScale(s - e.deltaY * 0.01);
      if (next === MIN_SCALE) setTranslate({ x: 0, y: 0 });
      return next;
    });
  }

  function onTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      pinchStart.current = { distance: distance(e.touches), scale };
      dragStart.current = null;
    } else if (e.touches.length === 1 && scale > 1) {
      dragStart.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        tx: translate.x,
        ty: translate.y,
      };
    }
  }

  function onTouchMove(e: React.TouchEvent) {
    if (e.touches.length === 2 && pinchStart.current) {
      e.preventDefault();
      const ratio = distance(e.touches) / pinchStart.current.distance;
      const next = clampScale(pinchStart.current.scale * ratio);
      setScale(next);
      if (next === MIN_SCALE) setTranslate({ x: 0, y: 0 });
    } else if (e.touches.length === 1 && dragStart.current) {
      e.preventDefault();
      const dx = e.touches[0].clientX - dragStart.current.x;
      const dy = e.touches[0].clientY - dragStart.current.y;
      setTranslate({ x: dragStart.current.tx + dx, y: dragStart.current.ty + dy });
    }
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (e.touches.length < 2) pinchStart.current = null;
    if (e.touches.length < 1) dragStart.current = null;
  }

  function onMouseDown(e: React.MouseEvent) {
    if (scale <= 1) return;
    dragStart.current = { x: e.clientX, y: e.clientY, tx: translate.x, ty: translate.y };
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setTranslate({ x: dragStart.current.tx + dx, y: dragStart.current.ty + dy });
  }

  function onMouseUp() {
    dragStart.current = null;
  }

  return {
    scale,
    translate,
    reset,
    zoomIn,
    zoomOut,
    handlers: { onWheel, onTouchStart, onTouchMove, onTouchEnd, onMouseDown, onMouseMove, onMouseUp },
  };
}
