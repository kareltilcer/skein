import React, {useEffect, useMemo, useState} from 'react'
import {Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View,} from 'react-native'
import {BlurView} from 'expo-blur'
import {useTheme} from '../../theme/ThemeContext'
import {STITCH_MAP} from '../../tokens/stitches'
import {useLibraryStore} from '../../store/libraryStore'
import {useSettingsStore} from '../../store/settingsStore'
import StitchGlyph from '../StitchGlyph'
import Icon from '../ui/Icon'
import type {Craft, LibraryRow} from '../../types'

type SortKey = 'recent' | 'used' | 'az'

const SORT_OPTS: { id: SortKey; label: string; sub: string }[] = [
  { id: 'recent', label: 'Recent',    sub: 'last used'    },
  { id: 'used',   label: 'Most used', sub: 'across all'   },
  { id: 'az',     label: 'A → Z',     sub: 'alphabetical' },
]

const H_PAD = 20

type Props = {
  visible: boolean
  onClose: () => void
  /** Called when user taps a row tile — caller is responsible for dismissal */
  onSelect: (row: LibraryRow) => void
  /** "Build a new row from scratch" CTA — same as tapping "New row" button */
  onBuildNew: () => void
  craftFilter?: Craft
}

export default function RowPickerModal({
  visible, onClose, onSelect, onBuildNew, craftFilter,
}: Props) {
  const { colors, fonts, radius } = useTheme()
  const { height: screenHeight } = useWindowDimensions()

  const rows = useLibraryStore(s => s.rows)
  const userDefaultCraft = useSettingsStore(s => s.defaultCraft)

  const defaultCraft: Craft | 'all' = craftFilter ?? userDefaultCraft

  const [sort,  setSort]  = useState<SortKey>('recent')
  const [craft, setCraft] = useState<Craft | 'all'>(defaultCraft)
  const [query, setQuery] = useState('')

  // Reset state each time the sheet opens
  useEffect(() => {
    if (visible) {
      setSort('recent')
      setCraft(defaultCraft)
      setQuery('')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  const visible_rows = useMemo(() => {
    let list = craft === 'all' ? rows : rows.filter(r => r.craft === craft)

    // Text search — matches label or any stitch ID
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter(r =>
        r.label.toLowerCase().includes(q) ||
        r.stitches.some(si => si.stitchId.toLowerCase().includes(q)),
      )
    }

    if (sort === 'az') {
      list = [...list].sort((a, b) => a.label.localeCompare(b.label))
    }
    // 'recent' = insertion order (no-op); 'used' = same for now (no per-row usage counter)

    return list
  }, [rows, craft, query, sort])

  // Three-tone stitch color cycling — brick / mustard / forest
  const stitchColor = (i: number) =>
    i % 3 === 0 ? colors.brick : i % 3 === 1 ? colors.mustard : colors.forest

  const metaLine = (row: LibraryRow) => {
    return `${row.stitches.reduce((s, si) => s + si.count, 0)} sts`
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
                    letterSpacing: -0.25, lineHeight: 28,
                  }}>
                    Add a row
                  </Text>
                  <Text style={{
                    fontFamily: fonts.mono, fontSize: 10, color: colors.inkMute,
                    letterSpacing: 1.0, textTransform: 'uppercase', marginTop: 6,
                  }}>
                    One row · {rows.length} saved in your library
                  </Text>
                </View>
                <Pressable onPress={onClose} hitSlop={12}>
                  <Icon name="x" size={22} color={colors.inkSoft}/>
                </Pressable>
              </View>

              {/* Search bar */}
              <View style={[styles.searchBar, {
                backgroundColor: colors.card,
                borderColor: colors.rule,
              }]}>
                <Icon name="search" size={16} color={colors.inkMute}/>
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search rows by name, stitch, notation…"
                  placeholderTextColor={colors.inkMute}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={{
                    flex: 1,
                    fontFamily: fonts.body, fontSize: 13.5, color: colors.ink,
                  }}
                />
              </View>

              {/* Sort segmented control */}
              <View style={[styles.segmented, { backgroundColor: colors.cream2 }]}>
                {SORT_OPTS.map(o => {
                  const active = sort === o.id
                  return (
                    <Pressable
                      key={o.id}
                      onPress={() => setSort(o.id)}
                      style={[styles.segBtn, {
                        backgroundColor: active ? colors.card : 'transparent',
                        shadowColor:   active ? '#000' : undefined,
                        shadowOffset:  active ? { width: 0, height: 1 } : undefined,
                        shadowOpacity: active ? 0.06 : 0,
                        shadowRadius:  active ? 3 : 0,
                        elevation:     active ? 1 : 0,
                      }]}
                    >
                      <Text style={{
                        fontFamily: fonts.bodySb, fontSize: 13,
                        color: active ? colors.brick : colors.inkSoft,
                        letterSpacing: -0.05,
                      }}>
                        {o.label}
                      </Text>
                      <Text style={{
                        fontFamily: fonts.mono, fontSize: 9.5,
                        color: colors.inkMute, letterSpacing: 0.4,
                      }}>
                        {o.sub}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>

              {/* Craft filter pills */}
              <View style={[styles.craftRow, { marginTop: 12 }]}>
                {([
                  { id: 'all',     label: 'All',     icon: null       },
                  { id: 'knit',    label: 'Knit',    icon: 'needle'   },
                  { id: 'crochet', label: 'Crochet', icon: 'loop'     },
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
              contentContainerStyle={{ paddingHorizontal: H_PAD, paddingBottom: 8 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {visible_rows.length === 0 ? (
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
                        {'No '}
                        <Text style={{ color: colors.brick, fontFamily: fonts.bodySb }}>
                          {craft}
                        </Text>
                        {' rows match this filter.'}
                      </>
                    ) : 'No rows match this filter.'}
                  </Text>
                  <Text style={{
                    fontFamily: fonts.mono, fontSize: 11, color: colors.inkMute,
                    marginTop: 6, textAlign: 'center',
                  }}>
                    Try "All" or build a new one.
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 8 }}>
                  {visible_rows.map(row => (
                    <Pressable
                      key={row.id}
                      onPress={() => onSelect(row)}
                      style={[styles.rowTile, {
                        backgroundColor: colors.card,
                        borderColor: colors.rule,
                      }]}
                    >
                      {/* Mini stitch chart — first 5 cells */}
                      <View style={{ flexDirection: 'row', gap: 2, flexShrink: 0 }}>
                        {row.stitches.slice(0, 5).map((si, i) => {
                          const def = STITCH_MAP[si.stitchId]
                          const c = stitchColor(i)
                          return (
                            <View
                              key={i}
                              style={[styles.miniCell, {
                                backgroundColor: colors.cream2,
                                borderColor: c,
                              }]}
                            >
                              {def && (
                                <StitchGlyph
                                  symbol={def.symbol}
                                  size={10}
                                  color={c}
                                  strokeWidth={1.8}
                                />
                              )}
                            </View>
                          )
                        })}
                        {row.stitches.length > 5 && (
                          <View style={styles.overflowCell}>
                            <Text style={{
                              fontFamily: fonts.mono, fontSize: 9,
                              color: colors.inkMute, fontWeight: '700',
                            }}>
                              +{row.stitches.length - 5}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Label + meta */}
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text
                          style={{
                            fontFamily: fonts.bodySb, fontSize: 14.5,
                            color: colors.ink, letterSpacing: -0.05,
                          }}
                          numberOfLines={1}
                        >
                          {row.label}
                        </Text>
                        <Text style={{
                          fontFamily: fonts.mono, fontSize: 11,
                          color: colors.inkMute, marginTop: 2,
                        }}
                          numberOfLines={1}
                        >
                          {metaLine(row)}
                        </Text>
                      </View>

                      {/* Plus button */}
                      <View style={[styles.plusBtn, { backgroundColor: colors.cream2 }]}>
                        <Icon name="plus" size={16} color={colors.brick} stroke={2.4}/>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}

              {/* "Build a new row from scratch" dashed CTA */}
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
                <Text style={{ fontFamily: fonts.bodySb, fontSize: 13, color: colors.brick }}>
                  Build a new row from scratch
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
  sheetWrap:   { flex: 1, justifyContent: 'flex-end' },
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
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 12,
    marginBottom: 10,
  },
  segmented: {
    flexDirection: 'row', gap: 6,
    padding: 4, borderRadius: 12,
  },
  segBtn: {
    flex: 1, paddingVertical: 9, paddingHorizontal: 6,
    borderRadius: 9,
    alignItems: 'center', gap: 1,
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
  rowTile: {
    borderWidth: 1, borderRadius: 14,
    padding: 12,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  miniCell: {
    width: 16, height: 22, borderRadius: 4, borderWidth: 1.2,
    alignItems: 'center', justifyContent: 'center',
  },
  overflowCell: {
    width: 16, height: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  plusBtn: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
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
