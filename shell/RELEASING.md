# เผยแพร่เวอร์ชันใหม่

ระบบอัปเดตใช้ GitHub Releases ของ `Bas21950/E-System-School` เป็นแหล่งอัปเดต
และใช้ข้อความใน Release เป็น “รายการที่อัปเดต” ที่ผู้ใช้เห็นก่อนโปรแกรมเริ่มดาวน์โหลด
ทุก Release ต้องระบุเวอร์ชันและรายการเปลี่ยนแปลงที่อ่านเข้าใจได้ ห้ามเผยแพร่ Release
โดยไม่มีบันทึกการเปลี่ยนแปลง เพราะโปรแกรมจะแสดงรายการนี้พร้อมเวอร์ชันก่อนอัปเดต

1. เปลี่ยน `version` ใน `shell/package.json`, `shell/package-lock.json` และ `installer/setup.iss`
   ให้ตรงกันและสูงกว่าเวอร์ชันก่อนหน้า
2. แก้ `shell/release-notes.md` ให้เป็นรายการของเวอร์ชันที่จะเผยแพร่
3. สร้างและตรวจสอบโปรแกรม:

   ```powershell
   cd shell
   npm run pack:win
   ```

4. สร้าง GitHub Release พร้อมบันทึกการเปลี่ยนแปลงและไฟล์ทั้งสาม:

   ```powershell
   $version = (Get-Content package.json | ConvertFrom-Json).version
   gh release create "v$version" `
     "../release/E-System-School-Setup-$version.exe" `
     "../release/E-System-School-Setup-$version.exe.blockmap" `
     "../release/latest.yml" `
     --repo Bas21950/E-System-School `
     --title "E-System School $version" `
     --notes-file release-notes.md
   ```

ต้องอัปโหลดทั้ง installer, blockmap และ `latest.yml` ไปยัง Release เดียวกัน
รุ่นก่อน 1.2.4 ตรวจอัปเดตจากเจ้าของ repo เดิม จึงต้องติดตั้ง 1.2.4 ด้วย installer หนึ่งครั้ง
หลังจากนั้นโปรแกรมจะตรวจอัปเดตจาก repo นี้ได้ตามปกติ

สำหรับการแจกจ่ายจริง ควรกำหนดใบรับรองลงนาม Windows (`WIN_CSC_LINK` และ
`WIN_CSC_KEY_PASSWORD`) ในสภาพแวดล้อมที่ใช้ build ก่อนเผยแพร่
