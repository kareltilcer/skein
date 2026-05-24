import React, {useState, useRef, useCallback, forwardRef, useImperativeHandle} from 'react'
import {View, Text, ScrollView, TextInput, Pressable, StyleSheet, Modal} from 'react-native'
import {BlurView} from 'expo-blur'

import {useRouter} from 'expo-router'
import {useTheme} from '../../theme/ThemeContext'
import {useProjectStore} from '../../store/projectStore'
import {useSettingsStore} from '../../store/settingsStore'
import {STITCH_MAP, STITCHES} from '../../tokens/stitches'
import Screen from '../../components/ui/Screen'
import Icon from '../../components/ui/Icon'
import Btn from '../../components/ui/Btn'
import IconBtn from '../../components/ui/IconBtn'
import StitchGlyph from '../../components/StitchGlyph'
import type {StitchInstance, Craft} from '../../types'
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
}
type DraftSequence = {
    id: string; name: string
    rows: DraftRow[]
    totalRepeats: number; loop: boolean
}
type DraftRow = {
    id: string; label: string
    stitches: StitchInstance[]
}

type Draft = {
    name: string; craft: Craft; yarnWeight: string
    needleSize: string; needleType: string; yarnColor: string; notes: string
    parts: DraftPart[]
    partsCustomized?: boolean   // true once user has explicitly added a part
}

