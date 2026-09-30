'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { HiOutlineArrowUpTray, HiOutlineDocumentArrowDown, HiOutlineCheckCircle, HiOutlineExclamationCircle } from 'react-icons/hi2';
import { useStudents } from '../hooks/useStudents';
import { ImportResult } from '../types/student';

interface ImportStudentsProps {
  onComplete: () => void;
  onCancel: () => void;
}

export default function ImportStudents({ onComplete, onCancel }: ImportStudentsProps) {
  const { importExcel } = useStudents();
  
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<ImportResult | null>(null);
  const [finalResult, setFinalResult] = useState<ImportResult | null>(null);

  const handlePreview = useCallback(async (selectedFile: File) => {
    setLoading(true);
    setError(null);
    try {
      const result = await importExcel(selectedFile, true);
      setPreviewData(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to parse Excel file');
      setFile(null);
    } finally {
      setLoading(false);
    }
  }, [importExcel]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError(null);
      handlePreview(acceptedFiles[0]);
    }
  }, [handlePreview]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 1,
  });

  const downloadTemplate = (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent dropzone click
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/students/template`;
  };



  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const result = await importExcel(file, false);
      setFinalResult(result);
      // Wait a bit before closing or just show the summary
      // onComplete(); 
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to import data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      {!previewData && (
        <>
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:bg-gray-50 hover:border-primary-400'}
            `}
          >
            <input {...getInputProps()} />
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
              <HiOutlineArrowUpTray size={32} />
            </div>
            {isDragActive ? (
              <p className="text-primary-600 font-medium">วางไฟล์ Excel ที่นี่...</p>
            ) : (
              <div>
                <p className="text-gray-900 font-medium mb-1">ลากไฟล์ Excel (.xlsx) มาวาง หรือคลิกเพื่อเลือกไฟล์</p>
                <p className="text-sm text-gray-500">รองรับเฉพาะไฟล์ข้อมูลตาม Template เท่านั้น</p>
              </div>
            )}
            
            {loading && <p className="mt-4 text-primary-600 animate-pulse font-medium">กำลังอ่านไฟล์...</p>}
          </div>

          <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-100">
            <div className="flex items-center gap-3 text-amber-800">
              <HiOutlineDocumentArrowDown size={24} />
              <div className="text-sm">
                <p className="font-medium">ต้องการ Template หรือไม่?</p>
                <p className="opacity-80">ดาวน์โหลดโครงสร้างไฟล์ Excel ที่ถูกต้องเพื่อนำเข้าข้อมูล</p>
              </div>
            </div>
            <button onClick={downloadTemplate} className="btn-secondary text-sm px-4 py-2 border-amber-200">
              ดาวน์โหลด Template
            </button>
          </div>
        </>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
          {error}
        </div>
      )}

      {/* Final Result Summary */}
      {finalResult && (
        <div className="space-y-6 animate-fade-in text-center py-8">
          <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
            <HiOutlineCheckCircle size={48} />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">นำเข้าข้อมูลสำเร็จ!</h3>
          
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mt-8">
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
              <p className="text-2xl font-bold text-emerald-600">{finalResult.inserted || 0}</p>
              <p className="text-xs text-emerald-800 font-medium">รายชื่อนักเรียน</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <p className="text-2xl font-bold text-blue-600">{finalResult.enrollmentsCreated || 0}</p>
              <p className="text-xs text-blue-800 font-medium">การลงทะเบียนเรียน</p>
            </div>
            <div className="bg-red-50 p-4 rounded-xl border border-red-100">
              <p className="text-2xl font-bold text-red-600">{finalResult.errorCount || 0}</p>
              <p className="text-xs text-red-800 font-medium">รายการผิดพลาด</p>
            </div>
          </div>

          <div className="pt-8">
            <button onClick={onComplete} className="btn-primary px-12">
              ตกลง
            </button>
          </div>
        </div>
      )}

      {/* Preview Section */}
      {previewData && !finalResult && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">สรุปผลการตรวจสอบไฟล์: {file?.name}</h3>
            <button onClick={() => { setFile(null); setPreviewData(null); }} className="text-sm text-primary-600 hover:underline">
              เลือกไฟล์อื่น
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <HiOutlineCheckCircle size={24} />
              </div>
              <div>
                <p className="text-sm text-emerald-800 font-medium">ข้อมูลที่ผ่าน (พร้อมนำเข้า)</p>
                <p className="text-2xl font-bold text-emerald-600">{previewData.validCount || 0} รายการ</p>
              </div>
            </div>
            <div className={`rounded-xl p-4 border flex items-center gap-4 ${previewData.errorCount ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${previewData.errorCount ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-500'}`}>
                <HiOutlineExclamationCircle size={24} />
              </div>
              <div>
                <p className={`text-sm font-medium ${previewData.errorCount ? 'text-red-800' : 'text-gray-600'}`}>ข้อมูลที่มีข้อผิดพลาด</p>
                <p className={`text-2xl font-bold ${previewData.errorCount ? 'text-red-600' : 'text-gray-600'}`}>{previewData.errorCount || 0} รายการ</p>
              </div>
            </div>
          </div>

          {previewData.errorCount && previewData.errorCount > 0 && (
            <div className="mt-4 border border-red-100 rounded-xl overflow-hidden">
              <div className="bg-red-50 px-4 py-2 border-b border-red-100">
                <p className="text-sm font-medium text-red-800">รายละเอียดข้อผิดพลาด (จะไม่ถูกนำเข้า)</p>
              </div>
              <div className="max-h-60 overflow-y-auto p-4 bg-white text-sm">
                <ul className="space-y-2">
                  {previewData.errors?.map((err, idx) => (
                    <li key={idx} className="flex gap-2 text-red-600">
                      <span className="font-semibold whitespace-nowrap min-w-[60px]">แถว {err.row}:</span>
                      <span>{err.message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
            <button onClick={onCancel} className="btn-secondary" disabled={loading}>
              ยกเลิก
            </button>
            <button 
              onClick={handleImport} 
              className="btn-primary"
              disabled={loading || !previewData.validCount || previewData.validCount === 0}
            >
              {loading ? 'กำลังนำเข้าแบบ Batch...' : `ยืนยันนำเข้า (${previewData.validCount} รายการ)`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
