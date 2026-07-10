import { jsx as _jsx } from "react/jsx-runtime";
import StitchGlyph from './StitchGlyph';
import s from './SwatchTile.module.css';
import { STITCH_MAP } from '@skein/shared';
export default function SwatchTile({ pattern, size = 88 }) {
    const ids = pattern.length >= 4 ? pattern.slice(0, 4) : [...pattern, ...pattern, ...pattern, ...pattern].slice(0, 4);
    return (_jsx("div", { className: s.swatch, style: { width: size, height: size }, children: ids.map((id, i) => (_jsx("div", { className: s.cell, children: _jsx(StitchGlyph, { symbol: STITCH_MAP[id]?.symbol ?? 'dot', size: size / 3.2 }) }, i))) }));
}
