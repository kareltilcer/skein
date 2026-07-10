import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function SkeinLogo({ size = 40, tone = 'theme', fg, accent }) {
    const ball = fg ?? (tone === 'onBrick' ? '#FBF6EC' :
        tone === 'mono' ? 'currentColor' :
            'var(--color-brick)');
    const strand = accent ?? (tone === 'mono' ? 'currentColor' :
        'var(--color-mustard)');
    // Trailing thread reads as the same yarn as the ball (matches design + mobile).
    const thread = ball;
    return (_jsxs("svg", { width: size, height: size, viewBox: "0 0 56 56", "aria-hidden": true, children: [_jsx("circle", { cx: "28", cy: "30", r: "18", fill: ball }), _jsx("path", { d: "M14 24 Q 28 18 42 24", stroke: strand, strokeWidth: "2.4", fill: "none", strokeLinecap: "round" }), _jsx("path", { d: "M12 32 Q 28 26 44 32", stroke: strand, strokeWidth: "2.4", fill: "none", strokeLinecap: "round" }), _jsx("path", { d: "M14 40 Q 28 34 42 40", stroke: strand, strokeWidth: "2.4", fill: "none", strokeLinecap: "round" }), _jsx("path", { d: "M20 16 Q 28 22 36 16", stroke: strand, strokeWidth: "2.4", fill: "none", strokeLinecap: "round" }), _jsx("path", { d: "M44 24 Q 52 18 50 10", stroke: thread, strokeWidth: "2.6", fill: "none", strokeLinecap: "round" }), _jsx("circle", { cx: "50", cy: "9", r: "2", fill: thread })] }));
}
