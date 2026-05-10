import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { isAuth, user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const close = () => setMenuOpen(false);

  const handleLogout = () => {
    logout();
    close();
    navigate("/login");
  };

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  // Close menu on route change (resize to desktop)
  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 768) close(); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const navLinkClass = ({ isActive }) => "nav-link" + (isActive ? " active" : "");

  return (
    <>
      <nav className="navbar">
        <NavLink to="/dashboard" className="nav-logo" onClick={close}>
          CareerLens
        </NavLink>

        {isAuth ? (
          <>
            <div className={`nav-links${menuOpen ? " open" : ""}`}>
              <NavLink to="/dashboard" className={navLinkClass} onClick={close}>Dashboard</NavLink>
              <NavLink to="/jobs"      className={navLinkClass} onClick={close}>Browse Jobs</NavLink>
              <NavLink to="/recommend" className={navLinkClass} onClick={close}>Recommendations</NavLink>
              <NavLink to="/skill-gap" className={navLinkClass} onClick={close}>Skill Gap</NavLink>
              <NavLink to="/profile"   className={navLinkClass} onClick={close}>Profile</NavLink>
              <button className="nav-btn ghost" onClick={handleLogout} style={{ marginLeft: 8 }}>
                Sign out
              </button>
            </div>
            <button
              className={`nav-hamburger${menuOpen ? " open" : ""}`}
              onClick={() => setMenuOpen(m => !m)}
              aria-label="Toggle navigation menu"
              aria-expanded={menuOpen}
            >
              <span /><span /><span />
            </button>
          </>
        ) : (
          <>
            <div className={`nav-links${menuOpen ? " open" : ""}`}>
              <NavLink to="/login"  className="nav-link" onClick={close}>Log in</NavLink>
              <NavLink to="/signup" className="nav-btn"  onClick={close}>Get started</NavLink>
            </div>
            <button
              className={`nav-hamburger${menuOpen ? " open" : ""}`}
              onClick={() => setMenuOpen(m => !m)}
              aria-label="Toggle navigation menu"
              aria-expanded={menuOpen}
            >
              <span /><span /><span />
            </button>
          </>
        )}
      </nav>

      {/* Tap-outside overlay */}
      <div
        className={`nav-overlay${menuOpen ? " open" : ""}`}
        onClick={close}
        aria-hidden="true"
      />
    </>
  );
}
