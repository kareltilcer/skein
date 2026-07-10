import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import s from './PageHeader.module.css';
import Eyebrow from './Eyebrow';
export default function PageHeader({ eyebrow, title, sub, right }) {
    return (_jsxs("div", { className: s.head, children: [_jsxs("div", { children: [eyebrow && _jsx(Eyebrow, { children: eyebrow }), _jsx("h1", { className: s.title, children: title }), sub && _jsx("p", { className: s.sub, children: sub })] }), right && _jsx("div", { className: s.right, children: right })] }));
}
