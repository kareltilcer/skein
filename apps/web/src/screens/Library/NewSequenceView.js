import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLibraryStore, useSettingsStore, uuid, appendStitchPreservingSegments, removeLastStitchPreservingSegments, expandStitches, segmentsFromMark, } from '@skein/shared';
import Modal from '../../components/ui/Modal';
import Chip from '../../components/ui/Chip';
import Icon from '../../components/ui/Icon';
import Section from '../../components/ui/Section';
import StitchTile from '../../components/ui/StitchTile';
import RowToolbar from '../../components/ui/RowToolbar';
import RepeatRowBody from '../../components/ui/RepeatRowBody';
import StitchPickerDock from '../../components/ui/StitchPickerDock';
import StitchPickerModal from '../../components/ui/StitchPickerModal';
import ReuseChooser from '../../components/ui/ReuseChooser';
import s from './BuilderView.module.css';
import seqStyles from './NewSequenceView.module.css';
export default function NewSequenceView() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { id } = useParams();
    const existing = useLibraryStore((st) => (id ? st.sequences.find((sq) => sq.id === id) : undefined));
    const addSequence = useLibraryStore((st) => st.addSequence);
    const updateSequence = useLibraryStore((st) => st.updateSequence);
    const defaultCraft = useSettingsStore((st) => st.defaultCraft);
    const recents = useSettingsStore((st) => st.recentStitchIds);
    const recordStitchUsed = useSettingsStore((st) => st.recordStitchUsed);
    const libraryRows = useLibraryStore((st) => st.rows);
    const isEditing = !!existing;
    const [name, setName] = React.useState(existing?.name ?? '');
    const [craft, setCraft] = React.useState(existing?.craft ?? defaultCraft);
    const [rows, setRows] = React.useState(() => {
        if (existing?.rows.length)
            return existing.rows.map((r) => ({ ...r, id: r.id || uuid() }));
        return [{ id: uuid(), label: t('libraryCreate.firstRowLabel', 'Row 1'), stitches: [] }];
    });
    const [activeRowIdx, setActiveRowIdx] = React.useState(0);
    const [marking, setMarking] = React.useState(null);
    const [pickerOpen, setPickerOpen] = React.useState(false);
    const totalSts = rows.reduce((a, r) => a + r.stitches.reduce((sum, x) => sum + x.count, 0), 0);
    const ready = name.trim().length > 0 && totalSts > 0;
    function updateRow(idx, patch) {
        setRows((rs) => rs.map((r, i) => i === idx ? { ...r, ...patch } : r));
    }
    function addStitch(stitchId) {
        setRows((rs) => rs.map((r, i) => i === activeRowIdx ? appendStitchPreservingSegments(r, stitchId) : r));
        recordStitchUsed(stitchId);
    }
    function undoLastInActive() {
        const active = rows[activeRowIdx];
        if (!active || active.stitches.length === 0)
            return;
        updateRow(activeRowIdx, removeLastStitchPreservingSegments(active));
    }
    function startMarking(idx) {
        const r = rows[idx];
        if (!r || r.stitches.length === 0)
            return;
        if (r.segments) {
            const { segments: _drop, ...rest } = r;
            updateRow(idx, { stitches: rest.stitches });
        }
        setActiveRowIdx(idx);
        setMarking({ rowIdx: idx, step: 'start', start: null });
    }
    function handleMarkTap(tileIdx) {
        if (!marking)
            return;
        const r = rows[marking.rowIdx];
        if (!r)
            return;
        if (marking.step === 'start') {
            setMarking({ ...marking, step: 'end', start: tileIdx });
            return;
        }
        const start = marking.start;
        if (start == null || tileIdx < start)
            return;
        const segments = segmentsFromMark(r.stitches, start, tileIdx);
        updateRow(marking.rowIdx, { segments });
        setMarking(null);
    }
    function addNewRow() {
        const label = t('libraryCreate.rowLabel', { n: rows.length + 1, defaultValue: `Row ${rows.length + 1}` });
        const newRow = { id: uuid(), label, stitches: [] };
        setRows((rs) => [...rs, newRow]);
        setActiveRowIdx(rows.length);
    }
    function deleteRow(idx) {
        setRows((rs) => rs.length === 1 ? rs : rs.filter((_, i) => i !== idx));
        if (activeRowIdx >= rows.length - 1)
            setActiveRowIdx(Math.max(0, rows.length - 2));
    }
    function save() {
        if (!ready)
            return;
        const payload = {
            id: existing?.id ?? uuid(),
            name: name.trim(),
            craft,
            rows: rows.filter((r) => r.stitches.length > 0).map((r) => ({ ...r })),
            totalRepeats: existing?.totalRepeats ?? 1,
            loop: existing?.loop ?? false,
            isBuiltIn: false,
        };
        if (isEditing)
            updateSequence(payload);
        else
            addSequence(payload);
        navigate('/library');
    }
    const activeRow = rows[activeRowIdx];
    return (_jsxs("div", { className: s.shell, children: [_jsx(Modal.DefinerHeader, { kind: t(isEditing ? 'libraryCreate.editSequenceBadge' : 'libraryCreate.draftSequence', isEditing ? 'Sequence · editing' : 'Sequence · draft'), ready: ready, onClose: () => navigate('/library'), onSave: save, saveLabel: t('common.save', 'Save') }), _jsxs("div", { className: s.titleBlock, children: [_jsx("h1", { className: s.title, children: isEditing
                            ? t('libraryCreate.editSequenceTitle', 'Edit sequence')
                            : t('libraryCreate.newSequenceTitle', 'New sequence') }), _jsx("p", { className: s.sub, children: t('libraryCreate.newSequenceSub', 'A stack of rows — a rib, a body, a border — saved together as one block.') })] }), _jsxs("div", { className: s.scrollBody, children: [_jsxs(Section, { label: t('libraryCreate.identityLabel', 'Name & craft'), children: [_jsx("input", { className: s.nameInput, value: name, onChange: (e) => setName(e.target.value.slice(0, 60)), placeholder: t('libraryCreate.namePlaceholderSeq', 'e.g. Moss stitch panel'), autoFocus: !isEditing, maxLength: 60 }), _jsxs("div", { className: s.craftRow, children: [_jsx(Chip, { active: craft === 'knit', icon: "needle", onClick: () => setCraft('knit'), children: t('craft.knit', 'Knit') }), _jsx(Chip, { active: craft === 'crochet', icon: "loop", onClick: () => setCraft('crochet'), children: t('craft.crochet', 'Crochet') })] })] }), _jsx(Section, { label: t('libraryCreate.rowsInSeq', 'Rows in this sequence'), hint: t('libraryCreate.rowsCount', { count: rows.length, defaultValue: `${rows.length} rows` }), children: _jsxs("div", { className: seqStyles.rowsList, children: [rows.map((row, idx) => {
                                    const isActive = idx === activeRowIdx;
                                    const rowSts = row.stitches.reduce((a, x) => a + x.count, 0);
                                    const hasRepeat = !!row.segments;
                                    return (_jsxs("article", { className: [seqStyles.rowCard, isActive ? seqStyles.rowCardActive : ''].filter(Boolean).join(' '), onClick: () => setActiveRowIdx(idx), children: [_jsxs("header", { className: seqStyles.rowHead, children: [_jsx(Icon, { name: "grip", size: 14 }), _jsxs("span", { className: seqStyles.rowLabel, children: [_jsx("input", { className: seqStyles.rowLabelInput, value: row.label, onChange: (e) => updateRow(idx, { label: e.target.value }), onClick: (e) => e.stopPropagation() }), isActive && _jsx("span", { className: seqStyles.activeStar, children: "\u2731" })] }), _jsxs("span", { className: seqStyles.rowMeta, children: ["\u00B7 ", rowSts, " ", t('library.stsAbbr', 'sts')] }), _jsx("span", { style: { flex: 1 } }), _jsx(RowToolbar, { repeatActive: hasRepeat, disabledRepeat: rowSts === 0, disabledBackspace: rowSts === 0, onMarkRepeat: () => startMarking(idx), onBackspace: () => {
                                                            setActiveRowIdx(idx);
                                                            const r = rows[idx];
                                                            if (r)
                                                                updateRow(idx, removeLastStitchPreservingSegments(r));
                                                        }, onDelete: () => deleteRow(idx) })] }), rowSts === 0 ? (_jsx("p", { className: seqStyles.emptyRow, children: t('libraryCreate.emptyRowHint', 'empty · tap a stitch below to start') })) : hasRepeat && row.segments ? (_jsx(RepeatRowBody, { segments: row.segments })) : (_jsx("div", { className: seqStyles.tilesRow, children: expandStitches(row.stitches).map((sid, i) => (_jsx(StitchTile, { id: sid, state: marking?.rowIdx === idx ? (i === marking.start ? 'start'
                                                        : marking.step === 'end' && marking.start !== null && i < marking.start ? 'dim'
                                                            : 'tap') : 'normal', onClick: marking?.rowIdx === idx ? () => handleMarkTap(i) : undefined }, i))) }))] }, row.id));
                                }), _jsx(ReuseChooser, { kind: "row", libraryCount: libraryRows.length, onNew: addNewRow, onPickFromLibrary: () => {
                                        // Phase 5 ships without a row-from-library picker on web; defer to Phase 7.
                                        // For now, tapping just adds an empty row so the flow still works.
                                        addNewRow();
                                    } })] }) }), _jsx("p", { className: s.signoff, children: t('libraryCreate.signoffSeq', '✻ a block to lean on ✻') })] }), !marking && activeRow && (_jsx(StitchPickerDock, { craft: craft, recents: recents, target: activeRow.label || t('libraryCreate.dockTargetActiveRow', 'this row'), onPick: (stitch) => addStitch(stitch.id), onOpenPicker: () => setPickerOpen(true) })), marking && (_jsxs("div", { className: seqStyles.markBar, children: [_jsx(Icon, { name: "repeat", size: 16 }), _jsx("span", { className: seqStyles.markBarStep, children: t('wizard.step3MarkStepIndicator', { current: marking.step === 'start' ? 1 : 2, total: 2, defaultValue: marking.step === 'start' ? '1/2' : '2/2' }) }), _jsx("span", { className: seqStyles.markBarText, children: marking.step === 'start'
                            ? t('wizard.step3MarkStart', 'Tap the first stitch of the repeat')
                            : t('wizard.step3MarkEnd', 'Tap the last stitch of the repeat') }), _jsx("button", { type: "button", className: seqStyles.markBarCancel, onClick: () => setMarking(null), children: t('wizard.step3MarkCancel', 'Cancel') })] })), _jsx(StitchPickerModal, { open: pickerOpen, onClose: () => setPickerOpen(false), onSelect: (stitch) => addStitch(stitch.id), onDefineCustom: () => navigate('/library/new/custom-stitch'), defaultCraftFilter: craft }), _jsx(UndoButton, { onClick: undoLastInActive })] }));
}
function UndoButton({ onClick: _onClick }) {
    // Reserved for a future floating "Undo" action; intentionally hidden today so the
    // public API has a touch-friendly stub without committing to the chrome shape.
    return null;
}
