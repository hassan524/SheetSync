export type Sheet = {
  id: string
  title: string
  updatedAt: string
  orgId?: string
}

export type Organization = {
  id: string
  name: string
  updatedAt: string
}

export type SheetsData = {
  sheets: Sheet[]
  organizations: Organization[]
}