function uuid4() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function partMeta(part: DraftPart): string {
    const seqCount = part.sequences.length
    const rowCount = part.sequences.reduce((s, seq) => s + seq.rows.length, 0)
    return `${seqCount} sequence${seqCount !== 1 ? 's' : ''} · ~${rowCount} rows`
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
        empty:    'Give it a name — anything will do.',
        ok:       'Looks good. Future-you will thank you.',
        mid:      'Plenty of room.',
        near:     'Getting close to the limit.',
        over:     'Whoops — too long. I have to stop you.',
        required: "This one's required — give your project a name to cast on.",
    }

    const isErr = state === 'required'

    return (
        <ScrollView ref={scrollRef} contentContainerStyle={{padding: spacing[5], gap: spacing[5], paddingBottom: 140}}>
            {/* Name */}
            <View onLayout={(e) => { nameY.current = e.nativeEvent.layout.y }}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8}}>
                    <Text style={[styles.sectionLabel, {color: colors.inkMute, fontFamily: fonts.mono}]}>
                        Name your project
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
                            }}>REQUIRED</Text>
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
                        onChangeText={(t) => onChange({...draft, name: t.slice(0, MAX_NAME)})}
                        placeholder="e.g. The Granny Cardigan"
                        placeholderTextColor={colors.inkMute}
                        style={{
                            fontFamily: fonts.display,
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
                <Text style={[styles.sectionLabel, {color: colors.inkMute, fontFamily: fonts.mono}]}>What kind?</Text>
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
                                {c.charAt(0).toUpperCase() + c.slice(1)}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </View>

            {/* Yarn weight */}
            <View>
                <View style={styles.sectionLabelRow}>
                    <Text style={[styles.sectionLabel, {color: colors.inkMute, fontFamily: fonts.mono}]}>Yarn
                        weight</Text>
                    <Text style={{fontFamily: fonts.mono, fontSize: 10, color: colors.inkMute, letterSpacing: 0.5}}>Whatever's
                        on the label.</Text>
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
                        {draft.craft === 'knit' ? 'Needle size' : 'Hook size'}
                    </Text>
                    <Text style={{fontFamily: fonts.mono, fontSize: 10, color: colors.inkMute, letterSpacing: 0.5}}>
                        {draft.craft === 'knit' ? 'Knit picked, so needles.' : 'Hooked, so hooks.'}
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
                                        typical for {entry.typical} weight
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
                <Text style={[styles.sectionLabel, {color: colors.inkMute, fontFamily: fonts.mono}]}>Yarn color</Text>
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
                <Text style={[styles.sectionLabel, {color: colors.inkMute, fontFamily: fonts.mono}]}>Notes
                    (optional)</Text>
                <View style={[styles.notesBox, {
                    backgroundColor: colors.card,
                    borderColor: colors.rule,
                    borderRadius: radius.md
                }]}>
                    <TextInput
                        value={draft.notes}
                        onChangeText={(t) => onChange({...draft, notes: t})}
                        placeholder="Gauge, modifications, anything…"
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
            sequences: [{id: uuid4(), name: 'Main sequence', rows: [], totalRepeats: 1, loop: false}],
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
                    Just the one piece?
                </Text>
                <Text style={{
                    fontFamily: fonts.body, fontSize: 13.5, color: colors.inkSoft,
                    lineHeight: 20, textAlign: 'center', maxWidth: 300,
                }}>
                    Scarves, dishcloths, blankets, simple hats — they're a single piece, and Skein's happy with that. Add more parts only if your project splits into separate pieces, like sleeves, panels, or a pocket.
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
                    <Text style={{fontFamily: fonts.bodySb, fontSize: 14, color: colors.brick}}>Add a part</Text>
                </Pressable>
                <Text style={{
                    fontFamily: fonts.mono, fontSize: 10, color: colors.inkMute,
                    letterSpacing: 2, textTransform: 'uppercase', marginTop: 2,
                }}>
                    ✻ one part is a whole project ✻
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
                    <Text style={{fontWeight: '700', color: colors.ink}}>Not sure? </Text>
                    Knit a sample first, then come back and split it if you need to. You can add parts at any time.
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
                <Text style={{fontFamily: fonts.bodySb, fontSize: 14, color: colors.brick}}>Add another part</Text>
            </Pressable>
            <View style={{
                backgroundColor: colors.cream2,
                borderRadius: 14, padding: 12, marginTop: 14, marginBottom: 140,
                flexDirection: 'row', gap: 10, alignItems: 'flex-start',
            }}>
                <Icon name="bulb" size={16} color={colors.mustardDk}/>
                <Text style={{fontFamily: fonts.body, fontSize: 12.5, color: colors.inkSoft, flex: 1, lineHeight: 18}}>
                    <Text style={{fontWeight: '700', color: colors.ink}}>Tip: </Text>
                    Drag to reorder. Knit them in whatever order makes sense — Skein only tracks one part at a time.
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
        ? `Editing part ${editingIdx + 1} of ${draft.parts.length}`
        : `New part · slot ${nextSlotNumber}`
    const sheetTitle = isEdit
        ? `Edit the ${draft.parts.find(p => p.id === editingPartId)?.name ?? ''}`
        : 'Add a part'
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
                                    }}>Preview</Text>
                                </View>
                                <View style={{flex: 1}}>
                                    <Text style={{
                                        fontFamily: fonts.mono, fontSize: 10.5, color: colors.inkMute,
                                        letterSpacing: 1.7, textTransform: 'uppercase', marginBottom: 6,
                                    }}>Part name</Text>
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
                                            placeholder="e.g. Left sleeve"
                                            placeholderTextColor={colors.inkMute}
                                            style={{
                                                fontFamily: fonts.display, fontSize: 22,
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
                            }}>Tile color</Text>
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
                                <Text style={{fontFamily: fonts.mono, fontSize: 10.5, color: colors.inkMute, letterSpacing: 1.7, textTransform: 'uppercase'}}>Notes</Text>
                                <Text style={{fontFamily: fonts.mono, fontSize: 10, color: colors.inkMute, letterSpacing: 0.5}}>optional · just for you</Text>
                            </View>
                            <View style={{
                                backgroundColor: colors.card, borderWidth: 1, borderColor: colors.rule,
                                borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, minHeight: 64, marginBottom: 22,
                            }}>
                                <TextInput
                                    value={sheetNotes}
                                    onChangeText={setSheetNotes}
                                    placeholder="e.g. 'knit in the round, switch to DPN at decreases'"
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
                                        <Text style={{fontFamily: fonts.bodySb, fontSize: 14, color: colors.brick}}>Remove this part</Text>
                                    </Pressable>
                                    <Text style={{
                                        fontFamily: fonts.mono, fontSize: 10, color: colors.inkMute,
                                        letterSpacing: 0.5, textAlign: 'center', marginTop: 8,
                                    }}>
                                        {(() => {
                                            const seqCount = draft.parts.find(p => p.id === editingPartId)?.sequences.length ?? 0
                                            return `Its ${seqCount} sequence${seqCount !== 1 ? 's' : ''} will stay in your Library.`
                                        })()}
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
                            <Btn variant="ghost" size="lg" onPress={closeSheet}>Cancel</Btn>
                            <View style={{flex: 1}}>
                                <Btn
                                    variant="primary" size="lg"
                                    icon={isEdit ? 'check' : 'plus'}
                                    full
                                    onPress={isEdit ? confirmEdit : confirmAdd}
                                >
                                    {isEdit ? 'Save changes' : 'Add part'}
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
function Step3({draft, onChange}: { draft: Draft; onChange: (d: Draft) => void }) {
    const {colors, fonts, fontSize, spacing, radius} = useTheme()
    const [activePart, setActivePart] = useState(0)
    const [activeRow, setActiveRow] = useState<{partIdx: number; seqIdx: number; rowIdx: number} | null>(null)
    const [showFullPicker, setShowFullPicker] = useState(false)

    const part = draft.parts[activePart]
    const quickStitches = STITCHES.filter(s => s.type === draft.craft).slice(0, 6)
    const totalStitchCount = STITCHES.filter(s => s.type === draft.craft).length

    const addRow = (seqIdx: number) => {
        const seq = part!.sequences[seqIdx]!
        const newRow: DraftRow = {id: uuid4(), label: `Row ${seq.rows.length + 1}`, stitches: []}
        updateSeq(activePart, seqIdx, {...seq, rows: [...seq.rows, newRow]})
    }

    const removeRow = (seqIdx: number, rowIdx: number) => {
        const seq = part!.sequences[seqIdx]!
        updateSeq(activePart, seqIdx, {...seq, rows: seq.rows.filter((_, i) => i !== rowIdx)})
        if (activeRow?.seqIdx === seqIdx && activeRow?.rowIdx === rowIdx) setActiveRow(null)
    }

    const clearRow = (seqIdx: number, rowIdx: number) => {
        const seq = part!.sequences[seqIdx]!
        updateSeq(activePart, seqIdx, {...seq, rows: seq.rows.map((r, i) => i === rowIdx ? {...r, stitches: []} : r)})
    }

    const addSeq = () => {
        const newSeq: DraftSequence = {
            id: uuid4(), name: `Sequence ${part!.sequences.length + 1}`,
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
        const row = draft.parts[partIdx]!.sequences[seqIdx]!.rows[rowIdx]!
        const last = row.stitches[row.stitches.length - 1]
        const newStitches: StitchInstance[] =
            last && last.stitchId === stitchId
                ? [...row.stitches.slice(0, -1), {stitchId, count: last.count + 1}]
                : [...row.stitches, {stitchId, count: 1}]
        const seq = draft.parts[partIdx]!.sequences[seqIdx]!
        updateSeq(partIdx, seqIdx, {...seq, rows: seq.rows.map((r, i) => i === rowIdx ? {...r, stitches: newStitches} : r)})
    }

    if (!part) return null

    const dockVisible = activeRow !== null && !showFullPicker

    return (
        <View style={{flex: 1}}>
            <ScrollView contentContainerStyle={{padding: spacing[4], paddingBottom: dockVisible ? 240 : 140}}>
                {/* Part tabs */}
                {draft.parts.length > 1 && (
                    <View style={[styles.tabRow2, {backgroundColor: colors.cream2, borderRadius: radius.md, marginBottom: spacing[4]}]}>
                        {draft.parts.map((p, i) => (
                            <Pressable
                                key={p.id}
                                onPress={() => { setActivePart(i); setActiveRow(null) }}
                                style={[styles.tabBtn2, {backgroundColor: activePart === i ? colors.card : 'transparent', borderRadius: radius.sm}]}
                            >
                                <Text style={{fontFamily: fonts.bodySb, fontSize: 12, color: activePart === i ? colors.brick : colors.inkSoft}}>
                                    {p.name}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                )}

                {part.sequences.map((seq, si) => (
                    <View key={seq.id} style={{marginBottom: spacing[5]}}>
                        {/* Sequence name — full card with brick border */}
                        <View style={{
                            backgroundColor: colors.card,
                            borderWidth: 2, borderColor: colors.brick, borderRadius: 16,
                            paddingVertical: 14, paddingHorizontal: 16, marginBottom: 16,
                        }}>
                            <TextInput
                                value={seq.name}
                                onChangeText={(t) => updateSeq(activePart, si, {...seq, name: t})}
                                style={{fontFamily: fonts.display, fontSize: 22, color: colors.ink, letterSpacing: -0.5}}
                            />
                        </View>

                        {/* Rows header */}
                        <View style={{flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8}}>
                            <Text style={{fontFamily: fonts.mono, fontSize: 11, color: colors.inkMute, letterSpacing: 2, textTransform: 'uppercase'}}>
                                Rows · {seq.rows.length} total
                            </Text>
                            <Text style={{fontFamily: fonts.mono, fontSize: 10, color: colors.inkMute, letterSpacing: 0.5}}>
                                tap a row to focus
                            </Text>
                        </View>

                        {/* Row cards */}
                        <View style={{gap: 8}}>
                            {seq.rows.map((row, ri) => {
                                const isActive = activeRow?.partIdx === activePart && activeRow?.seqIdx === si && activeRow?.rowIdx === ri
                                const totalSts = row.stitches.reduce((sum, s) => sum + s.count, 0)
                                const empty = totalSts === 0
                                return (
                                    <Pressable
                                        key={row.id}
                                        onPress={() => { setActiveRow({partIdx: activePart, seqIdx: si, rowIdx: ri}); setShowFullPicker(false) }}
                                        style={{
                                            backgroundColor: colors.card,
                                            borderWidth: isActive ? 2 : 1,
                                            borderColor: isActive ? colors.brick : colors.rule,
                                            borderRadius: 14,
                                            paddingVertical: 10, paddingHorizontal: 12,
                                        }}
                                    >
                                        {/* Row header row */}
                                        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: empty ? 0 : 8, gap: 8}}>
                                            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1}}>
                                                <Icon name="grip" size={14} color={colors.inkMute}/>
                                                <Text style={{fontFamily: fonts.bodySb, fontSize: 13, color: isActive ? colors.brick : colors.ink}}>
                                                    {row.label}{isActive ? ' ✱' : ''}
                                                </Text>
                                                <Text style={{fontFamily: fonts.mono, fontSize: 10, color: colors.inkMute}}>
                                                    · {totalSts} sts
                                                </Text>
                                            </View>
                                            <View style={{flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 0}}>
                                                <Pressable onPress={() => clearRow(si, ri)}>
                                                    <Icon name="refresh" size={14} color={colors.inkMute}/>
                                                </Pressable>
                                                <Pressable onPress={() => removeRow(si, ri)}>
                                                    <Icon name="trash" size={14} color={colors.inkMute}/>
                                                </Pressable>
                                            </View>
                                        </View>
                                        {/* Stitch cells */}
                                        {!empty ? (
                                            <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 3}}>
                                                {row.stitches.flatMap((si_item, idx) => {
                                                    const def = STITCH_MAP[si_item.stitchId]
                                                    if (!def) return []
                                                    return Array.from({length: si_item.count}, (_, i) => (
                                                        <View key={`${idx}-${i}`} style={{
                                                            width: 22, height: 26, borderRadius: 6,
                                                            backgroundColor: colors.cream2,
                                                            borderWidth: 1.2, borderColor: def.color,
                                                            alignItems: 'center', justifyContent: 'center',
                                                        }}>
                                                            <StitchGlyph symbol={def.symbol} size={12} color={def.color}/>
                                                        </View>
                                                    ))
                                                })}
                                            </View>
                                        ) : (
                                            <Text style={{fontFamily: fonts.mono, fontSize: 11, color: colors.inkMute, fontStyle: 'italic', paddingTop: 6, paddingBottom: 2}}>
                                                empty · tap a stitch below to start filling
                                            </Text>
                                        )}
                                    </Pressable>
                                )
                            })}
                        </View>

                        {/* Add row — split ReuseChooser */}
                        <View style={{flexDirection: 'row', gap: 8, marginTop: 8}}>
                            <Pressable
                                onPress={() => addRow(si)}
                                style={{flex: 1.1, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.brick, borderRadius: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6}}
                            >
                                <Icon name="plus" size={14} color={colors.brick}/>
                                <Text style={{fontFamily: fonts.bodySb, fontSize: 13, color: colors.brick}}>New row</Text>
                            </Pressable>
                            <Pressable style={{flex: 1, borderWidth: 1, borderColor: colors.rule, backgroundColor: colors.card, borderRadius: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6}}>
                                <Icon name="library" size={14} color={colors.mustardDk}/>
                                <Text style={{fontFamily: fonts.bodySb, fontSize: 13, color: colors.ink}}>From library</Text>
                                <View style={{backgroundColor: colors.cream2, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1}}>
                                    <Text style={{fontFamily: fonts.mono, fontSize: 10, color: colors.inkMute, fontWeight: '700', letterSpacing: 0.5}}>28</Text>
                                </View>
                            </Pressable>
                        </View>

                        {/* Tip */}
                        <View style={{marginTop: 14, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: colors.cream2, borderRadius: 12, flexDirection: 'row', gap: 8, alignItems: 'flex-start'}}>
                            <Icon name="bulb" size={14} color={colors.mustardDk}/>
                            <Text style={{fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft, flex: 1, lineHeight: 18}}>
                                <Text style={{fontWeight: '700', color: colors.ink}}>Tip: </Text>
                                Long-press a row to duplicate it — copy-paste your way through a pattern.
                            </Text>
                        </View>
                    </View>
                ))}

                <Pressable onPress={addSeq} style={[styles.addPartBtn, {borderColor: colors.brick, borderRadius: radius.md}]}>
                    <Icon name="plus" size={14} color={colors.brick}/>
                    <Text style={{fontFamily: fonts.bodySb, fontSize: 13, color: colors.brick}}>Add sequence</Text>
                </Pressable>

                {/* Full stitch picker (via "All N stitches →") */}
                {showFullPicker && activeRow && (
                    <View style={[styles.stitchPickerPanel, {backgroundColor: colors.card, borderColor: colors.rule, borderRadius: radius.lg, marginTop: spacing[3]}]}>
                        <View style={styles.pickerHeader}>
                            <Text style={{fontFamily: fonts.bodySb, fontSize: fontSize.base, color: colors.ink}}>Pick a stitch</Text>
                            <Pressable onPress={() => setShowFullPicker(false)}>
                                <Icon name="x" size={18} color={colors.inkMute}/>
                            </Pressable>
                        </View>
                        <View style={styles.stitchGrid}>
                            {STITCHES.filter(s => s.type === draft.craft).map(s => (
                                <Pressable
                                    key={s.id}
                                    onPress={() => addStitchToRow(activeRow.partIdx, activeRow.seqIdx, activeRow.rowIdx, s.id)}
                                    style={[styles.stitchPickerChip, {backgroundColor: s.color, borderRadius: 10}]}
                                >
                                    <StitchGlyph symbol={s.symbol} size={20} color="#2B1810"/>
                                    <Text style={{fontFamily: fonts.mono, fontSize: 9, color: '#2B1810', fontWeight: '700'}}>{s.abbr}</Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Stitch dock — pinned above wizard footer */}
            {dockVisible && (
                <View style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.rule,
                    paddingTop: 10, paddingBottom: 10, paddingHorizontal: 20,
                }}>
                    <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8}}>
                        <Text style={{fontFamily: fonts.mono, fontSize: 10, color: colors.brick, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase'}}>
                            Tap to add to Row {activeRow!.rowIdx + 1} ✱
                        </Text>
                        <Pressable onPress={() => setShowFullPicker(true)} style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
                            <Text style={{fontFamily: fonts.mono, fontSize: 11, color: colors.brick, fontWeight: '700'}}>
                                All {totalStitchCount} stitches
                            </Text>
                            <Icon name="chevR" size={12} color={colors.brick}/>
                        </Pressable>
                    </View>
                    <View style={{flexDirection: 'row', gap: 6}}>
                        {quickStitches.map(s => (
                            <Pressable
                                key={s.id}
                                onPress={() => addStitchToRow(activeRow!.partIdx, activeRow!.seqIdx, activeRow!.rowIdx, s.id)}
                                style={{flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.rule, borderRadius: 10, paddingVertical: 6, alignItems: 'center', gap: 3}}
                            >
                                <View style={{width: 28, height: 28, borderRadius: 8, backgroundColor: s.color, alignItems: 'center', justifyContent: 'center'}}>
                                    <StitchGlyph symbol={s.symbol} size={16} color="#2B1810"/>
                                </View>
                                <Text style={{fontSize: 9.5, fontFamily: fonts.mono, color: colors.inkSoft, fontWeight: '700'}}>{s.abbr}</Text>
                            </Pressable>
                        ))}
                    </View>
                </View>
            )}
        </View>
    )
}

