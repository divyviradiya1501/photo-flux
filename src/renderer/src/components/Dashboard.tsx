import React from 'react';
import { FolderSearch, History, ShieldCheck, Sparkles, Settings } from 'lucide-react';

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
                        padding: 12,
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-secondary)',
                        backdropFilter: 'blur(10px)',
                        transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.background = 'var(--bg-glass-hover)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                        e.currentTarget.style.transform = 'rotate(45deg)';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.background = 'var(--bg-glass)';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                        e.currentTarget.style.transform = 'rotate(0deg)';
                    }}
                >
                    <Settings size={20} />
                </button>
            )}

            {/* Logo / Title */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <Sparkles
                    size={48}
                    style={{
                        marginBottom: 15,
                        filter: 'drop-shadow(0 0 20px rgba(168, 85, 247, 0.6))'
                    }}
                    color="#a855f7"
                    className="animate-float"
                />
                <h1 style={{
                    fontSize: '3.5rem',
                    marginBottom: 10,
                    background: 'var(--accent-gradient)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-1px'
                }}>
                    Photo Flux
                </h1>
                <p style={{
                    color: 'var(--text-secondary)',
                    fontSize: '1.2rem',
                    margin: 0
                }}>
                    Zero Data Loss • Privacy First • Offline
                </p>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 24, marginTop: 40 }}>
                <button
                    onClick={onStart}
                    className="animate-pulse-glow"
                    style={{
                        background: 'var(--accent-gradient)',
                        color: 'white',
                        border: 'none',
                        padding: '20px 40px',
                        borderRadius: 'var(--radius-lg)',
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        boxShadow: '0 4px 30px var(--accent-glow)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                        e.currentTarget.style.boxShadow = '0 8px 40px var(--accent-glow)';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0) scale(1)';
                        e.currentTarget.style.boxShadow = '0 4px 30px var(--accent-glow)';
                    }}
                >
                    <FolderSearch size={24} />
                    Start New Organization
                </button>

                <button
                    onClick={onRevert}
                    style={{
                        background: 'var(--bg-glass)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--glass-border)',
                        padding: '20px 40px',
                        borderRadius: 'var(--radius-lg)',
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        backdropFilter: 'blur(20px)',
                        transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.background = 'var(--bg-glass-hover)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.background = 'var(--bg-glass)';
                        e.currentTarget.style.borderColor = 'var(--glass-border)';
                        e.currentTarget.style.transform = 'translateY(0)';
                    }}
                >
                    <History size={24} />
                    Revert Previous
                </button>
            </div>

            {/* Feature Badges */}
            <div style={{
                marginTop: 80,
                display: 'flex',
                gap: 32,
                padding: '16px 32px',
                background: 'var(--bg-glass)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--glass-border)',
                backdropFilter: 'blur(20px)'
            }}>
                {[
                    { label: 'Non-Destructive', icon: ShieldCheck },
                    { label: 'Atomic Moves', icon: ShieldCheck },
                    { label: 'Full Revert', icon: ShieldCheck }
                ].map(({ label, icon: Icon }) => (
                    <div key={label} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        color: 'var(--text-secondary)',
                        fontSize: '0.9rem'
                    }}>
                        <Icon size={18} color="var(--success-color)" />
                        <span>{label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Dashboard;
