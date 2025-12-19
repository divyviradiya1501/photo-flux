import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface AppSettings {
    organizationMode: 'year' | 'year-month';
    renameMode: 'original' | 'date-prefix';
    outputFolderSuffix: string;
    operationMode: 'copy' | 'move';
    useCustomOutputPath: boolean;
    customOutputPath: string;
}

interface SettingsContextType {
    settings: AppSettings;
    updateSettings: (newSettings: Partial<AppSettings>) => void;
    resetSettings: () => void;
}

const defaultSettings: AppSettings = {
    organizationMode: 'year-month',
    renameMode: 'original',
    outputFolderSuffix: '_Organized',
    operationMode: 'move',
    useCustomOutputPath: false,
    customOutputPath: ''
};

const STORAGE_KEY = 'photo-organizer-settings';

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<AppSettings>(() => {
        // Load from localStorage on init
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                return { ...defaultSettings, ...JSON.parse(stored) };
            }
        } catch (err) {
            console.error('Failed to load settings:', err);
        }
        return defaultSettings;
    });

    // Persist to localStorage whenever settings change
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        } catch (err) {
            console.error('Failed to save settings:', err);
        }
    }, [settings]);

    const updateSettings = (newSettings: Partial<AppSettings>) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    };

    const resetSettings = () => {
        setSettings(defaultSettings);
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
