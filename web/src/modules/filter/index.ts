/**
 * 筛选模块入口
 */

// 类型
export * from './types'

// API 服务
export { filterApi } from './services/filterApi'

// Redux
export {
  fetchFilterOptions,
  filterEvents as filterEventsAction,
  fetchMatchingAnalyze,
  togglePanel,
  openPanel,
  closePanel,
  updateFilter,
  updateFilters,
  applyFilters,
  clearFilters,
  resetFilters,
  toggleDimension,
  expandAllDimensions,
  collapseAllDimensions,
  setPage,
  clearMatchingResult,
  clearError,
} from './store/filterSlice'
export { default as filterReducer } from './store/filterSlice'

// Hooks
export {
  useFilter,
  useFilterOptions,
  useFilterPanel,
  useFilterActions,
  useFilterResults,
  useMatchingAnalyze,
  useFilterPersistence,
  useFilterPagination,
} from './hooks/useFilter'

// 组件
export { FilterButton } from './components/FilterButton'
export { FilterTag, FilterTagGroup } from './components/FilterTag'
export { FilterDimension } from './components/FilterDimension'
export { PresetSelector } from './components/PresetSelector'
export { FilterPanel } from './components/FilterPanel'
export { FilterDrawer } from './components/FilterDrawer'
export { FilterPage } from './pages/FilterPage'

// 工具函数
export {
  countFilters,
  isFiltersEmpty,
  isFiltersEqual,
  serializeFiltersToUrl,
  parseFiltersFromUrl,
  saveFiltersToStorage,
  loadFiltersFromStorage,
  clearFiltersFromStorage,
  getMatchScoreLevel,
} from './utils/filterUtils'