import React, {useState, useRef, useCallback, forwardRef, useImperativeHandle} from 'react'
import {View, Text, ScrollView, TextInput, Pressable, StyleSheet, Modal} from 'react-native'
import {BlurView} from 'expo-blur'
import {LinearGradient} from 'expo-linear-gradient'

import {useRouter} from 'expo-router'
import {useTranslation} from 'react-i18next'
import {useTheme} from '../../theme/ThemeContext'
import {useProjectStore} from '../../store/projectStore'
import {useSettingsStore} from '../../store/settingsStore'
import {STITCH_MAP, STITCHES} from '../../tokens/stitches'
import Screen from '../../components/ui/Screen'
import Icon from '../../components/ui/Icon'
import Btn from '../../components/ui/Btn'
import IconBtn from '../../components/ui/IconBtn'
import StitchGlyph from '../../components/StitchGlyph'
import StitchPickerModal from '../../components/pickers/StitchPickerModal'
import RowPickerModal from '../../components/pickers/RowPickerModal'
import SeqPickerModal from '../../components/pickers/SeqPickerModal'
import DefineCustomStitchScreen from './DefineCustomStitchScreen'
import {useLibraryStore} from '../../store/libraryStore'
import type {StitchInstance, Craft, StitchDef, LibraryRow, LibrarySequence, LibraryPattern, RowSegment} from '../../types'
import RepeatRowBody from '../../components/RepeatRow/RepeatRowBody'
import {StitchTile} from '../../components/RepeatRow/RepeatTiles'
import {
    appendStitchPreservingSegments,
    expandStitches,
    removeLastStitchPreservingSegments,
    segmentsFromMark,
} from '../../components/RepeatRow/segments'
import _DraggableFlatList, {ScaleDecorator as _ScaleDecorator} from 'react-native-draggable-flatlist'
const DraggableFlatList = _DraggableFlatList as any
const ScaleDecorator = _ScaleDecorator as any

const YARN_WEIGHTS = ['Lace', 'Fingering', 'Sport', 'DK', 'Worsted', 'Aran', 'Bulky', 'Chunky', 'Jumbo']
const YARN_COLORS = ['#9C3D2E', '#D4923B', '#3F6B4A', '#8B5CF6', '#3B82F6', '#EC4899', '#F59E0B', '#6EE7B7']
const PART_COLORS = ['#9C3D2E', '#D4923B', '#3F6B4A', '#7A5A8C', '#3B5B7A', '#C2547B']
const MAX_NAME = 60

type NeedleEntry = { mm: string; us: string; typical: string }
const KNIT_SIZES: NeedleEntry[] = [
    {mm: '1.5', us: '', typical: 'Lace'},
    {mm: '1.75', us: '', typical: 'Lace'},
    {mm: '2.0', us: 'US 0', typical: 'Lace'},
    {mm: '2.25', us: 'US 1', typical: 'Lace'},
    {mm: '2.5', us: '', typical: 'Lace'},
    {mm: '2.75', us: 'US 2', typical: 'Fingering'},
    {mm: '3.0', us: '', typical: 'Fingering'},
    {mm: '3.25', us: 'US 3', typical: 'Sport'},
    {mm: '3.5', us: 'US 4', typical: 'Sport'},
    {mm: '3.75', us: 'US 5', typical: 'DK'},
    {mm: '4.0', us: 'US 6', typical: 'DK'},
    {mm: '4.5', us: 'US 7', typical: 'Worsted'},
    {mm: '5.0', us: 'US 8', typical: 'Worsted'},
    {mm: '5.5', us: 'US 9', typical: 'Aran'},
    {mm: '6.0', us: 'US 10', typical: 'Bulky'},
    {mm: '6.5', us: 'US 10.5', typical: 'Bulky'},
    {mm: '7.0', us: '', typical: 'Bulky'},
    {mm: '8.0', us: 'US 11', typical: 'Chunky'},
    {mm: '9.0', us: 'US 13', typical: 'Super Chunky'},
    {mm: '10.0', us: 'US 15', typical: 'Jumbo'},
    {mm: '12.0', us: 'US 17', typical: 'Jumbo'},
    {mm: '15.0', us: 'US 19', typical: 'Jumbo'},
]
const CROCHET_SIZES: NeedleEntry[] = [
    {mm: '2.25', us: 'B/1', typical: 'Lace'},
    {mm: '2.75', us: 'C/2', typical: 'Fingering'},
    {mm: '3.25', us: 'D/3', typical: 'Sport'},
    {mm: '3.5', us: 'E/4', typical: 'Sport'},
    {mm: '3.75', us: 'F/5', typical: 'DK'},
    {mm: '4.0', us: 'G/6', typical: 'DK'},
    {mm: '4.5', us: '7', typical: 'Worsted'},
    {mm: '5.0', us: 'H/8', typical: 'Worsted'},
    {mm: '5.5', us: 'I/9', typical: 'Aran'},
    {mm: '6.0', us: 'J/10', typical: 'Bulky'},
    {mm: '6.5', us: 'K/10.5', typical: 'Bulky'},
    {mm: '8.0', us: 'L/11', typical: 'Chunky'},
    {mm: '9.0', us: 'M/13', typical: 'Chunky'},
    {mm: '10.0', us: 'N/15', typical: 'Jumbo'},
    {mm: '12.0', us: 'P/Q', typical: 'Jumbo'},
]
const KNIT_NEEDLE_TYPES = ['Straight', 'Circular', 'DPN']

type DraftPart = {
    id: string; name: string; color: string; notes?: string
    sequences: DraftSequence[]
    loop?: boolean
}
type DraftSequence = {
    id: string; name: string
    rows: DraftRow[]
    totalRepeats: number; loop: boolean
}
type DraftRow = {
    id: string; label: string
    stitches: StitchInstance[]
    segments?: RowSegment[]
}

type Draft = {
    name: string; craft: Craft; yarnWeight: string
    needleSize: string; needleType: string; yarnColor: string; notes: string
    parts: DraftPart[]
    partsCustomized?: boolean   // true once user has explicitly added a part
}

// Stitch chip color groups — matches design's semantic grouping (brick=knit, mustard=purl, forest=other)
const STITCH_BRICK   = new Set(['k', 'sl', 'kfb', 'm1'])
const STITCH_MUSTARD = new Set(['p', 'p2tog', 'mb'])

function uuid4() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function usePartMeta() {
    const { t } = useTranslation()
    return (part: DraftPart): string => {
        const seqCount = part.sequences.length
        const rowCount = part.sequences.reduce((s, seq) => s + seq.rows.length, 0)
        return t('wizard.partMeta', { count: seqCount, seqCount, rowCount })
    }
}

function WizardSteps({step}: { step: number }) {
    const {colors} = useTheme()
    return (
        <View style={styles.stepsRow}>
            {[0, 1, 2, 3].map((i) => (
                <View
                    key={i}
                    style={[
                        styles.stepPip,
                        {
                            backgroundColor:
                                i < step ? colors.brick :
                                    i === step ? colors.mustard :
                                        colors.cream2,
                        },
                    ]}
                />
            ))}
        </View>
    )
}

// ── Step 1 ─────────────────────────────────────────────────────
type Step1Handle = { scrollToRequired: () => void }

