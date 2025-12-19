import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

interface Props {
    plan: any[];
    onFinish: () => void;
}

const ExecuteView: React.FC<Props> = ({ plan, onFinish }) => {
    const { settings } = useSettings();
    const [progress, setProgress] = useState(0);
    const [stats, setStats] = useState({ success: 0, failed: 0 });
    const [status, setStatus] = useState<'RUNNING' | 'DONE'>('RUNNING');
    const [lastProcessed, setLastProcessed] = useState<string[]>([]);

    // Fix stale closure for onFinish in async effect
    const onFinishRef = useRef(onFinish);
    useEffect(() => {
        onFinishRef.current = onFinish;
    }, [onFinish]);

    useEffect(() => {
        window.api.onExecuteProgress((data) => {
            setProgress(data.current);
            setStats({ success: data.success, failed: data.failed });
            if (data.lastFile) {
                setLastProcessed(prev => [data.lastFile, ...prev].slice(0, 5));
            }
        });

        window.api.executePlan(plan, settings.operationMode).then((result) => {
            setStats(result);
            setProgress(plan.length);
            setStatus('DONE');
            setTimeout(() => onFinishRef.current(), 2000);
        });
    }, [plan, settings.operationMode]);

    const percentage = Math.round((progress / plan.length) * 100) || 0;

    return (
        <div style={{ padding: 40, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }} className="animate-fade-in">
            {status === 'RUNNING' && (
                <div style={{ textAlign: 'center', width: '100%', maxWidth: 700 }}>
                    <div style={{ position: 'relative', display: 'inline-block', marginBottom: 40 }}>
                        {/* Circular Progress (CSS only) */}
                        <svg width="120" height="120" viewBox="0 0 120 120">
                            <circle cx="60" cy="60" r="54" fill="none" stroke="var(--bg-glass)" strokeWidth="8" />
                            <circle cx="60" cy="60" r="54" fill="none" stroke="var(--accent-primary)" strokeWidth="8"
                                strokeDasharray="339.29"
                                strokeDashoffset={339.29 * (1 - percentage / 100)}
                                strokeLinecap="round"
                                style={{ transition: 'stroke-dashoffset 0.5s ease-out', filter: 'drop-shadow(0 0 8px var(--accent-glow))' }}
                            />
                        </svg>
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '1.5rem', fontWeight: 'bold' }}>
                            {percentage}%
                        </div>
                    </div>

                    <h2 style={{ marginBottom: 12 }}>Organizing...</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
                        Processing {progress.toLocaleString()} / {plan.length.toLocaleString()}
                    </p>

                    {/* Live Feed */}
                    <div style={{
                        background: 'var(--bg-glass)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '20px',
                        height: '160px',
                        marginBottom: 40,
                        textAlign: 'left',
                        backdropFilter: 'blur(20px)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        overflow: 'hidden'
                    }}>
                        {lastProcessed.map((file, i) => (
                            <div key={i} style={{
                                color: i === 0 ? 'var(--accent-primary)' : 'var(--text-muted)',
                                opacity: 1 - i * 0.2,
                                fontSize: '0.9rem',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                transform: `translateX(${i * 2}px)`,
                                transition: 'all 0.3s'
                            }}>
                                {i === 0 && '⚡ '} {file.split(/[\\/]/).pop()}
                            </div>
                        ))}
                        {lastProcessed.length === 0 && (
                            <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: 50 }}>
                                Starting engine...
                            </div>
                        )}
                    </div>

                    {/* Stats */}
                    <div style={{ display: 'flex', gap: 60, justifyContent: 'center' }}>
                        <div className="stat-card" style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}>
                            <div className="stat-value" style={{ fontSize: '2.5rem', color: 'var(--success-color)' }}>{stats.success.toLocaleString()}</div>
                            <div className="stat-label">Success</div>
                        </div>
                        <div className="stat-card" style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}>
                            <div className="stat-value" style={{ fontSize: '2.5rem', color: 'var(--danger-color)' }}>{stats.failed.toLocaleString()}</div>
                            <div className="stat-label">Failed</div>
                        </div>
                    </div>
                </div>
            )}

            {status === 'DONE' && (
                <div style={{ textAlign: 'center' }} className="animate-fade-in">
                    <div style={{
                        width: 100,
                        height: 100,
                        borderRadius: '50%',
                        background: 'var(--success-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 32px',
                        boxShadow: '0 0 40px rgba(34, 197, 94, 0.6)',
                        animation: 'pop-in 0.5s cubic-bezier(0.26, 0.53, 0.74, 1.48)'
                    }}>
                        <CheckCircle color="white" size={60} />
                    </div>
                    <h1 style={{ fontSize: '3rem', marginBottom: 12 }}>All Done!</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>
                        Your photos are perfectly organized.
                    </p>
                </div>
            )}
        </div>
    );
};

export default ExecuteView;
