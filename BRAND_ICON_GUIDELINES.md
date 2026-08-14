# ResourceHub --- Brand & Icon Guidelines

> **Purpose:** Dokumentasi resmi penggunaan logo, icon, favicon, dan
> brand asset untuk aplikasi **ResourceHub --- IT Asset Management**.
>
> Dokumen ini wajib dijadikan referensi sebelum mengganti, membuat, atau
> memodifikasi logo/icon pada aplikasi.

------------------------------------------------------------------------

# 1. Brand Identity

## Brand Name

**ResourceHub**

## Product Name

**ResourceHub --- IT Asset Management**

## Brand Concept

ResourceHub menggunakan konsep visual:

-   **RH Monogram** --- identitas utama ResourceHub
-   **Shield / Protection** --- keamanan dan perlindungan aset IT
-   **Structure / Asset** --- aset yang terorganisir dan terkontrol
-   **Dark Navy / Charcoal** --- profesional, enterprise, teknologi
-   **Orange** --- energi, aktivitas, efisiensi, dan teknologi

Logo utama menggunakan kombinasi:

`RH Monogram + ResourceHub Wordmark`

------------------------------------------------------------------------

# 2. Logo System

ResourceHub memiliki 3 jenis logo utama.

## 2.1 Primary Logo

Digunakan untuk:

-   Website landing page
-   Login page
-   Documentation
-   Marketing material
-   Email signature
-   PDF/report
-   Printed document
-   Official company/product presentation

Struktur:

`[RH MONOGRAM] ResourceHub`

Subtitle:

`IT ASSET MANAGEMENT`

### Jangan

-   Mengubah bentuk monogram
-   Mengubah proporsi logo
-   Mengganti font wordmark
-   Menambahkan shadow
-   Menambahkan gradient baru
-   Memutar logo
-   Meregangkan logo
-   Mengubah warna secara bebas

## 2.2 Logo Mark / Icon Only

Logo mark adalah **RH Monogram** tanpa tulisan `ResourceHub`.

Digunakan untuk:

-   Favicon
-   Browser tab
-   Mobile app icon
-   Sidebar collapsed
-   Avatar aplikasi
-   QR branding
-   Loading screen
-   Small UI branding

Jangan menggunakan `R`, `H`, atau `ResourceHub` sebagai pengganti logo
mark.

------------------------------------------------------------------------

# 3. Official Brand Colors

## Primary Dark

`#111827`

RGB: `17, 24, 39`

Digunakan untuk primary text, navigation, logo dark component, dan
enterprise UI.

## Brand Orange

`#F59E0B`

RGB: `245, 158, 11`

Digunakan untuk logo accent, active state, important CTA, brand
highlight, dan status yang membutuhkan perhatian.

## White

`#FFFFFF`

Digunakan untuk logo pada dark background dan contrast state.

------------------------------------------------------------------------

# 4. Logo Color Rules

## Dark Background

Pada background gelap:

-   RH Monogram: dark/white + orange sesuai asset resmi
-   Resource: White
-   Hub: Orange

## Light Background

Pada background terang:

-   RH Monogram: Dark Navy + Orange
-   Resource: Dark Navy
-   Hub: Orange

Jangan membuat variasi warna baru tanpa approval.

------------------------------------------------------------------------

# 5. Favicon

Favicon **WAJIB menggunakan RH Monogram**.

Jangan menggunakan:

-   ResourceHub wordmark
-   `ResourceHub` text
-   `RH + text`
-   Screenshot logo
-   Logo yang diperkecil secara manual dari screenshot

## Recommended Files

``` text
/public
├── favicon.ico
├── favicon.svg
├── favicon-16x16.png
├── favicon-32x32.png
├── apple-touch-icon.png
└── icon-192.png
```

## Recommended Sizes

  Asset                       Size
  ---------------------- ---------
  favicon.ico                32×32
  favicon.svg               Vector
  favicon-16x16.png          16×16
  favicon-32x32.png          32×32
  apple-touch-icon.png     180×180
  icon-192.png             192×192
  icon-512.png             512×512

------------------------------------------------------------------------

# 6. Sidebar Logo

## Expanded Sidebar

Gunakan:

`[RH MONOGRAM] ResourceHub`

Recommended height:

`28–32px`

## Sidebar Collapsed

Gunakan hanya:

`[RH]`

Jangan menggunakan wordmark ketika sidebar terlalu kecil.

------------------------------------------------------------------------

# 7. Browser Title

Browser title tidak menggunakan logo image.

