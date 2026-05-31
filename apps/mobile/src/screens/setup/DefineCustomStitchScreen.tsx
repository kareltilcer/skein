import React, { useState } from 'react'
import {
  Modal, View, Text, Pressable, ScrollView, TextInput, StyleSheet,
} from 'react-native'
import { BlurView } from 'expo-blur'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../../theme/ThemeContext'
import { useCustomStitchStore } from '../../store/customStitchStore'
import StitchGlyph from '../../components/StitchGlyph'
import Icon from '../../components/ui/Icon'
import Btn from '../../components/ui/Btn'
import type { Craft, TileColorKey, CountsAs } from '../../types'

const SYMBOLS = [
  'vline','vline2','vlineX','dash','vee','vee2','triUp',
  'plus','dot','ring','ringBig','oval','cross','slashR','slashL',
  'cableL','cableR','tee','teeBar','teeBar2','fan','flower',
]

const TILE_COLOR_KEYS: { key: TileColorKey; labelKey: string }[] = [
  { key: 'brick',     labelKey: 'customStitch.tileColorBrick'   },
  { key: 'mustard',   labelKey: 'customStitch.tileColorMustard' },
  { key: 'forest',    labelKey: 'customStitch.tileColorForest'  },
  { key: 'brickDk',   labelKey: 'customStitch.tileColorBrickDk' },
  { key: 'mustardDk', labelKey: 'customStitch.tileColorMustardDk' },
  { key: 'forestDk',  labelKey: 'customStitch.tileColorForestDk' },
]

const GROUP_KEYS: { groupId: string; labelKey: string }[] = [
  { groupId: 'Basics',           labelKey: 'customStitch.groupBasics'    },
  { groupId: 'Increases',        labelKey: 'customStitch.groupIncreases' },
  { groupId: 'Decreases',        labelKey: 'customStitch.groupDecreases' },
  { groupId: 'Cables & texture', labelKey: 'customStitch.groupCables'    },
  { groupId: 'My customs ★',     labelKey: 'customStitch.groupMyCustoms' },
]

type Props = {
  visible: boolean
  onClose: () => void
  /** Called when the stitch is saved. Returns the new stitch ID. */
  onSaved: (id: string) => void
  defaultCraft?: Craft
}

