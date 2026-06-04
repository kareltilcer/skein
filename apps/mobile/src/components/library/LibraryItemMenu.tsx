import React, { useRef, useState } from 'react'
import { View, Text, Pressable, Modal, StyleSheet, Dimensions } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../../theme/ThemeContext'
import Icon from '../ui/Icon'

type Props = {
  label: string
  onEdit: () => void
  onDelete: () => void
}

const MENU_WIDTH = 220
const MENU_OFFSET = 8

export default function LibraryItemMenu({ label, onEdit, onDelete }: Props) {
  const { t } = useTranslation()
  const { colors, radius } = useTheme()
  const triggerRef = useRef<View>(null)
  const [open, setOpen] = useState(false)
  const [anchor, setAnchor] = useState<{ top: number; right: number } | null>(null)

  const openMenu = () => {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      const screenW = Dimensions.get('window').width
      setAnchor({
        top: y + height + MENU_OFFSET,
        right: screenW - (x + width),
      })
      setOpen(true)
    })
  }
  const close = () => setOpen(false)

  const fire = (action: () => void) => {
    close()
    setTimeout(action, 0)
  }

  return (
    <>
      <Pressable
        ref={triggerRef}
        onPress={openMenu}
        hitSlop={8}
        style={[styles.trigger, { backgroundColor: open ? colors.cream2 : 'transparent' }]}
      >
        <Icon name="more" size={18} color={open ? colors.ink : colors.inkMute}/>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={close}/>
        {anchor && (
          <View style={[styles.menuCard, {
            top: anchor.top,
            right: anchor.right,
            backgroundColor: colors.card,
            borderColor: colors.rule,
            borderRadius: radius.lg,
          }]}>
            <MenuItem
              icon="edit"
              label={t('library.menuEdit', { kind: label })}
              onPress={() => fire(onEdit)}
            />
            <View style={[styles.divider, { backgroundColor: colors.rule }]}/>
            <MenuItem
              icon="trash"
              label={t('library.menuDelete', { kind: label })}
              danger
              onPress={() => fire(onDelete)}
            />
          </View>
        )}
      </Modal>
    </>
  )
}

function MenuItem({
  icon, label, onPress, danger = false,
}: {
  icon: 'edit' | 'trash'
  label: string
  onPress: () => void
  danger?: boolean
}) {
  const { colors, fonts } = useTheme()
  const fg = danger ? colors.brick : colors.ink
  const tint = danger ? 'rgba(156,61,46,0.10)' : colors.cream2
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: tint }}
      style={({ pressed }) => [
        styles.menuItem,
        { backgroundColor: pressed ? tint : 'transparent' },
      ]}
    >
      <View style={[styles.menuIconWrap, { backgroundColor: tint }]}>
        <Icon name={icon} size={17} color={fg} stroke={2.2}/>
      </View>
      <Text style={{
        fontFamily: fonts.bodySb, fontSize: 14.5, color: fg, letterSpacing: -0.05,
      }}>
        {label}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  trigger: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  menuCard: {
    position: 'absolute',
    width: MENU_WIDTH,
    padding: 6,
    borderWidth: 1,
    shadowColor: '#2B1810',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 40,
    elevation: 12,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, paddingHorizontal: 10,
    borderRadius: 11,
  },
  menuIconWrap: {
    width: 30, height: 30, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  divider: {
    height: 1, marginVertical: 4, marginHorizontal: 8, opacity: 0.7,
  },
})
