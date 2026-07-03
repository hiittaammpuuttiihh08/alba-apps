"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
   { href: "/dashboard", label: "Dashboard" },
   { href: "/saldo", label: "Saldo" },
   { href: "/settings", label: "Settings" },
];

export default function SiswaSidebar() {
   const pathname = usePathname();
   const normalizedPath = pathname?.replace(/\/$/, "") || "/";

   return (
      <aside className="admin-sidebar">
         <div className="admin-sidebar__brand">Alba Apps</div>
         <nav className="admin-sidebar__nav">
            {navItems.map((item) => {
               const isActive = normalizedPath === item.href;
               return (
                  <Link
                     key={item.href}
                     href={item.href}
                     className={`admin-sidebar__link${isActive ? " admin-sidebar__link--active" : ""}`}
                  >
                     {item.label}
                  </Link>
               );
            })}
         </nav>
      </aside>
   );
}
