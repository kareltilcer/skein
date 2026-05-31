import React from 'react'
import { Modal, View, Text, Pressable, ScrollView, StyleSheet, useWindowDimensions } from 'react-native'
import { BlurView } from 'expo-blur'
import { useTranslation } from 'react-i18next'

import { useTheme } from '../../theme/ThemeContext'
import { useProjectStore } from '../../store/projectStore'
import Icon from '../ui/Icon'
import type { Project } from '../../types'

const H_PAD = 20

type Props = {
  project: Project
  onClose: () => void
}

export default function PartPicker({ project, onClose }: Props) {
  const { t } = useTranslation()
  const { colors, fonts, fontSize, radius } = useTheme()
  const { height: screenHeight } = useWindowDimensions()
  const updateProject = useProjectStore((s) => s.updateProject)

  const pick = (idx: number) => {
    if (idx !== project.currentPartIndex) {
      updateProject(project.id, {
        currentPartIndex: idx,
        currentSequenceIndex: 0,
        currentRepeat: 1,
        currentRowIndex: 0,
      })
    }
    onClose()
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1 }}>
        <BlurView
          intensity={18}
          tint="dark"
          style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(43,24,16,0.35)' }]}
        />
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose}/>

        <View style={styles.sheetWrap} pointerEvents="box-none">
          <View style={[styles.sheet, { backgroundColor: colors.bg, height: Math.round(screenHeight * 0.7) }]}>
            <View style={[styles.handle, { backgroundColor: colors.rule }]}/>

            <View style={styles.header}>
              <Text style={{ fontFamily: fonts.bodySb, fontSize: fontSize.lg, color: colors.ink }}>
                {t('knitting.switchPart')}
              </Text>
              <Pressable onPress={onClose} hitSlop={12}>
                <Icon name="x" size={20} color={colors.inkMute}/>
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: H_PAD, paddingBottom: 24, gap: 8 }}>
              {project.parts.map((part, idx) => {
                const active = idx === project.currentPartIndex
                return (
                  <Pressable
                    key={part.id}
                    onPress={() => pick(idx)}
                    style={[
                      styles.item,
                      {
                        backgroundColor: active ? colors.cream2 : colors.card,
                        borderColor: active ? colors.brick : colors.rule,
                        borderRadius: radius.md,
                        borderWidth: active ? 1.5 : 1,
                      },
                    ]}
                  >
                    <View style={[styles.swatch, { backgroundColor: part.color, borderColor: colors.rule }]}/>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: fonts.bodySb, fontSize: fontSize.sm, color: colors.ink }}>
                        {part.name}
                      </Text>
                      <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.inkMute, marginTop: 2 }}>
                        {t('common.sequences', { count: part.sequences.length })}
                      </Text>
                    </View>
                    {active && <Icon name="check" size={16} color={colors.brick}/>}
                  </Pressable>
                )
              })}
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  sheetWrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 20,
  },
  handle: { width: 44, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 8 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: H_PAD,
    paddingBottom: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  swatch: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
  },
})
