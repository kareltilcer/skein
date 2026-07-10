import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useProjectStore, useSettingsStore, useLibraryStore, uuid, sizesFor, formatNeedleSize, YARN_WEIGHTS, YARN_COLORS, PART_COLORS, PROJECT_NAME_MAX, KNIT_NEEDLE_TYPES, validateProjectName, STATE_TO_COLOR_TOKEN, } from '@skein/shared';
import PageHeader from '../../components/ui/PageHeader';
import Btn from '../../components/ui/Btn';
import Chip from '../../components/ui/Chip';
import FieldLabel from '../../components/ui/FieldLabel';
import Icon from '../../components/ui/Icon';
import Modal from '../../components/ui/Modal';
import Tip from '../../components/ui/Tip';
import Step3 from './Step3';
import s from './SetupWizard.module.css';
// Default fallback copy when an i18n key is missing.
function defaultNameMsg(state) {
    switch (state) {
        case 'empty': return "Give it a name — anything will do.";
        case 'ok': return "Looks good. Future-you will thank you.";
        case 'mid': return "Plenty of room.";
        case 'near': return "Getting close to the limit.";
        case 'over': return "Whoops — too long. Trim a few.";
        case 'required': return "This one's required — give your project a name to cast on.";
    }
}
function emptyDraft(craft) {
    const sizes = sizesFor(craft);
    return {
        name: '',
        craft,
        yarnWeight: 'Worsted',
        needleSize: sizes.find((s) => s.mm === '4.5')?.mm ?? sizes[0]?.mm ?? '',
        needleType: 'Straight',
        yarnColor: YARN_COLORS[0],
        notes: '',
        parts: [
            { id: uuid(), name: 'Main', color: PART_COLORS[0], sequences: [] },
        ],
    };
}
function fromLibrarySeq(libSeq) {
    return {
        id: uuid(),
        name: libSeq.name,
        rows: libSeq.rows.map((r) => ({ ...r, id: uuid() })),
        totalRepeats: libSeq.totalRepeats || 1,
        loop: libSeq.loop,
    };
}
function draftToProject(d) {
    const now = new Date().toISOString();
    return {
        id: uuid(),
        name: d.name.trim(),
        craft: d.craft,
        yarnWeight: d.yarnWeight,
        needleSize: d.needleSize,
        needleType: d.needleType,
        yarnColor: d.yarnColor,
        notes: d.notes,
        status: 'active',
        parts: d.parts.map((p) => ({
            id: p.id,
            name: p.name,
            color: p.color,
            notes: p.notes,
            loop: p.loop,
            sequences: p.sequences.map((sq) => ({
                id: sq.id,
                name: sq.name,
                rows: sq.rows.map((r) => ({ ...r })),
                totalRepeats: sq.totalRepeats,
                loop: sq.loop,
            })),
        })),
        currentPartIndex: 0,
        currentSequenceIndex: 0,
        currentRepeat: 1,
        currentRowIndex: 0,
        createdAt: now,
        updatedAt: now,
    };
}
export default function SetupWizard() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const defaultCraft = useSettingsStore((st) => st.defaultCraft);
    const needleUnit = useSettingsStore((st) => st.needleSizeUnit);
    const addProject = useProjectStore((st) => st.addProject);
    const libSequences = useLibraryStore((st) => st.sequences);
    const [draft, setDraft] = React.useState(() => emptyDraft(defaultCraft));
    const [step, setStep] = React.useState(0);
    const [seqPickerForPart, setSeqPickerForPart] = React.useState(null);
    const [requiredError, setRequiredError] = React.useState(false);
    // Part-sheet state for Step 2 (add / edit).
    const [partSheetMode, setPartSheetMode] = React.useState(null);
    const [sheetName, setSheetName] = React.useState('');
    const [sheetColor, setSheetColor] = React.useState(PART_COLORS[0]);
    const [sheetNotes, setSheetNotes] = React.useState('');
    const sizes = sizesFor(draft.craft);
    const nameLen = draft.name.length;
    const nameValid = draft.name.trim().length > 0;
    const nameState = validateProjectName(nameLen, requiredError, PROJECT_NAME_MAX);
    const nameTokenKey = STATE_TO_COLOR_TOKEN[nameState];
    const nameStateColor = `var(--color-${nameTokenKey})`;
    React.useEffect(() => {
        if (requiredError && nameLen > 0)
            setRequiredError(false);
    }, [requiredError, nameLen]);
    function update(patch) { setDraft((d) => ({ ...d, ...patch })); }
    function setPart(partId, patch) {
        setDraft((d) => ({
            ...d,
            parts: d.parts.map((p) => p.id === partId ? { ...p, ...patch } : p),
        }));
    }
    function reorderPart(fromIdx, toIdx) {
        setDraft((d) => {
            const next = [...d.parts];
            const [moved] = next.splice(fromIdx, 1);
            if (!moved)
                return d;
            next.splice(toIdx, 0, moved);
            return { ...d, parts: next };
        });
    }
    function addSeqToPart(partId, libSeq) {
        setPart(partId, {
            sequences: [...(draft.parts.find((p) => p.id === partId)?.sequences ?? []), fromLibrarySeq(libSeq)],
        });
    }
    function updateSeqInPart(partId, seqId, patch) {
        const part = draft.parts.find((p) => p.id === partId);
        if (!part)
            return;
        setPart(partId, { sequences: part.sequences.map((sq) => sq.id === seqId ? { ...sq, ...patch } : sq) });
    }
    function next() {
        if (step === 0 && !nameValid) {
            setRequiredError(true);
            return;
        }
        setStep((s) => Math.min(3, s + 1));
    }
    // ─── Part sheet helpers ───────────────────────────────────────
    function openAddSheet() {
        const used = new Set(draft.parts.map((p) => p.color));
        const nextColor = PART_COLORS.find((c) => !used.has(c)) ?? PART_COLORS[draft.parts.length % PART_COLORS.length];
        setSheetName('');
        setSheetColor(nextColor);
        setSheetNotes('');
        setPartSheetMode('add');
    }
    function openEditSheet(part) {
        setSheetName(part.name);
        setSheetColor(part.color);
        setSheetNotes(part.notes ?? '');
        setPartSheetMode({ kind: 'edit', id: part.id });
    }
    function closePartSheet() { setPartSheetMode(null); }
    function confirmPartAdd() {
        if (!sheetName.trim())
            return;
        setDraft((d) => {
            // First explicit add replaces the implicit default "Main" placeholder so
            // the slot number reads 1, not 2 — same behavior as mobile.
            const replacingDefault = !d.partsCustomized && d.parts.length === 1;
            const newPart = {
                id: uuid(),
                name: sheetName.trim(),
                color: sheetColor,
                ...(sheetNotes.trim() ? { notes: sheetNotes.trim() } : {}),
                sequences: [],
            };
            return {
                ...d,
                parts: replacingDefault ? [newPart] : [...d.parts, newPart],
                partsCustomized: true,
            };
        });
        closePartSheet();
    }
    function confirmPartEdit() {
        if (partSheetMode === null || partSheetMode === 'add')
            return;
        const id = partSheetMode.id;
        setDraft((d) => ({
            ...d,
            parts: d.parts.map((p) => p.id === id
                ? { ...p, name: sheetName.trim() || p.name, color: sheetColor, notes: sheetNotes.trim() || undefined }
                : p),
            partsCustomized: true,
        }));
        closePartSheet();
    }
    function confirmPartRemove() {
        if (partSheetMode === null || partSheetMode === 'add')
            return;
        if (draft.parts.length <= 1)
            return;
        const id = partSheetMode.id;
        setDraft((d) => ({ ...d, parts: d.parts.filter((p) => p.id !== id) }));
        closePartSheet();
    }
    function back() {
        if (step === 0)
            navigate('/');
        else
            setStep((s) => Math.max(0, s - 1));
    }
    function finish() {
        const project = draftToProject(draft);
        addProject(project);
        navigate(`/project/${project.id}`);
    }
    const stepLabels = [
        t('wizard.step.basics', 'Basics'),
        t('wizard.step.parts', 'Parts'),
        t('wizard.step.sequences', 'Sequences'),
        t('wizard.step.arrange', 'Arrange'),
    ];
    const stepSubs = [
        t('wizard.step.basicsSub', 'Name, yarn & tool'),
        t('wizard.step.partsSub', 'Break it into pieces'),
        t('wizard.step.sequencesSub', 'Plan the rows'),
        t('wizard.step.arrangeSub', 'Order & repeats'),
    ];
    return (_jsxs("div", { className: s.shell, children: [_jsxs("aside", { className: s.rail, children: [_jsx(PageHeader, { eyebrow: t('wizard.eyebrow', 'Cast on'), title: t('wizard.title', 'New project') }), stepLabels.map((label, i) => {
                        const active = i === step;
                        const done = i < step;
                        return (_jsxs("button", { type: "button", className: [s.railItem, active ? s.railActive : '', done ? s.railDone : ''].filter(Boolean).join(' '), onClick: () => (i < step || (i === step + 1 && step === 0 && nameValid)) ? setStep(i) : null, children: [_jsx("span", { className: s.railIdx, children: done ? _jsx(Icon, { name: "check", size: 18 }) : i + 1 }), _jsxs("span", { className: s.railText, children: [_jsx("span", { className: s.railTitle, children: label }), _jsx("span", { className: s.railSub, children: stepSubs[i] })] })] }, label));
                    })] }), _jsxs("div", { className: s.body, children: [_jsxs("div", { className: s.content, children: [step === 0 && (_jsxs(_Fragment, { children: [_jsx("h2", { style: { fontFamily: 'var(--font-display)', fontSize: 32 }, children: t('wizard.basics.title', 'Tell us about your project') }), _jsxs("div", { className: s.field, children: [_jsx(FieldLabel, { required: requiredError && !nameValid, hint: `${nameLen}/${PROJECT_NAME_MAX}`, children: t('wizard.basics.name', 'Project name') }), _jsxs("div", { className: [s.nameWrap, requiredError && !nameValid ? s.nameWrapError : nameValid ? s.nameWrapValid : ''].filter(Boolean).join(' '), children: [_jsx("input", { autoFocus: true, className: s.input, style: { background: 'transparent', border: 0, padding: 0, height: 'auto', width: '100%', fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--color-ink)' }, value: draft.name, maxLength: PROJECT_NAME_MAX, onChange: (e) => update({ name: e.target.value }), placeholder: t('wizard.basics.namePlaceholder', 'e.g. Sunday cardigan') }), requiredError && !nameValid && (_jsx("span", { className: s.nameBang, "aria-hidden": true, children: "!" }))] }), _jsxs("div", { className: s.meterRow, children: [_jsx("div", { className: s.meterTrack, children: _jsx("div", { className: s.meterFill, style: { width: `${Math.min(100, (nameLen / PROJECT_NAME_MAX) * 100)}%`, background: nameStateColor } }) }), _jsxs("span", { className: s.meterCount, style: { color: nameStateColor }, children: [nameLen, " / ", PROJECT_NAME_MAX] })] }), _jsx("div", { className: s.meterMsg, style: { color: nameStateColor }, children: t(`wizard.nameState${nameState[0].toUpperCase() + nameState.slice(1)}`, defaultNameMsg(nameState)) })] }), _jsxs("div", { className: s.field, children: [_jsx(FieldLabel, { children: t('wizard.basics.craft', 'Craft') }), _jsx("div", { className: s.pillRow, children: ['knit', 'crochet'].map((c) => (_jsx(Chip, { active: draft.craft === c, size: "lg", icon: c === 'knit' ? 'needle' : 'loop', onClick: () => update({ craft: c, needleSize: sizesFor(c)[0]?.mm ?? '' }), children: t(`craft.${c}`, c) }, c))) })] }), _jsxs("div", { className: s.field, children: [_jsx(FieldLabel, { children: t('wizard.basics.weight', 'Yarn weight') }), _jsx("div", { className: s.pillRow, children: YARN_WEIGHTS.map((w) => (_jsx(Chip, { active: draft.yarnWeight === w, onClick: () => update({ yarnWeight: w }), children: w }, w))) })] }), _jsxs("div", { className: s.field, children: [_jsx(FieldLabel, { hint: draft.craft === 'knit' ? t('wizard.needleSizeSub', 'mm with US equivalent') : t('wizard.hookSizeSub', 'mm'), children: draft.craft === 'knit' ? t('wizard.basics.needle', 'Needle size') : t('wizard.basics.hook', 'Hook size') }), _jsx(NeedleSizeCard, { draft: draft, sizes: sizes, needleUnit: needleUnit, onChange: (mm) => update({ needleSize: mm }) }), draft.craft === 'knit' && (_jsx("div", { className: s.pillRow, style: { marginTop: 8 }, children: KNIT_NEEDLE_TYPES.map((nt) => (_jsx(Chip, { active: draft.needleType === nt, onClick: () => update({ needleType: nt }), children: nt }, nt))) }))] }), _jsxs("div", { className: s.field, children: [_jsx(FieldLabel, { children: t('wizard.basics.color', 'Yarn color') }), _jsxs("div", { className: s.colorRow, children: [YARN_COLORS.map((c) => (_jsx("button", { type: "button", onClick: () => update({ yarnColor: c }), className: [s.colorDot, draft.yarnColor === c ? s.colorActive : ''].filter(Boolean).join(' '), style: { background: c }, "aria-label": c }, c))), _jsx("button", { type: "button", className: s.colorDotAdd, "aria-label": t('wizard.basics.addColor', 'Add a custom color'), children: _jsx(Icon, { name: "plus", size: 16 }) })] })] }), _jsxs("div", { className: s.field, children: [_jsx(FieldLabel, { children: t('wizard.basics.notes', 'Notes') }), _jsx("textarea", { className: s.input, style: { minHeight: 80, padding: 14, lineHeight: 1.4 }, value: draft.notes, onChange: (e) => update({ notes: e.target.value }), placeholder: t('wizard.basics.notesPlaceholder', 'Anything you want to remember…') })] })] })), step === 1 && (_jsxs(_Fragment, { children: [_jsx("h2", { style: { fontFamily: 'var(--font-display)', fontSize: 32 }, children: t('wizard.parts.title', 'Break it into parts') }), !draft.partsCustomized && draft.parts.length === 1 ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: s.partsEmpty, children: [_jsxs("div", { className: s.partsEmptyMotif, children: [_jsx("span", { className: s.motifTileFull }), _jsx("span", { className: s.motifTileDashed, children: _jsx(Icon, { name: "plus", size: 12 }) }), _jsx("span", { className: [s.motifTileDashed, s.motifTileFade].join(' '), children: _jsx(Icon, { name: "plus", size: 12 }) })] }), _jsx("h3", { className: s.partsEmptyTitle, children: t('wizard.step2EmptyTitle', 'Just the one piece?') }), _jsx("p", { className: s.partsEmptyBody, children: t('wizard.step2EmptyBody', "Scarves, dishcloths, blankets, simple hats — they're a single piece, and YarnLog's happy with that. Add more parts only if your project splits into separate pieces, like sleeves, panels, or a pocket.") }), _jsxs("button", { type: "button", className: s.partsEmptyCta, onClick: openAddSheet, children: [_jsx(Icon, { name: "plus", size: 14 }), _jsx("span", { children: t('wizard.addPart', 'Add a part') })] }), _jsx("span", { className: s.partsEmptyNote, children: t('wizard.step2DecorativeNote', '✻ one part is a whole project ✻') })] }), _jsxs(Tip, { children: [_jsx("b", { style: { color: 'var(--color-ink)' }, children: t('common.notSure', 'Not sure?') }), ' ', t('wizard.step2EmptyTipBody', 'Knit a sample first, then come back and split it if you need to. You can add parts at any time.')] })] })) : (_jsxs(_Fragment, { children: [_jsx(Tip, { children: t('wizard.parts.tip', 'A "part" is a sub-piece — e.g. body, sleeve, collar. Tap a row to edit; drag the grip to reorder.') }), _jsx("div", { className: s.partsList, children: draft.parts.map((p, idx) => (_jsxs("div", { className: s.partRow, draggable: true, onDragStart: (e) => { e.dataTransfer.setData('text/plain', String(idx)); }, onDragOver: (e) => e.preventDefault(), onDrop: (e) => { const from = Number(e.dataTransfer.getData('text/plain')); if (!Number.isNaN(from))
                                                        reorderPart(from, idx); }, onClick: () => openEditSheet(p), children: [_jsx(Icon, { name: "grip", size: 18 }), _jsx("div", { className: s.partTile, style: { background: p.color }, children: idx + 1 }), _jsxs("div", { className: s.partBody, children: [_jsx("span", { className: s.partTitle, children: p.name }), _jsx("span", { className: s.partMeta, children: t('wizard.partMeta', { count: p.sequences.length, defaultValue: `${p.sequences.length} sequences` }) })] }), _jsx(Icon, { name: "edit", size: 16 })] }, p.id))) }), _jsx(Btn, { icon: "plus", variant: "ghost", onClick: openAddSheet, children: t('wizard.parts.add', 'Add another part') })] }))] })), step === 2 && (_jsxs(_Fragment, { children: [_jsx("h2", { style: { fontFamily: 'var(--font-display)', fontSize: 32 }, children: t('wizard.seqs.title', 'Plan every sequence') }), _jsx(Step3, { parts: draft.parts, craft: draft.craft, onPartsChange: (parts) => setDraft((d) => ({ ...d, parts })) })] })), step === 3 && (_jsxs(_Fragment, { children: [_jsx("h2", { style: { fontFamily: 'var(--font-display)', fontSize: 32 }, children: t('wizard.arrange.title', 'Arrange the part') }), _jsx(Tip, { children: t('wizard.arrange.tip', "Drag sequences to set the knitting order, dial in repeats, and toggle loop if it tubes.") }), draft.parts.map((p) => {
                                        const totalRows = p.sequences.reduce((a, sq) => a + sq.rows.length * sq.totalRepeats, 0);
                                        return (_jsxs("div", { className: s.arrangePart, children: [_jsxs("div", { className: s.arrangePartHead, children: [_jsx("span", { className: s.arrangePartDot, style: { background: p.color } }), _jsx("span", { className: s.arrangePartName, children: p.name }), _jsx("span", { className: s.arrangePartSub, children: t('wizard.arrange.inOrder', '· sequences in order') })] }), p.sequences.map((sq) => (_jsxs("div", { className: s.arrangeSeqRow, children: [_jsx(Icon, { name: "grip", size: 18 }), _jsx("span", { className: s.arrangeSeqIdx, children: p.sequences.indexOf(sq) + 1 }), _jsxs("div", { className: s.arrangeSeqBody, children: [_jsx("span", { className: s.arrangeSeqName, children: sq.name }), _jsx("span", { className: s.arrangeSeqMeta, children: t('wizard.arrange.rowsTimes', {
                                                                        rows: sq.rows.length,
                                                                        rep: sq.totalRepeats,
                                                                        total: sq.rows.length * sq.totalRepeats,
                                                                        defaultValue: `${sq.rows.length} rows × ${sq.totalRepeats} = ${sq.rows.length * sq.totalRepeats} total`,
                                                                    }) })] }), _jsxs("div", { className: s.repeatStepper, children: [_jsx(Icon, { name: "repeat", size: 14 }), _jsx("span", { className: s.repeatStepperLabel, children: t('wizard.arrange.repeats', 'Repeat ×') }), _jsx("button", { type: "button", className: s.repeatStepperBtn, onClick: () => updateSeqInPart(p.id, sq.id, { totalRepeats: Math.max(1, sq.totalRepeats - 1) }), children: "\u2212" }), _jsx("span", { className: s.repeatStepperValue, children: sq.totalRepeats }), _jsx("button", { type: "button", className: s.repeatStepperBtn, onClick: () => updateSeqInPart(p.id, sq.id, { totalRepeats: sq.totalRepeats + 1 }), children: "+" })] })] }, sq.id))), _jsxs("label", { className: s.loopRow, children: [_jsx("span", { className: s.loopIcon, children: _jsx(Icon, { name: "refresh", size: 18 }) }), _jsxs("span", { className: s.loopBody, children: [_jsx("span", { className: s.loopTitle, children: t('wizard.arrange.loopPart', 'Loop the whole part') }), _jsx("span", { className: s.loopSub, children: t('wizard.arrange.loopSub', 'After the last sequence, cycle back to #1. Great for tubes & socks.') })] }), _jsxs("span", { className: [s.toggle, p.loop ? s.toggleOn : ''].filter(Boolean).join(' '), children: [_jsx("input", { type: "checkbox", checked: !!p.loop, onChange: (e) => setPart(p.id, { loop: e.target.checked }), className: s.toggleInput }), _jsx("span", { className: s.toggleKnob })] })] }), _jsxs("div", { className: s.tally, children: [_jsxs("span", { className: s.tallyEyebrow, children: [p.name, " \u00B7 ", t('wizard.arrange.finalTally', 'final tally')] }), _jsxs("div", { className: s.tallyMain, children: [_jsx("span", { className: s.tallyNumber, children: totalRows }), _jsx("span", { className: s.tallyLabel, children: t('wizard.arrange.rowsTotal', 'rows total') })] }), _jsx("span", { className: s.tallyBreakdown, children: p.sequences.map((sq, i) => (_jsxs("span", { children: [i > 0 ? ' · ' : '', sq.totalRepeats > 1
                                                                        ? `${sq.rows.length}×${sq.totalRepeats} ${sq.name.toLowerCase()}`
                                                                        : `${sq.rows.length} ${sq.name.toLowerCase()}`] }, sq.id))) })] })] }, p.id));
                                    })] }))] }), _jsxs("div", { className: s.foot, children: [_jsx(Btn, { variant: "ghost", onClick: back, children: step === 0 ? t('action.cancel', 'Cancel') : t('action.back', 'Back') }), _jsx("div", { className: s.pips, children: [0, 1, 2, 3].map((i) => (_jsx("span", { className: [
                                        s.pip,
                                        i < step ? s.pipDone : '',
                                        i === step ? s.pipCurrent : '',
                                    ].filter(Boolean).join(' ') }, i))) }), step < 3 ? (step === 0 && !nameValid ? (_jsxs("button", { type: "button", className: s.nextBlocked, onClick: next, children: [_jsx("span", { className: s.nextBlockedBang, children: "!" }), _jsx("span", { children: t('wizard.blockedAddName', 'Add a project name first') })] })) : (_jsxs(Btn, { onClick: next, iconAfter: "chevR", children: [t('action.next', 'Next'), ": ", stepLabels[step + 1]] }))) : (_jsx(Btn, { onClick: finish, variant: "mustard", icon: "play", children: t('wizard.finish', 'Cast on!') }))] })] }), (() => {
                if (partSheetMode === null)
                    return null;
                const isEdit = partSheetMode !== 'add';
                const editingId = isEdit ? partSheetMode.id : null;
                const editingIdx = editingId ? draft.parts.findIndex((p) => p.id === editingId) : -1;
                const editingPart = editingId ? draft.parts.find((p) => p.id === editingId) : undefined;
                const slotNumber = isEdit
                    ? Math.max(1, editingIdx + 1)
                    : (!draft.partsCustomized && draft.parts.length === 1 ? 1 : draft.parts.length + 1);
                return (_jsxs(Modal, { open: true, onClose: closePartSheet, align: "bottom", width: 620, children: [_jsxs("div", { className: s.sheetHeader, children: [_jsx("span", { className: s.sheetEyebrow, children: isEdit
                                        ? t('wizard.partSheetEditingSlot', { current: editingIdx + 1, total: draft.parts.length, defaultValue: `Editing part ${editingIdx + 1} of ${draft.parts.length}` })
                                        : t('wizard.partSheetNewSlot', { slot: slotNumber, defaultValue: `New part · slot ${slotNumber}` }) }), _jsx("h3", { className: s.sheetTitle, children: isEdit
                                        ? t('wizard.partSheetEditTitle', { name: editingPart?.name ?? '', defaultValue: 'Edit part' })
                                        : t('wizard.partSheetAddTitle', 'Add a part') })] }), _jsxs(Modal.Body, { children: [_jsxs("div", { className: s.sheetIdentity, children: [_jsxs("div", { className: s.sheetPreview, children: [_jsx("div", { className: s.sheetPreviewTile, style: { background: sheetColor }, children: slotNumber }), _jsx("span", { className: s.sheetPreviewLabel, children: t('wizard.preview', 'Preview') })] }), _jsxs("div", { style: { flex: 1 }, children: [_jsx("span", { className: s.sheetFieldLabel, children: t('wizard.partName', 'Part name') }), _jsx("input", { className: s.sheetNameInput, value: sheetName, onChange: (e) => setSheetName(e.target.value), placeholder: t('wizard.partNamePlaceholder', 'e.g. Left sleeve'), autoFocus: true })] })] }), _jsx("span", { className: s.sheetFieldLabel, style: { marginTop: 22 }, children: t('wizard.tileColor', 'Tile color') }), _jsx("div", { className: s.sheetColorRow, children: PART_COLORS.map((c) => (_jsx("button", { type: "button", onClick: () => setSheetColor(c), className: [s.colorDot, sheetColor === c ? s.colorActive : ''].filter(Boolean).join(' '), style: { background: c, width: 42, height: 42 }, "aria-label": c }, c))) }), _jsx("span", { className: s.sheetFieldLabel, style: { marginTop: 22 }, children: t('wizard.notes', 'Notes') }), _jsx("textarea", { className: s.input, style: { minHeight: 64, padding: 14, lineHeight: 1.4 }, value: sheetNotes, onChange: (e) => setSheetNotes(e.target.value), placeholder: t('wizard.partNotesPlaceholder', 'optional · just for you') }), isEdit && draft.parts.length > 1 && (_jsxs("div", { className: s.sheetDanger, children: [_jsxs("button", { type: "button", className: s.sheetRemoveBtn, onClick: confirmPartRemove, children: [_jsx(Icon, { name: "trash", size: 16 }), _jsx("span", { children: t('wizard.removeThisPart', 'Remove this part') })] }), _jsx("span", { className: s.sheetRemoveNote, children: t('wizard.removeWarning', { count: editingPart?.sequences.length ?? 0, defaultValue: 'Its sequences will stay in your Library.' }) })] }))] }), _jsxs(Modal.Footer, { children: [_jsx(Btn, { variant: "ghost", onClick: closePartSheet, children: t('common.cancel', 'Cancel') }), _jsx(Btn, { icon: isEdit ? 'check' : 'plus', onClick: isEdit ? confirmPartEdit : confirmPartAdd, disabled: !sheetName.trim(), children: isEdit
                                        ? t('wizard.saveChanges', 'Save changes')
                                        : t('wizard.addPartConfirm', 'Add part') })] })] }));
            })(), _jsx(Modal, { open: !!seqPickerForPart, onClose: () => setSeqPickerForPart(null), title: t('wizard.seqs.pickerTitle', 'Pick a sequence'), width: 620, children: _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: 8 }, children: libSequences.filter((sq) => sq.craft === draft.craft).map((sq) => (_jsxs("button", { type: "button", onClick: () => { if (seqPickerForPart)
                            addSeqToPart(seqPickerForPart, sq); setSeqPickerForPart(null); }, style: {
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '12px 14px',
                            borderRadius: 12,
                            background: 'transparent',
                            color: 'var(--color-ink)',
                            cursor: 'pointer',
                            border: '1px solid var(--color-rule)',
                            fontFamily: 'var(--font-body)',
                            fontSize: 14,
                        }, children: [_jsx("span", { style: { fontWeight: 600 }, children: sq.name }), _jsxs("span", { style: { color: 'var(--color-inkSoft)' }, children: [sq.rows.length, " ", t('wizard.seqs.rows', 'rows')] })] }, sq.id))) }) })] }));
}
function NeedleSizeCard({ draft, sizes, needleUnit, onChange }) {
    const idx = Math.max(0, sizes.findIndex((sz) => sz.mm === draft.needleSize));
    const entry = sizes[idx];
    if (!entry)
        return null;
    const display = formatNeedleSize(draft.craft, entry.mm, needleUnit);
    const typical = entry.typical;
    return (_jsxs("div", { className: s.needleCard, children: [_jsx("div", { className: s.needleIconBox, children: _jsx(Icon, { name: draft.craft === 'knit' ? 'needle' : 'loop', size: 20 }) }), _jsxs("div", { className: s.needleBody, children: [_jsx("span", { className: s.needleValue, children: display }), typical && _jsxs("span", { className: s.needleHint, children: ["typical for ", typical] })] }), _jsxs("div", { className: s.needleStepper, children: [_jsx("button", { type: "button", className: s.needleStepBtn, onClick: () => idx > 0 && onChange(sizes[idx - 1].mm), disabled: idx === 0, "aria-label": "Smaller", children: "\u2212" }), _jsx("button", { type: "button", className: s.needleStepBtn, onClick: () => idx < sizes.length - 1 && onChange(sizes[idx + 1].mm), disabled: idx === sizes.length - 1, "aria-label": "Bigger", children: "+" })] })] }));
}
