"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase";
import Loading from "@/components/Loading";

const supabase = createClient();

export default function ProdukPage() {
   const [products, setProducts] = useState([]);
   const [loading, setLoading] = useState(false);
   const [editingId, setEditingId] = useState(null);
   const [editStockValue, setEditStockValue] = useState(0);

   const [newNama, setNewNama] = useState("");
   const [newHarga, setNewHarga] = useState(0);
   const [newStok, setNewStok] = useState(0);

   useEffect(() => {
      fetchProducts();
   }, []);

   async function fetchProducts() {
      setLoading(true);
      try {
         const { data, error } = await supabase.from("produk").select("id,nama_produk,harga,stok").order("nama_produk", { ascending: true });
         if (error) throw error;
         setProducts(data ?? []);
      } catch (err) {
         console.error(err);
         alert("Gagal memuat produk");
      } finally {
         setLoading(false);
      }
   }

   function startEdit(p) {
      setEditingId(p.id);
      setEditStockValue(p.stok ?? 0);
   }

   async function saveStock(id) {
      setLoading(true);
      try {
         const { error } = await supabase.from("produk").update({ stok: Number(editStockValue) }).eq("id", id);
         if (error) throw error;
         setEditingId(null);
         await fetchProducts();
      } catch (err) {
         console.error(err);
         alert("Gagal memperbarui stok");
      } finally {
         setLoading(false);
      }
   }

   async function handleAddProduct(e) {
      e.preventDefault();
      if (!newNama) return alert("Isi nama produk");
      setLoading(true);
      try {
         const { error } = await supabase
            .from("produk")
            .insert({ nama_produk: newNama, harga: Number(newHarga), stok: Number(newStok) });
         if (error) throw error;
         setNewNama("");
         setNewHarga(0);
         setNewStok(0);
         await fetchProducts();
      } catch (err) {
         console.error(err);
         alert("Gagal menambahkan produk");
      } finally {
         setLoading(false);
      }
   }

   return (
      <div className="produk-page">
         <h1>Manajemen Produk</h1>
         <p>Daftar produk. Edit stok langsung dan tambahkan produk baru.</p>

         <section style={{ marginBottom: 20 }}>
            <form onSubmit={handleAddProduct} style={{ display: "flex", gap: 8, alignItems: "center" }}>
               <input placeholder="Nama produk" value={newNama} onChange={(e) => setNewNama(e.target.value)} />
               <input placeholder="Harga" type="number" value={newHarga} onChange={(e) => setNewHarga(e.target.value)} />
               <input placeholder="Stok" type="number" value={newStok} onChange={(e) => setNewStok(e.target.value)} />
               <button className="btn btn--primary" type="submit" disabled={loading}>Tambah Produk</button>
            </form>
         </section>

         <section>
            {loading && <Loading message="Memuat produk..." size="small" />}
            <table className="produk-table" style={{ width: "100%", borderCollapse: "collapse" }}>
               <thead>
                  <tr>
                     <th style={{ textAlign: "left", padding: 8 }}>Nama</th>
                     <th style={{ textAlign: "right", padding: 8 }}>Harga</th>
                     <th style={{ textAlign: "right", padding: 8 }}>Stok</th>
                     <th style={{ padding: 8 }}>Aksi</th>
                  </tr>
               </thead>
               <tbody>
                  {products.map((p) => (
                     <tr key={p.id} style={{ borderTop: "1px solid #eee" }}>
                        <td style={{ padding: 8 }}>{p.nama_produk}</td>
                        <td style={{ padding: 8, textAlign: "right" }}>Rp {Number(p.harga).toLocaleString()}</td>
                        <td style={{ padding: 8, textAlign: "right" }}>
                           {editingId === p.id ? (
                              <input type="number" value={editStockValue} onChange={(e) => setEditStockValue(e.target.value)} style={{ width: 80 }} />
                           ) : (
                              p.stok ?? 0
                           )}
                        </td>
                        <td style={{ padding: 8 }}>
                           {editingId === p.id ? (
                              <>
                                 <button className="btn btn--primary" onClick={() => saveStock(p.id)} disabled={loading} style={{ marginRight: 8 }}>
                                    Simpan
                                 </button>
                                 <button className="btn" onClick={() => setEditingId(null)}>Batal</button>
                              </>
                           ) : (
                              <>
                                 <button className="btn" onClick={() => startEdit(p)} style={{ marginRight: 8 }}>Edit Stok</button>
                                 <button className="btn" onClick={async () => {
                                    if (!confirm(`Hapus produk ${p.nama_produk}?`)) return;
                                    setLoading(true);
                                    try {
                                       const { error } = await supabase.from('produk').delete().eq('id', p.id);
                                       if (error) throw error;
                                       await fetchProducts();
                                    } catch (err) {
                                       console.error(err);
                                       alert('Gagal menghapus produk');
                                    } finally {
                                       setLoading(false);
                                    }
                                 }}>Hapus</button>
                              </>
                           )}
                        </td>
                     </tr>
                  ))}
                  {products.length === 0 && !loading && (
                     <tr>
                        <td colSpan={4} style={{ padding: 8 }}>Tidak ada produk.</td>
                     </tr>
                  )}
               </tbody>
            </table>
         </section>
      </div>
   );
}
