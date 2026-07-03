# Design System & UI Specification: Business Analytics Dashboard (BEM & Vanilla CSS)

Dokumen ini berfungsi sebagai acuan utama (design tokens, layout guide, & BEM naming convention) untuk Copilot dalam mengimplementasikan komponen antarmuka pengguna (UI) sesuai dengan gambar referensi menggunakan Vanilla CSS.

---

## 1. Tema & Palet Warna (Color Palette)

Gunakan CSS Variables (`:root`) untuk mempermudah manajemen warna dan persiapan *theme switching* (Light/Dark mode) di masa depan.

```css
:root {
  /* Main Colors */
  --color-app-bg: #F4F5F7;
  --color-card-bg: #FFFFFF;
  --color-sidebar-bg: #FFFFFF;
  --color-text-primary: #1A1D20;
  --color-text-muted: #7A869A;
  --color-border: #E3E6EB;

  /* Data & Status Colors */
  --color-accent-blue: #3B71F7;
  --color-success: #22C55E;
  --color-danger: #EF4444;
  --color-warning-yellow: #FACC15;
  --color-orange: #FB923C;
  --color-purple: #A855F7;
  
  /* Layout Sizing */
  --sidebar-width: 240px;
  --card-radius: 16px;
  --transition-speed: 0.3s;
}
```

---

## 2. Struktur BEM (Block, Element, Modifier) Naming Convention

Instruksikan Copilot untuk menggunakan arsitektur kelas berikut guna menjaga modularitas:

### A. Sidebar Component
* **Block:** `.sidebar`
* **Elements:** `.sidebar__logo`, `.sidebar__menu`, `.sidebar__item`, `.sidebar__link`, `.sidebar__icon`
* **Modifiers:** `.sidebar__item--active` (untuk menandai menu yang sedang aktif)

### B. Metric Cards (Top Row)
* **Block:** `.metric-card`
* **Elements:** `.metric-card__header`, `.metric-card__title`, `.metric-card__icon`, `.metric-card__value`, `.metric-card__footer`, `.metric-card__trend`
* **Modifiers:** `.metric-card__trend--up` (warna hijau), `.metric-card__trend--down` (warna merah)

### C. Responsive Table Component
* **Block:** `.orders-table`
* **Elements:** `.orders-table__element`, `.orders-table__header`, `.orders-table__row`, `.orders-table__cell`, `.orders-table__badge`
* **Modifiers:** `.orders-table__badge--delivered`, `.orders-table__badge--processed`, `.orders-table__badge--cancelled`

---

## 3. Responsive Layout Strategy (Vanilla CSS Grid & Media Queries)

Implementasi struktur makro menggunakan CSS Grid desktop-first, yang akan beralih menjadi single-column pada layar mobile.

### CSS Desktop & Base Structure
```css
.dashboard {
  display: flex;
  min-height: 100vh;
  background-color: var(--color-app-bg);
}

.dashboard__sidebar {
  width: var(--sidebar-width);
  background-color: var(--color-sidebar-bg);
  border-right: 1px solid var(--color-border);
}

.dashboard__content {
  flex: 1;
  padding: 32px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

/* Layout untuk baris grafik & tabel */
.dashboard__row-double {
  grid-column: span 4;
  display: grid;
  grid-template-columns: 2fr 1fr; /* Bagian kiri lebih lebar dari kanan */
  gap: 24px;
}
```

### CSS Responsive Breakpoints (Mobile Adaptation)
```css
/* Tablet Layout (< 1024px) */
@media (max-width: 1024px) {
  .dashboard {
    flex-direction: column;
  }
  
  .dashboard__sidebar {
    width: 100%;
    display: none; /* Ubah menjadi 'block' jika drawer aktif melalui JS toggle (.sidebar--open) */
  }
  
  .dashboard__content {
    grid-template-columns: repeat(2, 1fr);
    padding: 20px;
  }
  
  .dashboard__row-double {
    grid-template-columns: 1fr;
  }
}

/* Mobile Layout (< 768px) */
@media (max-width: 768px) {
  .dashboard__content {
    grid-template-columns: 1fr; /* Stack semua kartu vertikal */
    gap: 16px;
  }
}
```

---

## 4. Adaptasi Komponen Khusus Mobile

### Data Table Scrollable Wrapper
Agar tabel tidak merusak layout (*overflow*), bungkus block `.orders-table` ke dalam elemen penampung responsif:
```css
.table-responsive {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
```

### Touch Targets & Hover Rules
```css
/* Efek hover hanya berlaku di desktop untuk menghindari bug lengket di layar sentuh */
@media (hover: hover) {
  .metric-card:hover {
    transform: translateY(-2px);
    box-shadow: 0px 8px 24px rgba(0, 0, 0, 0.04);
    transition: all var(--transition-speed) ease;
  }
}

/* Standar ukuran klik di Mobile */
.sidebar__link, .button {
  min-height: 44px;
  display: flex;
  align-items: center;
}
```

---

### Instruksi Tambahan untuk Copilot:
> "Write standard Semantic HTML5 tags using BEM naming conventions. Ensure all style rules are separated cleanly into a Vanilla CSS file without relying on nesting features unless standard CSS nesting is supported, preferring clear `.block__element--modifier` flat selectors for maximum compatibility."
