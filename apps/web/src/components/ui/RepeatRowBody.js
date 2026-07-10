import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { useTranslation } from 'react-i18next';
import { expandStitches } from '@skein/shared';
import { useStitchMap } from '../../hooks/useStitchMap';
import { useTheme } from '../../theme/ThemeProvider';
import Icon from './Icon';
import StitchTile from './StitchTile';
import s from './RepeatRowBody.module.css';
// "(...) to last N sts" → user-facing strings
export function useRuleText() {
    const { t } = useTranslation();
    return React.useMemo(() => ({
        badge(rule) {
            if (!rule || rule.kind === 'toEnd')
                return t('wizard.step3RepeatBadgeToEnd', 'to end');
            return t('wizard.step3RepeatBadgeToLast', { n: rule.n, defaultValue: `to last ${rule.n}` });
        },
        long(rule) {
            if (!rule || rule.kind === 'toEnd')
                return t('wizard.step3RepeatRuleToEnd', 'to end of row');
            return t('wizard.step3RepeatRuleToLast', {
                count: rule.n,
                n: rule.n,
                defaultValue: `to last ${rule.n} st${rule.n === 1 ? '' : 's'}`,
            });
        },
    }), [t]);
}
function collapseRunsToText(stitches, stitchMap) {
    return stitches
        .map((inst) => {
        const def = stitchMap[inst.stitchId];
        const ab = def?.abbr ?? inst.stitchId;
        return inst.count > 1 ? `${ab}${inst.count}` : ab;
    })
        .join(', ');
}
// ─── Tall square bracket framing the repeat group ──────────────
export function RepeatBracket({ side }) {
    return _jsx("span", { className: [s.bracket, side === 'open' ? s.bracketOpen : s.bracketClose].join(' ') });
}
// ─── Bracketed group + derived "to last N" badge ───────────────
export function RepeatGroup({ stitches, rule, }) {
    const { colors } = useTheme();
    const ruleText = useRuleText();
    const ids = expandStitches(stitches);
    return (_jsxs("div", { className: s.group, children: [_jsxs("div", { className: s.groupRow, children: [_jsx(RepeatBracket, { side: "open" }), _jsx("div", { className: s.groupTiles, children: ids.map((id, i) => _jsx(StitchTile, { id: id, state: "inrepeat" }, i)) }), _jsx(RepeatBracket, { side: "close" })] }), _jsxs("div", { className: s.ruleBadge, children: [_jsx(Icon, { name: "repeat", size: 11, color: colors.brick }), _jsx("span", { style: { color: colors.brick }, children: ruleText.badge(rule) })] })] }));
}
// ─── Written notation: "p2, (k2, p2) to last 2 sts" ────────────
export function RowNotation({ segments }) {
    const { colors } = useTheme();
    const ruleText = useRuleText();
    const stitchMap = useStitchMap();
    const parts = [];
    segments.forEach((seg, i) => {
        if (i > 0)
            parts.push(_jsx("span", { style: { color: colors.inkMute }, children: ", " }, `sep${i}`));
        if (seg.type === 'fixed') {
            parts.push(_jsx("span", { children: collapseRunsToText(seg.stitches, stitchMap) }, `f${i}`));
        }
        else {
            parts.push(_jsxs("span", { children: [_jsx("span", { style: { color: colors.brick, fontWeight: 700 }, children: "(" }), collapseRunsToText(seg.stitches, stitchMap), _jsx("span", { style: { color: colors.brick, fontWeight: 700 }, children: ")" }), _jsxs("span", { style: { color: colors.brick, fontWeight: 700 }, children: [" ", ruleText.long(seg.rule)] })] }, `r${i}`));
        }
    });
    return _jsx("div", { className: s.notation, children: parts });
}
// ─── Full body: chart tiles + dashed-rule separator + notation ─
export default function RepeatRowBody({ segments }) {
    return (_jsxs("div", { children: [_jsx("div", { className: s.tiles, children: segments.map((seg, i) => {
                    if (seg.type === 'fixed') {
                        const ids = expandStitches(seg.stitches);
                        return (_jsx("div", { className: s.fixedGroup, children: ids.map((id, j) => _jsx(StitchTile, { id: id }, j)) }, i));
                    }
                    return _jsx(RepeatGroup, { stitches: seg.stitches, rule: seg.rule }, i);
                }) }), _jsx("div", { className: s.sep, children: _jsx(RowNotation, { segments: segments }) })] }));
}
