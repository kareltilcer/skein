import React, { useEffect, useRef, useState } from 'react'
import { View, Text, Pressable, Modal, Animated, Easing, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'

import { useTheme } from '../theme/ThemeContext'
import { useProjectStore } from '../store/projectStore'
import Icon from './ui/Icon'

type Props = {
  projectId: string
  onSwitchPart: () => void
}

type ItemKey = 'edit' | 'finish' | 'switch'

export default function PartMenu({ projectId, onSwitchPart }: Props) {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const project = useProjectStore((s) => s.projects.find((p) => p.id === projectId))
  const updateProject = useProjectStore((s) => s.updateProject)
  const finished = project?.status === 'finished'

  const [open, setOpen] = useState(false)
  const anim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(anim, {
      toValue: open ? 1 : 0,
      duration: 140,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()
  }, [open, anim])

  const handle = (key: ItemKey) => {
    if (key === 'edit') {
      setOpen(false)
      router.push(`/setup?projectId=${projectId}`)
    } else if (key === 'finish') {
      updateProject(projectId, { status: finished ? 'active' : 'finished' })
    } else if (key === 'switch') {
      setOpen(false)
      onSwitchPart()
    }
  }

  const items: Array<{
    key: ItemKey
    icon: 'edit' | 'flag' | 'undo' | 'layers'
    label: string
    accent?: boolean
  }> = [
    { key: 'edit', icon: 'edit', label: t('knitting.editProject') },
    {
      key: 'finish',
      icon: finished ? 'undo' : 'flag',
      label: finished ? t('knitting.unmarkFinished') : t('knitting.markFinished'),
      accent: !finished,
    },
    { key: 'switch', icon: 'layers', label: t('knitting.switchPart') },
  ]

  // top of the popover: safe-area inset + topBar paddingTop (8) + button height (36) + 8 gap
  const popoverTop = insets.top + 8 + 36 + 8

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.trigger,
          {
            backgroundColor: open ? colors.cream2 : colors.card,
            borderColor: colors.rule,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <Icon name="more" size={18} color={colors.ink}/>
      </Pressable>

      <Modal transparent visible={open} animationType="none" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Animated.View
            pointerEvents="box-none"
            style={[
              styles.popover,
              {
                top: popoverTop,
                right: 20,
                backgroundColor: colors.card,
                borderColor: colors.rule,
                opacity: anim,
                transform: [
                  {
                    translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] }),
                  },
                ],
              },
            ]}
          >
            {/* notch */}
            <View
              style={[
                styles.notch,
                { backgroundColor: colors.card, borderColor: colors.rule },
              ]}
            />
            {items.map((it) => (
              <React.Fragment key={it.key}>
                {it.key === 'switch' && (
                  <View style={[styles.divider, { backgroundColor: colors.rule }]}/>
                )}
                <MenuItem item={it} onPress={() => handle(it.key)}/>
              </React.Fragment>
            ))}
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  )
}

type MenuItemProps = {
  item: {
    key: ItemKey
    icon: 'edit' | 'flag' | 'undo' | 'layers'
    label: string
    accent?: boolean
  }
  onPress: () => void
}

function MenuItem({ item, onPress }: MenuItemProps) {
  const { colors, fonts } = useTheme()
  const fg = item.accent ? colors.forest : colors.ink
  const tileBg = item.accent ? 'rgba(63,107,74,0.10)' : colors.cream2
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? colors.cream2 : 'transparent' },
      ]}
    >
      <View style={[styles.iconTile, { backgroundColor: tileBg }]}>
        <Icon name={item.icon} size={17} color={fg} stroke={2.2}/>
      </View>
      <Text style={{ fontFamily: fonts.bodySb, fontSize: 14.5, color: fg, letterSpacing: 0.15 }}>
        {item.label}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  trigger: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    flex: 1,
  },
  popover: {
    position: 'absolute',
    minWidth: 218,
    padding: 6,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#2B1810',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 30,
    elevation: 12,
  },
  notch: {
    position: 'absolute',
    top: -6,
    right: 13,
    width: 11,
    height: 11,
    borderLeftWidth: 1,
    borderTopWidth: 1,
    transform: [{ rotate: '45deg' }],
    borderTopLeftRadius: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 11,
  },
  iconTile: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    opacity: 0.7,
    marginHorizontal: 8,
    marginVertical: 6,
  },
})
