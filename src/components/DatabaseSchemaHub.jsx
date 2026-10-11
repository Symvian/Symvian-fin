import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FULL_POSTGRES_SCHEMA, SAMPLE_SEED_SQL } from '../lib/sqlSchema';
import {
  Database,
  Table,
  Copy,
  Check,
  Key,
  Link,
  Shield,
  Layers,
  Download,
  Terminal,
  Server
} from 'lucide-react';

export const DatabaseSchemaHub = ({ onOpenSupabaseModal }) => {
  const {
    users,
    venues,
    categories,
    events,
    registrations,
    payments,
    eventVolunteers,
    supabaseConfig
  } = useApp();

  const [activeTable, setActiveTable] = useState('event');
  const [activeTabSub, setActiveTabSub] = useState('browser'); // 'browser' | 'ddl' | 'seed'
  const [copied, setCopied] = useState(false);

  const tablesMeta = [
    {
      name: 'users',
      label: '1. users',
      count: users.length,
      pk: 'user_id',
      unique: ['email'],
      fks: [],
      data: users
    },
    {
      name: 'event',
      label: '2. event',
      count: events.length,
      pk: 'event_id',
      unique: [],
      fks: ['category_id -> category', 'venue_id -> venue', 'organizer_id -> users'],
      data: events
    },
    {
      name: 'registration',
      label: '3. registration',
      count: registrations.length,
      pk: 'registration_id',
      unique: ['(event_id, user_id)'],
      fks: ['event_id -> event', 'user_id -> users'],
      data: registrations
    },
    {
      name: 'payment',
      label: '4. payment',
      count: payments.length,
      pk: 'payment_id',
      unique: ['registration_id', 'transaction_reference'],
      fks: ['registration_id -> registration'],
      data: payments
    },
    {
      name: 'venue',
      label: '5. venue',
      count: venues.length,
      pk: 'venue_id',
      unique: [],
      fks: [],
      data: venues
    },
    {
      name: 'category',
      label: '6. category',
      count: categories.length,
      pk: 'category_id',
      unique: ['category_name'],
      fks: [],
      data: categories
    },
    {
      name: 'event_volunteer',
      label: '7. event_volunteer',
      count: eventVolunteers.length,
      pk: 'assignment_id',
      unique: ['(event_id, user_id)'],
      fks: ['event_id -> event', 'user_id -> users'],
      data: eventVolunteers
    }
  ];

  const currentTableMeta = tablesMeta.find(t => t.name === activeTable) || tablesMeta[0];

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Relational Schema & Supabase Hub</h1>
            <p className="page-description">
              Inspect all 7 relational tables, explore live data, and copy DDL migrations for Supabase.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button
              className="btn btn-outline"
              onClick={onOpenSupabaseModal}
            >
              <Server size={16} />
              <span>{supabaseConfig.isConnected ? 'Supabase Connected' : 'Connect Supabase Cloud'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub tabs */}
      <div className="filter-tabs-row">
        <button
          className={`filter-chip ${activeTabSub === 'browser' ? 'active' : ''}`}
          onClick={() => setActiveTabSub('browser')}
        >
          <Table size={14} style={{ display: 'inline', marginRight: '4px' }} />
          Interactive Table Browser
        </button>
        <button
          className={`filter-chip ${activeTabSub === 'ddl' ? 'active' : ''}`}
          onClick={() => setActiveTabSub('ddl')}
        >
          <Terminal size={14} style={{ display: 'inline', marginRight: '4px' }} />
          PostgreSQL DDL & Triggers
        </button>
        <button
          className={`filter-chip ${activeTabSub === 'seed' ? 'active' : ''}`}
          onClick={() => setActiveTabSub('seed')}
        >
          <Layers size={14} style={{ display: 'inline', marginRight: '4px' }} />
          Seed SQL Script
        </button>
      </div>

      {/* 1. Interactive Table Browser */}
      {activeTabSub === 'browser' && (
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.5rem' }}>
          {/* Left Table Selector */}
          <div className="table-card" style={{ height: 'fit-content' }}>
            <div className="table-header-bar">
              <h3 className="table-header-title">7 Relational Tables</h3>
            </div>
            <div style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {tablesMeta.map(t => {
                const isSelected = activeTable === t.name;
                return (
                  <button
                    key={t.name}
                    onClick={() => setActiveTable(t.name)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.6rem 0.75rem',
                      background: isSelected ? 'var(--bg-subtle)' : 'transparent',
                      border: isSelected ? '1px solid var(--border-strong)' : '1px solid transparent',
                      borderRadius: '6px',
                      color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.8rem',
                      fontWeight: isSelected ? 600 : 500,
                      transition: 'all 0.15s'
                    }}
                  >
                    <span>{t.label}</span>
                    <span className="nav-badge-count">{t.count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Table Data View */}
          <div className="table-card">
            <div className="table-header-bar">
              <div>
                <h3 className="table-header-title" style={{ fontFamily: 'var(--font-mono)' }}>
                  TABLE: {currentTableMeta.name}
                </h3>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.35rem', flexWrap: 'wrap', fontSize: '0.75rem' }}>
                  <span style={{ color: 'var(--teal-text)' }}>
                    <Key size={12} style={{ display: 'inline', marginRight: '3px' }} />
                    PK: {currentTableMeta.pk}
                  </span>
                  {currentTableMeta.unique.length > 0 && (
                    <span style={{ color: 'var(--amber-text)' }}>
                      <Shield size={12} style={{ display: 'inline', marginRight: '3px' }} />
                      Candidate/Unique: {currentTableMeta.unique.join(', ')}
                    </span>
                  )}
                  {currentTableMeta.fks.length > 0 && (
                    <span style={{ color: 'var(--purple-text)' }}>
                      <Link size={12} style={{ display: 'inline', marginRight: '3px' }} />
                      FK: {currentTableMeta.fks.join(' | ')}
                    </span>
                  )}
                </div>
              </div>

              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {currentTableMeta.data.length} Rows
              </span>
            </div>

            <div className="table-responsive" style={{ maxHeight: '550px' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    {currentTableMeta.data.length > 0 &&
                      Object.keys(currentTableMeta.data[0]).map(key => (
                        <th key={key}>
                          <span style={{ fontFamily: 'var(--font-mono)' }}>{key}</span>
                          {key === currentTableMeta.pk && (
                            <span style={{ color: 'var(--cyan)', marginLeft: '4px', fontSize: '0.7rem' }}>[PK]</span>
                          )}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {currentTableMeta.data.map((row, idx) => (
                    <tr key={idx}>
                      {Object.entries(row).map(([k, val], cellIdx) => (
                        <td key={cellIdx} style={{ fontSize: '0.82rem' }}>
                          {val === null || val === undefined ? (
                            <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>NULL</span>
                          ) : typeof val === 'object' ? (
                            JSON.stringify(val)
                          ) : typeof val === 'string' && val.startsWith('http') ? (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{val.slice(0, 30)}...</span>
                          ) : (
                            String(val)
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. PostgreSQL DDL View */}
      {activeTabSub === 'ddl' && (
        <div className="table-card">
          <div className="table-header-bar">
            <h3 className="table-header-title">PostgreSQL Supabase Migration DDL</h3>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => handleCopy(FULL_POSTGRES_SCHEMA)}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy SQL Script'}</span>
            </button>
          </div>
          <div style={{ padding: '1rem' }}>
            <pre className="sql-code-block">{FULL_POSTGRES_SCHEMA}</pre>
          </div>
        </div>
      )}

      {/* 3. Seed SQL View */}
      {activeTabSub === 'seed' && (
        <div className="table-card">
          <div className="table-header-bar">
            <h3 className="table-header-title">Sample Data Insertion Queries</h3>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => handleCopy(SAMPLE_SEED_SQL)}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Seed Script'}</span>
            </button>
          </div>
          <div style={{ padding: '1rem' }}>
            <pre className="sql-code-block">{SAMPLE_SEED_SQL}</pre>
          </div>
        </div>
      )}
    </div>
  );
};
