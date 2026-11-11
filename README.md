# Tissue Salts Finder (12 Cell Salts)

เว็บแอปพลิเคชันสำหรับค้นหาและจำแนกแร่ธาตุประจำเซลล์ (**12 Cell Salts / Tissue Salts**) ตามอาการ โรค จุดสังเกตบนใบหน้า/ลิ้น/เสมหะ พร้อมตัวคำนวณขนาดยาสำหรับทุกช่วงวัยและสัตว์เลี้ยง

อ้างอิงเนื้อหาจาก [The Mineral Body](https://themineralbody.com/) และคู่มือ *An Abridged Therapy: Manual for the Biochemical Treatment of Disease* (25th Edition) โดย Dr. Wilhelm Heinrich Schüssler

> **ข้อควรระวังทางการแพทย์:** เว็บแอปพลิเคชันนี้จัดทำขึ้นเพื่อการศึกษาและดูแลสุขภาพเบื้องต้นเท่านั้น ไม่ใช่การวินิจฉัยโรคหรือใช้ทดแทนคำแนะนำและการรักษาจากแพทย์ผู้เชี่ยวชาญ

## 1. วิธีรันทดสอบบนเครื่อง (Local Development)

ต้องติดตั้ง [Node.js](https://nodejs.org/) (แนะนำเวอร์ชัน 18 ขึ้นไป) จากนั้นเปิด Terminal เข้ามาในโฟลเดอร์โปรเจกต์แล้วรันคำสั่ง:

```bash
npm install
npm run dev
```

เปิดเบราว์เซอร์ไปที่ `http://localhost:5173` เพื่อใช้งานได้ทันที

## 2. วิธีนำโค้ดขึ้น GitHub

1. สร้าง Repository ใหม่บน [GitHub](https://github.com/new) (เช่นชื่อ `tissue-salts-finder`) โดยไม่ต้องติ๊กสร้าง README
2. รันคำสั่งในโฟลเดอร์ `tissue-salts-webapp`:

```bash
git init
git add .
git commit -m "Initial commit: Tissue Salts Finder Web App"
git branch -M main
git remote add origin https://github.com/<USERNAME>/tissue-salts-finder.git
git push -u origin main
```

## 3. วิธีเปิดใช้งานเว็บฟรีบน GitHub Pages

โปรเจกต์นี้มีไฟล์ `.github/workflows/deploy.yml` เตรียมไว้ให้แล้ว:

1. ไปที่หน้า Repository บน GitHub > **Settings** > **Pages**
2. ตรงหัวข้อ **Build and deployment** > **Source** ให้เลือกเป็น **GitHub Actions**
3. ทุกครั้งที่ `git push` ขึ้น Branch `main` ระบบจะ Build และเปิดเว็บให้อัตโนมัติที่ `https://<USERNAME>.github.io/tissue-salts-finder/`

*(หรือสามารถนำเข้า Repository นี้บน [Vercel](https://vercel.com/) หรือ [Netlify](https://netlify.com/) เพื่อ Deploy ได้ภายใน 1 คลิกเช่นกัน)*
