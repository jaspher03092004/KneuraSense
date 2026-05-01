'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  getHardwareFleet, unpairDevice, registerNewDevice, 
  updateDeviceStatus, manualPairDevice,
  deleteHardwareDevice
} from '@/actions/admin';
import { 
  Cpu, BatteryWarning, Wifi, WifiOff, Package, Activity,
  Search, Unlink, ShieldCheck, X, AlertTriangle, Loader2, Hash,
  Plus, Link2, Trash2
} from 'lucide-react';

export default function HardwareManagement() {
  const [data, setData] = useState({ active: [], inventory: [], unassignedPatients: [] });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'inventory'
  
  // Modals State
  const [actionLoading, setActionLoading] = useState(false);
  const [unpairModal, setUnpairModal] = useState({ isOpen: false, patientId: null, macAddress: '', patientName: '' });
  const [pairModal, setPairModal] = useState(false);
  const [pairForm, setPairForm] = useState({ patientId: '', macAddress: '' });
  const [addDeviceModal, setAddDeviceModal] = useState(false);
  const [newMac, setNewMac] = useState('');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, macAddress: '' });

  const fetchData = async () => {
    setLoading(true);
    const result = await getHardwareFleet();
    if (result.success) setData(result.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // Filter Logic
  const filteredActive = useMemo(() => {
    return data.active.filter(d => 
      d.deviceMac?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data.active, searchQuery]);

  const filteredInventory = useMemo(() => {
    return data.inventory.filter(d => d.macAddress.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [data.inventory, searchQuery]);

  // KPI Logic
  const kpis = useMemo(() => {
    let online = 0; let offline = 0; let criticalBattery = 0;
    const oneHourAgo = new Date().getTime() - (60 * 60 * 1000);

    data.active.forEach(device => {
      const log = device.sensorLogs?.[0];
      if (log) {
        if (new Date(log.timestamp).getTime() > oneHourAgo) online++; else offline++;
        if (log.battery <= 20) criticalBattery++;
      } else offline++;
    });

    const inStock = data.inventory.filter(i => i.status === 'IN_STOCK').length;

    return { deployed: data.active.length, online, offline, criticalBattery, inStock };
  }, [data]);

  // --- ACTIONS ---
  const handleUnpair = async () => {
    setActionLoading(true);
    const result = await unpairDevice(unpairModal.patientId, unpairModal.macAddress);
    if (result.success) await fetchData();
    else alert(result.error);
    setActionLoading(false);
    setUnpairModal({ isOpen: false, patientId: null, macAddress: '', patientName: '' });
  };

  const handlePair = async (e) => {
    e.preventDefault();
    if (!pairForm.patientId || !pairForm.macAddress) return alert("Please select a patient and a device.");
    setActionLoading(true);
    const result = await manualPairDevice(pairForm.patientId, pairForm.macAddress);
    if (result.success) {
      await fetchData();
      setPairModal(false);
      setPairForm({ patientId: '', macAddress: '' });
    } else alert(result.error);
    setActionLoading(false);
  };

  const handleAddDevice = async (e) => {
    e.preventDefault();
    if (!newMac || newMac.length < 12) return alert("Please enter a valid MAC address.");
    setActionLoading(true);
    const result = await registerNewDevice(newMac);
    if (result.success) {
      await fetchData();
      setAddDeviceModal(false);
      setNewMac('');
    } else alert(result.error);
    setActionLoading(false);
  };

  const handleStatusChange = async (macAddress, status) => {
    const result = await updateDeviceStatus(macAddress, status);
    if (result.success) {
      setData(prev => ({
        ...prev,
        inventory: prev.inventory.map(i => i.macAddress === macAddress ? { ...i, status } : i)
      }));
    } else alert(result.error);
  };

  const handleDeleteDevice = async () => {
    setActionLoading(true);
    const result = await deleteHardwareDevice(deleteModal.macAddress);
    if (result.success) {
      await fetchData();
      setDeleteModal({ isOpen: false, macAddress: '' });
    } else {
      alert(result.error);
    }
    setActionLoading(false);
  };

  if (loading) return <div className="p-6 sm:p-10 animate-pulse bg-slate-50 dark:bg-slate-900 h-full" />;

  return (
    <div className="p-3 sm:p-6 md:p-8 max-w-[1400px] mx-auto space-y-4 sm:space-y-6 animate-in fade-in duration-500 font-sans antialiased relative">
      
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-3 sm:gap-4 mb-1 sm:mb-2">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#2C3E50] dark:text-white tracking-tight">Hardware <span className="text-[#2D5F8B] dark:text-blue-400">Lifecycle</span></h1>
          <p className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400">Monitor deployed telemetry and manage edge device inventory.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setAddDeviceModal(true)} className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md text-[11px] font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 shadow-sm">
            <Plus className="w-3.5 h-3.5" /> Add Stock
          </button>
          <button onClick={() => setPairModal(true)} className="flex items-center gap-1.5 px-3 py-2 bg-[#2D5F8B] dark:bg-blue-600 text-white rounded-md text-[11px] font-bold hover:bg-blue-700 dark:hover:bg-blue-700 transition-colors shadow-sm">
            <Link2 className="w-3.5 h-3.5" /> Manual Pair
          </button>
        </div>
      </header>

      {/* KPI GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 md:gap-4">
        <StatCard title="Deployed" val={kpis.deployed} icon={Cpu} cls="text-blue-600 bg-blue-50 border-blue-100 dark:text-blue-400 dark:bg-blue-500/10 dark:border-blue-500/20" />
        <StatCard title="Online (1hr)" val={kpis.online} icon={Wifi} cls="text-emerald-600 bg-emerald-50 border-emerald-100 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20" />
        <StatCard title="Critical Battery" val={kpis.criticalBattery} icon={BatteryWarning} cls="text-rose-600 bg-rose-50 border-rose-100 dark:text-rose-400 dark:bg-rose-500/10 dark:border-rose-500/30" alert={kpis.criticalBattery > 0} />
        <StatCard title="In Stock" val={kpis.inStock} icon={Package} cls="text-slate-600 bg-slate-50 border-slate-200 dark:text-slate-400 dark:bg-slate-500/10 dark:border-slate-500/20" />
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200/60 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col min-h-[400px] sm:min-h-[500px]">
        
        {/* Toolbar & Tabs */}
        <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-start sm:items-center">
          <div className="flex p-1 bg-slate-200/50 dark:bg-slate-800/50 rounded-md w-full sm:w-auto overflow-x-auto no-scrollbar scroll-smooth">
            <button onClick={() => { setActiveTab('active'); setSearchQuery(''); }} className={`flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold rounded transition-all whitespace-nowrap ${activeTab === 'active' ? 'bg-white dark:bg-slate-700 text-[#2D5F8B] dark:text-blue-400 shadow-[0_1px_3px_rgba(0,0,0,0.1)]' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}>
              <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Active Fleet
            </button>
            <button onClick={() => { setActiveTab('inventory'); setSearchQuery(''); }} className={`flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold rounded transition-all whitespace-nowrap ${activeTab === 'inventory' ? 'bg-white dark:bg-slate-700 text-[#2D5F8B] dark:text-blue-400 shadow-[0_1px_3px_rgba(0,0,0,0.1)]' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}>
              <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Inventory
            </button>
          </div>
          
          <div className="relative w-full sm:w-72 md:w-80 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 group-focus-within:text-[#2D5F8B] dark:group-focus-within:text-blue-400 transition-colors" />
            <input 
              type="text" 
              placeholder={`Search ${activeTab === 'active' ? 'devices or patients' : 'MAC address'}...`} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 sm:pl-9 pr-8 py-1.5 sm:py-2 bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-700 rounded-md text-[11px] sm:text-xs font-medium focus:border-[#2D5F8B] dark:focus:border-blue-500 focus:ring-1 focus:ring-[#2D5F8B] dark:focus:ring-blue-500 outline-none transition-all text-slate-900 dark:text-white shadow-sm"
            />
          </div>
        </div>

        {/* --- ACTIVE FLEET TABLE --- */}
        {activeTab === 'active' && (
          <div className="overflow-x-auto flex-1 pb-4 sm:pb-0 relative">
            <table className="w-full text-left text-xs min-w-[800px]">
              <thead className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-4 sm:px-6 py-3 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px] sm:text-[10px]">MAC Address</th>
                  <th className="px-4 sm:px-6 py-3 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px] sm:text-[10px]">Assigned Patient</th>
                  <th className="px-4 sm:px-6 py-3 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px] sm:text-[10px]">Battery</th>
                  <th className="px-4 sm:px-6 py-3 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px] sm:text-[10px]">Firmware</th>
                  <th className="px-4 sm:px-6 py-3 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px] sm:text-[10px]">Last Cloud Sync</th>
                  <th className="px-4 sm:px-6 py-3 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px] sm:text-[10px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {filteredActive.length === 0 ? (
                  <tr><td colSpan="6" className="py-16 text-center text-slate-400 dark:text-slate-500 italic font-medium">No active devices found.</td></tr>
                ) : (
                  filteredActive.map((device) => {
                    const log = device.sensorLogs?.[0];
                    const battery = log?.battery ?? null;
                    const isCritical = battery !== null && battery <= 20;
                    const invRecord = data.inventory.find(i => i.macAddress === device.deviceMac);
                    const fwVer = invRecord?.firmwareVer || "1.0.0";
                    
                    return (
                      <tr key={device.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors group">
                        <td className="px-4 sm:px-6 py-3 sm:py-4"><div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded text-slate-700 dark:text-slate-300"><Hash className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" /><span className="font-mono text-[10px] font-bold tracking-wide">{device.deviceMac}</span></div></td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 font-bold text-slate-900 dark:text-slate-200 text-[11px] sm:text-xs">{device.fullName}</td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4">{battery !== null ? (<div className="flex items-center gap-1.5"><div className={`w-2 h-2 rounded-full ${isCritical ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} /><span className={`font-bold ${isCritical ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>{battery}%</span></div>) : (<span className="text-slate-400 dark:text-slate-500 italic">No Data</span>)}</td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4"><span className="font-mono text-[9px] font-bold text-[#2D5F8B] dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded border border-blue-100 dark:border-blue-500/20">v{fwVer}</span></td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4">{log?.timestamp ? (<span className="font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5 text-[11px]"><Activity className="w-3.5 h-3.5 text-blue-500 opacity-80" />{new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>) : (<span className="text-slate-400 dark:text-slate-500 italic">Never Synced</span>)}</td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button onClick={() => setUnpairModal({ isOpen: true, patientId: device.id, macAddress: device.deviceMac, patientName: device.fullName })} className="px-2.5 py-1.5 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded-md hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 shadow-sm hover:text-rose-600 dark:hover:text-rose-400 group-hover:border-rose-200 dark:group-hover:border-rose-500/30 transition-all text-[10px] font-bold"><Unlink className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Unpair</span></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* --- INVENTORY TABLE --- */}
        {activeTab === 'inventory' && (
          <div className="overflow-x-auto flex-1 pb-4 sm:pb-0 relative">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-4 sm:px-6 py-3 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px] sm:text-[10px]">MAC Address</th>
                  <th className="px-4 sm:px-6 py-3 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px] sm:text-[10px]">Current Status</th>
                  <th className="px-4 sm:px-6 py-3 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px] sm:text-[10px]">Firmware</th>
                  <th className="px-4 sm:px-6 py-3 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px] sm:text-[10px]">Date Added</th>
                  <th className="px-4 sm:px-6 py-3 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px] sm:text-[10px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {filteredInventory.length === 0 ? (
                  <tr><td colSpan="5" className="py-16 text-center text-slate-400 dark:text-slate-500 italic font-medium">Inventory is empty. Add new stock to begin.</td></tr>
                ) : (
                  filteredInventory.map((item) => (
                    <tr key={item.macAddress} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors group">
                      <td className="px-4 sm:px-6 py-3 sm:py-4"><div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded text-slate-700 dark:text-slate-300"><Hash className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" /><span className="font-mono text-[10px] font-bold tracking-wide">{item.macAddress}</span></div></td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        {item.status === 'IN_STOCK' && <span className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">In Stock</span>}
                        {item.status === 'ASSIGNED' && <span className="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">Assigned</span>}
                        {item.status === 'MAINTENANCE' && <span className="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">Maintenance</span>}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4"><span className="font-mono text-[9px] font-bold text-slate-500 dark:text-slate-400">v{item.firmwareVer}</span></td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-[11px] font-medium text-slate-500 dark:text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                        <div className="flex justify-end gap-1.5 ml-auto w-fit">
                          <button 
                            onClick={() => setDeleteModal({ isOpen: true, macAddress: item.macAddress })}
                            className="px-2.5 py-1.5 bg-white dark:bg-slate-900 text-rose-500 dark:text-rose-400 rounded-md hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-slate-200 dark:border-slate-700 shadow-sm transition-all text-[10px] font-bold flex items-center gap-1.5"
                            title="Permanently Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- ADD NEW DEVICE MODAL --- */}
      {addDeviceModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-sm" onClick={() => !actionLoading && setAddDeviceModal(false)}></div>
          <form onSubmit={handleAddDevice} className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl p-5 max-w-sm w-full relative border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mb-1">Add to Inventory</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Register a new KneuraSense hardware MAC address.</p>
            <input 
              type="text" required placeholder="e.g., AA:BB:CC:DD:EE:FF" value={newMac} onChange={e => setNewMac(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-mono font-bold mb-4 outline-none focus:border-[#2D5F8B] dark:focus:border-blue-500 text-slate-900 dark:text-white transition-colors"
            />
            <div className="flex gap-2">
              <button type="submit" disabled={actionLoading} className="flex-1 py-2 bg-[#2D5F8B] dark:bg-blue-600 text-white rounded-md text-xs font-bold hover:bg-blue-700 flex justify-center items-center transition-colors">
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Device"}
              </button>
              <button type="button" onClick={() => setAddDeviceModal(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* --- MANUAL PAIRING MODAL --- */}
      {pairModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-sm" onClick={() => !actionLoading && setPairModal(false)}></div>
          <form onSubmit={handlePair} className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl p-5 max-w-md w-full relative border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mb-1 flex items-center gap-2"><Link2 className="w-5 h-5 text-[#2D5F8B] dark:text-blue-400"/> Manual Device Pairing</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">Override assignments and force-link hardware to a patient.</p>
            
            <div className="space-y-4 mb-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">1. Select Unassigned Patient</label>
                <select required value={pairForm.patientId} onChange={e => setPairForm({...pairForm, patientId: e.target.value})} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-medium outline-none focus:border-[#2D5F8B] dark:focus:border-blue-500 text-slate-900 dark:text-white transition-colors">
                  <option value="">-- Choose Patient --</option>
                  {data.unassignedPatients.map(p => <option key={p.id} value={p.id}>{p.fullName}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">2. Select Available Device</label>
                <select required value={pairForm.macAddress} onChange={e => setPairForm({...pairForm, macAddress: e.target.value})} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-mono outline-none focus:border-[#2D5F8B] dark:focus:border-blue-500 text-slate-900 dark:text-white transition-colors">
                  <option value="">-- Choose MAC Address --</option>
                  {data.inventory.filter(i => i.status === 'IN_STOCK').map(i => <option key={i.macAddress} value={i.macAddress}>{i.macAddress}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button type="submit" disabled={actionLoading || !pairForm.patientId || !pairForm.macAddress} className="flex-1 py-2 bg-[#2D5F8B] dark:bg-blue-600 text-white rounded-md text-xs font-bold hover:bg-blue-700 disabled:opacity-50 flex justify-center items-center gap-2 transition-colors">
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Link2 className="w-3.5 h-3.5"/> Pair Hardware</>}
              </button>
              <button type="button" onClick={() => setPairModal(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* --- UNPAIR CONFIRMATION MODAL --- */}
      {unpairModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-sm" onClick={() => !actionLoading && setUnpairModal({ isOpen: false, patientId: null, macAddress: '', patientName: '' })}></div>
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl p-5 max-w-sm w-full relative border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95">
             <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-md"><AlertTriangle className="w-5 h-5" /></div>
                <div><h2 className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">Confirm Unpair</h2></div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-5 leading-relaxed">
                Disconnect device <span className="font-mono font-bold bg-slate-100 dark:bg-slate-800 px-1 rounded">{unpairModal.macAddress}</span> from <span className="font-bold text-slate-900 dark:text-white">{unpairModal.patientName}</span>? The device will be returned to your In Stock inventory.
              </p>
              <div className="flex gap-2">
                <button onClick={handleUnpair} disabled={actionLoading} className="flex-1 py-2 bg-rose-600 text-white rounded-md text-xs font-bold hover:bg-rose-700 flex justify-center transition-colors">
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Unpair Device"}
                </button>
                <button onClick={() => setUnpairModal({ isOpen: false, patientId: null, macAddress: '', patientName: '' })} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
              </div>
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-sm" onClick={() => !actionLoading && setDeleteModal({ isOpen: false, macAddress: '' })}></div>
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl p-5 max-w-sm w-full relative border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95">
             <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-md"><Trash2 className="w-5 h-5" /></div>
                <div><h2 className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">Delete Device</h2></div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-5 leading-relaxed">
                Are you sure you want to permanently delete <span className="font-mono font-bold bg-slate-100 dark:bg-slate-800 px-1 rounded">{deleteModal.macAddress}</span> from the inventory? This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <button onClick={handleDeleteDevice} disabled={actionLoading} className="flex-1 py-2 bg-rose-600 text-white rounded-md text-xs font-bold hover:bg-rose-700 flex justify-center transition-colors">
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Permanently Delete"}
                </button>
                <button onClick={() => setDeleteModal({ isOpen: false, macAddress: '' })} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
              </div>
          </div>
        </div>
      )}

    </div>
  );
}

// RESPONSIVE HELPER COMPONENT
const StatCard = ({ title, val, icon: Icon, cls, alert }) => (
  <div className={`bg-white dark:bg-slate-900 p-4 rounded-lg border ${alert ? 'border-rose-200 ring-2 sm:ring-4 ring-rose-50 dark:border-rose-500/30 dark:ring-rose-500/10' : 'border-slate-200/60 dark:border-slate-800'} transition-all shadow-sm group flex flex-col justify-between h-full`}>
    <div className="flex justify-between items-start mb-2">
      <div className={`flex h-8 w-8 items-center justify-center rounded-md border ${cls} shrink-0 transition-transform group-hover:scale-110`}><Icon className="w-4 h-4" strokeWidth={2.5} /></div>
      {alert && <span className="bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30 text-[8px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-tighter">Review</span>}
    </div>
    <div>
      <p className="text-slate-400 dark:text-slate-500 text-[9px] font-bold uppercase tracking-widest mb-0.5">{title}</p>
      <h4 className="text-2xl font-black text-[#2C3E50] dark:text-white leading-none">{val}</h4>
    </div>
  </div>
);