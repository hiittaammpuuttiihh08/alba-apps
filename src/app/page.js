import Link from "next/link";
import styles from "./page.module.css"; // Menggunakan CSS Modules untuk custom style

export default function LandingPage() {
  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1>Koperasi Sekolah</h1>
        <p>Selamat datang di sistem informasi dan transaksi digital koperasi.</p>
      </header>

      <section className={styles.grid}>
        {/* Pilihan 1: Masuk sebagai Siswa */}
        <Link href="/login-siswa" className={styles.card}>
          <div className={styles.icon}>🎒</div>
          <h2>Portal Siswa</h2>
          <p>Cek katalog barang terbaru, pantau riwayat belanja, dan lihat status hutang Anda.</p>
        </Link>

        {/* Pilihan 2: Masuk sebagai Admin/Kasir */}
        <Link href="/login-admin" className={styles.card_admin}>
          <div className={styles.icon}>🏪</div>
          <h2>Kasir & Admin</h2>
          <p>Sistem Point of Sale (POS), kelola stok produk, buku hutang, dan laporan finansial harian.</p>
        </Link>
      </section>

      <footer className={styles.footer}>
        <p>&copy; 2026 Koperasi Sekolah Digital. All Rights Reserved.</p>
      </footer>
    </main>
  );
}