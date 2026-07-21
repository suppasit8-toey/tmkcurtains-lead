'use client';

import { useState, useEffect } from 'react';
import { Copy, Check, Search, MessageSquare, Gift, Tag, Building2, Edit2, Save, X, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { type OrgCategoryData } from '@/lib/types';

export type ScriptItem = {
  id: string;
  title: string;
  content: string;
  category: string;
};

export const SCRIPTS_DATA: ScriptItem[] = [
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
  },
  {
    id: 's_int1',
    title: 'นำเสนองานโรงเรียนนานาชาติ',
    content: 'สวัสดีครับ/ค่ะ 🙏 ทาง TMK Curtains ขออนุญาตนำเสนอผลงานและบริการติดตั้งผ้าม่าน มู่ลี่ สำหรับโรงเรียนนานาชาติครับ\n\nทางเรามีความเชี่ยวชาญในการเลือกใช้วัสดุที่ได้มาตรฐานสากล เช่น ผ้าม่านกันลามไฟ (Flame Retardant) และวัสดุที่ปลอดภัยต่อเด็ก (Child-safe) เหมาะสำหรับห้องเรียน ห้องสมุด และหอประชุมครับ\n\nหากทางโรงเรียนมีโครงการปรับปรุงหรือสร้างอาคารใหม่ ทางเรายินดีเข้าไปวัดพื้นที่และประเมินราคาให้ฟรีโดยไม่มีค่าใช้จ่ายครับ ✨',
    category: 'โรงเรียนนานาชาติ'
  },
  {
    id: 's_int2',
    title: 'ติดตามโครงการ (โรงเรียน)',
    content: 'สวัสดีครับ/ค่ะ 🙏 ขออนุญาตสอบถามความคืบหน้าเรื่องโครงการติดตั้งผ้าม่านของทางโรงเรียนครับ ไม่ทราบว่าทางผู้บริหารหรือคณะกรรมการได้พิจารณาแบบและใบเสนอราคาที่ทาง TMK Curtains ส่งให้แล้วหรือยังครับ\n\nหากต้องการข้อมูลเพิ่มเติมเรื่องมาตรฐานวัสดุกันไฟ หรือเอกสารรับรองต่างๆ สามารถแจ้งได้เลยนะครับ ยินดีให้บริการครับ 😊',
    category: 'โรงเรียนนานาชาติ'
  },
  {
    id: 's_uni1',
    title: 'นำเสนองานมหาวิทยาลัยเอกชน',
    content: 'สวัสดีครับ/ค่ะ 🙏 ทาง TMK Curtains ขออนุญาตนำเสนอผลงานติดตั้งผ้าม่านสำหรับมหาวิทยาลัยครับ\n\nทางเรามีโซลูชันครบวงจร ทั้งม่านม้วน Blackout สำหรับห้องเลคเชอร์ที่ต้องการความมืดตอนใช้โปรเจคเตอร์, ระบบม่านมอเตอร์สำหรับหอประชุมใหญ่ และผ้าม่านดีไซน์พรีเมียมสำหรับห้องผู้บริหารครับ\n\nหากทางมหาวิทยาลัยมีแผนปรับปรุงภูมิทัศน์หรือสร้างอาคารใหม่ ทางเรายินดีเข้าประเมินพื้นที่และทำใบเสนอราคาให้พิจารณาโดยไม่มีค่าใช้จ่ายครับ 🏢✨',
    category: 'มหาลัยเอกชน'
  },
  {
    id: 's_uni2',
    title: 'ติดตามโครงการ (มหาวิทยาลัย)',
    content: 'สวัสดีครับ/ค่ะ 🙏 ขออนุญาตติดตามความคืบหน้าเรื่องโครงการติดตั้งผ้าม่านครับ ไม่ทราบว่าทางคณะกรรมการหรือฝ่ายจัดซื้อได้พิจารณารายละเอียดที่ทางเราส่งให้แล้วหรือยังครับ\n\nหากต้องการปรับเปลี่ยนสเปควัสดุเพื่อให้ตรงกับงบประมาณที่ตั้งไว้ สามารถแจ้งทีมงานได้เลยนะครับ ทางเรายินดีปรับแผนให้เหมาะสมที่สุดครับ 😊',
    category: 'มหาลัยเอกชน'
  },
  {
    id: 's_gov1',
    title: 'นำเสนองานหน่วยงานราชการ',
    content: 'สวัสดีครับ/ค่ะ 🙏 ทาง TMK Curtains ขออนุญาตนำเสนอผลงานและบริการสำหรับสถานที่ราชการครับ\n\nบริษัทของเราจดทะเบียนในรูปแบบนิติบุคคล สามารถออกใบกำกับภาษีได้เต็มรูปแบบ และมีประสบการณ์ในการจัดเตรียมเอกสารสำหรับระบบจัดซื้อจัดจ้าง (e-GP) ของภาครัฐครับ\n\nทางเรามีสินค้าที่ได้รับความนิยมในสถานที่ราชการ เช่น ม่านม้วนแบบ Sunscreen หรือม่านปรับแสงแนวตั้ง ที่ดูแลรักษาง่ายและราคาอยู่ในเกณฑ์มาตรฐาน หากหน่วยงานมีโครงการปรับปรุงอาคาร ยินดีเข้าไปวัดพื้นที่และทำใบเสนอราคาให้ฟรีครับ 🏛️',
    category: 'สถานที่ราชการ'
  },
  {
    id: 's_gov2',
    title: 'ติดตามโครงการ (ราชการ)',
    content: 'สวัสดีครับ/ค่ะ 🙏 ขออนุญาตติดตามเรื่องใบเสนอราคาที่ส่งให้พิจารณาครับ ไม่ทราบว่าอยู่ในขั้นตอนการพิจารณางบประมาณของปีนี้หรือปีหน้าครับ\n\nหากทางหน่วยงานต้องการให้ปรับปรุงรายละเอียดสเปคสินค้า เพื่อให้สอดคล้องกับระเบียบการจัดซื้อจัดจ้าง หรืองบประมาณที่ตั้งไว้ สามารถแจ้งทีมงานได้เลยนะครับ ทางเรายินดีซัพพอร์ตเรื่องเอกสารอย่างเต็มที่ครับ 😊',
    category: 'สถานที่ราชการ'
  },
  {
    id: 's_interior1',
    title: 'นำเสนองานกับ Interior',
    content: 'สวัสดีครับ/ค่ะ 🙏 ทาง TMK Curtains ขออนุญาตแนะนำตัวในฐานะพาร์ทเนอร์ด้านผ้าม่านและวอลเปเปอร์ครับ\n\nทางเรามีแคตตาล็อกผ้าและวัสดุที่หลากหลาย ตอบโจทย์งานออกแบบได้ทุกสไตล์ พร้อมทีมช่างติดตั้งมืออาชีพที่เข้าใจงานตกแต่งภายในเป็นอย่างดี\n\nยินดีมอบราคาพิเศษสำหรับพาร์ทเนอร์ (B2B Price) เพื่อนำไปบวกกำไรต่อได้เลยครับ หากสะดวกทางเราขออนุญาตเข้าไปนำเสนอแคตตาล็อกตัวอย่างที่ออฟฟิศนะครับ ✨',
    category: 'บริษัทออกแบบภายใน'
  },
  {
    id: 's_interior2',
    title: 'สอบถามโปรเจคใหม่',
    content: 'สวัสดีครับ/ค่ะ 🙏 ช่วงนี้ทางบริษัทมีโปรเจคไหนที่กำลังมองหาซัพพลายเออร์ผ้าม่านหรือวอลเปเปอร์อยู่บ้างไหมครับ\n\nหากมีแปลนหรือสเปควัสดุเบื้องต้น สามารถส่งมาให้ทีมประเมินราคาหรือจัดหาตัวอย่างผ้าให้ตรงกับเรฟเฟอเรนซ์ได้เลยนะครับ ทางเรายินดีซัพพอร์ตเต็มที่เพื่อให้งานจบไวและสวยงามครับ 😊',
    category: 'บริษัทออกแบบภายใน'
  }
];

