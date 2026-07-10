import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import s from './Modal.module.css';
import Icon from './Icon';
import IconBtn from './IconBtn';
function ModalRoot({ open, onClose, title, children, footer, width, align = 'center', dismissOnScrimClick = true, className, }) {
    React.useEffect(() => {
        if (!open)
            return;
        function onKey(e) {
            if (e.key === 'Escape')
                onClose();
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);
    if (!open)
        return null;
    const scrimClass = [
        s.scrim,
        align === 'bottom' ? s.scrimBottom : '',
        align === 'top' ? s.scrimTop : '',
    ].filter(Boolean).join(' ');
    const modalClass = [
        s.modal,
        align === 'bottom' ? s.sheet : '',
        className ?? '',
    ].filter(Boolean).join(' ');
    return (_jsx("div", { className: scrimClass, onClick: dismissOnScrimClick ? onClose : undefined, role: "presentation", children: _jsxs("div", { className: modalClass, style: width ? { maxWidth: width } : undefined, onClick: (e) => e.stopPropagation(), role: "dialog", "aria-modal": true, children: [align === 'bottom' && _jsx("div", { className: s.sheetHandle, "aria-hidden": true }), title !== undefined && (_jsxs("div", { className: s.head, children: [_jsx("div", { className: s.title, children: title }), _jsx(IconBtn, { name: "x", tone: "plain", onClick: onClose, "aria-label": "Close" })] })), _jsx("div", { className: s.body, children: children }), footer && _jsx("div", { className: s.foot, children: footer })] }) }));
}
function DangerHeader({ title, caption, icon = 'trash' }) {
    return (_jsxs("div", { className: s.dangerHead, children: [_jsx("div", { className: s.dangerDisc, children: _jsx(Icon, { name: icon, size: 26, color: "#FBF6EC" }) }), _jsx("div", { className: s.dangerTitle, children: title }), caption && _jsx("div", { className: s.dangerCaption, children: caption })] }));
}
function DefinerHeader({ kind, ready, onClose, onSave, saveLabel = 'Save' }) {
    return (_jsxs("div", { className: s.definerHead, children: [_jsx(IconBtn, { name: "x", tone: "plain", onClick: onClose, "aria-label": "Close" }), _jsxs("span", { className: s.draftPill, children: [kind, " \u00B7 draft"] }), _jsx("button", { type: "button", onClick: ready ? onSave : undefined, disabled: !ready, className: s.definerSave, children: saveLabel })] }));
}
// ─── Body and Footer slots — used when the default head/foot props don't fit ─
function Body({ children, className }) {
    return _jsx("div", { className: [s.body, className ?? ''].filter(Boolean).join(' '), children: children });
}
function Footer({ children, className }) {
    return _jsx("div", { className: [s.foot, className ?? ''].filter(Boolean).join(' '), children: children });
}
const Modal = ModalRoot;
Modal.DangerHeader = DangerHeader;
Modal.DefinerHeader = DefinerHeader;
Modal.Body = Body;
Modal.Footer = Footer;
export default Modal;
