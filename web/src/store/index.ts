import { configureStore } from '@reduxjs/toolkit'
import calendarReducer from '@/modules/calendar/store/calendarSlice'
import filterReducer from '@/modules/filter/store/filterSlice'
import roundTableReducer from '@/modules/roundtable/store/roundTableSlice'
import chatReducer from '@/modules/roundtable/store/chatSlice'
import authReducer from '@/modules/auth/store/authSlice'
import profileReducer from '@/modules/profile/store/profileSlice'
import cognitiveReducer from '@/modules/cognitive/store/cognitiveSlice'
import cognitiveBoundaryReducer from '@/modules/cognitive-boundary/store/cognitiveBoundarySlice'
import notificationReducer from '@/modules/notification/store/notificationSlice'

export const store = configureStore({
  reducer: {
    calendar: calendarReducer,
    filter: filterReducer,
    roundTable: roundTableReducer,
    chat: chatReducer,
    auth: authReducer,
    profile: profileReducer,
    cognitive: cognitiveReducer,
    cognitiveBoundary: cognitiveBoundaryReducer,
    notification: notificationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
})

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch