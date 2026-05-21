import React, { useCallback, useMemo, useRef, useState } from 'react'
import { View, Text, Pressable, StyleSheet, TextInput, ScrollView } from 'react-native'
import _BottomSheet, { BottomSheetView as _BSView, BottomSheetScrollView as _BSScrollView } from '@gorhom/bottom-sheet'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BottomSheet = _BottomSheet as any, BottomSheetView = _BSView as any, BottomSheetScrollView = _BSScrollView as any
import { useTheme } from '../../theme/ThemeContext'
import { STITCHES, STITCH_GROUPS } from '../../tokens/stitches'
import StitchGlyph from '../StitchGlyph'
import Icon from '../ui/Icon'
import Btn from '../ui/Btn'
import type { StitchDef, Craft } from '../../types'

type Filter = 'all' | 'knit' | 'crochet' | 'increases' | 'decreases' | 'cables' | 'custom'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all',       label: 'All'       },
  { id: 'knit',      label: 'Knit'      },
  { id: 'crochet',   label: 'Crochet'   },
  { id: 'increases', label: 'Increases' },
  { id: 'decreases', label: 'Decreases' },
  { id: 'cables',    label: 'Cables'    },
]

type Props = {
  onSelect: (stitch: StitchDef) => void
  onClose: () => void
  craftFilter?: Craft
}

export default function StitchPicker({ onSelect, onClose, craftFilter }: Props) {
  const { colors, fonts, fontSize, radius } = useTheme()
  const sheetRef = useRef<any>(null)
  const snapPoints = useMemo(() => ['60%', '90%'], [])

  const [filter, setFilter]     = useState<Filter>(craftFilter === 'crochet' ? 'crochet' : craftFilter === 'knit' ? 'knit' : 'all')
  const [selected, setSelected] = useState<StitchDef | null>(null)
  const [query, setQuery]       = useState('')

  const visible = useMemo(() => {
    let base = STITCH_GROUPS[filter] ?? STITCH_GROUPS.all!
    if (craftFilter) base = base.filter((id) => {
      const s = STITCHES.find((x) => x.id === id)
      return s?.type === craftFilter
    })
    let stitches = base.map((id) => STITCHES.find((s) => s.id === id)).filter(Boolean) as StitchDef[]
    if (query.trim()) {
      const q = query.toLowerCase()
      stitches = stitches.filter((s) => s.name.toLowerCase().includes(q) || s.abbr.toLowerCase().includes(q))
    }
    return stitches
  }, [filter, query, craftFilter])

  const handleSelect = useCallback((s: StitchDef) => {
    setSelected(s)
  }, [])

  const handleAdd = useCallback(() => {
    if (selected) {
      onSelect(selected)
      setSelected(null)
    }
  }, [selected, onSelect])

  return (
    <BottomSheet
      ref={sheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backgroundStyle={{ backgroundColor: colors.card }}
      handleIndicatorStyle={{ backgroundColor: colors.rule }}
    >
      <BottomSheetView style={styles.header}>
        <Text style={{ fontFamily: fonts.bodySb, fontSize: fontSize.lg, color: colors.ink }}>Pick a stitch</Text>
        <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.inkMute }}>{visible.length} stitches</Text>
        <Pressable onPress={onClose}>
          <Icon name="x" size={20} color={colors.inkMute}/>
        </Pressable>
      </BottomSheetView>

      {/* Selected preview */}
      {selected && (
        <View style={[styles.preview, { backgroundColor: colors.bg, borderColor: colors.rule }]}>
          <View style={[styles.previewChip, { backgroundColor: selected.color, borderRadius: radius.md }]}>
            <StitchGlyph symbol={selected.symbol} size={40} color="#2B1810"/>
            <Text style={{ fontFamily: fonts.mono, fontSize: 13, color: '#2B1810', fontWeight: '700' }}>{selected.abbr}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.bodySb, fontSize: fontSize.base, color: colors.ink }}>{selected.name}</Text>
            <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.inkMute }}>{selected.abbr} · {selected.type}</Text>
          </View>
          <Btn variant="primary" size="sm" onPress={handleAdd}>Add</Btn>
        </View>
      )}

      {/* Search */}
      <View style={[styles.search, { backgroundColor: colors.bg, borderColor: colors.rule }]}>
        <Icon name="search" size={16} color={colors.inkMute}/>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search stitches…"
          placeholderTextColor={colors.inkMute}
          style={{ flex: 1, fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.ink }}
        />
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {FILTERS.map((f) => {
          const active = filter === f.id
          return (
            <Pressable
              key={f.id}
              onPress={() => setFilter(f.id)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: active ? colors.ink : 'transparent',
                  borderColor:     active ? 'transparent' : colors.rule,
                  borderRadius:    radius.full,
                },
              ]}
            >
              <Text style={{ fontFamily: fonts.bodySb, fontSize: 12, color: active ? colors.bg : colors.inkSoft }}>
                {f.label}
              </Text>
            </Pressable>
          )
        })}
      </ScrollView>

      {/* Stitch grid */}
      <BottomSheetScrollView contentContainerStyle={styles.grid}>
        {visible.map((s) => (
          <Pressable
            key={s.id}
            onPress={() => handleSelect(s)}
            style={[
              styles.gridChip,
              {
                backgroundColor: s.color,
                borderRadius:    radius.sm,
                borderWidth:     selected?.id === s.id ? 2 : 0,
                borderColor:     colors.ink,
              },
            ]}
          >
            <StitchGlyph symbol={s.symbol} size={24} color="#2B1810"/>
            <Text style={{ fontFamily: fonts.mono, fontSize: 9, color: '#2B1810', fontWeight: '700' }}>{s.abbr}</Text>
          </Pressable>
        ))}
      </BottomSheetScrollView>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  preview:     { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, marginBottom: 8, padding: 12, borderRadius: 12, borderWidth: 1 },
  previewChip: { width: 64, height: 80, alignItems: 'center', justifyContent: 'center', gap: 4 },
  search:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginBottom: 10, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  filters:     { paddingHorizontal: 16, gap: 8, paddingBottom: 10 },
  filterChip:  { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
  grid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingBottom: 32 },
  gridChip:    { width: 52, height: 64, alignItems: 'center', justifyContent: 'center', gap: 4 },
})
