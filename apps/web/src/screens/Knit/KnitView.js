import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useProjectStore, useSettingsStore, getColors, totalRows, completedRows, stitchHue, groupRuns, expandStitches, } from '@skein/shared';
import IconBtn from '../../components/ui/IconBtn';
import Icon from '../../components/ui/Icon';
import HoldBtn from '../../components/ui/HoldBtn';
import Modal from '../../components/ui/Modal';
import PartmenuPopover from '../../components/ui/PartmenuPopover';
import RepeatRowBody from '../../components/ui/RepeatRowBody';
import StitchTile from '../../components/ui/StitchTile';
import StitchGlyph from '../../components/ui/StitchGlyph';
import { useStitchMap } from '../../hooks/useStitchMap';
import { useTheme } from '../../theme/ThemeProvider';
import s from './KnitView.module.css';
const PART_COLORS = ['var(--color-brick)', 'var(--color-mustard)', 'var(--color-forest)'];
export default function KnitView() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { id } = useParams();
    const project = useProjectStore((st) => st.projects.find((p) => p.id === id));
    const advanceRow = useProjectStore((st) => st.advanceRow);
    const retreatRow = useProjectStore((st) => st.retreatRow);
    const jumpTo = useProjectStore((st) => st.jumpTo);
    const updateProject = useProjectStore((st) => st.updateProject);
    const holdTime = useSettingsStore((st) => st.holdTimeMs);
    const { theme } = useTheme();
    const colors = React.useMemo(() => getColors(theme), [theme]);
    const stitchMap = useStitchMap();
    const menuTriggerRef = React.useRef(null);
    const [menuOpen, setMenuOpen] = React.useState(false);
    const [partPickerOpen, setPartPickerOpen] = React.useState(false);
    React.useEffect(() => {
        if (!project)
            return;
        function onKey(e) {
            const target = e.target;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
                return;
            if (e.key === ' ' || e.key === 'ArrowRight') {
                e.preventDefault();
                advanceRow(project.id);
            }
            else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                retreatRow(project.id);
            }
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [project, advanceRow, retreatRow]);
    if (!project) {
        return (_jsxs("div", { className: s.main, style: { padding: 40 }, children: [_jsx(IconBtn, { name: "back", onClick: () => navigate('/'), "aria-label": t('action.back', 'Back') }), _jsx("p", { style: { marginTop: 40, textAlign: 'center', color: 'var(--color-inkMute)' }, children: t('knitting.notFound', 'Project not found.') })] }));
    }
    const part = project.parts[project.currentPartIndex];
    const seq = part?.sequences[project.currentSequenceIndex];
    const row = seq?.rows[project.currentRowIndex];
    const total = totalRows(project);
    const done = completedRows(project);
    const pct = total > 0 ? done / total : 0;
    const stitchInstances = row?.stitches ?? [];
    const totalSts = stitchInstances.reduce((a, x) => a + x.count, 0);
    const notation = groupRuns(stitchInstances).map((r) => {
        const def = stitchMap[r.id];
        const label = def && def.abbr !== '—' ? def.abbr : r.id;
        return r.count > 1 ? `${label}${r.count}` : label;
    }).join(', ');
    function markFinished() {
        updateProject(project.id, { status: project.status === 'finished' ? 'active' : 'finished' });
        setMenuOpen(false);
    }
    function switchPart(targetPartIdx) {
        jumpTo(project.id, targetPartIdx, 0, 0, 1);
        setPartPickerOpen(false);
        setMenuOpen(false);
    }
    return (_jsxs("div", { className: s.shell, children: [_jsxs("div", { className: s.main, children: [_jsxs("header", { className: s.topBar, children: [_jsx(IconBtn, { name: "back", onClick: () => navigate('/'), "aria-label": t('action.back', 'Back') }), _jsxs("div", { className: s.topMeta, children: [_jsx("h1", { className: s.projectName, children: project.name }), part && (_jsxs("span", { className: s.partCaption, children: [part.name, " \u00B7 ", project.status === 'finished' ? t('knitting.finished', 'finished') : t('knitting.inProgress', 'in progress')] }))] }), _jsxs("div", { style: { position: 'relative' }, children: [_jsx("button", { ref: menuTriggerRef, type: "button", className: s.menuBtn, onClick: () => setMenuOpen((x) => !x), "aria-label": t('action.menu', 'Menu'), children: _jsx(Icon, { name: "more", size: 18 }) }), _jsx(PartmenuPopover, { open: menuOpen, onClose: () => setMenuOpen(false), anchorRef: menuTriggerRef, minWidth: 220, items: [
                                            {
                                                key: 'edit',
                                                icon: 'edit',
                                                label: t('knitting.menu.editProject', 'Edit project'),
                                                // Edit-project flow lands in a follow-up; the button is here so the menu structure matches design.
                                                onSelect: () => undefined,
                                            },
                                            {
                                                key: 'finish',
                                                icon: project.status === 'finished' ? 'undo' : 'flag',
                                                label: project.status === 'finished'
                                                    ? t('knitting.menu.markActive', 'Move back to needles')
                                                    : t('knitting.menu.markFinished', 'Mark as finished'),
                                                onSelect: markFinished,
                                                accent: project.status !== 'finished',
                                            },
                                            ...(project.parts.length > 1 ? [{
                                                    key: 'switch',
                                                    icon: 'layers',
                                                    label: t('knitting.menu.switchPart', 'Switch part'),
                                                    onSelect: () => setPartPickerOpen(true),
                                                    divider: true,
                                                }] : []),
                                        ] })] })] }), seq && (_jsxs("div", { className: s.seqCard, children: [_jsxs("div", { children: [_jsx("div", { className: s.eyebrow, children: t('knitting.sequenceOf', { current: project.currentSequenceIndex + 1, total: part?.sequences.length ?? 1, defaultValue: `Sequence ${project.currentSequenceIndex + 1} of ${part?.sequences.length ?? 1}` }) }), _jsx("div", { className: s.seqCardName, children: seq.name })] }), _jsxs("div", { className: s.repeatBadge, children: [_jsx(Icon, { name: "repeat", size: 14 }), _jsxs("span", { children: [t('knitting.repeatLabel', 'Repeat'), " ", project.currentRepeat, "/", seq.totalRepeats] })] })] })), _jsxs("div", { className: s.counterRow, children: [_jsxs("div", { className: s.counterLeft, children: [_jsxs("div", { children: [_jsx("div", { className: s.eyebrow, children: t('knitting.rowLabel', 'Row') }), _jsx("span", { className: s.counterNum, children: project.currentRowIndex + 1 })] }), _jsxs("span", { className: s.counterTotal, children: ["/ ", seq?.rows.length ?? 1] })] }), _jsxs("div", { className: s.counterRight, children: [_jsxs("div", { className: s.pctLabel, children: [Math.round(pct * 100), "%"] }), _jsx("div", { className: s.progress, children: _jsx("div", { className: s.progressFill, style: { width: `${pct * 100}%` } }) })] })] }), _jsxs("div", { className: s.hero, children: [_jsxs("div", { className: s.heroHead, children: [_jsx("span", { children: t('knitting.thisRow', { count: totalSts, defaultValue: `This row · ${totalSts} sts` }) }), _jsx("span", { children: t('knitting.readArrow', 'read →') })] }), row?.segments ? (_jsx("div", { className: s.heroSegments, children: _jsx(RepeatRowBody, { segments: row.segments }) })) : (_jsxs("div", { className: s.chipFlow, children: [stitchInstances.length === 0 && (_jsx("div", { className: s.emptyRow, children: t('knitting.emptyRow', 'This row has no stitches yet.') })), stitchInstances.flatMap((si, i) => Array.from({ length: si.count }, (_, j) => {
                                        const def = stitchMap[si.stitchId];
                                        if (!def)
                                            return null;
                                        const tile = stitchHue(colors, si.stitchId);
                                        return (_jsxs("div", { className: s.bigChip, style: { background: tile }, children: [_jsx(StitchGlyph, { symbol: def.symbol, color: "#FBF6EC", size: 42, strokeWidth: 2.6 }), _jsx("span", { children: def.abbr })] }, `${i}-${j}`));
                                    }))] })), notation && !row?.segments && _jsx("div", { className: s.notation, children: notation })] }), _jsxs("div", { className: s.controls, children: [_jsx("div", { className: s.backHold, children: _jsx(HoldBtn, { icon: "chevL", holdMs: holdTime, variant: "ghost", onComplete: () => retreatRow(project.id) }) }), _jsx("div", { className: s.holdWrap, children: _jsx(HoldBtn, { label: t('knitting.rowDone', 'Row done'), sub: t('knitting.holdSeconds', { seconds: (holdTime / 1000).toFixed(1), defaultValue: `Hold ${(holdTime / 1000).toFixed(1)}s` }), holdMs: holdTime, onComplete: () => advanceRow(project.id) }) })] }), _jsx("p", { className: s.holdHint, children: t('knitting.holdHint', "Press & hold so your cat can't ruin everything · or tap Space / ←") })] }), _jsxs("aside", { className: s.rail, children: [_jsxs("div", { className: s.railHead, children: [_jsx("span", { className: s.railTitle, children: t('knitting.pattern', 'Full pattern') }), _jsx("span", { className: s.railSubCount, children: t('knitting.seqCount', { count: project.parts.reduce((a, p) => a + p.sequences.length, 0), defaultValue: `${project.parts.reduce((a, p) => a + p.sequences.length, 0)} sequences` }) })] }), _jsx("p", { className: s.railSub, children: t('knitting.railSub', "The whole part, top to bottom. Your spot is marked.") }), project.parts.map((p, pIdx) => (_jsxs("div", { className: s.partGroup, children: [_jsxs("div", { className: s.partHead, children: [_jsx("span", { className: s.partDot, style: { background: p.color || PART_COLORS[pIdx % PART_COLORS.length] } }), _jsx("span", { className: s.partName, children: p.name })] }), p.sequences.map((sq, sIdx) => {
                                const isActiveSeq = pIdx === project.currentPartIndex && sIdx === project.currentSequenceIndex;
                                return (_jsxs("div", { className: s.seqGroup, children: [_jsxs("div", { className: s.seqHead, children: [_jsxs("span", { className: s.seqIdx, children: ["S", sIdx + 1] }), _jsx("span", { className: s.seqName, children: sq.name }), sq.totalRepeats > 1 && (_jsxs("span", { className: s.repeatPill, children: [_jsx(Icon, { name: "repeat", size: 10 }), isActiveSeq ? `${project.currentRepeat}/${sq.totalRepeats}` : `×${sq.totalRepeats}`] }))] }), sq.rows.map((rw, rIdx) => {
                                            const isActive = isActiveSeq && rIdx === project.currentRowIndex;
                                            const isDone = (pIdx < project.currentPartIndex)
                                                || (pIdx === project.currentPartIndex && sIdx < project.currentSequenceIndex)
                                                || (isActiveSeq && rIdx < project.currentRowIndex);
                                            const ids = expandStitches(rw.stitches).slice(0, 12);
                                            return (_jsxs("button", { type: "button", className: [s.railRow, isActive ? s.railRowActive : '', isDone ? s.railRowDone : ''].filter(Boolean).join(' '), onClick: () => jumpTo(project.id, pIdx, sIdx, rIdx, project.currentRepeat), children: [_jsxs("div", { className: s.railRowHead, children: [isDone
                                                                ? _jsx(Icon, { name: "check", size: 13 })
                                                                : _jsx("span", { className: [s.railRowDot, isActive ? s.railRowDotActive : ''].filter(Boolean).join(' ') }), _jsx("span", { className: s.railRowLabel, children: rw.label || `Row ${rIdx + 1}` }), _jsxs("span", { className: s.railRowSts, children: ["\u00B7 ", rw.stitches.reduce((a, st) => a + st.count, 0), " sts"] })] }), _jsx("div", { className: s.railRowStrip, children: ids.map((id, i) => _jsx(StitchTile, { id: id, size: 17 }, i)) })] }, rw.id));
                                        })] }, sq.id));
                            })] }, p.id)))] }), _jsx(Modal, { open: partPickerOpen, onClose: () => setPartPickerOpen(false), title: t('knitting.menu.switchPart', 'Switch part'), width: 480, children: _jsx("div", { className: s.partPickerList, children: project.parts.map((p, idx) => {
                        const active = idx === project.currentPartIndex;
                        return (_jsxs("button", { type: "button", className: [s.partPickerRow, active ? s.partPickerRowActive : ''].filter(Boolean).join(' '), onClick: () => switchPart(idx), children: [_jsx("span", { className: s.partPickerTile, style: { background: p.color || PART_COLORS[idx % PART_COLORS.length] }, children: idx + 1 }), _jsx("span", { className: s.partPickerName, children: p.name }), _jsx("span", { className: s.partPickerMeta, children: t('knitting.partSeqCount', { count: p.sequences.length, defaultValue: `${p.sequences.length} sequences` }) }), active && _jsx(Icon, { name: "check", size: 16 })] }, p.id));
                    }) }) })] }));
}
