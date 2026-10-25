import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import symvianLogo from '../assets/logo.png';
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  User,
  Phone,
  Eye,
  EyeOff,
  UserPlus,
  LogIn
} from 'lucide-react';

export const LoginPage = () => {
  const { login, registerUser } = useApp();

  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'

  // Sign In state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('Attendee');
  const [regPhone, setRegPhone] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    const res = await login(email, password);
    setIsLoading(false);

    if (!res.success) {
      setErrorMsg(res.error || 'Authentication failed. Please check your email and password.');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regEmail.trim() || !regPassword.trim() || !regFullName.trim()) {
      setErrorMsg('Please provide your full name, email, and password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    const res = await registerUser({
      fullName: regFullName,
      email: regEmail,
      password: regPassword,
      role: regRole,
      phone: regPhone
    });
    setIsLoading(false);

    if (!res.success) {
      setErrorMsg(res.error || 'Registration failed. Please check inputs.');
    }
  };


  return (
    <div className="login-screen-wrapper">
      <div className="login-card-container">
        {/* Brand identity header */}
        <div className="login-brand-header">
          <div className="login-brand-icon" style={{ background: 'transparent', boxShadow: 'none', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-hidden="true">
            <img
              src={symvianLogo}
              alt="SYMVIAN"
              style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '10px' }}
            />
          </div>
          <div>
            <h1 className="login-brand-title">SYMVIAN</h1>
            <p className="login-brand-subtitle">DBMS Event & Venue Platform</p>
          </div>
        </div>

        {/* Main Authentication Card */}
        <div className="login-main-card">
          {/* Mode Switcher Tabs */}
          <div className="auth-mode-nav">
            <button
              type="button"
              className={`auth-mode-btn ${authMode === 'login' ? 'active' : ''}`}
              onClick={() => {
                setAuthMode('login');
                setErrorMsg('');
              }}
            >
              <LogIn size={14} />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              className={`auth-mode-btn ${authMode === 'register' ? 'active' : ''}`}
              onClick={() => {
                setAuthMode('register');
                setErrorMsg('');
              }}
            >
              <UserPlus size={14} />
              <span>Create Account</span>
            </button>
          </div>

          <div className="login-card-header">
            <h2 className="login-heading">
              {authMode === 'login' ? 'Sign In' : 'Create Account'}
            </h2>
            <p className="login-subheading">
              {authMode === 'login'
                ? 'Sign in with your email and password to continue.'
                : 'Create an account with your details to get started.'}
            </p>
          </div>

          {errorMsg && (
            <div className="login-error-alert" role="alert">
              <span>{errorMsg}</span>
            </div>
          )}

          {/* SIGN IN FORM */}
          {authMode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="login-form">
              <div className="form-group">
                <label className="form-label" htmlFor="login-email">
                  Email Address
                </label>
                <div className="login--wrapper">
                  <Mail size={16} className="login--icon" />
                  <input
                    id="login-email"
                    type="email"
                    className="form-input login-input-with-icon"
                    placeholder="name@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="login-password">
                  Password
                </label>
                <div className="login-input-wrapper">
                  <Lock size={16} className="login-input-icon" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    className="form-input login-input-with-icon"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="login-toggle-pw"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary login-submit-btn"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* REGISTER FORM */}
          {authMode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="login-form">
              <div className="form-group">
                <label className="form-label" htmlFor="reg-fullname">
                  Full Name
                </label>
                <div className="login-input-wrapper">
                  <User size={16} className="login-input-icon" />
                  <input
                    id="reg-fullname"
                    type="text"
                    className="form-input login-input-with-icon"
                    placeholder="e.g. Vikramaditya Rao"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-email">
                  Email Address
                </label>
                <div className="login-input-wrapper">
                  <Mail size={16} className="login-input-icon" />
                  <input
                    id="reg-email"
                    type="email"
                    className="form-input login-input-with-icon"
                    placeholder="name@amrita.edu"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-password">
                  Password
                </label>
                <div className="login-input-wrapper">
                  <Lock size={16} className="login-input-icon" />
                  <input
                    id="reg-password"
                    type={showRegPassword ? 'text' : 'password'}
                    className="form-input login-input-with-icon"
                    placeholder="Create a password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="login-toggle-pw"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    aria-label="Toggle password visibility"
                  >
                    {showRegPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-phone">
                  Phone (Optional)
                </label>
                <div className="login-input-wrapper">
                  <Phone size={15} className="login-input-icon" />
                  <input
                    id="reg-phone"
                    type="tel"
                    className="form-input login-input-with-icon"
                    placeholder="+91 98450 00000"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary login-submit-btn"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span>Registering...</span>
                ) : (
                  <>
                    <span>Create Account & Sign In</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* University & Course Attribution Footer */}
        <div className="login-footer-attribution">
          <span>23CSE202 Database Management Systems</span>
          <span>•</span>
          <span>Amrita School of Computing</span>
        </div>
      </div>
    </div>
  );
};