// ── Step 4 ─────────────────────────────────────────────────────
function Step4({draft, onChange}: { draft: Draft; onChange: (d: Draft) => void }) {
    const {colors, fonts, fontSize, spacing, radius} = useTheme()

    const updateRepeats = (partIdx: number, seqIdx: number, val: number) => {
        const part = draft.parts[partIdx]!
        const seq = part.sequences[seqIdx]!
        const updated = {...seq, totalRepeats: Math.max(1, val)}
        const updPart = {...part, sequences: part.sequences.map((s, i) => i === seqIdx ? updated : s)}
        onChange({...draft, parts: draft.parts.map((p, i) => i === partIdx ? updPart : p)})
    }

    const toggleLoop = (partIdx: number, seqIdx: number) => {
        const part = draft.parts[partIdx]!
        const seq = part.sequences[seqIdx]!
        const updated = {...seq, loop: !seq.loop}
        const updPart = {...part, sequences: part.sequences.map((s, i) => i === seqIdx ? updated : s)}
        onChange({...draft, parts: draft.parts.map((p, i) => i === partIdx ? updPart : p)})
    }

    const totalRowCount = draft.parts.reduce((sum, p) =>
        sum + p.sequences.reduce((s2, seq) => s2 + seq.rows.length * seq.totalRepeats, 0), 0
    )

    return (
        <ScrollView contentContainerStyle={{padding: spacing[5], gap: spacing[4], paddingBottom: 140}}>
            {draft.parts.map((part, pi) => (
                <View key={part.id}>
                    <Text style={{
                        fontFamily: fonts.mono,
                        fontSize: 10,
                        color: colors.inkMute,
                        letterSpacing: 2,
                        textTransform: 'uppercase',
                        marginBottom: 8
                    }}>
                        {part.name}
                    </Text>
                    {part.sequences.map((seq, si) => (
                        <View key={seq.id} style={[styles.arrangeCard, {
                            backgroundColor: colors.card,
                            borderColor: colors.rule,
                            borderRadius: radius.lg
                        }]}>
                            <Text style={{
                                fontFamily: fonts.bodySb,
                                fontSize: fontSize.base,
                                color: colors.ink,
                                flex: 1
                            }}>{seq.name}</Text>
                            <Text style={{
                                fontFamily: fonts.mono,
                                fontSize: 11,
                                color: colors.inkMute,
                                marginTop: 2,
                                marginBottom: 12
                            }}>
                                {seq.rows.length} rows
                            </Text>

                            <View style={styles.repeatRow}>
                                <Text style={{
                                    fontFamily: fonts.body,
                                    fontSize: fontSize.sm,
                                    color: colors.inkSoft
                                }}>Repeats</Text>
                                <View style={styles.stepper}>
                                    <Pressable onPress={() => updateRepeats(pi, si, seq.totalRepeats - 1)}
                                               style={[styles.stepperBtn, {borderColor: colors.rule}]}>
                                        <Icon name="chevL" size={14} color={colors.ink}/>
                                    </Pressable>
                                    <Text style={{
                                        fontFamily: fonts.mono,
                                        fontSize: 15,
                                        color: colors.ink,
                                        minWidth: 28,
                                        textAlign: 'center'
                                    }}>
                                        {seq.totalRepeats}
                                    </Text>
                                    <Pressable onPress={() => updateRepeats(pi, si, seq.totalRepeats + 1)}
                                               style={[styles.stepperBtn, {borderColor: colors.rule}]}>
                                        <Icon name="chevR" size={14} color={colors.ink}/>
                                    </Pressable>
                                </View>
                            </View>

                            <Pressable
                                onPress={() => toggleLoop(pi, si)}
                                style={[styles.loopToggle, {
                                    borderColor: seq.loop ? colors.forest : colors.rule,
                                    backgroundColor: seq.loop ? colors.forest + '18' : 'transparent',
                                    borderRadius: radius.sm
                                }]}
                            >
                                <Icon name="loop" size={14} color={seq.loop ? colors.forest : colors.inkMute}/>
                                <Text style={{
                                    fontFamily: fonts.body,
                                    fontSize: 13,
                                    color: seq.loop ? colors.forest : colors.inkMute,
                                    fontWeight: '600'
                                }}>
                                    Loop endlessly
                                </Text>
                            </Pressable>
                        </View>
                    ))}
                </View>
            ))}

            <View style={[styles.totalBadge, {
                backgroundColor: colors.card,
                borderColor: colors.rule,
                borderRadius: radius.md
            }]}>
                <Text style={{
                    fontFamily: fonts.mono,
                    fontSize: 11,
                    color: colors.inkMute,
                    letterSpacing: 1.5,
                    textTransform: 'uppercase'
                }}>Total rows</Text>
                <Text style={{fontFamily: fonts.display, fontSize: 32, color: colors.brick}}>{totalRowCount}</Text>
            </View>
        </ScrollView>
    )
}

