"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase";
import Loading from "@/components/Loading";
import "./order-siswa.css";

const supabase = createClient();

export default function OrderSiswaPage() {
   const [orders, setOrders] = useState([]);
   const [selectedOrderId, setSelectedOrderId] = useState(null);
   const [orderItems, setOrderItems] = useState([]);
   const [loading, setLoading] = useState(true);
   const [actionLoading, setActionLoading] = useState(false);
   const [message, setMessage] = useState("");
   const [errorMessage, setErrorMessage] = useState("");

   useEffect(() => {
      fetchOrders();
   }, []);

   async function fetchOrders() {
      setLoading(true);
      setErrorMessage("");
      try {
         const { data, error } = await supabase
            .from("order_siswa")
            .select(`id,created_at,total_harga,metode_pembayaran,status_order,status_pembayaran,keterangan,siswa(nis,nama_siswa,kelas,saldo,total_hutang)`)
            .order("created_at", { ascending: false });

         if (error) throw error;
         setOrders(data ?? []);
      } catch (error) {
         console.error(error);
         setErrorMessage("Gagal memuat order siswa.");
      } finally {
         setLoading(false);
      }
   }

   async function fetchOrderItems(orderId) {
      setActionLoading(true);
      setErrorMessage("");
      try {
         const { data, error } = await supabase
            .from("detail_order_siswa")
            .select("id,produk_id,jumlah,harga_satuan,produk(nama_produk)")
            .eq("order_id", orderId);

         if (error) throw error;
         setOrderItems(data ?? []);
      } catch (error) {
         console.error(error);
         setErrorMessage("Gagal memuat detail order.");
      } finally {
         setActionLoading(false);
      }
   }

   const selectedOrder = useMemo(
      () => orders.find((order) => order.id === selectedOrderId) ?? null,
      [orders, selectedOrderId]
   );

   const pendingOrders = useMemo(
      () => orders.filter((order) => order.status_order === "Menunggu"),
      [orders]
   );

   const completedOrders = useMemo(
      () => orders.filter((order) => order.status_order !== "Menunggu"),
      [orders]
   );

   function handleSelectOrder(orderId) {
      setSelectedOrderId(orderId);
      setOrderItems([]);
      void fetchOrderItems(orderId);
   }

   async function updateOrderStatus(order, updates, notification) {
      setActionLoading(true);
      setErrorMessage("");
      try {
         const { error: orderError } = await supabase
            .from("order_siswa")
            .update(updates)
            .eq("id", order.id);
         if (orderError) throw orderError;

         setMessage(notification);
         await fetchOrders();
         if (selectedOrderId === order.id) {
            await fetchOrderItems(order.id);
         }
      } catch (error) {
         console.error(error);
         setErrorMessage("Gagal memperbarui status order.");
      } finally {
         setActionLoading(false);
      }
   }

   async function handleConfirm(order) {
      if (!order?.siswa) {
         setErrorMessage("Data siswa tidak tersedia untuk order ini.");
         return;
      }

      const currentSaldo = Number(order.siswa.saldo ?? 0);
      const currentHutang = Number(order.siswa.total_hutang ?? 0);
      const totalHarga = Number(order.total_harga ?? 0);
      const updates = { status_order: "Dikonfirmasi" };

      if (order.metode_pembayaran === "Saldo") {
         if (currentSaldo < totalHarga) {
            setErrorMessage("Saldo siswa tidak cukup untuk pembayaran order ini.");
            return;
         }
         updates.status_pembayaran = "Lunas";
         const newSaldo = currentSaldo - totalHarga;
         const transactionId = `trx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

         setActionLoading(true);
         try {
            const [{ error: updateSaldoError }, { error: orderError }, { error: transactionError }] = await Promise.all([
               supabase.from("siswa").update({ saldo: newSaldo }).eq("nis", order.siswa.nis),
               supabase.from("order_siswa").update(updates).eq("id", order.id),
               supabase.from("transaksi").insert({
                  id: transactionId,
                  nis_siswa: order.siswa.nis,
                  total_bayar: totalHarga,
                  metode_pembayaran: "Pelunasan",
                  status_pembayaran: "Lunas",
               }),
            ]);

            if (updateSaldoError || orderError || transactionError) throw updateSaldoError || orderError || transactionError;

            setMessage("Order berhasil dikonfirmasi dan saldo siswa dikurangi.");
            await fetchOrders();
            if (selectedOrderId === order.id) await fetchOrderItems(order.id);
         } catch (error) {
            console.error(error);
            setErrorMessage("Gagal mengonfirmasi order dengan pembayaran saldo.");
         } finally {
            setActionLoading(false);
         }
         return;
      }

      if (order.metode_pembayaran === "Hutang") {
         const newHutang = currentHutang + totalHarga;
         setActionLoading(true);
         try {
            const [{ error: updateHutangError }, { error: orderError }] = await Promise.all([
               supabase.from("siswa").update({ total_hutang: newHutang }).eq("nis", order.siswa.nis),
               supabase.from("order_siswa").update({ ...updates, status_pembayaran: "Belum Lunas" }).eq("id", order.id),
            ]);
            if (updateHutangError || orderError) throw updateHutangError || orderError;

            setMessage("Order hutang berhasil dikonfirmasi dan total hutang siswa diperbarui.");
            await fetchOrders();
            if (selectedOrderId === order.id) await fetchOrderItems(order.id);
         } catch (error) {
            console.error(error);
            setErrorMessage("Gagal mengonfirmasi order hutang.");
         } finally {
            setActionLoading(false);
         }
         return;
      }

      await updateOrderStatus(order, { ...updates, status_pembayaran: order.status_pembayaran }, "Order berhasil dikonfirmasi.");
   }

   async function handleReject(order) {
      await updateOrderStatus(order, { status_order: "Ditolak" }, "Order ditolak.");
   }

   return (
      <div className="order-siswa-page">
         <div className="page-header">
            <h1>Order Siswa</h1>
            <p>Kelola order self-service dari siswa dan konfirmasi status pembayaran atau hutang.</p>
         </div>

         {loading ? (
            <Loading message="Memuat order siswa..." />
         ) : (
            <>
               {errorMessage && <div className="page-message page-message--error">{errorMessage}</div>}
               {message && <div className="page-message page-message--success">{message}</div>}

               <div className="order-siswa-layout">
                  <section className="order-siswa-list-panel">
                     <div className="panel-title">Daftar Order</div>

                     <div className="order-group-card">
                        <div className="order-group-card__header">
                           <div>
                              <h3>Menunggu Konfirmasi</h3>
                              <p>Order yang perlu diproses admin.</p>
                           </div>
                           <span>{pendingOrders.length}</span>
                        </div>
                        <div className="order-list">
                           {pendingOrders.length === 0 ? (
                              <div className="order-card-empty">Tidak ada order yang menunggu konfirmasi.</div>
                           ) : (
                              pendingOrders.map((order) => (
                                 <div
                                    key={order.id}
                                    className={selectedOrderId === order.id ? "order-card order-card--selected" : "order-card"}
                                    onClick={() => handleSelectOrder(order.id)}
                                 >
                                    <div className="order-card__top">
                                       <div>
                                          <div className="order-card__name">{order.siswa?.nama_siswa ?? "-"}</div>
                                          <div className="order-card__nis">NIS {order.siswa?.nis ?? "-"}</div>
                                       </div>
                                       <div className="order-card__total">Rp {Number(order.total_harga ?? 0).toLocaleString()}</div>
                                    </div>
                                    <div className="order-card__meta">
                                       <span>{new Date(order.created_at).toLocaleString("id-ID")}</span>
                                       <span>{order.metode_pembayaran}</span>
                                    </div>
                                    <div className="order-card__status">Status bayar: {order.status_pembayaran}</div>
                                 </div>
                              ))
                           )}
                        </div>
                     </div>

                     <div className="order-group-card order-group-card--done">
                        <div className="order-group-card__header order-group-card__header--done">
                           <div>
                              <h3>Sudah Selesai</h3>
                              <p>Order yang sudah dikonfirmasi atau ditolak.</p>
                           </div>
                           <span>{completedOrders.length}</span>
                        </div>
                        <div className="order-list">
                           {completedOrders.length === 0 ? (
                              <div className="order-card-empty">Belum ada order yang selesai.</div>
                           ) : (
                              completedOrders.map((order) => (
                                 <div
                                    key={order.id}
                                    className={selectedOrderId === order.id ? "order-card order-card--selected" : "order-card"}
                                    onClick={() => handleSelectOrder(order.id)}
                                 >
                                    <div className="order-card__top">
                                       <div>
                                          <div className="order-card__name">{order.siswa?.nama_siswa ?? "-"}</div>
                                          <div className="order-card__nis">NIS {order.siswa?.nis ?? "-"}</div>
                                       </div>
                                       <div className="order-card__total">Rp {Number(order.total_harga ?? 0).toLocaleString()}</div>
                                    </div>
                                    <div className="order-card__meta">
                                       <span>{new Date(order.created_at).toLocaleString("id-ID")}</span>
                                       <span>{order.metode_pembayaran}</span>
                                    </div>
                                    <div className="order-card__status">Status: {order.status_order}</div>
                                 </div>
                              ))
                           )}
                        </div>
                     </div>
                  </section>

                  <aside className="order-siswa-details-panel">
                     <div className="panel-title">Detail Order</div>
                     {selectedOrder ? (
                        <>
                           <div className="detail-block">
                              <div>
                                 <div className="detail-label">NIS</div>
                                 <div>{selectedOrder.siswa?.nis ?? "-"}</div>
                              </div>
                              <div>
                                 <div className="detail-label">Nama</div>
                                 <div>{selectedOrder.siswa?.nama_siswa ?? "-"}</div>
                              </div>
                              <div>
                                 <div className="detail-label">Metode</div>
                                 <div>{selectedOrder.metode_pembayaran}</div>
                              </div>
                              <div>
                                 <div className="detail-label">Status Order</div>
                                 <div>{selectedOrder.status_order}</div>
                              </div>
                              <div>
                                 <div className="detail-label">Status Bayar</div>
                                 <div>{selectedOrder.status_pembayaran}</div>
                              </div>
                              <div>
                                 <div className="detail-label">Total Harga</div>
                                 <div>Rp {Number(selectedOrder.total_harga ?? 0).toLocaleString()}</div>
                              </div>
                           </div>

                           <div className="detail-block">
                              <div className="detail-label">Catatan</div>
                              <div className="detail-note">{selectedOrder.keterangan || "Tidak ada catatan."}</div>
                           </div>

                           <div className="detail-block detail-block--items">
                              <div className="detail-title">Items</div>
                              <div className="order-items-wrap">
                                 {actionLoading ? (
                                    <Loading message="Memuat item order..." size="small" />
                                 ) : orderItems.length === 0 ? (
                                    <div className="order-items-empty">Pilih order untuk melihat detail item.</div>
                                 ) : (
                                    <table className="order-items-table">
                                       <thead>
                                          <tr>
                                             <th>Produk</th>
                                             <th>Jumlah</th>
                                             <th>Harga</th>
                                             <th>Subtotal</th>
                                          </tr>
                                       </thead>
                                       <tbody>
                                          {orderItems.map((item) => (
                                             <tr key={item.id}>
                                                <td>{item.produk?.nama_produk ?? `Produk ${item.produk_id}`}</td>
                                                <td>{item.jumlah}</td>
                                                <td>Rp {Number(item.harga_satuan).toLocaleString()}</td>
                                                <td>Rp {Number(item.harga_satuan * item.jumlah).toLocaleString()}</td>
                                             </tr>
                                          ))}
                                       </tbody>
                                    </table>
                                 )}
                              </div>
                           </div>

                           <div className="order-actions">
                              <button
                                 className="btn btn--primary"
                                 onClick={() => handleConfirm(selectedOrder)}
                                 disabled={selectedOrder.status_order !== "Menunggu" || actionLoading}
                              >
                                 {selectedOrder.status_order === "Menunggu" ? "Konfirmasi Order" : "Order Sudah Selesai"}
                              </button>
                              <button
                                 className="btn btn--danger"
                                 onClick={() => handleReject(selectedOrder)}
                                 disabled={selectedOrder.status_order !== "Menunggu" || actionLoading}
                              >
                                 {selectedOrder.status_order === "Menunggu" ? "Tolak Order" : "Aksi Tidak Tersedia"}
                              </button>
                           </div>
                        </>
                     ) : (
                        <div className="order-siswa-empty-detail">Pilih order untuk melihat detail dan aksi.</div>
                     )}
                  </aside>
               </div>
            </>
         )}
      </div>
   );
}
