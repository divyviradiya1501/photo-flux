import { useState } from 'react'
import Dashboard from './components/Dashboard'
import ScanView from './components/ScanView'
import PlanView from './components/PlanView'
import ExecuteView from './components/ExecuteView'
import RevertView from './components/RevertView'
import SettingsView from './components/SettingsView'
import { TitleBar } from './components/TitleBar'
import './PageTransitions.css'

export type ViewState = 'dashboard' | 'scan' | 'plan' | 'execute' | 'revert' | 'settings';

function App(): JSX.Element {
    const [view, setView] = useState<ViewState>('dashboard');
    const [selectedDir, setSelectedDir] = useState<string>('');
    const [scannedFiles, setScannedFiles] = useState<string[]>([]);
    const [plan, setPlan] = useState<any[]>([]);
    const [isTransitioning, setIsTransitioning] = useState(false);

    // Super fast view transition
    const changeView = (newView: ViewState, force = false) => {
        if (view === newView) return;
        if (isTransitioning && !force) {
            return;
        }

        // Reset state when going back to scan or dashboard for fresh start
        if (newView === 'scan') {
            setScannedFiles([]);
            setSelectedDir('');
            setPlan([]);
        } else if (newView === 'dashboard') {
            setScannedFiles([]);
            setSelectedDir('');
            setPlan([]);
        }

        setIsTransitioning(true);
        setTimeout(() => {
            setView(newView);
            setTimeout(() => setIsTransitioning(false), 30);
        }, 100); // Fast fade-out
    };

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'transparent' }}>
            <TitleBar />
            <div className={`app-container ${isTransitioning ? 'fade-out' : 'fade-in'}`} style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                {view === 'dashboard' && (
                    <Dashboard
                        onStart={() => changeView('scan')}
                        onRevert={() => changeView('revert')}
                        onSettings={() => changeView('settings')}
                    />
                )}
                {view === 'scan' && (
                    <ScanView
                        onBack={() => changeView('dashboard')}
                        onScanComplete={(files, dir) => {
                            if (files.length === 0) {
                                alert("No photos found in the selected folder.");
                                changeView('dashboard', true);
                                return;
                            }
                            setScannedFiles(files);
                            setSelectedDir(dir);
                            changeView('plan');
                        }}
                    />
                )}
                {view === 'plan' && (
                    <PlanView
                        files={scannedFiles}
                        sourceDir={selectedDir}
                        onBack={() => changeView('scan')}
                        onPlanReady={(generatedPlan) => {
                            setPlan(generatedPlan);
                            changeView('execute');
                        }}
                    />
                )}
                {view === 'execute' && (
                    <ExecuteView
                        plan={plan}
                        onFinish={() => changeView('revert', true)}
                    />
                )}
                {view === 'revert' && (
                    <RevertView onBack={() => changeView('dashboard')} />
                )}
                {view === 'settings' && (
                    <SettingsView onBack={() => changeView('dashboard')} />
                )}
            </div>
        </div>
    );
}

export default App
