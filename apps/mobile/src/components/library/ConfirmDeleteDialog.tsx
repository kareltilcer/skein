import React from 'react'
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native'
import { BlurView } from 'expo-blur'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../../theme/ThemeContext'
import Icon from '../ui/Icon'

type Props = {
  visible: boolean
  onCancel: () => void
  onConfirm: () => void
  title: string
  body: string
  confirmLabel: string
  itemName?: string
  itemMeta?: string
}

export default function ConfirmDeleteDialog({
  visible, onCancel, onConfirm, title, body, confirmLabel, itemName, itemMeta,
}: Props) {
  const { t } = useTranslation()
  const { colors, fonts } = useTheme()

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <BlurView
          intensity={14}
          tint="dark"
          style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(43,24,16,0.42)' }]}
        />
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onCancel}/>
        <View style={[styles.dialogCard, { backgroundColor: colors.bg, borderColor: colors.rule }]}>
          <View style={styles.dialogHeader}>
            <View style={[styles.dialogIcon, { backgroundColor: colors.brick, shadowColor: colors.brick }]}>
              <Icon name="trash" size={26} color="#FBF6EC"/>
            </View>
            <View style={{ alignItems: 'center', gap: 6 }}>
              <Text style={{
                fontFamily: fonts.display, fontSize: 24, color: colors.brick,
                letterSpacing: -0.25, lineHeight: 26, textAlign: 'center',
              }}>
                {title}
              </Text>
              {itemMeta ? (
                <Text style={{
                  fontFamily: fonts.mono, fontSize: 10.5, color: colors.inkMute,
                  letterSpacing: 2, textTransform: 'uppercase',
                }}>
                  {itemMeta}
                </Text>
              ) : null}
            </View>
          </View>
          <View style={{ paddingTop: 14, paddingHorizontal: 20, paddingBottom: 4 }}>
            {itemName ? (
              <View style={{
                backgroundColor: colors.card,
                borderWidth: 1, borderColor: colors.rule,
                borderRadius: 12,
                paddingVertical: 10, paddingHorizontal: 12,
                alignItems: 'center',
              }}>
                <Text style={{ fontFamily: fonts.bodySb, fontSize: 13, color: colors.ink }} numberOfLines={1}>
                  {itemName}
                </Text>
              </View>
            ) : null}
            <Text style={{
              marginTop: itemName ? 10 : 0,
              fontSize: 13, color: colors.inkSoft,
              fontFamily: fonts.body, lineHeight: 19,
              textAlign: 'center', paddingHorizontal: 4,
            }}>
              {body}
            </Text>
          </View>
          <View style={{ padding: 20, paddingTop: 16, gap: 8 }}>
            <Pressable
              onPress={onConfirm}
              style={[styles.destructiveBtn, { backgroundColor: colors.brick, shadowColor: colors.brick }]}
            >
              <Icon name="trash" size={16} color="#FBF6EC"/>
              <Text style={{ fontFamily: fonts.bodySb, fontSize: 15, color: '#FBF6EC', letterSpacing: -0.1 }}>
                {confirmLabel}
              </Text>
            </Pressable>
            <Pressable
              onPress={onCancel}
              style={[styles.cancelBtn, { borderColor: colors.rule }]}
            >
              <Text style={{ fontFamily: fonts.bodySb, fontSize: 14.5, color: colors.ink, letterSpacing: -0.1 }}>
                {t('common.keepIt')}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  dialogCard: {
    width: 320, maxWidth: '92%',
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: 'rgba(43,24,16,1)',
    shadowOffset: { width: 0, height: 30 },
    shadowOpacity: 0.35,
    shadowRadius: 60,
    elevation: 20,
    marginTop: -48,
  },
  dialogHeader: {
    paddingTop: 22, paddingHorizontal: 22, paddingBottom: 14,
    backgroundColor: '#FBEFEA',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(156,61,46,0.15)',
    alignItems: 'center', gap: 12,
  },
  dialogIcon: {
    width: 56, height: 56, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
    transform: [{ rotate: '-4deg' }],
  },
  destructiveBtn: {
    height: 48, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  cancelBtn: {
    height: 44, borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
})
