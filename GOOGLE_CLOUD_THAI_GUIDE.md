# คู่มือการตั้งค่า Google Cloud Storage สำหรับ Weenland Photo Gallery

## สารบัญ
1. [การเตรียมความพร้อม](#การเตรียมความพร้อม)
2. [การสร้าง Google Cloud Project](#การสร้าง-google-cloud-project)
3. [การสร้าง Storage Bucket](#การสร้าง-storage-bucket)
4. [การสร้าง Service Account](#การสร้าง-service-account)
5. [การตั้งค่าระบบท้องถิ่น](#การตั้งค่าระบบท้องถิ่น)
6. [การทดสอบการเชื่อมต่อ](#การทดสอบการเชื่อมต่อ)
7. [การใช้งานระบบ](#การใช้งานระบบ)
8. [การ Deploy ขึ้น Production](#การ-deploy-ขึ้น-production)
9. [การแก้ไขปัญหาที่พบบ่อย](#การแก้ไขปัญหาที่พบบ่อย)

---

## การเตรียมความพร้อม

### ข้อกำหนดเบื้องต้น
- บัญชี Google (Gmail)
- Credit Card สำหรับยืนยันตัวตน (ไม่เสียค่าใช้จ่ายหากใช้ใน Free Tier)
- Node.js เวอร์ชัน 18 หรือสูงกว่า
- โปรเจกต์ Weenland Photo Gallery ที่ติดตั้งแล้ว

### ค่าใช้จ่าย
Google Cloud Storage มี Free Tier ที่ให้ใช้ฟรี:
- พื้นที่เก็บข้อมูล: 5 GB ฟรีต่อเดือน
- การดาวน์โหลด: 1 GB ฟรีต่อเดือน
- การอัปโหลด: 5,000 ครั้งฟรีต่อเดือน

---

## การสร้าง Google Cloud Project

### ขั้นตอนที่ 1: เข้าสู่ Google Cloud Console
1. ไปที่ [Google Cloud Console](https://console.cloud.google.com/)
2. เข้าสู่ระบบด้วยบัญชี Google ของคุณ
3. ยอมรับข้อตกลงการใช้บริการ (ถ้าเป็นครั้งแรก)

### ขั้นตอนที่ 2: สร้างโปรเจกต์ใหม่
1. คลิกที่ดรอปดาวน์โปรเจกต์ด้านบน
2. คลิก "New Project" (สร้างโปรเจกต์ใหม่)
3. ตั้งชื่อโปรเจกต์: `weenland-photo-gallery`
4. เลือก Organization (ถ้ามี) หรือปล่อยว่าง
5. คลิก "Create" (สร้าง)

### ขั้นตอนที่ 3: เปิดใช้งาน Cloud Storage API
1. ไปที่ [APIs & Services > Library](https://console.cloud.google.com/apis/library)
2. ค้นหา "Cloud Storage API"
3. คลิกเลือก "Cloud Storage API"
4. คลิก "Enable" (เปิดใช้งาน)

---

## การสร้าง Storage Bucket

### ขั้นตอนที่ 1: ไปยังหน้า Cloud Storage
1. ไปที่ [Cloud Storage](https://console.cloud.google.com/storage)
2. คลิก "Create Bucket" (สร้าง Bucket)

### ขั้นตอนที่ 2: ตั้งค่า Bucket
1. **ชื่อ Bucket**: `weenland-photos-[random-string]` (ต้องไม่ซ้ำกับใครในโลก)
   - ตัวอย่าง: `weenland-photos-abc123`
2. **Location Type**: เลือก "Region"
3. **Location**: เลือก "asia-southeast1 (Singapore)" สำหรับ SEA
4. **Storage Class**: เลือก "Standard"
5. **Access Control**: เลือก "Uniform (Recommended)"
6. **Protection Tools**: ปล่อยเป็นค่าเริ่มต้น
7. คลิก "Create" (สร้าง)

### ขั้นตอนที่ 3: ตั้งค่าสิทธิ์การเข้าถึง
1. เลือก Bucket ที่สร้างไว้
2. ไปที่แท็บ "Permissions"
3. คลิก "Grant Access" (ให้สิทธิ์การเข้าถึง)
4. เพิ่ม Principal: `allUsers`
5. เลือก Role: "Storage Object Viewer"
6. คลิก "Save" (บันทึก)

> ⚠️ **คำเตือน**: การตั้งค่านี้จะทำให้รูปภาพสามารถเข้าถึงได้สาธารณะ ซึ่งเหมาะสำหรับ Photo Gallery

---

## การสร้าง Service Account

### ขั้นตอนที่ 1: สร้าง Service Account
1. ไปที่ [IAM & Admin > Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts)
2. คลิก "Create Service Account" (สร้าง Service Account)
3. **Service Account Name**: `weenland-storage-service`
4. **Service Account ID**: จะถูกสร้างอัตโนมัติ
5. **Description**: `Service account for Weenland Photo Gallery storage operations`
6. คลิก "Create and Continue" (สร้างและดำเนินการต่อ)

### ขั้นตอนที่ 2: กำหนดสิทธิ์
1. **Role 1**: เลือก "Storage Admin"
2. คลิก "Add Another Role" (เพิ่ม Role อื่น)
3. **Role 2**: เลือก "Storage Object Admin"
4. คลิก "Continue" (ดำเนินการต่อ)
5. ข้าม "Grant users access to this service account"
6. คลิก "Done" (เสร็จสิ้น)

### ขั้นตอนที่ 3: สร้าง JSON Key
1. คลิกที่ Service Account ที่สร้างไว้
2. ไปที่แท็บ "Keys"
3. คลิก "Add Key" > "Create New Key"
4. เลือกประเภท "JSON"
5. คลิก "Create" (สร้าง)
6. ไฟล์ JSON จะถูกดาวน์โหลดอัตโนมัติ

> 🔒 **ความปลอดภัย**: เก็บไฟล์ JSON นี้ไว้อย่างปลอดภัย อย่าแชร์หรืออัปโหลดไปยัง Repository สาธารณะ

---

## การตั้งค่าระบบท้องถิ่น

### ขั้นตอนที่ 1: วางไฟล์ Credentials
1. สร้างโฟลเดอร์ `credentials` ในโปรเจกต์
```bash
mkdir credentials
```

2. ย้ายไฟล์ JSON ที่ดาวน์โหลดมาไว้ในโฟลเดอร์ `credentials`
3. เปลี่ยนชื่อไฟล์เป็น `gcp-service-account.json`

### ขั้นตอนที่ 2: สร้างไฟล์ .env
1. คัดลอกไฟล์ `.env.example` เป็น `.env`
```bash
cp .env.example .env
```

2. แก้ไขไฟล์ `.env` ตามข้อมูลของคุณ:
```env
# Google Cloud Storage Configuration
GOOGLE_CLOUD_PROJECT_ID=weenland-photo-gallery
GOOGLE_CLOUD_BUCKET_NAME=weenland-photos-abc123
GOOGLE_APPLICATION_CREDENTIALS=./credentials/gcp-service-account.json

# Application Configuration
NEXT_PUBLIC_BUCKET_BASE_URL=https://storage.googleapis.com/weenland-photos-abc123
```

### ขั้นตอนที่ 3: ติดตั้ง Dependencies
```bash
npm install @google-cloud/storage sharp
```

### ขั้นตอนที่ 4: เพิ่มไฟล์ในไฟล์ .gitignore
เพิ่มบรรทัดเหล่านี้ในไฟล์ `.gitignore`:
```
# Google Cloud Credentials
credentials/
.env
.env.local
```

---

## การทดสอบการเชื่อมต่อ

### ขั้นตอนที่ 1: รันเซิร์ฟเวอร์
```bash
npm run dev
```

### ขั้นตอนที่ 2: เข้าไปยังหน้า Admin
1. เปิดเบราว์เซอร์ไปที่ `http://localhost:3000`
2. กดปุ่ม "Admin" มุมขวาล่าง
3. คุณจะเห็นหน้า Admin Panel ที่มีปุ่ม "ซิงค์รูปภาพจาก Cloud Storage"

### ขั้นตอนที่ 3: ทดสอบการอัปโหลด
1. คลิกปุ่ม "เลือกรูปภาพ"
2. เลือกรูปภาพที่ต้องการอัปโหลด (รองรับ: JPG, PNG, WebP)
3. เลือกวันที่แสดงรูปภาพ
4. คลิก "อัปโหลดรูปภาพ"
5. รอจนกว่าจะแสดงข้อความ "อัปโหลดสำเร็จ!"

### ขั้นตอนที่ 4: ตรวจสอบใน Google Cloud Console
1. ไปที่ [Cloud Storage](https://console.cloud.google.com/storage)
2. คลิกที่ Bucket ของคุณ
3. คุณจะเห็นโฟลเดอร์ `images/day-X/` ที่มีรูปภาพที่อัปโหลด

---

## การใช้งานระบบ

### การอัปโหลดรูปภาพ
1. **เข้าสู่ Admin Panel**: คลิกปุ่ม "Admin" ที่หน้าแรก
2. **เลือกรูปภาพ**: คลิก "เลือกรูปภาพ" และเลือกไฟล์
3. **เลือกวัน**: เลือกวันที่ต้องการให้รูปภาพแสดง
4. **อัปโหลด**: คลิก "อัปโหลดรูปภาพ"

### การซิงค์รูปภาพ
- คลิกปุ่ม "ซิงค์รูปภาพจาก Cloud Storage" เพื่อดึงรูปภาพใหม่จาก Google Cloud Storage

### การดาวน์โหลดรูปภาพ
1. **เลือกรูปภาพ**: คลิกที่รูปภาพที่ต้องการเพื่อเลือก
2. **ดาวน์โหลด**: คลิกปุ่ม "ดาวน์โหลดรูปที่เลือก" (มุมขวาล่าง)
3. **ไฟล์ ZIP**: ระบบจะสร้างไฟล์ ZIP ให้ดาวน์โหลด

### โครงสร้างการจัดเก็บ
```
bucket-name/
├── images/
│   ├── day-1/
│   │   ├── full/           # รูปภาพขนาดเต็ม
│   │   │   ├── image1.jpg
│   │   │   └── image2.jpg
│   │   └── thumbnails/     # รูปภาพย่อ
│   │       ├── image1.jpg
│   │       └── image2.jpg
│   ├── day-2/
│   └── ...
```

---

## การ Deploy ขึ้น Production

### สำหรับ Vercel

#### ขั้นตอนที่ 1: เตรียม Environment Variables
1. ไปที่ Vercel Dashboard
2. เลือกโปรเจกต์ของคุณ
3. ไปที่ Settings > Environment Variables
4. เพิ่มตัวแปรต่อไปนี้:

```
GOOGLE_CLOUD_PROJECT_ID=weenland-photo-gallery
GOOGLE_CLOUD_BUCKET_NAME=weenland-photos-abc123
NEXT_PUBLIC_BUCKET_BASE_URL=https://storage.googleapis.com/weenland-photos-abc123
```

#### ขั้นตอนที่ 2: เพิ่ม Service Account Key
1. เปิดไฟล์ `gcp-service-account.json`
2. คัดลอกเนื้อหาทั้งหมด (JSON)
3. เพิ่ม Environment Variable:
   - **Name**: `GOOGLE_APPLICATION_CREDENTIALS_JSON`
   - **Value**: วาง JSON ที่คัดลอกมา

#### ขั้นตอนที่ 3: อัปเดตโค้ดสำหรับ Production
แก้ไขไฟล์ `/src/lib/storage.ts` เพื่อรองรับ Environment Variable:

```typescript
// ใน initStorage function
const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON 
  ? JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)
  : process.env.GOOGLE_APPLICATION_CREDENTIALS;
```

#### ขั้นตอนที่ 4: Deploy
```bash
vercel --prod
```

### สำหรับ Netlify

#### ขั้นตอนที่ 1: ติดตั้ง Netlify CLI
```bash
npm install -g netlify-cli
```

#### ขั้นตอนที่ 2: Build โปรเจกต์
```bash
npm run build
```

#### ขั้นตอนที่ 3: Deploy
```bash
netlify deploy --prod --dir=out
```

#### ขั้นตอนที่ 4: ตั้งค่า Environment Variables
1. ไปที่ Netlify Dashboard
2. เลือกเว็บไซต์ของคุณ
3. ไปที่ Site Settings > Environment Variables
4. เพิ่มตัวแปรเดียวกับที่ใช้ใน Vercel

---

## การแก้ไขปัญหาที่พบบ่อย

### ปัญหา: "Invalid Credentials"
**สาเหตุ**: ไฟล์ Service Account JSON ไม่ถูกต้องหรือเส้นทางผิด

**วิธีแก้**:
1. ตรวจสอบเส้นทางในไฟล์ `.env`
2. ตรวจสอบว่าไฟล์ JSON อยู่ในตำแหน่งที่ถูกต้อง
3. ตรวจสอบสิทธิ์ของ Service Account

### ปัญหา: "Bucket not found"
**สาเหตุ**: ชื่อ Bucket ในไฟล์ `.env` ไม่ตรงกับที่สร้างไว้

**วิธีแก้**:
1. ตรวจสอบชื่อ Bucket ใน Google Cloud Console
2. อัปเดตไฟล์ `.env` ให้ตรงกัน

### ปัญหา: "Permission Denied"
**สาเหตุ**: Service Account ไม่มีสิทธิ์เพียงพอ

**วิธีแก้**:
1. ไปที่ IAM & Admin > IAM
2. ค้นหา Service Account ของคุณ
3. แก้ไขสิทธิ์ให้เป็น "Storage Admin"

### ปัญหา: รูปภาพไม่แสดงในเว็บไซต์
**สาเหตุ**: Bucket ไม่ได้ตั้งค่าเป็น Public

**วิธีแก้**:
1. ไปที่ Cloud Storage > Permissions
2. เพิ่ม `allUsers` เป็น "Storage Object Viewer"

### ปัญหา: การอัปโหลดช้า
**สาเหตุ**: รูปภาพขนาดใหญ่เกินไป

**วิธีแก้**:
1. ตรวจสอบขนาดไฟล์ (แนะนำไม่เกิน 10MB)
2. ลดขนาดรูปภาพก่อนอัปโหลด
3. ระบบจะปรับขนาดอัตโนมัติ แต่อาจใช้เวลานาน

### ปัญหา: Environment Variables ไม่ทำงานใน Production
**วิธีแก้**:
1. ตรวจสอบการตั้งค่าใน Platform ที่ Deploy (Vercel/Netlify)
2. ตรวจสอบว่าไม่มีช่องว่างใน Value
3. Restart deployment หลังเพิ่ม Environment Variables

---

## การบำรุงรักษา

### การสำรองข้อมูล
1. **รูปภาพ**: ใช้ `gsutil` เพื่อสำรองข้อมูลจาก Google Cloud Storage
```bash
gsutil -m cp -r gs://your-bucket-name ./backup/
```

2. **ข้อมูล JSON**: สำรองไฟล์ `public/photos.json` เป็นประจำ

### การตรวจสอบค่าใช้จ่าย
1. ไปที่ [Google Cloud Console > Billing](https://console.cloud.google.com/billing)
2. ตรวจสอบการใช้งานประจำเดือน
3. ตั้งค่า Budget Alert เพื่อแจ้งเตือนเมื่อเกินงบประมาณ

### การอัปเดตระบบ
1. อัปเดต Dependencies เป็นประจำ:
```bash
npm update
```

2. ตรวจสอบ Security Updates:
```bash
npm audit
npm audit fix
```

---

## ลิงค์ที่เป็นประโยชน์

- [Google Cloud Storage Documentation](https://cloud.google.com/storage/docs)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Pricing Calculator](https://cloud.google.com/products/calculator)
- [Support](https://cloud.google.com/support)

---

## การติดต่อและสนับสนุน

หากพบปัญหาหรือต้องการความช่วยเหลือ:

1. ตรวจสอบ Console ของเบราว์เซอร์สำหรับข้อผิดพลาด
2. ตรวจสอบ Logs ใน Google Cloud Console
3. อ่านเอกสารนี้อีกครั้งเพื่อดูขั้นตอนที่อาจพลาด
4. ตรวจสอบ Issues ใน GitHub Repository

---

**คู่มือนี้อัปเดตล่าสุด: 24 พฤษภาคม 2025**