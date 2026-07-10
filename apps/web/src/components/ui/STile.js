import { jsx as _jsx } from "react/jsx-runtime";
import { STITCH_MAP } from '@skein/shared';
import StitchGlyph from './StitchGlyph';
import s from './STile.module.css';
export default function STile({ id, w, h, active, dim, big }) {
    const def = STITCH_MAP[id];
    const cls = [s.tile, active ? s.active : '', dim ? s.dim : '', big ? s.big : ''].filter(Boolean).join(' ');
    const style = {};
    if (w)
        style.width = w;
    if (h)
        style.height = h;
    return (_jsx("div", { className: cls, style: style, title: def?.name ?? id, children: _jsx(StitchGlyph, { symbol: def?.symbol ?? 'dot', size: big ? 48 : 22 }) }));
}
