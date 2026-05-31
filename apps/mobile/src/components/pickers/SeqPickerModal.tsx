import React, { useState, useMemo, useEffect } from 'react'
import {
  Modal, View, Text, Pressable, ScrollView, StyleSheet,
  useWindowDimensions,
} from 'react-native'
import { BlurView } from 'expo-blur'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../../theme/ThemeContext'
import { useStitchMap } from '../../hooks/useStitchMap'
import { useLibraryStore } from '../../store/libraryStore'
import { useSettingsStore } from '../../store/settingsStore'
import StitchGlyph from '../StitchGlyph'
import Icon from '../ui/Icon'
import type { LibrarySequence, LibraryPattern, Craft } from '../../types'

type Mode = 'sequence' | 'pattern'

const H_PAD = 20

type Props = {
  visible: boolean
  onClose: () => void
  /** Called when user taps a sequence tile — caller is responsible for dismissal */
  onSelectSequence: (seq: LibrarySequence) => void
  /** Called when user taps a pattern tile — caller is responsible for dismissal */
  onSelectPattern: (pat: LibraryPattern) => void
  /** "Build a new sequence from scratch" CTA */
  onBuildNew: () => void
  craftFilter?: Craft
}

export default function SeqPickerModal({
  visible, onClose, onSelectSequence, onSelectPattern, onBuildNew, craftFilter,
}: Props) {
  const { t } = useTranslation()
  const { colors, fonts, radius } = useTheme()
  const { height: screenHeight } = useWindowDimensions()
  const stitchMap = useStitchMap()

  const sequences = useLibraryStore(s => s.sequences)
  const patterns  = useLibraryStore(s => s.patterns)
  const userDefaultCraft = useSettingsStore(s => s.defaultCraft)

  const defaultCraft: Craft | 'all' = craftFilter ?? userDefaultCraft

  const [mode,  setMode]  = useState<Mode>('sequence')
  const [craft, setCraft] = useState<Craft | 'all'>(defaultCraft)

  // Reset state each time the sheet opens
  useEffect(() => {
    if (visible) {
      setMode('sequence')
      setCraft(defaultCraft)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  const visibleSequences = useMemo(() => {
    if (craft === 'all') return sequences
    return sequences.filter(s => s.craft === craft)
  }, [sequences, craft])

  const visiblePatterns = useMemo(() => {
    if (craft === 'all') return patterns
    return patterns.filter(p => p.craft === craft)
  }, [patterns, craft])

  // Empty-state card shared by both sequence and pattern lists
  const renderNoMatches = (kind: 'sequences' | 'patterns') => {
    const suffix = kind === 'sequences' ? t('pickerSeq.noMatchSuffixSequences') : t('pickerSeq.noMatchSuffixPatterns')
    const empty = kind === 'sequences' ? t('pickerSeq.noLibrarySequences') : t('pickerSeq.noLibraryPatterns')
    return (
      <View style={[styles.noMatchCard, {
        backgroundColor: colors.card,
        borderColor: colors.rule,
      }]}>
        <Text style={{
          fontFamily: fonts.body, fontSize: 13.5, color: colors.inkSoft,
          textAlign: 'center',
        }}>
          {craft !== 'all' ? (
            <>
              {t('pickerSeq.noMatchPrefix')}
              <Text style={{ color: colors.brick, fontFamily: fonts.bodySb }}>
                {t(`craft.${craft}`)}
              </Text>
              {suffix}
            </>
          ) : empty}
        </Text>
        <Text style={{
          fontFamily: fonts.mono, fontSize: 11, color: colors.inkMute,
          marginTop: 6, textAlign: 'center',
        }}>
          {craft !== 'all' ? t('pickerSeq.tryAll') : t('pickerSeq.rollOneBelow')}
        </Text>
      </View>
    )
  }

  // Three-tone color cycling — brick / mustard / forest
  const tileColor = (i: number) =>
    i % 3 === 0 ? colors.brick : i % 3 === 1 ? colors.mustard : colors.forest

  // Collect up to 4 representative stitches for the 2×2 sequence thumbnail.
  // Sample across the first two rows (2 stitches each) so uniform sequences
  // like Stockinette (all k) don't collapse to a monotone grid.
  const seqThumbnailStitches = (seq: LibrarySequence) => {
    const cells: (LibrarySequence['rows'][number]['stitches'][number] | null)[] = []
    for (const row of seq.rows) {
      cells.push(row.stitches[0] ?? null, row.stitches[1] ?? null)
      if (cells.length >= 4) break
    }
    // Pad to 4 if the sequence has fewer than 2 rows × 2 stitches
    while (cells.length < 4) cells.push(null)
    return cells
  }

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
          <View style={[styles.sheet, {
            backgroundColor: colors.bg,
            // Fixed height (not maxHeight) so the flex:1 ScrollView resolves in Yoga
            height: Math.round(screenHeight * 0.92),
          }]}>
            {/* Drag handle */}
            <View style={[styles.handle, { backgroundColor: colors.rule }]}/>

            {/* Fixed header section — not scrollable */}
            <View style={{ paddingHorizontal: H_PAD }}>
              {/* Header row */}
              <View style={styles.headerRow}>
                <View>
                  <Text style={{
                    fontFamily: fonts.display, fontSize: 24, color: colors.brick,
                    letterSpacing: -0.25, lineHeight: 24,
                  }}>
                    {t('pickerSeq.title')}
                  </Text>
                  <Text style={{
                    fontFamily: fonts.mono, fontSize: 10, color: colors.inkMute,
                    letterSpacing: 1.0, textTransform: 'uppercase', marginTop: 6,
                  }}>
                    {mode === 'sequence'
                      ? t('pickerSeq.subSequence', { count: sequences.length })
                      : t('pickerSeq.subPattern', { count: patterns.length })}
                  </Text>
                </View>
                <Pressable onPress={onClose} hitSlop={12}>
                  <Icon name="x" size={22} color={colors.inkSoft}/>
                </Pressable>
              </View>

              {/* Mode toggle */}
              <View style={[styles.modeToggle, { backgroundColor: colors.cream2 }]}>
                {([
                  { id: 'sequence' as Mode, label: t('pickerSeq.modeSequence'), sub: t('pickerSeq.modeSequenceSub'), count: sequences.length },
                  { id: 'pattern'  as Mode, label: t('pickerSeq.modePattern'),  sub: t('pickerSeq.modePatternSub'),  count: patterns.length  },
                ]).map(m => {
                  const active = mode === m.id
                  return (
                    <Pressable
                      key={m.id}
                      onPress={() => setMode(m.id)}
                      style={[styles.modeBtn, {
                        backgroundColor: active ? colors.card : 'transparent',
                        shadowColor:   active ? '#000' : undefined,
                        shadowOffset:  active ? { width: 0, height: 1 } : undefined,
                        shadowOpacity: active ? 0.06 : 0,
                        shadowRadius:  active ? 3 : 0,
                        elevation:     active ? 1 : 0,
                      }]}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{
                          fontFamily: fonts.bodyBd, fontSize: 13.5,
                          color: active ? colors.brick : colors.inkSoft,
                        }}>
                          {m.label}
                        </Text>
                        <View style={[styles.countBadge, {
                          backgroundColor: active ? colors.cream2 : 'transparent',
                        }]}>
                          <Text style={{
                            fontFamily: fonts.mono, fontSize: 9.5,
                            color: active ? colors.brick : colors.inkMute,
                            fontWeight: '700', letterSpacing: 0.4,
                          }}>
                            {m.count}
                          </Text>
                        </View>
                      </View>
                      <Text style={{
                        fontFamily: fonts.mono, fontSize: 9.5,
                        color: colors.inkMute, letterSpacing: 0.4,
                      }}>
                        {m.sub}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>

              {/* Craft filter pills */}
              <View style={[styles.craftRow, { marginTop: 12 }]}>
                {([
                  { id: 'all',     label: t('craft.all'),     icon: null       },
                  { id: 'knit',    label: t('craft.knit'),    icon: 'needle'   },
                  { id: 'crochet', label: t('craft.crochet'), icon: 'loop'     },
                ] as const).map(c => {
                  const active = craft === c.id
                  return (
                    <Pressable
                      key={c.id}
                      onPress={() => setCraft(c.id)}
                      style={[styles.craftPill, {
                        backgroundColor: active ? colors.ink : 'transparent',
                        borderColor: active ? 'transparent' : colors.rule,
                        borderRadius: radius.full,
                      }]}
                    >
                      {c.icon && (
                        <Icon
                          name={c.icon}
                          size={12}
                          color={active ? colors.bg : colors.inkSoft}
                        />
                      )}
                      <Text style={{
                        fontFamily: fonts.bodySb, fontSize: 12,
                        color: active ? colors.bg : colors.inkSoft,
                      }}>
                        {c.label}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            </View>

            {/* Scrollable list */}
            <ScrollView
              style={{ flex: 1, marginTop: 10 }}
              contentContainerStyle={{ paddingHorizontal: H_PAD, paddingBottom: 0 }}
              showsVerticalScrollIndicator={false}
            >
              {/* ── Sequence list ── */}
              {mode === 'sequence' && (
                visibleSequences.length === 0 ? renderNoMatches('sequences') : (
                  <View style={{ gap: 8 }}>
                    {visibleSequences.map((seq, i) => {
                      const thumbStitches = seqThumbnailStitches(seq)
                      return (
                        <Pressable
                          key={seq.id}
                          onPress={() => onSelectSequence(seq)}
                          style={[styles.tile, {
                            backgroundColor: colors.card,
                            borderColor: colors.rule,
                          }]}
                        >
                          {/* 2×2 thumbnail grid — solid colour bg, white glyphs */}
                          <View style={[styles.thumb, { backgroundColor: tileColor(i), padding: 5 }]}>
                            {[0, 1, 2, 3].map(cellIdx => {
                              const si = thumbStitches[cellIdx]
                              const def = si ? stitchMap[si.stitchId] : undefined
                              return (
                                <View key={cellIdx} style={styles.thumbCell}>
                                  {def && (
                                    <StitchGlyph
                                      symbol={def.symbol}
                                      size={12}
                                      color="#FBF6EC"
                                      strokeWidth={1.8}
                                    />
                                  )}
                                </View>
                              )
                            })}
                          </View>

                          {/* Name + meta */}
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text
                              style={{
                                fontFamily: fonts.bodySb, fontSize: 14.5,
                                color: colors.ink, letterSpacing: -0.05,
                              }}
                              numberOfLines={1}
                            >
                              {seq.name}
                            </Text>
                            <Text style={{
                              fontFamily: fonts.mono, fontSize: 11,
                              color: colors.inkMute, marginTop: 2,
                            }}>
                              {t('pickerSeq.tileMeta', { count: seq.rows.length, craft: t(`craft.${seq.craft}`) })}
                            </Text>
                          </View>

                          {/* Plus button */}
                          <View style={[styles.plusBtn, { backgroundColor: colors.cream2 }]}>
                            <Icon name="plus" size={16} color={colors.brick} stroke={2.4}/>
                          </View>
                        </Pressable>
                      )
                    })}
                  </View>
                )
              )}

              {/* ── Pattern list ── */}
              {mode === 'pattern' && (
                visiblePatterns.length === 0 ? renderNoMatches('patterns') : (
                  <View style={{ gap: 8 }}>
                    {visiblePatterns.map((pat, i) => {
                      const MAX_CHIPS = 4
                      const seqNames = pat.sequenceIds
                        .map(id => sequences.find(s => s.id === id)?.name)
                        .filter((n): n is string => Boolean(n))
                      const visibleChips = seqNames.slice(0, MAX_CHIPS)
                      const overflow = seqNames.length - MAX_CHIPS

                      return (
                        <Pressable
                          key={pat.id}
                          onPress={() => onSelectPattern(pat)}
                          style={[styles.tile, {
                            backgroundColor: colors.card,
                            borderColor: colors.rule,
                            flexDirection: 'column',
                            alignItems: 'stretch',
                            gap: 8,
                          }]}
                        >
                          {/* Main row */}
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            {/* Color square with sequence count */}
                            <View style={[styles.thumb, {
                              backgroundColor: tileColor(i),
                              alignItems: 'center',
                              justifyContent: 'center',
                            }]}>
                              <Text style={{
                                fontFamily: fonts.display, fontSize: 18,
                                color: '#FBF6EC',
                                lineHeight: 22,
                              }}>
                                {pat.sequenceIds.length}
                              </Text>
                            </View>

                            {/* Name + meta */}
                            <View style={{ flex: 1, minWidth: 0 }}>
                              <Text
                                style={{
                                  fontFamily: fonts.bodySb, fontSize: 14.5,
                                  color: colors.ink, letterSpacing: -0.05,
                                }}
                                numberOfLines={1}
                              >
                                {pat.name}
                              </Text>
                              <Text style={{
                                fontFamily: fonts.mono, fontSize: 11,
                                color: colors.inkMute, marginTop: 2,
                              }}>
                                {t('pickerSeq.patternTileMeta', { count: pat.sequenceIds.length, craft: t(`craft.${pat.craft}`) })}
                              </Text>
                            </View>

                            {/* Plus button */}
                            <View style={[styles.plusBtn, { backgroundColor: colors.cream2 }]}>
                              <Icon name="plus" size={16} color={colors.brick} stroke={2.4}/>
                            </View>
                          </View>

                          {/* Sequence name chips — indented to clear the thumbnail */}
                          {seqNames.length > 0 && (
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 3, paddingLeft: 54 }}>
                              {visibleChips.map((name, chipIdx) => (
                                <View
                                  key={chipIdx}
                                  style={[styles.chip, { backgroundColor: colors.cream2 }]}
                                >
                                  <Text style={{
                                    fontFamily: fonts.mono, fontSize: 9.5,
                                    color: colors.inkSoft, letterSpacing: 0.2, fontWeight: '600',
                                  }}>
                                    {name}
                                  </Text>
                                </View>
                              ))}
                              {overflow > 0 && (
                                <View style={styles.overflowChip}>
                                  <Text style={{
                                    fontFamily: fonts.mono, fontSize: 9.5,
                                    color: colors.inkMute, fontWeight: '600',
                                  }}>
                                    {t('pickerSeq.moreItems', { count: overflow })}
                                  </Text>
                                </View>
                              )}
                            </View>
                          )}
                        </Pressable>
                      )
                    })}
                  </View>
                )
              )}

              {/* "Build a new sequence from scratch" dashed CTA */}
              <Pressable
                onPress={onBuildNew}
                style={[styles.buildNewBtn, {
                  borderColor: colors.brick,
                  borderRadius: 12,
                  marginTop: 10,
                  marginBottom: 16,
                }]}
              >
                <Icon name="plus" size={14} color={colors.brick}/>
                <Text style={{ fontFamily: fonts.bodyBd, fontSize: 13, color: colors.brick }}>
                  {mode === 'pattern' ? t('pickerSeq.buildNewPattern') : t('pickerSeq.buildNewSequence')}
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  sheetWrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 20,
  },
  handle:    { width: 44, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 8 },
  headerRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    justifyContent: 'space-between', marginBottom: 14,
  },
  modeToggle: {
    flexDirection: 'row', gap: 6,
    padding: 4, borderRadius: 12,
  },
  modeBtn: {
    flex: 1, paddingVertical: 10, paddingHorizontal: 8,
    borderRadius: 9,
    alignItems: 'center', gap: 2,
  },
  countBadge: {
    paddingHorizontal: 6, paddingVertical: 1,
    borderRadius: 6,
  },
  craftRow: {
    flexDirection: 'row', gap: 6,
    marginBottom: 4,
  },
  craftPill: {
    flex: 1, paddingVertical: 6, paddingHorizontal: 10,
    borderWidth: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  tile: {
    borderWidth: 1, borderRadius: 14,
    padding: 12,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  thumb: {
    width: 42, height: 42,
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 2,
    borderRadius: 10,
    overflow: 'hidden',
    flexShrink: 0,
  },
  // Each cell fills half the inner grid (42 - 2×5 padding - 2 gap) / 2 = 15 px
  thumbCell: {
    width: 15, height: 15,
    alignItems: 'center', justifyContent: 'center',
  },
  plusBtn: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  chip: {
    paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: 6,
  },
  overflowChip: {
    paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: 6,
  },
  buildNewBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderStyle: 'dashed',
    paddingVertical: 12, width: '100%',
  },
  noMatchCard: {
    padding: 24, borderRadius: 16,
    borderWidth: 1.5, borderStyle: 'dashed',
    alignItems: 'center',
  },
})
