import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import s from './Section.module.css';
/** Form section: mono uppercase eyebrow, optional REQUIRED badge, optional right-aligned hint, then content. */
export default function Section({ label, hint, required, children, className }) {
    return (_jsxs("section", { className: [s.section, className ?? ''].filter(Boolean).join(' '), children: [_jsxs("header", { className: s.head, children: [_jsxs("div", { className: s.labelRow, children: [_jsx("span", { className: s.label, children: label }), required && (_jsxs("span", { className: s.required, children: [_jsx("span", { className: s.requiredStar, children: "\u2731" }), " REQUIRED"] }))] }), hint && _jsx("span", { className: s.hint, children: hint })] }), children] }));
}