Gunakan:

`ResourceHub — IT Asset Management`

Contoh:

``` html
<title>ResourceHub — IT Asset Management</title>
```

Untuk halaman tertentu:

-   `Dashboard — ResourceHub`
-   `Assets — ResourceHub`
-   `Maintenance — ResourceHub`
-   `Reports — ResourceHub`

------------------------------------------------------------------------

# 8. App Icon

Untuk PWA, mobile, atau desktop app gunakan **RH Monogram** dengan
background Dark Navy.

Recommended sizes:

-   64×64
-   128×128
-   192×192
-   256×256
-   512×512

Icon harus tetap recognizable pada ukuran kecil.

------------------------------------------------------------------------

# 9. UI Icon System

**Logo dan UI icon adalah dua hal yang berbeda.**

## Logo

Digunakan untuk:

-   Brand identity
-   Sidebar branding
-   Favicon
-   App icon
-   Login page
-   Marketing

## UI Icon

Digunakan untuk:

-   Dashboard
-   Assets
-   Requests
-   Maintenance
-   Reports
-   Settings
-   Notifications
-   Actions

**JANGAN menggunakan logo mark sebagai pengganti UI icon.**

------------------------------------------------------------------------

# 10. Recommended UI Icon Library

Gunakan satu icon library secara konsisten.

### Preferred

**Lucide Icons**

### Alternative

**Heroicons**

Jangan mencampurkan banyak icon library dalam satu interface tanpa
alasan desain yang jelas.

------------------------------------------------------------------------

# 11. Icon Style

Semua UI icon harus konsisten.

Recommended:

-   Style: Outline / Stroke
-   Stroke: 1.75--2px
-   Corner: Rounded
-   Visual: Simple, Minimal, Professional, Enterprise

Contoh mapping:

  Navigation          Recommended Icon
  ------------------- -----------------------
  Dashboard           `LayoutDashboard`
  Assets              `Package` / `Boxes`
  New Asset           `Plus`
  Scan QR             `ScanLine`
  Categories          `Tags`
  Locations           `MapPin`
  Software Licenses   `KeyRound`
  Requests            `ClipboardList`
  Maintenance         `Wrench`
  Departments         `Building2`
  Reports             `ChartNoAxesCombined`
  Support             `CircleHelp`

------------------------------------------------------------------------

# 12. Icon Color Rules

Jangan memberikan warna random pada setiap icon.

  Usage            Color
  ---------------- -----------
  Default          `#6B7280`
  Primary / Dark   `#111827`
  Active / Brand   `#F59E0B`
  Success          `#10B981`
  Warning          `#F59E0B`
  Danger           `#EF4444`
  Info             `#3B82F6`

------------------------------------------------------------------------

# 13. Sidebar Navigation Icon Rules

Icon sidebar harus:

1.  Memiliki ukuran sama.
2.  Memiliki stroke yang sama.
3.  Memiliki alignment yang sama.
4.  Tidak menggunakan emoji.
5.  Tidak menggunakan icon random dari internet.
6.  Tidak menggunakan SVG dengan style berbeda.

Recommended:

-   Icon size: `18px`
-   Stroke: `1.75–2px`

------------------------------------------------------------------------

# 14. Status Icons

Gunakan semantic icon.

  Status      Icon               Color
  ----------- ------------------ -----------
  Available   `CircleCheck`      `#10B981`
  Assigned    `UserRoundCheck`   `#3B82F6`
  In Repair   `Wrench`           `#F59E0B`
  Pending     `ClipboardClock`   `#F97316`
  Expiring    `ShieldAlert`      `#EF4444`
  Lost        `CircleX`          `#EF4444`
  Retired     `Archive`          `#6B7280`
  Disposed    `Trash2`           `#6B7280`

------------------------------------------------------------------------

# 15. Dashboard Metric Icons

Dashboard metric cards menggunakan icon yang menggambarkan konteks.

  Metric         Icon
  -------------- ---------------------
  Total Assets   `Package` / `Boxes`
  Available      `CircleCheck`
  Assigned       `UserRoundCheck`
  In Repair      `Wrench`
  Pending        `ClipboardClock`
  Expiring       `ShieldAlert`

Jangan menggunakan emoji, random SVG, brand logo, atau icon yang tidak
berhubungan dengan konteks.

------------------------------------------------------------------------

# 16. Icon Container

Icon pada metric card dapat menggunakan container.

Recommended:

