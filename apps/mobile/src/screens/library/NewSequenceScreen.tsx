import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  Modal, View, Text, Pressable, TextInput, StyleSheet,
} from 'react-native'
import { BlurView } from 'expo-blur'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import _DraggableFlatList, { ScaleDecorator as _ScaleDecorator } from 'react-native-draggable-flatlist'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../../theme/ThemeContext'
import { useLibraryStore } from '../../store/libraryStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useStitchMap } from '../../hooks/useStitchMap'
import StitchGlyph from '../../components/StitchGlyph'
import Icon from '../../components/ui/Icon'
import StitchPickerModal from '../../components/pickers/StitchPickerModal'
import RowPickerModal from '../../components/pickers/RowPickerModal'
import DefineCustomStitchScreen from '../setup/DefineCustomStitchScreen'
import {
  appendStitchPreservingSegments,
  removeLastStitchPreservingSegments,
  expandStitches,
} from '../../components/RepeatRow/segments'
import { stitchHue } from '../../components/RepeatRow/stitchHue'
import type {
  Craft, LibraryRow, LibrarySequence, Row, StitchDef, StitchInstance,
} from '../../types'
import { uuid } from '../../utils/uuid'
import { matchesNumberedTemplate } from '../../i18n'

const DraggableFlatList = _DraggableFlatList as any
const ScaleDecorator = _ScaleDecorator as any

type Props = {
  visible: boolean
  onClose: () => void
  defaultCraft?: Craft
  initialSequence?: LibrarySequence
}

function totalStitches(stitches: StitchInstance[]) {
  return stitches.reduce((a, s) => a + s.count, 0)
}

function makeEmptyRow(label: string): Row {
  return { id: uuid(), label, stitches: [] }
}

