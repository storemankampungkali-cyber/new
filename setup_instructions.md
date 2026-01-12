
# Panduan Deployment ProStock Inventory

## 1. Setup Backend (Google Apps Script)
1. Buat Google Sheet baru.
2. Klik **Extensions > Apps Script**.
3. Hapus kode default, tempel isi dari file `backend.gs`.
4. Di bilah menu editor, pilih fungsi `setupDatabase` lalu klik **Run**. Ini akan membuat sheet secara otomatis.
5. Klik **Deploy > New Deployment**.
6. Pilih type **Web App**.
7. Set "Execute as" ke **Me** dan "Who has access" ke **Anyone**.
8. Klik **Deploy**, izinkan akses, dan salin **Web App URL**.

## 2. Setup Frontend (Vercel)
1. Push kode proyek ini ke repositori GitHub.
2. Hubungkan repositori ke Vercel.
3. Di **Project Settings > Environment Variables**, tambahkan:
   - `VITE_GAS_URL`: (Tempel URL dari langkah 8 di atas)
   - `API_KEY`: (Kunci API Google Gemini Anda)
4. Klik **Deploy**.

## 3. Login Pertama
Gunakan akun default:
- Username: `admin`
- Password: `admin123`
Jangan lupa segera ubah password di menu Admin.
