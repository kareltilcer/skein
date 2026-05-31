import React, { useState } from 'react'
import { View, Text, ScrollView, TextInput, Pressable, StyleSheet } from 'react-native'

import { LinearGradient } from 'expo-linear-gradient'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../theme/ThemeContext'
import { useLibraryStore } from '../store/libraryStore'
import { useSettingsStore } from '../store/settingsStore'
import Screen from '../components/ui/Screen'
import AppBar from '../components/ui/AppBar'
import Icon from '../components/ui/Icon'
import StitchGlyph from '../components/StitchGlyph'
import { useStitchMap } from '../hooks/useStitchMap'
import type { Craft, LibrarySequence, LibraryPattern, LibraryRow } from '../types'

type Tab = 'pat' | 'seq' | 'row'
type CraftFilter = Craft | 'all'

function SequenceCard({ seq }: { seq: LibrarySequence }) {
  const { t } = useTranslation()
  const { colors, fonts, fontSize, spacing, radius } = useTheme()
  const stitchMap = useStitchMap()
  const previewStitches = seq.rows[0]?.stitches.slice(0, 4) ?? []
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.rule, borderRadius: radius.lg }]}>
      <View style={styles.cardRow}>
        <View style={[styles.thumbBox, { backgroundColor: colors.cream2, borderRadius: radius.md }]}>
          <View style={styles.thumbGlyphs}>
            {previewStitches.map((si, i) => {
              const def = stitchMap[si.stitchId]
              if (!def) return null
              return <StitchGlyph key={i} symbol={def.symbol} size={14} color={colors.inkSoft}/>
            })}
          </View>
        </View>
        <View style={{ flex: 1, paddingLeft: spacing[3] }}>
          <Text style={{ fontFamily: fonts.bodySb, fontSize: fontSize.base, color: colors.ink }} numberOfLines={1}>
            {seq.name}
          </Text>
          <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.inkMute, marginTop: 2 }}>
            {t('library.rowsMeta', { count: seq.rows.length, craft: t(`craft.${seq.craft}`) })}
          </Text>
        </View>
      </View>
    </View>
  )
}

function PatternCard({ pat }: { pat: LibraryPattern }) {
  const { t } = useTranslation()
  const { colors, fonts, fontSize, spacing, radius } = useTheme()
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.rule, borderRadius: radius.lg }]}>
      <View style={styles.cardRow}>
        <View style={[styles.thumbBox, { backgroundColor: colors.cream2, borderRadius: radius.md }]}>
          <Icon name="book" size={22} color={colors.brick}/>
        </View>
        <View style={{ flex: 1, paddingLeft: spacing[3] }}>
          <Text style={{ fontFamily: fonts.bodySb, fontSize: fontSize.base, color: colors.ink }} numberOfLines={1}>
            {pat.name}
          </Text>
          <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.inkMute, marginTop: 2 }}>
            {t('library.seqsMeta', { count: pat.sequenceIds.length, craft: t(`craft.${pat.craft}`) })}
          </Text>
        </View>
      </View>
    </View>
  )
}

