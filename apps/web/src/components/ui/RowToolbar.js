import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import Icon from './Icon';
import s from './RowToolbar.module.css';
/** Toolbar that appears on every row card: mark-repeat / backspace / trash. */
export default function RowToolbar({ onMarkRepeat, onBackspace, onDelete, repeatActive = false, disabledBackspace = false, disabledRepeat = false, }) {
    const { t } = useTranslation();
    return (_jsxs("div", { className: s.bar, children: [_jsx("button", { type: "button", onClick: onMarkRepeat, disabled: disabledRepeat, title: t('wizard.step3RowToolbarRepeat', 'Mark a repeat'), className: [s.btn, repeatActive ? s.repeatActive : ''].filter(Boolean).join(' '), children: _jsx(Icon, { name: "repeat", size: 14 }) }), _jsx("button", { type: "button", onClick: onBackspace, disabled: disabledBackspace, title: t('wizard.step3RowToolbarBackspace', 'Remove last stitch'), className: s.btn, children: _jsx(Icon, { name: "backspace", size: 14 }) }), _jsx("button", { type: "button", onClick: onDelete, title: t('wizard.step3RowToolbarDelete', 'Delete row'), className: s.btn, children: _jsx(Icon, { name: "trash", size: 14 }) })] }));
}
