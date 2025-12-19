import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, RotateCcw, Loader2, CheckCircle, History } from 'lucide-react';

interface Props {
    onBack: () => void;
}

const RevertView: React.FC<Props> = ({ onBack }) => {
    const [sessions, setSessions] = useState<string[]>([]);
    const [selectedSession, setSelectedSession] = useState<string | null>(null);
    const [status, setStatus] = useState<'IDLE' | 'REVERTING' | 'DONE'>('IDLE');
    const [revertResult, setRevertResult] = useState<{ success: number, failed: number, errors: string[] } | null>(null);

    useEffect(() => {
        window.api.listSessions().then(sessionPaths => {
            const sorted = [...sessionPaths].sort((a, b) => {
                const timeA = parseInt(a.split('_')[1] || '0');
                const timeB = parseInt(b.split('_')[1] || '0');
                return timeB - timeA;
            });
            setSessions(sorted);
        });
    }, []);

    const handleRevert = async () => {
        if (!selectedSession) return;
        setStatus('REVERTING');

        try {
            const result = await window.api.revertSession(selectedSession);
            setRevertResult(result);
            setStatus('DONE');
        } catch (err) {
            alert('Revert failed: ' + err);
            setStatus('IDLE');
        }
    };

    if (status === 'REVERTING') {
        return (
            <div style={{ padding: 40, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }} className="animate-fade-in">
                <Loader2
                    size={64}
                    style={{
                        animation: 'spin 1s linear infinite',
                        marginBottom: 24,
                        filter: 'drop-shadow(0 0 20px rgba(239, 68, 68, 0.5))'
                    }}
                    color="var(--danger-color)"
                />
                <h2 style={{ marginBottom: 8 }}>Reverting Session...</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Restoring files to their original locations</p>
            </div>
        );
    }

    if (status === 'DONE' && revertResult) {
        return (
            <div style={{ padding: 40, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }} className="animate-fade-in">
                <CheckCircle
                    size={80}
                    color="var(--success-color)"
                    style={{ marginBottom: 24, filter: 'drop-shadow(0 0 30px rgba(34, 197, 94, 0.5))' }}
                />
                <h2 style={{ marginBottom: 32 }}>Revert Complete</h2>

                <div style={{ display: 'flex', gap: 32, marginBottom: 40 }}>
                    <div className="stat-card" style={{ minWidth: 120 }}>
                        <div className="stat-value" style={{ fontSize: '2.5rem' }}>{revertResult.success}</div>
                        <div className="stat-label">Restored</div>
                    </div>
                    <div className="stat-card" style={{ minWidth: 120 }}>
                        <div className="stat-value" style={{ fontSize: '2.5rem', background: 'linear-gradient(135deg, #ef4444, #f87171)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{revertResult.failed}</div>
                        <div className="stat-label">Failed</div>
                    </div>
                </div>

                {revertResult.errors.length > 0 && (
                    <div className="file-list" style={{ maxHeight: 200, width: '100%', maxWidth: 500, marginBottom: 32 }}>
                        {revertResult.errors.map((e, i) => (
                            <div key={i} style={{ padding: '8px 12px', color: 'var(--danger-color)', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                                {e}
                            </div>
                        ))}
                    </div>
                )}

                <button
                    onClick={onBack}
                    style={{
                        background: 'var(--accent-gradient)',
                        color: 'white',
                        border: 'none',
                        padding: '16px 40px',
                        borderRadius: 'var(--radius-lg)',
                        fontSize: '1rem',
                        fontWeight: '600',
                        boxShadow: '0 4px 30px var(--accent-glow)',
                        transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 40px var(--accent-glow)';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 30px var(--accent-glow)';
                    }}
                >
                    Back to Home
                </button>
            </div>
        );
    }

    return (
        <div style={{ padding: 40, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} className="animate-fade-in">
            {/* Back Button */}
            <button
                onClick={onBack}
                style={{
                    background: 'var(--bg-glass)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text-secondary)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 24,
                    padding: '10px 16px',
                    borderRadius: 'var(--radius-md)',
                    backdropFilter: 'blur(10px)',
                    width: 'fit-content',
                    transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                    e.currentTarget.style.background = 'var(--bg-glass-hover)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseOut={(e) => {
                    e.currentTarget.style.background = 'var(--bg-glass)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                }}
            >
                <ArrowLeft size={18} /> Back
            </button>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
                <History size={28} color="var(--accent-primary)" />
                <h2 style={{ margin: 0 }}>Restore Previous Session</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Select a session to undo all changes</p>

            {/* Session List */}
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '30px 20px', margin: '0 -20px' }}>
                {sessions.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: 60,
                        background: 'var(--bg-glass)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: 'var(--radius-lg)',
                        backdropFilter: 'blur(10px)'
                    }}>
                        <History size={48} color="var(--text-muted)" style={{ marginBottom: 16 }} />
                        <p style={{ color: 'var(--text-muted)', margin: 0 }}>No history found</p>
                    </div>
                ) : (
                    sessions.map(sessionPath => {
                        const name = sessionPath.split(/[\\/]/).pop()!;
                        const timestamp = parseInt(name.split('_')[1] || '0');
                        const date = new Date(timestamp).toLocaleString();
                        const isSelected = selectedSession === sessionPath;

                        return (
                            <div
                                key={sessionPath}
                                onClick={() => setSelectedSession(sessionPath)}
                                className={`session-card ${isSelected ? 'selected' : ''}`}
                                style={{
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontWeight: '600' }}>
                                    <Clock size={18} color={isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)'} />
                                    <span>{date}</span>
                                </div>
                                <div style={{
                                    color: 'var(--text-muted)',
                                    fontSize: '0.85rem',
                                    marginTop: 8,
                                    fontFamily: 'monospace',
                                    marginLeft: 30
                                }}>
                                    {name}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Action Button */}
            <div style={{ marginTop: 24, textAlign: 'right' }}>
                <button
                    onClick={handleRevert}
                    disabled={!selectedSession}
                    style={{
                        background: selectedSession ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'var(--bg-glass)',
                        color: selectedSession ? 'white' : 'var(--text-muted)',
                        border: selectedSession ? 'none' : '1px solid var(--glass-border)',
                        padding: '16px 40px',
                        borderRadius: 'var(--radius-lg)',
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: selectedSession ? 'pointer' : 'not-allowed',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 12,
                        boxShadow: selectedSession ? '0 4px 30px rgba(239, 68, 68, 0.4)' : 'none',
                        transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => {
                        if (selectedSession) {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 8px 40px rgba(239, 68, 68, 0.5)';
                        }
                    }}
                    onMouseOut={(e) => {
                        if (selectedSession) {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 30px rgba(239, 68, 68, 0.4)';
                        }
                    }}
                >
                    <RotateCcw size={20} />
                    Revert Selected Session
                </button>
            </div>
        </div>
    );
};

export default RevertView;
