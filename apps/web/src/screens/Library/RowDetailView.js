import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLibraryStore, expandStitches, } from '@skein/shared';
import IconBtn from '../../components/ui/IconBtn';
import Btn from '../../components/ui/Btn';
import StitchTile from '../../components/ui/StitchTile';
import RepeatRowBody from '../../components/ui/RepeatRowBody';
import s from './DetailView.module.css';
export default function RowDetailView() {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const row = useLibraryStore((st) => st.rows.find((r) => r.id === id));
    if (!row) {
        return (_jsxs("div", { className: s.notFound, children: [_jsx(IconBtn, { name: "back", onClick: () => navigate('/library'), "aria-label": t('action.back', 'Back') }), _jsx("p", { children: t('library.notFound', 'Item not found.') })] }));
    }
    const ids = expandStitches(row.stitches);
    const total = ids.length;
    return (_jsxs("div", { className: s.wrap, children: [_jsxs("header", { className: s.topBar, children: [_jsx(IconBtn, { name: "back", onClick: () => navigate('/library'), "aria-label": t('action.back', 'Back') }), _jsx("span", { className: s.eyebrow, children: t('library.detailTitleRow', 'Row') }), _jsx("span", { "aria-hidden": true, style: { width: 36 } })] }), _jsxs("section", { className: s.hero, children: [_jsx("div", { className: s.heroRow, children: ids.slice(0, 4).map((stitchId, i) => _jsx(StitchTile, { id: stitchId }, i)) }), _jsxs("div", { className: s.heroBody, children: [_jsx("h1", { className: s.title, children: row.label }), _jsxs("div", { className: s.chips, children: [_jsx("span", { className: s.chip, children: t(`craft.${row.craft}`, row.craft) }), _jsxs("span", { className: s.chip, children: [total, " ", t('library.stsAbbr', 'sts')] })] })] })] }), _jsxs("section", { className: s.section, children: [_jsx("div", { className: s.sectionHead, children: _jsx("span", { className: s.sectionLabel, children: t('library.detailChart', 'Chart') }) }), row.segments
                        ? _jsx(RepeatRowBody, { segments: row.segments })
                        : _jsx("div", { className: s.tiles, children: ids.map((stitchId, i) => _jsx(StitchTile, { id: stitchId }, i)) })] }), _jsx("footer", { className: s.foot, children: _jsx(Btn, { icon: "edit", onClick: () => navigate(`/library/row/${row.id}/edit`), children: t('library.editCtaRow', 'Edit row') }) })] }));
}
