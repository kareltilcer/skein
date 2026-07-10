import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import Icon from './Icon';
import s from './ReuseChooser.module.css';
/**
 * Dashed-brick "New {kind}" + card "Sequence/Row from lib · {count}" pair.
 * Used at the bottom of every sequence card in the wizard, library builder, and
 * sequence picker contexts so the user always has a clear choice between rolling
 * fresh vs. reusing something they've saved.
 */
export default function ReuseChooser({ kind, libraryCount, onNew, onPickFromLibrary }) {
    const { t } = useTranslation();
    const newLabel = kind === 'row'
        ? t('reuseChooser.newRow', 'New row')
        : t('reuseChooser.newSequence', 'New sequence');
    const libLabel = kind === 'row'
        ? t('reuseChooser.rowFromLib', 'Row from lib')
        : t('reuseChooser.seqFromLib', 'Seq. from lib');
    return (_jsxs("div", { className: s.row, children: [_jsxs("button", { type: "button", onClick: onNew, className: s.new, children: [_jsx(Icon, { name: "plus", size: 14 }), _jsx("span", { children: newLabel })] }), _jsxs("button", { type: "button", onClick: onPickFromLibrary, className: s.lib, children: [_jsx(Icon, { name: "library", size: 14 }), _jsx("span", { children: libLabel }), _jsx("span", { className: s.count, children: libraryCount })] })] }));
}