-   Width: `36–40px`
-   Height: `36–40px`
-   Border radius: `10–12px`
-   Icon: `18–20px`

------------------------------------------------------------------------

# 17. Logo Spacing

Logo harus memiliki clear space.

Minimum clear space:

`0.5 × tinggi logo mark`

Contoh:

Jika logo mark berukuran `32px`, minimum clear space adalah `16px`.

Jangan menempelkan logo ke:

-   Border
-   Text
-   Button
-   Screen edge
-   Icon lain

------------------------------------------------------------------------

# 18. Minimum Logo Size

## Primary Logo

Minimum:

`120px width`

## Logo Mark

Absolute minimum:

`16×16px`

Recommended:

`24–32px`

------------------------------------------------------------------------

# 19. SVG Rules

Semua logo utama **WAJIB menggunakan SVG** apabila memungkinkan.

Recommended assets:

``` text
logo.svg
logo-dark.svg
logo-white.svg
logo-mark.svg
logo-mark-dark.svg
logo-mark-white.svg
favicon.svg
```

SVG harus:

-   Tidak memiliki embedded bitmap
-   Tidak memiliki metadata yang tidak diperlukan
-   Tidak menggunakan external resource
-   Memiliki `viewBox`
-   Tetap sharp pada semua ukuran

------------------------------------------------------------------------

# 20. Recommended Asset Structure

Gunakan struktur:

``` text
public/
└── brand/
    ├── logo.svg
    ├── logo-dark.svg
    ├── logo-white.svg
    ├── logo-mark.svg
    ├── logo-mark-dark.svg
    ├── logo-mark-white.svg
    ├── favicon.svg
    ├── favicon.ico
    ├── icon-16.png
    ├── icon-32.png
    ├── icon-64.png
    ├── icon-128.png
    ├── icon-192.png
    └── icon-512.png
```

------------------------------------------------------------------------

# 21. Naming Convention

### Correct

``` text
logo.svg
logo-dark.svg
logo-white.svg
logo-mark.svg
logo-mark-dark.svg
logo-mark-white.svg
favicon.svg
```

### Incorrect

``` text
logo-final.svg
logo-final-2.svg
logo-baru.svg
logo-fix.svg
logo-new.svg
logo-new-final.svg
logo-final-final.svg
final-final-v2-revisi-fix.svg
```

Gunakan nama berdasarkan fungsi, bukan status revisi.

------------------------------------------------------------------------

# 22. Do Not Replace Logo Without Approval

Developer **TIDAK BOLEH** mengganti logo utama hanya karena:

-   Menurut developer icon tersebut lebih bagus.
-   Icon library memiliki icon yang mirip.
-   Ada SVG dari internet.
-   Ada logo AI-generated yang terlihat menarik.
-   Icon tidak sesuai dengan personal preference developer.

Perubahan berikut dianggap sebagai **Brand / Design Change**:

-   Logo
-   Favicon
-   Brand color
-   Monogram
-   Wordmark
-   Typography
-   Icon style

Perubahan tersebut harus mendapatkan approval terlebih dahulu.

------------------------------------------------------------------------

# 23. AI-Generated Assets

AI-generated logo/icon tidak boleh langsung digunakan di production.

Workflow:

``` text
AI Concept
    ↓
Designer Review
    ↓
Vectorization
    ↓
Brand Approval
    ↓
Production Asset
```

Jangan mengambil screenshot hasil AI dan memasukkannya langsung sebagai
logo production.

------------------------------------------------------------------------

# 24. Icon Replacement Checklist

Sebelum mengganti icon:

-   [ ] Pastikan icon tersebut bukan brand logo.
-   [ ] Pastikan fungsi icon sesuai dengan konteks.
-   [ ] Gunakan icon library yang sudah ditentukan.
-   [ ] Pastikan stroke style konsisten.
-   [ ] Pastikan ukuran konsisten.
-   [ ] Pastikan warna mengikuti semantic color.
-   [ ] Pastikan tidak menggunakan emoji.
-   [ ] Pastikan tidak menggunakan SVG random dari internet.
-   [ ] Pastikan tidak mengubah logo tanpa approval.
-   [ ] Test icon pada light mode.
-   [ ] Test icon pada dark mode.
-   [ ] Test icon pada desktop.
-   [ ] Test icon pada responsive/mobile.

------------------------------------------------------------------------

# 25. Forbidden Changes

Jangan melakukan hal berikut:

