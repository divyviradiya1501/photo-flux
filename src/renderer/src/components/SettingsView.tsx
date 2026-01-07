import React, { useState, useEffect } from 'react';
import { ArrowLeft, RotateCcw, Settings2, FolderCog, FileText, Copy, Folder, ChevronDown, Check } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

interface Props {
    onBack: () => void;
}

// Reusable Select component
const Select: React.FC<{
    value: string;
    onChange: (val: string) => void;
    options: { value: string; label: string; description?: string }[];
}> = ({ value, onChange, options }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectedLabel = options.find(o => o.value === value)?.label || value;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isOpen && !(event.target as Element).closest('.settings-select')) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <div className="settings-select" style={{ position: 'relative', width: '100%' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '100%',
                    background: 'var(--bg-glass)',
                    border: isOpen ? '1px solid var(--text-muted)' : '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 14px',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.1s'
                }}
            >
                {selectedLabel}
                <ChevronDown size={16} style={{
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.15s',
                    color: 'var(--text-muted)'
                }} />
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    right: 0,
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: 4,
                    zIndex: 100,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                }}>
                    {options.map(opt => (
                        <div
                            key={opt.value}
                            onClick={() => {
                                onChange(opt.value);
                                setIsOpen(false);
                            }}
                            style={{
                                padding: '10px 12px',
                                fontSize: '0.9rem',
                                color: value === opt.value ? 'var(--text-primary)' : 'var(--text-secondary)',
                                background: value === opt.value ? 'var(--bg-glass-hover)' : 'transparent',
                                borderRadius: 'var(--radius-sm)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                transition: 'background 0.1s'
                            }}
                            onMouseEnter={(e) => {
                                if (value !== opt.value) e.currentTarget.style.background = 'var(--bg-glass)';
                            }}
                            onMouseLeave={(e) => {
                                if (value !== opt.value) e.currentTarget.style.background = 'transparent';
                            }}
                        >
                            <div>
                                <div>{opt.label}</div>
                                {opt.description && (
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                        {opt.description}
                                    </div>
                                )}
                            </div>
                            {value === opt.value && <Check size={16} color="var(--success-color)" />}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const SettingsView: React.FC<Props> = ({ onBack }) => {
    const { settings, updateSettings, resetSettings } = useSettings();

    return (
        <div style={{ padding: '24px 40px', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} className="animate-fade-in">
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
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
                        <Settings2 size={22} color="var(--text-primary)" />
                        Settings
                    </h2>
                    <p style={{ color: 'var(--text-muted)', margin: '2px 0 0 0', fontSize: '0.85rem' }}>
                        Configure organization preferences
                    </p>
                </div>
            </div>

            {/* Settings Grid - 2x2 Layout */}
            <div style={{
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                paddingRight: 8
            }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: 16
                }}>

                    {/* Folder Structure */}
                    <div style={{
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: 'var(--radius-lg)',
                        padding: 20,
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <FolderCog size={18} color="var(--text-primary)" />
                            <h3 style={{ margin: 0, fontSize: '0.95rem' }}>Folder Structure</h3>
                        </div>
                        <p style={{ color: 'var(--text-muted)', marginBottom: 12, fontSize: '0.8rem', flex: 1 }}>
                            How to organize photos into folders
                        </p>
                        <Select
                            value={settings.organizationMode}
                            onChange={(v) => updateSettings({ organizationMode: v as 'year' | 'year-month' })}
                            options={[
                                { value: 'year', label: 'Year Only', description: 'Photos/2024/' },
                                { value: 'year-month', label: 'Year & Month', description: 'Photos/2024/January/' }
                            ]}
                        />
                    </div>

                    {/* File Naming */}
                    <div style={{
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: 'var(--radius-lg)',
                        padding: 20,
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <FileText size={18} color="var(--text-primary)" />
                            <h3 style={{ margin: 0, fontSize: '0.95rem' }}>File Naming</h3>
                        </div>
                        <p style={{ color: 'var(--text-muted)', marginBottom: 12, fontSize: '0.8rem', flex: 1 }}>
                            How to name the organized files
                        </p>
                        <Select
                            value={settings.renameMode}
                            onChange={(v) => updateSettings({ renameMode: v as 'original' | 'date-prefix' })}
                            options={[
                                { value: 'original', label: 'Keep Original Name', description: 'IMG_1234.jpg' },
                                { value: 'date-prefix', label: 'Add Date Prefix', description: '2024-01-15_IMG_1234.jpg' }
                            ]}
                        />
                    </div>

                    {/* Operation Mode */}
                    <div style={{
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: 'var(--radius-lg)',
                        padding: 20,
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <Copy size={18} color="var(--text-primary)" />
                            <h3 style={{ margin: 0, fontSize: '0.95rem' }}>Operation Mode</h3>
                        </div>
                        <p style={{ color: 'var(--text-muted)', marginBottom: 12, fontSize: '0.8rem', flex: 1 }}>
                            Choose between moving or copying files
                        </p>
                        <Select
                            value={settings.operationMode}
                            onChange={(v) => updateSettings({ operationMode: v as 'copy' | 'move' })}
                            options={[
                                { value: 'copy', label: 'Copy Files', description: 'Keep original files intact' },
                                { value: 'move', label: 'Move Files', description: 'Remove files from source' }
                            ]}
                        />
                    </div>

                    {/* Destination */}
                    <div style={{
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: 'var(--radius-lg)',
                        padding: 20,
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <Folder size={18} color="var(--text-primary)" />
                            <h3 style={{ margin: 0, fontSize: '0.95rem' }}>Destination</h3>
                        </div>
                        <p style={{ color: 'var(--text-muted)', marginBottom: 12, fontSize: '0.8rem' }}>
                            Where to save organized photos
                        </p>
                        <Select
                            value={settings.useCustomOutputPath ? 'custom' : 'default'}
                            onChange={(v) => updateSettings({ useCustomOutputPath: v === 'custom' })}
                            options={[
                                { value: 'default', label: 'Default (Source + Suffix)', description: 'Create folder next to source' },
                                { value: 'custom', label: 'Custom Path', description: 'Choose a specific folder' }
                            ]}
                        />

                        {settings.useCustomOutputPath ? (
                            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                                <input
                                    type="text"
                                    value={settings.customOutputPath}
                                    readOnly
                                    placeholder="Select folder..."
                                    style={{
                                        flex: 1,
                                        background: 'var(--bg-glass)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: 'var(--radius-md)',
                                        padding: '8px 12px',
                                        color: 'var(--text-secondary)',
                                        fontSize: '0.85rem'
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
                                        padding: '0 12px',
                                        color: 'var(--text-primary)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        fontSize: '0.85rem',
                                        transition: 'all 0.1s'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--text-muted)'}
                                    onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--glass-border)'}
                                >
                                    <Folder size={14} /> Browse
                                </button>
                            </div>
                        ) : (
                            <div style={{ marginTop: 12 }}>
                                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: 4 }}>
                                    Folder Suffix
                                </label>
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
                                        fontSize: '0.85rem',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                    onClick={resetSettings}
                    style={{
                        background: 'transparent',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--glass-border)',
                        padding: '10px 20px',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        transition: 'all 0.1s',
                        cursor: 'pointer'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.background = 'var(--bg-glass-hover)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                    }}
                >
                    <RotateCcw size={16} />
                    Reset to Defaults
                </button>
            </div>
        </div>
    );
};

export default SettingsView;
