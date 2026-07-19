'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  STATUS_LABELS,
  type OrgStatus,
  type OrgCategoryData,
  type Department,
  PROVINCES,
} from '@/lib/types';
import { useRouter } from 'next/navigation';
import { Save, User, Building2, Phone, MapPin, CheckCircle2, ChevronDown, Clock, Loader2, Navigation, Users, Lightbulb, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import MultiInput from '@/components/MultiInput';
import { extractMapCoordinates, calculateDistance, fetchProvinceFromCoords, TMK_LAT, TMK_LNG } from '@/lib/utils';

const ALL_STATUSES: OrgStatus[] = [
  'new_lead', 'contacted', 'presented', 'quoted', 'negotiating', 'won', 'lost', 'on_hold',
];


const emptyDept: Department = { name: '', phone: '', email: '', line_id: '', note: '' };

interface FormData {
  category: string;
  status: OrgStatus;
  name: string;
  building_age: string;
  org_info: string;
  phone_main: string;
  email_main: string;
  building_dept: Department;
  purchase_dept: Department;
  accounting_dept: Department;
  pitch_technique: string;
  map_url: string;
  province: string;
  distance_km: string;
}

export default function NewOrganizationPage() {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<FormData>({
    category: '',
    status: 'new_lead',
    name: '',
    building_age: '',
    org_info: '',
    phone_main: '',
    email_main: '',
    building_dept: { ...emptyDept },
    purchase_dept: { ...emptyDept },
    accounting_dept: { ...emptyDept },
    pitch_technique: '',
    map_url: '',
    province: 'กรุงเทพมหานคร',
    distance_km: '',
  });

  const [categories, setCategories] = useState<OrgCategoryData[]>([]);

  useEffect(() => {
    async function fetchCats() {
      const { data } = await supabase.from('org_categories').select('*').order('created_at', { ascending: true });
      if (data) {
        setCategories(data);
        if (data.length > 0) set('category', data[0].value);
      }
    }
    fetchCats();
  }, [supabase]);


  const set = (field: keyof FormData, val: string) =>
    setForm((f) => ({ ...f, [field]: val }));

  const setDept = (dept: 'building_dept' | 'purchase_dept' | 'accounting_dept', field: keyof Department, val: string) =>
    setForm((f) => ({ ...f, [dept]: { ...f[dept], [field]: val } }));

  const handleMapUrlChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    set('map_url', url);
    
    const coords = extractMapCoordinates(url);
    if (coords) {
      const dist = calculateDistance(TMK_LAT, TMK_LNG, coords.lat, coords.lng);
      set('distance_km', dist.toString());
      
      const prov = await fetchProvinceFromCoords(coords.lat, coords.lng);
      if (prov && PROVINCES.includes(prov)) {
        set('province', prov);
      }
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError('กรุณากรอกชื่อองค์กร');
      return;
    }
    setSaving(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const payload = {
      ...form,
      name: form.name.trim(),
      building_age: form.building_age ? parseInt(form.building_age) : null,
      distance_km: parseFloat(form.distance_km) || null,
      user_id: user.id,
    };

    const { data, error: err } = await supabase
      .from('organizations')
      .insert(payload)
      .select()
      .single();

    if (err) {
      setError('เกิดข้อผิดพลาด: ' + err.message);
      setSaving(false);
    } else {
      router.push(`/dashboard/organizations/${data.id}`);
    }
  };

  return (
    <div className="animate-fade-in max-w-3xl mx-auto pb-24 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/organizations" className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-50 shadow-sm transition-all">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">เพิ่มองค์กรใหม่</h1>
            <p className="text-sm mt-1 text-gray-500">กรอกข้อมูลองค์กรที่ต้องการนำเสนอ</p>
          </div>
        </div>
        <div className="hidden md:block">
          <button className="btn-primary shadow-sm" onClick={handleSave} disabled={saving}>
            {saving ? (
              <svg className="animate-spin w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="12" />
              </svg>
            ) : <Save size={16} />}
            {saving ? 'กำลังบันทึก...' : 'บันทึกองค์กร'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl text-sm bg-red-50 text-red-600 border border-red-200 shadow-sm">
          {error}
        </div>
      )}

      {/* Section 1: Basic Info */}
      <Section icon={<Building2 size={18} />} title="1. ข้อมูลพื้นฐาน">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">หมวดหมู่ <span className="text-red-500">*</span></label>
            <select className="input-field" value={form.category} onChange={(e) => set('category', e.target.value)}>
              {categories.map((c) => <option key={c.id} value={c.value}>{c.icon} {c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">สถานะ <span className="text-red-500">*</span></label>
            <select className="input-field" value={form.status} onChange={(e) => set('status', e.target.value)}>
              {ALL_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label className="label">ชื่อองค์กร <span className="text-red-500">*</span></label>
          <input type="text" className="input-field font-medium text-base py-2.5" placeholder="เช่น โรงพยาบาลเอกชนกรุงเทพ" value={form.name} onChange={(e) => set('name', e.target.value)} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="label">อายุอาคาร (ปี)</label>
            <input type="number" className="input-field" placeholder="เช่น 15" value={form.building_age} onChange={(e) => set('building_age', e.target.value)} min="0" />
          </div>
        </div>
        <div className="mt-4">
          <label className="label">ข้อมูลเพิ่มเติมองค์กร</label>
          <textarea className="input-field" rows={3} placeholder="รายละเอียดองค์กร, ที่ตั้ง, จำนวนชั้น ฯลฯ" value={form.org_info} onChange={(e) => set('org_info', e.target.value)} />
        </div>
      </Section>

      {/* Section 1.5: Location */}
      <Section icon={<MapPin size={18} />} title="สถานที่ตั้ง & แผนที่">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="label">ลิงก์ Google Maps / Iframe</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="วางลิงก์เพื่อคำนวณระยะทางอัตโนมัติ..." 
              value={form.map_url} 
              onChange={handleMapUrlChange} 
            />
          </div>
          <div>
            <label className="label">จังหวัด <span className="text-red-500">*</span> <span className="text-[10px] font-normal text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded ml-1">(อัตโนมัติ)</span></label>
            <select className="input-field" value={form.province} onChange={(e) => set('province', e.target.value)}>
              {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="label">ระยะทางจาก TMK Curtains (กม.) <span className="text-[10px] font-normal text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded ml-1">(อัตโนมัติ)</span></label>
            <input 
              type="number" 
              className="input-field" 
              placeholder="0.0" 
              step="0.1"
              value={form.distance_km} 
              onChange={(e) => set('distance_km', e.target.value)} 
            />
          </div>
        </div>
      </Section>

      {/* Section 2: Contact */}
      <Section icon={<Phone size={18} />} title="2. ช่องทางติดต่อกลาง">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <MultiInput label="เบอร์กลาง" type="tel" placeholder="02-xxx-xxxx" value={form.phone_main} onChange={(val) => set('phone_main', val)} />
          </div>
          <div>
            <MultiInput label="อีเมลกลาง" type="email" placeholder="email@example.com" value={form.email_main} onChange={(val) => set('email_main', val)} />
          </div>
        </div>
      </Section>

      {/* Section 3: Departments */}
      <Section icon={<Users size={18} />} title="3. ข้อมูลฝ่ายต่างๆ">
        <DeptForm title="ฝ่ายอาคาร" dept={form.building_dept} onChange={(f, v) => setDept('building_dept', f, v)} />
        <div className="my-6 border-t border-gray-100" />
        <DeptForm title="ฝ่ายจัดซื้อ" dept={form.purchase_dept} onChange={(f, v) => setDept('purchase_dept', f, v)} />
        <div className="my-6 border-t border-gray-100" />
        <DeptForm title="ฝ่ายบัญชี" dept={form.accounting_dept} onChange={(f, v) => setDept('accounting_dept', f, v)} />
      </Section>

      {/* Section 4: Pitch */}
      <Section icon={<Lightbulb size={18} />} title="4. เทคนิคการนำเสนอ">
        <textarea
          className="input-field bg-[#F8FAFC]"
          rows={4}
          placeholder="บันทึกเทคนิค จุดเน้น หรือกลยุทธ์ที่ใช้ในการนำเสนอองค์กรนี้..."
          value={form.pitch_technique}
          onChange={(e) => set('pitch_technique', e.target.value)}
        />
      </Section>

      {/* Mobile Save Button */}
      <div className="md:hidden flex gap-3 mt-8">
        <Link href="/dashboard/organizations" className="btn-secondary flex-1 justify-center py-3">
          ยกเลิก
        </Link>
        <button className="btn-primary flex-1 justify-center py-3" onClick={handleSave} disabled={saving}>
          {saving ? (
            <svg className="animate-spin w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="12" />
            </svg>
          ) : <Save size={18} />}
          {saving ? 'กำลังบันทึก...' : 'บันทึก'}
        </button>
      </div>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="glass-card p-6 mb-5">
      <div className="flex items-center gap-3 mb-5 border-b border-gray-100 pb-4">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600">
          {icon}
        </div>
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function DeptForm({
  title,
  dept,
  onChange,
}: {
  title: string;
  dept: Department;
  onChange: (field: keyof Department, val: string) => void;
}) {
  return (
    <div>
      <p className="text-sm font-bold mb-3 text-gray-700 bg-gray-50 inline-block px-3 py-1 rounded-md">{title}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="label text-[11px]">ชื่อผู้ติดต่อ</label>
          <input type="text" className="input-field text-sm py-2" placeholder="ชื่อ-นามสกุล" value={dept.name} onChange={(e) => onChange('name', e.target.value)} />
        </div>
        <div>
          <MultiInput label="เบอร์โทร" type="tel" placeholder="08x-xxx-xxxx" value={dept.phone} onChange={(val) => onChange('phone', val)} />
        </div>
        <div>
          <MultiInput label="อีเมล" type="email" placeholder="email@example.com" value={dept.email} onChange={(val) => onChange('email', val)} />
        </div>
        <div>
          <label className="label text-[11px]">LINE ID</label>
          <input type="text" className="input-field text-sm py-2" placeholder="@line_id" value={dept.line_id || ''} onChange={(e) => onChange('line_id', e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="label text-[11px]">หมายเหตุ</label>
          <input type="text" className="input-field text-sm py-2" placeholder="หมายเหตุเพิ่มเติม" value={dept.note || ''} onChange={(e) => onChange('note', e.target.value)} />
        </div>
      </div>
    </div>
  );
}
