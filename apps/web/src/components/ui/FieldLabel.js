import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import s from './FieldLabel.module.css';
export default function FieldLabel({ children, hint, required }) {
    return (_jsxs("div", { className: s.label, children: [children, required && _jsx("span", { className: s.required, children: "\u2022" }), hint && _jsxs("span", { className: s.hint, children: ["\u00B7 ", hint] })] }));
}
