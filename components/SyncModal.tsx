import React, { useState, useEffect } from 'react';
import { ICONS } from '../constants';
import { Note } from '../types';
import * as DriveService from '../services/drive';

interface SyncModalProps {
    notes: Note[];
    onClose: () => void;
    onImport: (notes: Note[]) => void;
}

export const SyncModal: React.FC<SyncModalProps> = ({ notes, onClose, onImport }) => {
    const [clientId, setClientId] = useState(localStorage.getItem('void_google_client_id') || '');
    const [status, setStatus] = useState<string>('');
    const [isDriveReady, setIsDriveReady] = useState(false);
    const [backupFile, setBackupFile] = useState<{ id: string, modifiedTime: string } | null>(null);
    const [activeTab, setActiveTab] = useState<'drive' | 'manual'>('drive');

    // Save Client ID
    const handleSaveClientId = () => {
        localStorage.setItem('void_google_client_id', clientId);
        setStatus("Client ID Saved. Ready to connect.");
    };

    const handleConnectDrive = async () => {
        if (!clientId) {
            setStatus("Please enter a Google Client ID first.");
            return;
        }
        setStatus("Initializing Drive API...");
        try {
            await DriveService.initDriveApi(clientId);
            await DriveService.authenticate();
            setStatus("Connected! Checking for backups...");
            setIsDriveReady(true);
            await checkBackup();
        } catch (e: any) {
            console.error(e);
            setStatus(`Connection failed: ${e.message || e}`);
        }
    };

    const checkBackup = async () => {
        try {
            const file = await DriveService.checkForBackup();
            setBackupFile(file);
            if (file) {
                setStatus(`Backup found: ${new Date(file.modifiedTime).toLocaleString()}`);
            } else {
                setStatus("No existing backup found in Drive.");
            }
        } catch (e) {
            setStatus("Error checking backup status.");
        }
    };

    const handlePushToCloud = async () => {
        if (!isDriveReady) return;
        setStatus("Uploading to Drive...");
        try {
            await DriveService.uploadBackup(notes, backupFile?.id);
            setStatus("Upload Successful!");
            await checkBackup();
        } catch (e) {
            setStatus("Upload failed.");
        }
    };

    const handlePullFromCloud = async () => {
        if (!isDriveReady || !backupFile) return;
        if (!window.confirm("This will OVERWRITE your local notes with the cloud backup. Are you sure?")) return;
        
        setStatus("Downloading from Drive...");
        try {
            const cloudNotes = await DriveService.downloadBackup(backupFile.id);
            onImport(cloudNotes);
            setStatus("Sync Complete! Notes updated.");
            setTimeout(onClose, 1000);
        } catch (e) {
            setStatus("Download failed.");
        }
    };

    // Manual Import/Export
    const handleExportJson = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(notes, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `void_backup_${new Date().toISOString().slice(0,10)}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const parsed = JSON.parse(evt.target?.result as string);
                if (Array.isArray(parsed)) {
                    if(window.confirm(`Found ${parsed.length} notes. Overwrite local data?`)) {
                        onImport(parsed);
                        onClose();
                    }
                } else {
                    alert("Invalid JSON format");
                }
            } catch (err) {
                alert("Failed to parse JSON");
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <div className="bg-[#0a0a0a] border border-[#333] w-full max-w-md rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-[#333] bg-[#050505]">
                    <h2 className="text-[#00ff9d] font-bold text-lg flex items-center gap-2">
                        <ICONS.Cloud /> DATA LINK
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-white"><ICONS.Close /></button>
                </div>

                <div className="flex border-b border-[#333]">
                    <button 
                        onClick={() => setActiveTab('drive')}
                        className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider ${activeTab === 'drive' ? 'bg-[#002b1f] text-[#00ff9d] border-b-2 border-[#00ff9d]' : 'text-gray-500 hover:text-white'}`}
                    >
                        Google Drive
                    </button>
                    <button 
                        onClick={() => setActiveTab('manual')}
                        className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider ${activeTab === 'manual' ? 'bg-[#1a1a1a] text-white border-b-2 border-white' : 'text-gray-500 hover:text-white'}`}
                    >
                        Manual File
                    </button>
                </div>

                <div className="p-6 flex-1">
                    {activeTab === 'drive' ? (
                        <div className="space-y-6">
                            {!isDriveReady && (
                                <div className="space-y-2">
                                    <label className="text-xs text-gray-400 uppercase tracking-widest block">Google Cloud Client ID</label>
                                    <input 
                                        type="text" 
                                        value={clientId}
                                        onChange={(e) => setClientId(e.target.value)}
                                        placeholder="784...apps.googleusercontent.com"
                                        className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-gray-300 text-sm focus:border-[#00ff9d] focus:outline-none"
                                    />
                                    <div className="flex gap-2">
                                        <button onClick={handleSaveClientId} className="flex-1 bg-[#222] text-xs py-2 rounded hover:bg-[#333] text-gray-300">Save ID</button>
                                        <button onClick={handleConnectDrive} className="flex-1 bg-[#00ff9d] text-black text-xs font-bold py-2 rounded hover:bg-[#00cc7d]">Connect & Sync</button>
                                    </div>
                                    <p className="text-[10px] text-gray-600 mt-2 leading-relaxed">
                                        Requires a Google Cloud Project with <b>Drive API</b> enabled.
                                        Add <b>http://localhost:3000</b> (or your domain) to "Authorized Javascript Origins".
                                    </p>
                                </div>
                            )}

                            {isDriveReady && (
                                <div className="space-y-4">
                                    <div className="p-3 bg-[#111] border border-[#333] rounded">
                                        <p className="text-xs text-gray-400 mb-1">Status</p>
                                        <p className="text-[#00ff9d] font-mono text-xs">{status}</p>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <button 
                                            onClick={handlePushToCloud}
                                            className="bg-[#1a1a1a] border border-[#333] hover:border-[#00ff9d] p-4 rounded flex flex-col items-center gap-2 group transition-all"
                                        >
                                            <div className="text-gray-400 group-hover:text-[#00ff9d] rotate-180 transform"><ICONS.Download /></div>
                                            <span className="text-xs font-bold text-gray-300">PUSH Local to Cloud</span>
                                        </button>

                                        <button 
                                            onClick={handlePullFromCloud}
                                            disabled={!backupFile}
                                            className="bg-[#1a1a1a] border border-[#333] hover:border-blue-400 p-4 rounded flex flex-col items-center gap-2 group transition-all disabled:opacity-50"
                                        >
                                            <div className="text-gray-400 group-hover:text-blue-400"><ICONS.Download /></div>
                                            <span className="text-xs font-bold text-gray-300">PULL Cloud to Local</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                            
                            {!isDriveReady && status && <p className="text-xs text-yellow-500 font-mono mt-2">{status}</p>}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <button 
                                onClick={handleExportJson}
                                className="w-full bg-[#1a1a1a] border border-[#333] hover:border-[#00ff9d] p-4 rounded flex items-center justify-center gap-2 text-gray-300 hover:text-white transition-all"
                            >
                                <ICONS.Download className="rotate-180" /> Export JSON
                            </button>
                            
                            <div className="relative border-t border-[#222] pt-6">
                                <label className="w-full bg-[#1a1a1a] border border-[#333] hover:border-blue-400 p-4 rounded flex items-center justify-center gap-2 text-gray-300 hover:text-white transition-all cursor-pointer">
                                    <ICONS.Download /> Import JSON
                                    <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
                                </label>
                            </div>
                            <p className="text-xs text-gray-500 text-center">Use this to move data between devices without Google Cloud.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};