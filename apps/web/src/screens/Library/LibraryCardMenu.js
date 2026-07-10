import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../../components/ui/Icon';
import PartmenuPopover from '../../components/ui/PartmenuPopover';
import s from './LibraryView.module.css';
/** Tiny ⋯ button + PartmenuPopover used on every library card.  */
export default function LibraryCardMenu({ kindLabel, onEdit, onDelete }) {
    const { t } = useTranslation();
    const triggerRef = React.useRef(null);
    const [open, setOpen] = React.useState(false);
    return (_jsxs("div", { className: s.menuWrap, children: [_jsx("button", { ref: triggerRef, type: "button", className: [s.menuBtn, open ? s.menuBtnOpen : ''].filter(Boolean).join(' '), onClick: (e) => { e.stopPropagation(); setOpen((o) => !o); }, "aria-label": t('action.menu', 'Menu'), "aria-expanded": open, children: _jsx(Icon, { name: "more", size: 18 }) }), _jsx(PartmenuPopover, { open: open, onClose: () => setOpen(false), anchorRef: triggerRef, items: [
                    {
                        key: 'edit',
                        icon: 'edit',
                        label: t('library.menuEdit', { kind: kindLabel, defaultValue: `Edit ${kindLabel}` }),
                        onSelect: onEdit,
                    },
                    {
                        key: 'delete',
                        icon: 'trash',
                        label: t('library.menuDelete', { kind: kindLabel, defaultValue: `Delete ${kindLabel}` }),
                        onSelect: onDelete,
                        danger: true,
                        divider: true,
                    },
                ] })] }));
}
