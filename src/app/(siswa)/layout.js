"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthSession, clearAuthSession } from "@/utils/auth";

export default function SiswaLayout({ children }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  function handleLogout() {
    clearAuthSession();
    router.replace("/login-siswa");
  }

  useEffect(() => {
    const session = getAuthSession();

    if (!session) {
      clearAuthSession();
      router.replace("/login-siswa");
      return;
    }

    if (session.role === "siswa") {
      setLoading(false);
      return;
    }

    if (session.role === "admin") {
      router.replace("/kasir");
      return;
    }

    clearAuthSession();
    router.replace("/login-siswa");
  }, [router]);

  if (loading) {
    return <div className="page-loading">Memeriksa otentikasi siswa...</div>;
  }

  return (
    <>
      <header className="app-header">
        <div className="app-header__title">Portal Siswa</div>
        <button type="button" className="btn btn--secondary" onClick={handleLogout}>
          Keluar
        </button>
      </header>
      {children}
    </>
  );
} 
