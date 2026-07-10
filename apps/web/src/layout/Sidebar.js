import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@skein/shared';
import Icon from '../components/ui/Icon';
import SkeinLogo from '../components/ui/SkeinLogo';
import s from './Sidebar.module.css';
function NavItem({ to, icon, label, end }) {
    return (_jsxs(NavLink, { to: to, end: end, className: ({ isActive }) => [s.navItem, isActive ? s.active : ''].filter(Boolean).join(' '), children: [_jsx(Icon, { name: icon, size: 20 }), _jsx("span", { className: s.navLabel, children: label })] }));
}
export default function Sidebar({ collapsed }) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const themePref = useSettingsStore((s) => s.theme);
    const setTheme = useSettingsStore((s) => s.setTheme);
    return (_jsxs("aside", { className: [s.aside, collapsed ? s.collapsed : ''].filter(Boolean).join(' '), children: [_jsxs("div", { className: s.brand, children: [_jsx(SkeinLogo, { size: 32, tone: "onBrick" }), _jsx("span", { className: s.word, children: t('app.name', 'YarnLog') })] }), _jsxs("button", { type: "button", className: s.cta, onClick: () => navigate('/project/new'), children: [_jsx(Icon, { name: "plus", size: 18 }), _jsx("span", { children: t('action.castOn', 'Cast on') })] }), _jsxs("nav", { className: s.nav, children: [_jsx(NavItem, { to: "/", end: true, icon: "home", label: t('nav.projects', 'Projects') }), _jsx(NavItem, { to: "/library", icon: "library", label: t('nav.library', 'Library') }), _jsx(NavItem, { to: "/settings", icon: "gear", label: t('nav.settings', 'Settings') })] }), _jsx("div", { className: s.spacer }), _jsx("div", { className: s.toggle, children: ['light', 'dark', 'auto'].map((opt) => (_jsx("button", { type: "button", className: [s.toggleBtn, themePref === opt ? s.toggleActive : ''].filter(Boolean).join(' '), onClick: () => setTheme(opt), "aria-label": opt, title: opt, children: _jsx(Icon, { name: opt === 'light' ? 'sun' : opt === 'dark' ? 'moon' : 'globe', size: 16 }) }, opt))) }), _jsxs("div", { className: s.account, children: [_jsx("div", { className: s.avatar, children: "M" }), _jsxs("div", { className: s.accountMeta, children: [_jsx("span", { className: s.accountName, children: t('account.local', 'Local only') }), _jsx("span", { className: s.accountSync, children: t('account.syncOff', 'No sync · offline') })] })] })] }));
}
