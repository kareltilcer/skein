import { jsx as _jsx } from "react/jsx-runtime";
import s from './Eyebrow.module.css';
export default function Eyebrow({ children, color, style }) {
    return _jsx("div", { className: s.eyebrow, style: { ...(color ? { color } : null), ...style }, children: children });
}
