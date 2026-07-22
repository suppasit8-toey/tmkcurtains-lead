'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  STATUS_LABELS, STATUS_COLORS,
  CONTACT_DEPT_LABELS, CONTACT_DEPT_COLORS,
  type Organization, type ConversationHistory, type Quotation,
  type CompletedOrder, type OrgStatus, type Department, type OrgCategoryData, type ContactDept,
} from '@/lib/types';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import MultiInput from '@/components/MultiInput';
import {
  ArrowLeft, Edit2, Trash2, Save, X, Plus, Phone, Mail, Clock,
  MessageSquare, FileText, CheckCircle2, Building2, Users, Lightbulb,
  Calendar, ChevronDown, ChevronUp, MapPin, Navigation, Map as MapIcon, ExternalLink, Gift
} from 'lucide-react';
import { formatDate, formatCurrency, extractMapCoordinates, calculateDistance, fetchProvinceFromCoords, TMK_LAT, TMK_LNG } from '@/lib/utils';
import { PROVINCES } from '@/lib/types';
import { SCRIPTS_DATA, PROMOTIONS_DATA } from '@/app/dashboard/scripts/page';

const ALL_STATUSES: OrgStatus[] = ['new_lead','contacted','presented','quoted','negotiating','won','lost','on_hold'];
const STATUS_LABEL_MAP = STATUS_LABELS;

type TabId = 'info' | 'conversations' | 'quotations' | 'orders';

// ===== Script Templates per Department =====
const SCRIPT_TEMPLATES: Record<ContactDept, { label: string; script: string }[]> = {
  phone_main: [
    {
      label: '🏢 แนะนำตัว + สอบถามฝ่ายที่ดูแล',
      script: `สวัสดีค่ะ ติดต่อจาก TMK Curtains นะคะ\nพอดีอยากนำเสนอแคมเปญผ้าม่าน วอลล์เปเปอร์ และฟิล์มอาคารค่ะ\nปกติแล้วต้องติดต่อฝ่ายไหนหรือท่านไหนคะ?`,
    },
    {
      label: '📞 ขอต่อสาย / ขอเบอร์ติดต่อ',
      script: `ขอบคุณมากค่ะ รบกวนขอต่อสายได้ไหมคะ?\n\n(ถ้าต่อสายไม่ได้)\nไม่เป็นไรค่ะ สะดวกให้ติดต่ออีกครั้งเป็นช่วงเวลาไหนคะ?\nหรือรบกวนขอเบอร์ตรงหรือ LINE ได้ไหมคะ?`,
    },
    {
      label: '🔁 โทรติดตาม (Follow up)',
      script: `สวัสดีค่ะ ปอจาก TMK Curtains นะคะ\nเมื่อวันที่ [วันที่] ปอได้โทรมาเรื่องแคมเปญผ้าม่าน วอลล์เปเปอร์ และฟิล์มอาคารค่ะ\nรบกวนต่อสายไปยังฝ่าย [ชื่อฝ่าย] ได้ไหมคะ?`,
    },
  ],
  purchase_dept: [
    {
      label: '🤝 แนะนำตัว + แคมเปญทดลองฟรี',
      script: `สวัสดีค่ะ ปอจาก TMK Curtains นะคะ\nขออนุญาตรบกวนเวลาสัก 2 นาทีค่ะ\n\nทางเราดูแลด้านกาออกแบบและติดตั้งผ้าม่าน วอลล์เปเปอร์ และฟิล์มอาคารค่ะ\nตอนนี้เรามีแคมเปญพิเศษสำหรับองค์กรโดยเฉพาะค่ะ\nคือ ทดลองติดตั้งให้ฟรี ซึ่งสามารถเลือกได้ค่ะว่าจะทดลองเป็นผ้าม่าน วอลล์เปเปอร์ หรือฟิล์มอาคาร\nเพื่อดูคุณภาพงานจริงก่อนตัดสินใจค่ะ\n\nสะดวกให้ปอส่งข้อมูลเพิ่มเติมให้ทาง LINE หรือ Email ดีคะ?`,
    },
    {
      label: '💰 สอบถามงบประมาณ + ไทม์ไลน์',
      script: `ไม่ทราบว่าตอนนี้ทางองค์กรมีงบประมาณสำหรับงานผ้าม่าน/วอลล์เปเปอร์/ฟิล์มอาคาร อยู่ในช่วงไหนคะ?\nและมีไทม์ไลน์ที่ต้องการติดตั้งให้เสร็จภายในเมื่ไหร่คะ?\n\nปอจะได้จัดเตรียมใบเสนอราคาให้ตรงกับความต้องการค่ะ`,
    },
    {
      label: '📄 ส่งใบเสนอราคา + ติดตาม',
      script: `สวัสดีค่ะ ปอจาก TMK Curtains นะคะ\nปอได้ส่งใบเสนอราคาไปทาง [Email/LINE] เรียบร้อยแล้วนะคะ\n\nไม่ทราบว่าได้รับและมีโอกาสพิจารณาแล้วหรือยังคะ?\nถ้ามีข้อสงสัยหรืออยากปรับรายละเอียด ยินดีปรับให้ค่ะ`,
    },
    {
      label: '🔄 สอบถามขั้นตอนจัดซื้อ',
      script: `ขอสอบถามขั้นตอนการจัดซื้อของทางองค์กรนะคะ\n- ต้องยื่นเอกสารอะไรบ้างคะ?\n- มีการเปรียบเทียบราคากี่เจ้าคะ?\n- ใช้เวลาอนุมัติประมาณกี่วันคะ?\n\nเพื่อปอจะได้เตรียมเอกสารให้ครบถ้วนค่ะ`,
    },
  ],
  building_dept: [
    {
      label: '🏗️ แนะนำตัว + แคมเปญทดลองฟรี',
      script: `สวัสดีค่ะ ปอจาก TMK Curtains นะคะ\nขออนุญาตรบกวนเวลาสัก 2 นาทีค่ะ\n\nทางเราดูแลด้านกาออกแบบและติดตั้งผ้าม่าน วอลล์เปเปอร์ และฟิล์มอาคารค่ะ\nตอนนี้มีแคมเปญพิเศษ ทดลองติดตั้งให้ฟรี เลือกได้เลยค่ะว่าจะทดลองเป็นผ้าม่าน วอลล์เปเปอร์ หรือฟิล์ม\nเพื่อดูคุณภาพงานจริงก่อนตัดสินใจค่ะ\n\nไม่ทราบว่าตอนนี้ในอาคารมีห้องไหนที่ต้องเปลี่ยนหรือติดตั้งเพิ่มเติมบ้างคะ?`,
    },
    {
      label: '📏 ขอนัดสำรวจหน้างาน',
      script: `ปออยากขอนัดเข้าสำรวจหน้างานเพื่อวัดขนาดและดูสภาพจริงค่ะ\nจะได้ออกแบบและเสนอราคาได้ตรงกับควาต้องการ\n\nไม่ทราบว่าสะดวกวันไหนคะ? ใช้เวลาประมาณ 30-60 นาทีค่ะ`,
    },
    {
      label: '🔧 สอบถามปัญหาที่พบ',
      script: `อยากสอบถามว่าตอนนี้มีปัญหาเรื่องผ้าม่านหรือมู่ลี่ในอาคารบ้างไหมคะ? เช่น:\n- ผ้าม่านเก่า ขาด หรือสีซีด\n- มู่ลี่ชำรุด ดึงไม่ขึ้น\n- แสงเข้ามากเกินไป\n- วอลล์เปเปอร์ลอก หรือเก่า\n\nเรามีทีมช่างพร้อมเข้าดูแล และตอนนี้มีแคมเปญทดลองติดตั้งฟรีด้วยค่ะ`,
    },
    {
      label: '📐 ขอข้อมูลเพื่เสนอราคา',
      script: `สำหรับการเสนอราคา ปออยากขอข้อมูลเพิ่มเติมนะคะ:\n- จำนวนห้อง/หน้าต่างที่ต้องการ\n- ขนาดหน้าต่างโดยประมาณ (กว้าง x สูง)\n- ประเภทที่สนใจ (ผ้าม่าน/วอลล์เปเปอร์/ฟิล์มอาคาร)\n- มีงบประมาณคร่าวๆ ไหมคะ?\n\nปอจะได้จัดเตรียมใบเสนอราคาให้ตรงกับความต้องการค่ะ`,
    },
  ],
};


