import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Key,
  Server,
  X
} from 'lucide-react';
import { FULL_POSTGRES_SCHEMA } from '../lib/sqlSchema';

export const SupabaseModal = ({ onClose }) => {
  const { supabaseConfig, connectSupabase, setSupabaseConfig } = useApp();

  const [url, setUrl] = useState(supabaseConfig.url || '');
  const [key, setKey] = useState(supabaseConfig.key || '');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleConnect = async (e) => {
    e.preventDefault();
    setIsTesting(true);
    setTestResult(null);

    const res = await connectSupabase(url, key);
    setIsTesting(false);
    setTestResult(res);

    if (res.success) {
      setTimeout(() => {
        onClose();
      }, 1200);
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem('SYMVIAN_SUPABASE_URL');
    localStorage.removeItem('SYMVIAN_SUPABASE_KEY');
    setSupabaseConfig({
      url: '',
      key: '',
      isConnected: false,
      syncMode: 'local'
    });
    setUrl('');
    setKey('');
    setTestResult({ success: true, message: 'Switched to Simulated Local DB Mode.' });
  };

  const copyDDL = () => {
    navigator.clipboard.writeText(FULL_POSTGRES_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card modal-card-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'var(--emerald-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--emerald-text)' }}>
              <Database size={18} />
            </div>
            <div>
              <h3 className="modal-title">Supabase Database Integration</h3>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                PostgreSQL Cloud Backend Configuration
              </div>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleConnect}>
          <div className="modal-body">
            <div style={{ background: 'var(--bg-subtle)', padding: '0.9rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <h4 style={{ color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                How Supabase Connect Works
              </h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                SYMVIAN is designed to map directly to Supabase PostgreSQL with 7 normalized tables, foreign keys, unique candidate keys, and triggers. You can connect your live Supabase instance by entering your API keys below, or use the built-in simulated transactional database.
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Supabase Project URL</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://your-project-ref.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Supabase Anon Public API Key</label>
              <input
                type="password"
                className="form-input"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={key}
                onChange={(e) => setKey(e.target.value)}
                required
              />
            </div>

            {testResult && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  background: testResult.success ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
                  border: `1px solid ${testResult.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
                  color: testResult.success ? '#34d399' : '#fb7185',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {testResult.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{testResult.message || (testResult.success ? 'Connection validated successfully!' : testResult.error)}</span>
              </div>
            )}

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Need the SQL Schema for Supabase?
              </div>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={copyDDL}
              >
                <Copy size={13} />
                <span>{copied ? 'Copied DDL!' : 'Copy Supabase DDL'}</span>
              </button>
            </div>
          </div>

          <div className="modal-footer">
            {supabaseConfig.isConnected && (
              <button
                type="button"
                className="btn btn-danger btn-sm"
                style={{ marginRight: 'auto' }}
                onClick={handleDisconnect}
              >
                Disconnect & Use Local Store
              </button>
            )}
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isTesting || !url || !key}
            >
              <Server size={15} />
              <span>{isTesting ? 'Testing Connectivity...' : 'Test & Save Connection'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
