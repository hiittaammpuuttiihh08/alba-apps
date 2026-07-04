"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";

const navItems = [
   { href: "/admin", label: "Dashboard" },
   { href: "/kasir", label: "Kasir" },
   { href: "/topup-saldo", label: "Top-Up Saldo" },
   { href: "/hutang", label: "Hutang" },
   { href: "/order-siswa", label: "Order Siswa" },
   { href: "/laporan", label: "Laporan" },
   { href: "/produk", label: "Produk" },
   { href: "/siswa", label: "Siswa" },
];

export default function AdminSidebar() {
   const pathname = usePathname() || "";
   const [isOpen, setIsOpen] = useState(false);
   const currentPath = useMemo(
      () => pathname.split(/[?#]/)[0].replace(/\/$/, "") || "/",
      [pathname]
   );

   function closeMenu() {
      setIsOpen(false);
   }

   return (
      <>
         <button
            type="button"
            className="mobile-nav-toggle"
            aria-label="Buka menu"
            aria-expanded={isOpen}
            onClick={() => setIsOpen((prev) => !prev)}
         >
            <span />
            <span />
            <span />
         </button>

         <div className={`mobile-nav-backdrop${isOpen ? " mobile-nav-backdrop--show" : ""}`} onClick={closeMenu} />

         <aside className={`sidebar admin-sidebar${isOpen ? " admin-sidebar--open" : ""}`}>
            <div className="sidebar__logo admin-sidebar__brand">Alba Apps</div>
            <nav className="sidebar__menu admin-sidebar__nav">
               {navItems.map((item) => {
                  const itemPath = item.href.replace(/\/$/, "") || "/";
                  const isActive =
                     itemPath === "/admin"
                        ? currentPath === "/" || currentPath === "/admin"
                        : currentPath === itemPath || currentPath.startsWith(`${itemPath}/`);
                  return (
                     <Link
                        key={item.href}
                        href={item.href}
                        className={`sidebar__link admin-sidebar__link${isActive ? " sidebar__link--active admin-sidebar__link--active" : ""}`}
                        aria-current={isActive ? "page" : undefined}
                        onClick={closeMenu}
                     >
                        {item.label}
                     </Link>
                  );
               })}
            </nav>
         </aside>
      </>
   );
}
