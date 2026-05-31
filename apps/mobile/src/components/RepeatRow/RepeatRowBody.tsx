import React from 'react'
import { View } from 'react-native'
import { useTheme } from '../../theme/ThemeContext'
import type { RowSegment } from '../../types'
import { StitchTile, RepeatGroup, RowNotation } from './RepeatTiles'
import { expandStitches } from './segments'

export default function RepeatRowBody({ segments }: { segments: RowSegment[] }) {
  const { colors } = useTheme()
  return (
    <View>
      <View style={{
        flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap',
        rowGap: 18, columnGap: 8, paddingTop: 14,
      }}>
        {segments.map((seg, i) => {
          if (seg.type === 'fixed') {
            const ids = expandStitches(seg.stitches)
            return (
              <View key={i} style={{ flexDirection: 'row', gap: 3 }}>
                {ids.map((id, j) => <StitchTile key={j} id={id}/>)}
              </View>
            )
          }
          return <RepeatGroup key={i} stitches={seg.stitches} rule={seg.rule}/>
        })}
      </View>
      <View style={{
        marginTop: 12, paddingTop: 10,
        borderTopWidth: 1, borderTopColor: colors.rule, borderStyle: 'dashed',
      }}>
        <RowNotation segments={segments}/>
      </View>
    </View>
  )
}
