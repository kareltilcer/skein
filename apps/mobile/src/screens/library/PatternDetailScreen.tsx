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
import NewPatternScreen from './NewPatternScreen'

type Props = { id: string }

export default function PatternDetailScreen({ id }: Props) {
  const router = useRouter()
  const { t } = useTranslation()
  const { colors, fonts, radius, spacing } = useTheme()
  const stitchMap = useStitchMap()
  const pattern = useLibraryStore(s => s.patterns.find(x => x.id === id))
  const sequences = useLibraryStore(s => s.sequences)
  const deletePattern = useLibraryStore(s => s.deletePattern)

  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!pattern) {
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

  const referencedSequences = pattern.sequenceIds
    .map(sid => sequences.find(s => s.id === sid))
    .filter((s): s is NonNullable<typeof s> => Boolean(s))

  const onConfirmDelete = () => {
    deletePattern(pattern.id)
    setConfirmDelete(false)
    router.back()
  }

  return (
    <Screen>
      <View style={[styles.topBar, { paddingHorizontal: spacing[5] }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.rule }]}>
          <Icon name="back" size={18} color={colors.inkSoft}/>
        </Pressable>
        <Text style={{
          fontFamily: fonts.mono, fontSize: 10, color: colors.inkMute,
          letterSpacing: 2, textTransform: 'uppercase',
        }}>
          {t('library.detailTitlePattern')}
        </Text>
        <LibraryItemMenu
          label={t('library.kindPattern')}
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
          <View style={[styles.heroIcon, { backgroundColor: colors.brick }]}>
            <Icon name="book" size={28} color="#FBF6EC"/>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{
              fontFamily: fonts.display, fontSize: 27, color: colors.brick,
              letterSpacing: -0.3, lineHeight: 29,
            }} numberOfLines={2}>
              {pattern.name}
            </Text>
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
              <Chip icon={pattern.craft === 'knit' ? 'needle' : 'loop'}>{t(`craft.${pattern.craft}`)}</Chip>
              <Chip>{t('common.sequences', { count: pattern.sequenceIds.length })}</Chip>
            </View>
          </View>
        </View>

        {/* Sequences list */}
        <View style={{ marginTop: 22, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <Text style={{
            fontFamily: fonts.mono, fontSize: 10.5, color: colors.inkMute,
            letterSpacing: 1.8, textTransform: 'uppercase',
          }}>
            {t('library.patternSequencesLabel')}
          </Text>
        </View>

        <View style={{ marginTop: 10, gap: 10 }}>
          {referencedSequences.length === 0 ? (
            <View style={{ paddingVertical: 30, alignItems: 'center' }}>
              <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkMute }}>
                {t('library.patternEmpty')}
              </Text>
            </View>
          ) : referencedSequences.map((seq) => {
            const previewStitches = seq.rows[0]?.stitches.slice(0, 4) ?? []
            return (
              <Pressable
                key={seq.id}
                onPress={() => router.push(`/library/sequence/${seq.id}`)}
                style={[styles.seqCard, { backgroundColor: colors.card, borderColor: colors.rule, borderRadius: radius.lg }]}
              >
                <View style={[styles.thumbBox, { backgroundColor: colors.cream2, borderRadius: radius.md }]}>
                  <View style={styles.thumbGlyphs}>
                    {previewStitches.map((si, i) => {
                      const def = stitchMap[si.stitchId]
                      if (!def) return null
                      return <StitchGlyph key={i} symbol={def.symbol} size={14} color={colors.inkSoft}/>
                    })}
                  </View>
                </View>
                <View style={{ flex: 1, paddingLeft: 12 }}>
                  <Text style={{ fontFamily: fonts.bodySb, fontSize: 14.5, color: colors.ink }} numberOfLines={1}>
                    {seq.name}
                  </Text>
                  <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.inkMute, marginTop: 2 }}>
                    {t('library.rowsMeta', { count: seq.rows.length, craft: t(`craft.${seq.craft}`) })}
                  </Text>
                </View>
                <Icon name="chevR" size={16} color={colors.inkMute}/>
              </Pressable>
            )
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.bg, borderTopColor: colors.rule, paddingHorizontal: spacing[5] }]}>
        <Pressable onPress={() => setEditing(true)} style={{ borderRadius: radius.md, overflow: 'hidden' }}>
          {({ pressed }) => (
            <LinearGradient
              colors={[colors.brick, colors.brickDk]}
              style={[styles.footerBtn, { opacity: pressed ? 0.85 : 1 }]}
            >
              <Icon name="edit" size={16} color="#FBF6EC"/>
              <Text style={{ fontFamily: fonts.bodySb, fontSize: 15, color: '#FBF6EC' }}>
                {t('library.editPatternCta')}
              </Text>
            </LinearGradient>
          )}
        </Pressable>
      </View>

      <NewPatternScreen
        visible={editing}
        onClose={() => setEditing(false)}
        defaultCraft={pattern.craft}
        initialPattern={pattern}
      />

      <ConfirmDeleteDialog
        visible={confirmDelete}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={onConfirmDelete}
        title={t('library.deletePatternTitle')}
        body={t('library.deletePatternBody')}
        confirmLabel={t('library.deletePatternConfirm')}
        itemName={pattern.name}
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
  heroIcon: {
    width: 64, height: 64, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  seqCard: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, padding: 14,
  },
  thumbBox: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  thumbGlyphs: { flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
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
