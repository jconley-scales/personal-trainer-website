import { useState } from "react";
import { NavLink, Link } from "react-router-dom";

const LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/about", label: "About Me" },
  { to: "/services", label: "Services" },
  { to: "/booking", label: "Book a Session" },
  { to: "/my-appointments", label: "My Appointments" },
  { to: "/contact", label: "Contact" },
];

export default function Nav() {
  // Single linear list of links, no dropdowns/hover menus. On narrow
  // screens it collapses behind one large, clearly-labeled toggle button
  // (never an icon-only "hamburger") rather than hover-triggered flyouts,
  // which are unreliable with touch and easy to mis-tap.
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="site-header__bar">
        <Link to="/" className="site-header__brand">
          Bright Path Personal Training
        </Link>

        <button
          type="button"
          className="btn btn--secondary nav-toggle"
          aria-expanded={open}
          aria-controls="main-nav-list"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close Menu" : "Menu"}
        </button>

        <nav aria-label="Main navigation" id="main-nav" style={{ width: "100%" }}>
          <ul
            id="main-nav-list"
            className={`main-nav__list ${open ? "" : "is-collapsed"}`}
          >
            {LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.end}
                  className="main-nav__link"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
