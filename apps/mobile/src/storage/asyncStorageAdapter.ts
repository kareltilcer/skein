import AsyncStorage from '@react-native-async-storage/async-storage'
import { setStorageAdapter, type StorageAdapter } from '@skein/shared'

const asyncStorageAdapter: StorageAdapter = {
  getItem:    (key) => AsyncStorage.getItem(key),
  setItem:    (key, value) => AsyncStorage.setItem(key, value),
  removeItem: (key) => AsyncStorage.removeItem(key),
  multiRemove: (keys) => AsyncStorage.multiRemove(keys).then(() => undefined),
}

setStorageAdapter(asyncStorageAdapter)
