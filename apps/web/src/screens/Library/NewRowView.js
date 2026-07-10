import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLibraryStore, useSettingsStore, uuid, appendStitchPreservingSegments, removeLastStitchPreservingSegments, expandStitches, segmentsFromMark, } from '@skein/shared';
import Modal from '../../components/ui/Modal';
import Chip from '../../components/ui/Chip';
import Section from '../../components/ui/Section';
import StitchTile from '../../components/ui/StitchTile';
import RowToolbar from '../../components/ui/RowToolbar';
import RepeatRowBody, { RowNotation } from '../../components/ui/RepeatRowBody';
import StitchPickerDock from '../../components/ui/StitchPickerDock';
import StitchPickerModal from '../../components/ui/StitchPickerModal';
import { useStitchMap } from '../../hooks/useStitchMap';
import s from './BuilderView.module.css';
export default function NewRowView() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { id } = useParams();
    const existing = useLibraryStore((st) => (id ? st.rows.find((r) => r.id === id) : undefined));
    const addRow = useLibraryStore((st) => st.addRow);
    const updateRow = useLibraryStore((st) => st.updateRow);
    const defaultCraft = useSettingsStore((st) => st.defaultCraft);
    const recents = useSettingsStore((st) => st.recentStitchIds);
    const recordStitchUsed = useSettingsStore((st) => st.recordStitchUsed);
    const stitchMap = useStitchMap();
    const isEditing = !!existing;
    const [name, setName] = React.useState(existing?.label ?? '');
    const [craft, setCraft] = React.useState(existing?.craft ?? defaultCraft);
    const [row, setRow] = React.useState(() => ({
        id: 'draft',
        label: existing?.label ?? '',
        stitches: existing?.stitches ?? [],
        ...(existing?.segments ? { segments: existing.segments } : {}),
    }));
    const [marking, setMarking] = React.useState(null);
    const [pickerOpen, setPickerOpen] = React.useState(false);
    const stsCount = row.stitches.reduce((a, x) => a + x.count, 0);
    const hasRepeat = !!row.segments;
    const ready = name.trim().length > 0 && stsCount > 0;
    function addStitch(stitchId) {
        setRow((r) => appendStitchPreservingSegments(r, stitchId));
        recordStitchUsed(stitchId);
    }
    function undoLast() {
        if (row.stitches.length === 0)
            return;
        setRow((r) => removeLastStitchPreservingSegments(r));
    }
    function startMarking() {
        if (row.stitches.length === 0)
            return;
        if (row.segments) {
            const { segments: _drop, ...rest } = row;
            setRow(rest);
        }
        setMarking({ step: 'start', start: null });
    }
    function handleMarkTap(idx) {
        if (!marking)
            return;
        if (marking.step === 'start') {
            setMarking({ step: 'end', start: idx });
            return;
        }
        const start = marking.start;
        if (start == null || idx < start)
            return;
        const segments = segmentsFromMark(row.stitches, start, idx);
        setRow((r) => ({ ...r, segments }));
        setMarking(null);
    }
    function save() {
        if (!ready)
            return;
        const payload = {
            id: existing?.id ?? uuid(),
            label: name.trim(),
            craft,
            stitches: row.stitches,
            ...(row.segments ? { segments: row.segments } : {}),
            isBuiltIn: false,
        };
        if (isEditing)
            updateRow(payload);
        else
            addRow(payload);
        navigate('/library');
    }
    const flatIds = React.useMemo(() => expandStitches(row.stitches), [row.stitches]);
    // Notation read-out — used when no segments are present (segments handled by RowNotation).
    const notation = React.useMemo(() => {
        if (row.stitches.length === 0)
            return '';
        return row.stitches.map((si) => {
            const def = stitchMap[si.stitchId];
            const abbr = def?.abbr ?? si.stitchId;
            return si.count > 1 ? `${abbr}${si.count}` : abbr;
        }).join(', ');
    }, [row.stitches, stitchMap]);
    return (_jsxs("div", { className: s.shell, children: [_jsx(Modal.DefinerHeader, { kind: t(isEditing ? 'libraryCreate.editRowBadge' : 'libraryCreate.draftRow', isEditing ? 'Row · editing' : 'Row · draft'), ready: ready, onClose: () => navigate('/library'), onSave: save, saveLabel: t('common.save', 'Save') }), _jsxs("div", { className: s.titleBlock, children: [_jsx("h1", { className: s.title, children: isEditing
                            ? t('libraryCreate.editRowTitle', 'Edit row')
                            : t('libraryCreate.newRowTitle', 'New row') }), _jsx("p", { className: s.sub, children: isEditing
                            ? t('libraryCreate.editRowSub', 'Adjust the stitches; the notation updates automatically.')
                            : t('libraryCreate.newRowSub', 'A single line of stitches — saved once, reused across every project.') })] }), _jsxs("div", { className: s.scrollBody, children: [_jsxs("div", { className: s.previewCard, children: [_jsxs("div", { className: s.previewHead, children: [_jsx("span", { className: s.eyebrow, children: t('libraryCreate.livePreview', 'Live preview') }), _jsx("span", { className: s.previewBadge, children: t('libraryCreate.newStsBadge', { count: stsCount, defaultValue: `NEW · ${stsCount} STS` }) })] }), _jsx("div", { className: [s.previewName, name ? '' : s.previewNamePlaceholder].filter(Boolean).join(' '), children: name || t('libraryCreate.untitledRow', 'Untitled row') }), flatIds.length > 0 && (_jsxs("div", { className: s.previewStrip, children: [flatIds.slice(0, 16).map((stitchId, i) => (_jsx(StitchTile, { id: stitchId, size: 22 }, i))), flatIds.length > 16 && (_jsxs("span", { className: s.previewMore, children: ["+", flatIds.length - 16] }))] })), notation && (_jsx("div", { className: s.previewNotation, children: notation }))] }), _jsxs(Section, { label: t('libraryCreate.identityLabel', 'Name & craft'), hint: t('libraryCreate.identityHint', 'shown in your library'), children: [_jsx("input", { className: s.nameInput, value: name, onChange: (e) => setName(e.target.value.slice(0, 60)), placeholder: t('libraryCreate.namePlaceholderRow', 'e.g. Eyelet rib'), autoFocus: !isEditing, maxLength: 60 }), _jsxs("div", { className: s.craftRow, children: [_jsx(Chip, { active: craft === 'knit', icon: "needle", onClick: () => setCraft('knit'), children: t('craft.knit', 'Knit') }), _jsx(Chip, { active: craft === 'crochet', icon: "loop", onClick: () => setCraft('crochet'), children: t('craft.crochet', 'Crochet') })] })] }), _jsx(Section, { label: t('libraryCreate.buildRow', 'Build the row'), hint: t('libraryCreate.buildRowHint', { count: stsCount, defaultValue: `${stsCount} stitches` }), children: _jsxs("div", { className: s.builder, children: [marking ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: s.markBanner, children: [_jsx("span", { className: s.markStep, children: marking.step === 'start' ? '1' : '2' }), _jsx("span", { className: s.markText, children: marking.step === 'start'
                                                        ? t('wizard.step3MarkStartInRow', 'Tap the first stitch that repeats')
                                                        : t('wizard.step3MarkEndInRow', 'Now tap the last stitch that repeats') }), _jsx("button", { type: "button", className: s.markCancel, onClick: () => setMarking(null), children: t('wizard.step3MarkCancel', 'Cancel') })] }), _jsx("div", { className: s.tilesRow, children: flatIds.map((stitchId, idx) => {
                                                let state = 'tap';
                                                if (idx === marking.start)
                                                    state = 'start';
                                                else if (marking.step === 'end' && marking.start !== null && idx < marking.start)
                                                    state = 'dim';
                                                return (_jsx(StitchTile, { id: stitchId, state: state, onClick: () => handleMarkTap(idx) }, idx));
                                            }) }), _jsx("p", { className: s.markHint, children: marking.step === 'start'
                                                ? t('wizard.step3MarkStartHint', 'Stitches before your tap stay as a fixed edge.')
                                                : t('wizard.step3MarkEndHint', 'Stitches after your tap become the "to last N" edge — set automatically.') })] })) : hasRepeat && row.segments ? (_jsx(BuilderSegments, { segments: row.segments })) : (_jsxs("div", { className: s.tilesRow, children: [flatIds.map((stitchId, idx) => (_jsx(StitchTile, { id: stitchId }, idx))), _jsx("span", { className: s.caretSlot, "aria-hidden": true, children: _jsx("span", { className: s.caret }) })] })), !marking && (_jsx("div", { className: s.toolbarRow, children: _jsx(RowToolbar, { onMarkRepeat: startMarking, onBackspace: undoLast, onDelete: () => setRow((r) => ({ ...r, stitches: [] })), repeatActive: hasRepeat, disabledRepeat: stsCount === 0, disabledBackspace: stsCount === 0 }) }))] }) }), stsCount > 0 && (_jsxs(Section, { label: t('libraryCreate.notationLabel', 'Written as'), hint: t('libraryCreate.notationHint', 'auto · editable'), children: [_jsx("div", { className: s.notationCard, children: hasRepeat && row.segments ? (_jsx(RowNotation, { segments: row.segments })) : (_jsx("span", { className: s.notationText, children: notation })) }), _jsx("p", { className: s.notationFoot, children: t('libraryCreate.notationFootnote', 'We write it for you. Tap a stitch above to edit.') })] })), _jsx("p", { className: s.signoff, children: t('libraryCreate.signoffRow', '✻ one row, endlessly reusable ✻') })] }), !marking && (_jsx(StitchPickerDock, { craft: craft, recents: recents, target: t('libraryCreate.dockTargetRow', 'this row'), onPick: (stitch) => addStitch(stitch.id), onOpenPicker: () => setPickerOpen(true) })), _jsx(StitchPickerModal, { open: pickerOpen, onClose: () => setPickerOpen(false), onSelect: (stitch) => addStitch(stitch.id), onDefineCustom: () => navigate('/library/new/custom-stitch'), defaultCraftFilter: craft })] }));
}
// ── Render existing segments inline (chart-style, non-tappable) ──
function BuilderSegments({ segments }) {
    return _jsx(RepeatRowBody, { segments: segments });
}
