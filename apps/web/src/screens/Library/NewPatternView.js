import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLibraryStore, useSettingsStore, uuid, } from '@skein/shared';
import Modal from '../../components/ui/Modal';
import Btn from '../../components/ui/Btn';
import Chip from '../../components/ui/Chip';
import Icon from '../../components/ui/Icon';
import Section from '../../components/ui/Section';
import ReuseChooser from '../../components/ui/ReuseChooser';
import s from './BuilderView.module.css';
import patStyles from './NewPatternView.module.css';
export default function NewPatternView() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { id } = useParams();
    const existing = useLibraryStore((st) => (id ? st.patterns.find((p) => p.id === id) : undefined));
    const allSequences = useLibraryStore((st) => st.sequences);
    const addPattern = useLibraryStore((st) => st.addPattern);
    const updatePattern = useLibraryStore((st) => st.updatePattern);
    const defaultCraft = useSettingsStore((st) => st.defaultCraft);
    const isEditing = !!existing;
    const [name, setName] = React.useState(existing?.name ?? '');
    const [craft, setCraft] = React.useState(existing?.craft ?? defaultCraft);
    const [sequenceIds, setSequenceIds] = React.useState(existing?.sequenceIds ?? []);
    const [pickerOpen, setPickerOpen] = React.useState(false);
    const ready = name.trim().length > 0 && sequenceIds.length > 0;
    const containedSequences = sequenceIds
        .map((sid) => allSequences.find((s) => s.id === sid))
        .filter((sq) => Boolean(sq));
    function save() {
        if (!ready)
            return;
        const payload = {
            id: existing?.id ?? uuid(),
            name: name.trim(),
            craft,
            sequenceIds,
            isBuiltIn: false,
        };
        if (isEditing)
            updatePattern(payload);
        else
            addPattern(payload);
        navigate('/library');
    }
    function addSeq(seqId) {
        setSequenceIds((ids) => ids.includes(seqId) ? ids : [...ids, seqId]);
    }
    function removeSeq(idx) {
        setSequenceIds((ids) => ids.filter((_, i) => i !== idx));
    }
    function move(from, to) {
        setSequenceIds((ids) => {
            const next = [...ids];
            const [moved] = next.splice(from, 1);
            if (!moved)
                return ids;
            next.splice(to, 0, moved);
            return next;
        });
    }
    const eligible = allSequences.filter((sq) => sq.craft === craft);
    return (_jsxs("div", { className: s.shell, children: [_jsx(Modal.DefinerHeader, { kind: t(isEditing ? 'libraryCreate.editPatternBadge' : 'libraryCreate.draftPattern', isEditing ? 'Pattern · editing' : 'Pattern · draft'), ready: ready, onClose: () => navigate('/library'), onSave: save, saveLabel: t('common.save', 'Save') }), _jsxs("div", { className: s.titleBlock, children: [_jsx("h1", { className: s.title, children: isEditing
                            ? t('libraryCreate.editPatternTitle', 'Edit pattern')
                            : t('libraryCreate.newPatternTitle', 'New pattern') }), _jsx("p", { className: s.sub, children: t('libraryCreate.newPatternSub', 'The whole make — sequences in order. Your master recipe.') })] }), _jsxs("div", { className: s.scrollBody, children: [_jsxs(Section, { label: t('libraryCreate.identityLabel', 'Name & craft'), children: [_jsx("input", { className: s.nameInput, value: name, onChange: (e) => setName(e.target.value.slice(0, 60)), placeholder: t('libraryCreate.namePlaceholderPat', 'e.g. Raglan pullover'), autoFocus: !isEditing, maxLength: 60 }), _jsxs("div", { className: s.craftRow, children: [_jsx(Chip, { active: craft === 'knit', icon: "needle", onClick: () => setCraft('knit'), children: t('craft.knit', 'Knit') }), _jsx(Chip, { active: craft === 'crochet', icon: "loop", onClick: () => setCraft('crochet'), children: t('craft.crochet', 'Crochet') })] })] }), _jsx(Section, { label: t('libraryCreate.sequencesInPattern', 'Sequences in this pattern'), hint: t('libraryCreate.sequencesCount', { count: sequenceIds.length, defaultValue: `${sequenceIds.length} sequences` }), children: _jsxs("div", { className: patStyles.list, children: [containedSequences.map((seq, idx) => (_jsxs("article", { className: patStyles.row, children: [_jsx(Icon, { name: "grip", size: 16 }), _jsx("span", { className: patStyles.idx, children: idx + 1 }), _jsx("span", { className: patStyles.name, children: seq.name }), _jsxs("span", { className: patStyles.meta, children: [seq.rows.length, " ", t('library.rows', 'rows'), seq.totalRepeats > 1 ? ` · ×${seq.totalRepeats}` : ''] }), _jsx("button", { type: "button", className: patStyles.moveBtn, onClick: () => move(idx, Math.max(0, idx - 1)), disabled: idx === 0, "aria-label": "Move up", children: _jsx(Icon, { name: "chevL", size: 14 }) }), _jsx("button", { type: "button", className: patStyles.moveBtn, onClick: () => move(idx, Math.min(sequenceIds.length - 1, idx + 1)), disabled: idx === sequenceIds.length - 1, "aria-label": "Move down", children: _jsx(Icon, { name: "chevR", size: 14 }) }), _jsx("button", { type: "button", className: patStyles.removeBtn, onClick: () => removeSeq(idx), "aria-label": t('action.remove', 'Remove'), children: _jsx(Icon, { name: "trash", size: 14 }) })] }, `${seq.id}-${idx}`))), containedSequences.length === 0 && (_jsx("p", { className: patStyles.empty, children: t('libraryCreate.patternEmpty', 'No sequences yet. Add ones you\'ve already saved.') })), _jsx(ReuseChooser, { kind: "sequence", libraryCount: eligible.length, onPickFromLibrary: () => setPickerOpen(true) })] }) }), _jsx("p", { className: s.signoff, children: t('libraryCreate.signoffPat', '✻ a recipe to follow ✻') })] }), _jsx(Modal, { open: pickerOpen, onClose: () => setPickerOpen(false), title: t('libraryCreate.pickSequence', 'Pick a sequence to add'), width: 620, children: _jsxs("div", { className: patStyles.pickerList, children: [eligible.length === 0 && (_jsx("p", { className: patStyles.empty, children: t('libraryCreate.noEligibleSequences', 'No saved sequences match this craft yet.') })), eligible.map((sq) => (_jsxs("button", { type: "button", className: patStyles.pickerRow, onClick: () => { addSeq(sq.id); setPickerOpen(false); }, children: [_jsx("span", { className: patStyles.pickerName, children: sq.name }), _jsxs("span", { className: patStyles.pickerMeta, children: [sq.rows.length, " ", t('library.rows', 'rows')] }), _jsx(Icon, { name: "plus", size: 16 })] }, sq.id))), _jsx(Btn, { variant: "ghost", icon: "plus", onClick: () => { setPickerOpen(false); navigate('/library/new/sequence'); }, children: t('libraryCreate.buildNewSeq', 'Build a new sequence') })] }) })] }));
}
