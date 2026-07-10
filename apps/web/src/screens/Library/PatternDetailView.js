import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLibraryStore, expandStitches, } from '@skein/shared';
import IconBtn from '../../components/ui/IconBtn';
import Btn from '../../components/ui/Btn';
import SwatchTile from '../../components/ui/SwatchTile';
import Icon from '../../components/ui/Icon';
import s from './DetailView.module.css';
export default function PatternDetailView() {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const pat = useLibraryStore((st) => st.patterns.find((p) => p.id === id));
    const allSequences = useLibraryStore((st) => st.sequences);
    if (!pat) {
        return (_jsxs("div", { className: s.notFound, children: [_jsx(IconBtn, { name: "back", onClick: () => navigate('/library'), "aria-label": t('action.back', 'Back') }), _jsx("p", { children: t('library.notFound', 'Item not found.') })] }));
    }
    const containedSequences = pat.sequenceIds
        .map((sid) => allSequences.find((s) => s.id === sid))
        .filter((s) => Boolean(s));
    const firstSeq = containedSequences[0];
    const firstIds = firstSeq?.rows[0] ? expandStitches(firstSeq.rows[0].stitches) : ['k', 'p', 'k', 'p'];
    return (_jsxs("div", { className: s.wrap, children: [_jsxs("header", { className: s.topBar, children: [_jsx(IconBtn, { name: "back", onClick: () => navigate('/library'), "aria-label": t('action.back', 'Back') }), _jsx("span", { className: s.eyebrow, children: t('library.detailTitlePattern', 'Pattern') }), _jsx("span", { "aria-hidden": true, style: { width: 36 } })] }), _jsxs("section", { className: s.hero, children: [_jsx(SwatchTile, { pattern: firstIds, size: 72 }), _jsxs("div", { className: s.heroBody, children: [_jsx("h1", { className: s.title, children: pat.name }), _jsxs("div", { className: s.chips, children: [_jsx("span", { className: s.chip, children: t(`craft.${pat.craft}`, pat.craft) }), _jsx("span", { className: s.chip, children: t('library.seqsMeta', { count: pat.sequenceIds.length, craft: '', defaultValue: `${pat.sequenceIds.length} sequences` }).trim() })] })] })] }), _jsxs("section", { className: s.section, children: [_jsx("div", { className: s.sectionHead, children: _jsx("span", { className: s.sectionLabel, children: t('library.detailSequencesHeader', 'Sequences in this pattern') }) }), _jsxs("div", { className: s.seqList, children: [containedSequences.map((seq, idx) => (_jsxs("button", { type: "button", className: s.seqRow, onClick: () => navigate(`/library/sequence/${seq.id}`), children: [_jsx("span", { className: s.seqIdx, children: idx + 1 }), _jsx("span", { className: s.seqName, children: seq.name }), _jsxs("span", { className: s.seqMeta, children: [seq.rows.length, " ", t('library.rows', 'rows'), seq.totalRepeats > 1 ? ` · ×${seq.totalRepeats}` : ''] }), _jsx(Icon, { name: "chevR", size: 16 })] }, seq.id))), containedSequences.length === 0 && (_jsx("p", { className: s.empty, children: t('library.detailPatternEmpty', 'This pattern has no sequences yet.') }))] })] }), _jsx("footer", { className: s.foot, children: _jsx(Btn, { icon: "edit", onClick: () => navigate(`/library/pattern/${pat.id}/edit`), children: t('library.editCtaPattern', 'Edit pattern') }) })] }));
}
