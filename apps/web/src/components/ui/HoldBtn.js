import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import s from './HoldBtn.module.css';
import Icon from './Icon';
/**
 * Press and hold the button until the ring completes — releases trigger
 * `onComplete`. Matches mobile's HoldButton UX. Pointer events so it works
 * for mouse, touch and pen.
 */
export default function HoldBtn({ label, sub, icon, holdMs = 1400, onComplete, width, disabled, variant = 'primary', ringColor, }) {
    const [progress, setProgress] = React.useState(0);
    const startedAt = React.useRef(null);
    const rafId = React.useRef(null);
    const stop = React.useCallback((complete) => {
        if (rafId.current != null)
            cancelAnimationFrame(rafId.current);
        rafId.current = null;
        startedAt.current = null;
        setProgress(0);
        if (complete)
            onComplete();
    }, [onComplete]);
    const tick = React.useCallback(() => {
        if (startedAt.current == null)
            return;
        const elapsed = performance.now() - startedAt.current;
        const p = Math.min(1, elapsed / holdMs);
        setProgress(p);
        if (p >= 1) {
            stop(true);
            return;
        }
        rafId.current = requestAnimationFrame(tick);
    }, [holdMs, stop]);
    const onDown = (e) => {
        if (disabled)
            return;
        e.preventDefault();
        e.target.setPointerCapture(e.pointerId);
        startedAt.current = performance.now();
        rafId.current = requestAnimationFrame(tick);
    };
    const onCancel = () => stop(false);
    // SVG ring math — circumference of a rounded-rect border approximated as a
    // single dasharray on a circle path. Simpler than a perimeter path and good
    // enough for the visual cue. Radius 60 gives ~377px circumference; we don't
    // need pixel-perfect since this is a hint, not a progress bar.
    const C = 2 * Math.PI * 60;
    const dash = C * progress;
    const cls = [s.btn, variant === 'ghost' ? s.btnGhost : ''].filter(Boolean).join(' ');
    const stroke = ringColor ?? 'var(--color-mustard)';
    return (_jsxs("button", { type: "button", className: cls, style: width ? { width } : undefined, onPointerDown: onDown, onPointerUp: onCancel, onPointerCancel: onCancel, onPointerLeave: onCancel, disabled: disabled, children: [_jsx("svg", { className: s.ring, viewBox: "0 0 200 80", preserveAspectRatio: "none", children: _jsx("rect", { x: "2", y: "2", width: "196", height: "76", rx: "22", fill: "none", stroke: stroke, strokeWidth: "3", strokeDasharray: `${dash} ${C - dash}`, strokeLinecap: "round", pathLength: C }) }), _jsxs("span", { className: s.label, children: [icon ? _jsx(Icon, { name: icon, size: 28 }) : null, label && _jsx("span", { children: label }), sub && _jsx("span", { className: s.sub, children: sub })] })] }));
}
