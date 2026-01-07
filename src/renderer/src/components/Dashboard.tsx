import React from 'react';
import { FolderSearch, History, ShieldCheck, Settings } from 'lucide-react';

interface Props {
    onStart: () => void;
    onRevert: () => void;
    onSettings?: () => void;
}

const Dashboard: React.FC<Props> = ({ onStart, onRevert, onSettings }) => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            padding: 40,
            position: 'relative'
        }} className="animate-fade-in">

            {/* Settings Button */}
            {onSettings && (
                <button
                    onClick={onSettings}
                    style={{
                        position: 'absolute',
                        top: 20,
                        right: 20,
                        background: 'var(--bg-glass)',
                        border: '1px solid var(--glass-border)',
                        padding: 10,
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-muted)',
                        transition: 'all 0.1s'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.background = 'var(--bg-glass-hover)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.background = 'var(--bg-glass)';
                        e.currentTarget.style.color = 'var(--text-muted)';
                    }}
                >
                    <Settings size={18} />
                </button>
            )}

            {/* Logo / Title */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{
                    width: 64,
                    height: 64,
                    borderRadius: 16,
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--glass-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px'
                }}>
                    <FolderSearch size={32} color="var(--text-primary)" />
                </div>
                <h1 style={{
                    fontSize: '2.5rem',
                    marginBottom: 8,
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.5px',
                    fontWeight: 600
                }}>
                    Photo Flux
                </h1>
                <p style={{
                    color: 'var(--text-muted)',
                    fontSize: '0.95rem',
                    margin: 0
                }}>
                    Organize your photos automatically
                </p>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 16, marginTop: 32 }}>
                <button
                    onClick={onStart}
                    style={{
                        background: 'var(--text-primary)',
                        color: 'var(--bg-primary)',
                        border: 'none',
                        padding: '14px 28px',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        transition: 'all 0.1s'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.background = '#e4e4e7';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.background = 'var(--text-primary)';
                    }}
                >
                    <FolderSearch size={20} />
                    Scan Directories
                </button>

                <button
                    onClick={onRevert}
                    style={{
                        background: 'transparent',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--glass-border)',
                        padding: '14px 28px',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.95rem',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        transition: 'all 0.1s'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.background = 'var(--bg-glass-hover)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                        e.currentTarget.style.borderColor = 'var(--text-muted)';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                        e.currentTarget.style.borderColor = 'var(--glass-border)';
                    }}
                >
                    <History size={20} />
                    Revert Previous
                </button>
            </div>

            {/* Feature Badges */}
            <div style={{
                marginTop: 60,
                display: 'flex',
                gap: 24,
                padding: '12px 24px',
                background: 'var(--bg-glass)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--glass-border)'
            }}>
                {[
                    { label: 'Non-Destructive' },
                    { label: 'Atomic Moves' },
                    { label: 'Full Revert' }
                ].map(({ label }) => (
                    <div key={label} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        color: 'var(--text-muted)',
                        fontSize: '0.8rem'
                    }}>
                        <ShieldCheck size={14} color="var(--success-color)" />
                        <span>{label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Dashboard;
