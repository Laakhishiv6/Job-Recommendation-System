import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { isAuth, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <NavLink to="/dashboard" className="nav-logo">CareerLens</NavLink>

      {isAuth ? (
        <div className="nav-links">
          <NavLink to="/dashboard" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>Dashboard</NavLink>
          <NavLink to="/jobs"      className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>Browse Jobs</NavLink>
          <NavLink to="/recommend" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>Recommendations</NavLink>
          <NavLink to="/skill-gap" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>Skill Gap</NavLink>
          <NavLink to="/profile"   className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>Profile</NavLink>
          <button className="nav-btn ghost" onClick={handleLogout} style={{ marginLeft: 8 }}>Sign out</button>
        </div>
      ) : (
        <div className="nav-links">
          <NavLink to="/login"  className="nav-link">Log in</NavLink>
          <NavLink to="/signup" className="nav-btn">Get started</NavLink>
        </div>
      )}
    </nav>
  );
}
