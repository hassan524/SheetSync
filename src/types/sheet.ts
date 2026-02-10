export interface Sheet {
  id: string
  name: string
  updated_at: string
  organization_id?: string | null
  description?: string | null
  template_name?: string | null
}