import { jsx as _jsx } from "react/jsx-runtime";
import s from './IconBtn.module.css';
import Icon from './Icon';
export default function IconBtn({ name, tone = 'soft', size = 'md', iconSize, color, className, ...rest }) {
    const cls = [s.btn, s[tone], s[size], className ?? ''].filter(Boolean).join(' ');
    return (_jsx("button", { type: "button", ...rest, className: cls, children: _jsx(Icon, { name: name, size: iconSize ?? (size === 'lg' ? 24 : size === 'sm' ? 16 : 20), color: color }) }));
}
