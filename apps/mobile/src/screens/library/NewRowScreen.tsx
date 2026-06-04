import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  Modal, View, Text, Pressable, ScrollView, TextInput, StyleSheet,
} from 'react-native'
import { BlurView } from 'expo-blur'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../../theme/ThemeContext'
import { useLibraryStore } from '../../store/libraryStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useStitchMap } from '../../hooks/useStitchMap'
import StitchGlyph from '../../components/StitchGlyph'
import Icon from '../../components/ui/Icon'
import StitchPickerModal from '../../components/pickers/StitchPickerModal'
import DefineCustomStitchScreen from '../setup/DefineCustomStitchScreen'
import { RowNotation, StitchTile, RepeatGroup } from '../../components/RepeatRow/RepeatTiles'
import {
  appendStitchPreservingSegments,
  removeLastStitchPreservingSegments,
  expandStitches,
  segmentsFromMark,
} from '../../components/RepeatRow/segments'
import { stitchHue } from '../../components/RepeatRow/stitchHue'
import type {
  Craft, LibraryRow, Row, StitchDef, StitchInstance,
} from '../../types'
import { uuid } from '../../utils/uuid'

type Props = {
  visible: boolean
  onClose: () => void
  defaultCraft?: Craft
}

function totalStitches(stitches: StitchInstance[]) {
  return stitches.reduce((a, s) => a + s.count, 0)
}

