import type { RefObject } from "react";

export interface GestureCallbacks {
  /** A finger went down on empty canvas; (x, y) in canvas coords */
  onTap: (x: number, y: number) => void;
  /** A finger went down on a body; index = body index in the rendered list */
  onBodyDown: (index: number, x: number, y: number) => void;
  /** Finger moved while a body was selected */
  onBodyDrag: (index: number, x: number, y: number) => void;
  /** Finger released; if dragVx/dragVy are nonzero the user dragged from a body to set velocity */
  onBodyUp: (index: number, dragVx: number, dragVy: number) => void;
  /** Two-finger pinch — scale relative to start of pinch */
  onPinch: (scale: number, centerX: number, centerY: number) => void;
  /** Two-finger pan — delta in canvas px */
  onPan: (dx: number, dy: number) => void;
  /** Long-press on a body (≥ 500ms hold without movement) */
  onLongPress: (index: number, x: number, y: number) => void;
}

export interface HitTest {
  /** Returns the body index at canvas (x, y), or -1 for empty */
  hit: (x: number, y: number) => number;
}

const LONG_PRESS_MS = 500;
const TAP_MOVE_THRESHOLD_PX = 6;

export function attachGestures(
  el: HTMLElement,
  hitTest: HitTest,
  cb: GestureCallbacks,
): () => void {
  let activeBody = -1;
  let downX = 0;
  let downY = 0;
  let startX = 0;
  let startY = 0;
  let moved = false;
  let longPressTimer: ReturnType<typeof setTimeout> | null = null;

  // Two-finger state
  let pinchStartDist = 0;
  let pinchStartScale = 1;
  let lastPan = { x: 0, y: 0 };

  function rectCoords(touch: { clientX: number; clientY: number }) {
    const r = el.getBoundingClientRect();
    return { x: touch.clientX - r.left, y: touch.clientY - r.top };
  }

  function onPointerDown(e: PointerEvent) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    el.setPointerCapture(e.pointerId);
    const { x, y } = rectCoords(e);
    downX = startX = x;
    downY = startY = y;
    moved = false;
    activeBody = hitTest.hit(x, y);
    if (activeBody >= 0) {
      cb.onBodyDown(activeBody, x, y);
      longPressTimer = setTimeout(() => {
        if (!moved && activeBody >= 0) cb.onLongPress(activeBody, x, y);
      }, LONG_PRESS_MS);
    }
  }

  function onPointerMove(e: PointerEvent) {
    const { x, y } = rectCoords(e);
    const dx = x - downX;
    const dy = y - downY;
    if (!moved && Math.hypot(dx, dy) > TAP_MOVE_THRESHOLD_PX) {
      moved = true;
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    }
    if (activeBody >= 0 && moved) {
      cb.onBodyDrag(activeBody, x, y);
    }
  }

  function onPointerUp(e: PointerEvent) {
    const { x, y } = rectCoords(e);
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
    if (activeBody >= 0) {
      const dragVx = moved ? (x - startX) * 0.02 : 0;
      const dragVy = moved ? (y - startY) * 0.02 : 0;
      cb.onBodyUp(activeBody, dragVx, dragVy);
    } else if (!moved) {
      cb.onTap(x, y);
    }
    activeBody = -1;
  }

  // Two-finger gestures via Touch events (separate from pointer for simplicity).
  function onTouchStart(e: TouchEvent) {
    if (e.touches.length === 2) {
      const a = e.touches[0]!;
      const b = e.touches[1]!;
      pinchStartDist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      pinchStartScale = 1;
      lastPan = { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 };
      e.preventDefault();
    }
  }

  function onTouchMove(e: TouchEvent) {
    if (e.touches.length === 2 && pinchStartDist > 0) {
      const a = e.touches[0]!;
      const b = e.touches[1]!;
      const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      const scale = (d / pinchStartDist) * pinchStartScale;
      const cx = (a.clientX + b.clientX) / 2;
      const cy = (a.clientY + b.clientY) / 2;
      cb.onPinch(scale, cx, cy);
      cb.onPan(cx - lastPan.x, cy - lastPan.y);
      lastPan = { x: cx, y: cy };
      e.preventDefault();
    }
  }

  function onTouchEnd() {
    pinchStartDist = 0;
  }

  el.addEventListener("pointerdown", onPointerDown);
  el.addEventListener("pointermove", onPointerMove);
  el.addEventListener("pointerup", onPointerUp);
  el.addEventListener("pointercancel", onPointerUp);
  el.addEventListener("touchstart", onTouchStart, { passive: false });
  el.addEventListener("touchmove", onTouchMove, { passive: false });
  el.addEventListener("touchend", onTouchEnd);
  // Browser default pinch-zoom would fight ours.
  el.style.touchAction = "none";

  return () => {
    el.removeEventListener("pointerdown", onPointerDown);
    el.removeEventListener("pointermove", onPointerMove);
    el.removeEventListener("pointerup", onPointerUp);
    el.removeEventListener("pointercancel", onPointerUp);
    el.removeEventListener("touchstart", onTouchStart);
    el.removeEventListener("touchmove", onTouchMove);
    el.removeEventListener("touchend", onTouchEnd);
    if (longPressTimer) clearTimeout(longPressTimer);
  };
}

// reasonable default body radius (px) used by hit-testing
export const BODY_HIT_RADIUS_PX = 20;
