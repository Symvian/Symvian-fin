import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import symvianLogo from '../assets/logo.png';
import {
  ChevronDown,
  Check,
  LogOut,
  Phone
} from 'lucide-react';

export const Navbar = () => {
  const {
    activeTab,
    setActiveTab,
    currentUser,
    payments,
    logout,
    updateUserProfile
  } = useApp();

  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [phoneInput, setPhoneInput] = useState(currentUser?.Phone || currentUser?.phone || '');
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [phoneSavedSuccess, setPhoneSavedSuccess] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setPhoneInput(currentUser?.Phone || currentUser?.phone || '');
  }, [currentUser]);

  const handleSavePhone = async (e) => {
    e?.preventDefault();
    if (isSavingPhone) return;
    setIsSavingPhone(true);
    await updateUserProfile({ phone: phoneInput.trim() });
    setIsSavingPhone(false);
    setPhoneSavedSuccess(true);
    setTimeout(() => setPhoneSavedSuccess(false), 2500);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
    };
    if (isUserDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserDropdownOpen]);

  // SQL_CHECK console easter egg: Schema & SQL tab invisible until typing SQL_CHECK in console
  const [showSqlTab, setShowSqlTab] = useState(() => {
    try {
      return localStorage.getItem('SYMVIAN_SQL_CHECK') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const unlock = () => {
      setShowSqlTab(true);
      try {
        localStorage.setItem('SYMVIAN_SQL_CHECK', 'true');
      } catch (e) {}
      console.log('%c[SQL_CHECK] Schema & SQL tab unlocked in navigation!', 'color: #10b981; font-weight: bold; font-size: 13px;');
      return 'Schema & SQL tab unlocked!';
    };
    unlock.toString = () => 'Schema & SQL tab unlocked!';

    try {
      Object.defineProperty(window, 'SQL_CHECK', {
        get() {
          return unlock();
        },
        set() {
          unlock();
        },
        configurable: true
      });
    } catch (e) {
      window.SQL_CHECK = unlock;
    }

    const lock = () => {
      setShowSqlTab(false);
      try {
        localStorage.removeItem('SYMVIAN_SQL_CHECK');
      } catch (e) {}
      if (activeTab === 'database') {
        setActiveTab('discover');
      }
      console.log('%c[SQL_UNCHECK] Schema & SQL tab hidden from navigation!', 'color: #f43f5e; font-weight: bold; font-size: 13px;');
      return 'Schema & SQL tab hidden!';
    };
    lock.toString = () => 'Schema & SQL tab hidden!';

    try {
      Object.defineProperty(window, 'SQL_UNCHECK', {
        get() {
          return lock();
        },
        set() {
          lock();
        },
        configurable: true
      });
    } catch (e) {
      window.SQL_UNCHECK = lock;
    }
  }, [activeTab]);

  // Count pending payments for badge
  const pendingPaymentsCount = payments.filter(p => p.Payment_Status === 'Pending').length;

  const navItems = [
    { id: 'discover', label: 'Discover' },
    { id: 'organize', label: 'Organize' },
    { id: 'venues', label: 'Venues' },
    { id: 'volunteer', label: 'Volunteer' },
    { id: 'finance', label: 'Finance & Insights', badge: pendingPaymentsCount > 0 ? pendingPaymentsCount : null },
    ...(showSqlTab ? [{ id: 'database', label: 'Schema & SQL' }] : [])
  ];

  return (
    <header className="header-wrapper">
      <div className="header-inner">
        {/* Left: Brand Identity Logo (Text removed, prominent & visible) */}
        <div
          className="brand-section"
          onClick={() => setActiveTab('discover')}
          title="SYMVIAN DBMS Event Platform"
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <img
            src={symvianLogo}
            alt="SYMVIAN"
            style={{
              height: '48px',
              width: 'auto',
              maxHeight: '48px',
              objectFit: 'contain',
              display: 'block',
              filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.08))',
              transition: 'transform 0.15s ease'
            }}
          />
        </div>

        {/* Center: Clean Text-Only Navbar */}
        <div className="center-nav-container">
          <nav className="central-text-nav" aria-label="Main Navigation">
            {navItems.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  className={`nav-text-btn ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveTab(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className="nav-text-label">{item.label}</span>
                  {item.badge && (
                    <span className="nav-badge-count">{item.badge}</span>
                  )}
                  {isActive && <span className="nav-active-bar" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right: User Profile (Active User Details & Edit) */}
        <div className="header-right-actions">
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
              className="role-badge-pill"
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              title="Click to view profile & settings"
              aria-expanded={isUserDropdownOpen}
              style={{ padding: '0.35rem 0.75rem', gap: '0.65rem' }}
            >
              <img
                src={currentUser?.Avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                alt={currentUser?.Full_Name || currentUser?.full_name}
                className="role-avatar"
              />
              <div className="role-text-box" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', lineHeight: 1.25 }}>
                <span className="role-user-name" style={{ fontWeight: 600, fontSize: '0.84rem' }}>
                  {currentUser?.Full_Name || currentUser?.full_name}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {currentUser?.Email || currentUser?.email}
                </span>
              </div>
              <ChevronDown size={14} className="role-chevron" />
            </button>

            {/* Active User Profile Dropdown Menu */}
            {isUserDropdownOpen && (
              <div className="user-dropdown-menu" style={{ width: '285px', padding: '0.9rem' }}>
                {/* Active User Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
                  <img
                    src={currentUser?.Avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                    alt={currentUser?.Full_Name || currentUser?.full_name}
                    style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-subtle)' }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      {currentUser?.Full_Name || currentUser?.full_name}
                    </span>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      {currentUser?.Email || currentUser?.email}
                    </span>
                  </div>
                </div>

                {/* Details & Editable Phone */}
                <div style={{ padding: '0.75rem 0', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                      Full Name
                    </label>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', background: 'var(--bg-subtle)', padding: '0.35rem 0.55rem', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                      {currentUser?.Full_Name || currentUser?.full_name}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                      Email Address
                    </label>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', background: 'var(--bg-subtle)', padding: '0.35rem 0.55rem', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                      {currentUser?.Email || currentUser?.email}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                      Phone Number
                    </label>
                    <form onSubmit={handleSavePhone} style={{ display: 'flex', gap: '0.35rem' }}>
                      <input
                        type="tel"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        placeholder="e.g. +91 98450 00000"
                        style={{
                          flex: 1,
                          fontSize: '0.8rem',
                          padding: '0.35rem 0.5rem',
                          borderRadius: '6px',
                          border: '1px solid var(--border-subtle)',
                          background: '#ffffff',
                          color: 'var(--text-primary)',
                          outline: 'none'
                        }}
                      />
                      <button
                        type="submit"
                        className="btn btn-primary btn-sm"
                        style={{ height: '31px', fontSize: '0.74rem', padding: '0 0.6rem', flexShrink: 0 }}
                        disabled={isSavingPhone}
                      >
                        {phoneSavedSuccess ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}><Check size={12} /> Saved</span>
                        ) : isSavingPhone ? (
                          'Saving...'
                        ) : (
                          'Save'
                        )}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Footer with Sign Out */}
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.65rem' }}>
                  <button
                    type="button"
                    className="dropdown-signout-btn"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.45rem',
                      width: '100%',
                      padding: '0.45rem 0.65rem',
                      background: 'transparent',
                      border: '1px solid #fee2e2',
                      borderRadius: '6px',
                      color: '#ef4444',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'background 0.15s'
                    }}
                    onClick={() => {
                      setIsUserDropdownOpen(false);
                      logout();
                    }}
                  >
                    <LogOut size={13} />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
