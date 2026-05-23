export type RowStatus = 'active' | 'archived' | 'completed'

export type ValidationRule =
  | { type: 'required' }
  | { type: 'type'; value: 'text' | 'number' | 'date' | 'email' | 'currency' | 'checkbox' }
  | { type: 'min'; value: number }
  | { type: 'max'; value: number }
  | { type: 'unique' }
  | { type: 'dropdown'; options: string[] }

export interface RowFeatureMeta {
  pinned?: boolean
  status?: RowStatus
  validations?: Record<string, ValidationRule[]>
  conditionalFormatting?: { overdue?: boolean }
}