``` text
❌ Mengganti logo ResourceHub dengan logo baru
❌ Mengubah bentuk RH Monogram
❌ Mengubah brand orange secara random
❌ Menggunakan emoji sebagai UI icon
❌ Menggabungkan Font Awesome + Lucide + Heroicons tanpa alasan
❌ Menggunakan icon berwarna-warni tanpa semantic purpose
❌ Menggunakan filled icon di sebelah outline icon tanpa alasan
❌ Mengubah favicon menjadi logo wordmark
❌ Menggunakan screenshot logo
❌ Stretch logo
❌ Rotate logo
❌ Menambahkan shadow ke logo
❌ Menambahkan gradient baru ke logo
❌ Mengubah font wordmark
❌ Mengambil icon dari Google Image Search secara langsung
```

------------------------------------------------------------------------

# 26. Developer Decision Rule

Jika developer ragu memilih icon:

``` text
Apakah ini brand element?
        │
        ├── YES → DO NOT MODIFY
        │
        └── NO
             ↓
      Apakah ada Lucide icon?
             │
             ├── YES → USE IT
             │
             └── NO
                  ↓
          Check Heroicons
                  │
                  └── Jika masih tidak tersedia
                       ↓
                 Discuss with Designer
```

------------------------------------------------------------------------

# 27. Source of Truth

Prioritas sumber asset:

``` text
1. /public/brand/
2. Design System
3. Component Library
4. Approved Design
5. Designer instruction
```

Jangan mengambil asset dari:

-   Google
-   Pinterest
-   Random SVG websites
-   Screenshot
-   AI-generated image
-   Website lain

tanpa approval.

------------------------------------------------------------------------

# 28. Implementation Principle

Developer harus memisahkan:

``` text
Brand Assets
├── ResourceHub Logo
├── RH Monogram
├── Favicon
└── App Icon

UI Icons
├── Dashboard Icon
├── Asset Icon
├── Request Icon
├── Maintenance Icon
├── Report Icon
└── Support Icon
```

Jangan menjadikan:

``` text
RH Monogram
```

sebagai icon untuk:

``` text
Assets
Requests
Maintenance
Reports
```

karena akan menghilangkan fungsi semantic dari UI icon.

------------------------------------------------------------------------

# 29. Final Rule

> **ResourceHub harus selalu terlihat seperti satu produk yang sama.**

Konsistensi lebih penting daripada mengganti icon hanya karena icon baru
terlihat lebih menarik.

Jika sebuah icon sudah memenuhi:

``` text
✓ Correct meaning
✓ Correct style
✓ Correct size
✓ Correct color
✓ Correct alignment
```

maka:

``` text
DO NOT CHANGE IT
```

Jika perubahan memengaruhi:

``` text
Logo
Favicon
Brand Color
Monogram
Wordmark
Typography
Icon Style
```

maka perubahan tersebut harus mendapatkan approval terlebih dahulu.

------------------------------------------------------------------------

# 30. Quick Reference

  Element                 Standard
  ----------------------- ------------------
  Primary Logo            RH + ResourceHub
  Logo Mark               RH Monogram
  Favicon                 RH Monogram
  App Icon                RH Monogram
  Sidebar Expanded        RH + ResourceHub
  Sidebar Collapsed       RH
  UI Icon Library         Lucide
  UI Icon Style           Outline
  Default Icon            `#6B7280`
  Brand Dark              `#111827`
  Brand Orange            `#F59E0B`
  Success                 `#10B981`
  Warning                 `#F59E0B`
  Danger                  `#EF4444`
  Info                    `#3B82F6`
  Default Icon Size       `18px`
  Metric Icon             `18–20px`
  Logo Format             SVG
  Favicon                 SVG + ICO
  Primary Logo Minimum    `120px` width
  Logo Mark Minimum       `16px`
  Recommended Logo Mark   `24–32px`

------------------------------------------------------------------------

# 31. TL;DR untuk Developer

Jika hanya perlu mengingat 8 aturan:

1.  **Logo ResourceHub = JANGAN DIGANTI sembarangan.**
2.  **Favicon = RH Monogram.**
3.  **Sidebar expanded = RH + ResourceHub.**
4.  **Sidebar collapsed = RH.**
5.  **UI icons = Lucide.**
6.  **UI icons = outline + consistent stroke.**
7.  **Jangan gunakan emoji/random SVG.**
8.  **Perubahan brand asset harus melalui approval.**

**Source of Truth:**

``` text
/public/brand/
```

Semua komponen production harus menggunakan asset dari folder tersebut
dan tidak membuat ulang logo secara manual.