export default function DefineCustomStitchScreen({ visible, onClose, onSaved, defaultCraft = 'knit' }: Props) {
  const { t } = useTranslation()
  const { theme, colors, fonts, radius } = useTheme()
  const { addCustomStitch } = useCustomStitchStore()

  const COUNTS_OPTIONS: { id: CountsAs; label: string; math: string }[] = [
    { id: 'inc', label: t('customStitch.countsInc'), math: t('customStitch.countsIncMath') },
    { id: 'one', label: t('customStitch.countsOne'), math: t('customStitch.countsOneMath') },
    { id: 'dec', label: t('customStitch.countsDec'), math: t('customStitch.countsDecMath') },
  ]

  const [abbr,     setAbbr]     = useState('')
  const [name,     setName]     = useState('')
  const [craft,    setCraft]    = useState<Craft>(defaultCraft)
  const [symbol,   setSymbol]   = useState('vline')
  const [tileKey,  setTileKey]  = useState<TileColorKey>('brick')
  const [countsAs, setCountsAs] = useState<CountsAs>('one')
  const [notation, setNotation] = useState('')
  const [group,    setGroup]    = useState('My customs ★')

  const tileColor = colors[tileKey]
  const ready = abbr.trim().length > 0 && name.trim().length > 0

  const handleSave = () => {
    if (!ready) return
    const id = addCustomStitch({
      abbr: abbr.trim(),
      name: name.trim(),
      type: craft,
      symbol,
      tileColorKey: tileKey,
      countsAs,
      notation: notation.trim() || undefined,
      group,
    })
    onSaved(id)
    // Reset form for next use
    setAbbr(''); setName(''); setSymbol('vline'); setTileKey('brick')
    setCountsAs('one'); setNotation(''); setCraft(defaultCraft); setGroup('My customs ★')
  }

  const handleClose = () => {
    onClose()
    setAbbr(''); setName(''); setSymbol('vline'); setTileKey('brick')
    setCountsAs('one'); setNotation(''); setCraft(defaultCraft); setGroup('My customs ★')
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
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

            {/* ─── Top bar ─────────────────────────────────────── */}
            <View style={[styles.topBar, { borderBottomColor: colors.rule }]}>
              <Pressable onPress={handleClose} hitSlop={12} style={[styles.closeBtn, {
                backgroundColor: colors.card, borderColor: colors.rule,
              }]}>
                <Icon name="x" size={18} color={colors.inkSoft}/>
              </Pressable>

              <View style={[styles.draftBadge, { backgroundColor: colors.cream2, borderColor: colors.rule }]}>
                <Text style={{
                  fontFamily: fonts.mono, fontSize: 9.5, color: colors.inkMute,
                  letterSpacing: 2, textTransform: 'uppercase',
                }}>{t('customStitch.draft')}</Text>
              </View>

              <Pressable onPress={ready ? handleSave : undefined} hitSlop={12}>
                <Text style={{
                  fontFamily: fonts.bodySb, fontSize: 14, letterSpacing: -0.1,
                  color: ready ? colors.brick : colors.inkMute,
                }}>{t('common.save')}</Text>
              </Pressable>
            </View>

            {/* ─── Page title ──────────────────────────────────── */}
            <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 6 }}>
              <Text style={{
                fontFamily: fonts.display, fontSize: 32, color: colors.brick,
                letterSpacing: -0.5, lineHeight: 36,
              }}>{t('customStitch.title')}</Text>
              <Text style={{
                fontFamily: fonts.body, fontSize: 13.5, color: colors.inkSoft,
                lineHeight: 20, marginTop: 6,
              }}>
                {t('customStitch.blurb')}
              </Text>
            </View>

            {/* ─── Scrollable form ─────────────────────────────── */}
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 120 }}
              keyboardShouldPersistTaps="handled"
            >

              {/* Live preview card */}
              <View style={[styles.previewCard, {
                backgroundColor: colors.card,
                borderColor: colors.brick,
                shadowColor: colors.brick,
              }]}>
                <View style={[styles.previewTile, {
                  backgroundColor: tileColor,
                  borderRadius: radius.lg,
                  shadowColor: tileColor,
                }]}>
                  <StitchGlyph symbol={symbol} size={48} color="#FBF6EC" strokeWidth={2.4}/>
                  <Text style={{
                    fontFamily: fonts.mono, fontSize: 11, color: '#FBF6EC',
                    fontWeight: '700', letterSpacing: 1,
                  }}>{abbr || '—'}</Text>
                  <View style={[styles.newBadge, { backgroundColor: colors.mustard, borderColor: colors.card }]}>
                    <Text style={{
                      fontFamily: fonts.mono, fontSize: 9, color: colors.ink,
                      fontWeight: '700', letterSpacing: 1.2,
                    }}>{t('customStitch.newBadge')}</Text>
                  </View>
                </View>

                <View style={{ flex: 1, minWidth: 0, gap: 6, justifyContent: 'center' }}>
                  <Text style={{
                    fontFamily: fonts.mono, fontSize: 10, color: colors.inkMute,
                    letterSpacing: 1.8, textTransform: 'uppercase',
                  }}>{t('customStitch.livePreview')}</Text>
                  <Text style={{
                    fontFamily: fonts.display, fontSize: 22, color: name ? colors.ink : colors.inkMute,
                    letterSpacing: -0.25, lineHeight: 26,
                    fontStyle: name ? 'normal' : 'italic',
                  }} numberOfLines={2}>
                    {name || t('customStitch.untitledStitch')}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
                    <View style={[styles.previewChip, { backgroundColor: colors.cream2 }]}>
                      <Text style={{ fontFamily: fonts.mono, fontSize: 10.5, color: colors.brick, fontWeight: '700' }}>
                        {abbr || '—'}
                      </Text>
                    </View>
                    <View style={[styles.previewChip, { backgroundColor: colors.cream2 }]}>
                      <Text style={{ fontFamily: fonts.mono, fontSize: 10.5, color: colors.inkSoft }}>
                        {craft}
                      </Text>
                    </View>
                    <View style={[styles.previewChip, { backgroundColor: colors.cream2 }]}>
                      <Text style={{ fontFamily: fonts.mono, fontSize: 10.5, color: colors.inkSoft }}>
                        {countsAs === 'inc' ? '+1 st' : countsAs === 'dec' ? '−1 st' : '1 → 1'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* ─── Abbreviation & Name ── */}
              <FormLabel colors={colors} fonts={fonts} hint={t('customStitch.abbrHint')}>
                {t('customStitch.abbreviationAndName')}
              </FormLabel>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 22 }}>
                <View style={{ width: 100 }}>
                  <View style={[styles.field, {
                    backgroundColor: colors.card,
                    borderColor: abbr ? colors.brick : colors.rule,
                    borderWidth: abbr ? 1.5 : 1,
                    borderRadius: radius.md,
                    alignItems: 'center',
                  }]}>
                    <TextInput
                      value={abbr}
                      onChangeText={setAbbr}
                      maxLength={8}
                      placeholder={t('customStitch.abbrPlaceholder')}
                      placeholderTextColor={colors.inkMute}
                      autoCapitalize="none"
                      style={{
                        fontFamily: fonts.mono, fontSize: 16, fontWeight: '700',
                        color: colors.brick, textAlign: 'center',
                        letterSpacing: 1.2,
                      }}
                    />
                  </View>
                  <Text style={{
                    fontFamily: fonts.mono, fontSize: 10, color: colors.inkMute,
                    marginTop: 4, textAlign: 'center',
                  }}>{abbr.length}/8</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={[styles.field, {
                    backgroundColor: colors.card,
                    borderColor: colors.rule,
                    borderRadius: radius.md,
                  }]}>
                    <TextInput
                      value={name}
                      onChangeText={setName}
                      maxLength={36}
                      placeholder={t('customStitch.namePlaceholder')}
                      placeholderTextColor={colors.inkMute}
                      style={{
                        fontFamily: fonts.body, fontSize: 15, color: colors.ink,
                        letterSpacing: -0.25,
                      }}
                    />
                  </View>
                  <Text style={{
                    fontFamily: fonts.mono, fontSize: 10, color: colors.inkMute, marginTop: 4,
                  }}>{name.length}/36</Text>
                </View>
              </View>

              {/* ─── Craft ── */}
              <FormLabel colors={colors} fonts={fonts}>{t('customStitch.craft')}</FormLabel>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 22 }}>
                {([
                  { id: 'knit' as Craft, label: t('craft.knit'), icon: 'needle' as const },
                  { id: 'crochet' as Craft, label: t('craft.crochet'), icon: 'loop' as const },
                ]).map((c) => {
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
                        letterSpacing: -0.25,
                      }}>{c.label}</Text>
                    </Pressable>
                  )
                })}
              </View>

              {/* ─── Chart symbol ── */}
              <FormLabel colors={colors} fonts={fonts} hint={t('customStitch.marksCount', { count: SYMBOLS.length })}>
                {t('customStitch.chartSymbol')}
              </FormLabel>
              <View style={[styles.symbolGrid, {
                backgroundColor: colors.cream2,
                borderColor: colors.rule,
                borderRadius: radius.md,
                marginBottom: 22,
              }]}>
                {SYMBOLS.map((sym) => {
                  const active = symbol === sym
                  return (
                    <Pressable
                      key={sym}
                      onPress={() => setSymbol(sym)}
                      style={[styles.symbolBtn, {
                        backgroundColor: active ? tileColor : colors.card,
                        borderColor: active ? 'transparent' : colors.rule,
                        borderRadius: 10,
                        shadowColor: active ? tileColor : 'transparent',
                        shadowOpacity: active ? 0.4 : 0,
                        shadowRadius: active ? 6 : 0,
                        shadowOffset: { width: 0, height: 3 },
                        elevation: active ? 3 : 0,
                      }]}
                    >
                      <StitchGlyph
                        symbol={sym}
                        color={active ? '#FBF6EC' : colors.inkSoft}
                        size={22}
                        strokeWidth={2.2}
                      />
                    </Pressable>
                  )
                })}
              </View>

              {/* ─── Tile color ── */}
              <FormLabel colors={colors} fonts={fonts} hint={t('customStitch.tileColorHint')}>
                {t('customStitch.tileColor')}
              </FormLabel>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 22 }}>
                {TILE_COLOR_KEYS.map((tc) => {
                  const active = tileKey === tc.key
                  const c = colors[tc.key]
                  return (
                    <Pressable
                      key={tc.key}
                      onPress={() => setTileKey(tc.key)}
                      style={{ alignItems: 'center', gap: 4 }}
                    >
                      <View style={[styles.colorSwatch, {
                        backgroundColor: c,
                        shadowColor: active ? colors.ink : 'transparent',
                        shadowOpacity: active ? 0.6 : 0,
                        shadowRadius: active ? 0 : 0,
                        shadowOffset: { width: 0, height: 0 },
                        // ring effect
                        borderWidth: active ? 3 : 0,
                        borderColor: active ? colors.bg : 'transparent',
                        // outer ring via outline-style elevation trick
                        ...(active ? {
                          shadowColor: colors.ink,
                          shadowOpacity: 0.8,
                          shadowRadius: 0,
                          shadowOffset: { width: 0, height: 0 },
                          elevation: 5,
                        } : {}),
                      }]}/>
                      <Text style={{
                        fontFamily: fonts.mono, fontSize: 9.5,
                        color: active ? colors.ink : colors.inkMute,
                        fontWeight: active ? '700' : '500',
                        letterSpacing: 0.8, textTransform: 'lowercase',
                      }}>{t(tc.labelKey)}</Text>
                    </Pressable>
                  )
                })}
              </View>

              {/* ─── Counts as ── */}
              <FormLabel colors={colors} fonts={fonts} hint={t('customStitch.countsAsHint')}>
                {t('customStitch.countsAs')}
              </FormLabel>
              <View style={[styles.countsGrid, {
                backgroundColor: colors.cream2,
                borderRadius: radius.md,
                marginBottom: 22,
              }]}>
                {COUNTS_OPTIONS.map((o) => {
                  const active = countsAs === o.id
                  return (
                    <Pressable
                      key={o.id}
                      onPress={() => setCountsAs(o.id)}
                      style={[styles.countsBtn, {
                        flex: 1,
                        backgroundColor: active ? colors.card : 'transparent',
                        borderRadius: 9,
                        shadowColor: '#000',
                        shadowOpacity: active ? 0.07 : 0,
                        shadowRadius: active ? 3 : 0,
                        shadowOffset: { width: 0, height: 1 },
                        elevation: active ? 1 : 0,
                      }]}
                    >
                      <Text style={{
                        fontFamily: fonts.bodySb, fontSize: 13,
                        color: active ? colors.brick : colors.inkSoft,
                        letterSpacing: -0.25,
                      }}>{o.label}</Text>
                      <Text style={{
                        fontFamily: fonts.mono, fontSize: 10,
                        color: active ? colors.inkSoft : colors.inkMute,
                        letterSpacing: 0.5,
                      }}>{o.math}</Text>
                    </Pressable>
                  )
                })}
              </View>

              {/* ─── How to work it (notation) ── */}
              <FormLabel colors={colors} fonts={fonts} hint={t('customStitch.howToWorkHint')}>
                {t('customStitch.howToWork')}
              </FormLabel>
              <View style={[styles.field, styles.notationField, {
                backgroundColor: colors.card,
                borderColor: colors.rule,
                borderRadius: radius.md,
                marginBottom: 4,
              }]}>
                <TextInput
                  value={notation}
                  onChangeText={setNotation}
                  maxLength={240}
                  placeholder={t('customStitch.notationPlaceholder')}
                  placeholderTextColor={colors.inkMute}
                  multiline
                  style={{
                    fontFamily: fonts.body, fontSize: 13.5, color: colors.ink,
                    lineHeight: 20,
                  }}
                />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 22 }}>
                <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.inkMute }}>
                  {t('customStitch.markdownNote')}
                </Text>
                <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.inkMute }}>
                  {notation.length}/240
                </Text>
              </View>

              {/* ─── File under (group) ── */}
              <FormLabel colors={colors} fonts={fonts} hint={t('customStitch.fileUnderHint')}>{t('customStitch.fileUnder')}</FormLabel>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 28 }}>
                {GROUP_KEYS.map((g) => {
                  const active = group === g.groupId
                  return (
                    <Pressable
                      key={g.groupId}
                      onPress={() => setGroup(g.groupId)}
                      style={[styles.groupChip, {
                        backgroundColor: active ? colors.mustard : colors.card,
                        borderColor: active ? 'transparent' : colors.rule,
                        borderRadius: radius.full,
                      }]}
                    >
                      <Text style={{
                        fontFamily: fonts.bodySb, fontSize: 12.5,
                        color: active ? colors.ink : colors.inkSoft,
                      }}>{t(g.labelKey)}</Text>
                    </Pressable>
                  )
                })}
              </View>

              {/* Sign-off */}
              <Text style={{
                textAlign: 'center', fontFamily: fonts.mono, fontSize: 10,
                color: colors.inkMute, letterSpacing: 2.5, textTransform: 'uppercase',
                marginBottom: 8,
              }}>{t('customStitch.signoff')}</Text>

            </ScrollView>

            {/* ─── Footer save bar ─────────────────────────────── */}
            <View style={[styles.footer, { borderTopColor: colors.rule, backgroundColor: colors.bg }]}>
              <Btn variant="ghost" size="lg" onPress={handleClose}>{t('common.cancel')}</Btn>
              <View style={{ flex: 1 }}>
                {ready ? (
                  <Btn variant="primary" size="lg" icon="save" full onPress={handleSave}>
                    {t('customStitch.saveStitch')}
                  </Btn>
                ) : (
                  <View style={[styles.disabledSaveBtn, {
                    backgroundColor: theme === 'dark' ? 'rgba(255,122,77,0.14)' : '#E8D6CF',
                    borderColor: colors.brick,
                    borderRadius: radius.md,
                  }]}>
                    <Icon name="save" size={18} color={colors.brick}/>
                    <Text style={{
                      fontFamily: fonts.bodySb, fontSize: 16, color: colors.brick,
                      letterSpacing: -0.25,
                    }}>{t('customStitch.nameAbbrFirst')}</Text>
                  </View>
                )}
              </View>
            </View>

          </View>
        </View>
      </View>
    </Modal>
  )
}

