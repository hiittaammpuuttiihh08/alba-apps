"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase";
import Loading from "@/components/Loading";
import {
   Area,
   AreaChart,
   Bar,
   BarChart,
   CartesianGrid,
   Legend,
   Line,
   LineChart,
   ResponsiveContainer,
   Tooltip,
   XAxis,
   YAxis,
} from "recharts";
import "./dashboard.css";

const supabase = createClient();

export default function AdminDashboardPage() {
   const [productCount, setProductCount] = useState(0);
   const [studentCount, setStudentCount] = useState(0);
   const [txnCountToday, setTxnCountToday] = useState(0);
   const [revenueToday, setRevenueToday] = useState(0);
   const [topupCount, setTopupCount] = useState(0);
   const [orderCount, setOrderCount] = useState(0);
   const [orderRevenue, setOrderRevenue] = useState(0);
   const [ordersData, setOrdersData] = useState([]);
   const [latestTransactions, setLatestTransactions] = useState([]);
   const [chartData, setChartData] = useState([]);
   const [loading, setLoading] = useState(false);

   useEffect(() => {
      const loadMetrics = async () => {
         setLoading(true);
         try {
            const [{ data: produk }, { data: siswa }, { data: txns }, { data: topups }, { data: orders }] = await Promise.all([
               supabase.from("produk").select("id"),
               supabase.from("siswa").select("nis"),
               supabase.from("transaksi").select("id,total_bayar,metode_pembayaran,status_pembayaran,created_at").order("created_at", { ascending: false }).limit(8),
               supabase.from("topup_saldo").select("id"),
               supabase.from("order_siswa").select("id,total_harga,metode_pembayaran,created_at"),
            ]);

            setProductCount(produk?.length ?? 0);
            setStudentCount(siswa?.length ?? 0);
            setTxnCountToday((txns ?? []).filter((trx) => new Date(trx.created_at).toDateString() === new Date().toDateString()).length);
            setRevenueToday((txns ?? []).reduce((s, t) => s + Number(t.total_bayar || 0), 0));
            setTopupCount(topups?.length ?? 0);
            setOrderCount(orders?.length ?? 0);
            setOrderRevenue((orders ?? []).reduce((s, order) => s + Number(order.total_harga || 0), 0));
            setOrdersData(orders ?? []);
            setLatestTransactions(txns ?? []);

            const grouped = (orders ?? []).reduce((acc, order) => {
               const date = new Date(order.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
               const item = acc.find((row) => row.name === date);
               if (item) {
                  item.orders += 1;
                  item.revenue += Number(order.total_harga || 0);
               } else {
                  acc.push({ name: date, orders: 1, revenue: Number(order.total_harga || 0) });
               }
               return acc;
            }, []);

            const lastSeven = [...grouped]
               .sort((a, b) => new Date(a.name) - new Date(b.name))
               .slice(-7);
            setChartData(lastSeven.length ? lastSeven : [{ name: "-", orders: 0, revenue: 0 }]);
         } catch (err) {
            console.error(err);
         } finally {
            setLoading(false);
         }
      };

      void loadMetrics();
   }, []);

   const revenueLabel = useMemo(() => `Rp ${Number(revenueToday).toLocaleString()}`, [revenueToday]);
   const orderRevenueLabel = useMemo(() => `Rp ${Number(orderRevenue).toLocaleString()}`, [orderRevenue]);

   const monthNames = useMemo(() => {
      const now = new Date();
      return {
         current: new Intl.DateTimeFormat("id-ID", { month: "long" }).format(now),
         previous: new Intl.DateTimeFormat("id-ID", { month: "long" }).format(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
      };
   }, []);

   const monthComparison = useMemo(() => {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
      const lastMonth = lastMonthDate.getMonth();
      const lastMonthYear = lastMonthDate.getFullYear();

      let currentCount = 0;
      let lastCount = 0;
      let currentRevenue = 0;
      let lastRevenue = 0;

      (ordersData ?? []).forEach((order) => {
         const date = new Date(order.created_at);
         const month = date.getMonth();
         const year = date.getFullYear();
         const amount = Number(order.total_harga || 0);

         if (month === currentMonth && year === currentYear) {
            currentCount += 1;
            currentRevenue += amount;
         } else if (month === lastMonth && year === lastMonthYear) {
            lastCount += 1;
            lastRevenue += amount;
         }
      });

      const countDelta = lastCount === 0 ? (currentCount === 0 ? 0 : 100) : ((currentCount - lastCount) / lastCount) * 100;
      const revenueDelta = lastRevenue === 0 ? (currentRevenue === 0 ? 0 : 100) : ((currentRevenue - lastRevenue) / lastRevenue) * 100;

      return {
         currentCount,
         lastCount,
         currentRevenue,
         lastRevenue,
         countDelta,
         revenueDelta,
      };
   }, [ordersData]);

   const comparisonChartData = useMemo(() => {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
      const lastMonth = lastMonthDate.getMonth();
      const lastMonthYear = lastMonthDate.getFullYear();

      const dayMap = new Map();
      const updateDay = (date, amount, key) => {
         const day = date.getDate();
         const label = day.toString();
         const row = dayMap.get(label) ?? { day: label, revenueThisMonth: 0, revenueLastMonth: 0 };
         row[key] += amount;
         dayMap.set(label, row);
      };

      (ordersData ?? []).forEach((order) => {
         const date = new Date(order.created_at);
         const month = date.getMonth();
         const year = date.getFullYear();
         const amount = Number(order.total_harga || 0);

         if (month === currentMonth && year === currentYear) {
            updateDay(date, amount, "revenueThisMonth");
         }
         if (month === lastMonth && year === lastMonthYear) {
            updateDay(date, amount, "revenueLastMonth");
         }
      });

      return [...dayMap.values()].sort((a, b) => Number(a.day) - Number(b.day));
   }, [ordersData]);

   const formatCurrency = (value) => `Rp ${Number(value).toLocaleString("id-ID")}`;
   const formatDelta = (value) => `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;

   return (
      <div className="admin-dashboard">
         <div className="admin-dashboard__header">
            <div>
               <h1 className="admin-dashboard__title">Dashboard Admin</h1>
               <p>Ringkasan performa koperasi dan metrik penting setiap hari.</p>
            </div>
         </div>

         {loading ? (
            <Loading message="Memuat metrik..." size="small" />
         ) : (
            <>
               <div className="admin-dashboard__grid">
                  <div className="admin-dashboard__stats-card">
                     <div className="admin-dashboard__stats-label">Produk Terdaftar</div>
                     <div className="admin-dashboard__stats-value">{productCount}</div>
                  </div>
                  <div className="admin-dashboard__stats-card">
                     <div className="admin-dashboard__stats-label">Siswa Terdaftar</div>
                     <div className="admin-dashboard__stats-value">{studentCount}</div>
                  </div>
                  <div className="admin-dashboard__stats-card">
                     <div className="admin-dashboard__stats-label">Transaksi Hari Ini</div>
                     <div className="admin-dashboard__stats-value">{txnCountToday}</div>
                  </div>
                  <div className="admin-dashboard__stats-card">
                     <div className="admin-dashboard__stats-label">Pendapatan Hari Ini</div>
                     <div className="admin-dashboard__stats-value">{revenueLabel}</div>
                  </div>
               </div>

               <div className="admin-dashboard__grid admin-dashboard__comparison-grid">
                  <div className="admin-dashboard__stats-card">
                     <div className="admin-dashboard__stats-label">Order Bulan Ini ({monthNames.current})</div>
                     <div className="admin-dashboard__stats-value">{monthComparison.currentCount}</div>
                     <div className="admin-dashboard__stats-note">{monthNames.previous}: {monthComparison.lastCount}</div>
                     <div className={`admin-dashboard__stats-delta ${monthComparison.countDelta >= 0 ? "positive" : "negative"}`}>
                        {formatDelta(monthComparison.countDelta)} dibanding bulan lalu
                     </div>
                  </div>
                  <div className="admin-dashboard__stats-card">
                     <div className="admin-dashboard__stats-label">Pendapatan Bulan Ini ({monthNames.current})</div>
                     <div className="admin-dashboard__stats-value">{formatCurrency(monthComparison.currentRevenue)}</div>
                     <div className="admin-dashboard__stats-note">{monthNames.previous}: {formatCurrency(monthComparison.lastRevenue)}</div>
                     <div className={`admin-dashboard__stats-delta ${monthComparison.revenueDelta >= 0 ? "positive" : "negative"}`}>
                        {formatDelta(monthComparison.revenueDelta)} dibanding bulan lalu
                     </div>
                  </div>
               </div>

               <div className="admin-dashboard__chart-card">
                  <h2 className="admin-dashboard__chart-title">Perbandingan Bulanan</h2>
                  <ResponsiveContainer width="100%" height={320}>
                     <LineChart data={comparisonChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `Rp ${Number(value).toLocaleString("id-ID")}`} />
                        <Tooltip formatter={(value) => `Rp ${Number(value).toLocaleString("id-ID")}`} />
                        <Legend />
                        <Line type="monotone" dataKey="revenueThisMonth" name={`Bulan Ini (${monthNames.current})`} stroke="#22c55e" strokeWidth={3} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="revenueLastMonth" name={`Bulan Lalu (${monthNames.previous})`} stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
                     </LineChart>
                  </ResponsiveContainer>
               </div>

               <div className="admin-dashboard__charts">
                  <div className="admin-dashboard__chart-card">
                     <h2 className="admin-dashboard__chart-title">Order Siswa - 7 Hari Terakhir</h2>
                     <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} />
                           <XAxis dataKey="name" axisLine={false} tickLine={false} />
                           <YAxis axisLine={false} tickLine={false} />
                           <Tooltip formatter={(value) => new Intl.NumberFormat("id-ID").format(value)} />
                           <Bar dataKey="orders" fill="#2563eb" radius={[8, 8, 0, 0]} />
                        </BarChart>
                     </ResponsiveContainer>
                  </div>

                  <div className="admin-dashboard__chart-card">
                     <h2 className="admin-dashboard__chart-title">Pendapatan Order Siswa</h2>
                     <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                           <defs>
                              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.8} />
                                 <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.05} />
                              </linearGradient>
                           </defs>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} />
                           <XAxis dataKey="name" axisLine={false} tickLine={false} />
                           <YAxis axisLine={false} tickLine={false} />
                           <Tooltip formatter={(value) => `Rp ${Number(value).toLocaleString()}`} />
                           <Area type="monotone" dataKey="revenue" stroke="#14b8a6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                        </AreaChart>
                     </ResponsiveContainer>
                  </div>
               </div>

               <div className="admin-dashboard__charts">
                  <div className="admin-dashboard__chart-card">
                     <h2 className="admin-dashboard__chart-title">Ringkasan Top-Up & Order</h2>
                     <div className="admin-dashboard__small-grid">
                        <div className="admin-dashboard__stats-card">
                           <div className="admin-dashboard__stats-label">Jumlah Top-Up</div>
                           <div className="admin-dashboard__stats-value">{topupCount}</div>
                        </div>
                        <div className="admin-dashboard__stats-card">
                           <div className="admin-dashboard__stats-label">Total Order Siswa</div>
                           <div className="admin-dashboard__stats-value">{orderCount}</div>
                        </div>
                        <div className="admin-dashboard__stats-card">
                           <div className="admin-dashboard__stats-label">Pendapatan Order</div>
                           <div className="admin-dashboard__stats-value">{orderRevenueLabel}</div>
                        </div>
                     </div>
                  </div>

                  <div className="admin-dashboard__table-card">
                     <h2 className="admin-dashboard__table-title">Transaksi Terbaru</h2>
                     <div className="admin-dashboard__table-wrap">
                        <table className="admin-dashboard__table">
                           <thead>
                              <tr>
                                 <th>Tanggal</th>
                                 <th>Metode</th>
                                 <th>Status</th>
                                 <th>Total</th>
                              </tr>
                           </thead>
                           <tbody>
                              {latestTransactions.length === 0 ? (
                                 <tr>
                                    <td className="admin-dashboard__table-empty" colSpan={4}>
                                       Belum ada transaksi.
                                    </td>
                                 </tr>
                              ) : (
                                 latestTransactions.map((item) => (
                                    <tr key={item.id}>
                                       <td>{new Date(item.created_at).toLocaleString("id-ID")}</td>
                                       <td>{item.metode_pembayaran}</td>
                                       <td>{item.status_pembayaran}</td>
                                       <td>Rp {Number(item.total_bayar || 0).toLocaleString()}</td>
                                    </tr>
                                 ))
                              )}
                           </tbody>
                        </table>
                     </div>
                  </div>
               </div>
            </>
         )}
      </div>
   );
}
