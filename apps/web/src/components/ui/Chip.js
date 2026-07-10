import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import s from './Chip.module.css';
import Icon from './Icon';
export default function Chip({ active, tone = 'default', size = 'md', icon, className, children, ...rest }) {
    const cls = [
        s.chip,
        active ? s.active : '',
        tone === 'brick' ? s.brick : '',
        size === 'lg' ? s.lg : '',
        className ?? '',
    ].filter(Boolean).join(' ');
    return (_jsxs("button", { type: "button", ...rest, className: cls, children: [icon ? _jsx(Icon, { name: icon, size: 14 }) : null, children] }));
}
