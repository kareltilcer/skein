import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import s from './Segmented.module.css';
export default function Segmented({ items, value, onChange, size = 'md' }) {
    const wrapCls = [s.wrap, size === 'lg' ? s.lg : ''].filter(Boolean).join(' ');
    return (_jsx("div", { className: wrapCls, role: "tablist", children: items.map((it) => (_jsxs("button", { type: "button", role: "tab", "aria-selected": value === it.id, className: [s.item, value === it.id ? s.active : ''].filter(Boolean).join(' '), onClick: () => onChange(it.id), children: [it.label, typeof it.count === 'number' && _jsx("span", { className: s.count, children: it.count })] }, it.id))) }));
}
