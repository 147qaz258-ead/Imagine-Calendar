/**
 * 筛选相关 Hooks
 */
import { useCallback, useEffect, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import type { RootState } from '@/store'
import {
  fetchFilterOptions,
  filterEvents,
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
} from '../store/filterSlice'
import type { UserPreferences, FilterPreset, FilterOption } from '../types'
import { countFilters, debounce, saveFiltersToStorage, loadFiltersFromStorage } from '../utils/filterUtils'

/**
 * 使用筛选状态
 */
export function useFilter() {
  const filterState = useAppSelector((state: RootState) => state.filter)

  return {
    ...filterState,
    filterCount: countFilters(filterState.filters),
    appliedFilterCount: countFilters(filterState.appliedFilters),
  }
}

/**
 * 使用筛选选项
 */
export function useFilterOptions() {
  const dispatch = useAppDispatch()
  const { filterOptions, optionsLoading, error } = useFilter()

  useEffect(() => {
    // 如果选项为空，自动加载
    const optionsArray = Object.values(filterOptions) as FilterOption[][]
    if (optionsArray.every((opts) => opts.length === 0)) {
      dispatch(fetchFilterOptions())
    }
  }, [dispatch, filterOptions])

  return {
    options: filterOptions,
    loading: optionsLoading,
    error,
    refetch: () => dispatch(fetchFilterOptions()),
  }
}

/**
 * 使用筛选面板
 */
export function useFilterPanel() {
  const dispatch = useAppDispatch()
  const { isPanelOpen, expandedDimensions, filterCount, hasChanges } = useFilter()

  return {
    isOpen: isPanelOpen,
    expandedDimensions,
    filterCount,
    hasChanges,
    toggle: () => dispatch(togglePanel()),
    open: () => dispatch(openPanel()),
    close: () => dispatch(closePanel()),
    toggleDimension: (dimension: string) => dispatch(toggleDimension(dimension)),
    expandAll: () => dispatch(expandAllDimensions()),
    collapseAll: () => dispatch(collapseAllDimensions()),
  }
}

/**
 * 使用筛选操作
 */
export function useFilterActions() {
  const dispatch = useAppDispatch()
  const { filters, appliedFilters, hasChanges } = useFilter()

  return {
    filters,
    appliedFilters,
    hasChanges,
    updateFilter: (key: keyof UserPreferences, values: string[]) =>
      dispatch(updateFilter({ key, values })),
    updateFilters: (newFilters: Partial<UserPreferences>) =>
      dispatch(updateFilters(newFilters)),
    applyFilters: () => dispatch(applyFilters()),
    clearFilters: () => dispatch(clearFilters()),
    resetFilters: () => dispatch(resetFilters()),
    applyPreset: (preset: FilterPreset) => dispatch(updateFilters(preset.preferences)),
  }
}

/**
 * 使用筛选结果（带防抖）
 */
export function useFilterResults(debounceMs: number = 500) {
  const dispatch = useAppDispatch()
  const { filteredEvents, totalResults, loading, currentPage, pageSize, appliedFilters } = useFilter()

  // 计算分页信息
  const totalPages = Math.ceil(totalResults / pageSize) || 1
  const hasNext = currentPage < totalPages
  const hasPrev = currentPage > 1

  // 防抖筛选函数
  const debouncedFilter = useRef(
    debounce((preferences: Partial<UserPreferences>, page?: number) => {
      dispatch(filterEvents({ preferences, page }))
    }, debounceMs)
  ).current

  const executeFilter = useCallback(
    (preferences: Partial<UserPreferences>, page?: number) => {
      debouncedFilter(preferences, page)
    },
    [debouncedFilter]
  )

  const loadPage = useCallback(
    (page: number) => {
      dispatch(filterEvents({ preferences: appliedFilters, page }))
    },
    [dispatch, appliedFilters]
  )

  return {
    events: filteredEvents,
    total: totalResults,
    loading,
    currentPage,
    totalPages,
    hasNext,
    hasPrev,
    executeFilter,
    loadPage,
  }
}

/**
 * 使用匹配度分析
 */
export function useMatchingAnalyze() {
  const dispatch = useAppDispatch()
  const { matchingResult, loading, error } = useFilter()

  const analyze = useCallback(
    (eventId: string) => {
      dispatch(fetchMatchingAnalyze(eventId))
    },
    [dispatch]
  )

  const clear = useCallback(() => {
    dispatch(clearMatchingResult())
  }, [dispatch])

  return {
    result: matchingResult,
    loading,
    error,
    analyze,
    clear,
  }
}

/**
 * 使用筛选持久化
 */
export function useFilterPersistence() {
  const { appliedFilters } = useFilter()
  const dispatch = useAppDispatch()

  // 加载保存的筛选条件
  useEffect(() => {
    const savedFilters = loadFiltersFromStorage()
    if (savedFilters && Object.keys(savedFilters).length > 0) {
      dispatch(updateFilters(savedFilters))
      dispatch(applyFilters())
    }
  }, [dispatch])

  // 保存筛选条件
  const saveFilters = useCallback(() => {
    saveFiltersToStorage(appliedFilters)
  }, [appliedFilters])

  // 清除保存的筛选条件
  const clearSavedFilters = useCallback(() => {
    localStorage.removeItem('calendar_filters')
  }, [])

  return {
    saveFilters,
    clearSavedFilters,
  }
}

/**
 * 使用分页
 */
export function useFilterPagination() {
  const dispatch = useAppDispatch()
  const { currentPage, pageSize, totalResults } = useFilter()

  const totalPages = Math.ceil(totalResults / pageSize)

  const goToPage = useCallback(
    (page: number) => {
      if (page >= 1 && page <= totalPages) {
        dispatch(setPage(page))
      }
    },
    [dispatch, totalPages]
  )

  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      dispatch(setPage(currentPage + 1))
    }
  }, [dispatch, currentPage, totalPages])

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      dispatch(setPage(currentPage - 1))
    }
  }, [dispatch, currentPage])

  return {
    currentPage,
    pageSize,
    totalResults,
    totalPages,
    goToPage,
    nextPage,
    prevPage,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  }
}