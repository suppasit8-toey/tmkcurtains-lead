'use client';

import { useState, useEffect } from 'react';
import { Copy, Check, Search, MessageSquare, Gift, Tag, Building2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { type OrgCategoryData } from '@/lib/types';

type ScriptItem = {
  id: string;
  title: string;
  content: string;
  category: string;
};

const SCRIPTS_DATA: ScriptItem[] = [
  {
    id: 's1',
    title: 'ทักทายลูกค้าใหม่ (ทั่วไป)',
    content: 'สวัสดีครับ/ค่ะ 🙏 ยินดีต้อนรับสู่ TMK Curtains นะครับ/คะ\n\nสนใจสอบถามรายละเอียดผ้าม่าน มู่ลี่ วอลเปเปอร์ หรือให้ทางเราประเมินราคาเบื้องต้น สามารถแจ้งรายละเอียดหรือส่งรูปพื้นที่หน้างานมาได้เลยครับ/ค่ะ ✨',
    category: 'ทักทายลูกค้า'
  },
  {
    id: 's2',
    title: 'ขอข้อมูลประเมินราคา',
    content: 'รบกวนลูกค้าแจ้งข้อมูลเพิ่มเติมเพื่อการประเมินราคาที่แม่นยำครับ:\n1. ประเภทที่อยู่อาศัย (บ้านเดี่ยว/ทาวน์โฮม/คอนโด)\n2. ขนาดพื้นที่ หรือ จำนวนหน้าต่าง/ประตูโดยประมาณ\n3. สไตล์หรือโทนสีที่สนใจ\n\nหากมีแปลนบ้านสามารถส่งมาให้ทีมงานช่วยดูได้เลยนะครับ 😊',
    category: 'ขอข้อมูล'
  },
  {
    id: 's3',
    title: 'ติดตามลูกค้า (Follow-up)',
    content: 'สวัสดีครับ/ค่ะ 🙏 ไม่ทราบว่าทางลูกค้าตัดสินใจเรื่องผ้าม่านได้หรือยังครับ/คะ หากมีข้อสงสัยเพิ่มเติมหรือต้องการให้เราปรับใบเสนอราคาให้ตรงงบประมาณ สามารถแจ้งได้เลยนะครับ ทางเรายินดีให้คำปรึกษาครับ ✨',
    category: 'ติดตามลูกค้า'
  },
  {
    id: 's4',
    title: 'แจ้งนัดหมายเข้าวัดพื้นที่',
    content: 'ขออนุญาตคอนเฟิร์มนัดหมายเข้าวัดพื้นที่นะครับ 📏\n\nวันที่: [ระบุวันที่]\nเวลา: [ระบุเวลา]\n\nทีมงานจะโทรแจ้งล่วงหน้า 30 นาทีก่อนถึงหน้างานครับ ขอบคุณที่ไว้วางใจ TMK Curtains ครับ 🙏',
    category: 'นัดหมาย'
  }
];

const PROMOTIONS_DATA: ScriptItem[] = [
  {
    id: 'p1',
    title: 'โปรโมชั่น คอนโด (เหมาๆ)',
    content: '🔥 โปรโมชั่นพิเศษสำหรับคอนโด 🔥\n\nผ้าม่านทึบแสงกัน UV 100% + ม่านโปร่ง\nเริ่มต้นเพียง 9,900.- บาท (สำหรับห้อง Studio/1 Bed)\n\n✅ ฟรี! วัดพื้นที่และประเมินราคา\n✅ ฟรี! ติดตั้งโดยทีมช่างมืออาชีพ\n✅ รับประกันอุปกรณ์ 1 ปีเต็ม\n\nสนใจจองคิววัดพื้นที่ ทักแชทได้เลยครับ!',
    category: 'condo' // Matching potential org_category value
  },
  {
    id: 'p2',
    title: 'โปรโมชั่น บ้านเดี่ยวสุดคุ้ม',
    content: '🏠 โปรฯ เหมาหลัง บ้านเดี่ยว/ทาวน์โฮม 🏠\n\nรับส่วนลดพิเศษทันที 15% เมื่อสั่งทำผ้าม่านทั้งหลัง\nพร้อมของแถม: มอนิเตอร์สายรวบม่านพรีเมียมทุกจุด\n\nพิเศษ! หากยอดรวมเกิน 50,000 บาท รับฟรี หมอนอิงลายเข้าเซ็ต 2 ใบ 🎁\n\nรีบหน่อย โปรโมชั่นถึงสิ้นเดือนนี้เท่านั้นครับ!',
    category: 'housing'
  },
  {
    id: 'p3',
    title: 'ผ่อน 0% นาน 6 เดือน',
    content: '💳 สิทธิพิเศษสำหรับลูกค้าบัตรเครดิตที่ร่วมรายการ 💳\n\nสามารถผ่อนชำระ 0% ได้นานสูงสุด 6 เดือน\n(เมื่อมียอดสั่งซื้อขั้นต่ำ 30,000 บาทขึ้นไป)\n\nลดภาระค่าใช้จ่าย แถมได้ม่านสวยๆ ไปแต่งบ้าน คุ้มกว่านี้ไม่มีอีกแล้ว! ✨',
    category: 'general'
  }
];

export default function ScriptsPage() {
  const [activeTab, setActiveTab] = useState<'scripts' | 'promotions'>('scripts');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [orgCategories, setOrgCategories] = useState<OrgCategoryData[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase
        .from('org_categories')
        .select('*')
        .order('created_at', { ascending: true });
      if (data) setOrgCategories(data);
    }
    fetchCategories();
  }, [supabase]);

  const data = activeTab === 'scripts' ? SCRIPTS_DATA : PROMOTIONS_DATA;
  
  const filteredData = data.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) || 
                          item.content.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryLabel = (catValue: string) => {
    const cat = orgCategories.find(c => c.value === catValue);
    return cat ? `${cat.icon} ${cat.label}` : catValue;
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">สคริปต์ & โปรโมชั่น</h1>
          <p className="text-sm mt-1 text-gray-500 font-medium">
            คลังข้อความสำหรับตอบลูกค้า คัดลอกไปใช้ได้ทันที
          </p>
        </div>
        
        {/* Tabs */}
        <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm shrink-0">
          <button
            onClick={() => { setActiveTab('scripts'); setActiveCategory('all'); setSearch(''); }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'scripts' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <MessageSquare size={18} />
            สคริปต์
          </button>
          <button
            onClick={() => { setActiveTab('promotions'); setActiveCategory('all'); setSearch(''); }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'promotions' 
                ? 'bg-rose-500 text-white shadow-md' 
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Gift size={18} />
            โปรโมชั่น
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder={`ค้นหา${activeTab === 'scripts' ? 'สคริปต์' : 'โปรโมชั่น'}...`}
            className="input-field !pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex overflow-x-auto gap-2 pb-2 md:pb-0 hide-scrollbar shrink-0 items-center">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${
              activeCategory === 'all'
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            หมวดหมู่ทั้งหมด
          </button>
          {orgCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${
                activeCategory === cat.value
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredData.length === 0 ? (
          <div className="col-span-full py-16 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl bg-white/50">
            <MessageSquare size={32} className="mx-auto mb-3 opacity-20" />
            <p className="font-medium text-lg">ไม่พบข้อมูลที่ค้นหา</p>
            <p className="text-sm mt-1">ลองเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่ใหม่</p>
          </div>
        ) : (
          filteredData.map(item => (
            <div key={item.id} className="glass-card p-5 flex flex-col h-full bg-white hover:shadow-lg hover:border-blue-300 transition-all duration-300 group">
              <div className="flex items-start justify-between mb-4 gap-2">
                <div>
                  {item.category && item.category !== 'general' && item.category !== 'ทักทายลูกค้า' && item.category !== 'ขอข้อมูล' && item.category !== 'ติดตามลูกค้า' && item.category !== 'นัดหมาย' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-bold mb-2 border border-gray-200">
                      <Building2 size={12} />
                      {getCategoryLabel(item.category)}
                    </span>
                  )}
                  <h3 className="font-bold text-gray-900 text-lg leading-tight group-hover:text-blue-700 transition-colors">
                    {item.title}
                  </h3>
                </div>
                <button
                  onClick={() => handleCopy(item.id, item.content)}
                  className={`shrink-0 p-2.5 rounded-xl transition-all shadow-sm ${
                    copiedId === item.id 
                      ? 'bg-green-500 text-white' 
                      : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-100 hover:border-blue-600'
                  }`}
                  title="คัดลอกข้อความ"
                >
                  {copiedId === item.id ? <Check size={18} strokeWidth={3} /> : <Copy size={18} />}
                </button>
              </div>
              
              <div className="flex-1 bg-[#F9FAFB] rounded-xl p-4 border border-gray-100 text-[15px] text-gray-700 whitespace-pre-wrap font-medium leading-relaxed group-hover:bg-white transition-colors shadow-inner">
                {item.content}
              </div>
              
              <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                <span className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></div>
                  พร้อมใช้งาน
                </span>
                <button
                  onClick={() => handleCopy(item.id, item.content)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-md transition-colors ${
                    copiedId === item.id 
                      ? 'text-green-700 bg-green-50' 
                      : 'text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  {copiedId === item.id ? 'คัดลอกสำเร็จ!' : 'คลิกเพื่อคัดลอก'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
