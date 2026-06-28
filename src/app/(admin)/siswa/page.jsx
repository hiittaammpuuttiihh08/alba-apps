"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase";

const supabase = createClient();

export default function SiswaPage() {
   const [students, setStudents] = useState([]);
   const [loading, setLoading] = useState(false);

   const [nis, setNis] = useState("");
   const [nama, setNama] = useState("");
   const [kelas, setKelas] = useState("");
   const [password, setPassword] = useState("");
   const [editingNis, setEditingNis] = useState(null);
   const [editNama, setEditNama] = useState("");
   const [editKelas, setEditKelas] = useState("");
   const [editPassword, setEditPassword] = useState("");

   useEffect(() => {
      fetchStudents();
   }, []);

   async function fetchStudents() {
      setLoading(true);
      try {
         const { data, error } = await supabase.from("siswa").select("nis,nama_siswa,kelas,total_hutang").order("nis", { ascending: true });
         if (error) throw error;
         setStudents(data ?? []);
      } catch (err) {
         console.error(err);
         alert("Gagal memuat data siswa");
      } finally {
         setLoading(false);
      }
   }

   async function handleAdd(e) {
      e.preventDefault();
      if (!nis || !nama) return alert("Isi NIS dan nama siswa");
      setLoading(true);
      try {
         const payload = {
            nis: Number(nis),
            nama_siswa: nama,
            kelas: kelas || null,
            password: password || "",
            total_hutang: 0,
         };
         const { error } = await supabase.from("siswa").insert(payload);
         if (error) throw error;
         setNis("");
         setNama("");
         setKelas("");
         setPassword("");
         await fetchStudents();
      } catch (err) {
         console.error(err);
         alert("Gagal menambahkan siswa");
      } finally {
         setLoading(false);
      }
   }

   async function handleDelete(nisVal) {
      if (!confirm(`Hapus siswa dengan NIS ${nisVal}?`)) return;
      setLoading(true);
      try {
         const { error } = await supabase.from("siswa").delete().eq("nis", nisVal);
         if (error) throw error;
         await fetchStudents();
      } catch (err) {
         console.error(err);
         alert("Gagal menghapus siswa");
      } finally {
         setLoading(false);
      }
   }

   function startEdit(s) {
      setEditingNis(s.nis);
      setEditNama(s.nama_siswa || "");
      setEditKelas(s.kelas || "");
      setEditPassword("");
   }

   function cancelEdit() {
      setEditingNis(null);
      setEditNama("");
      setEditKelas("");
      setEditPassword("");
   }

   async function saveEdit(nisVal) {
      setLoading(true);
      try {
         const payload = { nama_siswa: editNama, kelas: editKelas };
         if (editPassword) payload.password = editPassword;
         const { error } = await supabase.from("siswa").update(payload).eq("nis", nisVal);
         if (error) throw error;
         cancelEdit();
         await fetchStudents();
      } catch (err) {
         console.error(err);
         alert("Gagal memperbarui data siswa");
      } finally {
         setLoading(false);
      }
   }

   return (
      <div className="siswa-page">
         <h1>Daftar Siswa</h1>
         <p>Menampilkan semua siswa. Tambah siswa baru dengan mengisi form.</p>

         <section style={{ marginBottom: 20 }}>
            <form onSubmit={handleAdd} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
               <input placeholder="NIS" value={nis} onChange={(e) => setNis(e.target.value)} />
               <input placeholder="Nama siswa" value={nama} onChange={(e) => setNama(e.target.value)} />
               <input placeholder="Kelas" value={kelas} onChange={(e) => setKelas(e.target.value)} />
               <input placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
               <button className="btn btn--primary" type="submit" disabled={loading}>Tambah Siswa</button>
            </form>
         </section>

         <section>
            {loading && <div>Loading...</div>}
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
               <thead>
                  <tr>
                     <th style={{ textAlign: "left", padding: 8 }}>NIS</th>
                     <th style={{ textAlign: "left", padding: 8 }}>Nama</th>
                     <th style={{ textAlign: "left", padding: 8 }}>Kelas</th>
                     <th style={{ textAlign: "right", padding: 8 }}>Total Hutang</th>
                     <th style={{ padding: 8 }}>Aksi</th>
                  </tr>
               </thead>
               <tbody>
                  {students.map((s) => (
                     <tr key={s.nis} style={{ borderTop: "1px solid #eee" }}>
                        <td style={{ padding: 8 }}>{s.nis}</td>
                        <td style={{ padding: 8 }}>
                           {editingNis === s.nis ? (
                              <input value={editNama} onChange={(e) => setEditNama(e.target.value)} />
                           ) : (
                              s.nama_siswa
                           )}
                        </td>
                        <td style={{ padding: 8 }}>
                           {editingNis === s.nis ? (
                              <input value={editKelas} onChange={(e) => setEditKelas(e.target.value)} />
                           ) : (
                              s.kelas
                           )}
                        </td>
                        <td style={{ padding: 8, textAlign: "right" }}>Rp {Number(s.total_hutang || 0).toLocaleString()}</td>
                        <td style={{ padding: 8 }}>
                           {editingNis === s.nis ? (
                              <>
                                 <input placeholder="Password baru" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} style={{ marginRight: 8 }} />
                                 <button className="btn btn--primary" onClick={() => saveEdit(s.nis)} disabled={loading} style={{ marginRight: 8 }}>Simpan</button>
                                 <button className="btn" onClick={cancelEdit}>Batal</button>
                              </>
                           ) : (
                              <>
                                 <button className="btn" onClick={() => startEdit(s)} style={{ marginRight: 8 }}>Edit</button>
                                 <button className="btn" onClick={() => handleDelete(s.nis)}>Hapus</button>
                              </>
                           )}
                        </td>
                     </tr>
                  ))}
                  {students.length === 0 && !loading && (
                     <tr>
                        <td colSpan={5} style={{ padding: 8 }}>Tidak ada siswa.</td>
                     </tr>
                  )}
               </tbody>
            </table>
         </section>
      </div>
   );
}
