# ResourceHub

Sistem manajemen aset TI berbasis web. Melacak laptop, desktop, monitor, printer, server, switch, router, AP, peripheral, dan lisensi software dari pengadaan hingga pembuangan. Multi-peran dengan audit trail penuh.

## Language

### Aset

**Aset**:
Barang TI yang dimiliki organisasi, dilacak dengan kode unik, QR, dan status lifecycle.
_Avoid_: Barang, inventaris, item

**Status Aset**:
Posisi aset dalam lifecycle: `available`, `assigned`, `reserved`, `in_repair`, `retired`, `lost`, `disposed`.
_Avoid_: Keadaan, kondisi aset (kondisi itu `condition`)

**Kondisi (condition)**:
Keadaan fisik aset: `new`, `good`, `fair`, `damaged`, `critical`.
_Avoid_: Status, kesehatan

**Kode Aset (asset_code)**:
Format `AST-{tahun}-{4-digit-seq}`. Sequential per tahun, reset tiap Januari. Tampil di QR label, laporan, dan UI.
_Avoid_: ID aset, nomor aset, kode barang

**Spesifikasi (specifications)**:
Teks bebas berisi detail teknis aset. Disalin dari template kategori saat aset dibuat, bisa diedit manual.
_Avoid_: Spek, detail teknis, atribut

**Depresiasi (depreciation)**:
Straight-line. Dihitung dari `purchase_price`, `useful_life_years`, `salvage_value`. Return: `annual`, `accumulated`, `current_value`, `percent_depreciated`.
_Avoid_: Penyusutan (tetap gunakan "depresiasi" untuk konsistensi kode)

**Garansi (warranty)**:
Notifikasi otomatis 30 hari sebelum `warranty_end_date`. Ditujukan ke user dengan izin `maintenance.view`.
_Avoid_: Jaminan (ambigu), warranty (tidak perlu bahasa Inggris)

**Peripheral**:
Aset aksesoris (keyboard, mouse, docking station, headset). Aset mandiri di tabel flat. Bisa dikaitkan ke aset induk lewat `parent_asset_id` opsional — untuk tampilan, bukan constraint.
_Avoid_: Aksesoris, kelengkapan, add-on

### Pengguna & Organisasi

**Pengguna (user)**:
Orang yang login ke sistem. Punya peran, departemen, dan status keaktifan. Karyawan resign → semua asetnya di-flag untuk return.
_Avoid_: Karyawan, pegawai, user (konsisten: "pengguna" di konteks domain, "user" di kode)

**Peran (role)**:
`super_admin`, `admin_it`, `manager`, `employee`. Menentukan izin akses via matrix RBAC.
_Avoid_: Jabatan, level, hak akses

**Departemen**:
Unit organisasi tempat pengguna atau aset bernaung. Aset bisa di-assign ke departemen tanpa pengguna spesifik.
_Avoid_: Divisi, unit, bagian

**Lokasi (location)**:
Tempat fisik aset berada: `location_name`, `branch_name`, `building`, `floor`, `room`.
_Avoid_: Tempat, posisi, site

**Kategori (category)**:
Pengelompokan tipe aset. Flat, bukan hirarki. Bisa punya `parent_category_id` opsional di masa depan. Punya `specifications` sebagai template default saat aset dibuat.
_Avoid_: Jenis, tipe, kelompok

### Assignment & Pergerakan

**Assignment**:
Penugasan aset ke pengguna atau departemen. Satu aset hanya boleh satu assignment aktif. Aset assigned tidak bisa di-assign ke orang lain. Setiap assignment tercatat di `asset_transactions` (append-only ledger).
_Avoid_: Pinjaman, penempatan, alokasi

**Return**:
Pengembalian aset dari pengguna ke organisasi. Status aset balik ke `available`. Harus lewat request.
_Avoid_: Kembali, check-in, serah terima

**Check-in / Check-out**:
Flow transaksional peminjaman dan pengembalian aset dengan `condition_before/after` dan notes. Semua pergerakan wajib lewat request — tidak ada endpoint mandiri.
_Avoid_: Pinjam/kembali (gunakan istilah request `temporary_loan` untuk pinjaman)

**Reserved**:
Status aset yang sudah di-commit ke pemohon lewat request `approved` tapi belum diserahkan fisik. Aktif di set `approved` jika `request.asset_id` ada. Bisa masuk `in_repair` (balik ke `reserved` setelah selesai). Bisa masuk `lost` atau `disposed`.
_Avoid_: Dipesan, dibooking, ditahan

**Temporary Loan**:
Request peminjaman sementara. Flow sama dengan assignment lain. `required_date` berfungsi sebagai due date. Dashboard/report bisa flag overdue.
_Avoid_: Pinjaman, pinjam pakai, sewa

**Departemen tanpa pengguna**:
Assignment aset ke departemen tanpa pengguna spesifik. Dikontrol oleh boolean `department_asset` di request. Completed → `assigned_department_id` terisi, `assigned_user_id` null.
_Avoid_: Aset umum, aset bersama, aset kantor

### Request

