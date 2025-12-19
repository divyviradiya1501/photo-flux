import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Loader2, FolderOpen, CheckCircle2 } from 'lucide-react';

interface Props {
    onBack: () => void;
    onScanComplete: (files: string[], dir: string) => void;
}

const ScanView: React.FC<Props> = ({ onBack, onScanComplete }) => {
    const [status, setStatus] = useState<'IDLE' | 'SCANNING' | 'DONE'>('IDLE');
    const [dir, setDir] = useState<string>('');
    const [filesFound, setFilesFound] = useState<string[]>([]);
    const [scanPath, setScanPath] = useState<string>('');

    // Use ref to keep a synchronous, always-accurate list for the completion callback
    const allFilesRef = useRef<string[]>([]);
    const dirRef = useRef<string>('');

    // Use ref for the completion callback to avoid effect re-runs
    const onCompleteRef = useRef(onScanComplete);
    useEffect(() => {
        onCompleteRef.current = onScanComplete;
    }, [onScanComplete]);

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
            updateUI(); // Final sync for the UI
            setStatus('DONE');

            // Crucial: Use the ref here to ensure we have ALL files immediately
            // and don't rely on the next render cycle's state.
            setTimeout(() => {
                onCompleteRef.current(allFilesRef.current, dirRef.current);
            }, 800);
        };

        const handleError = (err: string) => {
            console.error('Scan error:', err);
            setStatus('IDLE');
        };

        // Use direct ipcRenderer to allow cleanup
        window.api.onScanResult(handleResult);
        window.api.onScanDone(handleDone);
        window.api.onScanError(handleError);

        return () => {
            clearInterval(interval);
            window.api.removeScanListeners();
        };
    }, []); // Empty dependency array = stable listeners

    const handleSelectDir = async () => {
        const selected = await window.api.openDirectory();
        if (selected) {
            setDir(selected);
            dirRef.current = selected;
            allFilesRef.current = []; // Reset ref
            setFilesFound([]); // Reset state
            setStatus('SCANNING');
            window.api.startScan(selected);
        }
    };

    return (
        <div style={{ padding: 40, height: '100%', display: 'flex', flexDirection: 'column' }} className="animate-fade-in">
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

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                {status === 'IDLE' && (
                    <div style={{ textAlign: 'center' }} className="animate-fade-in">
                        <FolderOpen
                            size={64}
                            style={{
                                marginBottom: 24,
                                filter: 'drop-shadow(0 0 20px var(--accent-glow))'
                            }}
                            color="var(--accent-primary)"
                            className="animate-float"
                        />
                        <h2 style={{ marginBottom: 12 }}>Select Directory</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
                            Choose the folder or drive containing photos to organize
                        </p>
                        <button
                            onClick={handleSelectDir}
                            style={{
                                background: 'var(--accent-gradient)',
                                color: 'white',
                                border: 'none',
                                padding: '16px 40px',
                                borderRadius: 'var(--radius-lg)',
                                fontSize: '1.1rem',
                                fontWeight: '600',
                                boxShadow: '0 4px 30px var(--accent-glow)',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                                e.currentTarget.style.boxShadow = '0 8px 40px var(--accent-glow)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                e.currentTarget.style.boxShadow = '0 4px 30px var(--accent-glow)';
                            }}
                        >
                            Browse Folder...
                        </button>
                    </div>
                )}

                {status === 'SCANNING' && (
                    <div style={{ textAlign: 'center' }} className="animate-fade-in">
                        <Loader2
                            size={64}
                            style={{
                                animation: 'spin 1s linear infinite',
                                marginBottom: 24,
                                filter: 'drop-shadow(0 0 20px var(--accent-glow))'
                            }}
                            color="var(--accent-primary)"
                        />
                        <h2 style={{ marginBottom: 16 }}>Scanning...</h2>
                        <div className="stat-value" style={{
                            fontSize: '4rem',
                            marginBottom: 8,
                            animation: 'pulse-glow 1.5s ease-in-out infinite'
                        }}>
                            {filesFound.length.toLocaleString()}
                        </div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>images found</p>

                        {/* Indeterminate Glass Progress Bar */}
                        <div className="progress-container" style={{
                            width: '300px',
                            height: '6px',
                            margin: '0 auto 32px',
                            background: 'var(--bg-glass)',
                            overflow: 'hidden'
                        }}>
                            <div className="progress-bar" style={{
                                width: '40%',
                                position: 'absolute',
                                animation: 'progress-loading 1.5s infinite ease-in-out',
                                background: 'var(--accent-gradient)',
                                boxShadow: '0 0 15px var(--accent-glow)'
                            }}></div>
                        </div>

                        {/* Glass path display */}
                        <div style={{
                            background: 'var(--bg-glass)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: 'var(--radius-md)',
                            padding: '12px 24px',
                            maxWidth: 600,
                            backdropFilter: 'blur(15px)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                            margin: '0 auto'
                        }}>
                            <p style={{
                                color: 'var(--accent-primary)',
                                fontSize: '0.85rem',
                                margin: 0,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                fontFamily: 'monospace',
                                opacity: 0.8
                            }}>
                                {scanPath || 'Initializing search...'}
                            </p>
                        </div>
                    </div>
                )}

                {status === 'DONE' && (
                    <div style={{ textAlign: 'center' }} className="animate-fade-in">
                        <CheckCircle2
                            size={64}
                            style={{
                                marginBottom: 24,
                                filter: 'drop-shadow(0 0 20px rgba(34, 197, 94, 0.5))'
                            }}
                            color="var(--success-color)"
                        />
                        <h2 style={{ color: 'var(--success-color)', marginBottom: 8 }}>Scan Complete</h2>
                        <p style={{ color: 'var(--text-secondary)' }}>Analyzing metadata...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ScanView;