/** Small inline label + optional right-side hint */
function FormLabel({
  children, hint, colors, fonts,
}: {
  children: React.ReactNode
  hint?: string
  colors: ReturnType<typeof useTheme>['colors']
  fonts: ReturnType<typeof useTheme>['fonts']
}) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'baseline',
      justifyContent: 'space-between', marginBottom: 8,
    }}>
      <Text style={{
        fontFamily: fonts.mono, fontSize: 10.5, color: colors.inkMute,
        letterSpacing: 1.8, textTransform: 'uppercase',
      }}>{children}</Text>
      {hint ? (
        <Text style={{
          fontFamily: fonts.mono, fontSize: 10, color: colors.inkMute, letterSpacing: 0.5,
        }}>{hint}</Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  screen:        { flex: 1, marginTop: 60, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 10,
    borderBottomWidth: 1,
  },
  closeBtn:    { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  draftBadge:  { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 99, borderWidth: 1 },
  previewCard: {
    flexDirection: 'row', gap: 14, alignItems: 'stretch',
    borderRadius: 18, padding: 14, borderWidth: 1.5, marginBottom: 22,
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 18, elevation: 4,
  },
  previewTile: {
    width: 96, height: 110, flexShrink: 0,
    flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
    position: 'relative',
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 4,
  },
  newBadge: {
    position: 'absolute', top: -7, right: -7,
    paddingHorizontal: 6, paddingVertical: 3, borderRadius: 5,
    borderWidth: 1,
  },
  previewChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  field: { borderWidth: 1, paddingVertical: 12, paddingHorizontal: 14 },
  notationField: { minHeight: 84 },
  craftBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 14, borderWidth: 1 },
  symbolGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 8, gap: 6, borderWidth: 1 },
  symbolBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  colorSwatch: { width: 44, height: 44, borderRadius: 12 },
  countsGrid: { flexDirection: 'row', padding: 4, gap: 0 },
  countsBtn: { alignItems: 'center', justifyContent: 'center', gap: 2, paddingVertical: 10, paddingHorizontal: 6 },
  groupChip: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7 },
  footer: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 32,
    borderTopWidth: 1,
  },
  disabledSaveBtn: {
    flex: 1, height: 58,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderStyle: 'dashed',
  },
})
