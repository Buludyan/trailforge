import { configureStore } from '@reduxjs/toolkit';

import { mapReducer } from '@/features/map/mapSlice';

export function makeStore() {
  return configureStore({
    reducer: {
      map: mapReducer,
    },
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];

let browserStore: AppStore | undefined;

export function getStore(): AppStore {
  if (typeof window === 'undefined') {
    return makeStore();
  }

  browserStore ??= makeStore();
  return browserStore;
}
