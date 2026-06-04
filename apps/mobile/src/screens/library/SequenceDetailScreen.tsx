import React, { useState } from 'react'
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../../theme/ThemeContext'
import { useLibraryStore } from '../../store/libraryStore'
import { useStitchMap } from '../../hooks/useStitchMap'
import Screen from '../../components/ui/Screen'
import Icon from '../../components/ui/Icon'
import StitchGlyph from '../../components/StitchGlyph'
import LibraryItemMenu from '../../components/library/LibraryItemMenu'
import ConfirmDeleteDialog from '../../components/library/ConfirmDeleteDialog'
import NewSequenceScreen from './NewSequenceScreen'
import { stitchHue } from '../../components/RepeatRow/stitchHue'

type Props = { id: string }

export default function SequenceDetailScreen({ id }: Props) {
  const router = useRouter()
  const { t } = useTranslation()
  const { colors, fonts, radius, spacing } = useTheme()
  const stitchMap = useStitchMap()
  const sequence = useLibraryStore(s => s.sequences.find(x => x.id === id))
  const deleteSequence = useLibraryStore(s => s.deleteSequence)

  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!sequence) {
    return (
      <Screen>
        <View style={styles.missing}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.rule }]}>
            <Icon name="back" size={18} color={colors.inkSoft}/>
          </Pressable>
          <Text style={{ fontFamily: fonts.body, color: colors.inkMute, marginTop: 24 }}>
            {t('library.notFound')}
          </Text>
        </View>
      </Screen>
    )
  }

  const totalStitches = sequence.rows.reduce(
    (sum, r) => sum + r.stitches.reduce((s, inst) => s + inst.count, 0),
    0,
  )

  const swatchSamples: { stitchId: string }[] = []
  for (const r of sequence.rows) {
    for (const s of r.stitches) {
      if (swatchSamples.length >= 4) break
      swatchSamples.push({ stitchId: s.stitchId })
    }
    if (swatchSamples.length >= 4) break
  }
  while (swatchSamples.length < 4) swatchSamples.push({ stitchId: swatchSamples[0]?.stitchId ?? 'k' })

  const onConfirmDelete = () => {
    deleteSequence(sequence.id)
    setConfirmDelete(false)
    router.back()
  }

  return (
    <Screen>
      {/* Top bar */}
      <View style={[styles.topBar, { paddingHorizontal: spacing[5] }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.rule }]}>
          <Icon name="back" size={18} color={colors.inkSoft}/>
        </Pressable>
        <Text style={{
          fontFamily: fonts.mono, fontSize: 10, color: colors.inkMute,
          letterSpacing: 2, textTransform: 'uppercase',
        }}>
          {t('library.detailTitleSequence')}
        </Text>
        <LibraryItemMenu
          label={t('library.kindSequence')}
          onEdit={() => setEditing(true)}
          onDelete={() => setConfirmDelete(true)}
        />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: spacing[5], paddingTop: 8, paddingBottom: 140 }}
      >
        {/* Hero */}
        <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.rule, borderRadius: radius.lg }]}>
          <View style={[styles.swatch, { backgroundColor: colors.brick }]}>
            {swatchSamples.map((s, i) => {
              const def = stitchMap[s.stitchId]
              return (
                <View key={i} style={styles.swatchCell}>
                  {def ? <StitchGlyph symbol={def.symbol} color="#FBF6EC" size={16} strokeWidth={1.8}/> : null}
                </View>
              )
            })}
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{
              fontFamily: fonts.display, fontSize: 27, color: colors.brick,
              letterSpacing: -0.3, lineHeight: 29,
            }} numberOfLines={2}>
              {sequence.name}
            </Text>
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
              <Chip icon={sequence.craft === 'knit' ? 'needle' : 'loop'}>{t(`craft.${sequence.craft}`)}</Chip>
              <Chip>{t('common.rows', { count: sequence.rows.length })}</Chip>
              <Chip>{t('common.sts', { count: totalStitches })}</Chip>
            </View>
          </View>
        </View>

        {/* Rows */}
        <View style={{ marginTop: 22, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <Text style={{
            fontFamily: fonts.mono, fontSize: 10.5, color: colors.inkMute,
            letterSpacing: 1.8, textTransform: 'uppercase',
          }}>
            {t('library.theRowsLabel')}
          </Text>
        </View>

        <View style={{ marginTop: 10, gap: 8, paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: colors.cream2, marginLeft: 4 }}>
          {sequence.rows.map((row, idx) => {
            const rowStitchCount = row.stitches.reduce((sum, s) => sum + s.count, 0)
            return (
              <View key={row.id ?? idx} style={[styles.rowCard, { backgroundColor: colors.card, borderColor: colors.rule, borderRadius: radius.md }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                    <Text style={{ fontFamily: fonts.bodySb, fontSize: 13.5, color: colors.ink }}>
                      {t('library.rowN', { n: idx + 1 })}
                    </Text>
                    <Text style={{ fontFamily: fonts.body, fontSize: 12.5, color: colors.inkSoft }} numberOfLines={1}>
                      {row.label}
                    </Text>
                  </View>
                  <Text style={{ fontFamily: fonts.mono, fontSize: 10.5, color: colors.inkMute }}>
                    {t('common.sts', { count: rowStitchCount })}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                  {row.stitches.map((inst, i) => {
                    const def = stitchMap[inst.stitchId]
                    if (!def) return null
                    const c = stitchHue(colors, inst.stitchId)
                    return (
                      <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={{
                          width: 30, height: 38, borderRadius: 7,
                          backgroundColor: colors.cream2,
                          borderWidth: 1.4, borderColor: c,
                          alignItems: 'center', justifyContent: 'center', gap: 1,
                        }}>
                          <StitchGlyph symbol={def.symbol} color={c} size={15} strokeWidth={2}/>
                          <Text style={{ fontFamily: fonts.mono, fontSize: 7.5, color: c, fontWeight: '700', lineHeight: 9 }}>
                            {def.abbr}
                          </Text>
                        </View>
                        {inst.count > 1 && (
                          <Text style={{ fontFamily: fonts.mono, fontSize: 13, color: colors.inkSoft }}>
                            × {inst.count}
                          </Text>
                        )}
                      </View>
                    )
                  })}
                </View>
              </View>
            )
          })}
        </View>
      </ScrollView>

      {/* Footer — Edit CTA */}
      <View style={[styles.footer, { backgroundColor: colors.bg, borderTopColor: colors.rule, paddingHorizontal: spacing[5] }]}>
        <Pressable onPress={() => setEditing(true)} style={{ borderRadius: radius.md, overflow: 'hidden' }}>
          {({ pressed }) => (
            <LinearGradient
              colors={[colors.brick, colors.brickDk]}
              style={[styles.footerBtn, { opacity: pressed ? 0.85 : 1 }]}
            >
              <Icon name="edit" size={16} color="#FBF6EC"/>
              <Text style={{ fontFamily: fonts.bodySb, fontSize: 15, color: '#FBF6EC' }}>
                {t('library.editSequenceCta')}
              </Text>
            </LinearGradient>
          )}
        </Pressable>
      </View>

      <NewSequenceScreen
        visible={editing}
        onClose={() => setEditing(false)}
        defaultCraft={sequence.craft}
        initialSequence={sequence}
      />

      <ConfirmDeleteDialog
        visible={confirmDelete}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={onConfirmDelete}
        title={t('library.deleteSequenceTitle')}
        body={t('library.deleteSequenceBody')}
        confirmLabel={t('library.deleteSequenceConfirm')}
        itemName={sequence.name}
      />
    </Screen>
  )
}

function Chip({ children, icon }: { children: React.ReactNode; icon?: 'needle' | 'loop' }) {
  const { colors, fonts } = useTheme()
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 5,
      paddingHorizontal: 9, paddingVertical: 4,
      borderRadius: 7, backgroundColor: colors.cream2,
    }}>
      {icon && <Icon name={icon} size={12} color={colors.inkMute}/>}
      <Text style={{
        fontFamily: fonts.mono, fontSize: 11, color: colors.inkSoft,
        fontWeight: '700', letterSpacing: 0.4,
      }}>
        {children}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 8, paddingBottom: 6, minHeight: 44,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  heroCard: {
    borderWidth: 1, padding: 16,
    flexDirection: 'row', gap: 14, alignItems: 'center',
    marginTop: 8,
  },
  swatch: {
    width: 64, height: 64, borderRadius: 14,
    flexDirection: 'row', flexWrap: 'wrap',
    padding: 8, gap: 3,
  },
  swatchCell: { width: '46%', alignItems: 'center', justifyContent: 'center' },
  rowCard: { borderWidth: 1, padding: 12 },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopWidth: 1, paddingTop: 14, paddingBottom: 28,
  },
  footerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14,
  },
  missing: {
    flex: 1, alignItems: 'center', justifyContent: 'flex-start',
    padding: 20, paddingTop: 60,
  },
})
