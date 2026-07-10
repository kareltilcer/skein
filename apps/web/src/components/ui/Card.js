import { jsx as _jsx } from "react/jsx-runtime";
import s from './Card.module.css';
export default function Card({ pad = 'md', hover, active, onClick, className, children, as, href, style, }) {
    const padCls = pad === 'sm' ? s.padSm : pad === 'lg' ? s.padLg : s.padMd;
    const cls = [s.card, padCls, hover ? s.hover : '', active ? s.active : '', onClick ? s.button : '', className ?? ''].filter(Boolean).join(' ');
    if (as === 'a' || href) {
        return _jsx("a", { href: href, className: cls, style: style, onClick: onClick, children: children });
    }
    if (onClick || as === 'button') {
        return _jsx("button", { type: "button", className: cls, style: style, onClick: onClick, children: children });
    }
    return _jsx("div", { className: cls, style: style, children: children });
}
