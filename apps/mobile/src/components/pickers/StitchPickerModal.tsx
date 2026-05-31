import React, { useState, useMemo, useCallback, useEffect } from 'react'
import {
  Modal, View, Text, Pressable, ScrollView, TextInput, StyleSheet,
  useWindowDimensions,
} from 'react-native'
import { BlurView } from 'expo-blur'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../../theme/ThemeContext'
import {
  STITCHES, STITCH_MAP, PICKER_FILTER_CHIPS,
  getPickerGroups, type PickerFilter,
} from '../../tokens/stitches'
import { useCustomStitchStore } from '../../store/customStitchStore'
import StitchGlyph from '../StitchGlyph'
import Icon from '../ui/Icon'
import Btn from '../ui/Btn'
import type { StitchDef, Craft } from '../../types'

// 8 symbols available in the quick-add inline panel (same as design)
const PANEL_SYMBOLS = ['vline', 'dash', 'ring', 'vee', 'triUp', 'plus', 'dot', 'cross']

const H_PAD = 20   // horizontal padding of the sheet
const GRID_GAP = 8 // gap between chip cells

type Props = {
  visible: boolean
  onClose: () => void
  /** Called immediately when user taps a stitch tile — no confirm step */
  onSelect: (stitch: StitchDef) => void
  onDefineCustom: () => void
  craftFilter?: Craft
}

const FILTER_LABEL_KEYS: Record<string, string> = {
  all:       'pickerStitch.filterAll',
  knit:      'pickerStitch.filterKnit',
  crochet:   'pickerStitch.filterCrochet',
  increases: 'pickerStitch.filterIncreases',
  decreases: 'pickerStitch.filterDecreases',
  cables:    'pickerStitch.filterCables',
  custom:    'pickerStitch.filterCustom',
}

const GROUP_LABEL_KEYS: Record<string, string> = {
  basics_k:  'pickerStitch.groupKnitBasics',
  inc_k:     'pickerStitch.groupKnitIncreases',
  dec_k:     'pickerStitch.groupKnitDecreases',
  cab_k:     'pickerStitch.groupKnitCables',
  basics_c:  'pickerStitch.groupCrochetBasics',
  dec_c:     'pickerStitch.groupCrochetDecreases',
  special_c: 'pickerStitch.groupCrochetSpecial',
  my_custom: 'pickerStitch.groupMyCustoms',
}

const FILTERS_WITH_CUSTOMS: PickerFilter[] = ['all', 'knit', 'crochet', 'custom']

