import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React from 'react';
import { useTranslation } from 'react-i18next';
import { STITCH_PICKER_GROUPS, PICKER_FILTER_CHIPS, getPickerGroups, } from '@skein/shared';
import Modal from './Modal';
import Btn from './Btn';
import Icon from './Icon';
import StitchGlyph from './StitchGlyph';
import { useStitchMap } from '../../hooks/useStitchMap';
import s from './StitchPickerModal.module.css';
const PALETTE_TOKENS = ['brick', 'mustard', 'forest', 'brickDk'];
export default function StitchPickerModal({ open, onClose, onSelect, onDefineCustom, defaultCraftFilter, }) {
    const { t } = useTranslation();
    const stitchMap = useStitchMap();
    const [filter, setFilter] = React.useState(defaultCraftFilter ?? 'all');
    // Reset filter each time the picker opens, so the user lands on their craft.
    React.useEffect(() => {
        if (open)
            setFilter(defaultCraftFilter ?? 'all');
    }, [open, defaultCraftFilter]);
    const visibleGroups = React.useMemo(() => getPickerGroups(filter), [filter]);
    const totalCount = React.useMemo(() => STITCH_PICKER_GROUPS.reduce((a, g) => a + g.ids.length, 0), []);
    return (_jsxs(Modal, { open: open, onClose: onClose, align: "bottom", width: 680, children: [_jsxs("div", { className: s.head, children: [_jsxs("div", { children: [_jsx("h2", { className: s.title, children: t('stitchPicker.title', 'Pick a stitch') }), _jsx("div", { className: s.sub, children: t('stitchPicker.sub', 'Tap to add · {{count}} predefined + custom', { count: totalCount }) })] }), _jsx("button", { type: "button", onClick: onClose, className: s.closeBtn, "aria-label": t('action.close', 'Close'), children: _jsx(Icon, { name: "x", size: 22 }) })] }), _jsx("div", { className: s.filters, children: PICKER_FILTER_CHIPS.map((chip) => {
                    const active = filter === chip.id;
                    return (_jsx("button", { type: "button", onClick: () => setFilter(chip.id), className: [s.filterChip, active ? s.filterChipActive : ''].filter(Boolean).join(' '), children: t(`stitchPicker.filter.${chip.id}`, chip.label) }, chip.id));
                }) }), _jsx(Modal.Body, { className: s.gridBody, children: filter === 'custom' ? (_jsxs("div", { className: s.customRoll, children: [_jsx("h3", { className: s.customRollTitle, children: t('stitchPicker.customTitle', 'Roll your own.') }), _jsx("p", { className: s.customRollBody, children: t('stitchPicker.customBody', "Got a stitch that's not in the list? Define it once, reuse it forever.") }), _jsx(Btn, { icon: "plus", size: "md", onClick: () => { onDefineCustom?.(); onClose(); }, children: t('stitchPicker.defineCta', 'Define a custom stitch') })] })) : (_jsxs(_Fragment, { children: [visibleGroups.map((group) => {
                            const items = group.ids.map((id) => stitchMap[id]).filter((d) => Boolean(d));
                            if (items.length === 0)
                                return null;
                            return (_jsxs("section", { className: s.group, children: [_jsxs("header", { className: s.groupHead, children: [_jsx("span", { className: s.groupLabel, children: group.label }), _jsx("span", { className: s.groupCount, children: items.length })] }), _jsx("div", { className: s.tiles, children: items.map((stitch, i) => {
                                            const token = PALETTE_TOKENS[i % PALETTE_TOKENS.length];
                                            return (_jsxs("button", { type: "button", className: s.tile, onClick: () => { onSelect(stitch); onClose(); }, children: [_jsx("span", { className: s.tileGlyph, style: { background: `var(--color-${token})` }, children: _jsx(StitchGlyph, { symbol: stitch.symbol, color: "#FBF6EC", size: 20 }) }), _jsx("span", { className: s.tileAbbr, children: stitch.abbr })] }, stitch.id));
                                        }) })] }, group.id));
                        }), onDefineCustom && (_jsxs("button", { type: "button", className: s.defineCustom, onClick: () => { onDefineCustom(); onClose(); }, children: [_jsx(Icon, { name: "plus", size: 14 }), _jsx("span", { children: t('stitchPicker.defineCta', 'Define a custom stitch') })] }))] })) })] }));
}