export const PROMOTIONS_DATA: ScriptItem[] = [
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
  },
  {
    id: 'p_int1',
    title: 'โปรโมชั่น สถาบันการศึกษา',
    content: '🎓 โปรโมชั่นพิเศษสำหรับโรงเรียนและสถาบันการศึกษา 🎓\n\nรับส่วนลดพิเศษ 20% ทันทีเมื่อสั่งทำผ้าม่านหรือมู่ลี่สำหรับโครงการขนาดใหญ่ (มูลค่า 100,000 บาทขึ้นไป)\n\n✅ อัปเกรดเป็นผ้าม่านมาตรฐานทนไฟ (Flame Retardant) ในราคาพิเศษ\n✅ รับประกันงานติดตั้งและอุปกรณ์ 2 ปีเต็ม\n✅ บริการดูแลหลังการขาย ตรวจเช็คฟรีปีละ 1 ครั้ง\n\nสนใจรับข้อเสนอพิเศษนี้ สามารถนัดหมายทีมงานเข้าประเมินหน้างานได้เลยครับ!',
    category: 'โรงเรียนนานาชาติ'
  },
  {
    id: 'p_uni1',
    title: 'โปรโมชั่น โครงการมหาวิทยาลัย',
    content: '🏢 โปรโมชั่นพิเศษสำหรับมหาวิทยาลัยเอกชน 🏢\n\nรับส่วนลดพิเศษทันที 25% สำหรับงานโครงการขนาดใหญ่ (หอพักนักศึกษา, อาคารเรียนรวม)\n\n🎁 พิเศษ! ฟรีอัปเกรดระบบรางม่านมอเตอร์ (Motorized Track) 1 จุด สำหรับห้องประชุมใหญ่หรือห้องสภามหาวิทยาลัย เมื่อมียอดสั่งซื้อ 200,000 บาทขึ้นไป\n✅ พร้อมบริการเข้าดูแลรักษาและทำความสะอาดรางม่านฟรี 1 ปี\n\nยินดีรับเงื่อนไขการวางบิล/เครดิตเทอมตามระบบของมหาวิทยาลัยครับ!',
    category: 'มหาลัยเอกชน'
  },
  {
    id: 'p_gov1',
    title: 'โปรโมชั่น องค์กรรัฐ / ราชการ',
    content: '🏛️ สิทธิพิเศษสำหรับหน่วยงานราชการและรัฐวิสาหกิจ 🏛️\n\n✅ บริการวัดพื้นที่และประเมินราคาฟรี ไม่มีค่าใช้จ่ายแอบแฝง\n✅ ยินดีให้คำปรึกษาและช่วยจัดทำเอกสารเปรียบเทียบราคาสำหรับกระบวนการจัดซื้อจัดจ้าง (e-GP)\n✅ รับประกันสินค้าและการติดตั้งนาน 2 ปีเต็ม (สามารถระบุใน TOR ได้)\n\nหมดกังวลเรื่องเอกสารและการเบิกจ่าย เพราะเราคือมืออาชีพที่เข้าใจระบบงานราชการครับ!',
    category: 'สถานที่ราชการ'
  },
  {
    id: 'p_interior1',
    title: 'โปรโมชั่น สำหรับ Partner',
    content: '🤝 สิทธิพิเศษสำหรับบริษัทออกแบบภายใน / รับเหมาตกแต่ง 🤝\n\n✅ รับส่วนลดพิเศษ B2B Partner หรือค่าคอมมิชชั่นตามตกลง\n✅ ฟรี! แคตตาล็อกผ้าและวอลเปเปอร์คอลเลคชันใหม่ล่าสุด ส่งตรงถึงออฟฟิศ\n✅ บริการ Co-design ช่วยคำนวณและแนะนำวัสดุที่เข้ากับงบประมาณของเจ้าของบ้าน\n\nมาร่วมเป็นพาร์ทเนอร์กับ TMK Curtains รับรองว่าทำงานง่าย จบงานสวย ลูกค้าประทับใจแน่นอนครับ!',
    category: 'บริษัทออกแบบภายใน'
  }
];