export default function NewRowScreen({ visible, onClose, defaultCraft = 'knit' }: Props) {
  const { t } = useTranslation()
  const { colors, fonts, radius } = useTheme()
  const stitchMap = useStitchMap()
  const { addRow } = useLibraryStore()
  const recordStitchUsed = useSettingsStore(s => s.recordStitchUsed)

  const [name,  setName]  = useState('')
  const [craft, setCraft] = useState<Craft>(defaultCraft)
  const [row,   setRow]   = useState<Row>(() => ({ id: 'draft', label: '', stitches: [] }))
  const [marking, setMarking] = useState<{ step: 'start' | 'end'; start: number | null } | null>(null)
  const [showPicker, setShowPicker] = useState(false)
  const [showDefineCustom, setShowDefineCustom] = useState(false)

  const sts = totalStitches(row.stitches)
  const ready = name.trim().length > 0 && sts > 0
  const hasRepeat = !!row.segments

  // Reset state each time the sheet re-opens
  useEffect(() => {
    if (visible) {
      setName('')
      setCraft(defaultCraft)
      setRow({ id: 'draft', label: '', stitches: [] })
      setMarking(null)
      setShowPicker(false)
      setShowDefineCustom(false)
    }
  }, [visible, defaultCraft])

  // Dock stitch ids — recent for current craft, then defaults. Snapshot held stable
  // while the dock is up (refreshed when the full picker closes).
  const computeDockIds = useCallback((): string[] => {
    const QUICK_KNIT    = ['k', 'p', 'yo', 'k2tog', 'ssk', 'sl']
    const QUICK_CROCHET = ['sc', 'dc', 'hdc', 'ch', 'slst', 'tr']
    const dockDefaults  = craft === 'knit' ? QUICK_KNIT : QUICK_CROCHET
    const recent = useSettingsStore.getState().recentStitchIds.filter(id => stitchMap[id]?.type === craft)
    const ids: string[] = [...recent]
    for (const id of dockDefaults) {
      if (ids.length >= 6) break
      if (!ids.includes(id)) ids.push(id)
    }
    return ids.slice(0, 6)
  }, [craft, stitchMap])

  const [dockIds, setDockIds] = useState<string[]>(() => computeDockIds())
  useEffect(() => { setDockIds(computeDockIds()) }, [computeDockIds])
  const prevShowPicker = useRef(showPicker)
  useEffect(() => {
    if (prevShowPicker.current && !showPicker) setDockIds(computeDockIds())
    prevShowPicker.current = showPicker
  }, [showPicker, computeDockIds])

  const dockStitches = dockIds
    .map(id => stitchMap[id])
    .filter((s): s is StitchDef => !!s)

  const totalStitchCount = Object.values(stitchMap).filter(s => s.type === craft).length

  const addStitch = useCallback((stitchId: string) => {
    setRow(r => appendStitchPreservingSegments(r, stitchId))
    recordStitchUsed(stitchId)
  }, [recordStitchUsed])

  const undoLast = () => {
    if (row.stitches.length === 0) return
    setRow(r => removeLastStitchPreservingSegments(r))
  }

  const startMarking = () => {
    if (row.stitches.length === 0) return
    // Drop any existing segments before re-marking — same as SetupWizard
    if (row.segments) {
      const { segments: _drop, ...rest } = row
      setRow(rest as Row)
    }
    setMarking({ step: 'start', start: null })
  }

  const handleMarkTap = (tileIdx: number) => {
    if (!marking) return
    if (marking.step === 'start') {
      setMarking({ step: 'end', start: tileIdx })
      return
    }
    const start = marking.start
    if (start == null || tileIdx < start) return
    const segments = segmentsFromMark(row.stitches, start, tileIdx)
    setRow(r => ({ ...r, segments }))
    setMarking(null)
  }

  const handlePickerSelect = (stitch: StitchDef) => {
    addStitch(stitch.id)
    setShowPicker(false)
  }

  const handleSave = () => {
    if (!ready) return
    const newRow: LibraryRow = {
      id: uuid(),
      label: name.trim(),
      craft,
      stitches: row.stitches,
      ...(row.segments ? { segments: row.segments } : {}),
      isBuiltIn: false,
    }
    addRow(newRow)
    onClose()
  }

  // Auto notation: "k1, p2, yo" style — uses each stitch's abbr + count
  const notation = useMemo(() => {
    if (row.stitches.length === 0) return ''
    return row.stitches.map(si => {
      const def = stitchMap[si.stitchId]
      const abbr = def?.abbr ?? si.stitchId
      return si.count > 1 ? `${abbr}${si.count}` : abbr
    }).join(', ')
  }, [row.stitches, stitchMap])

  const flatIds = useMemo(() => expandStitches(row.stitches), [row.stitches])
  const dockVisible = marking === null && !showPicker

  const stitchChipColor = (id: string) => stitchHue(colors, id)

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1 }}>
        <BlurView
          intensity={16}
          tint="dark"
          style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(43,24,16,0.32)' }]}
        />
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <View style={[styles.screen, { backgroundColor: colors.bg }]}>

            {/* Top bar */}
            <View style={[styles.topBar, { borderBottomColor: colors.rule }]}>
              <Pressable onPress={onClose} hitSlop={12} style={[styles.closeBtn, {
                backgroundColor: colors.card, borderColor: colors.rule,
              }]}>
                <Icon name="x" size={18} color={colors.inkSoft}/>
              </Pressable>
              <View style={[styles.draftBadge, { backgroundColor: colors.cream2, borderColor: colors.rule }]}>
                <Text style={{
                  fontFamily: fonts.mono, fontSize: 9.5, color: colors.inkMute,
                  letterSpacing: 2, textTransform: 'uppercase',
                }}>{t('libraryCreate.draftRow')}</Text>
              </View>
              <Pressable onPress={ready ? handleSave : undefined} hitSlop={12}>
                <Text style={{
                  fontFamily: fonts.bodySb, fontSize: 14, letterSpacing: -0.1,
                  color: ready ? colors.brick : colors.inkMute,
                }}>{t('common.save')}</Text>
              </Pressable>
            </View>

            {/* Page title */}
            <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 6 }}>
              <Text style={{
                fontFamily: fonts.display, fontSize: 32, color: colors.brick,
                letterSpacing: -0.5, lineHeight: 36,
              }}>{t('libraryCreate.newRowTitle')}</Text>
              <Text style={{
                fontFamily: fonts.body, fontSize: 13.5, color: colors.inkSoft,
                lineHeight: 20, marginTop: 6,
              }}>{t('libraryCreate.newRowSub')}</Text>
            </View>

            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: dockVisible ? 180 : marking ? 110 : 40 }}
              keyboardShouldPersistTaps="handled"
            >

              {/* Live preview */}
              <View style={[styles.previewCard, {
                backgroundColor: colors.card,
                borderColor: colors.brick,
                shadowColor: colors.brick,
              }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <Text style={{
                    fontFamily: fonts.mono, fontSize: 10, color: colors.inkMute,
                    letterSpacing: 1.8, textTransform: 'uppercase',
                  }}>{t('libraryCreate.livePreview')}</Text>
                  <View style={{
                    backgroundColor: colors.mustard, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6,
                  }}>
                    <Text style={{
                      fontFamily: fonts.mono, fontSize: 9, fontWeight: '700',
                      color: colors.ink, letterSpacing: 0.8,
                    }}>{t('libraryCreate.newStsBadge', { count: sts })}</Text>
                  </View>
                </View>
                <Text style={{
                  fontFamily: fonts.bodyBd, fontSize: 15.5, color: name ? colors.ink : colors.inkMute,
                  letterSpacing: -0.05, fontStyle: name ? 'normal' : 'italic',
                }} numberOfLines={1}>
                  {name || t('libraryCreate.untitledRow')}
                </Text>
                {flatIds.length > 0 && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 3, marginTop: 8 }}>
                    {flatIds.slice(0, 16).map((id, i) => {
                      const def = stitchMap[id]
                      if (!def) return null
                      const c = stitchChipColor(id)
                      return (
                        <View key={i} style={{
                          width: 22, height: 26, borderRadius: 6,
                          backgroundColor: colors.cream2,
                          borderWidth: 1.2, borderColor: c,
                          alignItems: 'center', justifyContent: 'center',
                        }}>
                          <StitchGlyph symbol={def.symbol} color={c} size={12} strokeWidth={1.8}/>
                        </View>
                      )
                    })}
                    {flatIds.length > 16 && (
                      <Text style={{
                        fontFamily: fonts.mono, fontSize: 10, color: colors.inkMute,
                        alignSelf: 'center', marginLeft: 4,
                      }}>+{flatIds.length - 16}</Text>
                    )}
                  </View>
                )}
                {notation ? (
                  <Text style={{
                    fontFamily: fonts.mono, fontSize: 11, color: colors.inkMute, marginTop: 8,
                  }} numberOfLines={1}>{notation}</Text>
                ) : null}
              </View>

              {/* Name & craft */}
              <FormLabel hint={t('libraryCreate.identityHint')}>{t('libraryCreate.identityLabel')}</FormLabel>
              <View style={[styles.field, {
                backgroundColor: colors.card,
                borderColor: name ? colors.brick : colors.rule,
                borderWidth: name ? 1.5 : 1,
                borderRadius: radius.md,
                marginBottom: 10,
              }]}>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  maxLength={60}
                  placeholder={t('libraryCreate.namePlaceholderRow')}
                  placeholderTextColor={colors.inkMute}
                  style={{
                    fontFamily: fonts.body, fontSize: 16, color: colors.ink,
                    letterSpacing: -0.05,
                  }}
                />
              </View>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 22 }}>
                {([
                  { id: 'knit' as Craft,    label: t('craft.knit'),    icon: 'needle' as const },
                  { id: 'crochet' as Craft, label: t('craft.crochet'), icon: 'loop'   as const },
                ]).map(c => {
                  const active = craft === c.id
                  return (
                    <Pressable
                      key={c.id}
                      onPress={() => setCraft(c.id)}
                      style={[styles.craftBtn, {
                        flex: 1,
                        backgroundColor: active ? colors.brick : colors.card,
                        borderColor: active ? 'transparent' : colors.rule,
                        borderRadius: radius.md,
                      }]}
                    >
                      <Icon name={c.icon} size={16} color={active ? '#FBF6EC' : colors.brick}/>
                      <Text style={{
                        fontFamily: fonts.bodySb, fontSize: 14.5,
                        color: active ? '#FBF6EC' : colors.ink,
                        letterSpacing: -0.05,
                      }}>{c.label}</Text>
                    </Pressable>
                  )
                })}
              </View>

              {/* Builder */}
              <FormLabel hint={t('libraryCreate.buildRowHint', { count: sts })}>{t('libraryCreate.buildRow')}</FormLabel>
              <View style={{
                backgroundColor: colors.cream2,
                borderColor: colors.rule, borderWidth: 1,
                borderRadius: 16, padding: 12, marginBottom: 22,
              }}>
                {marking ? (
                  <View>
                    <View style={{
                      flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 16,
                      backgroundColor: '#FBEFEA',
                      borderWidth: 1, borderColor: 'rgba(156,61,46,0.2)',
                      borderRadius: 11, paddingVertical: 8, paddingHorizontal: 11,
                    }}>
                      <View style={{
                        width: 22, height: 22, borderRadius: 11,
                        backgroundColor: colors.brick,
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Text style={{ fontFamily: fonts.display, fontSize: 13, color: '#FBF6EC', lineHeight: 16 }}>
                          {marking.step === 'start' ? '1' : '2'}
                        </Text>
                      </View>
                      <Text style={{
                        flex: 1, fontFamily: fonts.bodySb, fontSize: 13,
                        color: colors.ink, letterSpacing: -0.05,
                      }}>
                        {marking.step === 'start' ? t('wizard.step3MarkStartInRow') : t('wizard.step3MarkEndInRow')}
                      </Text>
                    </View>
                    <View style={{
                      flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap',
                      rowGap: 18, columnGap: 8, paddingTop: 14,
                    }}>
                      {flatIds.map((id, idx) => {
                        let state: 'tap' | 'start' | 'dim' = 'tap'
                        if (idx === marking.start) state = 'start'
                        else if (marking.step === 'end' && marking.start !== null && idx < marking.start) state = 'dim'
                        return (
                          <StitchTile
                            key={idx}
                            id={id}
                            state={state}
                            onPress={() => handleMarkTap(idx)}
                          />
                        )
                      })}
                    </View>
                    <Text style={{
                      fontFamily: fonts.mono, fontSize: 10, color: colors.inkMute,
                      marginTop: 12, lineHeight: 15,
                    }}>
                      {marking.step === 'start' ? t('wizard.step3MarkStartHint') : t('wizard.step3MarkEndHint')}
                    </Text>
                  </View>
                ) : hasRepeat && row.segments ? (
                  <View style={{
                    flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap',
                    rowGap: 18, columnGap: 8, paddingTop: 14,
                  }}>
                    {row.segments.map((seg, i) => {
                      if (seg.type === 'fixed') {
                        const ids = expandStitches(seg.stitches)
                        return (
                          <View key={i} style={{ flexDirection: 'row', gap: 3 }}>
                            {ids.map((id, j) => <StitchTile key={j} id={id}/>)}
                          </View>
                        )
                      }
                      return <RepeatGroup key={i} stitches={seg.stitches} rule={seg.rule}/>
                    })}
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                    {flatIds.map((id, idx) => {
                      const def = stitchMap[id]
                      if (!def) return null
                      const isLast = idx === flatIds.length - 1
                      const c = stitchChipColor(id)
                      return (
                        <View key={idx} style={{
                          width: 30, height: 40, borderRadius: 7,
                          backgroundColor: isLast ? c : colors.cream2,
                          borderWidth: 1.4, borderColor: c,
                          alignItems: 'center', justifyContent: 'center', gap: 2,
                          ...(isLast ? {
                            shadowColor: c, shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.35, shadowRadius: 6, elevation: 3,
                          } : {}),
                        }}>
                          <StitchGlyph symbol={def.symbol} color={isLast ? '#FBF6EC' : c} size={15} strokeWidth={1.9}/>
                          <Text style={{
                            fontFamily: fonts.mono, fontSize: 7.5, fontWeight: '700',
                            color: isLast ? '#FBF6EC' : c, lineHeight: 9,
                          }}>{def.abbr}</Text>
                        </View>
                      )
                    })}
                    {/* Caret next-slot affordance */}
                    <View style={{
                      width: 30, height: 40, borderRadius: 7,
                      borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.brick,
                      alignItems: 'center', justifyContent: 'center', opacity: 0.8,
                    }}>
                      <View style={{ width: 2, height: 20, backgroundColor: colors.brick }}/>
                    </View>
                  </View>
                )}

                {/* Builder toolbar */}
                {!marking && (
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                    <Pressable
                      onPress={startMarking}
                      disabled={sts === 0}
                      style={{
                        flexDirection: 'row', alignItems: 'center', gap: 6,
                        paddingVertical: 7, paddingHorizontal: 12,
                        backgroundColor: hasRepeat ? '#FBEFEA' : colors.card,
                        borderWidth: 1,
                        borderColor: hasRepeat ? 'rgba(156,61,46,0.24)' : colors.rule,
                        borderRadius: 10,
                        opacity: sts === 0 ? 0.4 : 1,
                      }}
                    >
                      <Icon name="repeat" size={14} color={hasRepeat ? colors.brick : colors.inkSoft}/>
                      <Text style={{
                        fontFamily: fonts.bodySb, fontSize: 12,
                        color: hasRepeat ? colors.brick : colors.inkSoft,
                      }}>{t('libraryCreate.markRepeat')}</Text>
                    </Pressable>
                    <Pressable
                      onPress={undoLast}
                      disabled={sts === 0}
                      style={{
                        flexDirection: 'row', alignItems: 'center', gap: 6,
                        paddingVertical: 7, paddingHorizontal: 12,
                        backgroundColor: colors.card,
                        borderWidth: 1, borderColor: colors.rule,
                        borderRadius: 10,
                        opacity: sts === 0 ? 0.4 : 1,
                      }}
                    >
                      <Icon name="backspace" size={14} color={colors.inkSoft}/>
                      <Text style={{ fontFamily: fonts.bodySb, fontSize: 12, color: colors.inkSoft }}>
                        {t('libraryCreate.undoLast')}
                      </Text>
                    </Pressable>
                    {hasRepeat && (
                      <View style={{
                        flexDirection: 'row', alignItems: 'center', gap: 3,
                        backgroundColor: '#FBEFEA',
                        borderWidth: 1, borderColor: 'rgba(156,61,46,0.18)',
                        paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6,
                        alignSelf: 'center',
                      }}>
                        <Icon name="repeat" size={10} color={colors.brick} stroke={2.2}/>
                        <Text style={{
                          fontFamily: fonts.mono, fontSize: 9, fontWeight: '700',
                          color: colors.brick, letterSpacing: 0.6, textTransform: 'uppercase',
                        }}>{t('wizard.step3RepeatTag')}</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>

              {/* Notation read-out */}
              {sts > 0 && (
                <>
                  <FormLabel hint={t('libraryCreate.notationHint')}>{t('libraryCreate.notationLabel')}</FormLabel>
                  <View style={[styles.field, {
                    backgroundColor: colors.card,
                    borderColor: colors.rule,
                    borderRadius: radius.md,
                    marginBottom: 6,
                  }]}>
                    {hasRepeat && row.segments ? (
                      <RowNotation segments={row.segments}/>
                    ) : (
                      <Text style={{
                        fontFamily: fonts.mono, fontSize: 13.5, color: colors.ink, letterSpacing: 0.1,
                      }}>{notation}</Text>
                    )}
                  </View>
                  <Text style={{
                    fontFamily: fonts.mono, fontSize: 10, color: colors.inkMute,
                    letterSpacing: 0.4, marginBottom: 22,
                  }}>{t('libraryCreate.notationFootnote')}</Text>
                </>
              )}

              <Text style={{
                textAlign: 'center', fontFamily: fonts.mono, fontSize: 10,
                color: colors.inkMute, letterSpacing: 2.5, textTransform: 'uppercase',
                marginTop: 6,
              }}>{t('libraryCreate.signoffRow')}</Text>

            </ScrollView>

            {/* Stitch dock */}
            {dockVisible && (
              <View style={[styles.dock, {
                backgroundColor: colors.bg,
                borderTopColor: colors.rule,
              }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{
                    fontFamily: fonts.mono, fontSize: 10, color: colors.brick,
                    fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase',
                  }}>{t('libraryCreate.tapToAddRow')}</Text>
                  <Pressable onPress={() => setShowPicker(true)} hitSlop={6} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.brick, fontWeight: '700' }}>
                      {t('wizard.step3AllStitches', { count: totalStitchCount })}
                    </Text>
                    <Icon name="chevR" size={12} color={colors.brick}/>
                  </Pressable>
                </View>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {dockStitches.map((s, idx) => {
                    const c = [colors.brick, colors.mustard, colors.forest][idx % 3]!
                    return (
                      <Pressable
                        key={s.id}
                        onPress={() => addStitch(s.id)}
                        style={{
                          flex: 1, backgroundColor: colors.card,
                          borderWidth: 1, borderColor: colors.rule, borderRadius: 10,
                          paddingVertical: 6, alignItems: 'center', gap: 3,
                        }}
                      >
                        <View style={{
                          width: 28, height: 28, borderRadius: 8, backgroundColor: c,
                          alignItems: 'center', justifyContent: 'center',
                        }}>
                          <StitchGlyph symbol={s.symbol} size={16} color="#FBF6EC"/>
                        </View>
                        <Text style={{ fontSize: 9.5, fontFamily: fonts.mono, color: colors.inkSoft, fontWeight: '700' }}>
                          {s.abbr}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>
              </View>
            )}

            {/* Marking instruction bar — replaces dock while marking */}
            {marking && (
              <View style={[styles.dock, {
                backgroundColor: colors.bg, borderTopColor: colors.rule,
                paddingVertical: 12,
              }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Icon name="repeat" size={16} color={colors.brick} stroke={2}/>
                  <Text style={{ flex: 1, fontFamily: fonts.bodySb, fontSize: 13.5, color: colors.ink }}>
                    <Text style={{ fontFamily: fonts.mono, color: colors.brick, fontWeight: '700' }}>
                      {t('wizard.step3MarkStepIndicator', { current: marking.step === 'start' ? 1 : 2, total: 2 })}
                    </Text>
                    {'  '}
                    {marking.step === 'start' ? t('wizard.step3MarkStart') : t('wizard.step3MarkEnd')}
                  </Text>
                  <Pressable
                    onPress={() => setMarking(null)}
                    style={{
                      borderWidth: 1, borderColor: colors.rule, borderRadius: 9,
                      paddingHorizontal: 12, paddingVertical: 6,
                    }}
                  >
                    <Text style={{ fontFamily: fonts.bodySb, fontSize: 12.5, color: colors.inkSoft }}>
                      {t('wizard.step3MarkCancel')}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}

          </View>
        </View>
      </View>

      {/* Stitch picker (opens from dock "All stitches") */}
      <StitchPickerModal
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={handlePickerSelect}
        onDefineCustom={() => { setShowPicker(false); setShowDefineCustom(true) }}
        craftFilter={craft}
      />

      <DefineCustomStitchScreen
        visible={showDefineCustom}
        onClose={() => setShowDefineCustom(false)}
        onSaved={(id) => { setShowDefineCustom(false); addStitch(id) }}
        defaultCraft={craft}
      />
    </Modal>
  )
}

function FormLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  const { colors, fonts } = useTheme()
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
      <Text style={{
        fontFamily: fonts.mono, fontSize: 10.5, color: colors.inkMute,
        letterSpacing: 1.8, textTransform: 'uppercase',
      }}>{children}</Text>
      {hint ? (
        <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.inkMute, letterSpacing: 0.5 }}>
          {hint}
        </Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, marginTop: 60, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 10, borderBottomWidth: 1,
  },
  closeBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  draftBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 99, borderWidth: 1 },
  previewCard: {
    borderRadius: 18, padding: 14, borderWidth: 1.5, marginBottom: 22,
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 18, elevation: 4,
  },
  field: { borderWidth: 1, paddingVertical: 12, paddingHorizontal: 14 },
  craftBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 12, paddingHorizontal: 14, borderWidth: 1,
  },
  dock: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopWidth: 1, paddingTop: 10, paddingBottom: 28, paddingHorizontal: 20,
  },
})
