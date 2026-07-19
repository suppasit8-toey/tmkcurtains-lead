'use client';

import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { createClient } from '@/lib/supabase/client';
import { STATUS_LABELS, type Organization, type OrgCategoryData, type OrgStatus, type Department } from '@/lib/types';
import { Download, Upload, FileSpreadsheet, X, AlertCircle } from 'lucide-react';

interface ExcelActionsProps {
  orgs: Organization[];
  categories: OrgCategoryData[];
  onImportSuccess: () => void;
}

export default function ExcelActions({ orgs, categories, onImportSuccess }: ExcelActionsProps) {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // Helper: Reverse map for STATUS
  const getStatusValue = (label: string): OrgStatus => {
    const entry = Object.entries(STATUS_LABELS).find(([_, v]) => v === label);
    return (entry ? entry[0] : 'new_lead') as OrgStatus;
  };

  // Helper: Reverse map for CATEGORY
  const getCategoryValue = (label: string): string => {
    const cat = categories.find(c => c.label === label);
    return cat ? cat.value : (categories[0]?.value || '');
  };

  const handleExport = () => {
    const exportData = orgs.map(org => {
      const catLabel = categories.find(c => c.value === org.category)?.label || org.category;
      const statusLabel = STATUS_LABELS[org.status];

      return {
        'ชื่อองค์กร*': org.name || '',
        'หมวดหมู่*': catLabel || '',
        'สถานะ*': statusLabel || '',
        'อายุอาคาร(ปี)': org.building_age || '',
        'ลิงก์แผนที่': org.map_url || '',
        'จังหวัด': org.province || '',
        'ระยะทาง(กม.)': org.distance_km || '',
        'ข้อมูลเพิ่มเติม': org.org_info || '',
        'เทคนิคการนำเสนอ': org.pitch_technique || '',
        'เบอร์โทรหลัก': org.phone_main || '',
        'อีเมลหลัก': org.email_main || '',
        
        'ผู้ติดต่อ_อาคาร': org.building_dept?.name || '',
        'เบอร์_อาคาร': org.building_dept?.phone || '',
        'อีเมล_อาคาร': org.building_dept?.email || '',
        'Line_อาคาร': org.building_dept?.line_id || '',

        'ผู้ติดต่อ_จัดซื้อ': org.purchase_dept?.name || '',
        'เบอร์_จัดซื้อ': org.purchase_dept?.phone || '',
        'อีเมล_จัดซื้อ': org.purchase_dept?.email || '',
        'Line_จัดซื้อ': org.purchase_dept?.line_id || '',

        'ผู้ติดต่อ_บัญชี': org.accounting_dept?.name || '',
        'เบอร์_บัญชี': org.accounting_dept?.phone || '',
        'อีเมล_บัญชี': org.accounting_dept?.email || '',
        'Line_บัญชี': org.accounting_dept?.line_id || '',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Organizations');
    
    // Download
    XLSX.writeFile(workbook, `Organizations_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleDownloadTemplate = () => {
    const templateData = [{
      'ชื่อองค์กร*': 'บริษัท ตัวอย่าง จำกัด',
      'หมวดหมู่*': categories[0]?.label || 'โรงพยาบาล',
      'สถานะ*': STATUS_LABELS['new_lead'],
      'อายุอาคาร(ปี)': 5,
      'ลิงก์แผนที่': '',
      'จังหวัด': 'กรุงเทพมหานคร',
      'ระยะทาง(กม.)': '',
      'ข้อมูลเพิ่มเติม': 'รายละเอียดคร่าวๆ',
      'เทคนิคการนำเสนอ': 'เน้นประหยัดพลังงาน',
      'เบอร์โทรหลัก': '02-123-4567',
      'อีเมลหลัก': 'info@example.com',
      
      'ผู้ติดต่อ_อาคาร': 'คุณสมชาย',
      'เบอร์_อาคาร': '081-000-0000',
      'อีเมล_อาคาร': '',
      'Line_อาคาร': '',

      'ผู้ติดต่อ_จัดซื้อ': '',
      'เบอร์_จัดซื้อ': '',
      'อีเมล_จัดซื้อ': '',
      'Line_จัดซื้อ': '',

      'ผู้ติดต่อ_บัญชี': '',
      'เบอร์_บัญชี': '',
      'อีเมล_บัญชี': '',
      'Line_บัญชี': '',
    }];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    XLSX.writeFile(workbook, `Template_Organizations.xlsx`);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportError('');
    setImportSuccess('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('ไม่พบข้อมูลผู้ใช้');

      // Check existing names to prevent duplicates
      const { data: existingOrgs } = await supabase.from('organizations').select('name');
      const existingNames = new Set((existingOrgs || []).map(o => o.name.trim().toLowerCase()));

      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);

      let importedCount = 0;
      let skippedCount = 0;
      const toInsert = [];

      for (const row of jsonData) {
        const name = row['ชื่อองค์กร*'];
        if (!name) continue;

        if (existingNames.has(name.trim().toLowerCase())) {
          skippedCount++;
          continue;
        }

        const building_dept: Department = {
          name: row['ผู้ติดต่อ_อาคาร']?.toString() || '',
          phone: row['เบอร์_อาคาร']?.toString() || '',
          email: row['อีเมล_อาคาร']?.toString() || '',
          line_id: row['Line_อาคาร']?.toString() || '',
        };

        const purchase_dept: Department = {
          name: row['ผู้ติดต่อ_จัดซื้อ']?.toString() || '',
          phone: row['เบอร์_จัดซื้อ']?.toString() || '',
          email: row['อีเมล_จัดซื้อ']?.toString() || '',
          line_id: row['Line_จัดซื้อ']?.toString() || '',
        };

        const accounting_dept: Department = {
          name: row['ผู้ติดต่อ_บัญชี']?.toString() || '',
          phone: row['เบอร์_บัญชี']?.toString() || '',
          email: row['อีเมล_บัญชี']?.toString() || '',
          line_id: row['Line_บัญชี']?.toString() || '',
        };

        toInsert.push({
          user_id: user.id,
          name: name.toString().trim(),
          category: getCategoryValue(row['หมวดหมู่*']),
          status: getStatusValue(row['สถานะ*']),
          building_age: parseInt(row['อายุอาคาร(ปี)']) || null,
          map_url: row['ลิงก์แผนที่']?.toString() || '',
          province: row['จังหวัด']?.toString() || '',
          distance_km: parseFloat(row['ระยะทาง(กม.)']) || null,
          org_info: row['ข้อมูลเพิ่มเติม']?.toString() || '',
          pitch_technique: row['เทคนิคการนำเสนอ']?.toString() || '',
          phone_main: row['เบอร์โทรหลัก']?.toString() || '',
          email_main: row['อีเมลหลัก']?.toString() || '',
          building_dept,
          purchase_dept,
          accounting_dept
        });
      }

      if (toInsert.length > 0) {
        const { error } = await supabase.from('organizations').insert(toInsert);
        if (error) throw error;
        importedCount = toInsert.length;
      }

      setImportSuccess(`สำเร็จ! นำเข้าข้อมูล ${importedCount} รายการ (ข้ามข้อมูลซ้ำ ${skippedCount} รายการ)`);
      if (importedCount > 0) {
        onImportSuccess();
      }
    } catch (err: any) {
      setImportError(err.message || 'เกิดข้อผิดพลาดในการอ่านไฟล์ Excel');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <button onClick={handleExport} className="btn-secondary shadow-sm text-sm" title="ส่งออกเป็น Excel">
          <Download size={16} />
          <span className="hidden sm:inline">นำออก</span>
        </button>
        <button onClick={() => setIsImportModalOpen(true)} className="btn-secondary shadow-sm text-sm" title="นำเข้าจาก Excel">
          <Upload size={16} />
          <span className="hidden sm:inline">นำเข้า</span>
        </button>
      </div>

      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-3 text-blue-600">
                <FileSpreadsheet size={24} />
                <h3 className="text-lg font-bold text-gray-900">นำเข้าข้อมูลด้วย Excel</h3>
              </div>
              <button onClick={() => setIsImportModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                คุณสามารถเพิ่มองค์กรหลายรายการพร้อมกันได้ โดยอัปโหลดไฟล์ Excel (.xlsx) ที่มีคอลัมน์ตรงตามรูปแบบของระบบ
              </p>

              <button 
                onClick={handleDownloadTemplate}
                className="w-full mb-6 py-2.5 px-4 rounded-lg border border-dashed border-blue-300 text-blue-600 font-medium text-sm hover:bg-blue-50 transition-colors"
              >
                📥 ดาวน์โหลดไฟล์เทมเพลตตัวอย่าง
              </button>

              <div className="space-y-4">
                <label className="label">อัปโหลดไฟล์ที่กรอกข้อมูลแล้ว</label>
                <input 
                  type="file" 
                  accept=".xlsx, .xls"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  disabled={importing}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100 transition-colors
                    cursor-pointer"
                />
              </div>

              {importing && (
                <div className="mt-4 p-3 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium text-center animate-pulse">
                  กำลังนำเข้าข้อมูล...
                </div>
              )}

              {importError && (
                <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium flex items-start gap-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{importError}</span>
                </div>
              )}

              {importSuccess && (
                <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
                  {importSuccess}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button 
                onClick={() => setIsImportModalOpen(false)} 
                className="btn-secondary"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
