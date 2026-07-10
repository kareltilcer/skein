import React from 'react';
import { mergeStitchMap, useCustomStitchStore, } from '@skein/shared';
import { useTheme } from '../theme/ThemeProvider';
// Built-in stitches + the user's custom stitches, keyed by id. Use this anywhere
// a stitch is rendered from an id — otherwise custom stitches silently drop out.
export function useStitchMap() {
    const customStitches = useCustomStitchStore((s) => s.customStitches);
    const { colors } = useTheme();
    return React.useMemo(() => mergeStitchMap(customStitches, colors), [customStitches, colors]);
}
