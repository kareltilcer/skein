import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useProjectStore, useSettingsStore, formatNeedleSize, } from '@skein/shared';
import Btn from '../../components/ui/Btn';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import SearchField from '../../components/ui/SearchField';
import Icon from '../../components/ui/Icon';
import YarnThumb from '../../components/ui/YarnThumb';
import s from './HomeView.module.css';
function ProjectTile({ p, onClick }) {
    const { t } = useTranslation();
    const unit = useSettingsStore((st) => st.needleSizeUnit);
    const done = p.status === 'finished';
    return (_jsxs(Card, { hover: true, pad: "md", onClick: onClick, className: s.card, children: [_jsxs("div", { className: s.cardHeader, children: [_jsx(YarnThumb, { color: p.yarnColor, size: 64 }), _jsxs("div", { className: s.cardHeaderText, children: [_jsxs("div", { className: s.cardNameRow, children: [_jsx("h3", { className: s.cardName, children: p.name }), done && _jsx("span", { className: s.doneTag, children: t('projectCard.doneTag', 'DONE') })] }), _jsxs("div", { className: s.cardMeta, children: [p.yarnWeight, " \u00B7 ", formatNeedleSize(p.craft, p.needleSize, unit)] })] })] }), _jsxs("div", { className: s.partsRow, children: [_jsx("span", { className: s.partsCount, children: t('projectCard.parts', { count: p.parts.length, defaultValue: `${p.parts.length} parts` }) }), p.parts.map((part) => (_jsxs("span", { className: s.partChip, title: part.name, children: [_jsx("span", { className: s.partDot, style: { background: part.color } }), part.name] }, part.id)))] })] }));
}
export default function HomeView() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const projects = useProjectStore((st) => st.projects);
    const [query, setQuery] = React.useState('');
    const [finishedOpen, setFinishedOpen] = React.useState(false);
    const filtered = projects.filter((p) => !query
        || p.name.toLowerCase().includes(query.toLowerCase())
        || p.notes.toLowerCase().includes(query.toLowerCase()));
    const active = filtered.filter((p) => p.status === 'active');
    const finished = filtered.filter((p) => p.status === 'finished');
    const subtitle = t('home.subActive', { count: active.length, defaultValue: `${active.length} on the needles` })
        + (finished.length
            ? t('home.subFinishedSuffix', { count: finished.length, defaultValue: ` · ${finished.length} in the basket` })
            : '')
        + t('home.subTrail', '.');
    return (_jsxs("div", { className: s.wrap, children: [_jsx(PageHeader, { eyebrow: t('home.eyebrow', 'Workshop'), title: t('home.title', 'Hey, Knitter'), sub: subtitle, right: _jsx(SearchField, { placeholder: t('home.searchPlaceholder', 'Search projects…'), value: query, onChange: (e) => setQuery(e.target.value) }) }), _jsxs("button", { type: "button", className: s.featured, onClick: () => navigate('/project/new'), children: [_jsx("span", { className: s.featuredIcon, children: _jsx(Icon, { name: "plus", size: 32, color: "#FBF6EC" }) }), _jsxs("div", { className: s.featuredBody, children: [_jsx("div", { className: s.featuredTitle, children: t('home.castOn', 'Cast on a project') }), _jsx("div", { className: s.featuredSub, children: t('home.castOnSub', 'Build your pattern step by step.') })] }), _jsx(Icon, { name: "chevR", size: 22, color: "#FBF6EC" })] }), active.length === 0 && projects.length === 0 && (_jsxs(Card, { pad: "lg", className: s.emptyCard, children: [_jsx("h3", { className: s.emptyTitle, children: t('home.emptyTitle', 'Nothing on the needles yet') }), _jsx("p", { className: s.emptySub, children: t('home.emptyHint', 'No projects yet. Cast on your first one above!') }), _jsx(Btn, { icon: "plus", onClick: () => navigate('/project/new'), children: t('action.castOn', 'Cast on') })] })), active.length > 0 && (_jsxs("section", { className: s.section, children: [_jsxs("div", { className: s.sectionHead, children: [_jsxs("span", { className: s.eyebrow, children: [t('home.onTheNeedles', 'On the needles'), " \u00B7 ", active.length] }), _jsx("span", { className: s.eyebrowRight, children: t('home.recent', 'Recent') })] }), _jsx("div", { className: s.grid, children: active.map((p) => (_jsx(ProjectTile, { p: p, onClick: () => navigate(`/project/${p.id}`) }, p.id))) })] })), finished.length > 0 && (_jsxs("section", { className: s.section, children: [_jsxs("button", { type: "button", className: s.finishedToggle, onClick: () => setFinishedOpen((o) => !o), children: [_jsx("span", { className: s.finishedIcon, children: _jsx(Icon, { name: "check", size: 16 }) }), _jsxs("span", { className: s.finishedLabel, children: [t('home.finished', 'Finished'), " \u00B7 ", finished.length] }), _jsx(Icon, { name: finishedOpen ? 'chevDown' : 'chevR', size: 16 })] }), finishedOpen && (_jsx("div", { className: s.grid, children: finished.map((p) => (_jsx(ProjectTile, { p: p, onClick: () => navigate(`/project/${p.id}`) }, p.id))) }))] }))] }));
}