function RowCard({ row }: { row: LibraryRow }) {
  const { t } = useTranslation()
  const { colors, fonts, fontSize, spacing, radius } = useTheme()
  const stitchMap = useStitchMap()
  const preview = row.stitches.slice(0, 5)
  const hasRepeat = !!row.segments
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.rule, borderRadius: radius.lg }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={{ flex: 1, fontFamily: fonts.bodySb, fontSize: fontSize.sm, color: colors.ink }} numberOfLines={1}>
          {row.label}
        </Text>
        {hasRepeat && (
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 3,
            backgroundColor: '#FBEFEA', borderWidth: 1, borderColor: 'rgba(156,61,46,0.18)',
            paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6,
          }}>
            <Icon name="repeat" size={10} color={colors.brick} stroke={2.2}/>
            <Text style={{
              fontFamily: fonts.mono, fontSize: 9, fontWeight: '700',
              color: colors.brick, letterSpacing: 0.6, textTransform: 'uppercase',
            }}>{t('wizard.step3RepeatTag')}</Text>
          </View>
        )}
      </View>
      <View style={[styles.glyphRow, { marginTop: spacing[2] }]}>
        {preview.map((si, i) => {
          const def = stitchMap[si.stitchId]
          if (!def) return null
          return (
            <View key={i} style={[styles.miniChip, { backgroundColor: def.color, borderRadius: 6 }]}>
              <StitchGlyph symbol={def.symbol} size={14} color="#2B1810"/>
              <Text style={{ fontFamily: fonts.mono, fontSize: 9, color: '#2B1810', fontWeight: '700' }}>{def.abbr}</Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}

function EmptyState() {
  const { t } = useTranslation()
  const { colors, fonts, fontSize } = useTheme()
  return (
    <View style={styles.emptyState}>
      <Icon name="library" size={40} color={colors.inkMute}/>
      <Text style={{ fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.inkMute, marginTop: 12, textAlign: 'center' }}>
        {t('library.emptyState')}
      </Text>
    </View>
  )
}

export default function LibraryScreen() {
  const { t } = useTranslation()
  const { colors, fonts, fontSize, spacing, radius } = useTheme()
  const { sequences, patterns, rows } = useLibraryStore()
  const defaultCraft = useSettingsStore((s) => s.defaultCraft)
  const [tab, setTab] = useState<Tab>('seq')
  const [craft, setCraft] = useState<CraftFilter>(defaultCraft)
  const [query, setQuery] = useState('')

  const TABS: { id: Tab; label: string }[] = [
    { id: 'pat', label: t('library.tabPatterns')  },
    { id: 'seq', label: t('library.tabSequences') },
    { id: 'row', label: t('library.tabRows')      },
  ]

  const filterCraft = <T extends { craft: Craft }>(items: T[]) =>
    craft === 'all' ? items : items.filter((i) => i.craft === craft)

  const filterQuery = <T extends { name?: string; label?: string }>(items: T[]) => {
    if (!query.trim()) return items
    const q = query.toLowerCase()
    return items.filter((i) => (i.name ?? i.label ?? '').toLowerCase().includes(q))
  }

  const visibleSeqs = filterQuery(filterCraft(sequences))
  const visiblePats = filterQuery(filterCraft(patterns))
  const visibleRows = filterQuery(filterCraft(rows.map((r) => ({ ...r, name: r.label }))))

  const counts: Record<Tab, number> = {
    seq: visibleSeqs.length,
    pat: visiblePats.length,
    row: visibleRows.length,
  }

  const tabSingular: Record<Tab, string> = {
    pat: t('library.kindPattern'),
    seq: t('library.kindSequence'),
    row: t('library.kindRow'),
  }

  return (
    <Screen>
      <AppBar big title={t('library.title')} sub={t('library.sub')}/>

      <View style={{ paddingHorizontal: spacing[5], gap: spacing[2] }}>
        {/* Search */}
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.rule, borderRadius: radius.md }]}>
          <Icon name="search" size={18} color={colors.inkMute}/>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('library.searchPlaceholder')}
            placeholderTextColor={colors.inkMute}
            style={{ flex: 1, fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.ink }}
          />
        </View>

        {/* New CTA */}
        <Pressable style={{ borderRadius: radius.md, overflow: 'hidden' }}>
          {({ pressed }) => (
            <LinearGradient
              colors={[colors.brick, colors.brickDk]}
              style={[styles.newCta, { opacity: pressed ? 0.85 : 1 }]}
            >
              <Icon name="plus" size={16} color="#FBF6EC"/>
              <Text style={{ fontFamily: fonts.bodySb, fontSize: fontSize.sm, color: '#FBF6EC' }}>
                {t('library.newItem', { kind: tabSingular[tab] })}
              </Text>
            </LinearGradient>
          )}
        </Pressable>

        {/* Craft filter */}
        <View style={styles.craftFilters}>
          {(['all', 'knit', 'crochet'] as const).map((c) => {
            const active = craft === c
            return (
              <Pressable
                key={c}
                onPress={() => setCraft(c)}
                style={[
                  styles.craftChip,
                  {
                    flex: 1,
                    backgroundColor: active ? colors.ink : 'transparent',
                    borderColor: active ? 'transparent' : colors.rule,
                    borderRadius: radius.full,
                  },
                ]}
              >
                {c !== 'all' && (
                  <Icon name={c === 'knit' ? 'needle' : 'loop'} size={13} color={active ? colors.bg : colors.inkSoft}/>
                )}
                <Text style={{ fontFamily: fonts.bodySb, fontSize: 12, color: active ? colors.bg : colors.inkSoft }}>
                  {c === 'all' ? t('craft.all') : c === 'knit' ? t('craft.knit') : t('craft.crochet')}
                </Text>
              </Pressable>
            )
          })}
        </View>

        {/* Tabs */}
        <View style={[styles.tabRow, { backgroundColor: colors.cream2, borderRadius: radius.md }]}>
          {TABS.map((t) => {
            const active = tab === t.id
            return (
              <Pressable
                key={t.id}
                onPress={() => setTab(t.id)}
                style={[
                  styles.tabBtn,
                  {
                    flex: 1,
                    backgroundColor: active ? colors.card : 'transparent',
                    borderRadius: radius.sm,
                  },
                ]}
              >
                <Text style={{ fontFamily: fonts.bodySb, fontSize: 13, color: active ? colors.brick : colors.inkSoft }}>
                  {t.label}
                </Text>
                <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: active ? colors.brick : colors.inkMute, backgroundColor: active ? colors.cream2 : 'transparent', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 5 }}>
                  {counts[t.id]}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing[5], gap: spacing[3] }}>
        {tab === 'seq' && (
          visibleSeqs.length > 0
            ? visibleSeqs.map((s) => <SequenceCard key={s.id} seq={s}/>)
            : <EmptyState/>
        )}
        {tab === 'pat' && (
          visiblePats.length > 0
            ? visiblePats.map((p) => <PatternCard key={p.id} pat={p}/>)
            : <EmptyState/>
        )}
        {tab === 'row' && (
          visibleRows.length > 0
            ? visibleRows.map((r) => <RowCard key={r.id} row={r}/>)
            : <EmptyState/>
        )}
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  searchBar:    { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
  newCta:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12 },
  craftFilters: { flexDirection: 'row', gap: 6 },
  craftChip:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderWidth: 1, paddingVertical: 7 },
  tabRow:       { flexDirection: 'row', padding: 4, gap: 6 },
  tabBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 },
  card:         { borderWidth: 1, padding: 14 },
  cardRow:      { flexDirection: 'row', alignItems: 'center' },
  thumbBox:     { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  thumbGlyphs:  { flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
  glyphRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  miniChip:     { alignItems: 'center', paddingHorizontal: 6, paddingVertical: 4 },
  emptyState:   { alignItems: 'center', paddingVertical: 48 },
})
