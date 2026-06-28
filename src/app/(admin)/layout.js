"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthSession, clearAuthSession } from "@/utils/auth";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  function handleLogout() {
    clearAuthSession();
    router.replace("/login-admin");
  }

  useEffect(() => {
    const session = getAuthSession();

    if (!session) {
      clearAuthSession();
      router.replace("/login-admin");
      return;
    }

    if (session.role === "admin") {
      setLoading(false);
      return;
    }

    if (session.role === "siswa") {
      router.replace("/dashboard");
      return;
    }

    clearAuthSession();
    router.replace("/login-admin");
  }, [router]);

  if (loading) {
    return <div className="page-loading">Memeriksa otentikasi admin...</div>;
  }

  return (
    <>
      <header className="app-header">
        <div className="app-header__title">Admin / Kasir</div>
        <button type="button" className="btn btn--secondary" onClick={handleLogout}>
          Keluar
        </button>
      </header>
      {children}
    </>
  );
} 