export default function NewSequenceScreen({ visible, onClose, defaultCraft = 'knit', initialSequence }: Props) {
  const { t } = useTranslation()
  const { colors, fonts, radius } = useTheme()
  const stitchMap = useStitchMap()
  const { addSequence, updateSequence, rows: libraryRows } = useLibraryStore()
  const recordStitchUsed = useSettingsStore(s => s.recordStitchUsed)

  const isEditing = !!initialSequence

  const [name,  setName]  = useState('')
  const [craft, setCraft] = useState<Craft>(defaultCraft)
  const [rows,  setRows]  = useState<Row[]>([])
  const [focusedRowIdx, setFocusedRowIdx] = useState<number | null>(null)
  const [showStitchPicker, setShowStitchPicker] = useState(false)
  const [showRowPicker,    setShowRowPicker]    = useState(false)
  const [showDefineCustom, setShowDefineCustom] = useState(false)

  // Initialise with one empty row + focus it
  useEffect(() => {
    if (visible) {
      if (initialSequence) {
        setName(initialSequence.name)
        setCraft(initialSequence.craft)
        // Clone rows with fresh draft ids so internal list keying is stable
        setRows(initialSequence.rows.map(r => ({
          id: uuid(),
          label: r.label,
          stitches: r.stitches,
          ...(r.segments ? { segments: r.segments } : {}),
        })))
        setFocusedRowIdx(null)
      } else {
        setName('')
        setCraft(defaultCraft)
        const first = makeEmptyRow(t('libraryCreate.rowDefaultLabel', { n: 1 }))
        setRows([first])
        setFocusedRowIdx(0)
      }
      setShowStitchPicker(false)
      setShowRowPicker(false)
      setShowDefineCustom(false)
    }
  }, [visible, defaultCraft, t, initialSequence])

  const filledRows = rows.filter(r => r.stitches.length > 0).length
  const totalSts = rows.reduce((a, r) => a + totalStitches(r.stitches), 0)
  const ready = name.trim().length > 0 && filledRows > 0

  // Dock stitches — same logic as NewRowScreen
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
  const prevShowPicker = useRef(showStitchPicker)
  useEffect(() => {
    if (prevShowPicker.current && !showStitchPicker) setDockIds(computeDockIds())
    prevShowPicker.current = showStitchPicker
  }, [showStitchPicker, computeDockIds])

  const dockStitches = dockIds
    .map(id => stitchMap[id])
    .filter((s): s is StitchDef => !!s)

  const totalStitchCount = Object.values(stitchMap).filter(s => s.type === craft).length

  const addStitchToFocused = useCallback((stitchId: string) => {
    if (focusedRowIdx == null) return
    setRows(rs => rs.map((r, i) => i === focusedRowIdx ? appendStitchPreservingSegments(r, stitchId) : r))
    recordStitchUsed(stitchId)
  }, [focusedRowIdx, recordStitchUsed])

  const undoLastInFocused = () => {
    if (focusedRowIdx == null) return
    setRows(rs => rs.map((r, i) => i === focusedRowIdx ? removeLastStitchPreservingSegments(r) : r))
  }

  const addRow = () => {
    const newRow = makeEmptyRow(t('libraryCreate.rowDefaultLabel', { n: rows.length + 1 }))
    setRows(rs => [...rs, newRow])
    setFocusedRowIdx(rows.length)
  }

  const addRowFromLib = (libRow: LibraryRow) => {
    const newRow: Row = {
      id: uuid(),
      label: libRow.label,
      stitches: libRow.stitches,
      ...(libRow.segments ? { segments: libRow.segments } : {}),
    }
    setRows(rs => [...rs, newRow])
    setFocusedRowIdx(rows.length)
    setShowRowPicker(false)
  }

  const relabelDefaults = (list: Row[]): Row[] =>
    list.map((r, i) => {
      const looksDefault = matchesNumberedTemplate('libraryCreate.rowDefaultLabel', r.label)
      return looksDefault ? { ...r, label: t('libraryCreate.rowDefaultLabel', { n: i + 1 }) } : r
    })

  const removeRow = (idx: number) => {
    setRows(rs => relabelDefaults(rs.filter((_, i) => i !== idx)))
    if (focusedRowIdx === idx) setFocusedRowIdx(null)
    else if (focusedRowIdx != null && focusedRowIdx > idx) setFocusedRowIdx(focusedRowIdx - 1)
  }

  const handleDragEnd = ({ data }: { data: Row[] }) => {
    const focusedId = focusedRowIdx != null ? rows[focusedRowIdx]?.id : null
    const next = relabelDefaults(data)
    setRows(next)
    if (focusedId) {
      const newIdx = next.findIndex(r => r.id === focusedId)
      setFocusedRowIdx(newIdx >= 0 ? newIdx : null)
    }
  }

  const handlePickerSelect = (stitch: StitchDef) => {
    addStitchToFocused(stitch.id)
    setShowStitchPicker(false)
  }

  const handleSave = () => {
    if (!ready) return
    const filledRowsOnly = rows.filter(r => r.stitches.length > 0)
    if (isEditing && initialSequence) {
      const updated: LibrarySequence = {
        id: initialSequence.id,
        name: name.trim(),
        craft,
        rows: filledRowsOnly,
        totalRepeats: initialSequence.totalRepeats,
        loop: initialSequence.loop,
        isBuiltIn: false,
      }
      updateSequence(updated)
    } else {
      const seq: LibrarySequence = {
        id: uuid(),
        name: name.trim(),
        craft,
        rows: filledRowsOnly,
        totalRepeats: 1,
        loop: false,
        isBuiltIn: false,
      }
      addSequence(seq)
    }
    onClose()
  }

  const stitchChipColor = (id: string) => stitchHue(colors, id)

  // 2×2 swatch glyphs for the preview — sample across first two rows
  const swatchStitches: (StitchInstance | null)[] = (() => {
    const cells: (StitchInstance | null)[] = []
    for (const r of rows) {
      cells.push(r.stitches[0] ?? null, r.stitches[1] ?? null)
      if (cells.length >= 4) break
    }
    while (cells.length < 4) cells.push(null)
    return cells
  })()

  const focusedRow = focusedRowIdx != null ? rows[focusedRowIdx] : null
  const dockVisible = focusedRow !== null && !showStitchPicker && !showRowPicker
  const focusedRowLabel = focusedRow?.label ?? ''

  const rowRailStyle = {
    paddingLeft: 10, marginLeft: 6,
    borderLeftWidth: 2, borderLeftColor: colors.cream2,
  } as const

  const listHeader = (
    <>
      {/* Live preview */}
      <View style={[styles.previewCard, {
        backgroundColor: colors.card,
        borderColor: colors.brick,
        shadowColor: colors.brick,
        flexDirection: 'row', gap: 12, alignItems: 'center',
      }]}>
        <View style={{
          width: 52, height: 52, borderRadius: 12,
          backgroundColor: colors.forest, padding: 6,
          flexDirection: 'row', flexWrap: 'wrap',
          flexShrink: 0,
        }}>
          {swatchStitches.map((si, i) => {
            const def = si ? stitchMap[si.stitchId] : undefined
            return (
              <View key={i} style={{ width: '50%', height: '50%', alignItems: 'center', justifyContent: 'center' }}>
                {def ? (
                  <StitchGlyph symbol={def.symbol} color="#FBF6EC" size={14} strokeWidth={1.8}/>
                ) : null}
              </View>
            )
          })}
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{
            fontFamily: fonts.mono, fontSize: 10, color: colors.inkMute,
            letterSpacing: 1.8, textTransform: 'uppercase',
          }}>{t('libraryCreate.livePreview')}</Text>
          <Text style={{
            fontFamily: fonts.bodyBd, fontSize: 15.5, marginTop: 3,
            color: name ? colors.ink : colors.inkMute,
            letterSpacing: -0.05, fontStyle: name ? 'normal' : 'italic',
          }} numberOfLines={1}>
            {name || t('libraryCreate.untitledSeq')}
          </Text>
          <Text style={{
            fontFamily: fonts.mono, fontSize: 11, color: colors.inkMute, marginTop: 3,
          }}>
            {t('common.rows', { count: filledRows })} · {t('common.sts', { count: totalSts })}
          </Text>
        </View>
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
          placeholder={t('libraryCreate.namePlaceholderSeq')}
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

      {/* Rows list */}
      <FormLabel hint={t('common.rows', { count: rows.length })}>{t('libraryCreate.rowsLabel')}</FormLabel>
    </>
  )

  const listFooter = (
    <>
      {/* New row / Row from lib chooser */}
      <View style={rowRailStyle}>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 2 }}>
          <Pressable
            onPress={addRow}
            style={{
              flex: 1.1, borderWidth: 1.5, borderStyle: 'dashed',
              borderColor: colors.brick, borderRadius: 14, paddingVertical: 12,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <Icon name="plus" size={14} color={colors.brick}/>
            <Text style={{ fontFamily: fonts.bodySb, fontSize: 13, color: colors.brick }}>
              {t('wizard.step3NewRow')}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setShowRowPicker(true)}
            style={{
              flex: 1, borderWidth: 1, borderColor: colors.rule,
              backgroundColor: colors.card, borderRadius: 14, paddingVertical: 12,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <Icon name="library" size={14} color={colors.mustardDk}/>
            <Text style={{ fontFamily: fonts.bodySb, fontSize: 13, color: colors.ink }}>
              {t('wizard.step3RowFromLib')}
            </Text>
            <View style={{
              backgroundColor: colors.cream2, borderRadius: 6,
              paddingHorizontal: 6, paddingVertical: 1,
            }}>
              <Text style={{
                fontFamily: fonts.mono, fontSize: 10, color: colors.inkMute,
                fontWeight: '700', letterSpacing: 0.5,
              }}>{libraryRows.length}</Text>
            </View>
          </Pressable>
        </View>
      </View>

      {/* Tip */}
      <View style={{
        marginTop: 16, paddingVertical: 10, paddingHorizontal: 12,
        backgroundColor: colors.cream2, borderRadius: 12,
        flexDirection: 'row', gap: 8, alignItems: 'flex-start',
      }}>
        <Icon name="bulb" size={14} color={colors.mustardDk}/>
        <Text style={{
          fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft,
          flex: 1, lineHeight: 18,
        }}>
          <Text style={{ fontWeight: '700', color: colors.ink }}>{t('common.tip')} </Text>
          {t('libraryCreate.tipRows')}
        </Text>
      </View>
    </>
  )

  const renderRow = ({ item: r, drag, isActive, getIndex }: any) => {
    const ri: number = getIndex?.() ?? 0
    const sts = totalStitches(r.stitches)
    const empty = sts === 0
    const isFocused = focusedRowIdx === ri
    const ids = expandStitches(r.stitches)
    const highlighted = isFocused || isActive
    return (
      <ScaleDecorator>
        <View style={[rowRailStyle, { paddingBottom: 8 }]}>
          <Pressable
            onPress={() => setFocusedRowIdx(ri)}
            style={{
              backgroundColor: colors.card,
              borderWidth: highlighted ? 2 : 1,
              borderColor: highlighted ? colors.brick : colors.rule,
              borderRadius: 14, padding: 12,
              ...(highlighted ? {
                shadowColor: colors.brick,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.07,
                shadowRadius: 6, elevation: 2,
              } : {}),
            }}
          >
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: empty && !isFocused ? 0 : 10, gap: 8,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                <Pressable onLongPress={drag} delayLongPress={180} hitSlop={10}>
                  <Icon name="grip" size={14} color={colors.inkMute}/>
                </Pressable>
                <Text style={{
                  fontFamily: fonts.bodySb, fontSize: 13,
                  color: isFocused ? colors.brick : colors.ink,
                }}>
                  {r.label}{isFocused ? ' ✱' : ''}
                </Text>
                <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.inkMute }}>
                  · {t('common.sts', { count: sts })}
                </Text>
              </View>
              <Pressable onPress={() => removeRow(ri)} hitSlop={8}>
                <Icon name="trash" size={14} color={colors.inkMute}/>
              </Pressable>
            </View>
            {!empty ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 3 }}>
                {ids.slice(0, 14).map((id, i) => {
                  const def = stitchMap[id]
                  if (!def) return null
                  const c = stitchChipColor(id)
                  return (
                    <View key={i} style={{
                      width: 26, height: 34, borderRadius: 6,
                      backgroundColor: colors.cream2,
                      borderWidth: 1.2, borderColor: c,
                      alignItems: 'center', justifyContent: 'center', gap: 1,
                      paddingVertical: 2,
                    }}>
                      <StitchGlyph symbol={def.symbol} color={c} size={13} strokeWidth={1.8}/>
                      <Text style={{
                        fontFamily: fonts.mono, fontSize: 7.5, color: c,
                        fontWeight: '700', lineHeight: 9,
                      }}>{def.abbr}</Text>
                    </View>
                  )
                })}
                {ids.length > 14 && (
                  <Text style={{
                    fontFamily: fonts.mono, fontSize: 10, color: colors.inkMute,
                    alignSelf: 'center', marginLeft: 4,
                  }}>+{ids.length - 14}</Text>
                )}
              </View>
            ) : (
              <Text style={{
                fontFamily: fonts.mono, fontSize: 11, color: colors.inkMute,
                fontStyle: 'italic', paddingTop: 6, paddingBottom: 2,
              }}>
                {t('wizard.step3EmptyRow')}
              </Text>
            )}
            {isFocused && !empty && (
              <View style={{ marginTop: 10 }}>
                <Pressable
                  onPress={undoLastInFocused}
                  style={{
                    alignSelf: 'flex-start',
                    flexDirection: 'row', alignItems: 'center', gap: 6,
                    paddingVertical: 6, paddingHorizontal: 10,
                    backgroundColor: colors.bg,
                    borderWidth: 1, borderColor: colors.rule, borderRadius: 9,
                  }}
                >
                  <Icon name="backspace" size={12} color={colors.inkSoft}/>
                  <Text style={{ fontFamily: fonts.bodySb, fontSize: 11.5, color: colors.inkSoft }}>
                    {t('libraryCreate.undoLast')}
                  </Text>
                </Pressable>
              </View>
            )}
          </Pressable>
        </View>
      </ScaleDecorator>
    )
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
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
                }}>{isEditing ? t('libraryCreate.editSeqBadge') : t('libraryCreate.draftSeq')}</Text>
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
              }}>{isEditing ? t('libraryCreate.editSeqTitle') : t('libraryCreate.newSeqTitle')}</Text>
              <Text style={{
                fontFamily: fonts.body, fontSize: 13.5, color: colors.inkSoft,
                lineHeight: 20, marginTop: 6,
              }}>{isEditing ? t('libraryCreate.editSeqSub') : t('libraryCreate.newSeqSub')}</Text>
            </View>

            <DraggableFlatList
              data={rows}
              keyExtractor={(r: Row) => r.id}
              renderItem={renderRow}
              onDragEnd={handleDragEnd}
              activationDistance={8}
              containerStyle={{ flex: 1 }}
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: dockVisible ? 200 : 40 }}
              keyboardShouldPersistTaps="handled"
              ListHeaderComponent={listHeader}
              ListFooterComponent={listFooter}
            />

            {/* Stitch dock — targets the focused row */}
            {dockVisible && focusedRow && (
              <View style={[styles.dock, { backgroundColor: colors.bg, borderTopColor: colors.rule }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text
                    style={{
                      flex: 1,
                      fontFamily: fonts.mono, fontSize: 10, color: colors.brick,
                      fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase',
                    }}
                    numberOfLines={1}
                  >
                    {t('libraryCreate.tapToAddTarget', { target: focusedRowLabel })}
                  </Text>
                  <Pressable onPress={() => setShowStitchPicker(true)} hitSlop={6} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
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
                        onPress={() => addStitchToFocused(s.id)}
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

          </View>
        </View>
      </GestureHandlerRootView>

      <StitchPickerModal
        visible={showStitchPicker}
        onClose={() => setShowStitchPicker(false)}
        onSelect={handlePickerSelect}
        onDefineCustom={() => { setShowStitchPicker(false); setShowDefineCustom(true) }}
        craftFilter={craft}
      />

      <RowPickerModal
        visible={showRowPicker}
        onClose={() => setShowRowPicker(false)}
        onSelect={addRowFromLib}
        onBuildNew={() => { setShowRowPicker(false); addRow() }}
        craftFilter={craft}
      />

      <DefineCustomStitchScreen
        visible={showDefineCustom}
        onClose={() => setShowDefineCustom(false)}
        onSaved={(id) => { setShowDefineCustom(false); addStitchToFocused(id) }}
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
