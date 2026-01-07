import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, AlertTriangle, CheckCircle, Loader2, Copy, ChevronDown, Check, Folder, CheckCircle2 } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

interface Props {
    files: string[];
    sourceDir: string;
    onBack: () => void;
    onPlanReady: (plan: any[]) => void;
}

// Professional Dropdown Component (shadcn-style)
const Select: React.FC<{
    value: string;
    onChange: (val: string) => void;
    options: { value: string; label: string }[];
    placeholder?: string;
}> = ({ value, onChange, options, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectedLabel = options.find(o => o.value === value)?.label || placeholder || 'Select...';

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isOpen && !(event.target as Element).closest('.select-container')) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <div className="select-container" style={{ position: 'relative', minWidth: 140 }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '100%',
                    background: 'var(--bg-elevated)',
                    border: isOpen ? '1px solid var(--text-muted)' : '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '8px 12px',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.1s',
                    gap: 8
                }}
            >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedLabel}
                </span>
                <ChevronDown size={14} style={{
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.15s',
                    flexShrink: 0,
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
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
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
                                padding: '8px 10px',
                                fontSize: '0.85rem',
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
                            {opt.label}
                            {value === opt.value && <Check size={14} color="var(--success-color)" />}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const PlanView: React.FC<Props> = ({ files, sourceDir, onBack, onPlanReady }) => {
    const { settings, updateSettings } = useSettings();
    const [phase, setPhase] = useState<'ANALYZING' | 'ANALYSIS_COMPLETE' | 'READY'>('ANALYZING');
    const [analysisProgress, setAnalysisProgress] = useState({ current: 0, total: files.length });
    const [plan, setPlan] = useState<any[]>([]);
    const [stats, setStats] = useState({ ready: 0, duplicate: 0, conflict: 0, error: 0 });
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'READY' | 'DUPLICATE' | 'ERROR'>('ALL');
    const [isReanalyzing, setIsReanalyzing] = useState(false);

    // Track if initial analysis is done
    const initialAnalysisDone = useRef(false);

    // Track mounted state to prevent state updates after unmount
    const isMounted = useRef(true);
    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    // Core analysis function - showLoadingScreen controls whether to show ANALYZING phase
    const analyzeFiles = async (showLoadingScreen: boolean) => {
        if (showLoadingScreen) {
            setPhase('ANALYZING');
        } else {
            setIsReanalyzing(true);
        }

        let targetDir = '';
        if (settings.useCustomOutputPath && settings.customOutputPath) {
            targetDir = settings.customOutputPath;
        } else {
            targetDir = sourceDir.replace(/[\\/]$/, '') + settings.outputFolderSuffix;
        }

        const generated = await window.api.createPlan(
            files,
            targetDir,
            settings.organizationMode,
            settings.renameMode
        );

        if (!isMounted.current) return;

        setPlan(generated);

        const stat = { ready: 0, duplicate: 0, conflict: 0, error: 0 };
        generated.forEach(i => {
            if (i.status === 'READY') stat.ready++;
            else if (i.status === 'DUPLICATE') stat.duplicate++;
            else if (i.status === 'CONFLICT') stat.conflict++;
            else stat.error++;
        });
        setStats(stat);

        if (showLoadingScreen) {
            // Show completion screen for initial analysis
            setPhase('ANALYSIS_COMPLETE');
            setTimeout(() => {
                if (isMounted.current) {
                    setPhase('READY');
                    initialAnalysisDone.current = true;
                }
            }, 1000);
        } else {
            // Silent re-analysis - just update state
            setIsReanalyzing(false);
            setPhase('READY');
        }
    };

    // Initial analysis when files/sourceDir change
    useEffect(() => {
        // Reset for new files
        initialAnalysisDone.current = false;

        if (files.length > 0) {
            setAnalysisProgress({ current: 0, total: files.length });

            window.api.onPlanProgress((data) => {
                if (isMounted.current) {
                    setAnalysisProgress(data);
                }
            });

            analyzeFiles(true); // Show loading screen for initial analysis
        } else {
            setPhase('READY');
        }

        // Cleanup listener on unmount or when files change
        return () => {
            window.api.removeAllListeners();
        };
    }, [files, sourceDir]);

    // Re-analyze when settings change - SILENT (no loading screen)
    useEffect(() => {
        // Only re-analyze if initial analysis is done and we have files
        if (initialAnalysisDone.current && files.length > 0) {
            analyzeFiles(false); // Silent re-analysis
        }
    }, [settings.organizationMode, settings.renameMode, settings.outputFolderSuffix, settings.useCustomOutputPath, settings.customOutputPath]);

    const displayTarget = settings.useCustomOutputPath
        ? (settings.customOutputPath || 'Select a folder...')
        : (sourceDir.replace(/[\\/]$/, '') + settings.outputFolderSuffix);

    const filteredPlan = plan.filter(item => {
        const matchesSearch = searchQuery === '' ||
            item.sourcePath.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleExecute = () => {
        onPlanReady(plan);
    };

    // Analyzing phase
    if (phase === 'ANALYZING') {
        const percentage = Math.round((analysisProgress.current / (analysisProgress.total || 1)) * 100);
        return (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }} className="animate-fade-in">
                <div style={{ textAlign: 'center', width: '100%', maxWidth: 400 }}>
                    <Loader2 size={40} className="animate-spin" style={{ marginBottom: 24, color: 'var(--text-primary)' }} />
                    <h2 style={{ marginBottom: 16, fontSize: '1.3rem' }}>Analyzing Metadata</h2>

                    <div style={{
                        marginBottom: 16,
                        height: 6,
                        background: 'var(--bg-elevated)',
                        borderRadius: 3,
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            width: `${percentage}%`,
                            height: '100%',
                            background: 'var(--text-primary)',
                            transition: 'width 0.2s ease-out',
                            borderRadius: 3
                        }}></div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        <span>{analysisProgress.current.toLocaleString()} / {analysisProgress.total.toLocaleString()}</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{percentage}%</span>
                    </div>
                </div>
            </div>
        );
    }

    // Analysis complete phase
    if (phase === 'ANALYSIS_COMPLETE') {
        return (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }} className="animate-fade-in">
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: 72,
                        height: 72,
                        borderRadius: '50%',
                        background: 'var(--success-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 20px',
                        animation: 'pop-in 0.3s ease-out'
                    }}>
                        <CheckCircle2 size={36} color="white" />
                    </div>
                    <h2 style={{ color: 'var(--success-color)', marginBottom: 8, fontSize: '1.3rem' }}>
                        Analysis Complete
                    </h2>
                    <p style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: '600' }}>
                        {stats.ready.toLocaleString()} files ready to organize
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: 32, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} className="animate-fade-in">
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20, gap: 16 }}>
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
                        transition: 'all 0.1s',
                        flexShrink: 0
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
                <div style={{ flex: 1 }}>
                    <h2 style={{ margin: 0, fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                        Organization Plan
                        {isReanalyzing && (
                            <Loader2 size={16} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
                        )}
                    </h2>
                    <p style={{ color: 'var(--text-muted)', margin: '2px 0 0 0', fontSize: '0.8rem', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        Target: {displayTarget}
                    </p>
                </div>
            </div>

            {/* Settings Bar */}
            <div style={{
                marginBottom: 20,
                display: 'grid',
                gridTemplateColumns: 'repeat(4, auto) 1fr',
                gap: 16,
                padding: '14px 18px',
                background: 'var(--bg-elevated)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--glass-border)',
                alignItems: 'center'
            }}>
                {/* Organize By */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase' }}>Organize:</span>
                    <Select
                        value={settings.organizationMode}
                        onChange={(v) => updateSettings({ organizationMode: v as 'year' | 'year-month' })}
                        options={[
                            { value: 'year', label: 'Year Only' },
                            { value: 'year-month', label: 'Year / Month' }
                        ]}
                    />
                </div>

                {/* Action */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase' }}>Action:</span>
                    <Select
                        value={settings.operationMode}
                        onChange={(v) => updateSettings({ operationMode: v as 'copy' | 'move' })}
                        options={[
                            { value: 'copy', label: 'Copy Files' },
                            { value: 'move', label: 'Move Files' }
                        ]}
                    />
                </div>

                {/* Rename */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase' }}>Rename:</span>
                    <Select
                        value={settings.renameMode}
                        onChange={(v) => updateSettings({ renameMode: v as 'original' | 'date-prefix' })}
                        options={[
                            { value: 'original', label: 'Keep Original' },
                            { value: 'date-prefix', label: 'Add Date Prefix' }
                        ]}
                    />
                </div>

                {/* Destination */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase' }}>Destination:</span>
                    <Select
                        value={settings.useCustomOutputPath ? 'custom' : 'default'}
                        onChange={(v) => updateSettings({ useCustomOutputPath: v === 'custom' })}
                        options={[
                            { value: 'default', label: 'Default Path' },
                            { value: 'custom', label: 'Custom Path' }
                        ]}
                    />
                    {settings.useCustomOutputPath && (
                        <>
                            <button
                                onClick={async () => {
                                    const dir = await window.api.openDirectory();
                                    if (dir) updateSettings({ customOutputPath: dir });
                                }}
                                style={{
                                    background: 'var(--bg-glass)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: 'var(--radius-sm)',
                                    padding: '6px 10px',
                                    color: 'var(--text-secondary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    cursor: 'pointer',
                                    transition: 'all 0.1s',
                                    fontSize: '0.8rem'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                                onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                            >
                                <Folder size={14} /> Browse
                            </button>
                            {settings.customOutputPath && (
                                <span style={{
                                    color: 'var(--text-muted)',
                                    fontSize: '0.75rem',
                                    maxWidth: 200,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    fontFamily: 'monospace'
                                }} title={settings.customOutputPath}>
                                    {settings.customOutputPath.split(/[\\/]/).slice(-2).join('/')}
                                </span>
                            )}
                        </>
                    )}
                </div>

                {/* Suffix input */}
                {!settings.useCustomOutputPath && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase' }}>Suffix:</span>
                        <input
                            type="text"
                            value={settings.outputFolderSuffix}
                            onChange={(e) => updateSettings({ outputFolderSuffix: e.target.value })}
                            placeholder="_Organized"
                            style={{
                                flex: 1,
                                maxWidth: 150,
                                background: 'var(--bg-glass)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: 'var(--radius-sm)',
                                padding: '6px 10px',
                                color: 'var(--text-primary)',
                                fontSize: '0.85rem',
                                outline: 'none'
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                <div style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12
                }}>
                    <div style={{ padding: 6, background: 'rgba(34, 197, 94, 0.1)', borderRadius: '50%' }}>
                        <CheckCircle color="var(--success-color)" size={18} />
                    </div>
                    <div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success-color)' }}>{stats.ready.toLocaleString()}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ready</div>
                    </div>
                </div>
                <div style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12
                }}>
                    <div style={{ padding: 6, background: 'rgba(245, 158, 11, 0.1)', borderRadius: '50%' }}>
                        <Copy color="var(--warning-color)" size={18} />
                    </div>
                    <div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--warning-color)' }}>{stats.duplicate.toLocaleString()}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Duplicates</div>
                    </div>
                </div>
                <div style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12
                }}>
                    <div style={{ padding: 6, background: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%' }}>
                        <AlertTriangle color="var(--danger-color)" size={18} />
                    </div>
                    <div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--danger-color)' }}>{stats.error.toLocaleString()}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Errors</div>
                    </div>
                </div>
            </div>

            {/* Search and Filter */}
            <div style={{ marginBottom: 12, display: 'flex', gap: 10, alignItems: 'center', position: 'relative', zIndex: 10 }}>
                <input
                    type="text"
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                        flex: 1,
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: 'var(--radius-md)',
                        padding: '8px 12px',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                        outline: 'none'
                    }}
                />

                <Select
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
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        {filteredPlan.length} / {plan.length}
                    </span>
                )}
            </div>

            {/* File List */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-md)',
                padding: 6
            }}>
                {filteredPlan.map((item, i) => (
                    <div key={i} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8rem',
                        borderBottom: i < filteredPlan.length - 1 ? '1px solid var(--glass-border)' : 'none'
                    }}>
                        <span style={{
                            padding: '2px 8px',
                            borderRadius: 12,
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            background: item.status === 'READY' ? 'rgba(34, 197, 94, 0.15)' : item.status === 'DUPLICATE' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: item.status === 'READY' ? 'var(--success-color)' : item.status === 'DUPLICATE' ? 'var(--warning-color)' : 'var(--danger-color)'
                        }}>
                            {item.status}
                        </span>
                        <span style={{ color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.sourcePath.split(/[\\/]/).pop()}
                        </span>
                        <span style={{ color: 'var(--text-muted)' }}>→</span>
                        <span style={{ color: 'var(--text-primary)', maxWidth: '35%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.targetPath ? item.targetPath.split(/[\\/]/).slice(-3).join('/') : '-'}
                        </span>
                    </div>
                ))}
                {filteredPlan.length === 0 && (
                    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                        No files match your criteria
                    </div>
                )}
            </div>

            {/* Action Button */}
            <div style={{ marginTop: 16, textAlign: 'right' }}>
                <button
                    onClick={handleExecute}
                    disabled={stats.ready === 0}
                    style={{
                        background: stats.ready > 0 ? 'var(--text-primary)' : 'var(--bg-elevated)',
                        color: stats.ready > 0 ? 'var(--bg-primary)' : 'var(--text-muted)',
                        border: stats.ready > 0 ? 'none' : '1px solid var(--glass-border)',
                        padding: '12px 28px',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        cursor: stats.ready > 0 ? 'pointer' : 'not-allowed',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 10,
                        transition: 'all 0.1s'
                    }}
                    onMouseOver={(e) => {
                        if (stats.ready > 0) {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.background = '#e4e4e7';
                        }
                    }}
                    onMouseOut={(e) => {
                        if (stats.ready > 0) {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.background = 'var(--text-primary)';
                        }
                    }}
                >
                    Start Organization <ArrowRight size={18} />
                </button>
            </div>
        </div>
    );
};

export default PlanView;
