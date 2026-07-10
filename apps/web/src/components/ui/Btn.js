import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import s from './Btn.module.css';
import Icon from './Icon';
export default function Btn({ variant = 'primary', size = 'md', icon, iconAfter, full, className, children, ...rest }) {
    const cls = [s.btn, s[variant], s[size], full ? s.full : '', className ?? ''].filter(Boolean).join(' ');
    return (_jsxs("button", { type: "button", ...rest, className: cls, children: [icon ? _jsx(Icon, { name: icon, size: size === 'lg' ? 22 : 18 }) : null, children, iconAfter ? _jsx(Icon, { name: iconAfter, size: size === 'lg' ? 22 : 18 }) : null] }));
}
