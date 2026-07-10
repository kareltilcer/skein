import { multiRemove } from '../storage/adapter';
import { useProjectStore } from './projectStore';
import { useCustomStitchStore } from './customStitchStore';
import { useLibraryStore, SEED_SEQUENCES, SEED_PATTERNS, SEED_ROWS } from './libraryStore';
import { useSettingsStore } from './settingsStore';
const DATA_STORAGE_KEYS = [
    'skein-projects',
    'skein-library',
    'skein-custom-stitches',
];
/**
 * Recovery / "start fresh" action surfaced in Settings.
 * Wipes user-created data (projects, library customs, custom stitches) and
 * restores the library to its seed entries. Theme, language, and other
 * preferences in settingsStore are preserved — only `recentStitchIds` is
 * cleared since it may reference deleted custom stitches.
 *
 * Removes the persisted entries first via the storage adapter so a corrupt
 * blob can't re-hydrate over the reset state.
 */
export async function resetSkeinData() {
    await multiRemove(DATA_STORAGE_KEYS);
    useProjectStore.setState({ projects: [] });
    useCustomStitchStore.setState({ customStitches: [] });
    useLibraryStore.setState({
        sequences: SEED_SEQUENCES,
        patterns: SEED_PATTERNS,
        rows: SEED_ROWS,
    });
    useSettingsStore.setState({ recentStitchIds: [] });
}
