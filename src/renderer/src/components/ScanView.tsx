import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Loader2, FolderOpen, CheckCircle2 } from 'lucide-react';

interface Props {
    onBack: () => void;
    onScanComplete: (files: string[], dir: string) => void;
}

const ScanView: React.FC<Props> = ({ onBack, onScanComplete }) => {
    const [status, setStatus] = useState<'IDLE' | 'SCANNING' | 'SCAN_COMPLETE' | 'DONE'>('IDLE');
    const [dir, setDir] = useState<string>('');
    const [filesFound, setFilesFound] = useState<string[]>([]);
    const [scanPath, setScanPath] = useState<string>('');

    // Use ref to keep a synchronous, always-accurate list for the completion callback
    const allFilesRef = useRef<string[]>([]);
    const dirRef = useRef<string>('');
    const isMounted = useRef(true);

    // Use ref for the completion callback to avoid effect re-runs
    const onCompleteRef = useRef(onScanComplete);
    useEffect(() => {
        onCompleteRef.current = onScanComplete;
    }, [onScanComplete]);

    // CRITICAL: Clear all listeners on mount - ensures fresh start for each scan session
    useEffect(() => {
        isMounted.current = true;

        // Clear ALL listeners on mount to prevent stale events from previous sessions
        window.api.removeAllListeners();

        // Reset refs for fresh scan
        allFilesRef.current = [];
        dirRef.current = '';

        return () => {
            isMounted.current = false;
            window.api.removeAllListeners();
        };
    }, []);

    useEffect(() => {
        let buffer: string[] = [];
        let latestPath = '';

        const updateUI = () => {
            if (buffer.length > 0 || latestPath) {
                if (buffer.length > 0) setFilesFound(prev => [...prev, ...buffer]);
                if (latestPath) setScanPath(latestPath);
                buffer = [];
                latestPath = '';
            }
        };

        const interval = setInterval(updateUI, 100);

        const handleResult = (path: string) => {
            latestPath = path;
            buffer.push(path);
            allFilesRef.current.push(path);
        };

        const handleDone = () => {
            updateUI();
            // Show scan complete screen for a moment
            setStatus('SCAN_COMPLETE');

            // After showing completion, proceed to metadata
            setTimeout(() => {
                setStatus('DONE');
                setTimeout(() => {
                    onCompleteRef.current(allFilesRef.current, dirRef.current);
                }, 500);
            }, 1200);
        };

        const handleError = (err: string) => {
            console.error('Scan error:', err);
            setStatus('IDLE');
        };

        window.api.onScanResult(handleResult);
        window.api.onScanDone(handleDone);
        window.api.onScanError(handleError);

        return () => {
            clearInterval(interval);
            window.api.removeScanListeners();
        };
    }, []);

    const handleSelectDir = async () => {
        // Clear ALL listeners to prevent duplicate events from any source
        window.api.removeAllListeners();

        const selected = await window.api.openDirectory();
        if (selected && isMounted.current) {
            // Reset all state for a fresh scan
            setDir(selected);
            dirRef.current = selected;
            allFilesRef.current = [];
            setFilesFound([]);
            setScanPath('');
            setStatus('SCANNING');

            // Re-register listeners after clearing
            window.api.onScanResult((path: string) => {
                if (!isMounted.current) return;
                allFilesRef.current.push(path);
                setFilesFound(prev => [...prev, path]);
                setScanPath(path);
            });

            window.api.onScanDone(() => {
                if (!isMounted.current) return;
                setStatus('SCAN_COMPLETE');
                setTimeout(() => {
                    if (!isMounted.current) return;
                    setStatus('DONE');
                    setTimeout(() => {
                        if (isMounted.current) {
                            onCompleteRef.current(allFilesRef.current, dirRef.current);
                        }
                    }, 500);
                }, 1200);
            });

            window.api.onScanError((err: string) => {
                console.error('Scan error:', err);
                if (isMounted.current) {
                    setStatus('IDLE');
                }
            });

            // Start the scan with the selected directory
            console.log('Starting scan for directory:', selected);
            window.api.startScan(selected);
        }
    };

    return (
        <div style={{ padding: 40, height: '100%', display: 'flex', flexDirection: 'column' }} className="animate-fade-in">
            {/* Back Button */}
            <button
                onClick={onBack}
                style={{
                    background: 'transparent',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text-muted)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 24,
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-md)',
                    width: 'fit-content',
                    fontSize: '0.85rem',
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
                <ArrowLeft size={16} /> Back
            </button>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                {status === 'IDLE' && (
                    <div style={{ textAlign: 'center' }} className="animate-fade-in">
                        <div style={{
                            width: 80,
                            height: 80,
                            borderRadius: 20,
                            background: 'var(--bg-elevated)',
                            border: '1px solid var(--glass-border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 24px'
                        }}>
                            <FolderOpen size={40} color="var(--text-primary)" />
                        </div>
                        <h2 style={{ marginBottom: 8, fontSize: '1.5rem' }}>Select Directory</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: 32, fontSize: '0.9rem' }}>
                            Choose the folder containing photos to organize
                        </p>
                        <button
                            onClick={handleSelectDir}
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
                            Browse Folder
                        </button>
                    </div>
                )}

                {status === 'SCANNING' && (
                    <div style={{ textAlign: 'center' }} className="animate-fade-in">
                        <Loader2
                            size={48}
                            style={{ marginBottom: 24 }}
                            color="var(--text-primary)"
                            className="animate-spin"
                        />
                        <h2 style={{ marginBottom: 16, fontSize: '1.4rem' }}>Scanning Directory</h2>
                        <div style={{
                            fontSize: '3rem',
                            fontWeight: '700',
                            marginBottom: 8,
                            color: 'var(--text-primary)'
                        }}>
                            {filesFound.length.toLocaleString()}
                        </div>
                        <p style={{ color: 'var(--text-muted)', marginBottom: 32, fontSize: '0.9rem' }}>images found</p>

                        {/* Progress indicator */}
                        <div style={{
                            width: '280px',
                            height: '4px',
                            margin: '0 auto 32px',
                            background: 'var(--bg-elevated)',
                            borderRadius: 2,
                            overflow: 'hidden',
                            position: 'relative'
                        }}>
                            <div style={{
                                width: '40%',
                                height: '100%',
                                background: 'var(--text-primary)',
                                position: 'absolute',
                                animation: 'progress-loading 1.5s infinite ease-in-out'
                            }}></div>
                        </div>

                        {/* Current path display */}
                        <div style={{
                            background: 'var(--bg-elevated)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: 'var(--radius-md)',
                            padding: '10px 20px',
                            maxWidth: 500,
                            margin: '0 auto'
                        }}>
                            <p style={{
                                color: 'var(--text-muted)',
                                fontSize: '0.8rem',
                                margin: 0,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                fontFamily: 'monospace'
                            }}>
                                {scanPath || 'Starting scan...'}
                            </p>
                        </div>
                    </div>
                )}

                {status === 'SCAN_COMPLETE' && (
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
                            <CheckCircle2 size={40} color="white" />
                        </div>
                        <h2 style={{ color: 'var(--success-color)', marginBottom: 8, fontSize: '1.4rem' }}>
                            Scan Complete
                        </h2>
                        <p style={{
                            color: 'var(--text-primary)',
                            fontSize: '2rem',
                            fontWeight: '700',
                            marginBottom: 8
                        }}>
                            {filesFound.length.toLocaleString()} images found
                        </p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            Preparing metadata analysis...
                        </p>
                    </div>
                )}

                {status === 'DONE' && (
                    <div style={{ textAlign: 'center' }} className="animate-fade-in">
                        <Loader2
                            size={40}
                            style={{ marginBottom: 20 }}
                            color="var(--text-primary)"
                            className="animate-spin"
                        />
                        <h2 style={{ marginBottom: 8, fontSize: '1.2rem' }}>Loading Metadata Analyzer</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            {filesFound.length.toLocaleString()} images ready for processing
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ScanView;
