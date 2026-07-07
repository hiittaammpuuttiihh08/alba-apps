"use client";

import { useRouter } from "next/navigation";

export default function NotFound() {
   const router = useRouter();

   function handleBack() {
      if (window.history.length > 1) {
         router.back();
         return;
      }
      router.replace("/");
   }

   return (
      <main className="auth-page" style={{ padding: "0 2rem" }}>
         <div style={{ textAlign: "center", width: "100%", padding: "4rem 0" }}>
            <h1
               style={{
                  fontSize: "5rem",
                  margin: 0,
                  lineHeight: 1,
                  letterSpacing: "-0.08em",
                  background: "linear-gradient(90deg, #3b82f6, #8b5cf6)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
               }}
            >
               Oops!
            </h1>
            <p style={{ margin: "1rem 0 0.25rem", fontWeight: 700, fontSize: "1.25rem" }}>
               404 - Halaman Tidak Ditemukan
            </p>
            <p style={{ marginBottom: "2rem", color: "#4b5563", maxWidth: "36rem", margin: "0 auto" }}>
               Halaman yang Anda cari mungkin telah dihapus, namanya diubah, atau sementara tidak tersedia.
            </p>
            <button type="button" onClick={handleBack} className="btn btn--primary" style={{ minWidth: "220px" }}>
               Kembali ke Halaman Sebelumnya
            </button>
         </div>
      </main>
   );
}
