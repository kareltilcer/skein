import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import s from './Tip.module.css';
import Icon from './Icon';
export default function Tip({ children, style }) {
    return (_jsxs("div", { className: s.tip, style: style, children: [_jsx("span", { className: s.icon, children: _jsx(Icon, { name: "bulb", size: 16 }) }), _jsx("div", { children: children })] }));
}
