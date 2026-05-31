import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
// BottomTabBarProps type from react-navigation
type BottomTabBarProps = {
  state: { index: number; routes: { key: string; name: string }[] }
  descriptors: Record<string, unknown>
  navigation: { emit: (opts: { type: string; target?: string; canPreventDefault: boolean }) => { defaultPrevented: boolean }; navigate: (name: string) => void }
}
import { useTheme } from '../../theme/ThemeContext'
import Icon from './Icon'

const TABS = [
  { name: 'index',    labelKey: 'tabs.projects', icon: 'home'     },
  { name: 'library',  labelKey: 'tabs.library',  icon: 'library'  },
  { name: 'settings', labelKey: 'tabs.settings', icon: 'settings' },
] as const

export default function TabBar({ state, navigation }: BottomTabBarProps) {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()

  return (
    <View style={[
      styles.container,
      {
        paddingBottom: insets.bottom + 8,
        borderTopColor: colors.rule,
        backgroundColor: colors.tabBg,
      },
    ]}>
      {TABS.map((tab, i) => {
        const route = state.routes[i]
        const isFocused = state.index === i
        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route?.key, canPreventDefault: true })
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(tab.name)
          }
        }

        return (
          <Pressable key={tab.name} onPress={onPress} style={styles.tab}>
            <Icon
              name={tab.icon as any}
              size={22}
              color={isFocused ? colors.brick : colors.inkMute}
            />
            <Text style={[
              styles.label,
              { color: isFocused ? colors.brick : colors.inkMute },
            ]}>
              {t(tab.labelKey)}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingTop: 10,
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
})
