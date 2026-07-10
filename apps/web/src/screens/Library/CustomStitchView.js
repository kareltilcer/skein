import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCustomStitchStore, useSettingsStore, } from '@skein/shared';
import Modal from '../../components/ui/Modal';
import Chip from '../../components/ui/Chip';
import Section from '../../components/ui/Section';
import StitchGlyph from '../../components/ui/StitchGlyph';
import s from './BuilderView.module.css';
import csStyles from './CustomStitchView.module.css';
const SYMBOL_PALETTE = [
    'vline', 'vline2', 'vlineX', 'dash', 'vee', 'vee2',
    'triUp', 'plus', 'dot', 'ring', 'ringBig', 'oval',
    'cross', 'slashR', 'slashL', 'cableL', 'cableR',
    'tee', 'teeBar', 'teeBar2', 'fan', 'flower',
];
const TILE_COLORS = [
    { id: 'brick', label: 'Brick' },
    { id: 'mustard', label: 'Mustard' },
    { id: 'forest', label: 'Forest' },
    { id: 'brickDk', label: 'Maroon' },
    { id: 'mustardDk', label: 'Ochre' },
    { id: 'forestDk', label: 'Moss' },
];
const COUNTS_AS_OPTIONS = [
    { id: 'inc', label: 'Increase', math: '+1 st' },
    { id: 'one', label: 'One-to-one', math: '1 → 1' },
    { id: 'dec', label: 'Decrease', math: '−1 st' },
];
export default function CustomStitchView() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const defaultCraft = useSettingsStore((st) => st.defaultCraft);
    const addCustomStitch = useCustomStitchStore((st) => st.addCustomStitch);
    const [abbr, setAbbr] = React.useState('');
    const [name, setName] = React.useState('');
    const [craft, setCraft] = React.useState(defaultCraft);
    const [symbol, setSymbol] = React.useState('vline');
    const [tileColorKey, setTileColorKey] = React.useState('brick');
    const [countsAs, setCountsAs] = React.useState('one');
    const [notation, setNotation] = React.useState('');
    const ready = abbr.trim().length > 0 && name.trim().length > 0;
    function save() {
        if (!ready)
            return;
        addCustomStitch({
            abbr: abbr.trim(),
            name: name.trim(),
            type: craft,
            symbol,
            tileColorKey,
            countsAs,
            ...(notation.trim() ? { notation: notation.trim() } : {}),
        });
        navigate(-1);
    }
    const tileBg = `var(--color-${tileColorKey})`;
    return (_jsxs("div", { className: s.shell, children: [_jsx(Modal.DefinerHeader, { kind: t('customStitch.draft', 'Custom · draft'), ready: ready, onClose: () => navigate(-1), onSave: save, saveLabel: t('common.save', 'Save') }), _jsxs("div", { className: s.titleBlock, children: [_jsx("h1", { className: s.title, children: t('customStitch.title', 'Define a stitch') }), _jsx("p", { className: s.sub, children: t('customStitch.sub', "For anything not in the standard set — grandma's secret rib, your favorite bobble variation.") })] }), _jsxs("div", { className: s.scrollBody, children: [_jsxs("div", { className: csStyles.previewCard, children: [_jsxs("div", { className: csStyles.previewTile, style: { background: tileBg }, children: [_jsx(StitchGlyph, { symbol: symbol, color: "#FBF6EC", size: 48, strokeWidth: 2.4 }), _jsx("span", { className: csStyles.previewAbbr, children: abbr || '—' }), _jsx("span", { className: csStyles.previewBadge, children: "NEW" })] }), _jsxs("div", { className: csStyles.previewBody, children: [_jsx("span", { className: s.eyebrow, children: t('libraryCreate.livePreview', 'Live preview') }), _jsx("div", { className: [csStyles.previewName, name ? '' : csStyles.previewNameMute].filter(Boolean).join(' '), children: name || t('customStitch.untitled', 'Untitled stitch') }), _jsxs("div", { className: csStyles.previewChips, children: [_jsx("span", { className: csStyles.previewChip, children: abbr || '—' }), _jsx("span", { className: csStyles.previewChip, children: t(`craft.${craft}`, craft) }), _jsx("span", { className: csStyles.previewChip, children: COUNTS_AS_OPTIONS.find((o) => o.id === countsAs)?.math })] })] })] }), _jsx(Section, { label: t('customStitch.identityLabel', 'Abbreviation & name'), hint: t('customStitch.identityHint', 'shown in charts'), children: _jsxs("div", { className: csStyles.identityRow, children: [_jsxs("div", { className: csStyles.abbrCol, children: [_jsx("input", { className: csStyles.abbrInput, value: abbr, onChange: (e) => setAbbr(e.target.value.slice(0, 8)), placeholder: "fr", maxLength: 8, autoFocus: true }), _jsxs("span", { className: csStyles.counter, children: [abbr.length, "/8"] })] }), _jsxs("div", { className: csStyles.nameCol, children: [_jsx("input", { className: s.nameInput, value: name, onChange: (e) => setName(e.target.value.slice(0, 36)), placeholder: t('customStitch.namePlaceholder', "Fisherman's rib"), maxLength: 36 }), _jsxs("span", { className: csStyles.counter, children: [name.length, "/36"] })] })] }) }), _jsx(Section, { label: t('customStitch.craftLabel', 'Craft'), children: _jsxs("div", { className: s.craftRow, children: [_jsx(Chip, { active: craft === 'knit', icon: "needle", onClick: () => setCraft('knit'), children: t('craft.knit', 'Knit') }), _jsx(Chip, { active: craft === 'crochet', icon: "loop", onClick: () => setCraft('crochet'), children: t('craft.crochet', 'Crochet') })] }) }), _jsx(Section, { label: t('customStitch.symbolLabel', 'Chart symbol'), hint: t('customStitch.symbolHint', { count: SYMBOL_PALETTE.length, defaultValue: `${SYMBOL_PALETTE.length} marks` }), children: _jsx("div", { className: csStyles.symbolGrid, children: SYMBOL_PALETTE.map((sym) => {
                                const active = symbol === sym;
                                return (_jsx("button", { type: "button", className: [csStyles.symbolBtn, active ? csStyles.symbolBtnActive : ''].filter(Boolean).join(' '), onClick: () => setSymbol(sym), style: active ? { background: tileBg } : undefined, children: _jsx(StitchGlyph, { symbol: sym, color: active ? '#FBF6EC' : 'var(--color-inkSoft)', size: 20, strokeWidth: 2.1 }) }, sym));
                            }) }) }), _jsx(Section, { label: t('customStitch.tileColorLabel', 'Tile color'), children: _jsx("div", { className: csStyles.tileColorRow, children: TILE_COLORS.map((tc) => {
                                const active = tileColorKey === tc.id;
                                return (_jsxs("button", { type: "button", className: csStyles.tileColorBtn, onClick: () => setTileColorKey(tc.id), children: [_jsx("span", { className: [csStyles.tileColorSwatch, active ? csStyles.tileColorSwatchActive : ''].filter(Boolean).join(' '), style: { background: `var(--color-${tc.id})` } }), _jsx("span", { className: csStyles.tileColorLabel, children: tc.label })] }, tc.id));
                            }) }) }), _jsx(Section, { label: t('customStitch.countsAsLabel', 'Counts as'), hint: t('customStitch.countsAsHint', 'affects row totals'), children: _jsx("div", { className: csStyles.countsAsRow, children: COUNTS_AS_OPTIONS.map((opt) => {
                                const active = countsAs === opt.id;
                                return (_jsxs("button", { type: "button", className: [csStyles.countsAsBtn, active ? csStyles.countsAsBtnActive : ''].filter(Boolean).join(' '), onClick: () => setCountsAs(opt.id), children: [_jsx("span", { className: csStyles.countsAsName, children: opt.label }), _jsx("span", { className: csStyles.countsAsMath, children: opt.math })] }, opt.id));
                            }) }) }), _jsxs(Section, { label: t('customStitch.notationLabel', 'How to work it'), hint: t('customStitch.notationHint', 'optional · for your memory'), children: [_jsx("textarea", { className: csStyles.notationField, value: notation, onChange: (e) => setNotation(e.target.value.slice(0, 240)), placeholder: t('customStitch.notationPlaceholder', 'A line or two on how to make this stitch…'), maxLength: 240 }), _jsxs("div", { className: csStyles.counterRow, children: [_jsx("span", { children: t('customStitch.markdownNote', 'Plain text is fine.') }), _jsxs("span", { children: [notation.length, "/240"] })] })] }), _jsx("p", { className: s.signoff, children: t('customStitch.signoff', '✻ one of one, just yours ✻') })] })] }));
}
