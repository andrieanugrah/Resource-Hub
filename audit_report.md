# Laporan Audit Comprehensive ResourceHub

Dokumen ini berisi hasil audit menyeluruh terhadap repositori **ResourceHub** (Sistem Manajemen Aset IT) yang mencakup evaluasi segi **Fitur & Logika Bisnis**, **UI/UX**, **Database & Arsitektur Data**, serta **Daftar Fitur yang Belum Ada / Belum Selesai**.

---

## 1. Executive Summary

- **Status Kompilasi**: ❌ FAILED (`npm run typecheck` menghasilkan **14 error TypeScript**).
- **Status Linter**: ⚠️ WARNINGS (`npm run lint` melewatinya tetapi menghasilkan **26 peringatan ESLint** seperti React 19 ref access saat render & cascading state update).
- **Arsitektur Database**: ⚠️ RISKY (Penggunaan `writeTable` berbasis `DELETE ALL + RE-INSERT` yang berpotensi kehilangan data & race condition).
- **Fungsionalitas Alur Kerja**: ⚠️ INCOMPLETE (Status request saat `completed` tidak otomatis memperbarui status fisik aset).

---

## 2. Audit Bug Berdasarkan Kategori

### A. Bug Segi Fitur & Logika Bisnis

1. **Error Kompilasi TypeScript (`tsc --noEmit` Fail - 14 Error)**
   - `lib/validate.ts`: `z.record(z.string())` tidak valid pada Zod 4 (seharusnya menerima 2 argumen: `z.record(z.string(), z.string())`).
   - `app/api/assets/route.ts`: Inkompatibilitas tipe pada penanganan properti `specifications`.
   - `app/api/maintenance/[id]/route.ts`: Error casting tipe `(log as Record<string, unknown>)[f]`.
   - `app/(dashboard)/assets/page.tsx` & `requests/page.tsx`: Error casting `(a as Record<string, unknown>)[sortField]`.
   - `lib/crud.ts`: Mismatch casting array generic pada tabel lookup (Category, Location, Department, License).

2. **Alur Kerja Request Terputus dari Status Aset (`app/api/requests/[id]/mark_completed/route.ts`)**
   - **Deskripsi**: Saat request pengembalian (`return`), pinjaman (`temporary_loan`), atau perbaikan (`repair`) ditandai `completed`, sistem hanya mengubah status di tabel `requests`.
   - **Dampak**: Tabel `assets` tidak diperbarui (`assigned_user_id` & `status` tetap `assigned`), dan `asset_transactions` tidak mencatat pergerakan aset fisik.

3. **Rate Limiting In-Memory untuk Login (`lib/auth.ts`)**
   - **Deskripsi**: Pembatasan percobaan login berbasis `Map` di dalam memori server Node.js.
   - **Dampak**: Jika server di-restart atau dideploy dalam lingkungan serverless / multi-instance, penghitung gagal login langsung ter-reset, sehingga rentan terhadap brute force attack.

4. **Transisi Status Maintenance Tidak Memperbarui Status Aset (`app/api/maintenance/[id]/route.ts`)**
   - **Deskripsi**: Ketika perbaikan selesai (`resolved` / `closed`), status aset di tabel `assets` tidak otomatis kembali dari `in_repair` menjadi `available`.

5. **Tidak Ada Fitur/Endpoint Import Aset Masal (CSV/Excel)**
   - **Deskripsi**: Sistem hanya menyediakan fitur *export* laporan ke CSV/XLSX, tetapi tidak memiliki validator dan parser untuk mengunggah aset secara masal (*bulk import*).

---

### B. Bug Segi UI/UX & Performa Frontend

1. **Akses Ref Langsung Saat Render pada Component (`components/notifications.tsx`)**
   - **Deskripsi**: `triggerRef.current.getBoundingClientRect()` diakses langsung di dalam tubuh fungsi render (line 78–81).
   - **Dampak**: Melanggar kaidah React 19 Concurrent Rendering, memicu warning ESLint `react-hooks/refs`, dan berpotensi menyebabkan bug kalkulasi posisi popover/dropdown saat respon responsif/SSR.

2. **Cascading State Update di Dalam Effect (`components/sidebar-context.tsx` & `sidebar-sheet.tsx`)**
   - **Deskripsi**: Pemanggilan `setState()` secara sinkron di dalam `useEffect` tanpa sinkronisasi state eksternal.
   - **Dampak**: Memicu re-render berantai (*cascading re-renders*) yang menurunkan performa interaksi UI.

3. **Inkonsistensi Dark Mode pada Kartu Statistik**
   - **Deskripsi**: Beberapa komponen (misal `app/(dashboard)/profile/page.tsx`) menggunakan class warna Tailwind terang yang di-hardcode seperti `bg-blue-50`, `bg-violet-50`, `text-blue-600`.
   - **Dampak**: Menggangu estetika dan keterbacaan saat pengguna beralih ke mode gelap (Dark Mode).

4. **Tabel Data Tidak Responsif di Layar Ponsel (`assets/page.tsx` & `requests/page.tsx`)**
   - **Deskripsi**: Tabel data tidak dibungkus dengan container `overflow-x-auto` yang optimal atau tampilan *card fallback* di layar seluler.
   - **Dampak**: Teks dan tombol aksi terpotong di layar perangkat seluler/tablet.

