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
                paddingLeft: 16, // Keep left padding for branding
                paddingRight: 0, // Fix: Remove right padding so controls are flush
                background: 'rgba(0,0,0,0.2)',
                backdropFilter: 'blur(10px)',
                WebkitAppRegion: 'drag', // Electron drag area
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                zIndex: 9999
            } as any}
        >
            {/* Branding - Fix 9 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--accent-gradient)' }}></div>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>
                    PHOTO FLUX
                </span>
            </div>

            {/* Custom Controls - Fix 9 */}
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
                    <Square size={12} />
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
                    color: var(--text-secondary);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                    border-radius: 4px;
                }
                .titlebar-btn:hover {
                    background: rgba(255,255,255,0.1);
                    color: white;
                }
                .titlebar-btn.close:hover {
                    background: #ef4444;
                    color: white;
                }
            `}</style>
        </div>
    );
};
