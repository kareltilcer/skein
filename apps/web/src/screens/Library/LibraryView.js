import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLibraryStore, } from '@skein/shared';
import PageHeader from '../../components/ui/PageHeader';
import SearchField from '../../components/ui/SearchField';
import Segmented from '../../components/ui/Segmented';
import Chip from '../../components/ui/Chip';
import Card from '../../components/ui/Card';
import Btn from '../../components/ui/Btn';
// Note: the inline "name + craft" Modal is replaced by full-screen builder routes.
import SwatchTile from '../../components/ui/SwatchTile';
import StitchGlyph from '../../components/ui/StitchGlyph';
import Modal from '../../components/ui/Modal';
import { STITCH_MAP } from '@skein/shared';
import LibraryCardMenu from './LibraryCardMenu';
import s from './LibraryView.module.css';
function craftMatches(filter, craft) {
    return filter === 'all' || filter === craft;
}
function notationFromStitches(ids) {
    const out = [];
    let prev = '';
    let count = 0;
    for (const id of ids) {
        if (id === prev) {
            count++;
            continue;
        }
        if (prev)
            out.push(count > 1 ? `${prev}${count}` : prev);
        prev = id;
        count = 1;
    }
    if (prev)
        out.push(count > 1 ? `${prev}${count}` : prev);
    return out.join(', ');
}
function expandRow(row) {
    const out = [];
    for (const s of row.stitches)
        for (let i = 0; i < s.count; i++)
            out.push(s.stitchId);
    return out;
}
function PatternCardView({ p, sequences, onDelete, onView, onEdit, }) {
    const { t } = useTranslation();
    const first = sequences.find((sq) => p.sequenceIds.includes(sq.id));
    const ids = first ? expandRow(first.rows[0] ?? { stitches: [] }) : ['k', 'p', 'k', 'p'];
    return (_jsxs(Card, { pad: "md", hover: true, onClick: onView, className: s.card, children: [_jsx(SwatchTile, { pattern: ids.length > 0 ? ids : ['k', 'p', 'k', 'p'], size: 68 }), _jsxs("div", { className: s.cardBody, children: [_jsx("h3", { className: s.cardName, children: p.name }), _jsxs("div", { className: s.cardMeta, children: [t(`craft.${p.craft}`, p.craft), " \u00B7 ", p.sequenceIds.length, " ", t('library.sequences', 'sequences')] })] }), _jsx(LibraryCardMenu, { kindLabel: t('library.kindPattern', 'pattern'), onEdit: onEdit, onDelete: onDelete })] }));
}
function SequenceCardView({ seq, onDelete, onView, onEdit, }) {
    const { t } = useTranslation();
    const ids = expandRow(seq.rows[0] ?? { stitches: [] });
    return (_jsxs(Card, { pad: "md", hover: true, onClick: onView, className: s.card, children: [_jsx(SwatchTile, { pattern: ids.length > 0 ? ids : ['k'], size: 68 }), _jsxs("div", { className: s.cardBody, children: [_jsx("h3", { className: s.cardName, children: seq.name }), _jsxs("div", { className: s.cardMeta, children: [t(`craft.${seq.craft}`, seq.craft), " \u00B7 ", seq.rows.length, " ", t('library.rows', 'rows'), seq.totalRepeats > 1 ? ` · ×${seq.totalRepeats}` : ''] })] }), _jsx(LibraryCardMenu, { kindLabel: t('library.kindSequence', 'sequence'), onEdit: onEdit, onDelete: onDelete })] }));
}
function RowCardView({ row, onDelete, onView, onEdit, }) {
    const { t } = useTranslation();
    const ids = expandRow(row).slice(0, 8);
    return (_jsxs(Card, { pad: "md", hover: true, onClick: onView, className: s.card, children: [_jsxs("div", { className: s.cardBody, children: [_jsx("h3", { className: s.cardName, children: row.label }), _jsxs("div", { className: s.cardMeta, children: [t(`craft.${row.craft}`, row.craft), " \u00B7 ", notationFromStitches(expandRow(row))] }), _jsx("div", { className: s.rowGlyphs, children: ids.map((id, i) => (_jsx("div", { className: s.rowGlyphCell, children: _jsx(StitchGlyph, { symbol: STITCH_MAP[id]?.symbol ?? 'dot', size: 16 }) }, i))) })] }), _jsx(LibraryCardMenu, { kindLabel: t('library.kindRow', 'row'), onEdit: onEdit, onDelete: onDelete })] }));
}
export default function LibraryView() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const sequences = useLibraryStore((s) => s.sequences);
    const patterns = useLibraryStore((s) => s.patterns);
    const rows = useLibraryStore((s) => s.rows);
    const deleteRow = useLibraryStore((s) => s.deleteRow);
    const deleteSequence = useLibraryStore((s) => s.deleteSequence);
    const deletePattern = useLibraryStore((s) => s.deletePattern);
    const [tab, setTab] = React.useState('patterns');
    const [filter, setFilter] = React.useState('all');
    const [query, setQuery] = React.useState('');
    const [confirmDelete, setConfirmDelete] = React.useState(null);
    const fp = patterns.filter((p) => craftMatches(filter, p.craft) && (!query || p.name.toLowerCase().includes(query.toLowerCase())));
    const fs = sequences.filter((p) => craftMatches(filter, p.craft) && (!query || p.name.toLowerCase().includes(query.toLowerCase())));
    const fr = rows.filter((r) => craftMatches(filter, r.craft) && (!query || r.label.toLowerCase().includes(query.toLowerCase())));
    function createItem() {
        if (tab === 'patterns')
            navigate('/library/new/pattern');
        if (tab === 'sequences')
            navigate('/library/new/sequence');
        if (tab === 'rows')
            navigate('/library/new/row');
    }
    function performDelete() {
        if (!confirmDelete)
            return;
        if (confirmDelete.kind === 'patterns')
            deletePattern(confirmDelete.id);
        if (confirmDelete.kind === 'sequences')
            deleteSequence(confirmDelete.id);
        if (confirmDelete.kind === 'rows')
            deleteRow(confirmDelete.id);
        setConfirmDelete(null);
    }
    const tabs = [
        { id: 'patterns', label: t('library.tabPatterns', 'Patterns'), count: fp.length },
        { id: 'sequences', label: t('library.tabSequences', 'Sequences'), count: fs.length },
        { id: 'rows', label: t('library.tabRows', 'Rows'), count: fr.length },
    ];
    const tabLabel = tabs.find((x) => x.id === tab)?.label ?? '';
    function navigateToDetail(kind, id) {
        if (kind === 'patterns')
            navigate(`/library/pattern/${id}`);
        if (kind === 'sequences')
            navigate(`/library/sequence/${id}`);
        if (kind === 'rows')
            navigate(`/library/row/${id}`);
    }
    function navigateToEdit(kind, id) {
        if (kind === 'patterns')
            navigate(`/library/pattern/${id}/edit`);
        if (kind === 'sequences')
            navigate(`/library/sequence/${id}/edit`);
        if (kind === 'rows')
            navigate(`/library/row/${id}/edit`);
    }
    return (_jsxs("div", { className: s.wrap, children: [_jsx(PageHeader, { eyebrow: t('library.eyebrow', 'Library'), title: t('library.title', 'Library'), sub: t('library.sub', 'Reuse what you\'ve already built.'), right: _jsxs(Btn, { icon: "plus", onClick: createItem, children: [t('library.new', 'New'), " ", tabLabel] }) }), _jsxs("div", { className: s.toolbar, children: [_jsx(Segmented, { items: tabs, value: tab, onChange: (v) => setTab(v) }), _jsx(SearchField, { placeholder: t('library.searchPlaceholder', 'Search by name, stitch, vibe…'), value: query, onChange: (e) => setQuery(e.target.value) })] }), _jsx("div", { className: s.filters, children: ['all', 'knit', 'crochet'].map((f) => (_jsx(Chip, { active: filter === f, onClick: () => setFilter(f), children: t(`craft.${f}`, f) }, f))) }), tab === 'patterns' && (fp.length === 0
                ? _jsx("div", { className: s.empty, children: t('library.emptyState', 'No items yet.') })
                : (_jsx("div", { className: s.grid, children: fp.map((p) => (_jsx(PatternCardView, { p: p, sequences: sequences, onView: () => navigateToDetail('patterns', p.id), onEdit: () => navigateToEdit('patterns', p.id), onDelete: () => setConfirmDelete({ kind: 'patterns', id: p.id, name: p.name }) }, p.id))) }))), tab === 'sequences' && (fs.length === 0
                ? _jsx("div", { className: s.empty, children: t('library.emptyState', 'No items yet.') })
                : (_jsx("div", { className: s.grid, children: fs.map((seq) => (_jsx(SequenceCardView, { seq: seq, onView: () => navigateToDetail('sequences', seq.id), onEdit: () => navigateToEdit('sequences', seq.id), onDelete: () => setConfirmDelete({ kind: 'sequences', id: seq.id, name: seq.name }) }, seq.id))) }))), tab === 'rows' && (fr.length === 0
                ? _jsx("div", { className: s.empty, children: t('library.emptyState', 'No items yet.') })
                : (_jsx("div", { className: s.grid, children: fr.map((row) => (_jsx(RowCardView, { row: row, onView: () => navigateToDetail('rows', row.id), onEdit: () => navigateToEdit('rows', row.id), onDelete: () => setConfirmDelete({ kind: 'rows', id: row.id, name: row.label }) }, row.id))) }))), _jsxs(Modal, { open: !!confirmDelete, onClose: () => setConfirmDelete(null), footer: _jsxs(_Fragment, { children: [_jsx(Btn, { variant: "ghost", onClick: () => setConfirmDelete(null), children: t('common.keepIt', 'Keep it') }), _jsx(Btn, { variant: "primary", icon: "trash", onClick: performDelete, children: t('action.delete', 'Delete') })] }), width: 460, children: [_jsx(Modal.DangerHeader, { title: confirmDelete?.kind === 'patterns' ? t('library.deletePatternTitle', 'Delete this pattern?')
                            : confirmDelete?.kind === 'sequences' ? t('library.deleteSequenceTitle', 'Delete this sequence?')
                                : t('library.deleteRowTitle', 'Delete this row?'), caption: t('common.noUndo', 'No undo') }), _jsx("p", { className: s.deleteBody, children: t('library.deleteConfirm', { name: confirmDelete?.name ?? '', defaultValue: `Remove "${confirmDelete?.name ?? ''}" from your library?` }) })] })] }));
}