export default function StitchPickerModal({
  visible, onClose, onSelect, onDefineCustom, craftFilter,
}: Props) {
  const { t } = useTranslation()
  const { colors, fonts, radius } = useTheme()
  const { customStitches, addCustomStitch } = useCustomStitchStore()
  const { width: screenWidth, height: screenHeight } = useWindowDimensions()

  // Exact 5-column chip width matching design's repeat(5, 1fr)
  const chipWidth = Math.floor((screenWidth - 2 * H_PAD - 4 * GRID_GAP) / 5)

  const defaultFilter: PickerFilter =
    craftFilter === 'crochet' ? 'crochet' :
    craftFilter === 'knit'    ? 'knit'    : 'all'

  const [filter,   setFilter]   = useState<PickerFilter>(defaultFilter)
  // Tracks the last-tapped stitch id for visual highlight (per design comment:
  // "no pre-selection — keeping state so grid can highlight the last tap")
  const [selected, setSelected] = useState<string | null>(null)

  // Inline quick-add panel state (Custom tab)
  const [panelAbbr,   setPanelAbbr]   = useState('')
  const [panelName,   setPanelName]   = useState('')
  const [panelSymbol, setPanelSymbol] = useState('vline')

  // Reset state each time the sheet opens
  useEffect(() => {
    if (visible) {
      setFilter(defaultFilter)
      setSelected(null)
      setPanelAbbr('')
      setPanelName('')
      setPanelSymbol('vline')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  // Build unified StitchDef list for custom stitches
  const customAsDefs: StitchDef[] = useMemo(() =>
    customStitches.map((c) => ({
      id:     c.id,
      abbr:   c.abbr,
      name:   c.name,
      type:   c.type,
      symbol: c.symbol,
      color:  colors[c.tileColorKey] ?? colors.forest,
    })),
    [customStitches, colors],
  )

  // Total count badge
  const totalCount = STITCHES.length + customStitches.length

  // Groups to display for the current filter
  const groups = useMemo(() => {
    const builtIn = getPickerGroups(filter)
      .map((g) => {
        let items = g.ids
          .map((id) => STITCH_MAP[id])
          .filter((s): s is StitchDef => !!s)
        if (craftFilter) items = items.filter((s) => s.type === craftFilter)
        return { ...g, items }
      })
      .filter((g) => g.items.length > 0)

    if (!FILTERS_WITH_CUSTOMS.includes(filter)) return builtIn

    const customItems = craftFilter
      ? customAsDefs.filter((s) => s.type === craftFilter)
      : customAsDefs
    if (customItems.length === 0) return builtIn

    return [...builtIn, { id: 'my_custom', label: 'My customs', items: customItems }]
  }, [filter, craftFilter, customAsDefs])

  const accentPalette = [colors.brick, colors.mustard, colors.forest, colors.brickDk]

  const handleSelect = useCallback((s: StitchDef) => {
    setSelected(s.id)
    onSelect(s)
  }, [onSelect])

  const handlePanelSave = useCallback(() => {
    if (!panelAbbr.trim() || !panelName.trim()) return
    const id = addCustomStitch({
      abbr:         panelAbbr.trim(),
      name:         panelName.trim(),
      type:         craftFilter ?? 'knit',
      symbol:       panelSymbol,
      tileColorKey: 'brick',
      countsAs:     'one',
    })
    const newStitch: StitchDef = {
      id, abbr: panelAbbr.trim(), name: panelName.trim(),
      type: craftFilter ?? 'knit', symbol: panelSymbol,
      color: colors.brick,
    }
    setPanelAbbr('')
    setPanelName('')
    setPanelSymbol('vline')
    handleSelect(newStitch)
  }, [panelAbbr, panelName, panelSymbol, craftFilter, addCustomStitch, colors.brick, handleSelect])

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1 }}>
        {/* Blurred backdrop */}
        <BlurView
          intensity={18}
          tint="dark"
          style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(43,24,16,0.35)' }]}
        />
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose}/>

        {/* Sheet */}
        <View style={styles.sheetWrap} pointerEvents="box-none">
          <View style={[styles.sheet, { backgroundColor: colors.bg, height: Math.round(screenHeight * 0.88) }]}>
            {/* Drag handle */}
            <View style={[styles.handle, { backgroundColor: colors.rule }]}/>

            {/* Header — padding 0 20px, same div as filter chips per design */}
            <View style={{ paddingHorizontal: H_PAD }}>
              <View style={styles.headerRow}>
                <View>
                  <Text style={{
                    fontFamily: fonts.display, fontSize: 24, color: colors.brick,
                    letterSpacing: -0.25,
                  }}>{t('pickerStitch.title')}</Text>
                  <Text style={{
                    fontFamily: fonts.mono, fontSize: 10, color: colors.inkMute,
                    letterSpacing: 1.0, textTransform: 'uppercase', marginTop: 2,
                  }}>
                    {t('pickerStitch.sub', { count: totalCount })}
                  </Text>
                </View>
                {/* Plain X icon — no circular button, per design */}
                <Pressable onPress={onClose} hitSlop={12}>
                  <Icon name="x" size={22} color={colors.inkSoft}/>
                </Pressable>
              </View>

              {/* Filter chips — inside same padded container as header */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filtersRow}
              >
                {PICKER_FILTER_CHIPS.map((f) => {
                  const active = filter === f.id
                  return (
                    <Pressable
                      key={f.id}
                      onPress={() => setFilter(f.id)}
                      style={[styles.filterChip, {
                        backgroundColor: active ? colors.brick : colors.cream2,
                        borderRadius: radius.full,
                      }]}
                    >
                      <Text style={{
                        fontFamily: fonts.bodySb, fontSize: 12,
                        color: active ? '#FBF6EC' : colors.inkSoft,
                      }}>
                        {FILTER_LABEL_KEYS[f.id] ? t(FILTER_LABEL_KEYS[f.id]!) : f.label}
                      </Text>
                    </Pressable>
                  )
                })}
              </ScrollView>
            </View>

            {/* Scrollable content — flex: 1, padding 12 20 0 per design */}
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingTop: 12, paddingHorizontal: H_PAD }}
              keyboardShouldPersistTaps="handled"
            >
              {filter === 'custom' && (
                /* ── Custom panel (inline quick-add mini-form) ── */
                <View style={[styles.customPanel, {
                  backgroundColor: colors.card,
                  borderColor: colors.brick,
                }]}>
                  <Text style={{
                    fontFamily: fonts.display, fontSize: 20, color: colors.brick,
                    letterSpacing: -0.2,
                  }}>{t('pickerStitch.customPanelTitle')}</Text>
                  <Text style={{
                    fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft,
                    lineHeight: 19,
                  }}>
                    {t('pickerStitch.customPanelBody')}
                  </Text>

                  {/* Abbr + Name row */}
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View style={[styles.panelInput, {
                      flex: 1, backgroundColor: colors.bg, borderColor: colors.rule,
                    }]}>
                      <TextInput
                        value={panelAbbr}
                        onChangeText={setPanelAbbr}
                        maxLength={8}
                        placeholder={t('pickerStitch.abbrPlaceholder')}
                        placeholderTextColor={colors.inkMute}
                        autoCapitalize="none"
                        style={{ fontFamily: fonts.mono, fontSize: 13, color: colors.ink }}
                      />
                    </View>
                    <View style={[styles.panelInput, {
                      flex: 2, backgroundColor: colors.bg, borderColor: colors.rule,
                    }]}>
                      <TextInput
                        value={panelName}
                        onChangeText={setPanelName}
                        maxLength={36}
                        placeholder={t('pickerStitch.namePlaceholder')}
                        placeholderTextColor={colors.inkMute}
                        style={{ fontFamily: fonts.mono, fontSize: 13, color: colors.ink }}
                      />
                    </View>
                  </View>

                  {/* Symbol label */}
                  <Text style={{
                    fontFamily: fonts.mono, fontSize: 10, color: colors.inkMute,
                    letterSpacing: 1.0, textTransform: 'uppercase',
                  }}>{t('pickerStitch.symbolLabel')}</Text>

                  {/* 8-symbol row */}
                  <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                    {PANEL_SYMBOLS.map((sym) => {
                      const active = panelSymbol === sym
                      return (
                        <Pressable
                          key={sym}
                          onPress={() => setPanelSymbol(sym)}
                          style={[styles.panelSymBtn, {
                            backgroundColor: active ? colors.brick : colors.bg,
                            borderColor: active ? 'transparent' : colors.rule,
                          }]}
                        >
                          <StitchGlyph
                            symbol={sym}
                            size={18}
                            color={active ? '#FBF6EC' : colors.inkSoft}
                          />
                        </Pressable>
                      )
                    })}
                  </View>

                  {/* Save button */}
                  <Btn
                    variant="primary"
                    size="md"
                    full
                    icon="plus"
                    onPress={handlePanelSave}
                    disabled={!panelAbbr.trim() || !panelName.trim()}
                  >
                    {t('pickerStitch.saveCustomStitch')}
                  </Btn>
                </View>
              )}

              {/* ── Grouped stitch grid (built-in groups + "My customs" when applicable) ── */}
              {groups.map((g) => (
                <View key={g.id} style={{ marginBottom: 14 }}>
                  {/* Group header */}
                  <View style={styles.groupHeader}>
                    <Text style={{
                      fontFamily: fonts.mono, fontSize: 10, color: colors.inkMute,
                      letterSpacing: 1.8, textTransform: 'uppercase',
                    }}>
                      {GROUP_LABEL_KEYS[g.id] ? t(GROUP_LABEL_KEYS[g.id]!) : g.label}
                    </Text>
                    <Text style={{
                      fontFamily: fonts.mono, fontSize: 10, color: colors.inkMute,
                    }}>
                      {g.items.length}
                    </Text>
                  </View>

                  {/* 5-column grid — exact repeat(5, 1fr) */}
                  <View style={styles.chipGrid}>
                    {g.items.map((s, i) => {
                      const c = accentPalette[i % 4]!
                      const isSel = selected === s.id
                      return (
                        <Pressable
                          key={s.id}
                          onPress={() => handleSelect(s)}
                          style={[styles.gridChip, {
                            width: chipWidth,
                            backgroundColor: isSel ? c : colors.card,
                            borderColor: isSel ? c : colors.rule,
                            borderWidth: isSel ? 1.5 : 1,
                          }]}
                        >
                          <View style={[styles.glyphBox, {
                            backgroundColor: isSel ? 'rgba(255,255,255,0.18)' : c,
                          }]}>
                            <StitchGlyph symbol={s.symbol} size={20} color="#FBF6EC"/>
                          </View>
                          <Text style={{
                            fontSize: 11, fontFamily: fonts.mono, fontWeight: '700',
                            color: isSel ? '#FBF6EC' : colors.inkSoft,
                          }}>
                            {s.abbr}
                          </Text>
                        </Pressable>
                      )
                    })}
                  </View>
                </View>
              ))}

              {/* "Define a custom stitch" dashed CTA — hidden on Custom tab (inline panel covers this) */}
              {filter !== 'custom' && (
                <Pressable
                  onPress={onDefineCustom}
                  style={[styles.defineBtn, {
                    borderColor: colors.brick,
                    borderRadius: 12,
                  }]}
                >
                  <Icon name="plus" size={14} color={colors.brick}/>
                  <Text style={{ fontFamily: fonts.bodySb, fontSize: 13, color: colors.brick }}>
                    {t('pickerStitch.defineCustomStitch')}
                  </Text>
                </Pressable>
              )}
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  sheetWrap:   { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingBottom: 32,
    // height is set dynamically (screenHeight × 0.88) so flex:1 ScrollView resolves correctly in Yoga
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 20,
  },
  handle:      { width: 44, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 8 },
  headerRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  filtersRow:  { flexDirection: 'row', gap: 6, paddingBottom: 2 },
  filterChip:  { paddingHorizontal: 12, paddingVertical: 6, flexShrink: 0 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  chipGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP },
  gridChip: {
    borderRadius: 12,
    paddingTop: 10, paddingHorizontal: 4, paddingBottom: 8,
    flexDirection: 'column', alignItems: 'center', gap: 6,
  },
  glyphBox:    { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  // Custom inline panel
  customPanel: { borderRadius: 16, padding: 16, borderWidth: 1.5, borderStyle: 'dashed', gap: 12, marginBottom: 14 },
  panelInput:  { borderWidth: 1, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12 },
  panelSymBtn: { width: 38, height: 38, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  // "Define a custom stitch" button at the bottom of group view
  defineBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderStyle: 'dashed',
    paddingVertical: 12, marginTop: 6, marginBottom: 16, width: '100%',
  },
})
