import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLibraryStore, useSettingsStore, uuid, appendStitchPreservingSegments, removeLastStitchPreservingSegments, expandStitches, segmentsFromMark, } from '@skein/shared';
import Btn from '../../components/ui/Btn';
import Icon from '../../components/ui/Icon';
import Modal from '../../components/ui/Modal';
import Tip from '../../components/ui/Tip';
import StitchTile from '../../components/ui/StitchTile';
import RepeatRowBody from '../../components/ui/RepeatRowBody';
import RowToolbar from '../../components/ui/RowToolbar';
import ReuseChooser from '../../components/ui/ReuseChooser';
import StitchPickerDock from '../../components/ui/StitchPickerDock';
import StitchPickerModal from '../../components/ui/StitchPickerModal';
import s from './Step3.module.css';
export default function Step3({ parts, craft, onPartsChange }) {
    const { t } = useTranslation();
    const [activePartIdx, setActivePartIdx] = React.useState(0);
    const [activeRow, setActiveRow] = React.useState(null);
    const [marking, setMarking] = React.useState(null);
    const [pickerOpen, setPickerOpen] = React.useState(false);
    const [rowPickerSeq, setRowPickerSeq] = React.useState(null);
    const [seqPickerOpen, setSeqPickerOpen] = React.useState(false);
    const [confirmRow, setConfirmRow] = React.useState(null);
    const [confirmSeq, setConfirmSeq] = React.useState(null);
    const libraryRows = useLibraryStore((st) => st.rows);
    const librarySequences = useLibraryStore((st) => st.sequences);
    const recents = useSettingsStore((st) => st.recentStitchIds);
    const recordStitchUsed = useSettingsStore((st) => st.recordStitchUsed);
    const safeIdx = Math.min(activePartIdx, parts.length - 1);
    const part = parts[safeIdx];
    // ── State helpers ──
    function patchPart(idx, patch) {
        onPartsChange(parts.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
    }
    function patchSeq(partIdx, seqIdx, patch) {
        const p = parts[partIdx];
        if (!p)
            return;
        patchPart(partIdx, { sequences: p.sequences.map((sq, i) => (i === seqIdx ? { ...sq, ...patch } : sq)) });
    }
    function patchRow(partIdx, seqIdx, rowIdx, patch) {
        const sq = parts[partIdx]?.sequences[seqIdx];
        if (!sq)
            return;
        patchSeq(partIdx, seqIdx, { rows: sq.rows.map((r, i) => (i === rowIdx ? { ...r, ...patch } : r)) });
    }
    function addSequence(partIdx) {
        const p = parts[partIdx];
        if (!p)
            return;
        const newSeq = {
            id: uuid(),
            name: t('wizard.sequenceLabel', { n: p.sequences.length + 1, defaultValue: `Sequence ${p.sequences.length + 1}` }),
            rows: [],
            totalRepeats: 1,
            loop: false,
        };
        patchPart(partIdx, { sequences: [...p.sequences, newSeq] });
    }
    function addRow(partIdx, seqIdx) {
        const sq = parts[partIdx]?.sequences[seqIdx];
        if (!sq)
            return;
        const newRow = {
            id: uuid(),
            label: t('wizard.rowLabel', { n: sq.rows.length + 1, defaultValue: `Row ${sq.rows.length + 1}` }),
            stitches: [],
        };
        patchSeq(partIdx, seqIdx, { rows: [...sq.rows, newRow] });
        setActiveRow({ partIdx, seqIdx, rowIdx: sq.rows.length });
    }
    function addRowFromLibrary(partIdx, seqIdx, libRow) {
        const sq = parts[partIdx]?.sequences[seqIdx];
        if (!sq)
            return;
        const newRow = {
            id: uuid(),
            label: libRow.label,
            stitches: libRow.stitches,
            ...(libRow.segments ? { segments: libRow.segments } : {}),
        };
        patchSeq(partIdx, seqIdx, { rows: [...sq.rows, newRow] });
        setActiveRow({ partIdx, seqIdx, rowIdx: sq.rows.length });
        setRowPickerSeq(null);
    }
    function addSeqFromLibrary(partIdx, libSeq) {
        const p = parts[partIdx];
        if (!p)
            return;
        const newSeq = {
            id: uuid(),
            name: libSeq.name,
            rows: libSeq.rows.map((r) => ({ id: uuid(), label: r.label, stitches: r.stitches, ...(r.segments ? { segments: r.segments } : {}) })),
            totalRepeats: libSeq.totalRepeats || 1,
            loop: libSeq.loop,
        };
        patchPart(partIdx, { sequences: [...p.sequences, newSeq] });
        setSeqPickerOpen(false);
    }
    function deleteRow(partIdx, seqIdx, rowIdx) {
        const sq = parts[partIdx]?.sequences[seqIdx];
        if (!sq)
            return;
        patchSeq(partIdx, seqIdx, { rows: sq.rows.filter((_, i) => i !== rowIdx) });
        if (activeRow?.seqIdx === seqIdx && activeRow.partIdx === partIdx && activeRow.rowIdx === rowIdx)
            setActiveRow(null);
    }
    function deleteSequence(partIdx, seqIdx) {
        const p = parts[partIdx];
        if (!p)
            return;
        patchPart(partIdx, { sequences: p.sequences.filter((_, i) => i !== seqIdx) });
        if (activeRow?.seqIdx === seqIdx && activeRow.partIdx === partIdx)
            setActiveRow(null);
    }
    function addStitch(stitch) {
        if (!activeRow)
            return;
        const { partIdx, seqIdx, rowIdx } = activeRow;
        const row = parts[partIdx]?.sequences[seqIdx]?.rows[rowIdx];
        if (!row)
            return;
        const nextRow = appendStitchPreservingSegments(row, stitch.id);
        patchRow(partIdx, seqIdx, rowIdx, nextRow);
        recordStitchUsed(stitch.id);
    }
    function startMarking(seqIdx, rowIdx) {
        const row = part?.sequences[seqIdx]?.rows[rowIdx];
        if (!row || row.stitches.length === 0)
            return;
        if (row.segments) {
            const { segments: _drop, ...rest } = row;
            patchRow(safeIdx, seqIdx, rowIdx, rest);
        }
        setMarking({ partIdx: safeIdx, seqIdx, rowIdx, step: 'start', start: null });
    }
    function handleMarkTap(tileIdx) {
        if (!marking)
            return;
        const row = parts[marking.partIdx]?.sequences[marking.seqIdx]?.rows[marking.rowIdx];
        if (!row)
            return;
        if (marking.step === 'start') {
            setMarking({ ...marking, step: 'end', start: tileIdx });
            return;
        }
        const start = marking.start;
        if (start == null || tileIdx < start)
            return;
        const segments = segmentsFromMark(row.stitches, start, tileIdx);
        patchRow(marking.partIdx, marking.seqIdx, marking.rowIdx, { segments });
        setMarking(null);
    }
    if (!part)
        return null;
    return (_jsxs("div", { className: s.wrap, children: [parts.length > 1 && (_jsx("div", { className: s.partTabs, children: parts.map((p, i) => {
                    const active = i === safeIdx;
                    return (_jsxs("button", { type: "button", className: [s.partTab, active ? s.partTabActive : ''].filter(Boolean).join(' '), onClick: () => { setActivePartIdx(i); setActiveRow(null); setMarking(null); }, children: [_jsx("span", { children: p.name }), _jsx("span", { className: s.partTabCount, children: p.sequences.length })] }, p.id));
                }) })), _jsxs("div", { className: s.seqStack, children: [part.sequences.map((seq, seqIdx) => (_jsx(SequenceCard, { seq: seq, seqIdx: seqIdx, partIdx: safeIdx, activeRow: activeRow, marking: marking, onActivateRow: (rowIdx) => { setActiveRow({ partIdx: safeIdx, seqIdx, rowIdx }); setMarking(null); }, onRenameSeq: (name) => patchSeq(safeIdx, seqIdx, { name }), onRowLabel: (rowIdx, label) => patchRow(safeIdx, seqIdx, rowIdx, { label }), onAddRow: () => addRow(safeIdx, seqIdx), onAddRowFromLib: () => setRowPickerSeq(seqIdx), onDeleteRow: (rowIdx) => setConfirmRow({ seqIdx, rowIdx }), onUndoLast: (rowIdx) => {
                            const row = part.sequences[seqIdx]?.rows[rowIdx];
                            if (!row || row.stitches.length === 0)
                                return;
                            const next = removeLastStitchPreservingSegments(row);
                            patchRow(safeIdx, seqIdx, rowIdx, next);
                        }, onStartMarking: (rowIdx) => startMarking(seqIdx, rowIdx), onHandleMarkTap: handleMarkTap, onDeleteSeq: () => setConfirmSeq({ seqIdx }), libraryRowCount: libraryRows.filter((r) => r.craft === craft).length }, seq.id))), _jsxs("button", { type: "button", className: s.addSeq, onClick: () => addSequence(safeIdx), children: [_jsx(Icon, { name: "plus", size: 16 }), _jsx("span", { children: t('wizard.step3AddSeq', 'Add a sequence') })] }), _jsx(ReuseChooser, { kind: "sequence", libraryCount: librarySequences.filter((sq) => sq.craft === craft).length, onNew: () => addSequence(safeIdx), onPickFromLibrary: () => setSeqPickerOpen(true) }), _jsx(Tip, { children: t('wizard.step3Tip', 'Tap any row to focus it — the stitch dock fills that row.') })] }), marking ? (_jsxs("div", { className: s.markBar, children: [_jsx(Icon, { name: "repeat", size: 16 }), _jsx("span", { className: s.markBarStep, children: t('wizard.step3MarkStepIndicator', { current: marking.step === 'start' ? 1 : 2, total: 2, defaultValue: marking.step === 'start' ? '1/2' : '2/2' }) }), _jsx("span", { className: s.markBarText, children: marking.step === 'start'
                            ? t('wizard.step3MarkStart', 'Tap the first stitch of the repeat')
                            : t('wizard.step3MarkEnd', 'Tap the last stitch of the repeat') }), _jsx("button", { type: "button", className: s.markBarCancel, onClick: () => setMarking(null), children: t('wizard.step3MarkCancel', 'Cancel') })] })) : (_jsx(StitchPickerDock, { craft: craft, recents: recents, target: activeRow ? part.sequences[activeRow.seqIdx]?.rows[activeRow.rowIdx]?.label ?? t('wizard.step3DockTargetGeneric', 'a row') : t('wizard.step3DockTargetGeneric', 'a row'), onPick: (stitch) => {
                    if (!activeRow)
                        return;
                    addStitch(stitch);
                }, onOpenPicker: () => setPickerOpen(true) })), _jsx(StitchPickerModal, { open: pickerOpen, onClose: () => setPickerOpen(false), onSelect: (stitch) => addStitch(stitch), defaultCraftFilter: craft }), _jsx(Modal, { open: rowPickerSeq !== null, onClose: () => setRowPickerSeq(null), title: t('wizard.step3PickRow', 'Pick a row from your library'), width: 620, children: _jsx("div", { className: s.pickerList, children: libraryRows.filter((r) => r.craft === craft).map((r) => (_jsxs("button", { type: "button", className: s.pickerRow, onClick: () => { if (rowPickerSeq !== null)
                            addRowFromLibrary(safeIdx, rowPickerSeq, r); }, children: [_jsx("span", { className: s.pickerName, children: r.label }), _jsxs("span", { className: s.pickerMeta, children: [r.stitches.reduce((a, s) => a + s.count, 0), " ", t('library.stsAbbr', 'sts')] }), _jsx(Icon, { name: "plus", size: 16 })] }, r.id))) }) }), _jsx(Modal, { open: seqPickerOpen, onClose: () => setSeqPickerOpen(false), title: t('wizard.step3PickSeq', 'Pick a sequence from your library'), width: 620, children: _jsx("div", { className: s.pickerList, children: librarySequences.filter((sq) => sq.craft === craft).map((sq) => (_jsxs("button", { type: "button", className: s.pickerRow, onClick: () => addSeqFromLibrary(safeIdx, sq), children: [_jsx("span", { className: s.pickerName, children: sq.name }), _jsxs("span", { className: s.pickerMeta, children: [sq.rows.length, " ", t('library.rows', 'rows')] }), _jsx(Icon, { name: "plus", size: 16 })] }, sq.id))) }) }), _jsxs(Modal, { open: !!confirmRow, onClose: () => setConfirmRow(null), width: 460, footer: _jsxs(_Fragment, { children: [_jsx(Btn, { variant: "ghost", onClick: () => setConfirmRow(null), children: t('common.keepIt', 'Keep it') }), _jsx(Btn, { icon: "trash", onClick: () => {
                                if (confirmRow)
                                    deleteRow(safeIdx, confirmRow.seqIdx, confirmRow.rowIdx);
                                setConfirmRow(null);
                            }, children: t('wizard.step3RemoveRowConfirm', 'Yes, remove row') })] }), children: [_jsx(Modal.DangerHeader, { title: t('wizard.step3RemoveRowTitle', 'Remove this row?'), caption: (() => {
                            const stsLost = confirmRow ? part.sequences[confirmRow.seqIdx]?.rows[confirmRow.rowIdx]?.stitches.reduce((a, s) => a + s.count, 0) ?? 0 : 0;
                            return t('wizard.step3RemoveRowCaption', { count: stsLost, defaultValue: `No undo · ${stsLost} stitches lost` });
                        })() }), _jsx("p", { className: s.confirmBody, children: t('wizard.step3RemoveRowBody', "The row above and below will shift up — neighboring rows aren't affected.") })] }), _jsxs(Modal, { open: !!confirmSeq, onClose: () => setConfirmSeq(null), width: 460, footer: _jsxs(_Fragment, { children: [_jsx(Btn, { variant: "ghost", onClick: () => setConfirmSeq(null), children: t('common.keepIt', 'Keep it') }), _jsx(Btn, { icon: "trash", onClick: () => {
                                if (confirmSeq)
                                    deleteSequence(safeIdx, confirmSeq.seqIdx);
                                setConfirmSeq(null);
                            }, children: t('wizard.step3RemoveSeqConfirm', 'Yes, delete sequence') })] }), children: [_jsx(Modal.DangerHeader, { title: t('wizard.step3RemoveSeqTitle', 'Delete this whole sequence?'), caption: (() => {
                            if (!confirmSeq)
                                return '';
                            const seq = part.sequences[confirmSeq.seqIdx];
                            if (!seq)
                                return '';
                            const sts = seq.rows.reduce((a, r) => a + r.stitches.reduce((x, s) => x + s.count, 0), 0);
                            return t('wizard.step3RemoveSeqCaption', { rows: seq.rows.length, sts, defaultValue: `No undo · ${seq.rows.length} rows · ${sts} stitches lost` });
                        })() }), _jsx("p", { className: s.confirmBody, children: t('wizard.step3RemoveSeqBody', "Every row inside moves with it. Other sequences shift up — they aren't affected.") })] })] }));
}
function SequenceCard({ seq, seqIdx, partIdx, activeRow, marking, onActivateRow, onRenameSeq, onRowLabel, onAddRow, onAddRowFromLib, onDeleteRow, onUndoLast, onStartMarking, onHandleMarkTap, onDeleteSeq, libraryRowCount, }) {
    const { t } = useTranslation();
    const editing = activeRow !== null && activeRow.partIdx === partIdx && activeRow.seqIdx === seqIdx;
    const totalSts = seq.rows.reduce((a, r) => a + r.stitches.reduce((x, st) => x + st.count, 0), 0);
    const hasRepeat = seq.rows.some((r) => r.segments);
    return (_jsxs("article", { className: [s.seqCard, editing ? s.seqCardEditing : ''].filter(Boolean).join(' '), children: [_jsxs("header", { className: s.seqHead, children: [_jsx("span", { className: s.seqNum, children: seqIdx + 1 }), _jsxs("div", { className: s.seqBody, children: [_jsx("input", { className: s.seqName, value: seq.name, onChange: (e) => onRenameSeq(e.target.value) }), _jsx("span", { className: s.seqMeta, children: t('wizard.step3SeqMeta', {
                                    rows: seq.rows.length,
                                    sts: totalSts,
                                    defaultValue: `${seq.rows.length} rows · ${totalSts}${hasRepeat ? '+' : ''} sts${hasRepeat ? ' · has repeat' : ''}`,
                                }) })] }), editing ? (_jsxs("button", { type: "button", className: s.seqDelete, onClick: onDeleteSeq, children: [_jsx(Icon, { name: "trash", size: 13 }), _jsx("span", { children: t('wizard.step3SeqDelete', 'Delete') })] })) : (_jsx(Icon, { name: "chevDown", size: 16 }))] }), _jsxs("div", { className: s.rowsList, children: [seq.rows.map((row, rowIdx) => {
                        const isMarking = !!marking && marking.partIdx === partIdx && marking.seqIdx === seqIdx && marking.rowIdx === rowIdx;
                        const isActive = editing && activeRow?.rowIdx === rowIdx;
                        const sts = row.stitches.reduce((a, st) => a + st.count, 0);
                        return (_jsxs("div", { className: [s.rowCard, isActive ? s.rowCardActive : ''].filter(Boolean).join(' '), onClick: () => onActivateRow(rowIdx), children: [_jsxs("header", { className: s.rowHead, children: [_jsx(Icon, { name: "grip", size: 14 }), _jsx("input", { className: s.rowLabel, value: row.label, onChange: (e) => onRowLabel(rowIdx, e.target.value), onClick: (e) => e.stopPropagation() }), _jsxs("span", { className: s.rowSts, children: ["\u00B7 ", sts, " sts"] }), _jsx("span", { style: { flex: 1 } }), _jsx(RowToolbar, { repeatActive: !!row.segments || isMarking, disabledRepeat: sts === 0, disabledBackspace: sts === 0, onMarkRepeat: () => onStartMarking(rowIdx), onBackspace: () => onUndoLast(rowIdx), onDelete: () => onDeleteRow(rowIdx) })] }), sts === 0 ? (_jsx("p", { className: s.rowEmpty, children: t('wizard.step3RowEmpty', 'empty · tap a stitch below to start') })) : isMarking ? (_jsx("div", { className: s.tilesRow, children: expandStitches(row.stitches).map((id, i) => {
                                        let state = 'tap';
                                        if (marking && i === marking.start)
                                            state = 'start';
                                        else if (marking && marking.step === 'end' && marking.start !== null && i < marking.start)
                                            state = 'dim';
                                        return (_jsx(StitchTile, { id: id, state: state, onClick: () => onHandleMarkTap(i) }, i));
                                    }) })) : row.segments ? (_jsx(RepeatRowBody, { segments: row.segments })) : (_jsx("div", { className: s.tilesRow, children: expandStitches(row.stitches).map((id, i) => _jsx(StitchTile, { id: id }, i)) }))] }, row.id));
                    }), _jsx(ReuseChooser, { kind: "row", libraryCount: libraryRowCount, onNew: onAddRow, onPickFromLibrary: onAddRowFromLib })] })] }));
}
