/**
 * 摸索认知边界模块
 */
export { CognitiveBoundaryPage } from './components/CognitiveBoundaryPage'
export { CognitiveBoundaryAssessment } from './components/CognitiveBoundaryAssessment'
export { QuestionSlider } from './components/QuestionSlider'
export { DimensionAssessment } from './components/DimensionAssessment'
export { cognitiveBoundaryApi } from './services/cognitiveBoundaryApi'
export {
  fetchAssessment,
  submitAssessments,
  updateQuestionLevel,
  clearError,
  resetState,
} from './store/cognitiveBoundarySlice'
export type {
  QuestionAssessment,
  DimensionAssessment as DimensionAssessmentType,
  CognitiveBoundaryAssessment as CognitiveBoundaryAssessmentType,
  CognitiveBoundaryState,
  ProgressInfo,
} from './types'