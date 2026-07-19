'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { type Profile, type OrgCategoryData } from '@/lib/types';
import { Save, User, Plus, Trash2, LayoutGrid, Check, X, Edit2, ChevronDown } from 'lucide-react';

const COMMON_ICONS = [
  '🏢', '🏫', '🏛️', '🏥', '⚕️', '🎓', '📚', '🏭', '🏨', '🏦', '🏪', '🏬', '🕌', '⛪', '🕍', '⛩️', '🏟️', '🏰', 
  '🏡', '🏘️', '⛺', '🎪', '🎢', '💈', '☕', '🍽️', '🍺', '🛍️', '🛒', '🎁', '💻', '📱', '🚗', '✈️', '🚀', '💡', 
  '✨', '💎', '💰', '📈', '📊', '💼', '🤝', '🔥', '⭐', '🔧', '🔨', '🩺', '💊', '🎨', '🎵'
];

export default function SettingsPage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [categories, setCategories] = useState<OrgCategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Profile form
  const [fullName, setFullName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  // Category form
  const [newCatLabel, setNewCatLabel] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('🏢');
  const [savingCat, setSavingCat] = useState(false);

  // Edit category
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editIcon, setEditIcon] = useState('');
  
  // Icon Picker
  const [showIconPickerFor, setShowIconPickerFor] = useState<'new' | string | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Handle click outside icon picker
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowIconPickerFor(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [profRes, catRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('org_categories').select('*').order('created_at', { ascending: true })
      ]);

      if (profRes.data) {
        setProfile(profRes.data);
        setFullName(profRes.data.full_name);
      }
      
      setCategories(catRes.data || []);
      setLoading(false);
    }
    fetchData();
  }, [supabase]);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setProfileMsg('');
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, full_name: fullName });
      
      if (!error) {
        setProfileMsg('บันทึกข้อมูลเรียบร้อยแล้ว');
      } else {
        setProfileMsg('เกิดข้อผิดพลาด: ' + error.message);
      }
    }
    setSavingProfile(false);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatLabel.trim()) return;
    setSavingCat(true);

    const value = newCatLabel.trim().toLowerCase().replace(/\s+/g, '_');
    
    const { data, error } = await supabase
      .from('org_categories')
      .insert({ label: newCatLabel.trim(), icon: newCatIcon, value })
      .select()
      .single();

    if (data && !error) {
      setCategories([...categories, data]);
      setNewCatLabel('');
      setNewCatIcon('🏢');
      setShowIconPickerFor(null);
    }
    setSavingCat(false);
  };

  const handleStartEdit = (cat: OrgCategoryData) => {
    setEditingId(cat.id);
    setEditLabel(cat.label);
    setEditIcon(cat.icon);
    setShowIconPickerFor(null);
  };

  const handleSaveEdit = async () => {
    if (!editLabel.trim()) return;
    
    const { error } = await supabase
      .from('org_categories')
      .update({ label: editLabel.trim(), icon: editIcon })
      .eq('id', editingId);

    if (!error) {
      setCategories(categories.map(c => c.id === editingId ? { ...c, label: editLabel.trim(), icon: editIcon } : c));
      setEditingId(null);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('ยืนยันการลบหมวดหมู่นี้? (องค์กรเก่าที่ใช้หมวดหมู่นี้จะยังแสดงชื่อเดิมไว้)')) return;
    
    await supabase.from('org_categories').delete().eq('id', id);
    setCategories(categories.filter(c => c.id !== id));
  };

  // Icon Picker Component
  const IconPicker = ({ onSelect }: { onSelect: (icon: string) => void }) => (
    <div ref={pickerRef} className="absolute z-10 mt-12 bg-white border border-gray-200 shadow-xl rounded-xl p-3 w-72 max-h-64 overflow-y-auto animate-fade-in">
      <div className="grid grid-cols-6 gap-2">
        {COMMON_ICONS.map(icon => (
          <button
            key={icon}
            type="button"
            onClick={() => onSelect(icon)}
            className="w-10 h-10 flex items-center justify-center text-xl hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
          >
            {icon}
          </button>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return <div className="p-8 text-center text-gray-500">กำลังโหลด...</div>;
  }

  return (
    <div className="animate-fade-in max-w-4xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">การตั้งค่า</h1>
        <p className="text-sm mt-1 text-gray-500 font-medium">จัดการโปรไฟล์และตั้งค่าระบบ</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Profile Settings */}
        <div className="glass-card p-6 self-start">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <User size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">โปรไฟล์ส่วนตัว</h2>
              <p className="text-xs text-gray-500">ชื่อที่ใช้แสดงในระบบ</p>
            </div>
          </div>
          
          <div className="flex flex-col gap-4">
            <div>
              <label className="label">ชื่อ-นามสกุล / ชื่อเล่น</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="กรอกชื่อของคุณ"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <button 
              onClick={handleSaveProfile} 
              className="btn-primary justify-center mt-2"
              disabled={savingProfile || !fullName.trim()}
            >
              {savingProfile ? 'กำลังบันทึก...' : <><Save size={16} /> บันทึกโปรไฟล์</>}
            </button>
            {profileMsg && (
              <p className={`text-sm text-center font-medium mt-2 ${profileMsg.includes('ผิดพลาด') ? 'text-red-500' : 'text-green-600'}`}>
                {profileMsg}
              </p>
            )}
          </div>
        </div>

        {/* Categories Settings */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
              <LayoutGrid size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">หมวดหมู่องค์กร</h2>
              <p className="text-xs text-gray-500">จัดการประเภทของลูกค้าที่ใช้นำเสนอ</p>
            </div>
          </div>

          <form onSubmit={handleAddCategory} className="flex gap-2 mb-6 relative">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowIconPickerFor(showIconPickerFor === 'new' ? null : 'new')}
                className="input-field w-16 px-0 text-center text-xl flex items-center justify-center h-full hover:bg-gray-50 transition-colors"
              >
                {newCatIcon}
              </button>
              {showIconPickerFor === 'new' && (
                <IconPicker onSelect={(icon) => { setNewCatIcon(icon); setShowIconPickerFor(null); }} />
              )}
            </div>
            <div className="flex-1">
              <input 
                type="text" 
                className="input-field" 
                placeholder="ชื่อหมวดหมู่ใหม่..."
                value={newCatLabel}
                onChange={(e) => setNewCatLabel(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-primary px-3" disabled={savingCat}>
              <Plus size={18} />
            </button>
          </form>

          <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-2">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between p-2 rounded-lg border border-gray-100 bg-gray-50 hover:bg-white transition-colors group">
                
                {editingId === cat.id ? (
                  <div className="flex items-center gap-2 w-full relative">
                    <div>
                      <button
                        onClick={() => setShowIconPickerFor(showIconPickerFor === cat.id ? null : cat.id)}
                        className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-xl hover:bg-gray-50 transition-colors"
                      >
                        {editIcon}
                      </button>
                      {showIconPickerFor === cat.id && (
                        <IconPicker onSelect={(icon) => { setEditIcon(icon); setShowIconPickerFor(null); }} />
                      )}
                    </div>
                    
                    <input 
                      type="text"
                      className="input-field flex-1 py-1.5"
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      autoFocus
                    />
                    
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={handleSaveEdit} className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors" title="บันทึก">
                        <Check size={18} />
                      </button>
                      <button onClick={() => setEditingId(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded transition-colors" title="ยกเลิก">
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 pl-1">
                      <span className="text-xl bg-white w-8 h-8 rounded shadow-sm flex items-center justify-center border border-gray-100">{cat.icon}</span>
                      <span className="font-medium text-gray-900 text-sm">{cat.label}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleStartEdit(cat)}
                        className="text-gray-400 hover:text-blue-500 p-1.5 rounded hover:bg-blue-50 transition-colors"
                        title="แก้ไข"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="text-gray-400 hover:text-red-500 p-1.5 rounded hover:bg-red-50 transition-colors"
                        title="ลบ"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </>
                )}

              </div>
            ))}
            {categories.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-4">ยังไม่มีหมวดหมู่องค์กร</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