export default function ScriptsPage() {
  const [activeTab, setActiveTab] = useState<'scripts' | 'promotions'>('scripts');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [orgCategories, setOrgCategories] = useState<OrgCategoryData[]>([]);
  
  const [localScripts, setLocalScripts] = useState<ScriptItem[]>(SCRIPTS_DATA);
  const [localPromos, setLocalPromos] = useState<ScriptItem[]>(PROMOTIONS_DATA);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', content: '' });
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ title: '', content: '', category: 'general' });

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
    
    const savedScripts = localStorage.getItem('tmk_scripts_data');
    if (savedScripts) {
      try { setLocalScripts(JSON.parse(savedScripts)); } catch(e) {}
    }
    const savedPromos = localStorage.getItem('tmk_promotions_data');
    if (savedPromos) {
      try { setLocalPromos(JSON.parse(savedPromos)); } catch(e) {}
    }
  }, [supabase]);

  const data = activeTab === 'scripts' ? localScripts : localPromos;
  
  const filteredData = data.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) || 
                          item.content.toLowerCase().includes(search.toLowerCase());
                          
    const activeCatObj = orgCategories.find(c => c.value === activeCategory);
    const activeCatLabel = activeCatObj ? activeCatObj.label : '';
    
    const matchesCategory = activeCategory === 'all' || 
                            item.category === activeCategory || 
                            item.category === activeCatLabel;
                            
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

  const handleSave = (id: string) => {
    if (activeTab === 'scripts') {
      const updated = localScripts.map(s => s.id === id ? { ...s, title: editForm.title, content: editForm.content } : s);
      setLocalScripts(updated);
      localStorage.setItem('tmk_scripts_data', JSON.stringify(updated));
    } else {
      const updated = localPromos.map(p => p.id === id ? { ...p, title: editForm.title, content: editForm.content } : p);
      setLocalPromos(updated);
      localStorage.setItem('tmk_promotions_data', JSON.stringify(updated));
    }
    setEditingId(null);
  };

  const saveNewItem = () => {
    if (!createForm.title || !createForm.content) {
      alert('กรุณากรอกหัวข้อและเนื้อหา');
      return;
    }
    const newItem = {
      id: `custom_${Date.now()}`,
      title: createForm.title,
      content: createForm.content,
      category: createForm.category
    };
    
    if (activeTab === 'scripts') {
      const updated = [newItem, ...localScripts];
      setLocalScripts(updated);
      localStorage.setItem('tmk_scripts_data', JSON.stringify(updated));
    } else {
      const updated = [newItem, ...localPromos];
      setLocalPromos(updated);
      localStorage.setItem('tmk_promotions_data', JSON.stringify(updated));
    }
    
    setIsCreating(false);
    setCreateForm({ title: '', content: '', category: 'general' });
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
        <div className="flex overflow-x-auto gap-2 pb-2 md:pb-0 hide-scrollbar flex-1 min-w-0 items-center">
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
        <button
          onClick={() => { setIsCreating(true); setCreateForm({ title: '', content: '', category: activeCategory === 'all' ? 'general' : activeCategory }); }}
          className="shrink-0 flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-blue-700 hover:shadow-lg transition-all"
        >
          <Plus size={18} strokeWidth={3} />
          สร้างใหม่
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isCreating && (
          <div className="glass-card p-5 flex flex-col h-full bg-white border-2 border-blue-400 shadow-lg rounded-2xl ring-4 ring-blue-50">
            <div className="flex items-start justify-between mb-4 gap-2">
              <div className="flex-1 min-w-0 pr-2">
                <select 
                  className="input-field mb-2 text-sm py-1.5 px-3 w-auto inline-block border-blue-200 bg-blue-50 text-blue-700 font-medium rounded-lg" 
                  value={createForm.category} 
                  onChange={e => setCreateForm({...createForm, category: e.target.value})}
                >
                  <option value="general">ทั่วไป</option>
                  <option value="ทักทายลูกค้า">ทักทายลูกค้า</option>
                  <option value="ขอข้อมูล">ขอข้อมูล</option>
                  <option value="นัดหมาย">นัดหมาย</option>
                  <option value="ติดตามลูกค้า">ติดตามลูกค้า</option>
                  <optgroup label="หมวดหมู่อุตสาหกรรม">
                    {orgCategories.map(cat => <option key={cat.id} value={cat.value}>{cat.label}</option>)}
                  </optgroup>
                </select>
                <input 
                  className="input-field font-bold text-lg p-2 w-full border-blue-200 focus:border-blue-500 rounded-lg" 
                  value={createForm.title} 
                  onChange={e => setCreateForm({...createForm, title: e.target.value})} 
                  placeholder={`หัวข้อ${activeTab === 'scripts' ? 'สคริปต์' : 'โปรโมชั่น'}...`} 
                  autoFocus 
                />
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => setIsCreating(false)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors bg-gray-50 border border-gray-200" title="ยกเลิก"><X size={16}/></button>
                <button onClick={saveNewItem} className="p-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm" title="บันทึก"><Save size={16}/></button>
              </div>
            </div>
            
            <textarea 
              className="input-field flex-1 text-[15px] p-3 w-full resize-y min-h-[150px] border-blue-200 focus:border-blue-500 leading-relaxed rounded-lg" 
              value={createForm.content} 
              onChange={e => setCreateForm({...createForm, content: e.target.value})} 
              placeholder={`พิมพ์เนื้อหาข้อความ${activeTab === 'scripts' ? 'สคริปต์' : 'โปรโมชั่น'}ที่ต้องการ...`} 
            />
          </div>
        )}
        {filteredData.length === 0 && !isCreating ? (
          <div className="col-span-full py-16 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl bg-white/50">
            <MessageSquare size={32} className="mx-auto mb-3 opacity-20" />
            <p className="font-medium text-lg">ไม่พบข้อมูลที่ค้นหา</p>
            <p className="text-sm mt-1">ลองเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่ใหม่</p>
          </div>
        ) : (
          filteredData.map(item => (
            <div key={item.id} className="glass-card p-5 flex flex-col h-full bg-white hover:shadow-lg hover:border-blue-300 transition-all duration-300 group">
              <div className="flex items-start justify-between mb-4 gap-2">
                <div className="flex-1 min-w-0 pr-2">
                  {item.category && item.category !== 'general' && item.category !== 'ทักทายลูกค้า' && item.category !== 'ขอข้อมูล' && item.category !== 'ติดตามลูกค้า' && item.category !== 'นัดหมาย' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-bold mb-2 border border-gray-200">
                      <Building2 size={12} />
                      {getCategoryLabel(item.category)}
                    </span>
                  )}
                  {editingId === item.id ? (
                    <input className="input-field font-bold text-lg p-2 w-full" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} placeholder="หัวข้อ..." />
                  ) : (
                    <h3 className="font-bold text-gray-900 text-lg leading-tight group-hover:text-blue-700 transition-colors">
                      {item.title}
                    </h3>
                  )}
                </div>
                {editingId === item.id ? (
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => setEditingId(null)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors bg-gray-50 border border-gray-200" title="ยกเลิก"><X size={16}/></button>
                    <button onClick={() => handleSave(item.id)} className="p-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm" title="บันทึก"><Save size={16}/></button>
                  </div>
                ) : (
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => {setEditingId(item.id); setEditForm({title: item.title, content: item.content});}} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100" title="แก้ไข"><Edit2 size={16}/></button>
                    <button
                      onClick={() => handleCopy(item.id, item.content)}
                      className={`p-2 rounded-xl transition-all shadow-sm ${
                        copiedId === item.id 
                          ? 'bg-green-500 text-white' 
                          : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-100 hover:border-blue-600'
                      }`}
                      title="คัดลอกข้อความ"
                    >
                      {copiedId === item.id ? <Check size={16} strokeWidth={3} /> : <Copy size={16} />}
                    </button>
                  </div>
                )}
              </div>
              
              {editingId === item.id ? (
                <textarea className="input-field flex-1 text-[15px] p-3 w-full resize-y min-h-[150px]" value={editForm.content} onChange={e => setEditForm({...editForm, content: e.target.value})} placeholder="เนื้อหา..." />
              ) : (
                <div className="flex-1 bg-[#F9FAFB] rounded-xl p-4 border border-gray-100 text-[15px] text-gray-700 whitespace-pre-wrap font-medium leading-relaxed group-hover:bg-white transition-colors shadow-inner">
                  {item.content}
                </div>
              )}
              
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
