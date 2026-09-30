const sampleRows = [
  { student_code: '1-1032-00568-71-0', first_name: 'ชินโซติ', last_name: 'แพจนทร์', grade_name: 'อนุบาล 1', room_number: '1', tuitionBalance: 0, specialBalance: 500, otherBalance: 0, totalBalance: 500 },
  { student_code: '1-1032-00568-72-1', first_name: 'ณัฐวุฒิ', last_name: 'แซ่ลี้', grade_name: 'อนุบาล 1', room_number: '2', tuitionBalance: 3000, specialBalance: 0, otherBalance: 250, totalBalance: 3250 },
  { student_code: '1-1032-00568-73-2', first_name: 'กิตติพงศ์', last_name: 'สุขใจ', grade_name: 'ประถมศึกษาปีที่ 1', room_number: '1', tuitionBalance: 1500, specialBalance: 500, otherBalance: 0, totalBalance: 2000 },
];

const summary = {
  totalStudents: 3,
  totalBalance: 5750,
  tuitionBalance: 4500,
  specialBalance: 1000,
  otherBalance: 250,
};

export default function PreviewPage() {
  return (
    <div className="min-h-screen bg-slate-200 p-8">
      <div className="mx-auto w-[210mm] bg-white p-[14mm_12mm] shadow-lg">
        <div className="text-center mb-[8mm]">
          <div className="text-[18pt] font-bold leading-tight">โรงเรียนสหวิทยานุสรณ์</div>
          <div className="mt-2 text-[11pt]">เลขที่ 2 ถนนราชธานี ตำบลในเมือง อำเภอเมือง จังหวัดอุบลราชธานี 34000</div>
          <div className="mt-5 text-[14pt] font-bold">รายงานนักเรียนค้างชำระ</div>
          <div className="mt-2 text-[10.5pt]">ปีการศึกษา 2569 | วันที่ออกรายงาน 14/06/2569</div>
        </div>

        <table className="mb-6 w-full border-collapse text-[10.5pt]">
          <tbody>
            <tr>
              <td className="border border-black px-3 py-2 font-bold w-[20%]">จำนวนนักเรียนค้าง</td>
              <td className="border border-black px-3 py-2 w-[30%]">{summary.totalStudents.toLocaleString()} คน</td>
              <td className="border border-black px-3 py-2 font-bold w-[20%]">ยอดค้างรวม</td>
              <td className="border border-black px-3 py-2 w-[30%]">{summary.totalBalance.toLocaleString()} บาท</td>
            </tr>
            <tr>
              <td className="border border-black px-3 py-2 font-bold">ค่าเทอม</td>
              <td className="border border-black px-3 py-2">{summary.tuitionBalance.toLocaleString()} บาท</td>
              <td className="border border-black px-3 py-2 font-bold">ค่าเรียนพิเศษ</td>
              <td className="border border-black px-3 py-2">{summary.specialBalance.toLocaleString()} บาท</td>
            </tr>
            <tr>
              <td className="border border-black px-3 py-2 font-bold">ค่าอื่นๆ</td>
              <td className="border border-black px-3 py-2">{summary.otherBalance.toLocaleString()} บาท</td>
              <td className="border border-black px-3 py-2" />
              <td className="border border-black px-3 py-2" />
            </tr>
          </tbody>
        </table>

        <table className="w-full border-collapse text-[10pt]">
          <thead>
            <tr>
              {['ลำดับ', 'รหัสนักเรียน', 'ชื่อ-นามสกุล', 'ชั้น/ห้อง', 'ค่าเทอม', 'ค่าเรียนพิเศษ', 'ค่าอื่นๆ', 'รวมค้าง'].map((head) => (
                <th key={head} className="border border-black px-2 py-2 text-center font-bold">
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sampleRows.map((row, index) => (
              <tr key={row.student_code}>
                <td className="border border-black px-2 py-2 text-center">{index + 1}</td>
                <td className="border border-black px-2 py-2">{row.student_code}</td>
                <td className="border border-black px-2 py-2">{row.first_name} {row.last_name}</td>
                <td className="border border-black px-2 py-2">{row.grade_name} / {row.room_number}</td>
                <td className="border border-black px-2 py-2 text-right">{row.tuitionBalance.toLocaleString()}</td>
                <td className="border border-black px-2 py-2 text-right">{row.specialBalance.toLocaleString()}</td>
                <td className="border border-black px-2 py-2 text-right">{row.otherBalance.toLocaleString()}</td>
                <td className="border border-black px-2 py-2 text-right font-bold">{row.totalBalance.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-8 text-[10pt] leading-7">
          <div>หมายเหตุ 1. รายงานฉบับนี้จัดทำเพื่อเสนอผู้บริหาร</div>
          <div>         2. กรุณาตรวจสอบรายการค้างชำระก่อนดำเนินการติดตาม</div>
          <div>         3. รายการค่าใช้จ่ายแยกตามประเภทค่าเทอม ค่าเรียนพิเศษ และค่าอื่นๆ</div>
        </div>

        <table className="mt-12 w-full text-[10pt]">
          <tbody>
            <tr>
              <td className="w-1/3 text-center align-top">
                <div>....................................................</div>
                <div className="mt-2">ผู้จัดทำ</div>
              </td>
              <td className="w-1/3 text-center align-top">
                <div>....................................................</div>
                <div className="mt-2">หัวหน้างานการเงิน</div>
              </td>
              <td className="w-1/3 text-center align-top">
                <div>....................................................</div>
                <div className="mt-2">ผู้อำนวยการ</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
