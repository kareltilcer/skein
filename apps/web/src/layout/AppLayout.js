import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import Sidebar from './Sidebar';
import s from './AppLayout.module.css';
export default function AppLayout({ immersive, children }) {
    const [collapsed, setCollapsed] = React.useState(() => typeof window !== 'undefined' && window.innerWidth < 1080);
    React.useEffect(() => {
        function onResize() { setCollapsed(window.innerWidth < 1080); }
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);
    return (_jsxs("div", { className: s.shell, children: [_jsx(Sidebar, { collapsed: collapsed }), _jsx("main", { className: [s.main, immersive ? s.immersive : ''].filter(Boolean).join(' '), children: immersive ? children : _jsx("div", { className: s.container, children: children }) })] }));
}
