'use client';

import { useEffect, useMemo, useState } from 'react';
import Header from '@/components/layout/Header';
import { api } from '@/lib/api';
import {
  HiOutlineCheck,
  HiOutlineCloudArrowUp,
  HiOutlineBuildingOffice2,
  HiOutlinePhone,
  HiOutlineFolderOpen,
} from 'react-icons/hi2';
import { writeCurrentOperator } from '@/lib/current-operator';
import { emitCurrentOperatorChange } from '@/modules/auth/hooks/useCurrentOperator';

interface ReceiptSettings {
  payee_name?: string;
  school_name?: string;
  school_logo_url?: string;
  school_address?: string;
  school_phone?: string;
  school_subtitle?: string;
  receipt_output_dir?: string | null;
  receipt_email_enabled?: boolean;
  receipt_email_to?: string | null;
}

interface ApiEnvelope<T> {
  success?: boolean;
  data?: T;
}

const defaultReceiptFolder = 'Documents\\E-System School\\Receipts';

export default function ReceiptSettingsPage() {
  const [payeeName, setPayeeName] = useState('ฝ่ายการเงิน');
  const [schoolName, setSchoolName] = useState('โรงเรียนสหวิทยานุสรณ์');
  const [schoolLogoUrl, setSchoolLogoUrl] = useState('');
  const [schoolLogoFailed, setSchoolLogoFailed] = useState(false);
  const [schoolAddress, setSchoolAddress] = useState('เลขที่ 2 ถนนราชธานี ตำบลในเมือง อำเภอเมือง จังหวัดอุบลราชธานี 34000');
  const [schoolPhone, setSchoolPhone] = useState('045-352-099');
  const [schoolSubtitle, setSchoolSubtitle] = useState('ใบเสร็จรับเงิน - ฝ่ายการเงิน');
  const [receiptOutputDir, setReceiptOutputDir] = useState('');
  const [receiptEmailEnabled, setReceiptEmailEnabled] = useState(false);
  const [receiptEmailTo, setReceiptEmailTo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const logoPreview = useMemo(() => schoolLogoUrl.trim(), [schoolLogoUrl]);

  useEffect(() => {
    void fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<ApiEnvelope<ReceiptSettings>>('/finance/receipt-settings');
      if (res?.data) {
        const settings = res.data;
        const nextPayeeName = settings.payee_name || 'ฝ่ายการเงิน';
        setPayeeName(nextPayeeName);
        setSchoolName(settings.school_name || 'โรงเรียนสหวิทยานุสรณ์');
        setSchoolLogoUrl(settings.school_logo_url || '');
        setSchoolLogoFailed(false);
        setSchoolAddress(settings.school_address || 'เลขที่ 2 ถนนราชธานี ตำบลในเมือง อำเภอเมือง จังหวัดอุบลราชธานี 34000');
        setSchoolPhone(settings.school_phone || '045-352-099');
        setSchoolSubtitle(settings.school_subtitle || 'ใบเสร็จรับเงิน - ฝ่ายการเงิน');
        setReceiptOutputDir(settings.receipt_output_dir || '');
        setReceiptEmailEnabled(Boolean(settings.receipt_email_enabled));
        setReceiptEmailTo(settings.receipt_email_to || '');

        if (typeof window !== 'undefined') {
          writeCurrentOperator(window.localStorage, {
            name: nextPayeeName,
            role: 'ผู้ดูแลระบบ',
          });
          emitCurrentOperatorChange();
        }
      }
    } catch (error) {
      console.error('Failed to load receipt settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    try {
      setIsUploadingLogo(true);
      const res = await api.upload<ApiEnvelope<{ url?: string } & Record<string, unknown>>>(
        '/finance/receipt-settings/logo',
        file
      );
      const uploadedUrl = res?.data?.url || '';
      if (uploadedUrl) {
        setSchoolLogoFailed(false);
        setSchoolLogoUrl(uploadedUrl);
      } else {
        await fetchSettings();
      }
    } catch (error) {
      console.error('Failed to upload logo:', error);
      alert('อัปโหลดโลโก้ไม่สำเร็จ');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    if (!payeeName.trim() || !schoolName.trim()) return;

    try {
      setIsSaving(true);
      setSaveSuccess(false);
      await api.put('/finance/receipt-settings', {
        payee_name: payeeName,
        school_name: schoolName,
        school_logo_url: schoolLogoUrl,
        school_address: schoolAddress,
        school_phone: schoolPhone,
        school_subtitle: schoolSubtitle,
        receipt_output_dir: receiptOutputDir.trim() || null,
        receipt_email_enabled: receiptEmailEnabled,
        receipt_email_to: receiptEmailTo.trim() || null,
      });

      if (typeof window !== 'undefined') {
        writeCurrentOperator(window.localStorage, {
          name: payeeName,
          role: 'ผู้ดูแลระบบ',
        });
        emitCurrentOperatorChange();
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save receipt settings:', error);
      alert('บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <Header
        title="ข้อมูลใบเสร็จ"
        subtitle="แก้ไขชื่อโรงเรียน โลโก้ ที่อยู่ และการบันทึกไฟล์ใบเสร็จ"
      />

      <div className="glass-card p-6 max-w-4xl">
        <div className="grid gap-6">
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-10 bg-gray-200 rounded w-full" />
              <div className="h-10 bg-gray-200 rounded w-full" />
            </div>
          ) : (
            <>
              <section className="space-y-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <HiOutlineBuildingOffice2 className="text-primary-600" size={22} />
                  ข้อมูลโรงเรียนบนใบเสร็จ
                </h3>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">ชื่อโรงเรียน</label>
                    <input className="input-field w-full" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">ชื่อผู้รับเงิน</label>
                    <input className="input-field w-full" value={payeeName} onChange={(e) => setPayeeName(e.target.value)} />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">โลโก้โรงเรียน</label>
                    <div className="flex flex-col md:flex-row gap-4 md:items-center">
                      <div className="flex items-center gap-3">
                        <label className="btn-secondary cursor-pointer flex items-center gap-2 px-4 py-3">
                          <HiOutlineCloudArrowUp size={18} />
                          {isUploadingLogo ? 'กำลังอัปโหลด...' : 'เลือกไฟล์โลโก้'}
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/svg+xml"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                void handleLogoUpload(file);
                              }
                              e.currentTarget.value = '';
                            }}
                          />
                        </label>
                        <span className="text-xs text-gray-400">ระบบจะเก็บไฟล์ไว้ในโฟลเดอร์ข้อมูลของโปรแกรม</span>
                      </div>

                      <div className="flex items-center gap-3">
                        {logoPreview && !schoolLogoFailed ? (
                          <img
                            src={logoPreview}
                            alt="ตราโรงเรียน"
                            className="w-16 h-16 rounded-xl object-contain border border-gray-200 bg-white"
                            onError={() => setSchoolLogoFailed(true)}
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl border border-dashed border-gray-200 flex items-center justify-center text-gray-300">
                            <HiOutlineBuildingOffice2 size={22} />
                          </div>
                        )}
                        <div className="text-sm text-gray-500">
                          {schoolLogoFailed
                            ? 'ไม่พบไฟล์โลโก้ กรุณาเลือกไฟล์ตราโรงเรียนเพื่ออัปโหลดใหม่'
                            : logoPreview
                              ? 'อัปโหลดโลโก้เรียบร้อย'
                              : 'ยังไม่ได้อัปโหลดโลโก้'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">ที่อยู่</label>
                    <textarea className="input-field w-full min-h-[96px]" value={schoolAddress} onChange={(e) => setSchoolAddress(e.target.value)} />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <HiOutlinePhone size={14} /> เบอร์ติดต่อ
                    </label>
                    <input className="input-field w-full" value={schoolPhone} onChange={(e) => setSchoolPhone(e.target.value)} />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">ข้อความบรรทัดรอง</label>
                    <input className="input-field w-full" value={schoolSubtitle} onChange={(e) => setSchoolSubtitle(e.target.value)} />
                  </div>
                </div>
              </section>

              <section className="space-y-4 pt-2 border-t border-gray-100">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <HiOutlineFolderOpen className="text-primary-600" size={22} />
                  ที่เก็บไฟล์ใบเสร็จ
                </h3>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      โฟลเดอร์บันทึกใบเสร็จ
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        className="input-field w-full"
                        value={receiptOutputDir}
                        onChange={(e) => setReceiptOutputDir(e.target.value)}
                        placeholder={defaultReceiptFolder}
                      />
                      <button
                        type="button"
                        className="btn-secondary whitespace-nowrap"
                        onClick={async () => {
                          const selected = await window.electron?.selectReceiptDirectory?.();
                          if (selected) setReceiptOutputDir(selected);
                        }}
                      >
                        เลือกโฟลเดอร์
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      ถ้าเว้นว่าง ระบบจะเก็บไว้ที่ Documents เป็นค่าเริ่มต้น
                    </p>
                  </div>
                </div>
              </section>

              <section className="space-y-4 pt-2 border-t border-gray-100">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <HiOutlineCloudArrowUp className="text-primary-600" size={22} />
                  ส่งใบเสร็จผ่าน Google Apps Script
                </h3>

                <p className="text-sm text-gray-500">
                  ใส่ข้อมูลตามที่โรงเรียนของคุณใช้ ระบบจะส่งไฟล์ PDF ไปที่ GAS แล้วให้ GAS เป็นคนส่งอีเมลต่อ
                </p>

                <div className="grid md:grid-cols-2 gap-4">
                  <label className="flex items-center gap-3 md:col-span-2">
                    <input
                      type="checkbox"
                      checked={receiptEmailEnabled}
                      onChange={(e) => setReceiptEmailEnabled(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-gray-700">เปิดใช้งานการส่งใบเสร็จอัตโนมัติ</span>
                  </label>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">อีเมลผู้รับ</label>
                    <input className="input-field w-full" value={receiptEmailTo} onChange={(e) => setReceiptEmailTo(e.target.value)} placeholder="finance@school.ac.th" />
                  </div>
                </div>
              </section>

              <div className="pt-4 flex items-center gap-4 flex-wrap">
                <button
                  onClick={handleSave}
                  disabled={isSaving || !payeeName.trim() || !schoolName.trim()}
                  className="btn-primary flex items-center gap-2 px-8 py-3"
                >
                  {isSaving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่าทั้งหมด'}
                </button>
                {saveSuccess && (
                  <span className="text-green-600 font-medium text-sm flex items-center gap-1 animate-fade-in">
                    <HiOutlineCheck size={16} />
                    บันทึกเรียบร้อย
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