export default function OrgDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [org, setOrg] = useState<Organization | null>(null);
  const [categories, setCategories] = useState<OrgCategoryData[]>([]);
  const [conversations, setConversations] = useState<ConversationHistory[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [orders, setOrders] = useState<CompletedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('info');
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<Partial<Organization>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Conversation form
  const [showConvForm, setShowConvForm] = useState(false);
  const [convForm, setConvForm] = useState({ date: new Date().toISOString().split('T')[0], time: '09:27', channel: 'โทรศัพท์', contact_dept: '' as string, summary: '', next_action: '' });
  const [showScripts, setShowScripts] = useState(false);
  const [activeScript, setActiveScript] = useState<{ dept: ContactDept; idx: number; text: string } | null>(null);
  const [customScripts, setCustomScripts] = useState(SCRIPT_TEMPLATES);
  const [localScripts, setLocalScripts] = useState(SCRIPTS_DATA);
  const [localPromos, setLocalPromos] = useState(PROMOTIONS_DATA);

  useEffect(() => {
    const saved = localStorage.getItem('tmk_script_templates');
    if (saved) {
      try { setCustomScripts(JSON.parse(saved)); } catch (e) {}
    }
    const savedScripts = localStorage.getItem('tmk_scripts_data');
    if (savedScripts) {
      try { setLocalScripts(JSON.parse(savedScripts)); } catch(e) {}
    }
    const savedPromos = localStorage.getItem('tmk_promotions_data');
    if (savedPromos) {
      try { setLocalPromos(JSON.parse(savedPromos)); } catch(e) {}
    }
  }, []);
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editConvData, setEditConvData] = useState({summary: '', next_action: '', channel: '', contact_dept: '', date: '', time: ''});
  const [savingEditConv, setSavingEditConv] = useState(false);
  const [savingConv, setSavingConv] = useState(false);

  // Quotation form
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [quoteForm, setQuoteForm] = useState({ quote_number: '', date_sent: new Date().toISOString().split('T')[0], total_amount: '', status: 'pending' as 'pending'|'approved'|'rejected', note: '' });
  const [savingQuote, setSavingQuote] = useState(false);

  // Order form
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderForm, setOrderForm] = useState({ order_number: '', completed_date: new Date().toISOString().split('T')[0], total_amount: '', note: '' });
  const [savingOrder, setSavingOrder] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [orgRes, convRes, quoteRes, orderRes, catRes] = await Promise.all([
      supabase.from('organizations').select('*').eq('id', id).single(),
      supabase.from('conversation_history').select('*').eq('org_id', id).order('date', { ascending: false }),
      supabase.from('quotations').select('*').eq('org_id', id).order('date_sent', { ascending: false }),
      supabase.from('completed_orders').select('*').eq('org_id', id).order('completed_date', { ascending: false }),
      supabase.from('org_categories').select('*').order('created_at', { ascending: true })
    ]);
    if (orgRes.data) { setOrg(orgRes.data); setEditData(orgRes.data); }
    setConversations(convRes.data || []);
    setQuotations(quoteRes.data || []);
    setOrders(orderRes.data || []);
    setCategories(catRes.data || []);
    setLoading(false);
  }, [id, supabase]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSave = async () => {
    setSaving(true);
    await supabase.from('organizations').update(editData).eq('id', id);
    setOrg({ ...org!, ...editData });
    setEditMode(false);
    setSaving(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    await supabase.from('organizations').delete().eq('id', id);
    router.push('/dashboard/organizations');
  };

  const handleSaveConv = async () => {
    try {
      setSavingConv(true);
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('conversation_history').insert({
        ...convForm,
        contact_dept: convForm.contact_dept || null,
        time: convForm.time || null,
        org_id: id,
        user_id: user!.id,
      });

      if (error) {
        console.error("Error saving conversation:", error);
        alert(`เกิดข้อผิดพลาดในการบันทึก: ${JSON.stringify(error)}`);
        setSavingConv(false);
        return;
      }

      setConvForm({ date: new Date().toISOString().split('T')[0], time: '09:27', channel: 'โทรศัพท์', contact_dept: '', summary: '', next_action: '' });
      setShowConvForm(false);
      setShowScripts(false);
      fetchAll();
      setSavingConv(false);
    } catch (err: any) {
      console.error("Unexpected error:", err);
      alert(`เกิดข้อผิดพลาด: ${err.message || 'Unknown error'}`);
      setSavingConv(false);
    }
  };

  const handleUpdateConv = async (convId: string) => {
    try {
      setSavingEditConv(true);
      const { error } = await supabase.from('conversation_history').update({
        summary: editConvData.summary,
        next_action: editConvData.next_action || null,
        channel: editConvData.channel,
        contact_dept: editConvData.contact_dept || null,
        date: editConvData.date,
        time: editConvData.time || null,
      }).eq('id', convId);

      if (error) {
        console.error("Error updating conversation:", error);
        alert(`เกิดข้อผิดพลาดในการแก้ไข: ${error.message}`);
        setSavingEditConv(false);
        return;
      }

      setEditingConvId(null);
      fetchAll();
      setSavingEditConv(false);
    } catch (err: any) {
      console.error("Unexpected error:", err);
      alert(`เกิดข้อผิดพลาด: ${err.message || 'Unknown error'}`);
      setSavingEditConv(false);
    }
  };

  const handleDeleteConv = async (convId: string) => {
    if (!confirm('ต้องการลบประวัติการพูดคุยนี้หรือไม่?')) return;
    await supabase.from('conversation_history').delete().eq('id', convId);
    fetchAll();
  };

  const handleSaveQuote = async () => {
    setSavingQuote(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('quotations').insert({
      ...quoteForm, org_id: id, user_id: user!.id,
      total_amount: parseFloat(quoteForm.total_amount) || 0, items: [],
    });
    setShowQuoteForm(false);
    fetchAll();
    setSavingQuote(false);
  };

  const handleSaveOrder = async () => {
    setSavingOrder(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('completed_orders').insert({
      ...orderForm, org_id: id, user_id: user!.id,
      total_amount: parseFloat(orderForm.total_amount) || 0, items: [],
    });
    setShowOrderForm(false);
    fetchAll();
    setSavingOrder(false);
  };

  if (loading) return <LoadingSkeleton />;
  if (!org) return <div className="text-center py-20 text-gray-500">ไม่พบข้อมูล</div>;

  const statusColor = STATUS_COLORS[org.status];
  const orgCategoryData = categories.find(c => c.value === org.category) || { label: org.category, icon: '🏢' };

  const handleMapUrlChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setEditData(d => ({ ...d, map_url: url }));
    
    const coords = extractMapCoordinates(url);
    if (coords) {
      const dist = calculateDistance(TMK_LAT, TMK_LNG, coords.lat, coords.lng);
      setEditData(d => ({ ...d, distance_km: dist }));
      
      const prov = await fetchProvinceFromCoords(coords.lat, coords.lng);
      if (prov && PROVINCES.includes(prov)) {
        setEditData(d => ({ ...d, province: prov }));
      }
    }
  };

  return (
    <div className="animate-fade-in max-w-6xl mx-auto pb-24 md:pb-8">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <Link href="/dashboard/organizations" className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-50 shadow-sm shrink-0">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-2xl bg-white w-10 h-10 rounded-lg flex items-center justify-center shadow-sm border border-gray-100">{orgCategoryData.icon}</span>
            <h1 className="text-2xl font-bold text-gray-900 truncate">{org.name}</h1>
          </div>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="badge text-xs border" style={{ background: `${statusColor}15`, color: statusColor, borderColor: `${statusColor}30` }}>
              {STATUS_LABEL_MAP[org.status]}
            </span>
            <span className="text-sm text-gray-500 font-medium">{orgCategoryData.label}</span>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          {editMode ? (
            <>
              <button onClick={() => setEditMode(false)} className="btn-secondary px-3"><X size={18} /></button>
              <button onClick={handleSave} className="btn-primary px-3" disabled={saving}>
                {saving ? <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="12" /></svg> : <Save size={18} />}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setEditMode(true)} className="btn-secondary px-3"><Edit2 size={16} /></button>
              <button onClick={() => setShowDeleteConfirm(true)} className="btn-danger px-3"><Trash2 size={16} /></button>
            </>
          )}
        </div>
      </div>

      {/* Delete Confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full relative z-10 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-2">ยืนยันการลบ</h3>
            <p className="text-sm text-gray-600 mb-6">ต้องการลบองค์กร &ldquo;{org.name}&rdquo; และข้อมูลทั้งหมดที่เกี่ยวข้องหรือไม่? (ไม่สามารถกู้คืนได้)</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary flex-1 justify-center">ยกเลิก</button>
              <button onClick={handleDelete} className="btn-danger flex-1 justify-center" disabled={deleting}>
                {deleting ? 'กำลังลบ...' : 'ลบองค์กร'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl bg-white border border-gray-200 shadow-sm overflow-x-auto hide-scrollbar">
        {([
          { id: 'info', label: 'ข้อมูลองค์กร', icon: Building2, count: null },
          { id: 'conversations', label: `ประวัติพูดคุย`, icon: MessageSquare, count: conversations.length },
          { id: 'quotations', label: `ใบเสนอราคา`, icon: FileText, count: quotations.length },
          { id: 'orders', label: `งานเสร็จสิ้น`, icon: CheckCircle2, count: orders.length },
        ] as { id: TabId; label: string; icon: React.ElementType, count: number|null }[]).map(({ id: tid, label, icon: Icon, count }) => (
          <button
            key={tid}
            onClick={() => setActiveTab(tid)}
            className={`flex-1 min-w-[90px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tid 
                ? 'bg-blue-50 text-blue-700' 
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Icon size={16} className={activeTab === tid ? 'text-blue-600' : 'text-gray-400'} />
            <span>{label}</span>
            {count !== null && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === tid ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'}`}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab: Info */}
      {activeTab === 'info' && (
        <div className="flex flex-col gap-5 animate-fade-in">
          {/* Basic */}
          <InfoCard icon={<Building2 size={18} />} title="ข้อมูลพื้นฐาน">
            {editMode ? (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">หมวดหมู่</label>
                    <select className="input-field text-sm" value={editData.category} onChange={(e) => setEditData(d => ({ ...d, category: e.target.value }))}>
                      {categories.map(c => <option key={c.id} value={c.value}>{c.icon} {c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">สถานะ</label>
                    <select className="input-field text-sm" value={editData.status} onChange={(e) => setEditData(d => ({ ...d, status: e.target.value as OrgStatus }))}>
                      {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL_MAP[s]}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label">ชื่อองค์กร</label>
                  <input className="input-field font-medium text-base py-2.5" value={editData.name || ''} onChange={(e) => setEditData(d => ({ ...d, name: e.target.value }))} />
                </div>
                <div>
                  <label className="label">อายุอาคาร (ปี)</label>
                  <input type="number" className="input-field" value={editData.building_age || ''} onChange={(e) => setEditData(d => ({ ...d, building_age: parseInt(e.target.value) || null }))} />
                </div>
                <div>
                  <label className="label">ข้อมูลเพิ่มเติม</label>
                  <textarea className="input-field" rows={3} value={editData.org_info || ''} onChange={(e) => setEditData(d => ({ ...d, org_info: e.target.value }))} />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 text-sm">
                <Row label="อายุอาคาร" value={org.building_age ? `${org.building_age} ปี` : '-'} />
                {org.org_info && <div><span className="label mb-1">ข้อมูลเพิ่มเติม</span><p className="text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-100">{org.org_info}</p></div>}
              </div>
            )}
          </InfoCard>

          {/* Location & Map */}
          <InfoCard icon={<MapPin size={18} />} title="สถานที่ตั้ง & แผนที่">
            {editMode ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="label">ลิงก์ Google Maps / Iframe</label>
                  <input 
                    type="text" 
                    className="input-field text-sm" 
                    placeholder="วางลิงก์เพื่อคำนวณระยะทางอัตโนมัติ..." 
                    value={editData.map_url || ''} 
                    onChange={handleMapUrlChange} 
                  />
                </div>
                <div>
                  <label className="label">จังหวัด <span className="text-[10px] font-normal text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded ml-1">(อัตโนมัติ)</span></label>
                  <select className="input-field text-sm" value={editData.province || ''} onChange={(e) => setEditData(d => ({ ...d, province: e.target.value }))}>
                    <option value="">- เลือกจังหวัด -</option>
                    {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">ระยะทางจาก TMK Curtains (กม.) <span className="text-[10px] font-normal text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded ml-1">(อัตโนมัติ)</span></label>
                  <input 
                    type="number" 
                    className="input-field text-sm" 
                    placeholder="0.0" 
                    step="0.1"
                    value={editData.distance_km || ''} 
                    onChange={(e) => setEditData(d => ({ ...d, distance_km: parseFloat(e.target.value) || null }))} 
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 text-sm">
                <Row label="จังหวัด" value={org.province || '-'} />
                <Row 
                  label="ระยะทาง" 
                  value={
                    org.distance_km ? (
                      <span className="flex items-center gap-1.5 text-blue-600 font-medium">
                        <Navigation size={14} />
                        {org.distance_km} กม. จากร้าน
                      </span>
                    ) : '-'
                  } 
                />
                {org.map_url && (
                  <div>
                    <span className="label mb-1">แผนที่</span>
                    <a 
                      href={org.map_url.startsWith('<iframe') ? '#' : org.map_url} 
                      target={org.map_url.startsWith('<iframe') ? '_self' : '_blank'}
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-2 rounded-lg border border-blue-100 transition-colors"
                      onClick={(e) => {
                        if (org.map_url?.startsWith('<iframe')) {
                          e.preventDefault();
                          alert('ลิงก์นี้เป็น Iframe ไม่สามารถเปิดแท็บใหม่ได้โดยตรง');
                        }
                      }}
                    >
                      <MapIcon size={16} />
                      ดูแผนที่ Google Maps
                      <ExternalLink size={14} className="ml-1" />
                    </a>
                  </div>
                )}
              </div>
            )}
          </InfoCard>

          {/* Contact */}
          <InfoCard icon={<Phone size={18} />} title="ช่องทางติดต่อกลาง">
            {editMode ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><MultiInput label="เบอร์กลาง" type="tel" placeholder="02-xxx-xxxx" value={editData.phone_main} onChange={(val) => setEditData(d => ({ ...d, phone_main: val }))} /></div>
                <div><MultiInput label="อีเมลกลาง" type="email" placeholder="email@example.com" value={editData.email_main} onChange={(val) => setEditData(d => ({ ...d, email_main: val }))} /></div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 text-sm">
                {org.phone_main && org.phone_main.split(',').map((p, i) => <div key={i} className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-lg border border-gray-100"><div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><Phone size={14} /></div><span className="font-medium text-gray-900">{p.trim()}</span></div>)}
                {org.email_main && org.email_main.split(',').map((e, i) => <div key={i} className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-lg border border-gray-100"><div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><Mail size={14} /></div><span className="font-medium text-gray-900">{e.trim()}</span></div>)}
                {!org.phone_main && !org.email_main && <span className="text-gray-400 italic">ยังไม่มีข้อมูล</span>}
              </div>
            )}
          </InfoCard>

          {/* Departments */}
          <InfoCard icon={<Users size={18} />} title="ฝ่ายต่างๆ">
            {editMode ? (
              <div className="flex flex-col gap-6">
                {(['building_dept', 'purchase_dept', 'accounting_dept'] as const).map((deptKey) => {
                  const titles = { building_dept: 'ฝ่ายอาคาร', purchase_dept: 'ฝ่ายจัดซื้อ', accounting_dept: 'ฝ่ายบัญชี' };
                  const dept: Department = (editData[deptKey] as Department) || { name: '', phone: '', email: '', line_id: '', note: '' };
                  return (
                    <div key={deptKey} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <p className="text-sm font-bold mb-3 text-gray-900">{titles[deptKey]}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div><label className="label">ชื่อ</label><input className="input-field text-sm bg-white" value={dept.name || ''} onChange={(e) => setEditData(d => ({ ...d, [deptKey]: { ...dept, name: e.target.value } }))} /></div>
                        <div><MultiInput label="เบอร์" type="tel" placeholder="08x-xxx-xxxx" value={dept.phone} onChange={(val) => setEditData(d => ({ ...d, [deptKey]: { ...dept, phone: val } }))} /></div>
                        <div><MultiInput label="อีเมล" type="email" placeholder="email@example.com" value={dept.email} onChange={(val) => setEditData(d => ({ ...d, [deptKey]: { ...dept, email: val } }))} /></div>
                        <div><label className="label">LINE</label><input className="input-field text-sm bg-white" value={dept.line_id || ''} onChange={(e) => setEditData(d => ({ ...d, [deptKey]: { ...dept, line_id: e.target.value } }))} /></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {([['ฝ่ายอาคาร', org.building_dept], ['ฝ่ายจัดซื้อ', org.purchase_dept], ['ฝ่ายบัญชี', org.accounting_dept]] as [string, Department | null | undefined][]).map(([label, dept]) => (
                  dept?.name ? (
                    <div key={label} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <p className="text-sm font-bold mb-3 text-gray-900">{label}</p>
                      <div className="text-sm flex flex-col gap-2 text-gray-700">
                        <span className="font-medium text-gray-900">{dept.name}</span>
                        {dept.phone && dept.phone.split(',').map((p, i) => <div key={i} className="flex items-center gap-2"><Phone size={14} className="text-gray-400" />{p.trim()}</div>)}
                        {dept.email && dept.email.split(',').map((e, i) => <div key={i} className="flex items-center gap-2"><Mail size={14} className="text-gray-400" />{e.trim()}</div>)}
                        {dept.line_id && <div className="flex items-center gap-2"><span className="text-xs font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded">LINE</span>{dept.line_id}</div>}
                      </div>
                    </div>
                  ) : null
                ))}
              </div>
            )}
          </InfoCard>

          {/* Pitch */}
          <InfoCard icon={<Lightbulb size={18} />} title="เทคนิคการนำเสนอ">
            {editMode ? (
              <textarea className="input-field bg-blue-50/50" rows={4} value={editData.pitch_technique || ''} onChange={(e) => setEditData(d => ({ ...d, pitch_technique: e.target.value }))} />
            ) : (
              <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: org.pitch_technique ? '#374151' : '#9CA3AF' }}>
                {org.pitch_technique || 'ยังไม่มีข้อมูล'}
              </p>
            )}
          </InfoCard>
        </div>
      )}

      {/* Tab: Conversations */}
      {activeTab === 'conversations' && (
        <div className="animate-fade-in">
          <button onClick={() => setShowConvForm(!showConvForm)} className="btn-primary mb-6 shadow-sm">
            <Plus size={16} />
            บันทึกการพูดคุย
          </button>

          {showConvForm && (
            <div className="glass-card p-6 mb-8 border-t-4 border-blue-500">
              <h3 className="text-base font-bold text-gray-900 mb-4">บันทึกการพูดคุยใหม่</h3>
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div><label className="label">วันที่</label><input type="date" className="input-field text-sm" value={convForm.date} onChange={(e) => setConvForm(f => ({ ...f, date: e.target.value }))} /></div>
                  <div><label className="label">เวลา</label><input type="time" className="input-field text-sm" value={convForm.time} onChange={(e) => setConvForm(f => ({ ...f, time: e.target.value }))} /></div>
                  <div>
                    <label className="label">ช่องทาง</label>
                    <select className="input-field text-sm" value={convForm.channel} onChange={(e) => setConvForm(f => ({ ...f, channel: e.target.value }))}>
                      {['โทรศัพท์', 'LINE', 'Email', 'พบตัว', 'Zoom/Meet', 'อื่นๆ'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">คุยกับใคร</label>
                    <select 
                      className="input-field text-sm"
                      value={convForm.contact_dept} 
                      onChange={(e) => {
                        setConvForm(f => ({ ...f, contact_dept: e.target.value }));
                        setShowScripts(false);
                      }}
                    >
                      <option value="">- เลือกฝ่าย -</option>
                      <option value="phone_main">📞 เบอร์กลาง {org?.phone_main ? `(${org.phone_main.split(',')[0].trim()})` : ''}</option>
                      <option value="purchase_dept">🛒 ฝ่ายจัดซื้อ {org?.purchase_dept?.name ? `(${org.purchase_dept.name})` : ''}</option>
                      <option value="building_dept">🏗️ ฝ่ายอาคาร {org?.building_dept?.name ? `(${org.building_dept.name})` : ''}</option>
                    </select>
                  </div>
                </div>

                {/* Contact info preview */}
                {convForm.contact_dept && (() => {
                  const dept = convForm.contact_dept as ContactDept;
                  const colors = CONTACT_DEPT_COLORS[dept];
                  let contactInfo: { name?: string; phone?: string; email?: string } = {};
                  if (dept === 'phone_main') {
                    contactInfo = { phone: org?.phone_main || undefined, email: org?.email_main || undefined };
                  } else if (dept === 'purchase_dept' && org?.purchase_dept) {
                    contactInfo = { name: org.purchase_dept.name, phone: org.purchase_dept.phone, email: org.purchase_dept.email };
                  } else if (dept === 'building_dept' && org?.building_dept) {
                    contactInfo = { name: org.building_dept.name, phone: org.building_dept.phone, email: org.building_dept.email };
                  }
                  const hasInfo = contactInfo.name || contactInfo.phone || contactInfo.email;
                  return hasInfo ? (
                    <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 rounded-lg border text-sm mt-4" style={{ background: colors.bg, borderColor: colors.border }}>
                      <span className="font-semibold" style={{ color: colors.text }}>{CONTACT_DEPT_LABELS[dept]}:</span>
                      {contactInfo.name && <span className="text-gray-700">{contactInfo.name}</span>}
                      {contactInfo.phone && contactInfo.phone.split(',').map((p, i) => (
                        <span key={i} className="inline-flex items-center gap-1 bg-white/70 px-2 py-0.5 rounded text-xs font-medium text-gray-700 border border-gray-200">
                          <Phone size={11} className="text-gray-400" />{p.trim()}
                        </span>
                      ))}
                      {contactInfo.email && contactInfo.email.split(',').map((e, i) => (
                        <span key={i} className="inline-flex items-center gap-1 bg-white/70 px-2 py-0.5 rounded text-xs font-medium text-gray-700 border border-gray-200">
                          <Mail size={11} className="text-gray-400" />{e.trim()}
                        </span>
                      ))}
                    </div>
                  ) : null;
                })()}

                {/* Script templates */}
                <div className="mt-4">
                  <button 
                    type="button"
                    onClick={() => setShowScripts(!showScripts)}
                    className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors"
                  >
                    <Lightbulb size={15} />
                    {showScripts ? 'ซ่อนตัวอย่างข้อความ' : 'ดูสคริปต์ & โปรโมชั่น'}
                    {showScripts ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  {showScripts && (
                    <div className="mt-3 space-y-4 animate-fade-in">
                      {/* Dept Scripts */}
                      {convForm.contact_dept && customScripts[convForm.contact_dept as ContactDept] && customScripts[convForm.contact_dept as ContactDept].length > 0 && (
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide flex items-center gap-1"><Users size={12}/> ตามแผนกที่ติดต่อ</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {customScripts[convForm.contact_dept as ContactDept].map((tmpl, idx) => (
                              <button
                                key={idx}
                                type="button"
                                className="text-left p-3 rounded-lg border border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50 transition-all group shadow-sm"
                                onClick={() => setConvForm(f => ({ ...f, summary: f.summary ? f.summary + '\n\n' + tmpl.script : tmpl.script }))}
                              >
                                <span className="text-sm font-bold text-gray-800 group-hover:text-blue-700 transition-colors">{tmpl.label}</span>
                                <p className="text-xs text-gray-500 mt-2 whitespace-pre-wrap leading-relaxed">{tmpl.script.replace(/\\n/g, '\n')}</p>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Category Scripts & Promos */}
                      {org?.category && (
                        <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                          <p className="text-xs font-bold text-blue-600 mb-2 uppercase tracking-wide flex items-center gap-1"><Building2 size={12}/> แนะนำสำหรับ {categories.find(c => c.value === org.category)?.label || org.category}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {localScripts.filter(s => {
                              const cat = categories.find(c => c.value === org.category);
                              return s.category === org.category || (cat && s.category === cat.label);
                            }).map(tmpl => (
                              <button
                                key={tmpl.id}
                                type="button"
                                className="text-left p-3 rounded-lg border border-blue-200 bg-white hover:border-blue-400 hover:shadow-md transition-all group shadow-sm"
                                onClick={() => setConvForm(f => ({ ...f, summary: f.summary ? f.summary + '\n\n' + tmpl.content : tmpl.content }))}
                              >
                                <span className="text-sm font-bold text-gray-800 group-hover:text-blue-700 transition-colors flex items-center gap-1.5"><MessageSquare size={13} className="text-blue-500"/> {tmpl.title}</span>
                                <p className="text-xs text-gray-500 mt-2 whitespace-pre-wrap leading-relaxed">{tmpl.content.replace(/\\n/g, '\n')}</p>
                              </button>
                            ))}
                            
                            {localPromos.filter(p => {
                              const cat = categories.find(c => c.value === org.category);
                              return p.category === org.category || (cat && p.category === cat.label);
                            }).map(tmpl => (
                              <button
                                key={tmpl.id}
                                type="button"
                                className="text-left p-3 rounded-lg border border-rose-200 bg-white hover:border-rose-400 hover:shadow-md transition-all group shadow-sm"
                                onClick={() => setConvForm(f => ({ ...f, summary: f.summary ? f.summary + '\n\n' + tmpl.content : tmpl.content }))}
                              >
                                <span className="text-sm font-bold text-gray-800 group-hover:text-rose-600 transition-colors flex items-center gap-1.5"><Gift size={13} className="text-rose-500"/> {tmpl.title}</span>
                                <p className="text-xs text-gray-500 mt-2 whitespace-pre-wrap leading-relaxed">{tmpl.content.replace(/\\n/g, '\n')}</p>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div><label className="label">สรุปการพูดคุย <span className="text-red-500">*</span></label><textarea className="input-field" rows={3} placeholder="สรุปเนื้อหาที่พูดคุย..." value={convForm.summary} onChange={(e) => setConvForm(f => ({ ...f, summary: e.target.value }))} /></div>
                <div><label className="label">การดำเนินการต่อไป</label><input className="input-field text-sm" placeholder="สิ่งที่ต้องทำต่อ..." value={convForm.next_action} onChange={(e) => setConvForm(f => ({ ...f, next_action: e.target.value }))} /></div>
                <div className="flex gap-3 mt-2">
                  <button onClick={() => setShowConvForm(false)} className="btn-secondary flex-1 justify-center text-sm">ยกเลิก</button>
                  <button onClick={handleSaveConv} className="btn-primary flex-1 justify-center text-sm" disabled={savingConv || !convForm.summary}>
                    {savingConv ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {conversations.length === 0 ? (
            <EmptyState icon={<MessageSquare size={36} />} text="ยังไม่มีประวัติการพูดคุย" />
          ) : (
            <div className="relative mt-4">
              <div className="absolute left-6 top-4 bottom-4 w-px bg-gray-200" />
              <div className="flex flex-col gap-6">
                {conversations.map((conv) => (
                  <ConvCard 
                    key={conv.id} 
                    conv={conv}
                    onEdit={() => {
                      setEditingConvId(conv.id);
                      setEditConvData({
                        summary: conv.summary,
                        next_action: conv.next_action || '',
                        channel: conv.channel,
                        contact_dept: conv.contact_dept || '',
                        date: conv.date,
                        time: (conv as any).time || '',
                      });
                    }}
                    onDelete={() => handleDeleteConv(conv.id)}
                    isEditing={editingConvId === conv.id}
                    editData={editConvData}
                    onEditDataChange={setEditConvData}
                    onSaveEdit={() => handleUpdateConv(conv.id)}
                    onCancelEdit={() => setEditingConvId(null)}
                    savingEdit={savingEditConv}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Quotations */}
      {activeTab === 'quotations' && (
        <div className="animate-fade-in">
          <button onClick={() => setShowQuoteForm(!showQuoteForm)} className="btn-primary mb-6 shadow-sm">
            <Plus size={16} />
            เพิ่มใบเสนอราคา
          </button>

          {showQuoteForm && (
            <div className="glass-card p-6 mb-8 border-t-4 border-yellow-500">
              <h3 className="text-base font-bold text-gray-900 mb-4">ใบเสนอราคาใหม่</h3>
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="label">เลขที่ใบเสนอ <span className="text-red-500">*</span></label><input className="input-field text-sm" placeholder="QT-2024-001" value={quoteForm.quote_number} onChange={(e) => setQuoteForm(f => ({ ...f, quote_number: e.target.value }))} /></div>
                  <div><label className="label">วันที่ส่ง</label><input type="date" className="input-field text-sm" value={quoteForm.date_sent} onChange={(e) => setQuoteForm(f => ({ ...f, date_sent: e.target.value }))} /></div>
                  <div><label className="label">ยอดรวม (บาท)</label><input type="number" className="input-field text-sm" placeholder="0" value={quoteForm.total_amount} onChange={(e) => setQuoteForm(f => ({ ...f, total_amount: e.target.value }))} /></div>
                  <div>
                    <label className="label">สถานะ</label>
                    <select className="input-field text-sm font-medium" value={quoteForm.status} onChange={(e) => setQuoteForm(f => ({ ...f, status: e.target.value as 'pending'|'approved'|'rejected' }))}>
                      <option value="pending">⏳ รอพิจารณา</option>
                      <option value="approved">✅ อนุมัติแล้ว</option>
                      <option value="rejected">❌ ปฏิเสธ</option>
                    </select>
                  </div>
                </div>
                <div><label className="label">หมายเหตุ</label><input className="input-field text-sm" value={quoteForm.note} onChange={(e) => setQuoteForm(f => ({ ...f, note: e.target.value }))} /></div>
                <div className="flex gap-3 mt-2">
                  <button onClick={() => setShowQuoteForm(false)} className="btn-secondary flex-1 justify-center text-sm">ยกเลิก</button>
                  <button onClick={handleSaveQuote} className="btn-primary flex-1 justify-center text-sm" disabled={savingQuote || !quoteForm.quote_number}>
                    {savingQuote ? 'กำลังบันทึก...' : 'บันทึกใบเสนอราคา'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {quotations.length === 0 ? (
            <EmptyState icon={<FileText size={36} />} text="ยังไม่มีใบเสนอราคา" />
          ) : (
            <div className="flex flex-col gap-4">
              {quotations.map((q) => (
                <div key={q.id} className="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4" style={{
                  borderLeftColor: q.status === 'approved' ? '#10B981' : q.status === 'rejected' ? '#EF4444' : '#F59E0B'
                }}>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">{q.quote_number}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Calendar size={14} className="text-gray-400" />
                        {formatDate(q.date_sent)}
                      </p>
                      <span className="badge text-[11px] border" style={{
                        background: q.status === 'approved' ? '#ECFDF5' : q.status === 'rejected' ? '#FEF2F2' : '#FFFBEB',
                        color: q.status === 'approved' ? '#059669' : q.status === 'rejected' ? '#DC2626' : '#D97706',
                        borderColor: q.status === 'approved' ? '#A7F3D0' : q.status === 'rejected' ? '#FECACA' : '#FDE68A',
                      }}>
                        {q.status === 'approved' ? 'อนุมัติแล้ว' : q.status === 'rejected' ? 'ปฏิเสธ' : 'รอพิจารณา'}
                      </span>
                    </div>
                    {q.note && <p className="text-sm mt-3 text-gray-600 bg-gray-50 p-2 rounded-md border border-gray-100">{q.note}</p>}
                  </div>
                  <div className="sm:text-right shrink-0">
                    <p className="text-xs text-gray-500 mb-1">ยอดรวม</p>
                    <p className="text-lg font-bold text-blue-600">{formatCurrency(q.total_amount || 0)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Orders */}
      {activeTab === 'orders' && (
        <div className="animate-fade-in">
          <button onClick={() => setShowOrderForm(!showOrderForm)} className="btn-primary mb-6 shadow-sm">
            <Plus size={16} />
            เพิ่มรายการที่ทำเสร็จ
          </button>

          {showOrderForm && (
            <div className="glass-card p-6 mb-8 border-t-4 border-green-500">
              <h3 className="text-base font-bold text-gray-900 mb-4">บันทึกงานที่เสร็จสิ้น</h3>
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="label">เลขที่คำสั่งซื้อ <span className="text-red-500">*</span></label><input className="input-field text-sm" placeholder="ORD-2024-001" value={orderForm.order_number} onChange={(e) => setOrderForm(f => ({ ...f, order_number: e.target.value }))} /></div>
                  <div><label className="label">วันที่เสร็จสิ้น</label><input type="date" className="input-field text-sm" value={orderForm.completed_date} onChange={(e) => setOrderForm(f => ({ ...f, completed_date: e.target.value }))} /></div>
                  <div><label className="label">ยอดรวม (บาท)</label><input type="number" className="input-field text-sm" placeholder="0" value={orderForm.total_amount} onChange={(e) => setOrderForm(f => ({ ...f, total_amount: e.target.value }))} /></div>
                </div>
                <div><label className="label">หมายเหตุ</label><input className="input-field text-sm" value={orderForm.note} onChange={(e) => setOrderForm(f => ({ ...f, note: e.target.value }))} /></div>
                <div className="flex gap-3 mt-2">
                  <button onClick={() => setShowOrderForm(false)} className="btn-secondary flex-1 justify-center text-sm">ยกเลิก</button>
                  <button onClick={handleSaveOrder} className="btn-primary flex-1 justify-center text-sm" disabled={savingOrder || !orderForm.order_number}>
                    {savingOrder ? 'กำลังบันทึก...' : 'บันทึกรายการ'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {orders.length === 0 ? (
            <EmptyState icon={<CheckCircle2 size={36} />} text="ยังไม่มีรายการที่เสร็จสิ้น" />
          ) : (
            <div className="flex flex-col gap-4">
              {orders.map((o) => (
                <div key={o.id} className="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 border-green-500">
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">{o.order_number}</p>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                      <Calendar size={14} className="text-gray-400" />
                      {formatDate(o.completed_date)}
                    </p>
                    {o.note && <p className="text-sm mt-3 text-gray-600 bg-gray-50 p-2 rounded-md border border-gray-100">{o.note}</p>}
                  </div>
                  <div className="sm:text-right shrink-0">
                    <p className="text-xs text-gray-500 mb-1">ยอดรวม</p>
                    <p className="text-lg font-bold text-green-600">{formatCurrency(o.total_amount || 0)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}


      {/* Teleprompter Modal */}
      {activeScript !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Lightbulb className="text-yellow-500" /> สคริปต์สำหรับอ่าน
              </h3>
              <button onClick={() => setActiveScript(null)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto grow">
              <textarea 
                className="w-full h-full min-h-[40vh] p-4 text-xl leading-relaxed text-gray-800 bg-blue-50/30 border border-blue-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                value={activeScript.text}
                onChange={(e) => setActiveScript({ ...activeScript, text: e.target.value })}
              />
            </div>
            <div className="p-4 border-t border-gray-100 flex flex-wrap gap-3 justify-end items-center">
              <button 
                onClick={() => {
                  const newScripts = { ...customScripts };
                  newScripts[activeScript.dept][activeScript.idx].script = activeScript.text;
                  setCustomScripts(newScripts);
                  localStorage.setItem('tmk_script_templates', JSON.stringify(newScripts));
                  alert('บันทึกแม่แบบสคริปต์เรียบร้อยแล้ว');
                }} 
                className="px-6 py-2.5 rounded-lg border border-blue-600 text-blue-600 font-medium hover:bg-blue-50 transition-colors mr-auto"
              >
                บันทึกเป็นแม่แบบใหม่
              </button>
              <button onClick={() => setActiveScript(null)} className="px-6 py-2.5 rounded-lg text-gray-600 font-medium hover:bg-gray-100 transition-colors">ปิด</button>
              <button 
                onClick={() => {
                  setConvForm(f => ({ ...f, summary: activeScript.text }));
                  setActiveScript(null);
                  setShowScripts(false);
                }} 
                className="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors shadow-sm"
              >
                ใช้สคริปต์นี้
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-components
function InfoCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="glass-card overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-5 pb-4 hover:bg-gray-50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600 shrink-0">{icon}</div>
          <span className="text-base font-bold text-gray-900">{title}</span>
        </div>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
          {open ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500 font-medium">{label}</span>
      <span className="text-sm text-gray-900 font-medium">{value}</span>
    </div>
  );
}

function ConvCard({ 
  conv, 
  onEdit, 
  onDelete, 
  isEditing, 
  editData, 
  onEditDataChange, 
  onSaveEdit, 
  onCancelEdit, 
  savingEdit 
}: { 
  conv: ConversationHistory;
  onEdit?: () => void;
  onDelete?: () => void;
  isEditing?: boolean;
  editData?: any;
  onEditDataChange?: (data: any) => void;
  onSaveEdit?: () => void;
  onCancelEdit?: () => void;
  savingEdit?: boolean;
}) {
  const deptColors = conv.contact_dept ? CONTACT_DEPT_COLORS[conv.contact_dept] : null;
  const deptLabel = conv.contact_dept ? CONTACT_DEPT_LABELS[conv.contact_dept] : null;
  
  if (isEditing && editData && onEditDataChange) {
    return (
      <div className="relative pl-10">
        <div className="absolute left-0 top-3 w-3 h-3 rounded-full border-2 bg-white ml-[18px] z-10 shadow-sm border-blue-500" />
        <div className="glass-card p-5 border-l-4 border-blue-500">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">วันที่</label>
              <input type="date" className="input-field py-1.5 text-sm" value={editData.date} onChange={e => onEditDataChange({...editData, date: e.target.value})} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">เวลา</label>
              <input type="time" className="input-field py-1.5 text-sm" value={editData.time} onChange={e => onEditDataChange({...editData, time: e.target.value})} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">ช่องทาง</label>
              <select className="input-field py-1.5 text-sm" value={editData.channel} onChange={e => onEditDataChange({...editData, channel: e.target.value})}>
                {['โทรศัพท์', 'LINE', 'Email', 'พบตัว', 'Zoom/Meet', 'อื่นๆ'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">ฝ่าย</label>
              <select className="input-field py-1.5 text-sm" value={editData.contact_dept} onChange={e => onEditDataChange({...editData, contact_dept: e.target.value})}>
                <option value="">- เลือก -</option>
                <option value="phone_main">เบอร์กลาง</option>
                <option value="purchase_dept">ฝ่ายจัดซื้อ</option>
                <option value="building_dept">ฝ่ายอาคาร</option>
              </select>
            </div>
          </div>
          <div className="mb-3">
            <label className="text-xs text-gray-500 mb-1 block">สรุป</label>
            <textarea className="input-field text-sm" rows={3} value={editData.summary} onChange={e => onEditDataChange({...editData, summary: e.target.value})} />
          </div>
          <div className="mb-4">
            <label className="text-xs text-gray-500 mb-1 block">Next Action</label>
            <input className="input-field py-1.5 text-sm" value={editData.next_action} onChange={e => onEditDataChange({...editData, next_action: e.target.value})} />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={onCancelEdit} className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">ยกเลิก</button>
            <button onClick={onSaveEdit} disabled={savingEdit} className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-sm">
              {savingEdit ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative pl-10 group">
      {/* Timeline Dot */}
      <div className="absolute left-0 top-3 w-3 h-3 rounded-full border-2 bg-white ml-[18px] z-10 shadow-sm" style={{ borderColor: deptColors?.text || '#3B82F6' }} />
      
      <div className="glass-card p-5 hover:shadow-md transition-shadow">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge text-xs bg-blue-50 text-blue-700 border border-blue-100">{conv.channel}</span>
            {deptLabel && deptColors && (
              <span 
                className="badge text-xs border"
                style={{ background: deptColors.bg, color: deptColors.text, borderColor: deptColors.border }}
              >
                {deptLabel}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
              <Calendar size={12}/> {formatDate(conv.date)}
              {/* @ts-ignore */}
              {conv.time && <><Clock size={12} className="ml-1"/> {conv.time}</>}
            </span>
            {onEdit && onDelete && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white rounded-md shadow-sm border border-gray-100 p-0.5">
                <button onClick={onEdit} className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="แก้ไข">
                  <Edit2 size={13} />
                </button>
                <button onClick={onDelete} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="ลบ">
                  <Trash2 size={13} />
                </button>
              </div>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">{conv.summary}</p>
        {conv.next_action && (
          <div className="mt-4 p-3 rounded-lg text-sm bg-amber-50 text-amber-800 border border-amber-100 flex items-start gap-2">
            <span className="shrink-0 mt-0.5">👉</span> 
            <span><span className="font-semibold">Next Action:</span> {conv.next_action}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="glass-card p-16 text-center border-dashed border-2 border-gray-200">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
        {icon}
      </div>
      <p className="text-gray-900 font-bold text-lg">{text}</p>
      <p className="text-sm mt-1 text-gray-500">คลิกปุ่มด้านบนเพื่อเพิ่มข้อมูล</p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="glass-card h-24 mb-6 animate-pulse bg-white/50" />
      <div className="glass-card h-14 mb-6 animate-pulse bg-white/50" />
      <div className="glass-card h-64 animate-pulse bg-white/50" />
    </div>
  );
}