const Step1 = forwardRef<Step1Handle, {
    draft: Draft; onChange: (d: Draft) => void; requiredError?: boolean
}>(function Step1({draft, onChange, requiredError = false}, ref) {
    const { t } = useTranslation()
    const {colors, fonts, fontSize, spacing, radius} = useTheme()
    const scrollRef = useRef<ScrollView>(null)
    const nameY = useRef(0)
    const len = draft.name.length
    const ratio = Math.min(1, len / MAX_NAME)

    useImperativeHandle(ref, () => ({
        scrollToRequired() {
            scrollRef.current?.scrollTo({y: Math.max(0, nameY.current - 24), animated: true})
        },
    }))

    const state =
        requiredError && len === 0 ? 'required' :
        len === 0 ? 'empty' :
        len === MAX_NAME ? 'over' :
        len >= MAX_NAME - 5 ? 'near' :
        len >= 35 ? 'mid' : 'ok'

    const stateColor =
        state === 'required' || state === 'over' ? colors.brick :
        state === 'near' ? colors.brickDk :
        state === 'mid' ? colors.mustardDk : colors.forest

    const stateMsg: Record<string, string> = {
        empty:    t('wizard.nameStateEmpty'),
        ok:       t('wizard.nameStateOk'),
        mid:      t('wizard.nameStateMid'),
        near:     t('wizard.nameStateNear'),
        over:     t('wizard.nameStateOver'),
        required: t('wizard.nameStateRequired'),
    }

    const isErr = state === 'required'

    return (
        <ScrollView ref={scrollRef} contentContainerStyle={{padding: spacing[5], gap: spacing[5], paddingBottom: 140}}>
            {/* Name */}
            <View onLayout={(e) => { nameY.current = e.nativeEvent.layout.y }}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8}}>
                    <Text style={[styles.sectionLabel, {color: colors.inkMute, fontFamily: fonts.mono}]}>
                        {t('wizard.nameYourProject')}
                    </Text>
                    {isErr && (
                        <View style={{
                            flexDirection: 'row', alignItems: 'center', gap: 4,
                            backgroundColor: colors.brick, borderRadius: 6,
                            paddingHorizontal: 6, paddingVertical: 2,
                        }}>
                            <Text style={{fontSize: 11, color: '#FBF6EC', lineHeight: 11}}>✱</Text>
                            <Text style={{
                                fontFamily: fonts.mono, fontSize: 9.5, fontWeight: '700',
                                color: '#FBF6EC', letterSpacing: 2,
                            }}>{t('wizard.required')}</Text>
                        </View>
                    )}
                </View>
                <View style={[styles.nameBox, {
                    backgroundColor: isErr ? '#FBEFEA' : colors.card,
                    borderColor: colors.brick,
                    borderWidth: isErr ? 2.5 : 2,
                    borderRadius: radius.lg,
                    ...(isErr ? {
                        shadowColor: colors.brick,
                        shadowOffset: {width: 0, height: 0},
                        shadowOpacity: 0.12,
                        shadowRadius: 8,
                    } : {}),
                }]}>
                    <TextInput
                        value={draft.name}
                        onChangeText={(text) => onChange({...draft, name: text})}
                        maxLength={MAX_NAME}
                        placeholder={t('wizard.namePlaceholder')}
                        placeholderTextColor={colors.inkMute}
                        style={{
                            fontFamily: fonts.displayInput,
                            fontSize: fontSize['2xl'],
                            color: colors.ink,
                            letterSpacing: -0.5,
                            paddingRight: isErr ? 36 : 0,
                        }}
                        autoFocus
                    />
                    {isErr && (
                        <View style={{
                            position: 'absolute', top: 14, right: 14,
                            width: 26, height: 26, borderRadius: 13,
                            backgroundColor: colors.brick,
                            alignItems: 'center', justifyContent: 'center',
                            shadowColor: colors.brick,
                            shadowOffset: {width: 0, height: 2},
                            shadowOpacity: 0.35,
                            shadowRadius: 6,
                        }}>
                            <Text style={{
                                fontFamily: fonts.display, fontSize: 17,
                                color: '#FBF6EC', lineHeight: 20,
                            }}>!</Text>
                        </View>
                    )}
                </View>
                <View style={styles.nameMeta}>
                    <View style={{
                        flex: 1,
                        height: 4,
                        borderRadius: 99,
                        backgroundColor: colors.cream2,
                        overflow: 'hidden'
                    }}>
                        <View style={{
                            width: `${Math.min(100, ratio * 100)}%`,
                            height: 4,
                            backgroundColor: stateColor,
                            borderRadius: 99
                        }}/>
                    </View>
                    <Text style={{
                        fontFamily: fonts.mono, fontSize: 11,
                        color: stateColor,
                        fontWeight: isErr ? '700' : '400',
                    }}>{len} / {MAX_NAME}</Text>
                </View>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6}}>
                    {isErr && (
                        <View style={{
                            width: 13, height: 13, borderRadius: 99,
                            backgroundColor: colors.brick,
                            alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Text style={{fontSize: 10, fontWeight: '700', color: '#FBF6EC', lineHeight: 13}}>!</Text>
                        </View>
                    )}
                    {(state === 'over' || state === 'near') && (
                        <Icon name="bulb" size={12} color={stateColor}/>
                    )}
                    <Text style={{
                        fontFamily: fonts.mono, fontSize: 10.5,
                        color: (state === 'over' || state === 'near' || isErr) ? stateColor : colors.inkMute,
                        fontWeight: isErr ? '700' : '400',
                        letterSpacing: 0.5,
                        flex: 1,
                    }}>{stateMsg[state]}</Text>
                </View>
            </View>

            {/* Craft type */}
            <View>
                <Text style={[styles.sectionLabel, {color: colors.inkMute, fontFamily: fonts.mono}]}>{t('wizard.whatKind')}</Text>
                <View style={styles.pillRow}>
                    {(['knit', 'crochet'] as const).map((c) => (
                        <Pressable
                            key={c}
                            onPress={() => onChange({...draft, craft: c})}
                            style={[
                                styles.pill,
                                {
                                    backgroundColor: draft.craft === c ? colors.brick : colors.card,
                                    borderColor: draft.craft === c ? 'transparent' : colors.rule,
                                    borderRadius: radius.full,
                                },
                            ]}
                        >
                            <Icon name={c === 'knit' ? 'needle' : 'loop'} size={15}
                                  color={draft.craft === c ? '#FBF6EC' : colors.ink}/>
                            <Text style={{
                                fontFamily: fonts.bodySb,
                                fontSize: 14,
                                color: draft.craft === c ? '#FBF6EC' : colors.ink
                            }}>
                                {t(`craft.${c}`)}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </View>

            {/* Yarn weight */}
            <View>
                <View style={styles.sectionLabelRow}>
                    <Text style={[styles.sectionLabel, {color: colors.inkMute, fontFamily: fonts.mono}]}>{t('wizard.yarnWeight')}</Text>
                    <Text style={{fontFamily: fonts.mono, fontSize: 10, color: colors.inkMute, letterSpacing: 0.5}}>{t('wizard.yarnWeightSub')}</Text>
                </View>
                <View style={styles.wrapRow}>
                    {YARN_WEIGHTS.map((w) => (
                        <Pressable
                            key={w}
                            onPress={() => onChange({...draft, yarnWeight: w})}
                            style={[
                                styles.weightChip,
                                {
                                    backgroundColor: draft.yarnWeight === w ? colors.brick : colors.card,
                                    borderColor: draft.yarnWeight === w ? 'transparent' : colors.rule,
                                    borderRadius: radius.full,
                                },
                            ]}
                        >
                            <Text style={{
                                fontFamily: fonts.bodySb,
                                fontSize: 13,
                                color: draft.yarnWeight === w ? '#FBF6EC' : colors.ink
                            }}>
                                {w}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </View>

            {/* Needle / hook size */}
            <View>
                <View style={styles.sectionLabelRow}>
                    <Text style={[styles.sectionLabel, {color: colors.inkMute, fontFamily: fonts.mono}]}>
                        {draft.craft === 'knit' ? t('wizard.needleSize') : t('wizard.hookSize')}
                    </Text>
                    <Text style={{fontFamily: fonts.mono, fontSize: 10, color: colors.inkMute, letterSpacing: 0.5}}>
                        {draft.craft === 'knit' ? t('wizard.needleSizeSub') : t('wizard.hookSizeSub')}
                    </Text>
                </View>
                {(() => {
                    const sizes = draft.craft === 'knit' ? KNIT_SIZES : CROCHET_SIZES
                    const idx = Math.max(0, sizes.findIndex(s => s.mm === draft.needleSize))
                    const entry = sizes[idx]!
                    return (
                        <>
                            <View style={[styles.needleCard, {
                                backgroundColor: colors.card,
                                borderColor: colors.rule,
                                borderRadius: radius.lg
                            }]}>
                                <View style={[styles.needleIconBox, {
                                    backgroundColor: colors.cream2,
                                    borderRadius: radius.md
                                }]}>
                                    <Icon name={draft.craft === 'knit' ? 'needle' : 'loop'} size={20}
                                          color={colors.brick}/>
                                </View>
                                <View style={{flex: 1}}>
                                    <View style={{flexDirection: 'row', alignItems: 'baseline', gap: 4}}>
                                        <Text style={{
                                            fontFamily: fonts.display,
                                            fontSize: 28,
                                            color: colors.ink,
                                            lineHeight: 32
                                        }}>{entry.mm}</Text>
                                        <Text style={{
                                            fontFamily: fonts.mono,
                                            fontSize: 12,
                                            color: colors.inkSoft,
                                            fontWeight: '600'
                                        }}>mm</Text>
                                        <Text style={{
                                            fontFamily: fonts.mono,
                                            fontSize: 10,
                                            color: colors.inkMute,
                                            marginLeft: 4
                                        }}>· {entry.us}</Text>
                                    </View>
                                    <Text style={{
                                        fontFamily: fonts.mono,
                                        fontSize: 11,
                                        color: colors.inkMute,
                                        marginTop: 2
                                    }}>
                                        {t('wizard.typicalFor', { weight: entry.typical })}
                                    </Text>
                                </View>
                                <View style={[styles.needleStepper, {
                                    backgroundColor: colors.bg,
                                    borderRadius: radius.sm
                                }]}>
                                    <Pressable
                                        onPress={() => idx > 0 && onChange({...draft, needleSize: sizes[idx - 1]!.mm})}
                                        style={styles.needleBtn}
                                        disabled={idx === 0}
                                    >
                                        <Text style={{
                                            fontFamily: fonts.display,
                                            fontSize: 22,
                                            color: idx === 0 ? colors.inkMute : colors.ink
                                        }}>−</Text>
                                    </Pressable>
                                    <Pressable
                                        onPress={() => idx < sizes.length - 1 && onChange({
                                            ...draft,
                                            needleSize: sizes[idx + 1]!.mm
                                        })}
                                        style={styles.needleBtn}
                                        disabled={idx === sizes.length - 1}
                                    >
                                        <Text style={{
                                            fontFamily: fonts.display,
                                            fontSize: 22,
                                            color: idx === sizes.length - 1 ? colors.inkMute : colors.ink
                                        }}>+</Text>
                                    </Pressable>
                                </View>
                            </View>
                            {draft.craft === 'knit' && (
                                <View style={[styles.wrapRow, {marginTop: 8}]}>
                                    {KNIT_NEEDLE_TYPES.map((nt) => (
                                        <Pressable
                                            key={nt}
                                            onPress={() => onChange({...draft, needleType: nt})}
                                            style={[
                                                styles.weightChip,
                                                {
                                                    backgroundColor: draft.needleType === nt ? colors.mustard : colors.card,
                                                    borderColor: draft.needleType === nt ? 'transparent' : colors.rule,
                                                    borderRadius: radius.full,
                                                },
                                            ]}
                                        >
                                            <Text style={{
                                                fontFamily: fonts.bodySb,
                                                fontSize: 12,
                                                color: draft.needleType === nt ? '#2B1810' : colors.inkSoft
                                            }}>
                                                {nt}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>
                            )}
                        </>
                    )
                })()}
            </View>

            {/* Yarn color */}
            <View>
                <Text style={[styles.sectionLabel, {color: colors.inkMute, fontFamily: fonts.mono}]}>{t('wizard.yarnColor')}</Text>
                <View style={styles.colorRow}>
                    {YARN_COLORS.map((c) => (
                        <Pressable
                            key={c}
                            onPress={() => onChange({...draft, yarnColor: c})}
                            style={[
                                styles.colorSwatch,
                                {
                                    backgroundColor: c,
                                    borderWidth: draft.yarnColor === c ? 3 : 1,
                                    borderColor: draft.yarnColor === c ? colors.ink : 'transparent',
                                },
                            ]}
                        />
                    ))}
                </View>
            </View>

            {/* Notes */}
            <View>
                <Text style={[styles.sectionLabel, {color: colors.inkMute, fontFamily: fonts.mono}]}>{t('wizard.notesOptional')}</Text>
                <View style={[styles.notesBox, {
                    backgroundColor: colors.card,
                    borderColor: colors.rule,
                    borderRadius: radius.md
                }]}>
                    <TextInput
                        value={draft.notes}
                        onChangeText={(text) => onChange({...draft, notes: text})}
                        placeholder={t('wizard.notesPlaceholder')}
                        placeholderTextColor={colors.inkMute}
                        multiline
                        style={{fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.ink}}
                    />
                </View>
            </View>
        </ScrollView>
    )
})

// ── Step 2 ─────────────────────────────────────────────────────
function Step2({draft, onChange}: { draft: Draft; onChange: (d: Draft) => void }) {
    const { t } = useTranslation()
    const partMeta = usePartMeta()
    const {colors, fonts} = useTheme()

    const [sheetMode, setSheetMode] = useState<'add' | 'edit' | null>(null)
    const [editingPartId, setEditingPartId] = useState<string | null>(null)
    const [sheetName, setSheetName] = useState('')
    const [sheetColor, setSheetColor] = useState(PART_COLORS[0]!)
    const [sheetNotes, setSheetNotes] = useState('')
    const nameInputRef = useRef<TextInput>(null)

    const openAddSheet = useCallback(() => {
        const used = new Set(draft.parts.map(p => p.color))
        const color = PART_COLORS.find(c => !used.has(c)) ?? PART_COLORS[draft.parts.length % PART_COLORS.length]!
        setSheetName('')
        setSheetColor(color)
        setSheetNotes('')
        setEditingPartId(null)
        setSheetMode('add')
    }, [draft.parts])

    const openEditSheet = useCallback((part: DraftPart) => {
        setSheetName(part.name)
        setSheetColor(part.color)
        setSheetNotes(part.notes ?? '')
        setEditingPartId(part.id)
        setSheetMode('edit')
    }, [])

    const closeSheet = useCallback(() => {
        setSheetMode(null)
        setEditingPartId(null)
    }, [])

    const confirmAdd = () => {
        if (!sheetName.trim()) return
        const newPart: DraftPart = {
            id: uuid4(),
            name: sheetName.trim(),
            color: sheetColor,
            notes: sheetNotes.trim() || undefined,
            loop: false,
            sequences: [{id: uuid4(), name: t('wizard.mainSequence'), rows: [], totalRepeats: 1, loop: false}],
        }
        // First explicit add: replace the implicit default "Main" part instead of appending
        const isFirstAdd = !draft.partsCustomized && draft.parts.length === 1
        const newParts = isFirstAdd ? [newPart] : [...draft.parts, newPart]
        onChange({...draft, parts: newParts, partsCustomized: true})
        closeSheet()
    }

    const confirmEdit = () => {
        onChange({
            ...draft,
            parts: draft.parts.map(p =>
                p.id === editingPartId
                    ? {...p, name: sheetName.trim() || p.name, color: sheetColor, notes: sheetNotes.trim() || undefined}
                    : p
            ),
        })
        closeSheet()
    }

    const confirmRemove = () => {
        if (draft.parts.length <= 1) return
        onChange({...draft, parts: draft.parts.filter(p => p.id !== editingPartId)})
        closeSheet()
    }

    const isEdit = sheetMode === 'edit'
    const editingIdx = draft.parts.findIndex(p => p.id === editingPartId)
    const isEmpty = !draft.partsCustomized

    const renderPartRow = useCallback(({item: part, drag, isActive}: any) => {
        const idx = draft.parts.findIndex(p => p.id === part.id)
        return (
            <ScaleDecorator>
                <Pressable
                    onLongPress={drag}
                    delayLongPress={200}
                    style={[
                        styles.partRow,
                        {
                            backgroundColor: colors.card,
                            borderColor: isActive ? colors.brick : colors.rule,
                            marginBottom: 10,
                        },
                    ]}
                >
                    <Icon name="grip" size={20} color={colors.inkMute}/>
                    <View style={{
                        width: 36, height: 36, borderRadius: 10,
                        backgroundColor: part.color,
                        alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Text style={{fontFamily: fonts.display, fontSize: 16, color: '#FBF6EC'}}>{idx + 1}</Text>
                    </View>
                    <View style={{flex: 1}}>
                        <Text style={{fontFamily: fonts.bodySb, fontSize: 16, color: colors.ink}}>{part.name}</Text>
                        <Text style={{fontFamily: fonts.mono, fontSize: 12, color: colors.inkMute, marginTop: 2}}>{partMeta(part)}</Text>
                    </View>
                    <Pressable onPress={() => openEditSheet(part)} hitSlop={8}>
                        <Icon name="edit" size={18} color={colors.inkSoft}/>
                    </Pressable>
                </Pressable>
            </ScaleDecorator>
        )
    }, [colors, fonts, openEditSheet, draft.parts])

    // ── Empty state ──────────────────────────────────────────────
    const emptyState = (
        <ScrollView contentContainerStyle={{padding: 20, gap: 12, paddingBottom: 140}}>
            <View style={{
                backgroundColor: colors.cream2,
                borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.rule,
                borderRadius: 20,
                paddingTop: 22, paddingHorizontal: 20, paddingBottom: 20,
                alignItems: 'center', gap: 12,
            }}>
                {/* Decorative 3-tile row */}
                <View style={{flexDirection: 'row', gap: 8, alignItems: 'flex-end', paddingTop: 4, paddingBottom: 6}}>
                    <View style={{
                        width: 28, height: 36, borderRadius: 8,
                        backgroundColor: colors.brick,
                        alignItems: 'center', justifyContent: 'center',
                        shadowColor: colors.brick,
                        shadowOffset: {width: 0, height: 4},
                        shadowOpacity: 0.45,
                        shadowRadius: 8,
                        elevation: 4,
                    }}>
                        <StitchGlyph symbol="vline" size={16} color="#FBF6EC"/>
                    </View>
                    <View style={{
                        width: 28, height: 36, borderRadius: 8,
                        borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.rule,
                        alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Icon name="plus" size={12} color={colors.inkMute}/>
                    </View>
                    <View style={{
                        width: 28, height: 36, borderRadius: 8,
                        borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.rule,
                        alignItems: 'center', justifyContent: 'center',
                        opacity: 0.55,
                    }}>
                        <Icon name="plus" size={12} color={colors.inkMute}/>
                    </View>
                </View>
                <Text style={{
                    fontFamily: fonts.display, fontSize: 24, color: colors.brick,
                    letterSpacing: -0.25, lineHeight: 26, textAlign: 'center',
                }}>
                    {t('wizard.step2EmptyTitle')}
                </Text>
                <Text style={{
                    fontFamily: fonts.body, fontSize: 13.5, color: colors.inkSoft,
                    lineHeight: 20, textAlign: 'center', maxWidth: 300,
                }}>
                    {t('wizard.step2EmptyBody')}
                </Text>
                <Pressable
                    onPress={openAddSheet}
                    style={{
                        flexDirection: 'row', alignItems: 'center', gap: 6,
                        borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.brick,
                        borderRadius: 14, paddingVertical: 12, paddingHorizontal: 18,
                        marginTop: 4,
                    }}
                >
                    <Icon name="plus" size={14} color={colors.brick}/>
                    <Text style={{fontFamily: fonts.bodySb, fontSize: 14, color: colors.brick}}>{t('wizard.addPart')}</Text>
                </Pressable>
                <Text style={{
                    fontFamily: fonts.mono, fontSize: 10, color: colors.inkMute,
                    letterSpacing: 2, textTransform: 'uppercase', marginTop: 2,
                }}>
                    {t('wizard.step2DecorativeNote')}
                </Text>
            </View>
            <View style={{
                backgroundColor: colors.card,
                borderWidth: 1, borderColor: colors.rule,
                borderRadius: 14, padding: 12,
                flexDirection: 'row', gap: 10, alignItems: 'flex-start',
            }}>
                <Icon name="bulb" size={16} color={colors.mustardDk}/>
                <Text style={{fontFamily: fonts.body, fontSize: 12.5, color: colors.inkSoft, flex: 1, lineHeight: 18}}>
                    <Text style={{fontWeight: '700', color: colors.ink}}>{t('common.notSure')} </Text>
                    {t('wizard.step2EmptyTipBody')}
                </Text>
            </View>
        </ScrollView>
    )

    // ── Populated state ──────────────────────────────────────────
    const listFooter = (
        <View style={{marginTop: 4}}>
            <Pressable
                onPress={openAddSheet}
                style={[styles.addPartBtn, {borderColor: colors.rule, borderRadius: 18, paddingVertical: 14}]}
            >
                <Icon name="plus" size={16} color={colors.brick}/>
                <Text style={{fontFamily: fonts.bodySb, fontSize: 14, color: colors.brick}}>{t('wizard.addAnotherPart')}</Text>
            </Pressable>
            <View style={{
                backgroundColor: colors.cream2,
                borderRadius: 14, padding: 12, marginTop: 14, marginBottom: 140,
                flexDirection: 'row', gap: 10, alignItems: 'flex-start',
            }}>
                <Icon name="bulb" size={16} color={colors.mustardDk}/>
                <Text style={{fontFamily: fonts.body, fontSize: 12.5, color: colors.inkSoft, flex: 1, lineHeight: 18}}>
                    <Text style={{fontWeight: '700', color: colors.ink}}>{t('common.tip')} </Text>
                    {t('wizard.step2PopulatedTipBody')}
                </Text>
            </View>
        </View>
    )

    const populatedState = (
        <DraggableFlatList
            data={draft.parts}
            keyExtractor={(p: DraftPart) => p.id}
            onDragEnd={({data}: {data: DraftPart[]}) => onChange({...draft, parts: data})}
            contentContainerStyle={{paddingTop: 20, paddingHorizontal: 20}}
            renderItem={renderPartRow}
            ListFooterComponent={listFooter}
        />
    )

    // ── Part sheet ───────────────────────────────────────────────
    // When the user is adding their first explicit part (replacing the implicit default),
    // the next slot is 1, not draft.parts.length + 1 (which would count "Main" as slot 1).
    const nextSlotNumber = !draft.partsCustomized && draft.parts.length === 1 ? 1 : draft.parts.length + 1
    const sheetSlotLabel = isEdit
        ? t('wizard.partSheetEditingSlot', { current: editingIdx + 1, total: draft.parts.length })
        : t('wizard.partSheetNewSlot', { slot: nextSlotNumber })
    const sheetTitle = isEdit
        ? t('wizard.partSheetEditTitle', { name: draft.parts.find(p => p.id === editingPartId)?.name ?? '' })
        : t('wizard.partSheetAddTitle')
    const sheetTileNumber = isEdit ? editingIdx + 1 : nextSlotNumber

    const partSheet = (
        <Modal
            visible={sheetMode !== null}
            transparent
            animationType="slide"
            onRequestClose={closeSheet}
            onShow={() => setTimeout(() => nameInputRef.current?.focus(), 50)}
        >
            <View style={{flex: 1}}>
                <BlurView
                    intensity={18}
                    tint="dark"
                    style={[StyleSheet.absoluteFillObject, {backgroundColor: 'rgba(43,24,16,0.28)'}]}
                />
                <Pressable
                    style={StyleSheet.absoluteFillObject}
                    onPress={closeSheet}
                />
                <View
                    style={{flex: 1, justifyContent: 'flex-end'}}
                    pointerEvents="box-none"
                >
                    <View style={{
                        backgroundColor: colors.bg,
                        borderTopLeftRadius: 24, borderTopRightRadius: 24,
                        maxHeight: '78%',
                        paddingTop: 10, paddingBottom: 24,
                        marginBottom: 0,
                        shadowColor: 'rgba(43,24,16,1)',
                        shadowOffset: {width: 0, height: -20},
                        shadowOpacity: 0.35,
                        shadowRadius: 30,
                        elevation: 20,
                    }}>
                        {/* Drag handle */}
                        <View style={{
                            width: 44, height: 5, borderRadius: 3,
                            backgroundColor: colors.rule,
                            alignSelf: 'center', marginBottom: 12,
                        }}/>
                        {/* Header */}
                        <View style={{paddingHorizontal: 22}}>
                            <Text style={{
                                fontFamily: fonts.mono, fontSize: 10.5, color: colors.mustardDk,
                                letterSpacing: 1.7, textTransform: 'uppercase',
                            }}>
                                {sheetSlotLabel}
                            </Text>
                            <Text style={{
                                fontFamily: fonts.display, fontSize: 26, color: colors.brick,
                                letterSpacing: -0.25, lineHeight: 30, marginTop: 4,
                            }}>
                                {sheetTitle}
                            </Text>
                            <Pressable
                                onPress={closeSheet}
                                style={{
                                    position: 'absolute', top: 0, right: 22,
                                    width: 34, height: 34, borderRadius: 17,
                                    backgroundColor: colors.card,
                                    borderWidth: 1, borderColor: colors.rule,
                                    alignItems: 'center', justifyContent: 'center',
                                }}
                            >
                                <Icon name="x" size={16} color={colors.ink}/>
                            </Pressable>
                        </View>
                        {/* Scrollable body */}
                        <ScrollView
                            contentContainerStyle={{paddingTop: 18, paddingHorizontal: 22, paddingBottom: 14}}
                            keyboardShouldPersistTaps="handled"
                        >
                            {/* Identity row */}
                            <View style={{flexDirection: 'row', gap: 12, marginBottom: 18, alignItems: 'stretch'}}>
                                <View style={{alignItems: 'center', gap: 6}}>
                                    <View style={{
                                        width: 56, height: 64, borderRadius: 14,
                                        backgroundColor: sheetColor,
                                        alignItems: 'center', justifyContent: 'center',
                                        shadowColor: sheetColor,
                                        shadowOffset: {width: 0, height: 6},
                                        shadowOpacity: 0.45,
                                        shadowRadius: 10,
                                        elevation: 4,
                                    }}>
                                        <Text style={{fontFamily: fonts.display, fontSize: 28, color: '#FBF6EC'}}>
                                            {sheetTileNumber}
                                        </Text>
                                    </View>
                                    <Text style={{
                                        fontFamily: fonts.mono, fontSize: 9.5,
                                        color: colors.inkMute, letterSpacing: 1.5,
                                        textTransform: 'uppercase',
                                    }}>{t('wizard.preview')}</Text>
                                </View>
                                <View style={{flex: 1}}>
                                    <Text style={{
                                        fontFamily: fonts.mono, fontSize: 10.5, color: colors.inkMute,
                                        letterSpacing: 1.7, textTransform: 'uppercase', marginBottom: 6,
                                    }}>{t('wizard.partName')}</Text>
                                    <View style={{
                                        backgroundColor: colors.card,
                                        borderWidth: 2, borderColor: colors.brick,
                                        borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, minHeight: 44,
                                        ...(sheetMode === 'add' ? {
                                            shadowColor: colors.brick,
                                            shadowOffset: {width: 0, height: 0},
                                            shadowOpacity: 0.08,
                                            shadowRadius: 4,
                                        } : {}),
                                    }}>
                                        <TextInput
                                            ref={nameInputRef}
                                            value={sheetName}
                                            onChangeText={setSheetName}
                                            placeholder={t('wizard.partNamePlaceholder')}
                                            placeholderTextColor={colors.inkMute}
                                            style={{
                                                fontFamily: fonts.displayInput, fontSize: 22,
                                                color: colors.ink, letterSpacing: -0.25,
                                            }}
                                        />
                                    </View>
                                </View>
                            </View>
                            {/* Color swatches */}
                            <Text style={{
                                fontFamily: fonts.mono, fontSize: 10.5, color: colors.inkMute,
                                letterSpacing: 1.7, textTransform: 'uppercase', marginBottom: 10,
                                marginTop: 22,
                            }}>{t('wizard.tileColor')}</Text>
                            <View style={{flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 22}}>
                                {PART_COLORS.map(c => (
                                    <Pressable
                                        key={c}
                                        onPress={() => setSheetColor(c)}
                                        style={{
                                            width: 42, height: 42, borderRadius: 12,
                                            backgroundColor: c,
                                            borderWidth: sheetColor === c ? 3 : 0,
                                            borderColor: sheetColor === c ? colors.bg : 'transparent',
                                            shadowColor: sheetColor === c ? colors.ink : 'transparent',
                                            shadowOffset: {width: 0, height: 0},
                                            shadowOpacity: sheetColor === c ? 0.5 : 0,
                                            shadowRadius: sheetColor === c ? 4 : 0,
                                            elevation: sheetColor === c ? 4 : 0,
                                        }}
                                    />
                                ))}
                            </View>
                            {/* Notes */}
                            <View style={{flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8}}>
                                <Text style={{fontFamily: fonts.mono, fontSize: 10.5, color: colors.inkMute, letterSpacing: 1.7, textTransform: 'uppercase'}}>{t('wizard.notes')}</Text>
                                <Text style={{fontFamily: fonts.mono, fontSize: 10, color: colors.inkMute, letterSpacing: 0.5}}>{t('wizard.notesHint')}</Text>
                            </View>
                            <View style={{
                                backgroundColor: colors.card, borderWidth: 1, borderColor: colors.rule,
                                borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, minHeight: 64, marginBottom: 22,
                            }}>
                                <TextInput
                                    value={sheetNotes}
                                    onChangeText={setSheetNotes}
                                    placeholder={t('wizard.partNotesPlaceholder')}
                                    placeholderTextColor={colors.inkMute}
                                    multiline
                                    style={{fontFamily: fonts.body, fontSize: 13.5, color: colors.ink, lineHeight: 20}}
                                />
                            </View>
                            {/* Remove section (edit mode only) */}
                            {isEdit && draft.parts.length > 1 && (
                                <View style={{paddingTop: 18, marginBottom: 4}}>
                                    <View style={{
                                        height: 0, borderWidth: 1, borderStyle: 'dashed',
                                        borderColor: colors.rule, marginBottom: 18,
                                    }}/>
                                    <Pressable
                                        onPress={confirmRemove}
                                        style={{
                                            width: '100%', flexDirection: 'row',
                                            alignItems: 'center', justifyContent: 'center', gap: 8,
                                            borderWidth: 1.5, borderColor: colors.brick,
                                            borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14,
                                        }}
                                    >
                                            <Icon name="trash" size={16} color={colors.brick}/>
                                        <Text style={{fontFamily: fonts.bodySb, fontSize: 14, color: colors.brick}}>{t('wizard.removeThisPart')}</Text>
                                    </Pressable>
                                    <Text style={{
                                        fontFamily: fonts.mono, fontSize: 10, color: colors.inkMute,
                                        letterSpacing: 0.5, textAlign: 'center', marginTop: 8,
                                    }}>
                                        {t('wizard.removeWarning', { count: draft.parts.find(p => p.id === editingPartId)?.sequences.length ?? 0 })}
                                    </Text>
                                </View>
                            )}
                        </ScrollView>
                        {/* Footer */}
                        <View style={{
                            flexDirection: 'row', gap: 10,
                            paddingHorizontal: 22, paddingTop: 12,
                            borderTopWidth: 1, borderTopColor: colors.rule,
                            backgroundColor: colors.bg,
                        }}>
                            <Btn variant="ghost" size="lg" onPress={closeSheet}>{t('common.cancel')}</Btn>
                            <View style={{flex: 1}}>
                                <Btn
                                    variant="primary" size="lg"
                                    icon={isEdit ? 'check' : 'plus'}
                                    full
                                    onPress={isEdit ? confirmEdit : confirmAdd}
                                >
                                    {isEdit ? t('wizard.saveChanges') : t('wizard.addPartConfirm')}
                                </Btn>
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    )

    return (
        <View style={{flex: 1}}>
            {isEmpty ? emptyState : populatedState}
            {partSheet}
        </View>
    )
}

// ── Step 3 ─────────────────────────────────────────────────────
type Step3Focus = { partIdx: number; seqId: string }

function Step3({draft, onChange, initialFocus, onFocusConsumed}: {
    draft: Draft
    onChange: (d: Draft) => void
    initialFocus?: Step3Focus | null
    onFocusConsumed?: () => void
}) {
    const { t } = useTranslation()
    const {colors, fonts, spacing} = useTheme()
    const recordStitchUsed = useSettingsStore(s => s.recordStitchUsed)

    const [activePart, setActivePart] = useState(0)
    const [activeRow, setActiveRow] = useState<{partIdx: number; seqIdx: number; rowIdx: number} | null>(null)
    const [showStitchPicker, setShowStitchPicker] = useState(false)
    const [showDefineCustom, setShowDefineCustom] = useState(false)
    const [showRowPicker, setShowRowPicker] = useState(false)
    const [rowPickerSeqIdx, setRowPickerSeqIdx] = useState<number | null>(null)
    const [showSeqPicker, setShowSeqPicker] = useState(false)
    const [focusedSeq, setFocusedSeq] = useState<number | null>(null)
    const [collapsedSeqs, setCollapsedSeqs] = useState<Set<string>>(new Set())
    const [confirmDialog, setConfirmDialog] = useState<{seqIdx: number; rowIdx: number} | null>(null)
    const [confirmSeqDialog, setConfirmSeqDialog] = useState<{seqIdx: number} | null>(null)
    const [marking, setMarking] = useState<{
        partIdx: number; seqIdx: number; rowIdx: number
        step: 'start' | 'end'
        start: number | null
    } | null>(null)

    React.useEffect(() => {
        if (!initialFocus) return
        const {partIdx, seqId} = initialFocus
        if (partIdx >= 0 && partIdx < draft.parts.length) {
            setActivePart(partIdx)
            const seqIdx = draft.parts[partIdx]!.sequences.findIndex(s => s.id === seqId)
            setFocusedSeq(seqIdx >= 0 ? seqIdx : null)
            setActiveRow(null)
        }
        onFocusConsumed?.()
    }, [initialFocus])

    const libraryRows      = useLibraryStore(s => s.rows)
    const librarySequences = useLibraryStore(s => s.sequences)
    const libraryPatterns  = useLibraryStore(s => s.patterns)

    const toggleSeqCollapse = (seqId: string) => {
        setCollapsedSeqs(prev => {
            const next = new Set(prev)
            next.has(seqId) ? next.delete(seqId) : next.add(seqId)
            return next
        })
    }

    const part = draft.parts[activePart]

    // Dock stitches — snapshot of most-recently-used (for current craft), falling back to defaults.
    // Snapshot is refreshed on mount, on craft change, and when the full picker closes —
    // but NOT while the user is tapping dock tiles, so the order stays stable mid-row.
    const computeDockIds = useCallback((): string[] => {
        const QUICK_KNIT    = ['k', 'p', 'yo', 'k2tog', 'ssk', 'sl']
        const QUICK_CROCHET = ['sc', 'dc', 'hdc', 'ch', 'slst', 'tr']
        const dockDefaults  = draft.craft === 'knit' ? QUICK_KNIT : QUICK_CROCHET
        const recent = useSettingsStore.getState().recentStitchIds.filter(id => STITCH_MAP[id]?.type === draft.craft)
        const ids: string[] = [...recent]
        for (const id of dockDefaults) {
            if (ids.length >= 6) break
            if (!ids.includes(id)) ids.push(id)
        }
        return ids.slice(0, 6)
    }, [draft.craft])

    const [dockIds, setDockIds] = useState<string[]>(() => computeDockIds())

    React.useEffect(() => {
        setDockIds(computeDockIds())
    }, [computeDockIds])

    const prevShowStitchPicker = useRef(showStitchPicker)
    React.useEffect(() => {
        if (prevShowStitchPicker.current && !showStitchPicker) {
            setDockIds(computeDockIds())
        }
        prevShowStitchPicker.current = showStitchPicker
    }, [showStitchPicker, computeDockIds])

    const dockStitches = dockIds
        .map(id => STITCH_MAP[id])
        .filter((s): s is NonNullable<typeof s> => !!s)

    const totalStitchCount = STITCHES.filter(s => s.type === draft.craft).length

    const addRow = (seqIdx: number) => {
        const seq = part!.sequences[seqIdx]!
        const newRow: DraftRow = {id: uuid4(), label: t('wizard.rowLabel', { n: seq.rows.length + 1 }), stitches: []}
        const newRowIdx = seq.rows.length
        updateSeq(activePart, seqIdx, {...seq, rows: [...seq.rows, newRow]})
        setActiveRow({partIdx: activePart, seqIdx, rowIdx: newRowIdx})
        setShowStitchPicker(false)
    }

    const addRowFromLib = (seqIdx: number, libRow: LibraryRow) => {
        const seq = part!.sequences[seqIdx]!
        const newRow: DraftRow = {id: uuid4(), label: libRow.label, stitches: libRow.stitches, segments: libRow.segments}
        const newRowIdx = seq.rows.length
        updateSeq(activePart, seqIdx, {...seq, rows: [...seq.rows, newRow]})
        setActiveRow({partIdx: activePart, seqIdx, rowIdx: newRowIdx})
        setShowRowPicker(false)
    }

    const addSeqFromLib = (libSeq: LibrarySequence) => {
        const newSeq: DraftSequence = {
            id: uuid4(), name: libSeq.name,
            rows: libSeq.rows.map(r => ({id: uuid4(), label: r.label, stitches: r.stitches, segments: r.segments})),
            totalRepeats: libSeq.totalRepeats,
            loop: libSeq.loop,
        }
        const updatedPart = {...part!, sequences: [...part!.sequences, newSeq]}
        onChange({...draft, parts: draft.parts.map((p, i) => i === activePart ? updatedPart : p)})
        setShowSeqPicker(false)
    }

    const addPatternFromLib = (libPat: LibraryPattern) => {
        const newSeqs: DraftSequence[] = libPat.sequenceIds
            .map(id => librarySequences.find(s => s.id === id))
            .filter((s): s is LibrarySequence => Boolean(s))
            .map(libSeq => ({
                id: uuid4(), name: libSeq.name,
                rows: libSeq.rows.map(r => ({id: uuid4(), label: r.label, stitches: r.stitches, segments: r.segments})),
                totalRepeats: libSeq.totalRepeats,
                loop: libSeq.loop,
            }))
        const updatedPart = {...part!, sequences: [...part!.sequences, ...newSeqs]}
        onChange({...draft, parts: draft.parts.map((p, i) => i === activePart ? updatedPart : p)})
        setShowSeqPicker(false)
    }

    const removeRow = (seqIdx: number, rowIdx: number) => {
        const seq = part!.sequences[seqIdx]!
        updateSeq(activePart, seqIdx, {...seq, rows: seq.rows.filter((_, i) => i !== rowIdx)})
        if (activeRow?.seqIdx === seqIdx && activeRow?.rowIdx === rowIdx) setActiveRow(null)
        if (marking?.seqIdx === seqIdx && marking?.rowIdx === rowIdx) setMarking(null)
    }

    const confirmRemoveRow = (seqIdx: number, rowIdx: number) => {
        setConfirmDialog({seqIdx, rowIdx})
    }

    const executeRemoveRow = () => {
        if (!confirmDialog) return
        removeRow(confirmDialog.seqIdx, confirmDialog.rowIdx)
        setConfirmDialog(null)
    }

    const removeSeq = (seqIdx: number) => {
        const updatedPart = {...part!, sequences: part!.sequences.filter((_, i) => i !== seqIdx)}
        onChange({...draft, parts: draft.parts.map((p, i) => i === activePart ? updatedPart : p)})
        setFocusedSeq(null)
        if (activeRow?.seqIdx === seqIdx) setActiveRow(null)
        else if (activeRow && activeRow.seqIdx > seqIdx) setActiveRow({...activeRow, seqIdx: activeRow.seqIdx - 1})
        if (marking?.seqIdx === seqIdx) setMarking(null)
    }

    const confirmRemoveSeq = (seqIdx: number) => setConfirmSeqDialog({seqIdx})

    const executeRemoveSeq = () => {
        if (!confirmSeqDialog) return
        removeSeq(confirmSeqDialog.seqIdx)
        setConfirmSeqDialog(null)
    }

    const removeLastStitch = (seqIdx: number, rowIdx: number) => {
        const seq = part!.sequences[seqIdx]!
        const row = seq.rows[rowIdx]!
        if (row.stitches.length === 0) return
        const nextRow = removeLastStitchPreservingSegments(row)
        updateSeq(activePart, seqIdx, {
            ...seq,
            rows: seq.rows.map((r, i) => i === rowIdx ? nextRow as DraftRow : r),
        })
    }

    const addSeq = () => {
        const newSeq: DraftSequence = {
            id: uuid4(), name: t('wizard.sequenceLabel', { n: part!.sequences.length + 1 }),
            rows: [], totalRepeats: 1, loop: false,
        }
        const updatedPart = {...part!, sequences: [...part!.sequences, newSeq]}
        onChange({...draft, parts: draft.parts.map((p, i) => i === activePart ? updatedPart : p)})
    }

    const updateSeq = (partIdx: number, seqIdx: number, seq: DraftSequence) => {
        const updatedPart = {
            ...draft.parts[partIdx]!,
            sequences: draft.parts[partIdx]!.sequences.map((s, i) => i === seqIdx ? seq : s),
        }
        onChange({...draft, parts: draft.parts.map((p, i) => i === partIdx ? updatedPart : p)})
    }

    const addStitchToRow = (partIdx: number, seqIdx: number, rowIdx: number, stitchId: string) => {
        const seq = draft.parts[partIdx]!.sequences[seqIdx]!
        const row = seq.rows[rowIdx]!
        const nextRow = appendStitchPreservingSegments(row, stitchId)
        updateSeq(partIdx, seqIdx, {...seq, rows: seq.rows.map((r, i) => i === rowIdx ? nextRow as DraftRow : r)})
        recordStitchUsed(stitchId)
    }

    const startMarking = (seqIdx: number, rowIdx: number) => {
        const seq = part!.sequences[seqIdx]!
        const row = seq.rows[rowIdx]!
        if (row.stitches.length === 0) return
        if (row.segments) {
            const {segments: _drop, ...rest} = row
            updateSeq(activePart, seqIdx, {
                ...seq,
                rows: seq.rows.map((r, i) => i === rowIdx ? (rest as DraftRow) : r),
            })
        }
        setActiveRow(null)
        setShowStitchPicker(false)
        setMarking({partIdx: activePart, seqIdx, rowIdx, step: 'start', start: null})
    }

    const cancelMarking = () => setMarking(null)

    const handleMarkTap = (tileIdx: number) => {
        if (!marking) return
        if (marking.step === 'start') {
            setMarking({...marking, step: 'end', start: tileIdx})
            return
        }
        const start = marking.start
        if (start == null || tileIdx < start) return
        const seq = draft.parts[marking.partIdx]!.sequences[marking.seqIdx]!
        const row = seq.rows[marking.rowIdx]!
        const segments = segmentsFromMark(row.stitches, start, tileIdx)
        updateSeq(marking.partIdx, marking.seqIdx, {
            ...seq,
            rows: seq.rows.map((r, i) => i === marking.rowIdx ? ({...r, segments} as DraftRow) : r),
        })
        setMarking(null)
    }

    const handlePickerSelect = (stitch: StitchDef) => {
        if (!activeRow) return
        addStitchToRow(activeRow.partIdx, activeRow.seqIdx, activeRow.rowIdx, stitch.id)
        setShowStitchPicker(false)
    }

    if (!part) return null

    const dockVisible = activeRow !== null && !showStitchPicker && marking === null

    return (
        <View style={{flex: 1}}>
            <ScrollView
                contentContainerStyle={{paddingHorizontal: spacing[5], paddingBottom: dockVisible ? 220 : 160}}
                keyboardShouldPersistTaps="handled"
            >
                {/* Part tabs */}
                {draft.parts.length > 1 && (
                    <View style={[styles.tabRow2, {backgroundColor: colors.cream2, borderRadius: 12, marginBottom: spacing[4]}]}>
                        {draft.parts.map((p, i) => (
                            <Pressable
                                key={p.id}
                                onPress={() => { setActivePart(i); setActiveRow(null); setFocusedSeq(null) }}
                                style={[styles.tabBtn2, {
                                    flexDirection: 'row', gap: 5,
                                    backgroundColor: activePart === i ? colors.card : 'transparent',
                                    borderRadius: 9,
                                    ...(activePart === i ? {
                                        shadowColor: '#000',
                                        shadowOffset: {width: 0, height: 1},
                                        shadowOpacity: 0.06,
                                        shadowRadius: 3,
                                        elevation: 1,
                                    } : {}),
                                }]}
                            >
                                <Text style={{fontFamily: fonts.bodySb, fontSize: 12, color: activePart === i ? colors.brick : colors.inkSoft}}>
                                    {p.name}
                                </Text>
                                <Text style={{
                                    fontFamily: fonts.mono, fontSize: 9.5, fontWeight: '700', color: colors.inkMute,
                                    backgroundColor: activePart === i ? colors.cream2 : 'transparent',
                                    paddingHorizontal: activePart === i ? 5 : 0, paddingVertical: 1,
                                    borderRadius: 5, letterSpacing: 0.5,
                                }}>
                                    {p.sequences.length}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                )}

                <View style={{gap: 18}}>
                {part.sequences.map((seq, si) => {
                    const seqColor = [colors.mustard, colors.brick, colors.forest][si % 3]!
                    const totalSts = seq.rows.reduce((sum, r) => sum + r.stitches.reduce((s2, st) => s2 + st.count, 0), 0)
                    const seqHasRepeat = seq.rows.some(r => !!r.segments)
                    const isEditing = focusedSeq === si
                    const seqDimmed = marking !== null && marking.seqIdx !== si
                    return (
                    <View key={seq.id} style={{
                        opacity: seqDimmed ? 0.3 : 1,
                    }} pointerEvents={seqDimmed ? 'none' : 'auto'}>
                        {/* Sequence header */}
                        <View
                            style={{
                                backgroundColor: colors.card,
                                borderWidth: isEditing ? 2 : 1,
                                borderColor: isEditing ? colors.brick : colors.rule,
                                borderRadius: 16,
                                paddingVertical: 12, paddingHorizontal: 14,
                                marginBottom: 8,
                                ...(isEditing ? {
                                    shadowColor: colors.brick,
                                    shadowOpacity: 0.07,
                                    shadowRadius: 6,
                                    shadowOffset: {width: 0, height: 0},
                                    elevation: 2,
                                } : {}),
                            }}
                        >
                            <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                                {/* Numbered colour tile */}
                                <View style={{
                                    width: 32, height: 32, borderRadius: 9,
                                    backgroundColor: seqColor,
                                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                    shadowColor: seqColor,
                                    shadowOffset: {width: 0, height: 4},
                                    shadowOpacity: 0.35,
                                    shadowRadius: 4,
                                    elevation: 4,
                                }}>
                                    <Text style={{fontFamily: fonts.display, fontSize: 16, color: '#FBF6EC'}}>
                                        {si + 1}
                                    </Text>
                                </View>

                                {/* Name + subtitle */}
                                <View style={{flex: 1, minWidth: 0}}>
                                    {isEditing ? (
                                        <TextInput
                                            value={seq.name}
                                            onChangeText={(t) => updateSeq(activePart, si, {...seq, name: t})}
                                            onBlur={() => setFocusedSeq(null)}
                                            autoFocus
                                            cursorColor={colors.brick}
                                            selectionColor={colors.brick}
                                            style={{
                                                fontFamily: fonts.displayInput, fontSize: 20,
                                                color: colors.ink, letterSpacing: -0.2,
                                                padding: 0, margin: 0,
                                            }}
                                        />
                                    ) : (
                                        <Text style={{
                                            fontFamily: fonts.display, fontSize: 20,
                                            color: colors.ink, letterSpacing: -0.2, lineHeight: 24,
                                        }} numberOfLines={1}>
                                            {seq.name}
                                        </Text>
                                    )}
                                    <Text style={{fontFamily: fonts.mono, fontSize: 10.5, color: colors.inkMute, marginTop: 3}}>
                                        {t('common.rows', { count: seq.rows.length })} · {t('common.sts', { count: totalSts })}{seqHasRepeat ? '+' : ''}
                                        {seqHasRepeat && (
                                            <Text style={{color: colors.brick}}>{t('wizard.step3HasRepeatSuffix')}</Text>
                                        )}
                                        {isEditing && (
                                            <Text style={{color: colors.brick, fontWeight: '700'}}>{t('wizard.step3EditingMark')}</Text>
                                        )}
                                    </Text>
                                </View>

                                {/* Editing → destructive Delete pill; otherwise → edit + chevron */}
                                {isEditing ? (
                                    <Pressable
                                        onPress={() => confirmRemoveSeq(si)}
                                        hitSlop={6}
                                        style={{
                                            flexDirection: 'row', alignItems: 'center', gap: 5,
                                            backgroundColor: '#FBEFEA',
                                            borderWidth: 1, borderColor: 'rgba(156,61,46,0.22)',
                                            borderRadius: 9, paddingHorizontal: 9, paddingVertical: 6,
                                            flexShrink: 0,
                                        }}
                                    >
                                        <Icon name="trash" size={13} color={colors.brick}/>
                                        <Text style={{
                                            fontFamily: fonts.mono, fontSize: 9.5, fontWeight: '700',
                                            color: colors.brick, letterSpacing: 1.4, textTransform: 'uppercase',
                                        }}>{t('common.delete')}</Text>
                                    </Pressable>
                                ) : (
                                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 0}}>
                                        <Pressable onPress={() => setFocusedSeq(si)} hitSlop={8}>
                                            <Icon name="edit" size={16} color={colors.inkSoft}/>
                                        </Pressable>
                                        <Pressable onPress={() => toggleSeqCollapse(seq.id)} hitSlop={8}>
                                            <Icon
                                                name={collapsedSeqs.has(seq.id) ? 'chevR' : 'chevDown'}
                                                size={16}
                                                color={colors.inkSoft}
                                            />
                                        </Pressable>
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* Row cards + Add row — indented with left-border accent */}
                        {(!collapsedSeqs.has(seq.id) || isEditing) && (
                        <View style={{gap: 8, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: colors.cream2, marginLeft: 6}}>
                            {seq.rows.map((row, ri) => {
                                const isActive = activeRow?.partIdx === activePart && activeRow?.seqIdx === si && activeRow?.rowIdx === ri
                                const totalSts = row.stitches.reduce((sum, s) => sum + s.count, 0)
                                const empty = totalSts === 0
                                const isMarkingThisRow = marking?.partIdx === activePart && marking?.seqIdx === si && marking?.rowIdx === ri
                                const rowDimmed = marking !== null && marking.seqIdx === si && !isMarkingThisRow
                                const rowHasRepeat = !!row.segments
                                const repeatIconActive = rowHasRepeat || isMarkingThisRow
                                return (
                                    <Pressable
                                        key={row.id}
                                        onPress={() => {
                                            if (marking !== null) return
                                            setActiveRow({partIdx: activePart, seqIdx: si, rowIdx: ri})
                                            setShowStitchPicker(false)
                                        }}
                                        style={{
                                            backgroundColor: colors.card,
                                            borderWidth: isActive || isMarkingThisRow ? 2 : 1,
                                            borderColor: isActive || isMarkingThisRow ? colors.brick : colors.rule,
                                            borderRadius: 14,
                                            paddingVertical: 10, paddingHorizontal: 12,
                                            opacity: rowDimmed ? 0.35 : 1,
                                        }}
                                        pointerEvents={rowDimmed ? 'none' : 'auto'}
                                    >
                                        {/* Row header row */}
                                        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: empty && !rowHasRepeat && !isMarkingThisRow ? 0 : 10, gap: 8}}>
                                            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, flexWrap: 'wrap'}}>
                                                <Icon name="grip" size={14} color={colors.inkMute}/>
                                                <Text style={{fontFamily: fonts.bodySb, fontSize: 13, color: isActive || isMarkingThisRow ? colors.brick : colors.ink}}>
                                                    {row.label}{(isActive || isMarkingThisRow) ? ' ✱' : ''}
                                                </Text>
                                                <Text style={{fontFamily: fonts.mono, fontSize: 10, color: colors.inkMute}}>
                                                    · {t('common.sts', { count: totalSts })}
                                                </Text>
                                                {rowHasRepeat && (
                                                    <View style={{
                                                        flexDirection: 'row', alignItems: 'center', gap: 3,
                                                        backgroundColor: '#FBEFEA',
                                                        borderWidth: 1, borderColor: 'rgba(156,61,46,0.18)',
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
                                            <View style={{flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 0}}>
                                                <Pressable
                                                    onPress={() => startMarking(si, ri)}
                                                    hitSlop={8}
                                                    disabled={empty}
                                                    style={{
                                                        width: 26, height: 26, borderRadius: 8,
                                                        alignItems: 'center', justifyContent: 'center',
                                                        backgroundColor: repeatIconActive ? '#FBEFEA' : 'transparent',
                                                        borderWidth: 1,
                                                        borderColor: repeatIconActive ? 'rgba(156,61,46,0.24)' : 'transparent',
                                                        opacity: empty ? 0.35 : 1,
                                                    }}
                                                >
                                                    <Icon name="repeat" size={14} color={repeatIconActive ? colors.brick : colors.inkMute} stroke={2}/>
                                                </Pressable>
                                                <Pressable onPress={() => removeLastStitch(si, ri)} hitSlop={8}>
                                                    <Icon name="backspace" size={14} color={colors.inkMute}/>
                                                </Pressable>
                                                <Pressable onPress={() => confirmRemoveRow(si, ri)} hitSlop={8}>
                                                    <Icon name="trash" size={14} color={colors.inkMute}/>
                                                </Pressable>
                                            </View>
                                        </View>
                                        {/* Body: marking → tappable expanded tiles, segments → RepeatRowBody, else flat chips */}
                                        {isMarkingThisRow ? (() => {
                                            const tiles = expandStitches(row.stitches)
                                            return (
                                                <View>
                                                    <View style={{
                                                        flexDirection: 'row', alignItems: 'center', gap: 9,
                                                        marginBottom: 16,
                                                        backgroundColor: '#FBEFEA',
                                                        borderWidth: 1, borderColor: 'rgba(156,61,46,0.2)',
                                                        borderRadius: 11, paddingVertical: 8, paddingHorizontal: 11,
                                                    }}>
                                                        <View style={{
                                                            width: 22, height: 22, borderRadius: 11,
                                                            backgroundColor: colors.brick,
                                                            alignItems: 'center', justifyContent: 'center',
                                                        }}>
                                                            <Text style={{fontFamily: fonts.display, fontSize: 13, color: '#FBF6EC', lineHeight: 16}}>
                                                                {marking!.step === 'start' ? '1' : '2'}
                                                            </Text>
                                                        </View>
                                                        <Text style={{
                                                            flex: 1, fontFamily: fonts.bodySb, fontSize: 13, color: colors.ink, letterSpacing: -0.05,
                                                        }}>
                                                            {marking!.step === 'start' ? t('wizard.step3MarkStartInRow') : t('wizard.step3MarkEndInRow')}
                                                        </Text>
                                                    </View>
                                                    <View style={{flexDirection: 'row', flexWrap: 'wrap', rowGap: 18, columnGap: 4}}>
                                                        {tiles.map((id, idx) => {
                                                            let state: 'tap' | 'start' | 'dim' = 'tap'
                                                            if (idx === marking!.start) state = 'start'
                                                            else if (marking!.step === 'end' && marking!.start !== null && idx < marking!.start) state = 'dim'
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
                                                        {marking!.step === 'start' ? t('wizard.step3MarkStartHint') : t('wizard.step3MarkEndHint')}
                                                    </Text>
                                                </View>
                                            )
                                        })() : row.segments ? (
                                            <RepeatRowBody segments={row.segments}/>
                                        ) : !empty ? (
                                            <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 3}}>
                                                {row.stitches.flatMap((si_item, idx) => {
                                                    const def = STITCH_MAP[si_item.stitchId]
                                                    if (!def) return []
                                                    const chipColor = STITCH_BRICK.has(si_item.stitchId) ? colors.brick
                                                                    : STITCH_MUSTARD.has(si_item.stitchId) ? colors.mustard
                                                                    : colors.forest
                                                    return Array.from({length: si_item.count}, (_, i) => (
                                                        <View key={`${idx}-${i}`} style={{
                                                            width: 26, height: 36, borderRadius: 6,
                                                            backgroundColor: colors.cream2,
                                                            borderWidth: 1.2, borderColor: chipColor,
                                                            alignItems: 'center', justifyContent: 'center',
                                                            gap: 1, paddingVertical: 2,
                                                        }}>
                                                            <StitchGlyph symbol={def.symbol} size={13} color={chipColor} strokeWidth={1.8}/>
                                                            <Text style={{
                                                                fontFamily: fonts.mono, fontSize: 7.5, color: chipColor,
                                                                fontWeight: '700', letterSpacing: -0.3, lineHeight: 9,
                                                            }}>{def.abbr}</Text>
                                                        </View>
                                                    ))
                                                })}
                                            </View>
                                        ) : (
                                            <Text style={{fontFamily: fonts.mono, fontSize: 11, color: colors.inkMute, fontStyle: 'italic', paddingTop: 6, paddingBottom: 2}}>
                                                {t('wizard.step3EmptyRow')}
                                            </Text>
                                        )}
                                    </Pressable>
                                )
                            })}

                            {/* Add row — split ReuseChooser, inside the bordered container */}
                            <View style={{flexDirection: 'row', gap: 8, marginTop: 2}}>
                                <Pressable
                                    onPress={() => addRow(si)}
                                    style={{flex: 1.1, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.brick, borderRadius: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6}}
                                >
                                    <Icon name="plus" size={14} color={colors.brick}/>
                                    <Text style={{fontFamily: fonts.bodySb, fontSize: 13, color: colors.brick}}>{t('wizard.step3NewRow')}</Text>
                                </Pressable>
                                <Pressable
                                    onPress={() => { setRowPickerSeqIdx(si); setShowRowPicker(true) }}
                                    style={{flex: 1, borderWidth: 1, borderColor: colors.rule, backgroundColor: colors.card, borderRadius: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6}}
                                >
                                    <Icon name="library" size={14} color={colors.mustardDk}/>
                                    <Text style={{fontFamily: fonts.bodySb, fontSize: 13, color: colors.ink}}>{t('wizard.step3RowFromLib')}</Text>
                                    <View style={{backgroundColor: colors.cream2, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1}}>
                                        <Text style={{fontFamily: fonts.mono, fontSize: 10, color: colors.inkMute, fontWeight: '700', letterSpacing: 0.5}}>{libraryRows.length}</Text>
                                    </View>
                                </Pressable>
                            </View>
                        </View>
                        )}
                    </View>
                    )
                })}
                </View>

                {/* Add sequence — ReuseChooser */}
                <View
                    style={{flexDirection: 'row', gap: 8, marginTop: 16, opacity: marking !== null ? 0.3 : 1}}
                    pointerEvents={marking !== null ? 'none' : 'auto'}
                >
                    <Pressable
                        onPress={addSeq}
                        style={{
                            flex: 1.1, borderWidth: 1.5, borderStyle: 'dashed',
                            borderColor: colors.brick, borderRadius: 14,
                            paddingVertical: 12, flexDirection: 'row',
                            alignItems: 'center', justifyContent: 'center', gap: 6,
                        }}
                    >
                        <Icon name="plus" size={14} color={colors.brick}/>
                        <Text style={{fontFamily: fonts.bodySb, fontSize: 13, color: colors.brick}}>{t('wizard.step3NewSequence')}</Text>
                    </Pressable>
                    <Pressable
                        onPress={() => setShowSeqPicker(true)}
                        style={{
                            flex: 1, borderWidth: 1, borderColor: colors.rule,
                            backgroundColor: colors.card, borderRadius: 14,
                            paddingVertical: 12, flexDirection: 'row',
                            alignItems: 'center', justifyContent: 'center', gap: 6,
                        }}
                    >
                        <Icon name="library" size={14} color={colors.mustardDk}/>
                        <Text style={{fontFamily: fonts.bodySb, fontSize: 13, color: colors.ink}}>{t('wizard.step3SeqFromLib')}</Text>
                        <View style={{backgroundColor: colors.cream2, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1}}>
                            <Text style={{fontFamily: fonts.mono, fontSize: 10, color: colors.inkMute, fontWeight: '700', letterSpacing: 0.5}}>{librarySequences.length + libraryPatterns.length}</Text>
                        </View>
                    </Pressable>
                </View>

                {/* Tip — one per screen, below add-sequence */}
                <View style={{
                    marginTop: 14, paddingVertical: 10, paddingHorizontal: 12,
                    backgroundColor: colors.cream2, borderRadius: 12,
                    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
                    opacity: marking !== null ? 0.3 : 1,
                }}>
                    <Icon name="bulb" size={14} color={colors.mustardDk}/>
                    <Text style={{fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft, flex: 1, lineHeight: 18}}>
                        <Text style={{fontWeight: '700', color: colors.ink}}>{t('common.tip')} </Text>
                        {t('wizard.step3TipBody')}
                    </Text>
                </View>
            </ScrollView>

            {/* Stitch dock — pinned above wizard footer */}
            {dockVisible && (
                <View style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.rule,
                    paddingTop: 10, paddingBottom: 10, paddingHorizontal: 20,
                }}>
                    <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8}}>
                        <Text style={{fontFamily: fonts.mono, fontSize: 10, color: colors.brick, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase'}}>
                            {t('wizard.step3TapToAdd', { name: draft.parts[activeRow!.partIdx]?.sequences[activeRow!.seqIdx]?.name ?? '', rowNumber: activeRow!.rowIdx + 1 })}
                        </Text>
                        <Pressable onPress={() => setShowStitchPicker(true)} style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
                            <Text style={{fontFamily: fonts.mono, fontSize: 11, color: colors.brick, fontWeight: '700'}}>
                                {t('wizard.step3AllStitches', { count: totalStitchCount })}
                            </Text>
                            <Icon name="chevR" size={12} color={colors.brick}/>
                        </Pressable>
                    </View>
                    <View style={{flexDirection: 'row', gap: 6}}>
                        {dockStitches.map((s, idx) => {
                            const tileColor = [colors.brick, colors.mustard, colors.forest][idx % 3]!
                            return (
                                <Pressable
                                    key={s.id}
                                    onPress={() => addStitchToRow(activeRow!.partIdx, activeRow!.seqIdx, activeRow!.rowIdx, s.id)}
                                    style={{flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.rule, borderRadius: 10, paddingVertical: 6, alignItems: 'center', gap: 3}}
                                >
                                    <View style={{width: 28, height: 28, borderRadius: 8, backgroundColor: tileColor, alignItems: 'center', justifyContent: 'center'}}>
                                        <StitchGlyph symbol={s.symbol} size={16} color="#FBF6EC"/>
                                    </View>
                                    <Text style={{fontSize: 9.5, fontFamily: fonts.mono, color: colors.inkSoft, fontWeight: '700'}}>{s.abbr}</Text>
                                </Pressable>
                            )
                        })}
                    </View>
                </View>
            )}

            {/* Mark-a-repeat instruction bar — replaces the dock while marking */}
            {marking && (
                <View style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.rule,
                    paddingVertical: 12, paddingHorizontal: 20,
                }}>
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                        <Icon name="repeat" size={16} color={colors.brick} stroke={2}/>
                        <Text style={{flex: 1, fontFamily: fonts.bodySb, fontSize: 13.5, color: colors.ink}}>
                            <Text style={{fontFamily: fonts.mono, color: colors.brick, fontWeight: '700'}}>
                                {t('wizard.step3MarkStepIndicator', { current: marking.step === 'start' ? 1 : 2, total: 2 })}
                            </Text>
                            {'  '}
                            {marking.step === 'start' ? t('wizard.step3MarkStart') : t('wizard.step3MarkEnd')}
                        </Text>
                        <Pressable
                            onPress={cancelMarking}
                            style={{
                                borderWidth: 1, borderColor: colors.rule, borderRadius: 9,
                                paddingHorizontal: 12, paddingVertical: 6,
                            }}
                        >
                            <Text style={{fontFamily: fonts.bodySb, fontSize: 12.5, color: colors.inkSoft}}>
                                {t('wizard.step3MarkCancel')}
                            </Text>
                        </Pressable>
                    </View>
                </View>
            )}

            {/* Full stitch picker modal */}
            <StitchPickerModal
                visible={showStitchPicker}
                onClose={() => setShowStitchPicker(false)}
                onSelect={handlePickerSelect}
                onDefineCustom={() => { setShowStitchPicker(false); setShowDefineCustom(true) }}
                craftFilter={draft.craft}
            />

            {/* Define custom stitch screen */}
            <DefineCustomStitchScreen
                visible={showDefineCustom}
                onClose={() => setShowDefineCustom(false)}
                onSaved={(_id) => {
                    setShowDefineCustom(false)
                    setShowStitchPicker(true)
                }}
                defaultCraft={draft.craft}
            />

            {/* Row library picker */}
            <RowPickerModal
                visible={showRowPicker}
                onClose={() => setShowRowPicker(false)}
                onSelect={(row) => {
                    if (rowPickerSeqIdx !== null) addRowFromLib(rowPickerSeqIdx, row)
                }}
                onBuildNew={() => {
                    setShowRowPicker(false)
                    if (rowPickerSeqIdx !== null) addRow(rowPickerSeqIdx)
                }}
                craftFilter={draft.craft}
            />

            {/* Sequence / Pattern library picker */}
            <SeqPickerModal
                visible={showSeqPicker}
                onClose={() => setShowSeqPicker(false)}
                onSelectSequence={addSeqFromLib}
                onSelectPattern={addPatternFromLib}
                onBuildNew={() => { setShowSeqPicker(false); addSeq() }}
                craftFilter={draft.craft}
            />

            {/* Remove-row confirm dialog */}
            {confirmDialog && (() => {
                const diagSeq = part?.sequences[confirmDialog.seqIdx]
                const diagRow = diagSeq?.rows[confirmDialog.rowIdx]
                const totalSts = diagRow?.stitches.reduce((s, inst) => s + inst.count, 0) ?? 0
                // Expand StitchInstances into individual chips, capped so they don't overflow
                const MAX_CHIPS = 14
                const chips: {stitchId: string}[] = []
                for (const inst of diagRow?.stitches ?? []) {
                    for (let i = 0; i < inst.count && chips.length < MAX_CHIPS; i++) {
                        chips.push({stitchId: inst.stitchId})
                    }
                }
                const overflow = totalSts > MAX_CHIPS ? totalSts - MAX_CHIPS : 0
                return (
                    <Modal visible transparent animationType="fade" onRequestClose={() => setConfirmDialog(null)}>
                        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
                            {/* Scrim */}
                            <BlurView
                                intensity={14}
                                tint="dark"
                                style={[StyleSheet.absoluteFillObject, {backgroundColor: 'rgba(43,24,16,0.42)'}]}
                            />
                            <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setConfirmDialog(null)}/>
                            {/* Dialog card */}
                            <View style={{
                                width: 320, maxWidth: '92%',
                                backgroundColor: colors.bg,
                                borderRadius: 22,
                                borderWidth: 1, borderColor: colors.rule,
                                overflow: 'hidden',
                                shadowColor: 'rgba(43,24,16,1)',
                                shadowOffset: {width: 0, height: 30},
                                shadowOpacity: 0.35,
                                shadowRadius: 60,
                                elevation: 20,
                                marginTop: -48, // slight upward bias for thumb reach
                            }}>
                                {/* Icon header — warm tint band */}
                                <View style={{
                                    paddingTop: 22, paddingHorizontal: 22, paddingBottom: 14,
                                    backgroundColor: '#FBEFEA',
                                    borderBottomWidth: 1,
                                    borderBottomColor: 'rgba(156,61,46,0.15)',
                                    alignItems: 'center', gap: 12,
                                }}>
                                    <View style={{
                                        width: 56, height: 56, borderRadius: 16,
                                        backgroundColor: colors.brick,
                                        alignItems: 'center', justifyContent: 'center',
                                        shadowColor: colors.brick,
                                        shadowOffset: {width: 0, height: 10},
                                        shadowOpacity: 0.45,
                                        shadowRadius: 14,
                                        elevation: 8,
                                        transform: [{rotate: '-4deg'}],
                                    }}>
                                        <Icon name="trash" size={26} color="#FBF6EC"/>
                                    </View>
                                    <View style={{alignItems: 'center', gap: 6}}>
                                        <Text style={{
                                            fontFamily: fonts.display, fontSize: 24, color: colors.brick,
                                            letterSpacing: -0.25, lineHeight: 26, textAlign: 'center',
                                        }}>
                                            {t('wizard.removeRowTitle')}
                                        </Text>
                                        <Text style={{
                                            fontFamily: fonts.mono, fontSize: 10.5, color: colors.inkMute,
                                            letterSpacing: 2, textTransform: 'uppercase',
                                        }}>
                                            {t('wizard.removeRowNoUndo', { count: totalSts })}
                                        </Text>
                                    </View>
                                </View>

                                {/* Row preview */}
                                <View style={{paddingTop: 14, paddingHorizontal: 20, paddingBottom: 4}}>
                                    <View style={{
                                        backgroundColor: colors.card,
                                        borderWidth: 1, borderColor: colors.rule,
                                        borderRadius: 12,
                                        paddingVertical: 10, paddingHorizontal: 12,
                                    }}>
                                        {/* Row meta */}
                                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8}}>
                                            <Text style={{fontFamily: fonts.bodySb, fontSize: 13, color: colors.ink}}>
                                                {diagRow?.label}
                                            </Text>
                                            <Text style={{fontFamily: fonts.mono, fontSize: 10.5, color: colors.inkMute}}>
                                                · {t('common.sts', { count: totalSts })}
                                            </Text>
                                            <View style={{flex: 1}}/>
                                            <Text style={{fontFamily: fonts.mono, fontSize: 10, color: colors.inkMute, letterSpacing: 0.6}}>
                                                {diagSeq?.name}
                                            </Text>
                                        </View>
                                        {/* Stitch chips preview */}
                                        <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 3}}>
                                            {chips.map((chip, i) => {
                                                const def = STITCH_MAP[chip.stitchId]
                                                if (!def) return null
                                                const c = STITCH_BRICK.has(chip.stitchId) ? colors.brick
                                                        : STITCH_MUSTARD.has(chip.stitchId) ? colors.mustard
                                                        : colors.forest
                                                return (
                                                    <View key={i} style={{
                                                        width: 22, height: 26, borderRadius: 6,
                                                        backgroundColor: colors.cream2,
                                                        borderWidth: 1.2, borderColor: c,
                                                        alignItems: 'center', justifyContent: 'center',
                                                        opacity: 0.7,
                                                    }}>
                                                        <StitchGlyph symbol={def.symbol} size={12} color={c} strokeWidth={1.8}/>
                                                    </View>
                                                )
                                            })}
                                            {overflow > 0 && (
                                                <View style={{
                                                    height: 26, borderRadius: 6,
                                                    backgroundColor: colors.cream2,
                                                    borderWidth: 1, borderColor: colors.rule,
                                                    alignItems: 'center', justifyContent: 'center',
                                                    paddingHorizontal: 6, opacity: 0.7,
                                                }}>
                                                    <Text style={{fontFamily: fonts.mono, fontSize: 9, color: colors.inkMute, fontWeight: '700'}}>
                                                        +{overflow}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                    <Text style={{
                                        marginTop: 10, fontSize: 13, color: colors.inkSoft,
                                        fontFamily: fonts.body, lineHeight: 19,
                                        textAlign: 'center', paddingHorizontal: 4,
                                    }}>
                                        {t('wizard.removeRowBody')}
                                    </Text>
                                </View>

                                {/* Buttons */}
                                <View style={{padding: 20, paddingTop: 16, gap: 8}}>
                                    <Pressable
                                        onPress={executeRemoveRow}
                                        style={{
                                            height: 48, borderRadius: 14,
                                            backgroundColor: colors.brick,
                                            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                                            shadowColor: colors.brick,
                                            shadowOffset: {width: 0, height: 8},
                                            shadowOpacity: 0.35,
                                            shadowRadius: 14,
                                            elevation: 6,
                                        }}
                                    >
                                        <Icon name="trash" size={16} color="#FBF6EC"/>
                                        <Text style={{fontFamily: fonts.bodySb, fontSize: 15, color: '#FBF6EC', letterSpacing: -0.1}}>
                                            {t('wizard.removeRowConfirm')}
                                        </Text>
                                    </Pressable>
                                    <Pressable
                                        onPress={() => setConfirmDialog(null)}
                                        style={{
                                            height: 44, borderRadius: 12,
                                            borderWidth: 1.5, borderColor: colors.rule,
                                            alignItems: 'center', justifyContent: 'center',
                                        }}
                                    >
                                        <Text style={{fontFamily: fonts.bodySb, fontSize: 14.5, color: colors.ink, letterSpacing: -0.1}}>
                                            {t('common.keepIt')}
                                        </Text>
                                    </Pressable>
                                </View>
                            </View>
                        </View>
                    </Modal>
                )
            })()}

            {/* Remove-sequence confirm dialog */}
            {confirmSeqDialog && (() => {
                const diagSeq = part?.sequences[confirmSeqDialog.seqIdx]
                const rowCount = diagSeq?.rows.length ?? 0
                const totalSts = diagSeq?.rows.reduce(
                    (sum, r) => sum + r.stitches.reduce((s2, st) => s2 + st.count, 0), 0,
                ) ?? 0
                const seqColor = [colors.mustard, colors.brick, colors.forest][confirmSeqDialog.seqIdx % 3]!
                const MAX_CHIPS_PER_ROW = 24
                return (
                    <Modal visible transparent animationType="fade" onRequestClose={() => setConfirmSeqDialog(null)}>
                        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
                            {/* Scrim */}
                            <BlurView
                                intensity={14}
                                tint="dark"
                                style={[StyleSheet.absoluteFillObject, {backgroundColor: 'rgba(43,24,16,0.42)'}]}
                            />
                            <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setConfirmSeqDialog(null)}/>
                            {/* Dialog card */}
                            <View style={{
                                width: 320, maxWidth: '92%',
                                backgroundColor: colors.bg,
                                borderRadius: 22,
                                borderWidth: 1, borderColor: colors.rule,
                                overflow: 'hidden',
                                shadowColor: 'rgba(43,24,16,1)',
                                shadowOffset: {width: 0, height: 30},
                                shadowOpacity: 0.35,
                                shadowRadius: 60,
                                elevation: 20,
                                marginTop: -48,
                            }}>
                                {/* Icon header */}
                                <View style={{
                                    paddingTop: 22, paddingHorizontal: 22, paddingBottom: 14,
                                    backgroundColor: '#FBEFEA',
                                    borderBottomWidth: 1,
                                    borderBottomColor: 'rgba(156,61,46,0.15)',
                                    alignItems: 'center', gap: 12,
                                }}>
                                    <View style={{
                                        width: 56, height: 56, borderRadius: 16,
                                        backgroundColor: colors.brick,
                                        alignItems: 'center', justifyContent: 'center',
                                        shadowColor: colors.brick,
                                        shadowOffset: {width: 0, height: 10},
                                        shadowOpacity: 0.45,
                                        shadowRadius: 14,
                                        elevation: 8,
                                        transform: [{rotate: '-4deg'}],
                                    }}>
                                        <Icon name="trash" size={26} color="#FBF6EC"/>
                                    </View>
                                    <View style={{alignItems: 'center', gap: 6}}>
                                        <Text style={{
                                            fontFamily: fonts.display, fontSize: 24, color: colors.brick,
                                            letterSpacing: -0.25, lineHeight: 26, textAlign: 'center',
                                        }}>
                                            {t('wizard.removeSeqTitle')}
                                        </Text>
                                        <Text style={{
                                            fontFamily: fonts.mono, fontSize: 10.5, color: colors.inkMute,
                                            letterSpacing: 2, textTransform: 'uppercase',
                                        }}>
                                            {t('wizard.removeSeqNoUndo', { count: rowCount, rows: rowCount, stsLabel: t('wizard.removeSeqStitchLabel', { count: totalSts }) })}
                                        </Text>
                                    </View>
                                </View>

                                {/* Sequence preview */}
                                <View style={{paddingTop: 14, paddingHorizontal: 20, paddingBottom: 4}}>
                                    <View style={{
                                        backgroundColor: colors.card,
                                        borderWidth: 1, borderColor: colors.rule,
                                        borderRadius: 12,
                                        paddingVertical: 10, paddingHorizontal: 12,
                                    }}>
                                        {/* Sequence meta */}
                                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10}}>
                                            <View style={{
                                                width: 24, height: 24, borderRadius: 7,
                                                backgroundColor: seqColor,
                                                alignItems: 'center', justifyContent: 'center',
                                                flexShrink: 0,
                                            }}>
                                                <Text style={{fontFamily: fonts.display, fontSize: 13, color: '#FBF6EC'}}>
                                                    {confirmSeqDialog.seqIdx + 1}
                                                </Text>
                                            </View>
                                            <Text
                                                numberOfLines={1}
                                                style={{
                                                    flex: 1, fontFamily: fonts.bodySb, fontSize: 13.5, color: colors.ink,
                                                }}
                                            >
                                                {diagSeq?.name}
                                            </Text>
                                            <Text style={{fontFamily: fonts.mono, fontSize: 10, color: colors.inkMute, flexShrink: 0}}>
                                                {t('common.rows', { count: rowCount })}
                                            </Text>
                                        </View>
                                        {/* Per-row mini preview */}
                                        <View style={{gap: 5}}>
                                            {diagSeq?.rows.map((row) => {
                                                const chips: {stitchId: string}[] = []
                                                for (const inst of row.stitches) {
                                                    for (let i = 0; i < inst.count && chips.length < MAX_CHIPS_PER_ROW; i++) {
                                                        chips.push({stitchId: inst.stitchId})
                                                    }
                                                }
                                                const rowTotal = row.stitches.reduce((s, inst) => s + inst.count, 0)
                                                const overflow = rowTotal > MAX_CHIPS_PER_ROW ? rowTotal - MAX_CHIPS_PER_ROW : 0
                                                const shortLabel = row.label.replace(/^Row\s+/i, 'R')
                                                return (
                                                    <View key={row.id} style={{flexDirection: 'row', alignItems: 'center', gap: 7}}>
                                                        <Text style={{
                                                            fontFamily: fonts.mono, fontSize: 9, color: colors.inkMute,
                                                            fontWeight: '700', width: 30, flexShrink: 0,
                                                        }}>
                                                            {shortLabel}
                                                        </Text>
                                                        {row.stitches.length === 0 ? (
                                                            <Text style={{
                                                                fontFamily: fonts.mono, fontSize: 9.5,
                                                                color: colors.inkMute, fontStyle: 'italic',
                                                            }}>{t('wizard.rowEmpty')}</Text>
                                                        ) : (
                                                            <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 2, flex: 1}}>
                                                                {chips.map((chip, i) => {
                                                                    const def = STITCH_MAP[chip.stitchId]
                                                                    if (!def) return null
                                                                    const c = STITCH_BRICK.has(chip.stitchId) ? colors.brick
                                                                            : STITCH_MUSTARD.has(chip.stitchId) ? colors.mustard
                                                                            : colors.forest
                                                                    return (
                                                                        <View key={i} style={{
                                                                            width: 14, height: 17, borderRadius: 4,
                                                                            backgroundColor: colors.cream2,
                                                                            borderWidth: 1, borderColor: c,
                                                                            alignItems: 'center', justifyContent: 'center',
                                                                            opacity: 0.7,
                                                                        }}>
                                                                            <StitchGlyph symbol={def.symbol} size={8} color={c} strokeWidth={1.6}/>
                                                                        </View>
                                                                    )
                                                                })}
                                                                {overflow > 0 && (
                                                                    <View style={{
                                                                        height: 17, borderRadius: 4,
                                                                        backgroundColor: colors.cream2,
                                                                        borderWidth: 1, borderColor: colors.rule,
                                                                        alignItems: 'center', justifyContent: 'center',
                                                                        paddingHorizontal: 4, opacity: 0.7,
                                                                    }}>
                                                                        <Text style={{
                                                                            fontFamily: fonts.mono, fontSize: 8,
                                                                            color: colors.inkMute, fontWeight: '700',
                                                                        }}>+{overflow}</Text>
                                                                    </View>
                                                                )}
                                                            </View>
                                                        )}
                                                    </View>
                                                )
                                            })}
                                        </View>
                                    </View>
                                    <Text style={{
                                        marginTop: 10, fontSize: 13, color: colors.inkSoft,
                                        fontFamily: fonts.body, lineHeight: 19,
                                        textAlign: 'center', paddingHorizontal: 4,
                                    }}>
                                        {t('wizard.removeSeqBody')}
                                    </Text>
                                </View>

                                {/* Buttons */}
                                <View style={{padding: 20, paddingTop: 16, gap: 8}}>
                                    <Pressable
                                        onPress={executeRemoveSeq}
                                        style={{
                                            height: 48, borderRadius: 14,
                                            backgroundColor: colors.brick,
                                            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                                            shadowColor: colors.brick,
                                            shadowOffset: {width: 0, height: 8},
                                            shadowOpacity: 0.35,
                                            shadowRadius: 14,
                                            elevation: 6,
                                        }}
                                    >
                                        <Icon name="trash" size={16} color="#FBF6EC"/>
                                        <Text style={{fontFamily: fonts.bodySb, fontSize: 15, color: '#FBF6EC', letterSpacing: -0.1}}>
                                            {t('wizard.removeSeqConfirm')}
                                        </Text>
                                    </Pressable>
                                    <Pressable
                                        onPress={() => setConfirmSeqDialog(null)}
                                        style={{
                                            height: 44, borderRadius: 12,
                                            borderWidth: 1.5, borderColor: colors.rule,
                                            alignItems: 'center', justifyContent: 'center',
                                        }}
                                    >
                                        <Text style={{fontFamily: fonts.bodySb, fontSize: 14.5, color: colors.ink, letterSpacing: -0.1}}>
                                            {t('common.keepIt')}
                                        </Text>
                                    </Pressable>
                                </View>
                            </View>
                        </View>
                    </Modal>
                )
            })()}

        </View>
    )
}

// ── Step 4 ─────────────────────────────────────────────────────
function Step4({draft, onChange, onJumpToStep3}: {
    draft: Draft
    onChange: (d: Draft) => void
    onJumpToStep3: (partIdx: number, seqId: string) => void
}) {
    const { t } = useTranslation()
    const {colors, fonts, spacing} = useTheme()
    const librarySequences = useLibraryStore(s => s.sequences)

    const [activePart, setActivePart] = useState(0)
    const [showSeqPicker, setShowSeqPicker] = useState(false)

    // Clamp active part if the user removed parts in Step 2 and bounced back.
    const safeActive = Math.min(activePart, draft.parts.length - 1)
    const part = draft.parts[safeActive]
    if (!part) return null

    const seqColorPalette = [colors.mustard, colors.brick, colors.forest]
    const seqColorAt = (i: number) => seqColorPalette[i % seqColorPalette.length]!

    const updatePart = (updated: DraftPart) => {
        onChange({...draft, parts: draft.parts.map((p, i) => i === safeActive ? updated : p)})
    }

    const setSeqRepeats = (seqIdx: number, val: number) => {
        const seq = part.sequences[seqIdx]!
        const next = Math.max(1, val)
        updatePart({...part, sequences: part.sequences.map((s, i) => i === seqIdx ? {...seq, totalRepeats: next} : s)})
    }

    const reorderSequences = (data: DraftSequence[]) => {
        updatePart({...part, sequences: data})
    }

    const toggleLoop = () => {
        updatePart({...part, loop: !part.loop})
    }

    const addSeqFromLib = (libSeq: LibrarySequence) => {
        const newSeq: DraftSequence = {
            id: uuid4(), name: libSeq.name,
            rows: libSeq.rows.map(r => ({...r, id: uuid4()})),
            totalRepeats: libSeq.totalRepeats,
            loop: libSeq.loop,
        }
        updatePart({...part, sequences: [...part.sequences, newSeq]})
        setShowSeqPicker(false)
    }

    const addPatternFromLib = (libPat: LibraryPattern) => {
        const newSeqs: DraftSequence[] = libPat.sequenceIds
            .map(id => librarySequences.find(s => s.id === id))
            .filter((s): s is LibrarySequence => Boolean(s))
            .map(libSeq => ({
                id: uuid4(), name: libSeq.name,
                rows: libSeq.rows.map(r => ({...r, id: uuid4()})),
                totalRepeats: libSeq.totalRepeats,
                loop: libSeq.loop,
            }))
        updatePart({...part, sequences: [...part.sequences, ...newSeqs]})
        setShowSeqPicker(false)
    }

    const totalRows = part.sequences.reduce((sum, seq) => sum + seq.rows.length * seq.totalRepeats, 0)

    const breakdown = part.sequences
        .filter(seq => seq.rows.length > 0)
        .map(seq => {
            const rowN = seq.rows.length
            const tag = (seq.name.toLowerCase().split(/\s+/)[0] || '').trim()
            const lhs = seq.totalRepeats > 1 ? `${rowN}×${seq.totalRepeats}` : `${rowN}`
            return tag ? `${lhs} ${tag}` : lhs
        })
        .join(' · ')

    const renderSeqCard = useCallback(({item: seq, drag, isActive, getIndex}: any) => {
        const si: number = getIndex?.() ?? 0
        const seqColor = seqColorAt(si)
        const rowN = seq.rows.length
        const total = rowN * seq.totalRepeats
        const firstRowStitches = seq.rows[0]?.stitches ?? []
        const previewIds: string[] = []
        for (const st of firstRowStitches) {
            for (let i = 0; i < st.count && previewIds.length < 6; i++) previewIds.push(st.stitchId)
            if (previewIds.length >= 6) break
        }
        const moreRows = Math.max(0, rowN - 1)

        return (
            <ScaleDecorator>
                <View style={{
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: isActive ? colors.brick : colors.rule,
                    borderRadius: 16,
                    padding: 12,
                    marginBottom: 10,
                }}>
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                        <Pressable onLongPress={drag} delayLongPress={180} hitSlop={6}>
                            <Icon name="grip" size={18} color={colors.inkMute}/>
                        </Pressable>
                        <View style={{
                            width: 30, height: 30, borderRadius: 8,
                            backgroundColor: seqColor,
                            alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Text style={{fontFamily: fonts.display, fontSize: 14, color: '#FBF6EC'}}>{si + 1}</Text>
                        </View>
                        <View style={{flex: 1, minWidth: 0}}>
                            <Text
                                numberOfLines={1}
                                style={{fontFamily: fonts.bodySb, fontSize: 14.5, color: colors.ink, letterSpacing: -0.1}}
                            >
                                {seq.name}
                            </Text>
                            <Text style={{fontFamily: fonts.mono, fontSize: 11.5, color: colors.inkMute, marginTop: 1}}>
                                {t('wizard.step4RowsBreakdown', { count: rowN, rows: rowN, repeats: seq.totalRepeats, total })}
                            </Text>
                        </View>
                        <Pressable onPress={() => onJumpToStep3(safeActive, seq.id)} hitSlop={8}>
                            <Icon name="edit" size={16} color={colors.inkSoft}/>
                        </Pressable>
                    </View>

                    {/* Stitch preview row */}
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 3, flexWrap: 'wrap', marginTop: 10}}>
                        {previewIds.map((id, i) => {
                            const def = STITCH_MAP[id]
                            if (!def) return null
                            return (
                                <View key={`${id}-${i}`} style={{
                                    width: 18, height: 22, borderRadius: 5,
                                    backgroundColor: colors.cream2,
                                    borderWidth: 1.1, borderColor: seqColor,
                                    alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <StitchGlyph symbol={def.symbol} color={seqColor} size={10} strokeWidth={1.6}/>
                                </View>
                            )
                        })}
                        <Text style={{
                            fontFamily: fonts.mono, fontSize: 10,
                            color: colors.inkMute, paddingHorizontal: 6,
                        }}>
                            {rowN === 0 ? t('wizard.step4NoRowsYet') : t('wizard.step4MoreRows', { count: moreRows })}
                        </Text>
                    </View>

                    {/* Repeat stepper */}
                    <View style={{
                        marginTop: 10, paddingHorizontal: 10, paddingVertical: 6,
                        backgroundColor: colors.cream2, borderRadius: 10,
                        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                            <Icon name="repeat" size={13} color={colors.mustardDk}/>
                            <Text style={{fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft}}>{t('wizard.step4RepeatBy')}</Text>
                        </View>
                        <View style={{
                            flexDirection: 'row', alignItems: 'center',
                            backgroundColor: colors.bg, borderRadius: 8, paddingHorizontal: 4, paddingVertical: 3,
                        }}>
                            <Pressable
                                onPress={() => setSeqRepeats(si, seq.totalRepeats - 1)}
                                disabled={seq.totalRepeats <= 1}
                                hitSlop={4}
                                style={{paddingHorizontal: 8}}
                            >
                                <Text style={{
                                    fontFamily: fonts.display, fontSize: 18,
                                    color: seq.totalRepeats <= 1 ? colors.inkMute : colors.ink,
                                }}>−</Text>
                            </Pressable>
                            <Text style={{
                                fontFamily: fonts.mono, fontSize: 13, fontWeight: '700', color: colors.ink,
                                minWidth: 26, textAlign: 'center',
                            }}>{seq.totalRepeats}</Text>
                            <Pressable
                                onPress={() => setSeqRepeats(si, seq.totalRepeats + 1)}
                                hitSlop={4}
                                style={{paddingHorizontal: 8}}
                            >
                                <Text style={{fontFamily: fonts.display, fontSize: 18, color: colors.ink}}>+</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </ScaleDecorator>
        )
    }, [colors, fonts, safeActive, part])

    const listHeader = (
        <View>
            {draft.parts.length > 1 && (
                <View style={[styles.tabRow2, {backgroundColor: colors.cream2, borderRadius: 12, marginBottom: spacing[4]}]}>
                    {draft.parts.map((p, i) => (
                        <Pressable
                            key={p.id}
                            onPress={() => setActivePart(i)}
                            style={[styles.tabBtn2, {
                                flexDirection: 'row', gap: 5,
                                backgroundColor: safeActive === i ? colors.card : 'transparent',
                                borderRadius: 9,
                                ...(safeActive === i ? {
                                    shadowColor: '#000',
                                    shadowOffset: {width: 0, height: 1},
                                    shadowOpacity: 0.06,
                                    shadowRadius: 3,
                                    elevation: 1,
                                } : {}),
                            }]}
                        >
                            <Text style={{fontFamily: fonts.bodySb, fontSize: 12, color: safeActive === i ? colors.brick : colors.inkSoft}}>
                                {p.name}
                            </Text>
                            <Text style={{
                                fontFamily: fonts.mono, fontSize: 9.5, fontWeight: '700', color: colors.inkMute,
                                backgroundColor: safeActive === i ? colors.cream2 : 'transparent',
                                paddingHorizontal: safeActive === i ? 5 : 0, paddingVertical: 1,
                                borderRadius: 5, letterSpacing: 0.5,
                            }}>
                                {p.sequences.length}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            )}
            <Text style={{
                fontFamily: fonts.mono, fontSize: 11, color: colors.inkMute,
                letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8,
            }}>
                {t('wizard.step4SequencesInOrder', { name: part.name })}
            </Text>
        </View>
    )

    const listFooter = (
        <View>
            {/* Reuse from library */}
            <Pressable
                onPress={() => setShowSeqPicker(true)}
                style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                    borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.rule,
                    borderRadius: 14, paddingVertical: 12, marginTop: 4,
                }}
            >
                <Icon name="library" size={14} color={colors.mustardDk}/>
                <Text style={{fontFamily: fonts.bodySb, fontSize: 13.5, color: colors.inkSoft}}>
                    {t('wizard.step4ReuseFromLib')}
                </Text>
            </Pressable>

            {/* Loop the whole part */}
            <View style={{
                marginTop: 14,
                backgroundColor: colors.card,
                borderWidth: 1, borderColor: colors.rule,
                borderRadius: 16, padding: 14,
                flexDirection: 'row', alignItems: 'center', gap: 12,
            }}>
                <View style={{
                    width: 36, height: 36, borderRadius: 10,
                    backgroundColor: colors.cream2,
                    alignItems: 'center', justifyContent: 'center',
                }}>
                    <Icon name="repeat" size={18} color={colors.brick}/>
                </View>
                <View style={{flex: 1}}>
                    <Text style={{fontFamily: fonts.bodySb, fontSize: 14.5, color: colors.ink}}>{t('wizard.step4LoopTitle')}</Text>
                    <Text style={{fontFamily: fonts.body, fontSize: 12, color: colors.inkMute, marginTop: 2, lineHeight: 16}}>
                        {t('wizard.step4LoopSub')}
                    </Text>
                </View>
                <Pressable
                    onPress={toggleLoop}
                    style={{
                        width: 42, height: 24, borderRadius: 12,
                        backgroundColor: part.loop ? colors.brick : colors.rule,
                        padding: 2, justifyContent: 'center',
                    }}
                >
                    <View style={{
                        width: 20, height: 20, borderRadius: 10,
                        backgroundColor: '#FBF6EC',
                        transform: [{translateX: part.loop ? 18 : 0}],
                    }}/>
                </Pressable>
            </View>

            {/* Final tally */}
            <View style={{marginTop: 14, marginBottom: 24}}>
                <LinearGradient
                    colors={[colors.brick, colors.brickDk]}
                    start={{x: 0, y: 0}} end={{x: 0, y: 1}}
                    style={{
                        borderRadius: 18, padding: 16,
                        shadowColor: colors.brick,
                        shadowOffset: {width: 0, height: 10},
                        shadowOpacity: 0.3,
                        shadowRadius: 14,
                        elevation: 6,
                    }}
                >
                    <Text style={{
                        fontFamily: fonts.mono, fontSize: 10, color: '#FBF6EC',
                        opacity: 0.7, letterSpacing: 1.6, textTransform: 'uppercase',
                    }}>
                        {t('wizard.step4FinalTally', { name: part.name })}
                    </Text>
                    <View style={{flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 4}}>
                        <Text style={{fontFamily: fonts.display, fontSize: 40, color: '#FBF6EC', lineHeight: 42}}>
                            {totalRows}
                        </Text>
                        <Text style={{fontFamily: fonts.body, fontSize: 13, color: '#FBF6EC', opacity: 0.9}}>
                            {part.loop ? t('wizard.step4RowsTotalLooping') : t('wizard.step4RowsTotal')}
                        </Text>
                    </View>
                    {breakdown.length > 0 && (
                        <Text style={{
                            fontFamily: fonts.mono, fontSize: 12, color: '#FBF6EC',
                            opacity: 0.85, marginTop: 6,
                        }}>
                            {breakdown}
                        </Text>
                    )}
                </LinearGradient>
            </View>
        </View>
    )

    return (
        <View style={{flex: 1}}>
            <DraggableFlatList
                data={part.sequences}
                keyExtractor={(s: DraftSequence) => s.id}
                onDragEnd={({data}: {data: DraftSequence[]}) => reorderSequences(data)}
                contentContainerStyle={{paddingHorizontal: spacing[5], paddingTop: spacing[4], paddingBottom: 140}}
                renderItem={renderSeqCard}
                ListHeaderComponent={listHeader}
                ListFooterComponent={listFooter}
                ListEmptyComponent={
                    <View style={{
                        borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.rule,
                        borderRadius: 14, padding: 18, alignItems: 'center', marginBottom: 4,
                    }}>
                        <Text style={{fontFamily: fonts.body, fontSize: 13, color: colors.inkMute, textAlign: 'center'}}>
                            {t('wizard.step4Empty')}
                        </Text>
                    </View>
                }
            />
            <SeqPickerModal
                visible={showSeqPicker}
                onClose={() => setShowSeqPicker(false)}
                onSelectSequence={addSeqFromLib}
                onSelectPattern={addPatternFromLib}
                onBuildNew={() => setShowSeqPicker(false)}
                craftFilter={draft.craft}
            />
        </View>
    )
}

// ── Root wizard ─────────────────────────────────────────────────
export default function SetupWizard() {
    const { t } = useTranslation()
    const {colors, fonts, spacing, radius} = useTheme()
    const router = useRouter()
    const defaultCraft = useSettingsStore((s) => s.defaultCraft)
    const markWelcomeSeen = useSettingsStore((s) => s.markWelcomeSeen)
    const addProject = useProjectStore((s) => s.addProject)

    const [step, setStep] = useState(0)
    const [triedNext, setTriedNext] = useState(false)
    const [step3Focus, setStep3Focus] = useState<Step3Focus | null>(null)
    const step1Ref = useRef<Step1Handle>(null)
    const [draft, setDraft] = useState<Draft>({
        name: '',
        craft: defaultCraft,
        yarnWeight: '',
        needleSize: '4.5',
        needleType: 'Straight',
        yarnColor: '#9C3D2E',
        notes: '',
        parts: [
            {
                id: uuid4(),
                name: t('wizard.mainPart'),
                color: PART_COLORS[0]!,
                loop: false,
                sequences: [
                    {id: uuid4(), name: t('wizard.mainSequence'), rows: [], totalRepeats: 1, loop: false},
                ],
            },
        ],
    })

    const STEP_META = [
        { label: t('wizard.step1Label'), title: t('wizard.step1Title'), sub: t('wizard.step1Sub') },
        { label: t('wizard.step2Label'), title: t('wizard.step2Title'), sub: t('wizard.step2Sub') },
        { label: t('wizard.step3Label'), title: t('wizard.step3Title'), sub: t('wizard.step3Sub') },
        { label: t('wizard.step4Label'), title: t('wizard.step4Title'), sub: t('wizard.step4Sub') },
    ]

    const blocked = step === 0 && triedNext && !draft.name.trim()

    const next = () => {
        if (step === 0 && !draft.name.trim()) {
            setTriedNext(true)
            step1Ref.current?.scrollToRequired()
            return
        }
        if (step < 3) setStep(step + 1)
        else finish()
    }
    const back = () => {
        if (step > 0) setStep(step - 1)
        else router.back()
    }

    const finish = () => {
        const id = uuid4()
        addProject({
            id,
            name: draft.name,
            craft: draft.craft,
            yarnWeight: draft.yarnWeight,
            needleSize: draft.needleSize,
            needleType: draft.needleType || undefined,
            yarnColor: draft.yarnColor,
            notes: draft.notes,
            status: 'active',
            parts: draft.parts,
            currentPartIndex: 0,
            currentSequenceIndex: 0,
            currentRepeat: 1,
            currentRowIndex: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        })
        markWelcomeSeen()
        router.replace(`/project/${id}`)
    }

    const meta = STEP_META[step]!

    return (
        <Screen>
            {/* Header */}
            <View style={styles.headerBar}>
                <IconBtn name="x" onPress={back}/>
                <Text style={{fontFamily: fonts.mono, fontSize: 11, color: colors.inkMute}}>{t('wizard.stepCounter', { current: step + 1, total: 4 })}</Text>
            </View>

            <WizardSteps step={step}/>

            <View style={[styles.stepHeading, {paddingHorizontal: spacing[6]}]}>
                <Text style={{
                    fontFamily: fonts.mono,
                    fontSize: 11,
                    color: colors.mustardDk,
                    letterSpacing: 2.5,
                    textTransform: 'uppercase'
                }}>
                    {meta.label}
                </Text>
                <Text style={{
                    fontFamily: fonts.display,
                    fontSize: 30,
                    color: colors.brick,
                    lineHeight: 36,
                    marginTop: 6,
                    letterSpacing: -0.5
                }}>
                    {meta.title}
                </Text>
                <Text style={{
                    fontFamily: fonts.body,
                    fontSize: 13.5,
                    color: colors.inkSoft,
                    marginTop: 8,
                    lineHeight: 20
                }}>
                    {meta.sub}
                </Text>
            </View>

            {/* Step content */}
            <View style={{flex: 1}}>
                {step === 0 && <Step1 ref={step1Ref} draft={draft} onChange={setDraft} requiredError={triedNext && !draft.name.trim()}/>}
                {step === 1 && <Step2 draft={draft} onChange={setDraft}/>}
                {step === 2 && (
                    <Step3
                        draft={draft}
                        onChange={setDraft}
                        initialFocus={step3Focus}
                        onFocusConsumed={() => setStep3Focus(null)}
                    />
                )}
                {step === 3 && (
                    <Step4
                        draft={draft}
                        onChange={setDraft}
                        onJumpToStep3={(partIdx, seqId) => {
                            setStep3Focus({partIdx, seqId})
                            setStep(2)
                        }}
                    />
                )}
            </View>

            {/* Footer nav */}
            <View style={[styles.footer, {backgroundColor: colors.bg, borderTopColor: colors.rule}]}>
                {blocked && (
                    <View style={[styles.blockedBanner, {
                        backgroundColor: '#FBEFEA',
                        borderColor: 'rgba(156,61,46,0.25)',
                        borderRadius: radius.sm,
                    }]}>
                        <View style={[styles.blockedCircle, {backgroundColor: colors.brick}]}>
                            <Text style={{fontFamily: fonts.display, fontSize: 13, color: '#FBF6EC', lineHeight: 16}}>!</Text>
                        </View>
                        <Text style={{flex: 1, fontFamily: fonts.bodySb, fontSize: 13, color: colors.brick, letterSpacing: -0.1}}>
                            {t('wizard.blocked')}
                        </Text>
                        <Icon name="chevDown" size={14} color={colors.brick}/>
                    </View>
                )}
                <View style={styles.footerBtns}>
                    <Btn variant="ghost" size="lg" onPress={back}>
                        {step === 0 ? t('common.cancel') : t('common.back')}
                    </Btn>
                    <View style={{flex: 1}}>
                        {blocked ? (
                            <Pressable
                                onPress={next}
                                style={{
                                    height: 58, borderRadius: radius.md,
                                    backgroundColor: '#E8D6CF',
                                    borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.brick,
                                    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                                    gap: 8, width: '100%',
                                }}
                            >
                                <View style={[styles.blockedCircle, {backgroundColor: colors.brick, width: 18, height: 18, borderRadius: 9}]}>
                                    <Text style={{fontFamily: fonts.display, fontSize: 12, color: '#FBF6EC', lineHeight: 16}}>!</Text>
                                </View>
                                <Text style={{fontFamily: fonts.bodySb, fontSize: 17, color: colors.brick, letterSpacing: -0.1}}>
                                    {t('common.next')}
                                </Text>
                            </Pressable>
                        ) : (
                            <Btn variant="primary" size="lg" icon="chevR" full onPress={next}>
                                {step === 3 ? t('wizard.castOn') : step === 2 ? t('wizard.nextArrange') : t('common.next')}
                            </Btn>
                        )}
                    </View>
                </View>
            </View>
        </Screen>
    )
}

const styles = StyleSheet.create({
    headerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 4,
        paddingBottom: 4
    },
    stepsRow: {flexDirection: 'row', gap: 6, paddingHorizontal: 20, paddingBottom: 12},
    stepPip: {flex: 1, height: 6, borderRadius: 4},
    stepHeading: {paddingBottom: 16},
    footer: {flexDirection: 'column', padding: 16, paddingBottom: 24, borderTopWidth: 1},
    footerBtns: {flexDirection: 'row', gap: 10},
    blockedBanner: {flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, padding: 10, marginBottom: 10},
    blockedCircle: {width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center'},
    sectionLabel: {fontSize: 10.5, letterSpacing: 3, textTransform: 'uppercase'},
    sectionLabelRow: {flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8},
    nameBox: {borderWidth: 2, padding: 18},
    nameMeta: {flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8},
    pillRow: {flexDirection: 'row', gap: 10},
    pill: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderWidth: 1,
        paddingVertical: 10
    },
    wrapRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
    weightChip: {borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8},
    needleCard: {borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12},
    needleIconBox: {width: 38, height: 38, alignItems: 'center', justifyContent: 'center'},
    needleStepper: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 4, gap: 0},
    needleBtn: {paddingHorizontal: 8, paddingVertical: 2, alignItems: 'center', justifyContent: 'center'},
    colorRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 10},
    colorSwatch: {width: 36, height: 36, borderRadius: 18},
    notesBox: {borderWidth: 1, padding: 14, minHeight: 80},
    partCard: {borderWidth: 1, padding: 16},
    partHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
    partRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        borderWidth: 1, borderRadius: 18, padding: 14,
    },
    addPartBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        paddingVertical: 12
    },
    tabRow2: {flexDirection: 'row', padding: 4, gap: 4},
    tabBtn2: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 4},
    seqBlock: {borderWidth: 1, padding: 14, gap: 0},
    rowCard: {borderTopWidth: 1, borderTopColor: 'transparent', paddingTop: 12, marginTop: 12},
    stitchFlow: {flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center'},
    miniChip2: {alignItems: 'center', paddingHorizontal: 8, paddingVertical: 6},
    addStitchBtn: {width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderWidth: 1},
    addRowBtn: {flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 12, marginTop: 4},
})
