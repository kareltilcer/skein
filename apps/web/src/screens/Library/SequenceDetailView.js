import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLibraryStore, expandStitches, } from '@skein/shared';
import IconBtn from '../../components/ui/IconBtn';
import Btn from '../../components/ui/Btn';
import SwatchTile from '../../components/ui/SwatchTile';
import StitchTile from '../../components/ui/StitchTile';
import RepeatRowBody from '../../components/ui/RepeatRowBody';
import s from './DetailView.module.css';
export default function SequenceDetailView() {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const seq = useLibraryStore((st) => st.sequences.find((sq) => sq.id === id));
    if (!seq) {
        return (_jsxs("div", { className: s.notFound, children: [_jsx(IconBtn, { name: "back", onClick: () => navigate('/library'), "aria-label": t('action.back', 'Back') }), _jsx("p", { children: t('library.notFound', 'Item not found.') })] }));
    }
    const ids0 = seq.rows[0] ? expandStitches(seq.rows[0].stitches) : ['k', 'p', 'k', 'p'];
    return (_jsxs("div", { className: s.wrap, children: [_jsxs("header", { className: s.topBar, children: [_jsx(IconBtn, { name: "back", onClick: () => navigate('/library'), "aria-label": t('action.back', 'Back') }), _jsx("span", { className: s.eyebrow, children: t('library.detailTitleSequence', 'Sequence') }), _jsx("span", { "aria-hidden": true, style: { width: 36 } })] }), _jsxs("section", { className: s.hero, children: [_jsx(SwatchTile, { pattern: ids0, size: 72 }), _jsxs("div", { className: s.heroBody, children: [_jsx("h1", { className: s.title, children: seq.name }), _jsxs("div", { className: s.chips, children: [_jsx("span", { className: s.chip, children: t(`craft.${seq.craft}`, seq.craft) }), _jsx("span", { className: s.chip, children: t('library.rowsMeta', { count: seq.rows.length, craft: '', defaultValue: `${seq.rows.length} rows` }).trim() }), seq.totalRepeats > 1 && _jsxs("span", { className: s.chip, children: ["\u00D7", seq.totalRepeats] })] })] })] }), _jsxs("section", { className: s.section, children: [_jsxs("div", { className: s.sectionHead, children: [_jsx("span", { className: s.sectionLabel, children: t('library.detailRowsHeader', 'The rows') }), _jsx("span", { className: s.sectionHint, children: t('library.detailReadDirection', 'repeats top → bottom') })] }), _jsx("div", { className: s.rowsList, children: seq.rows.map((row, i) => (_jsxs("article", { className: s.rowCard, children: [_jsxs("header", { className: s.rowCardHead, children: [_jsx("span", { className: s.rowLabel, children: row.label || t('library.detailRowNumber', { n: i + 1, defaultValue: `Row ${i + 1}` }) }), _jsxs("span", { className: s.rowCount, children: [stitchTotal(row.stitches), " ", t('library.stsAbbr', 'sts')] })] }), row.segments
                                    ? _jsx(RepeatRowBody, { segments: row.segments })
                                    : _jsx(RowTiles, { stitches: row.stitches })] }, row.id))) })] }), _jsx("footer", { className: s.foot, children: _jsx(Btn, { icon: "edit", onClick: () => navigate(`/library/sequence/${seq.id}/edit`), children: t('library.editCta', 'Edit sequence') }) })] }));
}
function RowTiles({ stitches }) {
    const ids = expandStitches(stitches);
    return (_jsx("div", { className: s.tiles, children: ids.map((id, i) => _jsx(StitchTile, { id: id }, i)) }));
}
function stitchTotal(stitches) {
    return stitches.reduce((sum, x) => sum + x.count, 0);
}
