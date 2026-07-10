import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSettingsStore, SUPPORTED_LANGUAGES, isSupportedLanguage, } from '@skein/shared';
import Btn from '../../components/ui/Btn';
import Icon from '../../components/ui/Icon';
import SkeinLogo from '../../components/ui/SkeinLogo';
import s from './WelcomeView.module.css';
export default function WelcomeView() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const setLanguage = useSettingsStore((st) => st.setLanguage);
    const markSeen = useSettingsStore((st) => st.markWelcomeSeen);
    const savedLang = useSettingsStore((st) => st.language);
    const code = isSupportedLanguage(savedLang) ? savedLang : 'en';
    const pillRef = React.useRef(null);
    const [langOpen, setLangOpen] = React.useState(false);
    function pickLang(c) {
        setLanguage(c);
        i18n.changeLanguage(c);
        setLangOpen(false);
    }
    function castOn() {
        markSeen();
        navigate('/project/new');
    }
    function peekLibrary() {
        markSeen();
        navigate('/library');
    }
    // Close lang popover on Esc / outside click.
    React.useEffect(() => {
        if (!langOpen)
            return;
        function onKey(e) { if (e.key === 'Escape')
            setLangOpen(false); }
        function onPointer(e) {
            const t = e.target;
            if (pillRef.current?.contains(t))
                return;
            const pop = document.getElementById('welcome-lang-popover');
            if (pop?.contains(t))
                return;
            setLangOpen(false);
        }
        window.addEventListener('keydown', onKey);
        document.addEventListener('pointerdown', onPointer, true);
        return () => {
            window.removeEventListener('keydown', onKey);
            document.removeEventListener('pointerdown', onPointer, true);
        };
    }, [langOpen]);
    return (_jsxs("div", { className: s.wrap, children: [_jsx("header", { className: s.topBar, children: _jsxs("div", { className: s.langPillWrap, children: [_jsxs("button", { ref: pillRef, type: "button", className: s.langPill, onClick: () => setLangOpen((o) => !o), "aria-expanded": langOpen, "aria-haspopup": "listbox", children: [_jsx(Icon, { name: "globe", size: 14 }), _jsx("span", { className: s.langCode, children: code }), _jsx(Icon, { name: "chevDown", size: 12 })] }), langOpen && (_jsxs("div", { id: "welcome-lang-popover", className: s.langPopover, role: "listbox", children: [_jsx("div", { className: s.langTitle, children: t('welcome.languageModalTitle', 'Choose your language') }), _jsx("div", { className: s.langList, children: SUPPORTED_LANGUAGES.map((l) => {
                                        const active = l.code === code;
                                        return (_jsxs("button", { type: "button", onClick: () => pickLang(l.code), className: [s.langRow, active ? s.langRowActive : ''].filter(Boolean).join(' '), role: "option", "aria-selected": active, children: [_jsx("span", { className: s.langRowCode, children: l.code }), _jsx("span", { className: s.langRowName, children: l.native }), active && _jsx(Icon, { name: "check", size: 16 })] }, l.code));
                                    }) }), _jsx("div", { className: s.langHint, children: t('welcome.languageSwitchHint', 'You can switch anytime in Settings.') })] }))] }) }), _jsxs("section", { className: s.center, children: [_jsxs("div", { className: s.logoWrap, children: [_jsx(SkeinLogo, { size: 132 }), _jsx("span", { className: s.motifStar, "aria-hidden": true, children: "* * *" }), _jsx("span", { className: s.motifSlash, "aria-hidden": true, children: "// // //" })] }), _jsx("h1", { className: s.greeting, children: t('welcome.greeting', 'Welcome to YarnLog.') }), _jsx("p", { className: s.tagline, children: t('welcome.tagline', 'stitch happens.') }), _jsx("p", { className: s.body, children: t('welcome.body', 'Build a pattern, hit start, and we\'ll keep your place — row by row, repeat by repeat. Both hands free for the needles.') }), _jsxs("div", { className: s.cta, children: [_jsx(Btn, { size: "lg", icon: "plus", onClick: castOn, children: t('welcome.ctaCastOn', 'Cast on first project') }), _jsx(Btn, { size: "lg", variant: "ghost", icon: "book", onClick: peekLibrary, children: t('welcome.ctaLibrary', 'Peek at the library') })] }), _jsx("p", { className: s.note, children: t('welcome.note', 'no account needed · ever') })] })] }));
}
