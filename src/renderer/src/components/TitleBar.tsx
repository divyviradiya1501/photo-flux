import React from 'react';
import { Minus, Square, X } from 'lucide-react';

export const TitleBar: React.FC = () => {
    return (
        <div
            style={{
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingLeft: 16,
                paddingRight: 0,
                background: 'var(--bg-secondary)',
                WebkitAppRegion: 'drag',
                borderBottom: '1px solid var(--glass-border)',
                zIndex: 9999
            } as any}
        >
            {/* Branding */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--text-primary)' }}></div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
                    PHOTO FLUX
                </span>
            </div>

            {/* Custom Controls */}
            <div style={{ display: 'flex', WebkitAppRegion: 'no-drag' } as any}>
                <button
                    onClick={() => window.api.windowControl('minimize')}
                    className="titlebar-btn"
                >
                    <Minus size={14} />
                </button>
                <button
                    onClick={() => window.api.windowControl('maximize')}
                    className="titlebar-btn"
                >
                    <Square size={11} />
                </button>
                <button
                    onClick={() => window.api.windowControl('close')}
                    className="titlebar-btn close"
                >
                    <X size={14} />
                </button>
            </div>

            <style>{`
                .titlebar-btn {
                    width: 40px;
                    height: 32px;
                    border: none;
                    background: transparent;
                    color: var(--text-muted);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.1s;
                }
                .titlebar-btn:hover {
                    background: rgba(255,255,255,0.06);
                    color: var(--text-primary);
                }
                .titlebar-btn.close:hover {
                    background: #ef4444;
                    color: white;
                }
            `}</style>
        </div>
    );
};
