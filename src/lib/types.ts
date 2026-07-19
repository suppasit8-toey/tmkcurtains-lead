// ===== ENUMS & TYPES =====

export type OrgCategory = string; // Now dynamic

export type OrgStatus =
  | 'new_lead'
  | 'contacted'
  | 'presented'
  | 'quoted'
  | 'negotiating'
  | 'won'
  | 'lost'
  | 'on_hold';

export type QuotationStatus = 'pending' | 'approved' | 'rejected';

// ===== LABELS =====
// Category labels are now dynamic, fetched from DB, but we keep this for backwards compatibility if needed
export const STATUS_LABELS: Record<OrgStatus, string> = {
  new_lead: 'LEAD ใหม่',
  contacted: 'ติดต่อแล้ว',
  presented: 'นำเสนอแล้ว',
  quoted: 'เสนอราคาแล้ว',
  negotiating: 'กำลังเจรจา',
  won: 'ปิดการขายสำเร็จ',
  lost: 'ไม่สำเร็จ',
  on_hold: 'รอดำเนินการ',
};

export const QUOTATION_STATUS_LABELS: Record<QuotationStatus, string> = {
  pending: 'รอพิจารณา',
  approved: 'อนุมัติแล้ว',
  rejected: 'ปฏิเสธ',
};

export const STATUS_COLORS: Record<OrgStatus, string> = {
  new_lead: '#6366f1',
  contacted: '#3b82f6',
  presented: '#8b5cf6',
  quoted: '#f59e0b',
  negotiating: '#f97316',
  won: '#10b981',
  lost: '#ef4444',
  on_hold: '#6b7280',
};

// ===== DATABASE SCHEMA INTERFACES =====

export interface Profile {
  id: string;
  full_name: string;
  role?: string;
  updated_at: string;
}

export interface OrgCategoryData {
  id: string;
  value: string;
  label: string;
  icon: string;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  org_id: string | null;
  title: string;
  location?: string | null;
  due_date: string;
  is_completed: boolean;
  created_at: string;
  organizations?: { name: string } | null;
  profiles?: { full_name: string } | null;
}

export interface Department {
  name: string;
  phone: string;
  email: string;
  line_id?: string;
  note?: string;
}

export interface Organization {
  id: string;
  user_id: string;
  category: string;
  status: OrgStatus;
  name: string;
  building_age?: number | null;
  org_info?: string;
  phone_main?: string;
  email_main?: string;
  building_dept?: Department | null;
  purchase_dept?: Department | null;
  accounting_dept?: Department | null;
  pitch_technique?: string;
  map_url?: string;
  province?: string;
  distance_km?: number | null;
  created_at: string;
  updated_at: string;
}

export const PROVINCES = [
  'กรุงเทพมหานคร', 'กระบี่', 'กาญจนบุรี', 'กาฬสินธุ์', 'กำแพงเพชร', 'ขอนแก่น', 'จันทบุรี', 'ฉะเชิงเทรา', 'ชลบุรี', 'ชัยนาท', 
  'ชัยภูมิ', 'ชุมพร', 'เชียงราย', 'เชียงใหม่', 'ตรัง', 'ตราด', 'ตาก', 'นครนายก', 'นครปฐม', 'นครพนม', 'นครราชสีมา', 
  'นครศรีธรรมราช', 'นครสวรรค์', 'นนทบุรี', 'นราธิวาส', 'น่าน', 'บึงกาฬ', 'บุรีรัมย์', 'ปทุมธานี', 'ประจวบคีรีขันธ์', 
  'ปราจีนบุรี', 'ปัตตานี', 'พระนครศรีอยุธยา', 'พะเยา', 'พังงา', 'พัทลุง', 'พิจิตร', 'พิษณุโลก', 'เพชรบุรี', 'เพชรบูรณ์', 
  'แพร่', 'ภูเก็ต', 'มหาสารคาม', 'มุกดาหาร', 'แม่ฮ่องสอน', 'ยโสธร', 'ยะลา', 'ร้อยเอ็ด', 'ระนอง', 'ระยอง', 'ราชบุรี', 
  'ลพบุรี', 'ลำปาง', 'ลำพูน', 'เลย', 'ศรีสะเกษ', 'สกลนคร', 'สงขลา', 'สตูล', 'สมุทรปราการ', 'สมุทรสงคราม', 'สมุทรสาคร', 
  'สระแก้ว', 'สระบุรี', 'สิงห์บุรี', 'สุโขทัย', 'สุพรรณบุรี', 'สุราษฎร์ธานี', 'สุรินทร์', 'หนองคาย', 'หนองบัวลำภู', 'อ่างทอง', 
  'อำนาจเจริญ', 'อุดรธานี', 'อุตรดิตถ์', 'อุทัยธานี', 'อุบลราชธานี'
];

export interface ConversationHistory {
  id: string;
  org_id: string;
  user_id: string;
  date: string;
  channel: string;
  summary: string;
  next_action?: string;
  created_at: string;
  organizations?: Organization;
}

export interface Quotation {
  id: string;
  org_id: string;
  user_id: string;
  quote_number: string;
  date_sent: string;
  total_amount?: number;
  status: QuotationStatus;
  note?: string;
  items?: any[];
  created_at: string;
  organizations?: Organization;
}

export interface CompletedOrder {
  id: string;
  org_id: string;
  user_id: string;
  order_number: string;
  completed_date: string;
  total_amount?: number;
  note?: string;
  items?: any[];
  created_at: string;
  organizations?: Organization;
}