// ── Root wizard ─────────────────────────────────────────────────
export default function SetupWizard() {
    const {colors, fonts, spacing, radius} = useTheme()
    const router = useRouter()
    const defaultCraft = useSettingsStore((s) => s.defaultCraft)
    const markWelcomeSeen = useSettingsStore((s) => s.markWelcomeSeen)
    const addProject = useProjectStore((s) => s.addProject)

    const [step, setStep] = useState(0)
    const [triedNext, setTriedNext] = useState(false)
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
                name: 'Main',
                color: PART_COLORS[0]!,
                sequences: [
                    {id: uuid4(), name: 'Main sequence', rows: [], totalRepeats: 1, loop: false},
                ],
            },
        ],
    })

    const STEP_META = [
        {
            label: 'Step 1 of 4',
            title: 'What are we making?',
            sub: "Name it, pick your yarn and your tool — we'll remember."
        },
        {
            label: 'Step 2 of 4',
            title: 'Break it into parts.',
            sub: 'A cardigan has a body and two sleeves. A scarf has one part. You decide.'
        },
        {label: 'Step 3 of 4', title: 'Build a sequence.', sub: 'Name it, add rows, tap stitches below to fill the active row.'},
        {label: 'Step 4 of 4', title: 'Arrange & repeat.', sub: 'Set how many times each sequence repeats.'},
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
                <Text style={{fontFamily: fonts.mono, fontSize: 11, color: colors.inkMute}}>{step + 1}/4</Text>
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
                {step === 2 && <Step3 draft={draft} onChange={setDraft}/>}
                {step === 3 && <Step4 draft={draft} onChange={setDraft}/>}
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
                            Fill the required fields to continue.
                        </Text>
                        <Icon name="chevDown" size={14} color={colors.brick}/>
                    </View>
                )}
                <View style={styles.footerBtns}>
                    <Btn variant="ghost" size="lg" onPress={back}>
                        {step === 0 ? 'Cancel' : 'Back'}
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
                                    Next
                                </Text>
                            </Pressable>
                        ) : (
                            <Btn variant="primary" size="lg" icon="chevR" full onPress={next}>
                                {step === 3 ? 'Cast on!' : 'Next'}
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
    tabBtn2: {flex: 1, alignItems: 'center', paddingVertical: 8},
    seqBlock: {borderWidth: 1, padding: 14, gap: 0},
    rowCard: {borderTopWidth: 1, borderTopColor: 'transparent', paddingTop: 12, marginTop: 12},
    stitchFlow: {flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center'},
    miniChip2: {alignItems: 'center', paddingHorizontal: 8, paddingVertical: 6},
    addStitchBtn: {width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderWidth: 1},
    addRowBtn: {flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 12, marginTop: 4},
    stitchPickerPanel: {borderWidth: 1, padding: 14},
    pickerHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12},
    stitchGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
    stitchPickerChip: {alignItems: 'center', padding: 8, width: 52},
    arrangeCard: {borderWidth: 1, padding: 16, marginBottom: 8},
    repeatRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10},
    stepper: {flexDirection: 'row', alignItems: 'center', gap: 8},
    stepperBtn: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
        borderWidth: 1
    },
    loopToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderWidth: 1,
        paddingHorizontal: 12,
        paddingVertical: 8
    },
    totalBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        padding: 16
    },
})
