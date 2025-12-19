import React from 'react';
import { ArrowLeft, RotateCcw, Settings2, FolderCog, FileText, Copy, Folder } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

interface Props {
    onBack: () => void;
}

const SettingsView: React.FC<Props> = ({ onBack }) => {
    const { settings, updateSettings, resetSettings } = useSettings();

    return (
        <div style={{ padding: '10px 40px', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} className="animate-fade-in">
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
                    marginBottom: 8,
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-md)',
                    backdropFilter: 'blur(10px)',
                    width: 'fit-content',
                    fontSize: '0.85rem',
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
                <ArrowLeft size={14} /> Back
            </button>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <Settings2 size={20} color="var(--accent-primary)" />
                <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Settings</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 12, fontSize: '0.85rem' }}>Customize how photos are organized</p>

            {/* Settings Grid */}
            <div
                style={{
                    flex: 1,
                    minHeight: 0,
                    overflowY: 'auto',
                    paddingRight: 8, // Avoid scrollbar overlap
                }}
            >
                <div style={{ maxWidth: 800, display: 'flex', flexDirection: 'column', gap: 16, padding: '10px 0' }}>

                    {/* Organization Mode */}
                    <div className="glass-panel" style={{ padding: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                            <FolderCog size={18} color="var(--accent-primary)" />
                            <h3 style={{ margin: 0, fontSize: '1rem' }}>Folder Structure</h3>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 12, fontSize: '0.85rem' }}>
                            Choose how to organize photos into folders
                        </p>
                        <div className="toggle-group" style={{ marginBottom: 0 }}>
                            <button
                                onClick={() => updateSettings({ organizationMode: 'year' })}
                                className={`toggle-btn ${settings.organizationMode === 'year' ? 'active' : ''}`}
                                style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                            >
                                Year Only
                            </button>
                            <button
                                onClick={() => updateSettings({ organizationMode: 'year-month' })}
                                className={`toggle-btn ${settings.organizationMode === 'year-month' ? 'active' : ''}`}
                                style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                            >
                                Year / Month
                            </button>
                        </div>
                    </div>

                    {/* Rename Mode */}
                    <div className="glass-panel" style={{ padding: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                            <FileText size={18} color="var(--accent-primary)" />
                            <h3 style={{ margin: 0, fontSize: '1rem' }}>File Naming</h3>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 12, fontSize: '0.85rem' }}>
                            Keep original names or add date prefix
                        </p>
                        <div className="toggle-group">
                            <button
                                onClick={() => updateSettings({ renameMode: 'original' })}
                                className={`toggle-btn ${settings.renameMode === 'original' ? 'active' : ''}`}
                                style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                            >
                                Original Name
                            </button>
                            <button
                                onClick={() => updateSettings({ renameMode: 'date-prefix' })}
                                className={`toggle-btn ${settings.renameMode === 'date-prefix' ? 'active' : ''}`}
                                style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                            >
                                Date Prefix
                            </button>
                        </div>
                    </div>

                    {/* Destination Section */}
                    <div className="glass-panel" style={{ padding: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                            <Folder size={18} color="var(--accent-primary)" />
                            <h3 style={{ margin: 0, fontSize: '1rem' }}>Destination</h3>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 12, fontSize: '0.85rem' }}>
                            Choose where to save the organized photos
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '0.9rem' }}>Use Custom Output Path</span>
                                <div className="toggle-group" style={{ minWidth: 160 }}>
                                    <button
                                        onClick={() => updateSettings({ useCustomOutputPath: false })}
                                        className={`toggle-btn ${!settings.useCustomOutputPath ? 'active' : ''}`}
                                    >
                                        Default
                                    </button>
                                    <button
                                        onClick={() => updateSettings({ useCustomOutputPath: true })}
                                        className={`toggle-btn ${settings.useCustomOutputPath ? 'active' : ''}`}
                                    >
                                        Custom
                                    </button>
                                </div>
                            </div>

                            {settings.useCustomOutputPath && (
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <input
                                        type="text"
                                        value={settings.customOutputPath}
                                        readOnly
                                        placeholder="Select a destination folder..."
                                        style={{
                                            flex: 1,
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid var(--glass-border)',
                                            borderRadius: 'var(--radius-md)',
                                            padding: '10px 14px',
                                            color: 'var(--text-secondary)',
                                            fontSize: '0.9rem'
                                        }}
                                    />
                                    <button
                                        onClick={async () => {
                                            const dir = await window.api.openDirectory();
                                            if (dir) updateSettings({ customOutputPath: dir });
                                        }}
                                        style={{
                                            background: 'var(--bg-glass)',
                                            border: '1px solid var(--glass-border)',
                                            borderRadius: 'var(--radius-md)',
                                            padding: '0 16px',
                                            color: 'var(--text-primary)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                                        onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--glass-border)'}
                                    >
                                        <Folder size={16} /> Browse
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Output Folder Suffix Section - Only if not using custom path */}
                    {!settings.useCustomOutputPath && (
                        <div className="glass-panel" style={{ padding: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                <FolderCog size={18} color="var(--accent-primary)" />
                                <h3 style={{ margin: 0, fontSize: '1rem' }}>Output Folder Suffix</h3>
                            </div>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: 12, fontSize: '0.85rem' }}>
                                Suffix to add to the default output folder name (e.g., "Photos_Organized")
                            </p>
                            <div style={{ paddingRight: 2 }}>
                                <input
                                    type="text"
                                    value={settings.outputFolderSuffix}
                                    onChange={(e) => updateSettings({ outputFolderSuffix: e.target.value })}
                                    placeholder="_Organized"
                                    style={{
                                        width: '100%',
                                        boxSizing: 'border-box',
                                        background: 'var(--bg-glass)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: 'var(--radius-md)',
                                        padding: '8px 12px',
                                        color: 'var(--text-primary)',
                                        fontSize: '0.9rem',
                                        backdropFilter: 'blur(10px)',
                                        outline: 'none',
                                        transition: 'all 0.2s'
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Operation Mode */}
                    <div className="glass-panel" style={{ padding: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                            <Copy size={18} color="var(--accent-primary)" />
                            <h3 style={{ margin: 0, fontSize: '1rem' }}>Operation Mode</h3>
                        </div>
                        <div className="toggle-group">
                            <button
                                onClick={() => updateSettings({ operationMode: 'move' })}
                                className={`toggle-btn ${settings.operationMode === 'move' ? 'active' : ''}`}
                                style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                            >
                                Move Files
                            </button>
                            <button
                                onClick={() => updateSettings({ operationMode: 'copy' })}
                                className={`toggle-btn ${settings.operationMode === 'copy' ? 'active' : ''}`}
                                style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                            >
                                Copy Files
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div style={{ marginTop: 16, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                    onClick={resetSettings}
                    style={{
                        background: 'var(--bg-glass)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--glass-border)',
                        padding: '8px 16px',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        backdropFilter: 'blur(10px)',
                        transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.background = 'var(--bg-glass-hover)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.background = 'var(--bg-glass)';
                        e.currentTarget.style.transform = 'translateY(0)';
                    }}
                >
                    <RotateCcw size={18} />
                    Reset to Defaults
                </button>
            </div>
        </div>
    );
};

export default SettingsView;