5. **Penggunaan Tag HTML `<img>` Polos (`components/qr-code.tsx`)**
   - **Deskripsi**: Komponen QR Code menggunakan tag HTML `<img>` alih-alih `<Image />` dari `next/image`.
   - **Dampak**: Memicu warning LCP (*Largest Contentful Paint*) dari Next.js.

---

### C. Bug & Masalah Segi Database & Arsitektur Data

1. **Metode Destruktif `writeTable()` (`lib/db.ts`)**
   - **Deskripsi**: `writeTable()` menjalankan `db.delete(table).run()` lalu melakukan re-insert seluruh baris array (batch 50).
   - **Risiko Bahaya**:
     - **Race Condition**: Jika ada dua request bersamaan, pembacaan di tengah proses delete-insert akan mengembalikan data kosong.
     - **Kehilangan Data**: Jika proses insert gagal di tengah batch, data lama sudah terlanjur terhapus permanen.
     - **Skalabilitas**: Waktu eksekusi melambat secara eksponensial seiring bertambahnya jumlah record aset/log.

2. **Tanpa Indexing Database (`drizzle/schema.ts`)**
   - **Deskripsi**: Kolom *foreign key* dan filter populer (`assigned_user_id`, `category_id`, `location_id`, `requester_id`, `status`, `actor_user_id`) tidak memiliki index `.index()`.
   - **Dampak**: SQLite harus melakukan *Full Table Scan* pada setiap pencarian, filter, dan join manual.

3. **Integritas Relasi dan Safeguard Hapus Lemah**
   - **Deskripsi**: Skema SQLite tidak mendefinisikan *foreign key constraint* dengan `REFERENCES` / `ON DELETE CASCADE`. Pengecekan hanya dilakukan seadanya di layer aplikasi (`countAssetsByLink`).

---

## 3. Daftar Fitur yang Belum Ada / Belum Selesai (Missing & Incomplete Features)

Berikut adalah daftar modul dan fitur yang belum diimplementasikan atau belum selesai:

| No | Nama Fitur | Status | Keterangan & Kebutuhan |
|---|---|---|---|
| 1 | **Bulk Import Aset (CSV / Excel)** | ❌ Belum Ada | Pengguna tidak bisa mengunggah data aset masal dari spreadsheet. Diperlukan parser CSV/XLSX + validator schema Zod. |
| 2 | **Scanner QR Code / Barcode (Kamera)** | ❌ Belum Ada | Generator QR sudah ada, namun belum ada pemindai QR Code via kamera perangkat untuk pemindaian cepat di lapangan. |
| 3 | **Sinkronisasi Otomatis Request ke Status Aset** | ⚠️ Incomplete | Menyelesaikan request (`completed`) belum otomatis mengubah status aset, lokasi, atau pemegang aset secara otomatis. |
| 4 | **Sistem Lisensi Perangkat Lunak (Seat Allocation)** | ⚠️ Incomplete | Tabel `licenses` saat ini hanya tabel CRUD sederhana (nama/deskripsi). Belum ada fitur manajemen alokasi lisensi per user/aset, serial key, & tracking tanggal kadaluarsa lisensi. |
| 5 | **Depresiasi & Tracking Nilai Buku Aset** | ❌ Belum Ada | Kolom `purchase_price` & `purchase_date` tersedia, namun belum ada kalkulasi depresiasi nilai aset (straight-line / declining balance) dan laporan penyusutan keuangan. |
| 6 | **Integrasi Email / Push Notification Real-time** | ❌ Belum Ada | Notifikasi saat ini hanya tersimpan di tabel DB (`notifications`). Belum ada pengiriman email otomatis (SMTP/Resend/SendGrid) saat request butuh persetujuan. |
| 7 | **Audit Log Visual Diff Viewer** | ⚠️ Incomplete | Tabel `audit_logs` menyimpan `before_json` dan `after_json`, namun di UI belum ada modal penampil perbedaan (*side-by-side diff viewer*). |
| 8 | **Automated Testing (Playwright / Jest / Vitest)** | ❌ Belum Ada | Package `playwright` sudah terpasang di `devDependencies`, tetapi belum ada konfigurasi (`playwright.config.ts`) maupun berkas spesifikasi tes (`*.spec.ts`). |

---

## 4. Rekomendasi Langkah Perbaikan (Action Plan)

1. **Prioritas 1 (Kritis)**: Perbaiki 14 error kompilasi TypeScript di `lib/validate.ts`, `lib/crud.ts`, `app/api/assets/route.ts`, dan `app/api/maintenance/[id]/route.ts` agar `npm run typecheck` lulus 100%.
2. **Prioritas 2 (Fungsional)**: Hubungkan logika pengerjaan request di `lib/request-transitions.ts` & `mark_completed` dengan update data fisik di tabel `assets` & pembuatan `asset_transactions`.
3. **Prioritas 3 (Database)**: Refactor `writeTable()` di `lib/db.ts` menggunakan query update/insert Drizzle spesifik per ID, serta tambahkan index kolom foreign key di `drizzle/schema.ts`.
4. **Prioritas 4 (UI/UX)**: Perbaiki warning ref di `notifications.tsx`, rapikan warna mode gelap, dan tambahkan responsivitas tabel di layar mobile.
