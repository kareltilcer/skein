import React from 'react'
import Svg, { Line, Circle, Path, Polyline, Rect } from 'react-native-svg'

export type IconName =
  | 'plus' | 'chevL' | 'chevR' | 'chevDown' | 'x' | 'search' | 'book'
  | 'home' | 'gear' | 'more' | 'back' | 'check' | 'moon' | 'sun' | 'bulb'
  | 'edit' | 'trash' | 'yarn' | 'needle' | 'loop' | 'refresh' | 'save'
  | 'user' | 'globe' | 'cloud' | 'play' | 'pause' | 'repeat' | 'grid'
  | 'grip' | 'sparkle' | 'settings' | 'library' | 'backspace'
  | 'flag' | 'undo' | 'layers'

type Props = {
  name: IconName
  size?: number
  color?: string
  stroke?: number
}

export default function Icon({ name, size = 22, color = 'currentColor', stroke = 2 }: Props) {
  const p = { stroke: color, strokeWidth: stroke, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' }

  const icons: Record<IconName, React.ReactNode> = {
    plus:     <><Line x1="12" y1="5" x2="12" y2="19" {...p}/><Line x1="5" y1="12" x2="19" y2="12" {...p}/></>,
    chevL:    <Polyline points="15,5 8,12 15,19" {...p}/>,
    chevR:    <Polyline points="9,5 16,12 9,19" {...p}/>,
    chevDown: <Polyline points="6,9 12,16 18,9" {...p}/>,
    x:        <><Line x1="6" y1="6" x2="18" y2="18" {...p}/><Line x1="18" y1="6" x2="6" y2="18" {...p}/></>,
    search:   <><Circle cx="11" cy="11" r="6" {...p}/><Line x1="16" y1="16" x2="21" y2="21" {...p}/></>,
    book:     <Path d="M5 4 L5 20 L19 20 L19 4 L12 7 L5 4 Z" {...p}/>,
    home:     <Path d="M4 11 L12 4 L20 11 V20 H4 Z" {...p}/>,
    gear:     <><Circle cx="12" cy="12" r="3.2" {...p}/><Path d="M12 3 V6 M12 18 V21 M3 12 H6 M18 12 H21 M5.5 5.5 L7.5 7.5 M16.5 16.5 L18.5 18.5 M5.5 18.5 L7.5 16.5 M16.5 7.5 L18.5 5.5" {...p}/></>,
    more:     <><Circle cx="6"  cy="12" r="1.4" fill={color}/><Circle cx="12" cy="12" r="1.4" fill={color}/><Circle cx="18" cy="12" r="1.4" fill={color}/></>,
    back:     <Polyline points="15,5 8,12 15,19" {...p}/>,
    check:    <Polyline points="5,12 10,17 19,7" {...p}/>,
    moon:     <Path d="M20 14 A 8 8 0 1 1 10 4 A 6 6 0 0 0 20 14 Z" {...p}/>,
    sun:      <><Circle cx="12" cy="12" r="4" {...p}/><Line x1="12" y1="3" x2="12" y2="5" {...p}/><Line x1="12" y1="19" x2="12" y2="21" {...p}/><Line x1="3" y1="12" x2="5" y2="12" {...p}/><Line x1="19" y1="12" x2="21" y2="12" {...p}/></>,
    bulb:     <><Path d="M9 18 H15" {...p}/><Path d="M10 14 C 7 12 7 8 12 6 C 17 8 17 12 14 14 Z" {...p}/><Path d="M10 18 V20 H14 V18" {...p}/></>,
    edit:     <Path d="M4 20 L8 19 L20 7 L17 4 L5 16 Z" {...p}/>,
    trash:    <Path d="M5 7 H19 M9 7 V5 H15 V7 M7 7 L8 20 H16 L17 7" {...p}/>,
    yarn:     <><Circle cx="12" cy="13" r="7" {...p}/><Path d="M6 10 Q 12 7 18 10 M5 14 Q 12 11 19 14 M8 18 Q 12 15 16 18" {...p}/></>,
    needle:   <><Line x1="4" y1="20" x2="20" y2="4" {...p}/><Circle cx="5.5" cy="18.5" r="2" {...p}/></>,
    loop:     <Path d="M6 14 C 6 9 18 9 18 14 C 18 19 6 19 6 14 Z" {...p}/>,
    refresh:  <><Path d="M4 12 A 8 8 0 0 1 18 7" {...p}/><Polyline points="18,3 18,7 14,7" {...p}/><Path d="M20 12 A 8 8 0 0 1 6 17" {...p}/><Polyline points="6,21 6,17 10,17" {...p}/></>,
    save:     <><Path d="M5 5 H17 L19 7 V19 H5 Z" {...p}/><Path d="M8 5 V10 H15 V5" {...p}/></>,
    user:     <><Circle cx="12" cy="9" r="3.5" {...p}/><Path d="M5 20 C 6 15 18 15 19 20" {...p}/></>,
    globe:    <><Circle cx="12" cy="12" r="8" {...p}/><Path d="M4 12 H20 M12 4 C 16 8 16 16 12 20 C 8 16 8 8 12 4" {...p}/></>,
    cloud:    <Path d="M7 18 A 4 4 0 0 1 7 11 A 5 5 0 0 1 17 11 A 4 4 0 0 1 17 18 Z" {...p}/>,
    play:     <Path d="M7 5 V19 L19 12 Z" fill={color} stroke="none"/>,
    pause:    <><Rect x="6" y="5" width="4" height="14" fill={color}/><Rect x="14" y="5" width="4" height="14" fill={color}/></>,
    repeat:   <><Polyline points="6,4 4,7 6,10" {...p}/><Path d="M4 7 H16 A 4 4 0 0 1 20 11 V14" {...p}/><Polyline points="18,20 20,17 18,14" {...p}/><Path d="M20 17 H8 A 4 4 0 0 1 4 13 V10" {...p}/></>,
    grid:     <><Rect x="4" y="4" width="7" height="7" rx="1" {...p}/><Rect x="13" y="4" width="7" height="7" rx="1" {...p}/><Rect x="4" y="13" width="7" height="7" rx="1" {...p}/><Rect x="13" y="13" width="7" height="7" rx="1" {...p}/></>,
    grip:     <><Circle cx="9" cy="7" r="1.2" fill={color}/><Circle cx="15" cy="7" r="1.2" fill={color}/><Circle cx="9" cy="12" r="1.2" fill={color}/><Circle cx="15" cy="12" r="1.2" fill={color}/><Circle cx="9" cy="17" r="1.2" fill={color}/><Circle cx="15" cy="17" r="1.2" fill={color}/></>,
    sparkle:  <Path d="M12 4 L13.5 10.5 L20 12 L13.5 13.5 L12 20 L10.5 13.5 L4 12 L10.5 10.5 Z" {...p}/>,
    settings: <><Circle cx="12" cy="12" r="3" {...p}/><Path d="M12 4 V6 M12 18 V20 M4 12 H6 M18 12 H20 M6 6 L7.5 7.5 M16.5 16.5 L18 18 M6 18 L7.5 16.5 M16.5 7.5 L18 6" {...p}/></>,
    library:  <><Line x1="6" y1="4" x2="6" y2="20" {...p}/><Line x1="10" y1="4" x2="10" y2="20" {...p}/><Path d="M14 4 L18 20" {...p}/></>,
    backspace: <><Path d="M20 7 H9 L3 12 L9 17 H20 Z" {...p}/><Line x1="14" y1="10" x2="18" y2="14" {...p}/><Line x1="18" y1="10" x2="14" y2="14" {...p}/></>,
    flag:     <><Line x1="6" y1="3" x2="6" y2="21" {...p}/><Path d="M6 4 H18 L14 8 L18 12 H6" {...p}/></>,
    undo:     <><Path d="M4 10 A 7 7 0 0 1 18 10 V14" {...p}/><Polyline points="4,6 4,10 8,10" {...p}/></>,
    layers:   <><Path d="M12 4 L20 9 L12 14 L4 9 Z" {...p}/><Path d="M4 13 L12 18 L20 13" {...p}/><Path d="M4 17 L12 22 L20 17" {...p}/></>,
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {icons[name]}
    </Svg>
  )
}