**Request**:
Pengajuan resmi untuk perubahan status/movement aset. Tipe: `new_asset`, `replacement`, `temporary_loan`, `return`, `repair`.
_Avoid_: Tiket, pengajuan, permintaan, permohonan

**Status Request**:
`draft → pending_approval → approved|rejected → in_progress → completed` (atau `cancelled` dari status aktif apa pun).
_Avoid_: Keadaan request, state request

**Kode Request (request_code)**:
Format `REQ-{tahun}-{4-digit-seq}`. Sequential per tahun, reset tiap Januari.
_Avoid_: Nomor request, ID pengajuan

**Self-approve**:
Dilarang untuk semua peran kecuali `super_admin`. Yang mengajukan dan yang menyetujui harus orang berbeda. Sudah di-enforce di level `validate`.
_Avoid_: Setuju sendiri, approve request sendiri

**Batch Request**:
Satu pengajuan bisa punya banyak aset. Parent sebagai "keranjang" (track progress keseluruhan), children per aset (track lifecycle masing-masing). Parent-child via `parent_request_id` opsional.
_Avoid_: Request massal, multi-item request, pesanan

### Maintenance

**Maintenance**:
Perbaikan atau perawatan aset. Status: `open → in_progress → waiting_vendor → resolved → closed`. Dua tahap akhir: `resolved` (teknisi selesai) dan `closed` (admin verifikasi, isi `actual_cost`).
_Avoid_: Perbaikan, servis, repair

**Kode Maintenance (maintenance_code)**:
Format `MNT-{tahun}-{4-digit-seq}`. Sequential per tahun.
_Avoid_: Nomor perbaikan, tiket maintenance, WO (work order)

**Aset dalam perbaikan**:
Bisa dipensiunkan langsung (`in_repair → retired`) dengan alasan wajib. Maintenance log di-update ke `closed` dengan catatan. Bisa juga hilang (`in_repair → lost`).
_Avoid_: Aset rusak, broken

### Lisensi

**Lisensi**:
Software license dengan tipe: `subscription`, `perpetual`, `volume`, `oem`. Punya `total_seats`, `license_key`, `vendor`, `expiry_date`.
_Avoid_: Izin, hak pakai, software license

**Assignment Lisensi**:
Dua mode: **device-based** (attach ke aset, pengguna dapat hak pakai) dan **user-based** (attach langsung ke pengguna). Keduanya via tabel `license_assignments` yang bisa punya `assigned_user_id` atau `assigned_asset_id` atau keduanya.
_Avoid_: Alokasi lisensi, pemakaian lisensi

### Audit & Notifikasi

**Audit Trail**:
Catatan immutable setiap perubahan data. Menyimpan `actor`, `action`, `entity`, `before/after` JSON diff, `ip`, `ua`, `timestamp`. Otomatis redact `password_hash` dan `password_salt`. Append-only — tidak bisa dihapus.
_Avoid_: Log aktivitas, history, jejak (audit trail baku)

**Notifikasi**:
Pesan in-app per pengguna. Tipe: `request`, `maintenance`, `asset`, `system`. Punya `link` navigasi dan `read` boolean. Trigger: request disetujui/ditolak, maintenance selesai, warranty mau habis, pengguna resign.
_Avoid_: Alert, pemberitahuan, pesan

### Pelaporan

**Laporan**:
Output berdasarkan status/kategori/lokasi/departemen. Ekspor CSV/XLSX. Depresiasi termasuk di laporan nilai aset.
_Avoid_: Report, ringkasan, ringkasan aset

## State Machines

### Aset

```
available    ↔ assigned
available    → reserved
reserved     → assigned         (serah terima fisik setelah approved)
assigned     → available        (return)
in_repair    → available
in_repair    → reserved         (aset reserved diperbaiki → balik reserved)
available    → in_repair
assigned     → in_repair
reserved     → in_repair
available    → retired
assigned     → retired          (harus return dulu atau admin override)
in_repair    → retired          (dengan alasan wajib)
retired      → disposed         (pemusnahan fisik)
available    → lost
assigned     → lost
reserved     → lost
in_repair    → lost
lost         → disposed
```

Tidak diizinkan: assigned → assigned (tanpa return dulu), disposed → balik ke status lain, retired → balik ke status aktif.

### Request

```
draft         → pending_approval
draft         → cancelled
pending_approval → approved
pending_approval → rejected
pending_approval → cancelled
approved      → in_progress
approved      → cancelled        (aset reserved → balik status sebelumnya; repair tetap in_repair)
rejected      → (terminal)
in_progress   → completed
in_progress   → cancelled        (aset reserved → balik; repair tetap in_repair)
completed     → (terminal)
```

### Maintenance

```
open             → in_progress
open             → cancelled
open             → waiting_vendor
in_progress      → waiting_vendor
in_progress      → resolved
in_progress      → cancelled
waiting_vendor   → in_progress
waiting_vendor   → resolved
waiting_vendor   → cancelled
resolved         → closed
resolved         → cancelled
closed           → (terminal)
cancelled        → (terminal)
```
