import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import Icon from './Icon';
import s from './PartmenuPopover.module.css';
/**
 * Animated rounded-card popover with a pointer notch — used for library item
 * overflow (Edit / Delete) and the knit-screen PartMenu. Click-outside dismisses;
 * Escape dismisses.
 */
export default function PartmenuPopover({ open, onClose, anchorRef, items, minWidth = 200, notchAlign = 'right', }) {
    const popoverRef = React.useRef(null);
    React.useEffect(() => {
        if (!open)
            return;
        function onPointer(e) {
            const t = e.target;
            if (popoverRef.current?.contains(t))
                return;
            if (anchorRef.current?.contains(t))
                return;
            onClose();
        }
        function onKey(e) {
            if (e.key === 'Escape')
                onClose();
        }
        document.addEventListener('pointerdown', onPointer, true);
        window.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('pointerdown', onPointer, true);
            window.removeEventListener('keydown', onKey);
        };
    }, [open, onClose, anchorRef]);
    if (!open)
        return null;
    return (_jsxs("div", { ref: popoverRef, className: [s.popover, notchAlign === 'left' ? s.notchLeft : s.notchRight].join(' '), style: { minWidth }, role: "menu", children: [_jsx("span", { className: s.notch, "aria-hidden": true }), items.map((item, idx) => (_jsxs(React.Fragment, { children: [item.divider && idx > 0 && _jsx("div", { className: s.divider, "aria-hidden": true }), _jsxs("button", { type: "button", role: "menuitem", onClick: () => { item.onSelect(); onClose(); }, className: [
                            s.item,
                            item.danger ? s.itemDanger : '',
                            item.accent ? s.itemAccent : '',
                        ].filter(Boolean).join(' '), children: [_jsx("span", { className: s.itemIcon, children: _jsx(Icon, { name: item.icon, size: 17 }) }), _jsx("span", { className: s.itemLabel, children: item.label })] })] }, item.key)))] }));
}
