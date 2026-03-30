export interface BlacklistItem {
  id: number
  name: string
  platform?: string
  platform_id?: string
  email: string
  phone?: string
  address?: string
  zip_code?: string
  risk: '高' | '中' | '低'
  dispute_type?: string
  description?: string
  order_amount?: number
  refund_amount?: number
  partial_refund_amount?: number
  has_cargo_loss: boolean
  cargo_loss_amount?: number
  loss_bearer?: string
  evidence_images?: string[]
  report_count: number
  related_emails?: string[]
  related_phones?: string[]
  related_addresses?: string[]
  buyer_group_id?: string
  status: 'pending' | 'approved' | 'rejected'
  reporter_email?: string
  reject_reason?: string
  reviewed_at?: string
  created_at: string
}

export interface ReportFormData {
  name: string
  email: string
  phone: string
  address: string
  platform?: string
  platform_id?: string
  risk: '高' | '中' | '低'
  dispute_type: string
  description: string
  zip_code?: string
  order_amount?: number
  refund_amount?: number
  partial_refund_amount?: number
  has_cargo_loss: boolean
  cargo_loss_amount?: number
  loss_bearer?: string
  evidence_images?: string[]
  reporter_email?: string
}

export interface Stats {
  total: number
  highRisk: number
  pending: number
  todayNew: number
}
