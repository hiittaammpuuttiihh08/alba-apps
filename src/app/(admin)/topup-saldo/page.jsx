"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase";

const supabase = createClient();

export default function AdminTopupSaldoPage() {
   const [siswa, setSiswa] = useState([]);
   const [selectedSiswa, setSelectedSiswa] = useState("");
   const [amount, setAmount] = useState("");
   const [method, setMethod] = useState("Tunai");
   const [note, setNote] = useState("");
   const [loading, setLoading] = useState(false);

   useEffect(() => {
      fetchSiswa();
   }, []);

   async function fetchSiswa() {
      const { data, error } = await supabase
         .from("siswa")
         .select("nis,nama_siswa,kelas,saldo")
         .order("nis", { ascending: true });

      if (error) {
         console.error(error);
         return;
      }

      setSiswa(data ?? []);
   }

   async function handleTopup(event) {
      event.preventDefault();
      const amountValue = Number(amount);

      if (!selectedSiswa) return alert("Pilih siswa terlebih dahulu.");
      if (!amountValue || amountValue <= 0) return alert("Jumlah top-up harus lebih besar dari 0.");

      setLoading(true);
      try {
         const student = siswa.find((item) => String(item.nis) === String(selectedSiswa));
         if (!student) return alert("Siswa tidak ditemukan.");

         const newSaldo = Number(student.saldo ?? 0) + amountValue;
         const { error: updateError } = await supabase.from("siswa").update({ saldo: newSaldo }).eq("nis", selectedSiswa);
         if (updateError) throw updateError;

         const { error: insertError } = await supabase.from("topup_saldo").insert({
            nis_siswa: selectedSiswa,
            jumlah: amountValue,
            metode: method,
            keterangan: note || null,
         });
         if (insertError) throw insertError;

         alert("Top-up saldo berhasil.");
         setAmount("");
         setNote("");
         await fetchSiswa();
      } catch (error) {
         console.error(error);
         alert("Gagal melakukan top-up saldo.");
      } finally {
         setLoading(false);
      }
   }

   return (
      <div className="page-content">
         <div className="page-header">
            <h1>Top-Up Saldo</h1>
            <p>Tambahkan saldo siswa tanpa mencampur dengan transaksi kasir.</p>
         </div>

         <form onSubmit={handleTopup} className="admin-form">
            <div className="form-row">
               <label>
                  Pilih Siswa
                  <select value={selectedSiswa} onChange={(e) => setSelectedSiswa(e.target.value)}>
                     <option value="">-- Pilih --</option>
                     {siswa.map((item) => (
                        <option key={item.nis} value={item.nis}>
                           {item.nis} - {item.nama_siswa} ({item.kelas}) - Saldo: Rp {Number(item.saldo ?? 0).toLocaleString()}
                        </option>
                     ))}
                  </select>
               </label>
            </div>

            <div className="form-row">
               <label>
                  Jumlah Top-Up
                  <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Masukkan jumlah" />
               </label>
            </div>

            <div className="form-row">
               <label>
                  Metode
                  <select value={method} onChange={(e) => setMethod(e.target.value)}>
                     <option value="Tunai">Tunai</option>
                     <option value="Transfer">Transfer</option>
                     <option value="Lainnya">Lainnya</option>
                  </select>
               </label>
            </div>

            <div className="form-row">
               <label>
                  Keterangan
                  <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Keterangan (opsional)" />
               </label>
            </div>

            <button type="submit" className="btn btn--primary" disabled={loading}>
               {loading ? "Memproses..." : "Top-Up Saldo"}
            </button>
         </form>
      </div>
   );
}
