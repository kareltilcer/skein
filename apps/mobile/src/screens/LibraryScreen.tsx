import React, { useMemo, useState } from 'react'
import { View, Text, ScrollView, TextInput, Pressable, StyleSheet } from 'react-native'

import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../theme/ThemeContext'
import { useLibraryStore } from '../store/libraryStore'
import { useSettingsStore } from '../store/settingsStore'
import Screen from '../components/ui/Screen'
import AppBar from '../components/ui/AppBar'
import Icon from '../components/ui/Icon'
import StitchGlyph from '../components/StitchGlyph'
import { useStitchMap } from '../hooks/useStitchMap'
import LibraryItemMenu from '../components/library/LibraryItemMenu'
import ConfirmDeleteDialog from '../components/library/ConfirmDeleteDialog'
import NewRowScreen from './library/NewRowScreen'
import NewSequenceScreen from './library/NewSequenceScreen'
import NewPatternScreen from './library/NewPatternScreen'
import type { Craft, LibrarySequence, LibraryPattern, LibraryRow } from '../types'

type Tab = 'pat' | 'seq' | 'row'
type CraftFilter = Craft | 'all'

type EditingState =
  | { kind: 'seq'; item: LibrarySequence }
  | { kind: 'pat'; item: LibraryPattern }
  | { kind: 'row'; item: LibraryRow }
  | null

type DeleteState =
  | { kind: 'seq'; item: LibrarySequence }
  | { kind: 'pat'; item: LibraryPattern }
  | { kind: 'row'; item: LibraryRow }
  | null

function SequenceCard({
  seq, onPress, onEdit, onDelete,
}: {
  seq: LibrarySequence
  onPress: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const { t } = useTranslation()
  const { colors, fonts, fontSize, spacing, radius } = useTheme()
  const stitchMap = useStitchMap()
  const previewStitches = seq.rows[0]?.stitches.slice(0, 4) ?? []
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.rule,
          borderRadius: radius.lg,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
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
        <LibraryItemMenu
          label={t('library.kindSequence')}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </View>
    </Pressable>
  )
}

function PatternCard({
  pat, onPress, onEdit, onDelete,
}: {
  pat: LibraryPattern
  onPress: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const { t } = useTranslation()
  const { colors, fonts, fontSize, spacing, radius } = useTheme()
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.rule,
          borderRadius: radius.lg,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
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
        <LibraryItemMenu
          label={t('library.kindPattern')}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </View>
    </Pressable>
  )
}

