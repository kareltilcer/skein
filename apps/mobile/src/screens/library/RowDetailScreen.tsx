import React, { useMemo, useState } from 'react'
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
import NewRowScreen from './NewRowScreen'
import { stitchHue } from '../../components/RepeatRow/stitchHue'
import { expandStitches } from '../../components/RepeatRow/segments'

type Props = { id: string }

export default function RowDetailScreen({ id }: Props) {
  const router = useRouter()
  const { t } = useTranslation()
  const { colors, fonts, radius, spacing } = useTheme()
  const stitchMap = useStitchMap()
  const row = useLibraryStore(s => s.rows.find(x => x.id === id))
  const deleteRow = useLibraryStore(s => s.deleteRow)

  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const notation = useMemo(() => {
    if (!row || row.stitches.length === 0) return ''
    return row.stitches.map(si => {
      const def = stitchMap[si.stitchId]
      const abbr = def?.abbr ?? si.stitchId
      return si.count > 1 ? `${abbr}${si.count}` : abbr
    }).join(', ')
  }, [row, stitchMap])

  if (!row) {
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

  const totalStitches = row.stitches.reduce((sum, s) => sum + s.count, 0)
  const flatIds = expandStitches(row.stitches)
  const hasRepeat = !!row.segments

  const onConfirmDelete = () => {
    deleteRow(row.id)
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
          {t('library.detailTitleRow')}
        </Text>
        <LibraryItemMenu
          label={t('library.kindRow')}
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
            <Icon name="layers" size={26} color="#FBF6EC"/>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{
              fontFamily: fonts.display, fontSize: 27, color: colors.brick,
              letterSpacing: -0.3, lineHeight: 29,
            }} numberOfLines={2}>
              {row.label}
            </Text>
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
              <Chip icon={row.craft === 'knit' ? 'needle' : 'loop'}>{t(`craft.${row.craft}`)}</Chip>
              <Chip>{t('common.sts', { count: totalStitches })}</Chip>
              {hasRepeat && <Chip>{t('wizard.step3RepeatTag')}</Chip>}
            </View>
          </View>
        </View>

        {/* Chart strip */}
        <Text style={{
          marginTop: 22,
          fontFamily: fonts.mono, fontSize: 10.5, color: colors.inkMute,
          letterSpacing: 1.8, textTransform: 'uppercase',
        }}>
          {t('library.theStitchesLabel')}
        </Text>
        <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.rule, borderRadius: radius.md }]}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
            {flatIds.map((sid, i) => {
              const def = stitchMap[sid]
              if (!def) return null
              const c = stitchHue(colors, sid)
              return (
                <View key={i} style={{
                  width: 30, height: 40, borderRadius: 7,
                  backgroundColor: colors.cream2,
                  borderWidth: 1.4, borderColor: c,
                  alignItems: 'center', justifyContent: 'center', gap: 2,
                }}>
                  <StitchGlyph symbol={def.symbol} color={c} size={15} strokeWidth={1.9}/>
                  <Text style={{
                    fontFamily: fonts.mono, fontSize: 7.5, fontWeight: '700',
                    color: c, lineHeight: 9,
                  }}>{def.abbr}</Text>
                </View>
              )
            })}
          </View>
        </View>

        {/* Notation */}
        {notation ? (
          <>
            <Text style={{
              marginTop: 22,
              fontFamily: fonts.mono, fontSize: 10.5, color: colors.inkMute,
              letterSpacing: 1.8, textTransform: 'uppercase',
            }}>
              {t('libraryCreate.notationLabel')}
            </Text>
            <View style={[styles.notationCard, { backgroundColor: colors.card, borderColor: colors.rule, borderRadius: radius.md }]}>
              <Text style={{ fontFamily: fonts.mono, fontSize: 13.5, color: colors.ink, letterSpacing: 0.1 }}>
                {notation}
              </Text>
            </View>
          </>
        ) : null}
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
                {t('library.editRowCta')}
              </Text>
            </LinearGradient>
          )}
        </Pressable>
      </View>

      <NewRowScreen
        visible={editing}
        onClose={() => setEditing(false)}
        defaultCraft={row.craft}
        initialRow={row}
      />

      <ConfirmDeleteDialog
        visible={confirmDelete}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={onConfirmDelete}
        title={t('library.deleteRowTitle')}
        body={t('library.deleteRowBody')}
        confirmLabel={t('library.deleteRowConfirm')}
        itemName={row.label}
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
  chartCard: { borderWidth: 1, padding: 14, marginTop: 10 },
  notationCard: { borderWidth: 1, padding: 14, marginTop: 10 },
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
