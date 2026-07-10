import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import s from './SearchField.module.css';
import Icon from './Icon';
export default function SearchField({ width, style, className, ...rest }) {
    return (_jsxs("label", { className: [s.wrap, className ?? ''].filter(Boolean).join(' '), style: { width, ...style }, children: [_jsx("span", { className: s.icon, children: _jsx(Icon, { name: "search", size: 18 }) }), _jsx("input", { type: "search", className: s.input, ...rest })] }));
}
