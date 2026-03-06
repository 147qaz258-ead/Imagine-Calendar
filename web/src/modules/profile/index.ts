/**
 * 用户画像模块
 */
export { ProfilePage } from './components/ProfilePage'
export { PreferencesForm } from './components/PreferencesForm'
export { profileApi } from './services/profileApi'
export { fetchProfile, updateProfile, updatePreferences } from './store/profileSlice'
export type { User, UserPreferences, ProfileState } from './types'