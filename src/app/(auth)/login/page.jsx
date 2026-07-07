"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase";
import { clearAuthSession, getAuthSession, saveAuthSession } from "@/utils/auth";

const supabase = createClient();

function UnifiedLoginContent() {
   const router = useRouter();
   const [identifier, setIdentifier] = useState("");
   const [password, setPassword] = useState("");
   const [loading, setLoading] = useState(false);

   useEffect(() => {
      const session = getAuthSession();
      if (!session) return;

      if (session.role === "admin") {
         router.replace("/admin");
         return;
      }

      if (session.role === "siswa") {
         router.replace("/dashboard");
         return;
      }

      clearAuthSession();
   }, [router]);

   async function handleSubmit(event) {
      event.preventDefault();
      setLoading(true);

      const normalizedIdentifier = String(identifier).trim();

      if (normalizedIdentifier.toLowerCase() === "admin") {
         if (password !== "password123") {
            alert("Username atau password admin salah.");
            setLoading(false);
            return;
         }

         saveAuthSession({ role: "admin", username: "admin" });
         router.replace("/admin");
         return;
      }

      if (!/^\d+$/.test(normalizedIdentifier)) {
         alert("Masukkan NIS siswa yang valid.");
         setLoading(false);
         return;
      }

      try {
         const { data, error } = await supabase
            .from("siswa")
            .select("nis,nama_siswa,kelas,password")
            .eq("nis", Number(normalizedIdentifier))
            .maybeSingle();

         if (error) {
            throw error;
         }

         if (!data) {
            alert("NIS tidak ditemukan.");
            setLoading(false);
            return;
         }

         if (String(data.password) !== String(password)) {
            alert("Password salah.");
            setLoading(false);
            return;
         }

         saveAuthSession({
            role: "siswa",
            nis: data.nis,
            nama: data.nama_siswa,
            kelas: data.kelas,
         });

         router.replace("/dashboard");
      } catch (error) {
         console.error(error);
         alert("Gagal memeriksa akun siswa.");
      } finally {
         setLoading(false);
      }
   }

   return (
      <main className="auth-page">
         <section className="auth-card">
            <h1>Masuk ke Koperasi</h1>
            <p>Masukkan username admin atau NIS siswa untuk masuk ke sistem.</p>

            <form onSubmit={handleSubmit} className="auth-form">
               <label>
                  Username / NIS
                  <input
                     value={identifier}
                     onChange={(e) => setIdentifier(e.target.value)}
                     placeholder="admin atau 1001"
                     required
                  />
               </label>
               <label>
                  Password
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
               </label>
               <button type="submit" disabled={loading} className="btn btn--primary">
                  {loading ? "Memproses..." : "Masuk"}
               </button>
            </form>
         </section>
      </main>
   );
}

export default function UnifiedLoginPage() {
   return (
      <Suspense fallback={<main className="auth-page"><section className="auth-card"><p>Memuat form login...</p></section></main>}>
         <UnifiedLoginContent />
      </Suspense>
   );
}
