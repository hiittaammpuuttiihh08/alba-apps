"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase";
import { getAuthSession } from "@/utils/auth";
import "./saldo.css";

const supabase = createClient();

export default function SiswaSaldoPage() {
   const [student, setStudent] = useState(null);
   const [topups, setTopups] = useState([]);
   const [loading, setLoading] = useState(true);
   const [errorMessage, setErrorMessage] = useState("");

   useEffect(() => {
      async function fetchSaldo() {
         setLoading(true);
         setErrorMessage("");

         try {
            const session = getAuthSession();
            const nisSession = session?.role === "siswa" ? session.nis : null;
            if (!nisSession) {
               setStudent(null);
               setTopups([]);
               return;
            }

            const { data: siswaData, error: siswaError } = await supabase
               .from("siswa")
               .select("nis,nama_siswa,saldo")
               .eq("nis", nisSession)
               .maybeSingle();

            if (siswaError) throw siswaError;
            const activeStudent = siswaData ?? null;
            if (!activeStudent) {
               setStudent(null);
               setTopups([]);
               return;
            }

            setStudent(activeStudent);

            const { data: topupData, error: topupError } = await supabase
               .from("topup_saldo")
               .select("id,jumlah,metode,keterangan,created_at")
               .eq("nis_siswa", activeStudent.nis)
               .order("created_at", { ascending: false });

            if (topupError) {
               setTopups([]);
               return;
            }

            setTopups(topupData ?? []);
         } catch (error) {
            console.error(error);
            setErrorMessage("Gagal memuat data saldo.");
         } finally {
            setLoading(false);
         }
      }

      fetchSaldo();
   }, []);

   return (
      <div className="page-content">
         <div className="page-header">
            <h1>Saldo Siswa</h1>
            <p>Informasi saldo dan riwayat top-up untuk akun Anda.</p>
         </div>

         {loading ? (
            <div className="page-message">Memuat data saldo...</div>
         ) : errorMessage ? (
            <div className="page-message page-message--error">{errorMessage}</div>
         ) : !student ? (
            <div className="page-message">Siswa tidak ditemukan.</div>
         ) : (
            <>
               <div className="saldo-card">
                  <div className="saldo-card__label">Saldo saat ini</div>
                  <div className="saldo-card__value">Rp {Number(student.saldo ?? 0).toLocaleString()}</div>
                  <div className="saldo-card__meta">NIS: {student.nis} · {student.nama_siswa}</div>
               </div>

               <div className="history-section">
                  <h2>Riwayat Top-Up</h2>
                  <p>Catatan pengisian saldo yang tersimpan dalam sistem.</p>

                  {topups.length === 0 ? (
                     <div className="page-message">Belum ada riwayat top-up.</div>
                  ) : (
                     <div className="history-table-wrap">
                        <table className="history-table">
                           <thead>
                              <tr>
                                 <th>Tanggal</th>
                                 <th>Jumlah</th>
                                 <th>Metode</th>
                                 <th>Keterangan</th>
                              </tr>
                           </thead>
                           <tbody>
                              {topups.map((item) => (
                                 <tr key={item.id}>
                                    <td>{new Date(item.created_at).toLocaleString("id-ID")}</td>
                                    <td>Rp {Number(item.jumlah).toLocaleString()}</td>
                                    <td>{item.metode}</td>
                                    <td>{item.keterangan || "-"}</td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  )}
               </div>
            </>
         )}
      </div>
   );
}
