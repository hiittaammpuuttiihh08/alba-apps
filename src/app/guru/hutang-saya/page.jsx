"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase";
import { getAuthSession } from "@/utils/auth";
import Loading from "@/components/Loading";
import "./hutang.css";

const supabase = createClient();

export default function GuruHutangPage() {
   const [teacher, setTeacher] = useState(null);
   const [hutangHistory, setHutangHistory] = useState([]);
   const [loading, setLoading] = useState(true);
   const [errorMessage, setErrorMessage] = useState("");
   const [paymentAmount, setPaymentAmount] = useState("");
   const [processing, setProcessing] = useState(false);

   useEffect(() => {
      async function fetchData() {
         setLoading(true);
         setErrorMessage("");

         try {
            const session = getAuthSession();
            const nipSession = session?.role === "guru" ? session.nip : null;
            if (!nipSession) {
               setTeacher(null);
               setHutangHistory([]);
               return;
            }

            const { data: guruData, error: guruError } = await supabase
               .from("guru")
               .select("nip,nama_guru,bidang_studi,saldo,total_hutang")
               .eq("nip", nipSession)
               .maybeSingle();

            if (guruError) throw guruError;
            if (!guruData) {
               setTeacher(null);
               setHutangHistory([]);
               return;
            }

            setTeacher(guruData);
            setPaymentAmount(guruData.total_hutang ?? "");

            const { data: historyData, error: historyError } = await supabase
               .from("order_guru")
               .select("id,created_at,total_harga,metode_pembayaran,status_pembayaran")
               .eq("nip_guru", nipSession)
               .order("created_at", { ascending: false });

            if (historyError) throw historyError;
            setHutangHistory(historyData ?? []);
         } catch (error) {
            console.error(error);
            setErrorMessage("Gagal memuat data hutang.");
         } finally {
            setLoading(false);
         }
      }

      fetchData();
   }, []);

   async function handlePayHutang() {
      if (!teacher) return;
      const amount = Number(paymentAmount);
      if (!amount || amount <= 0) {
         return alert("Masukkan nominal pembayaran yang valid.");
      }

      const currentHutang = Number(teacher.total_hutang ?? 0);
      if (amount > currentHutang) {
         return alert("Nominal pembayaran tidak boleh melebihi total hutang.");
      }

      if (amount > Number(teacher.saldo ?? 0)) {
         return alert("Saldo tidak cukup untuk membayar hutang ini.");
      }

      setProcessing(true);
      try {
         const newSaldo = Number(teacher.saldo ?? 0) - amount;
         const newHutang = Math.max(0, currentHutang - amount);

         const { error: updateError } = await supabase
            .from("guru")
            .update({ saldo: newSaldo, total_hutang: newHutang })
            .eq("nip", teacher.nip);

         if (updateError) throw updateError;

         setTeacher({ ...teacher, saldo: newSaldo, total_hutang: newHutang });
         setPaymentAmount(newHutang);

         alert("Pembayaran hutang berhasil.");
      } catch (error) {
         console.error(error);
         alert("Gagal memproses pembayaran hutang.");
      } finally {
         setProcessing(false);
      }
   }

   return (
      <div className="guru-hutang">
         <div className="page-header">
            <h1>Hutang Saya</h1>
            <p>Gunakan saldo Anda untuk membayar hutang dan lihat riwayat transaksi.</p>
         </div>

         {loading ? (
            <Loading message="Memuat data hutang..." />
         ) : errorMessage ? (
            <div className="page-message page-message--error">{errorMessage}</div>
         ) : !teacher ? (
            <div className="page-message">Guru tidak ditemukan.</div>
         ) : (
            <>
               <div className="hutang-overview">
                  <div className="hutang-card">
                     <div className="hutang-card__label">Total Hutang</div>
                     <div className={`hutang-card__amount ${teacher.total_hutang === 0 ? "hutang-card__amount--zero" : ""}`}>
                        Rp {Number(teacher.total_hutang ?? 0).toLocaleString()}
                     </div>
                  </div>

                  <div className="hutang-card">
                     <div className="hutang-card__label">Saldo Tersedia</div>
                     <div className="hutang-card__amount" style={{ color: "#27ae60" }}>
                        Rp {Number(teacher.saldo ?? 0).toLocaleString()}
                     </div>
                  </div>
               </div>

               {teacher.total_hutang > 0 && (
                  <div className="hutang-form">
                     <div className="hutang-form__title">Bayar Hutang</div>
                     <div className="form-group">
                        <label>Nominal Pembayaran</label>
                        <input
                           type="number"
                           value={paymentAmount}
                           onChange={(e) => setPaymentAmount(e.target.value)}
                           min="0"
                           max={teacher.total_hutang}
                           disabled={processing}
                        />
                     </div>
                     <button
                        onClick={handlePayHutang}
                        disabled={processing}
                        className="btn btn--primary"
                        style={{ width: "100%" }}
                     >
                        {processing ? "Memproses..." : "Bayar Hutang"}
                     </button>
                  </div>
               )}

               <div className="hutang-history">
                  <div className="hutang-history__title">Riwayat Pesanan dengan Hutang</div>
                  {hutangHistory.length === 0 ? (
                     <div className="page-message">Tidak ada riwayat hutang.</div>
                  ) : (
                     <table className="history-table">
                        <thead>
                           <tr>
                              <th>ID Pesanan</th>
                              <th>Jumlah</th>
                              <th>Metode</th>
                              <th>Status Order</th>
                              <th>Status Bayar</th>
                              <th>Tanggal</th>
                           </tr>
                        </thead>
                        <tbody>
                           {hutangHistory.map((item) => (
                              <tr key={item.id}>
                                 <td>{item.id.substring(0, 12)}</td>
                                 <td>Rp {Number(item.total_harga).toLocaleString()}</td>
                                 <td>{item.metode_pembayaran}</td>
                                 <td>
                                    <span className={`status-badge ${item.status_order === "Dikonfirmasi" ? "status-badge--success" : ""}`}>
                                       {item.status_order}
                                    </span>
                                 </td>
                                 <td>
                                    <span className={`status-badge ${item.status_pembayaran === "Lunas" ? "status-badge--success" : "status-badge--error"}`}>
                                       {item.status_pembayaran}
                                    </span>
                                 </td>
                                 <td>{new Date(item.created_at).toLocaleDateString("id-ID")}</td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  )}
               </div>
            </>
         )}
      </div>
   );
}
