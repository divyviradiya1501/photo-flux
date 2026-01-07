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
            // Filter out reverted sessions and sort by time
            const activeSessions = sessionPaths.filter(p => !p.includes('.reverted'));
            const sorted = [...activeSessions].sort((a, b) => {
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
                    size={48}
                    className="animate-spin"
                    style={{ marginBottom: 24 }}
                    color="var(--text-primary)"
                />
                <h2 style={{ marginBottom: 8, fontSize: '1.3rem' }}>Reverting Session...</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Restoring files to their original locations</p>
            </div>
        );
    }

    if (status === 'DONE' && revertResult) {
        return (
            <div style={{ padding: 40, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }} className="animate-fade-in">
                <div style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    background: 'var(--success-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 24,
                    animation: 'pop-in 0.3s ease-out'
                }}>
                    <CheckCircle size={36} color="white" />
                </div>
                <h2 style={{ marginBottom: 24, fontSize: '1.4rem' }}>Revert Complete</h2>

                <div style={{ display: 'flex', gap: 32, marginBottom: 32 }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--success-color)' }}>{revertResult.success}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Restored</div>
                    </div>
                    {revertResult.failed > 0 && (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--danger-color)' }}>{revertResult.failed}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Failed</div>
                        </div>
                    )}
                </div>

                {revertResult.errors.length > 0 && (
                    <div style={{
                        maxHeight: 160,
                        width: '100%',
                        maxWidth: 500,
                        marginBottom: 24,
                        overflowY: 'auto',
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: 'var(--radius-md)',
                        padding: 12
                    }}>
                        {revertResult.errors.map((e, i) => (
                            <div key={i} style={{ padding: '6px 8px', color: 'var(--danger-color)', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                                {e}
                            </div>
                        ))}
                    </div>
                )}

                <button
                    onClick={onBack}
                    style={{
                        background: 'var(--text-primary)',
                        color: 'var(--bg-primary)',
                        border: 'none',
                        padding: '12px 32px',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.95rem',
                        fontWeight: '600',
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
                    Back to Home
                </button>
            </div>
        );
    }

    return (
        <div style={{ padding: 40, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} className="animate-fade-in">
            {/* Header with back button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                <button
                    onClick={onBack}
                    style={{
                        background: 'transparent',
                        border: '1px solid var(--glass-border)',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 36,
                        height: 36,
                        borderRadius: 'var(--radius-md)',
                        transition: 'all 0.1s'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.background = 'var(--bg-glass-hover)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text-muted)';
                    }}
                >
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <History size={22} color="var(--text-primary)" />
                        Restore Session
                    </h2>
                    <p style={{ color: 'var(--text-muted)', margin: '2px 0 0 0', fontSize: '0.85rem' }}>
                        Select a session to undo all changes
                    </p>
                </div>
            </div>

            {/* Session List */}
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                {sessions.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: 48,
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: 'var(--radius-lg)'
                    }}>
                        <History size={40} color="var(--text-muted)" style={{ marginBottom: 12 }} />
                        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>No sessions to restore</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {sessions.map(sessionPath => {
                            const name = sessionPath.split(/[\\/]/).pop()!;
                            const timestamp = parseInt(name.split('_')[1] || '0');
                            const date = new Date(timestamp).toLocaleString();
                            const isSelected = selectedSession === sessionPath;

                            return (
                                <div
                                    key={sessionPath}
                                    onClick={() => setSelectedSession(sessionPath)}
                                    style={{
                                        background: isSelected ? 'var(--bg-glass-hover)' : 'var(--bg-elevated)',
                                        border: isSelected ? '1px solid var(--text-muted)' : '1px solid var(--glass-border)',
                                        borderRadius: 'var(--radius-md)',
                                        padding: '14px 18px',
                                        cursor: 'pointer',
                                        transition: 'all 0.1s'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <Clock size={16} color={isSelected ? 'var(--text-primary)' : 'var(--text-muted)'} />
                                        <span style={{ fontWeight: 500, color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                            {date}
                                        </span>
                                    </div>
                                    <div style={{
                                        color: 'var(--text-muted)',
                                        fontSize: '0.75rem',
                                        marginTop: 4,
                                        fontFamily: 'monospace',
                                        marginLeft: 26
                                    }}>
                                        {name}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Action Button */}
            {sessions.length > 0 && (
                <div style={{ marginTop: 20, textAlign: 'right' }}>
                    <button
                        onClick={handleRevert}
                        disabled={!selectedSession}
                        style={{
                            background: selectedSession ? 'var(--danger-color)' : 'var(--bg-elevated)',
                            color: selectedSession ? 'white' : 'var(--text-muted)',
                            border: selectedSession ? 'none' : '1px solid var(--glass-border)',
                            padding: '12px 28px',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.95rem',
                            fontWeight: '600',
                            cursor: selectedSession ? 'pointer' : 'not-allowed',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 10,
                            transition: 'all 0.1s'
                        }}
                        onMouseOver={(e) => {
                            if (selectedSession) {
                                e.currentTarget.style.transform = 'translateY(-1px)';
                                e.currentTarget.style.background = '#dc2626';
                            }
                        }}
                        onMouseOut={(e) => {
                            if (selectedSession) {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.background = 'var(--danger-color)';
                            }
                        }}
                    >
                        <RotateCcw size={18} />
                        Revert Session
                    </button>
                </div>
            )}
        </div>
    );
};

export default RevertView;
