import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { computeDockIds, } from '@skein/shared';
import Icon from './Icon';
import StitchGlyph from './StitchGlyph';
import { useStitchMap } from '../../hooks/useStitchMap';
import s from './StitchPickerDock.module.css';
const ACCENT_TOKENS = ['brick', 'mustard', 'forest'];
/**
 * Bottom-pinned 6-tile stitch dock with an "All N stitches" overflow link.
 * Used by the wizard Step 3 + library builders.
 */
export default function StitchPickerDock({ craft, recents, target, onPick, onOpenPicker, }) {
    const { t } = useTranslation();
    const stitchMap = useStitchMap();
    const ids = computeDockIds(craft, recents, stitchMap);
    const dockStitches = ids.map((id) => stitchMap[id]).filter((d) => Boolean(d));
    const totalForCraft = Object.values(stitchMap).filter((d) => !!d && d.type === craft).length;
    return (_jsxs("div", { className: s.dock, children: [_jsxs("div", { className: s.head, children: [_jsxs("span", { className: s.caption, children: [t('stitchDock.tapToAdd', { target, defaultValue: `Tap to add to ${target}` }), " \u2731"] }), _jsxs("button", { type: "button", className: s.allLink, onClick: onOpenPicker, children: [_jsx("span", { children: t('stitchDock.allStitches', { count: totalForCraft, defaultValue: `All ${totalForCraft} stitches` }) }), _jsx(Icon, { name: "chevR", size: 12 })] })] }), _jsx("div", { className: s.tiles, children: dockStitches.map((stitch, i) => {
                    const token = ACCENT_TOKENS[i % ACCENT_TOKENS.length];
                    return (_jsxs("button", { type: "button", className: s.tile, onClick: () => onPick(stitch), children: [_jsx("span", { className: s.glyph, style: { background: `var(--color-${token})` }, children: _jsx(StitchGlyph, { symbol: stitch.symbol, color: "#FBF6EC", size: 16 }) }), _jsx("span", { className: s.abbr, children: stitch.abbr })] }, stitch.id));
                }) })] }));
}