function RowCard({
  row, onPress, onEdit, onDelete,
}: {
  row: LibraryRow
  onPress: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const { t } = useTranslation()
  const { colors, fonts, fontSize, spacing, radius } = useTheme()
  const stitchMap = useStitchMap()
  const preview = row.stitches.slice(0, 5)
  const hasRepeat = !!row.segments
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.rule,
          borderRadius: radius.lg,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
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
        <LibraryItemMenu
          label={t('library.kindRow')}
          onEdit={onEdit}
          onDelete={onDelete}
        />
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
    </Pressable>
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
  const router = useRouter()
  const { t } = useTranslation()
  const { colors, fonts, fontSize, spacing, radius } = useTheme()
  const sequences = useLibraryStore((s) => s.sequences)
  const patterns  = useLibraryStore((s) => s.patterns)
  const rows      = useLibraryStore((s) => s.rows)
  const deleteSequence = useLibraryStore((s) => s.deleteSequence)
  const deletePattern  = useLibraryStore((s) => s.deletePattern)
  const deleteRow      = useLibraryStore((s) => s.deleteRow)
  const defaultCraft = useSettingsStore((s) => s.defaultCraft)
  const [tab, setTab] = useState<Tab>('seq')
  const [craft, setCraft] = useState<CraftFilter>(defaultCraft)
  const [query, setQuery] = useState('')
  const [openCreator, setOpenCreator] = useState<Tab | null>(null)
  const [editing, setEditing] = useState<EditingState>(null)
  const [confirmDelete, setConfirmDelete] = useState<DeleteState>(null)

  const modalCraft: Craft = craft === 'all' ? defaultCraft : craft

  const TABS: { id: Tab; label: string }[] = [
    { id: 'pat', label: t('library.tabPatterns')  },
    { id: 'seq', label: t('library.tabSequences') },
    { id: 'row', label: t('library.tabRows')      },
  ]

  const { visibleSeqs, visiblePats, visibleRows } = useMemo(() => {
    const filterCraft = <T extends { craft: Craft }>(items: T[]) =>
      craft === 'all' ? items : items.filter((i) => i.craft === craft)

    const q = query.toLowerCase()
    const filterQuery = <T extends { name?: string; label?: string }>(items: T[]) => {
      if (!query.trim()) return items
      return items.filter((i) => (i.name ?? i.label ?? '').toLowerCase().includes(q))
    }

    return {
      visibleSeqs: filterQuery(filterCraft(sequences)),
      visiblePats: filterQuery(filterCraft(patterns)),
      visibleRows: filterQuery(filterCraft(rows.map((r) => ({ ...r, name: r.label })))),
    }
  }, [sequences, patterns, rows, craft, query])

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

  const onConfirmDelete = () => {
    if (!confirmDelete) return
    if (confirmDelete.kind === 'seq') deleteSequence(confirmDelete.item.id)
    if (confirmDelete.kind === 'pat') deletePattern(confirmDelete.item.id)
    if (confirmDelete.kind === 'row') deleteRow(confirmDelete.item.id)
    setConfirmDelete(null)
  }

  const deleteDialogProps = (() => {
    if (!confirmDelete) {
      return { title: '', body: '', confirmLabel: '', itemName: '' }
    }
    if (confirmDelete.kind === 'pat') {
      return {
        title: t('library.deletePatternTitle'),
        body: t('library.deletePatternBody'),
        confirmLabel: t('library.deletePatternConfirm'),
        itemName: confirmDelete.item.name,
      }
    }
    if (confirmDelete.kind === 'seq') {
      return {
        title: t('library.deleteSequenceTitle'),
        body: t('library.deleteSequenceBody'),
        confirmLabel: t('library.deleteSequenceConfirm'),
        itemName: confirmDelete.item.name,
      }
    }
    return {
      title: t('library.deleteRowTitle'),
      body: t('library.deleteRowBody'),
      confirmLabel: t('library.deleteRowConfirm'),
      itemName: confirmDelete.item.label,
    }
  })()

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
        <Pressable
          onPress={() => setOpenCreator(tab)}
          style={{ borderRadius: radius.md, overflow: 'hidden' }}
        >
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
          {TABS.map((tabDef) => {
            const active = tab === tabDef.id
            return (
              <Pressable
                key={tabDef.id}
                onPress={() => setTab(tabDef.id)}
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
                  {tabDef.label}
                </Text>
                <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: active ? colors.brick : colors.inkMute, backgroundColor: active ? colors.cream2 : 'transparent', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 5 }}>
                  {counts[tabDef.id]}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing[5], gap: spacing[3] }}>
        {tab === 'seq' && (
          visibleSeqs.length > 0
            ? visibleSeqs.map((s) => (
                <SequenceCard
                  key={s.id}
                  seq={s}
                  onPress={() => router.push(`/library/sequence/${s.id}`)}
                  onEdit={() => setEditing({ kind: 'seq', item: s })}
                  onDelete={() => setConfirmDelete({ kind: 'seq', item: s })}
                />
              ))
            : <EmptyState/>
        )}
        {tab === 'pat' && (
          visiblePats.length > 0
            ? visiblePats.map((p) => (
                <PatternCard
                  key={p.id}
                  pat={p}
                  onPress={() => router.push(`/library/pattern/${p.id}`)}
                  onEdit={() => setEditing({ kind: 'pat', item: p })}
                  onDelete={() => setConfirmDelete({ kind: 'pat', item: p })}
                />
              ))
            : <EmptyState/>
        )}
        {tab === 'row' && (
          visibleRows.length > 0
            ? visibleRows.map((r) => (
                <RowCard
                  key={r.id}
                  row={r}
                  onPress={() => router.push(`/library/row/${r.id}`)}
                  onEdit={() => setEditing({ kind: 'row', item: r })}
                  onDelete={() => setConfirmDelete({ kind: 'row', item: r })}
                />
              ))
            : <EmptyState/>
        )}
      </ScrollView>

      <NewRowScreen
        visible={openCreator === 'row' || editing?.kind === 'row'}
        onClose={() => { setOpenCreator(null); setEditing(null) }}
        defaultCraft={modalCraft}
        initialRow={editing?.kind === 'row' ? editing.item : undefined}
      />
      <NewSequenceScreen
        visible={openCreator === 'seq' || editing?.kind === 'seq'}
        onClose={() => { setOpenCreator(null); setEditing(null) }}
        defaultCraft={modalCraft}
        initialSequence={editing?.kind === 'seq' ? editing.item : undefined}
      />
      <NewPatternScreen
        visible={openCreator === 'pat' || editing?.kind === 'pat'}
        onClose={() => { setOpenCreator(null); setEditing(null) }}
        defaultCraft={modalCraft}
        initialPattern={editing?.kind === 'pat' ? editing.item : undefined}
      />

      <ConfirmDeleteDialog
        visible={!!confirmDelete}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={onConfirmDelete}
        title={deleteDialogProps.title}
        body={deleteDialogProps.body}
        confirmLabel={deleteDialogProps.confirmLabel}
        itemName={deleteDialogProps.itemName}
      />
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
