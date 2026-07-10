import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { stitchHue } from '@skein/shared';
import { useStitchMap } from '../../hooks/useStitchMap';
import { useTheme } from '../../theme/ThemeProvider';
import StitchGlyph from './StitchGlyph';
import s from './StitchTile.module.css';
export default function StitchTile({ id, state = 'normal', onClick, size = 28 }) {
    const { t } = useTranslation();
    const { colors } = useTheme();
    const stitchMap = useStitchMap();
    const def = stitchMap[id];
    const symbol = def?.symbol ?? 'dot';
    const abbr = def?.abbr ?? id;
    const c = stitchHue(colors, id);
    const anchor = state === 'start' || state === 'end';
    const inRep = state === 'inrepeat' || anchor;
    const cls = [
        s.tile,
        inRep ? s.inRepeat : '',
        anchor ? s.anchor : '',
        state === 'dim' ? s.dim : '',
        state === 'tap' ? s.tap : '',
        onClick ? s.tappable : '',
    ].filter(Boolean).join(' ');
    const h = Math.round(size * 1.43);
    const body = (_jsxs("div", { className: s.wrap, children: [anchor && (_jsx("span", { className: s.anchorBadge, style: { background: colors.brick }, children: state === 'start'
                    ? t('wizard.step3RowAnchorStart', 'START')
                    : t('wizard.step3RowAnchorEnd', 'END') })), _jsxs("div", { className: cls, style: {
                    width: size,
                    height: h,
                    borderColor: anchor || inRep ? colors.brick : c,
                }, children: [_jsx(StitchGlyph, { symbol: symbol, color: c, size: Math.round(h * 0.34), strokeWidth: 1.9 }), _jsx("span", { className: s.abbr, style: { color: c }, children: abbr })] })] }));
    if (onClick) {
        return (_jsx("button", { type: "button", onClick: onClick, className: s.button, children: body }));
    }
    return body;
}
