"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase";
import { clearAuthSession, getAuthSession, saveAuthSession } from "@/utils/auth";

const supabase = createClient();

export default function LoginSiswaPage() {
   const router = useRouter();
   const [nis, setNis] = useState("");
   const [password, setPassword] = useState("");
   const [loading, setLoading] = useState(false);

   useEffect(() => {
      const session = getAuthSession();
      if (!session) return;

      if (session.role === "siswa") {
         router.replace("/dashboard");
         return;
      }

      if (session.role === "admin") {
         router.replace("/kasir");
         return;
      }

      clearAuthSession();
   }, [router]);

   async function handleSubmit(event) {
      event.preventDefault();
      setLoading(true);

      const { data, error } = await supabase
         .from("siswa")
         .select("nis,nama_siswa,kelas,password")
         .eq("nis", nis)
         .maybeSingle();

      if (error) {
         alert("Gagal memeriksa akun siswa.");
         setLoading(false);
         return;
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
   }

   return (
      <main className="auth-page">
         <section className="auth-card">
            <h1>Login Siswa</h1>
            <p>Masuk dengan NIS dan password akun siswa.</p>
            <form onSubmit={handleSubmit} className="auth-form">
               <label>
                  NIS
                  <input value={nis} onChange={(e) => setNis(e.target.value)} required />
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
