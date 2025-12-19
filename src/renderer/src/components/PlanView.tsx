import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, AlertTriangle, CheckCircle, Loader2, Copy, ChevronDown, Check, Folder } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

interface Props {
    files: string[];
    sourceDir: string;
    onBack: () => void;
    onPlanReady: (plan: any[]) => void;
}

const GlassSelect: React.FC<{
    value: string;
    onChange: (val: string) => void;
    options: { value: string; label: string }[];
}> = ({ value, onChange, options }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectedLabel = options.find(o => o.value === value)?.label || value;

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isOpen && !(event.target as Element).closest('.glass-select-container')) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <div className="glass-select-container" style={{ position: 'relative', minWidth: 160 }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '100%',
                    background: 'var(--bg-glass)',
                    border: isOpen ? '1px solid var(--accent-primary)' : '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 14px',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: isOpen ? '0 0 0 3px rgba(168, 85, 247, 0.1)' : 'none'
                }}
            >
                {selectedLabel}
                <ChevronDown size={16} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    right: 0,
                    background: 'rgba(20, 20, 25, 0.95)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: 4,
                    zIndex: 100,
                    boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(20px)',
                    animation: 'fade-in 0.1s ease-out'
                }}>
                    {options.map(opt => (
                        <div
                            key={opt.value}
                            onClick={() => {
                                onChange(opt.value);
                                setIsOpen(false);
                            }}
                            style={{
                                padding: '8px 12px',
                                fontSize: '0.9rem',
                                color: value === opt.value ? 'white' : 'var(--text-secondary)',
                                background: value === opt.value ? 'var(--accent-gradient)' : 'transparent',
                                borderRadius: 'var(--radius-sm)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: 2
                            }}
                            onMouseEnter={(e) => {
                                if (value !== opt.value) e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                            }}
                            onMouseLeave={(e) => {
                                if (value !== opt.value) e.currentTarget.style.background = 'transparent';
                            }}
                        >
                            {opt.label}
                            {value === opt.value && <Check size={14} />}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const PlanView: React.FC<Props> = ({ files, sourceDir, onBack, onPlanReady }) => {
    // ... existing hooks
    const { settings, updateSettings } = useSettings();
    const [loading, setLoading] = useState(true);
    const [analysisProgress, setAnalysisProgress] = useState({ current: 0, total: files.length });
    const [plan, setPlan] = useState<any[]>([]);
    const [stats, setStats] = useState({ ready: 0, duplicate: 0, conflict: 0, error: 0 });
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'READY' | 'DUPLICATE' | 'ERROR'>('ALL');
    const [isReanalyzing, setIsReanalyzing] = useState(false);

    // Re-analyze when settings change
    const analyzeFiles = async () => {
        setLoading(true);

        let targetDir = '';
        if (settings.useCustomOutputPath && settings.customOutputPath) {
            targetDir = settings.customOutputPath;
        } else {
            // Default: Source Dir + Suffix
            targetDir = sourceDir.replace(/[\\/]$/, '') + settings.outputFolderSuffix;
        }

        // Pass organizationMode and renameMode from settings (Tasks 6 & 7)
        const generated = await window.api.createPlan(
            files,
            targetDir,
            settings.organizationMode,
            settings.renameMode
        );
        setPlan(generated);

        const stat = { ready: 0, duplicate: 0, conflict: 0, error: 0 };
        generated.forEach(i => {
            if (i.status === 'READY') stat.ready++;
            else if (i.status === 'DUPLICATE') stat.duplicate++;
            else if (i.status === 'CONFLICT') stat.conflict++;
            else stat.error++;
        });
        setStats(stat);
        setLoading(false);
    };

    // Handle organization mode change with animation
    const handleModeChange = (newMode: 'year' | 'year-month') => {
        if (newMode === settings.organizationMode) return;
        setIsReanalyzing(true);
        setTimeout(() => {
            updateSettings({ organizationMode: newMode });
            setIsReanalyzing(false);
        }, 300);
    };

    // Initial analysis and re-analyze when settings change
    useEffect(() => {
        if (files.length > 0) {
            setLoading(true);
            setAnalysisProgress({ current: 0, total: files.length });

            // Listen for progress updates
            window.api.onPlanProgress((data) => {
                setAnalysisProgress(data);
            });

            analyzeFiles();
        } else {
            setLoading(false);
        }
    }, [
        files,
        sourceDir,
        settings.organizationMode,
        settings.renameMode,
        settings.outputFolderSuffix,
        settings.useCustomOutputPath,
        settings.customOutputPath
    ]);

    const displayTarget = settings.useCustomOutputPath
        ? (settings.customOutputPath || 'Select a folder...')
        : (sourceDir.replace(/[\\/]$/, '') + settings.outputFolderSuffix);

    // Filter and search logic
    const filteredPlan = plan.filter(item => {
        const matchesSearch = searchQuery === '' ||
            item.sourcePath.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleExecute = () => {
        onPlanReady(plan);
    };

    if (loading) {
        const percentage = Math.round((analysisProgress.current / (analysisProgress.total || 1)) * 100);
        return (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }} className="animate-fade-in">
                <div style={{ textAlign: 'center', width: '100%', maxWidth: 400 }}>
                    <Loader2 size={48} className="animate-spin" style={{ marginBottom: 24, color: 'var(--accent-primary)', filter: 'drop-shadow(0 0 15px var(--accent-glow))' }} />
                    <h2 style={{ marginBottom: 16 }}>Analyzing Metadata...</h2>

                    {/* Determinate Progress Bar */}
                    <div className="progress-container" style={{
                        marginBottom: 16,
                        height: 10,
                        background: 'var(--bg-glass)',
                        borderRadius: 5,
                        overflow: 'hidden',
                        position: 'relative'
                    }}>
                        <div className="progress-bar" style={{
                            width: `${percentage}%`,
                            height: '100%',
                            background: 'var(--accent-gradient)',
                            transition: 'width 0.3s ease-out',
                            boxShadow: '0 0 20px var(--accent-glow)',
                            borderRadius: 5
                        }}></div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: 8 }}>
                        <span style={{ fontSize: '0.9rem' }}>{analysisProgress.current.toLocaleString()} / {analysisProgress.total.toLocaleString()} photos</span>
                        <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{percentage}%</span>
                    </div>

                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 32, fontStyle: 'italic', opacity: 0.7 }}>
                        Optimizing for production speed...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: 40, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} className="animate-fade-in">
            {/* Header and Info Row */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24, gap: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button
                        onClick={onBack}
                        style={{
                            background: 'var(--bg-glass)',
                            border: '1px solid var(--glass-border)',
                            color: 'var(--text-secondary)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 44,
                            height: 44,
                            borderRadius: 'var(--radius-md)',
                            backdropFilter: 'blur(10px)',
                            transition: 'all 0.2s',
                            flexShrink: 0
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.background = 'var(--bg-glass-hover)';
                            e.currentTarget.style.color = 'var(--text-primary)';
                            e.currentTarget.style.borderColor = 'var(--accent-primary)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.background = 'var(--bg-glass)';
                            e.currentTarget.style.color = 'var(--text-secondary)';
                            e.currentTarget.style.borderColor = 'var(--glass-border)';
                        }}
                    >
                        <ArrowLeft size={22} />
                    </button>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.8rem' }}>Review Plan</h2>
                        <p style={{ color: 'var(--text-secondary)', margin: '2px 0 0 0', fontSize: '0.85rem', whiteSpace: 'nowrap', width: '250px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            Organizing into <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{displayTarget}</span>
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 24, paddingLeft: 24, borderLeft: '1px solid var(--glass-border)' }}>
                    {/* Organize By - Inline Label */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Organize:</span>
                        <div className="toggle-group" style={{ minWidth: 180, padding: 2, background: 'rgba(255,255,255,0.03)', height: 32 }}>
                            <button
                                onClick={() => handleModeChange('year')}
                                className={`toggle-btn ${settings.organizationMode === 'year' ? 'active' : ''}`}
                                style={{ fontSize: '0.75rem', padding: '0 12px' }}
                            >
                                Year Only
                            </button>
                            <button
                                onClick={() => handleModeChange('year-month')}
                                className={`toggle-btn ${settings.organizationMode === 'year-month' ? 'active' : ''}`}
                                style={{ fontSize: '0.75rem', padding: '0 12px' }}
                            >
                                Year / Month
                            </button>
                        </div>
                    </div>

                    {/* Rename Mode - Inline Label */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rename:</span>
                        <div className="toggle-group" style={{ minWidth: 160, padding: 2, background: 'rgba(255,255,255,0.03)', height: 32 }}>
                            <button
                                onClick={() => updateSettings({ renameMode: 'original' })}
                                className={`toggle-btn ${settings.renameMode === 'original' ? 'active' : ''}`}
                                style={{ fontSize: '0.75rem', padding: '0 12px' }}
                            >
                                Original
                            </button>
                            <button
                                onClick={() => updateSettings({ renameMode: 'date-prefix' })}
                                className={`toggle-btn ${settings.renameMode === 'date-prefix' ? 'active' : ''}`}
                                style={{ fontSize: '0.75rem', padding: '0 12px' }}
                            >
                                Date Prefix
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sub-Settings Bar */}
            <div style={{
                marginBottom: 24,
                display: 'grid',
                gridTemplateColumns: 'auto auto 1fr',
                gap: 24,
                padding: '12px 20px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--glass-border)',
                alignItems: 'center'
            }}>
                {/* Operation Mode */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Action:</span>
                    <div className="toggle-group" style={{ minWidth: 140, height: 32 }}>
                        <button
                            onClick={() => updateSettings({ operationMode: 'move' })}
                            className={`toggle-btn ${settings.operationMode === 'move' ? 'active' : ''}`}
                            style={{ fontSize: '0.8rem' }}
                        >
                            Move
                        </button>
                        <button
                            onClick={() => updateSettings({ operationMode: 'copy' })}
                            className={`toggle-btn ${settings.operationMode === 'copy' ? 'active' : ''}`}
                            style={{ fontSize: '0.8rem' }}
                        >
                            Copy
                        </button>
                    </div>
                </div>

                {/* Destination Selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Destination:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="toggle-group" style={{ minWidth: 140, height: 32 }}>
                            <button
                                onClick={() => updateSettings({ useCustomOutputPath: false })}
                                className={`toggle-btn ${!settings.useCustomOutputPath ? 'active' : ''}`}
                                style={{ fontSize: '0.8rem' }}
                            >
                                Default
                            </button>
                            <button
                                onClick={() => updateSettings({ useCustomOutputPath: true })}
                                className={`toggle-btn ${settings.useCustomOutputPath ? 'active' : ''}`}
                                style={{ fontSize: '0.8rem' }}
                            >
                                Custom
                            </button>
                        </div>

                        {settings.useCustomOutputPath && (
                            <button
                                onClick={async () => {
                                    const dir = await window.api.openDirectory();
                                    if (dir) updateSettings({ customOutputPath: dir });
                                }}
                                style={{
                                    background: 'var(--bg-glass)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: 'var(--radius-sm)',
                                    padding: '0 10px',
                                    color: 'var(--text-primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    backdropFilter: 'blur(10px)',
                                    height: 32,
                                    fontSize: '0.8rem'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                                onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--glass-border)'}
                            >
                                <Folder size={14} /> Browse
                            </button>
                        )}
                    </div>
                </div>

                {/* Folder Suffix or Custom Path Input */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                        {settings.useCustomOutputPath ? 'Live Path:' : 'Suffix:'}
                    </span>
                    <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input
                            type="text"
                            value={settings.useCustomOutputPath ? settings.customOutputPath : settings.outputFolderSuffix}
                            readOnly={settings.useCustomOutputPath}
                            onChange={(e) => !settings.useCustomOutputPath && updateSettings({ outputFolderSuffix: e.target.value })}
                            placeholder={settings.useCustomOutputPath ? 'Select a folder...' : '_Organized'}
                            style={{
                                width: '100%',
                                background: settings.useCustomOutputPath ? 'rgba(168, 85, 247, 0.05)' : 'var(--bg-glass)',
                                border: settings.useCustomOutputPath ? '1px solid var(--accent-primary)' : '1px solid var(--glass-border)',
                                borderRadius: 'var(--radius-sm)',
                                padding: '0 12px',
                                color: settings.useCustomOutputPath ? 'var(--text-primary)' : 'var(--text-primary)',
                                fontSize: '0.85rem',
                                outline: 'none',
                                transition: 'all 0.2s',
                                cursor: settings.useCustomOutputPath ? 'default' : 'text',
                                height: 32,
                                boxSizing: 'border-box',
                                fontWeight: settings.useCustomOutputPath ? '500' : '400'
                            }}
                            onFocus={(e) => !settings.useCustomOutputPath && (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
                            onBlur={(e) => !settings.useCustomOutputPath && (e.currentTarget.style.borderColor = 'var(--glass-border)')}
                        />
                        {settings.useCustomOutputPath && (
                            <div style={{
                                position: 'absolute',
                                right: 10,
                                fontSize: '0.7rem',
                                color: 'var(--accent-primary)',
                                textTransform: 'uppercase',
                                fontWeight: 700,
                                letterSpacing: '0.05em'
                            }}>
                                Active
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats and File List - with transition effect */}
            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 0, // Critical for nested flex scrolling
                    opacity: isReanalyzing ? 0.3 : 1,
                    transition: 'opacity 0.3s ease',
                    pointerEvents: isReanalyzing ? 'none' : 'auto',
                    overflow: 'visible' // Allow dropdown to overflow
                }}
            >
                {/* Search and Filter Controls */}
                <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', position: 'relative', zIndex: 10 }}>
                    <input
                        type="text"
                        placeholder="Search files..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            flex: 1,
                            background: 'var(--bg-glass)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: 'var(--radius-md)',
                            padding: '10px 14px',
                            color: 'var(--text-primary)',
                            fontSize: '0.9rem',
                            backdropFilter: 'blur(10px)',
                            outline: 'none',
                            transition: 'all 0.2s'
                        }}
                        onFocus={(e) => {
                            e.currentTarget.style.borderColor = 'var(--accent-primary)';
                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(168, 85, 247, 0.1)';
                        }}
                        onBlur={(e) => {
                            e.currentTarget.style.borderColor = 'var(--glass-border)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    />

                    <GlassSelect
                        value={statusFilter}
                        onChange={(v) => setStatusFilter(v as any)}
                        options={[
                            { value: 'ALL', label: 'All Status' },
                            { value: 'READY', label: 'Ready' },
                            { value: 'DUPLICATE', label: 'Duplicates' },
                            { value: 'ERROR', label: 'Errors' }
                        ]}
                    />

                    {(searchQuery || statusFilter !== 'ALL') && (
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                            {filteredPlan.length.toLocaleString()} / {plan.length.toLocaleString()}
                        </span>
                    )}
                </div>

                {/* Compact Stats Grid (Horizontal) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                    <div className="stat-card" style={{ flexDirection: 'row', alignItems: 'center', padding: '12px 16px', gap: 16, display: 'flex' }}>
                        <div style={{ padding: 8, background: 'rgba(34, 197, 94, 0.1)', borderRadius: '50%' }}>
                            <CheckCircle color="var(--success-color)" size={20} />
                        </div>
                        <div>
                            <div className="stat-value" style={{ fontSize: '1.4rem', lineHeight: 1 }}>{stats.ready.toLocaleString()}</div>
                            <div className="stat-label" style={{ fontSize: '0.75rem', marginTop: 2 }}>Ready</div>
                        </div>
                    </div>
                    <div className="stat-card" style={{ flexDirection: 'row', alignItems: 'center', padding: '12px 16px', gap: 16, display: 'flex' }}>
                        <div style={{ padding: 8, background: 'rgba(245, 158, 11, 0.1)', borderRadius: '50%' }}>
                            <Copy color="var(--warning-color)" size={20} />
                        </div>
                        <div>
                            <div className="stat-value" style={{ fontSize: '1.4rem', lineHeight: 1, color: 'var(--warning-color)' }}>{stats.duplicate.toLocaleString()}</div>
                            <div className="stat-label" style={{ fontSize: '0.75rem', marginTop: 2 }}>Duplicates</div>
                        </div>
                    </div>
                    <div className="stat-card" style={{ flexDirection: 'row', alignItems: 'center', padding: '12px 16px', gap: 16, display: 'flex' }}>
                        <div style={{ padding: 8, background: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%' }}>
                            <AlertTriangle color="var(--danger-color)" size={20} />
                        </div>
                        <div>
                            <div className="stat-value" style={{ fontSize: '1.4rem', lineHeight: 1, color: 'var(--danger-color)' }}>{stats.error.toLocaleString()}</div>
                            <div className="stat-label" style={{ fontSize: '0.75rem', marginTop: 2 }}>Errors</div>
                        </div>
                    </div>
                </div>

                {/* Scrollable File List */}
                <div className="file-list" style={{
                    flex: 1,
                    overflowY: 'auto',
                    paddingRight: 4,
                    borderTop: '1px solid var(--glass-border)',
                    paddingTop: 12
                }}>
                    {filteredPlan.map((item, i) => (
                        <div key={i} className="file-item" style={{ fontSize: '0.9rem', padding: '8px 12px' }}>
                            <span className={`status-badge ${item.status === 'READY' ? 'status-ready' : item.status === 'DUPLICATE' ? 'status-duplicate' : 'status-error'}`} style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                                {item.status}
                            </span>
                            <span style={{ color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {item.sourcePath.split(/[\\/]/).pop()}
                            </span>
                            <span style={{ color: 'var(--text-muted)', margin: '0 8px' }}>→</span>
                            <span style={{ color: 'var(--text-primary)', maxWidth: '40%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {item.targetPath ? item.targetPath.split(/[\\/]/).slice(-3).join('/') : '-'}
                            </span>
                        </div>
                    ))}
                    {filteredPlan.length === 0 && (
                        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                            No files match your search or filter criteria
                        </div>
                    )}
                    {/* Spacer to ensure last item isn't behind absolute footer if needed (not here though) */}
                    <div style={{ height: 10 }}></div>
                </div>
            </div>

            {/* Action Button */}
            <div style={{ marginTop: 24, textAlign: 'right' }}>
                <button
                    onClick={handleExecute}
                    disabled={stats.ready === 0}
                    style={{
                        background: stats.ready > 0 ? 'var(--accent-gradient)' : 'var(--bg-glass)',
                        color: stats.ready > 0 ? 'white' : 'var(--text-muted)',
                        border: stats.ready > 0 ? 'none' : '1px solid var(--glass-border)',
                        padding: '16px 40px',
                        borderRadius: 'var(--radius-lg)',
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: stats.ready > 0 ? 'pointer' : 'not-allowed',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 12,
                        boxShadow: stats.ready > 0 ? '0 4px 30px var(--accent-glow)' : 'none',
                        transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => {
                        if (stats.ready > 0) {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 8px 40px var(--accent-glow)';
                        }
                    }}
                    onMouseOut={(e) => {
                        if (stats.ready > 0) {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 30px var(--accent-glow)';
                        }
                    }}
                >
                    Start Organization <ArrowRight size={20} />
                </button>
            </div>
        </div>
    );
};

export default PlanView;
