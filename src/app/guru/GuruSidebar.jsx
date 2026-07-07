"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";

const navItems = [
   { href: "/guru/dashboard", label: "Dashboard" },
   { href: "/guru/beli-produk", label: "Beli Produk" },
   { href: "/guru/saldo", label: "Saldo" },
   { href: "/guru/hutang-saya", label: "Hutang Saya" },
   { href: "/guru/profile", label: "Profile" },
];

export default function GuruSidebar() {
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
            <div className="sidebar__logo admin-sidebar__brand">Alba Apps - Guru</div>
            <nav className="sidebar__menu admin-sidebar__nav">
               {navItems.map((item) => {
                  const itemPath = item.href.replace(/\/$/, "") || "/";
                  const isActive = currentPath === itemPath || currentPath.startsWith(`${itemPath}/`);
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
