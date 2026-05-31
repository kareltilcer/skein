import React, { useMemo, useRef, useState } from 'react'
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native'
import _BottomSheet, { BottomSheetView as _BSView, BottomSheetScrollView as _BSScrollView } from '@gorhom/bottom-sheet'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BottomSheet = _BottomSheet as any, BottomSheetView = _BSView as any, BottomSheetScrollView = _BSScrollView as any
import { useTheme } from '../../theme/ThemeContext'
import { useLibraryStore } from '../../store/libraryStore'
import { useStitchMap } from '../../hooks/useStitchMap'
import StitchGlyph from '../StitchGlyph'
import Icon from '../ui/Icon'
import Btn from '../ui/Btn'
import type { Craft, LibrarySequence, LibraryPattern } from '../../types'

type Mode = 'sequence' | 'pattern'

type Props = {
  onSelectSequence?: (seq: LibrarySequence) => void
  onSelectPattern?:  (pat: LibraryPattern)  => void
  onClose:           () => void
  craftFilter?:      Craft
}

export default function SequencePicker({ onSelectSequence, onSelectPattern, onClose, craftFilter }: Props) {
  const { colors, fonts, fontSize, radius } = useTheme()
  const sheetRef   = useRef<any>(null)
  const snapPoints = useMemo(() => ['55%', '90%'], [])
  const { sequences, patterns } = useLibraryStore()
  const stitchMap = useStitchMap()

  const [mode, setMode]         = useState<Mode>('sequence')
  const [craft, setCraft]       = useState<Craft | 'all'>(craftFilter ?? 'all')
  const [selectedId, setSelected] = useState<string | null>(null)

  const filteredSeqs = sequences.filter((s) => craft === 'all' || s.craft === craft)
  const filteredPats = patterns.filter((p)  => craft === 'all' || p.craft === craft)

  const selectedSeq = filteredSeqs.find((s) => s.id === selectedId)
  const selectedPat = filteredPats.find((p)  => p.id === selectedId)

  const handleAdd = () => {
    if (mode === 'sequence' && selectedSeq) {
      onSelectSequence?.(selectedSeq)
    } else if (mode === 'pattern' && selectedPat) {
      onSelectPattern?.(selectedPat)
    }
    onClose()
  }

  return (
    <BottomSheet
      ref={sheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backgroundStyle={{ backgroundColor: colors.card }}
      handleIndicatorStyle={{ backgroundColor: colors.rule }}
    >
      <BottomSheetView>
        {/* Header */}
        <View style={styles.header}>
          <Text style={{ fontFamily: fonts.bodySb, fontSize: fontSize.lg, color: colors.ink }}>
            {mode === 'sequence' ? 'Pick a sequence' : 'Pick a pattern'}
          </Text>
          <Pressable onPress={onClose}>
            <Icon name="x" size={20} color={colors.inkMute}/>
          </Pressable>
        </View>

        {/* Mode toggle */}
        <View style={[styles.modeToggle, { backgroundColor: colors.cream2, borderRadius: radius.md, marginHorizontal: 16 }]}>
          {(['sequence', 'pattern'] as const).map((m) => (
            <Pressable
              key={m}
              onPress={() => { setMode(m); setSelected(null) }}
              style={[
                styles.modeBtn,
                { backgroundColor: mode === m ? colors.card : 'transparent', borderRadius: radius.sm },
              ]}
            >
              <Text style={{ fontFamily: fonts.bodySb, fontSize: 13, color: mode === m ? colors.brick : colors.inkSoft }}>
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Craft filter */}
        {!craftFilter && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
            {(['all', 'knit', 'crochet'] as const).map((c) => (
              <Pressable
                key={c}
                onPress={() => { setCraft(c); setSelected(null) }}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: craft === c ? colors.ink : 'transparent',
                    borderColor:     craft === c ? 'transparent' : colors.rule,
                    borderRadius:    radius.full,
                  },
                ]}
              >
                <Text style={{ fontFamily: fonts.bodySb, fontSize: 12, color: craft === c ? colors.bg : colors.inkSoft }}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Add CTA (if something selected) */}
        {selectedId && (
          <View style={[styles.addBar, { borderTopColor: colors.rule }]}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fonts.bodySb, fontSize: fontSize.sm, color: colors.ink }}>
                {selectedSeq?.name ?? selectedPat?.name}
              </Text>
              <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.inkMute }}>
                {selectedSeq ? `${selectedSeq.rows.length} rows` : selectedPat ? `${selectedPat.sequenceIds.length} sequences` : ''}
              </Text>
            </View>
            <Btn variant="primary" size="sm" onPress={handleAdd}>Use this</Btn>
          </View>
        )}
      </BottomSheetView>

      {/* List */}
      <BottomSheetScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
        {mode === 'sequence' && filteredSeqs.map((seq) => {
          const active = selectedId === seq.id
          const previewStitches = seq.rows[0]?.stitches.slice(0, 4) ?? []
          return (
            <Pressable
              key={seq.id}
              onPress={() => setSelected(active ? null : seq.id)}
              style={[
                styles.listItem,
                {
                  backgroundColor: active ? colors.cream2 : colors.bg,
                  borderColor:     active ? colors.brick : colors.rule,
                  borderRadius:    radius.md,
                  borderWidth:     active ? 1.5 : 1,
                },
              ]}
            >
              <View style={styles.listItemLeft}>
                <Text style={{ fontFamily: fonts.bodySb, fontSize: fontSize.sm, color: colors.ink }}>{seq.name}</Text>
                <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.inkMute, marginTop: 2 }}>
                  {seq.rows.length} rows · {seq.craft}
                </Text>
                {active && (
                  <View style={styles.stitchRow}>
                    {previewStitches.map((si, i) => {
                      const def = stitchMap[si.stitchId]
                      if (!def) return null
                      return (
                        <View key={i} style={[styles.tinyChip, { backgroundColor: def.color, borderRadius: 5 }]}>
                          <StitchGlyph symbol={def.symbol} size={12} color="#2B1810"/>
                        </View>
                      )
                    })}
                  </View>
                )}
              </View>
              {active && <Icon name="check" size={16} color={colors.brick}/>}
            </Pressable>
          )
        })}

        {mode === 'pattern' && filteredPats.map((pat) => {
          const active = selectedId === pat.id
          return (
            <Pressable
              key={pat.id}
              onPress={() => setSelected(active ? null : pat.id)}
              style={[
                styles.listItem,
                {
                  backgroundColor: active ? colors.cream2 : colors.bg,
                  borderColor:     active ? colors.brick : colors.rule,
                  borderRadius:    radius.md,
                  borderWidth:     active ? 1.5 : 1,
                },
              ]}
            >
              <View style={styles.listItemLeft}>
                <Text style={{ fontFamily: fonts.bodySb, fontSize: fontSize.sm, color: colors.ink }}>{pat.name}</Text>
                <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.inkMute, marginTop: 2 }}>
                  {pat.sequenceIds.length} sequences · {pat.craft}
                </Text>
              </View>
              {active && <Icon name="check" size={16} color={colors.brick}/>}
            </Pressable>
          )
        })}

        <Pressable style={[styles.scratchBtn, { borderColor: colors.rule, borderRadius: radius.md }]}>
          <Icon name="plus" size={14} color={colors.inkSoft}/>
          <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft }}>
            Build new {mode} from scratch
          </Text>
        </Pressable>
      </BottomSheetScrollView>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
  modeToggle:  { flexDirection: 'row', padding: 4, gap: 4, marginBottom: 10 },
  modeBtn:     { flex: 1, alignItems: 'center', paddingVertical: 8 },
  filters:     { paddingHorizontal: 16, gap: 8, paddingBottom: 10 },
  filterChip:  { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
  addBar:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1 },
  listItem:    { flexDirection: 'row', alignItems: 'center', padding: 14 },
  listItemLeft:{ flex: 1 },
  stitchRow:   { flexDirection: 'row', gap: 4, marginTop: 6, flexWrap: 'wrap' },
  tinyChip:    { width: 20, height: 24, alignItems: 'center', justifyContent: 'center' },
  scratchBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderStyle: 'dashed', paddingVertical: 12, marginTop: 4 },
})
