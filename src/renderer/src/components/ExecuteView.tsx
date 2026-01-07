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

    // Track if component is mounted
    const isMounted = useRef(true);
    const hasExecuted = useRef(false);

    const onFinishRef = useRef(onFinish);
    useEffect(() => {
        onFinishRef.current = onFinish;
    }, [onFinish]);

    useEffect(() => {
        isMounted.current = true;

        // CRITICAL: Clear all previous listeners before registering new ones
        // This prevents duplicate events from previous sessions
        window.api.removeAllListeners();

        // Only execute once
        if (hasExecuted.current) return;
        hasExecuted.current = true;

        // Register progress listener
        window.api.onExecuteProgress((data) => {
            if (!isMounted.current) return;
            setProgress(data.current);
            setStats({ success: data.success, failed: data.failed });
            if (data.lastFile) {
                setLastProcessed(prev => [data.lastFile, ...prev].slice(0, 5));
            }
        });

        // Execute the plan
        window.api.executePlan(plan, settings.operationMode).then((result) => {
            if (!isMounted.current) return;

            // Use the FINAL result from executePlan, not from progress events
            // This is the authoritative count
            console.log('Execution complete:', result);
            setStats(result);
            setProgress(plan.length);
            setStatus('DONE');

            // Clean up listeners immediately after completion
            window.api.removeAllListeners();

            setTimeout(() => {
                if (isMounted.current) {
                    onFinishRef.current();
                }
            }, 2000);
        }).catch((err) => {
            console.error('Execution error:', err);
            if (isMounted.current) {
                setStatus('DONE');
            }
        });

        // Cleanup on unmount
        return () => {
            isMounted.current = false;
            window.api.removeAllListeners();
        };
    }, []); // Empty dependency array - only run once on mount

    const percentage = Math.round((progress / plan.length) * 100) || 0;

    return (
        <div style={{ padding: 40, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }} className="animate-fade-in">
            {status === 'RUNNING' && (
                <div style={{ textAlign: 'center', width: '100%', maxWidth: 600 }}>
                    <div style={{ position: 'relative', display: 'inline-block', marginBottom: 32 }}>
                        <svg width="100" height="100" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="45" fill="none" stroke="var(--bg-elevated)" strokeWidth="6" />
                            <circle cx="50" cy="50" r="45" fill="none" stroke="var(--text-primary)" strokeWidth="6"
                                strokeDasharray="282.74"
                                strokeDashoffset={282.74 * (1 - percentage / 100)}
                                strokeLinecap="round"
                                style={{ transition: 'stroke-dashoffset 0.3s ease-out', transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                            />
                        </svg>
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '1.25rem', fontWeight: 'bold' }}>
                            {percentage}%
                        </div>
                    </div>

                    <h2 style={{ marginBottom: 8, fontSize: '1.3rem' }}>Organizing...</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: 28, fontSize: '0.9rem' }}>
                        Processing {progress.toLocaleString()} / {plan.length.toLocaleString()}
                    </p>

                    {/* Live Feed */}
                    <div style={{
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: 'var(--radius-md)',
                        padding: '16px',
                        height: '140px',
                        marginBottom: 32,
                        textAlign: 'left',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        overflow: 'hidden'
                    }}>
                        {lastProcessed.map((file, i) => (
                            <div key={i} style={{
                                color: i === 0 ? 'var(--text-primary)' : 'var(--text-muted)',
                                opacity: 1 - i * 0.18,
                                fontSize: '0.85rem',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                transition: 'all 0.15s'
                            }}>
                                {i === 0 && <span style={{ color: 'var(--success-color)' }}>● </span>}
                                {file.split(/[\\/]/).pop()}
                            </div>
                        ))}
                        {lastProcessed.length === 0 && (
                            <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: 50, fontSize: '0.85rem' }}>
                                Starting...
                            </div>
                        )}
                    </div>

                    {/* Stats */}
                    <div style={{ display: 'flex', gap: 48, justifyContent: 'center' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--success-color)' }}>{stats.success.toLocaleString()}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Success</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--danger-color)' }}>{stats.failed.toLocaleString()}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Failed</div>
                        </div>
                    </div>
                </div>
            )}

            {status === 'DONE' && (
                <div style={{ textAlign: 'center' }} className="animate-fade-in">
                    <div style={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        background: 'var(--success-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 24px',
                        animation: 'pop-in 0.3s ease-out'
                    }}>
                        <CheckCircle color="white" size={44} />
                    </div>
                    <h1 style={{ fontSize: '2rem', marginBottom: 8, color: 'var(--text-primary)' }}>All Done!</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
                        Your photos are organized.
                    </p>
                    <div style={{ marginTop: 20, display: 'flex', gap: 32, justifyContent: 'center' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--success-color)' }}>{stats.success.toLocaleString()}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Successful</div>
                        </div>
                        {stats.failed > 0 && (
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--danger-color)' }}>{stats.failed.toLocaleString()}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Failed</div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExecuteView;
