// Project-name validation state machine for the Setup wizard Step 1.
// Both apps render their own copy / colors — this function only decides the
// state. The translation key for the message lives on the app side.

export type NameValidationState = 'empty' | 'ok' | 'mid' | 'near' | 'over' | 'required'

export const NAME_MAX = 60
const NEAR_THRESHOLD = NAME_MAX - 5
const MID_THRESHOLD  = 35

export function validateProjectName(
  length: number,
  requiredError: boolean,
  max: number = NAME_MAX,
): NameValidationState {
  if (requiredError && length === 0) return 'required'
  if (length === 0)                  return 'empty'
  if (length >= max)                 return 'over'
  if (length >= max - 5)             return 'near'
  if (length >= MID_THRESHOLD)       return 'mid'
  return 'ok'
}

// Map state → token key. Apps look these up in their theme.
// Returning a key keeps this file token-system-agnostic.
export const STATE_TO_COLOR_TOKEN: Record<NameValidationState, 'brick' | 'brickDk' | 'mustardDk' | 'forest' | 'inkMute'> = {
  empty:    'inkMute',
  ok:       'forest',
  mid:      'mustardDk',
  near:     'brickDk',
  over:     'brick',
  required: 'brick',
}

// Translation-key suffix for the state's helper message; the app prepends its
// own namespace (e.g. `wizard.nameState${suffix}`).
export function stateMessageSuffix(state: NameValidationState): string {
  switch (state) {
    case 'empty':    return 'Empty'
    case 'ok':       return 'Ok'
    case 'mid':      return 'Mid'
    case 'near':     return 'Near'
    case 'over':     return 'Over'
    case 'required': return 'Required'
  }
}

export {
  NAME_MAX as PROJECT_NAME_MAX,
  NEAR_THRESHOLD as PROJECT_NAME_NEAR,
  MID_THRESHOLD as PROJECT_NAME_MID,
}
