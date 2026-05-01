import type { RefObject } from "react";

export interface GestureCallbacks {
  /** A finger went down on empty canvas and lifted without moving — instant place */
  onTap: (x: number, y: number) => void;
  /** A finger went down on a body; index = body index in the rendered list */
  onBodyDown: (index: number, x: number, y: number) => void;
  /** Finger moved while a body was selected */
  onBodyDrag: (index: number, x: number, y: number) => void;
  /** Finger released; if dragVx/dragVy are nonzero the user dragged from a body to set velocity */
  onBodyUp: (index: number, dragVx: number, dragVy: number) => void;
  /**
   * Pointerdown on empty canvas → drag → currently in motion. (downX, downY)
   * is the anchor where the body will spawn; (curX, curY) is the live pointer.
   * Use this to render a ghost body + velocity arrow while the user aims.
   */
  onPlaceDrag: (downX: number, downY: number, curX: number, curY: number) => void;
  /**
   * Pointerup ending a drag that started on empty canvas. dragVx/dragVy use
   * the same px→world scaling convention as `onBodyUp`. Caller spawns a body
   * at (downX, downY) with that velocity. Angry-Birds-style aim-and-launch.
   */
  onPlaceUp: (downX: number, downY: number, dragVx: number, dragVy: number) => void;
  /** A drag-from-empty was cancelled (e.g., a second finger started a pinch). */
  onPlaceCancel: () => void;
  /**
   * Two-finger pinch frame delta — multiplicative ratio for the camera's
   * current scale (not relative to pinch start). Apply as
   * `cam.scale *= ratio`. This way pinching never overwrites the user's
   * existing wheel-zoom state.
   */
  onPinch: (ratio: number, centerX: number, centerY: number) => void;
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
  let lastPinchDist = 0;
  let twoFingerActive = false;
  let lastPan = { x: 0, y: 0 };

  function rectCoords(touch: { clientX: number; clientY: number }) {
    const r = el.getBoundingClientRect();
    return { x: touch.clientX - r.left, y: touch.clientY - r.top };
  }

  // Was the most-recent pointerdown on empty canvas? Used to drive the
  // Angry-Birds-style "aim then launch" placement gesture.
  let emptyDown = false;

  function onPointerDown(e: PointerEvent) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    el.setPointerCapture(e.pointerId);
    const { x, y } = rectCoords(e);
    downX = startX = x;
    downY = startY = y;
    moved = false;
    activeBody = hitTest.hit(x, y);
    emptyDown = activeBody < 0;
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
    } else if (emptyDown && moved) {
      cb.onPlaceDrag(downX, downY, x, y);
    }
  }

  function onPointerUp(e: PointerEvent) {
    const { x, y } = rectCoords(e);
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
    // If a 2-finger pinch is/was active, swallow the trailing pointerup —
    // otherwise it fires onTap (placing an accidental body) or onBodyUp (with
    // a bogus drag velocity).
    if (twoFingerActive) {
      if (emptyDown && moved) cb.onPlaceCancel();
      activeBody = -1;
      emptyDown = false;
      moved = false;
      return;
    }
    if (activeBody >= 0) {
      const dragVx = moved ? (x - startX) * 0.02 : 0;
      const dragVy = moved ? (y - startY) * 0.02 : 0;
      cb.onBodyUp(activeBody, dragVx, dragVy);
    } else if (emptyDown && moved) {
      // Drag-from-empty: spawn a body at the down-point with derived velocity.
      const dragVx = (x - startX) * 0.02;
      const dragVy = (y - startY) * 0.02;
      cb.onPlaceUp(startX, startY, dragVx, dragVy);
    } else if (!moved) {
      cb.onTap(x, y);
    }
    activeBody = -1;
    emptyDown = false;
  }

  // Two-finger gestures via Touch events (separate from pointer for simplicity).
  function onTouchStart(e: TouchEvent) {
    if (e.touches.length === 2) {
      const a = e.touches[0]!;
      const b = e.touches[1]!;
      pinchStartDist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      lastPinchDist = pinchStartDist;
      twoFingerActive = true;
      // Cancel any in-flight single-finger work — otherwise the first finger's
      // pointerup at the end of the pinch fires onTap or onBodyUp and either
      // places a body or applies a phantom velocity.
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
      if (emptyDown && moved) cb.onPlaceCancel();
      emptyDown = false;
      activeBody = -1;
      lastPan = { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 };
      e.preventDefault();
    }
  }

  function onTouchMove(e: TouchEvent) {
    if (e.touches.length === 2 && pinchStartDist > 0) {
      const a = e.touches[0]!;
      const b = e.touches[1]!;
      const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      // Per-frame multiplicative ratio: how much the pinch grew/shrunk since
      // the previous touchmove. Lets the canvas multiply its own current scale
      // and preserve any prior wheel/pinch zoom.
      const ratio = lastPinchDist > 0 ? d / lastPinchDist : 1;
      lastPinchDist = d;
      const cx = (a.clientX + b.clientX) / 2;
      const cy = (a.clientY + b.clientY) / 2;
      cb.onPinch(ratio, cx, cy);
      cb.onPan(cx - lastPan.x, cy - lastPan.y);
      lastPan = { x: cx, y: cy };
      e.preventDefault();
    }
  }

  function onTouchEnd(e: TouchEvent) {
    if (e.touches.length < 2) {
      pinchStartDist = 0;
      lastPinchDist = 0;
    }
    if (e.touches.length === 0) {
      // Last finger up. Suppress any pointerup that may still fire after.
      twoFingerActive = false;
    }
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
