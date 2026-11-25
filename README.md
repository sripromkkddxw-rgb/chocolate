# Bean Bar — Landing page ช็อกโกแลตแท่ง

โครงสร้าง
```
choco-landing/
├── index.html        # หน้าเว็บ + ฟอร์มสั่งซื้อ (ไฟล์เดียว)
├── apps-script.gs    # โค้ดฝั่ง Google Sheet (ไม่ต้อง deploy ขึ้น Vercel)
└── images/           # โฟลเดอร์รูปแยกต่างหาก (เปลี่ยนเป็นรูปจริง .jpg/.webp ได้)
```

## 1) Google Sheet
1. สร้าง Google Sheet ใหม่ → Extensions → Apps Script → วางโค้ดจาก `apps-script.gs` → Save
2. Deploy → New deployment → Web app → Execute as **Me**, Who has access **Anyone** → Deploy
3. คัดลอก Web app URL ไปใส่ที่ `API_URL` ใน `index.html`
4. ถ้าแก้โค้ด ต้อง Deploy → Manage deployments → New version ทุกครั้ง

## 2) GitHub
```
git init && git add . && git commit -m "init"
git branch -M main
git remote add origin https://github.com/<user>/<repo>.git
git push -u origin main
```
เปลี่ยนรูป: เอาไฟล์ใหม่ใส่ `images/` แล้วแก้ path ใน `PRODUCTS` (index.html)

## 3) Vercel
Vercel → Add New Project → Import repo จาก GitHub → Framework: **Other** → Deploy
(ไม่ต้อง build) ได้โดเมน `https://<ชื่อ>.vercel.app` ทุกครั้งที่ push จะอัปเดตอัตโนมัติ

## 4) หยิบสินค้า → แพ็ค → ส่ง
1. เปิด Sheet → เมนู **Chocolate → สร้างใบหยิบสินค้า**: ชีต `PickList` รวมจำนวนแต่ละ SKU ที่ต้องหยิบ และแยกรายออเดอร์
2. หยิบตามรวม แล้วแยกแพ็คตามออเดอร์ (ตรวจกับแถวใน PickList)
3. เมนู **Chocolate → สร้างใบปะหน้าพัสดุ**: ชีต `Labels` ได้ผู้ส่ง/ผู้รับ/ที่อยู่/รายการต่อ 1 ใบ → File → Print
4. ส่งแล้วเปลี่ยนคอลัมน์ "สถานะ" เป็น `ส่งแล้ว` (ออเดอร์นั้นจะไม่โผล่ในรอบถัดไป)

## ข้อควรรู้
- ราคาคำนวณซ้ำฝั่ง Apps Script ด้วย กันการแก้ราคาในเบราว์เซอร์
- เพิ่ม SKU: เพิ่มใน `PRODUCTS` (index.html) และ `SKUS` (apps-script.gs) ด้วยรหัสเดียวกัน แล้วเพิ่มคอลัมน์ในชีต Orders ให้ครบก่อนใช้งาน
