'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  STATUS_LABELS, STATUS_COLORS,
  type Organization, type ConversationHistory, type Quotation,
  type CompletedOrder, type OrgStatus, type Department, type OrgCategoryData,
} from '@/lib/types';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Edit2, Trash2, Save, X, Plus, Phone, Mail,
  MessageSquare, FileText, CheckCircle2, Building2, Users, Lightbulb,
  Calendar, ChevronDown, ChevronUp, MapPin, Navigation, Map as MapIcon, ExternalLink
} from 'lucide-react';
import { formatDate, formatCurrency, extractMapCoordinates, calculateDistance, fetchProvinceFromCoords, TMK_LAT, TMK_LNG } from '@/lib/utils';
import { PROVINCES } from '@/lib/types';

const ALL_STATUSES: OrgStatus[] = ['new_lead','contacted','presented','quoted','negotiating','won','lost','on_hold'];
const STATUS_LABEL_MAP = STATUS_LABELS;

type TabId = 'info' | 'conversations' | 'quotations' | 'orders';

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
  const [convForm, setConvForm] = useState({ date: new Date().toISOString().split('T')[0], channel: 'โทรศัพท์', summary: '', next_action: '' });
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
    setSavingConv(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('conversation_history').insert({ ...convForm, org_id: id, user_id: user!.id });
    setConvForm({ date: new Date().toISOString().split('T')[0], channel: 'โทรศัพท์', summary: '', next_action: '' });
    setShowConvForm(false);
    fetchAll();
    setSavingConv(false);
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
                <div><label className="label">เบอร์กลาง</label><input type="tel" className="input-field text-sm" value={editData.phone_main || ''} onChange={(e) => setEditData(d => ({ ...d, phone_main: e.target.value }))} /></div>
                <div><label className="label">อีเมลกลาง</label><input type="email" className="input-field text-sm" value={editData.email_main || ''} onChange={(e) => setEditData(d => ({ ...d, email_main: e.target.value }))} /></div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 text-sm">
                {org.phone_main && <div className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-lg border border-gray-100"><div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><Phone size={14} /></div><span className="font-medium text-gray-900">{org.phone_main}</span></div>}
                {org.email_main && <div className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-lg border border-gray-100"><div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><Mail size={14} /></div><span className="font-medium text-gray-900">{org.email_main}</span></div>}
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
                        <div><label className="label">เบอร์</label><input className="input-field text-sm bg-white" value={dept.phone || ''} onChange={(e) => setEditData(d => ({ ...d, [deptKey]: { ...dept, phone: e.target.value } }))} /></div>
                        <div><label className="label">อีเมล</label><input className="input-field text-sm bg-white" value={dept.email || ''} onChange={(e) => setEditData(d => ({ ...d, [deptKey]: { ...dept, email: e.target.value } }))} /></div>
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
                        {dept.phone && <div className="flex items-center gap-2"><Phone size={14} className="text-gray-400" />{dept.phone}</div>}
                        {dept.email && <div className="flex items-center gap-2"><Mail size={14} className="text-gray-400" />{dept.email}</div>}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="label">วันที่</label><input type="date" className="input-field text-sm" value={convForm.date} onChange={(e) => setConvForm(f => ({ ...f, date: e.target.value }))} /></div>
                  <div>
                    <label className="label">ช่องทาง</label>
                    <select className="input-field text-sm" value={convForm.channel} onChange={(e) => setConvForm(f => ({ ...f, channel: e.target.value }))}>
                      {['โทรศัพท์', 'LINE', 'Email', 'พบตัว', 'Zoom/Meet', 'อื่นๆ'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
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
                  <ConvCard key={conv.id} conv={conv} />
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

function ConvCard({ conv }: { conv: ConversationHistory }) {
  return (
    <div className="relative pl-10">
      {/* Timeline Dot */}
      <div className="absolute left-0 top-3 w-3 h-3 rounded-full border-2 border-blue-500 bg-white ml-[18px] z-10 shadow-sm" />
      
      <div className="glass-card p-5 hover:shadow-md transition-shadow">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <span className="badge text-xs bg-blue-50 text-blue-700 border border-blue-100">{conv.channel}</span>
          <span className="text-xs font-medium text-gray-500 flex items-center gap-1"><Calendar size={12}/> {formatDate(conv.date)}</span>
        </div>
        <p className="text-sm text-gray-800 leading-relaxed">{conv.summary}</p>
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
