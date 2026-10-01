"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { navigation, office, practiceGroups } from "@/lib/navigation";

export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [areasOpen, setAreasOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const areasButton = useRef<HTMLButtonElement>(null);
  const close = () => {
    setMenuOpen(false);
    setAreasOpen(false);
  };

  return (
    <header
      className="site-header"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          if (menuOpen) menuButton.current?.focus();
          else if (areasOpen) areasButton.current?.focus();
          close();
        }
      }}
    >
      <div className="header-inner container">
        <Link href="/" className="brand" onClick={close}>
          <Image
            src="/images/New-Web-Logo.png"
            width={64}
            height={64}
            alt=""
            loading="eager"
          />
          <span className="brand-name">
            B. Scott Winkler<span>The Shafter Lawyer</span>
          </span>
        </Link>
        <button
          type="button"
          className="menu-toggle"
          ref={menuButton}
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? "Close" : "Menu"}
          <span aria-hidden="true">{menuOpen ? "×" : "☰"}</span>
        </button>
        <nav
          id="primary-navigation"
          aria-label="Main navigation"
          className={`main-nav ${menuOpen ? "is-open" : ""}`}
        >
          {navigation.map((item) =>
            item.href === "/defense-areas/" ? (
              <div className="nav-dropdown" key={item.href}>
                <div className="nav-dropdown-trigger">
                  <Link
                    href={item.href}
                    onClick={close}
                    aria-current={pathname === item.href ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                  <button
                    type="button"
                    aria-label="Show defense areas"
                    ref={areasButton}
                    aria-expanded={areasOpen}
                    aria-controls="defense-menu"
                    onClick={() => setAreasOpen(!areasOpen)}
                  >
                    <span aria-hidden="true">⌄</span>
                  </button>
                </div>
                <div
                  id="defense-menu"
                  className="defense-menu"
                  hidden={!areasOpen}
                >
                  {practiceGroups.map((group) => (
                    <div key={group.title}>
                      <p>{group.title}</p>
                      {group.items.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={close}
                          aria-current={
                            pathname === link.href ? "page" : undefined
                          }
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                aria-current={pathname === item.href ? "page" : undefined}
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>
        <a className="header-phone" href={office.phoneHref}>
          {office.phone}
        </a>
      </div>
    </header>
  );
}
