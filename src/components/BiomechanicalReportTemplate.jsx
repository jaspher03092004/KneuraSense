import React, { forwardRef, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine } from 'recharts';

const BiomechanicalReportTemplate = forwardRef(({ patientData, metrics, logs, riskThreshold = 75 }, ref) => {
    
    // Format logs for the chart
    const chartData = useMemo(() => {
        if (!logs || logs.length === 0) return [];
        const step = Math.ceil(logs.length / 100) || 1; 
        return logs.filter((_, i) => i % step === 0).map(log => ({
            time: new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            score: log.riskScore || 0
        }));
    }, [logs]);

    // Dynamically calculate trigger events based on AI State (Movement)
    const movementStats = useMemo(() => {
        const stats = {};
        if (!logs) return [];
        
        logs.forEach(log => {
            const state = log.aiState || 'Unknown Activity';
            if (stats[state] === undefined) {
                stats[state] = 0;
            }
            if (log.riskScore >= riskThreshold) {
                stats[state]++;
            }
        });
        return Object.entries(stats).sort((a, b) => b[1] - a[1]);
    }, [logs, riskThreshold]);

    // Sort logs to actually find the highest risk deviations, not just the most recent
    const topDeviations = useMemo(() => {
        if (!logs) return [];
        return [...logs].sort((a, b) => b.riskScore - a.riskScore).slice(0, 10);
    }, [logs]);

    // NEW: Robust fallback calculators for Environmental Data
    // If the parent component fails to pass averages in `metrics`, the template will calculate them from raw logs
    const displayWeatherTemp = useMemo(() => {
        if (metrics?.avgWeatherTemp != null && metrics.avgWeatherTemp !== "N/A") return `${metrics.avgWeatherTemp}°C`;
        
        if (logs && logs.length > 0) {
            const validLogs = logs.filter(l => l.weatherTemp != null || l.extTemp != null || l.ext_temp != null);
            if (validLogs.length > 0) {
                const sum = validLogs.reduce((acc, l) => acc + Number(l.weatherTemp || l.extTemp || l.ext_temp), 0);
                return `${(sum / validLogs.length).toFixed(1)}°C`;
            }
        }
        return "N/A";
    }, [metrics, logs]);

    const displayAmbientTemp = useMemo(() => {
        if (metrics?.avgAmbientTemp != null && metrics.avgAmbientTemp !== "N/A") return `${metrics.avgAmbientTemp}°C`;
        
        if (logs && logs.length > 0) {
            const validLogs = logs.filter(l => l.ambientTemp != null || l.ambient_temp != null);
            if (validLogs.length > 0) {
                const sum = validLogs.reduce((acc, l) => acc + Number(l.ambientTemp || l.ambient_temp), 0);
                return `${(sum / validLogs.length).toFixed(1)}°C`;
            }
        }
        return "N/A";
    }, [metrics, logs]);

    return (
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
            <div ref={ref} className="form-container">
                <style>{`
                    /* EXTREME COMPACT STYLES FOR STRICT 1-PAGE FIT */
                    .form-container * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; }
                    .form-container { width: 7.5in; background: #ffffff; color: #1a1a1a; padding: 12px 15px; }
                    
                    .header-section { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 10px; border-bottom: 2px solid #1e293b; padding-bottom: 4px;}
                    .header-title-left { font-size: 13px; font-weight: 800; color: #1e293b; text-transform: uppercase; }
                    .header-title-right { font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; }
                    
                    .patient-info-grid { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 6px 0; margin-bottom: 12px; }
                    .input-group { display: flex; flex-direction: column; width: 48%; }
                    .input-label { font-size: 7px; font-weight: 700; text-transform: uppercase; margin-bottom: 3px; color: #4b5563; }
                    .input-field { background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 4px 6px; font-size: 9px; font-weight: 600; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                    
                    .section-wrapper { margin-top: 10px; margin-bottom: 12px; width: 100%; clear: both; }
                    .section-header { font-size: 9px; font-weight: 700; text-transform: uppercase; color: #1e293b; margin-bottom: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px;}
                    
                    .form-container table { width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; table-layout: fixed; }
                    .form-container th { background-color: #1e293b; color: #ffffff; font-size: 6px; font-weight: 700; text-transform: uppercase; text-align: center; padding: 3px; border-right: 1px solid #334155; }
                    .form-container th:last-child { border-right: none; }
                    .form-container td { padding: 3px; font-size: 8px; color: #1a1a1a; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; text-align: center; }
                    .form-container td:last-child { border-right: none; }
                    .form-container tr:nth-child(even) { background-color: #f8fafc; }
                    
                    .metric-cell { background-color: #ffffff; font-size: 10px; font-weight: 800; }
                    .metric-cell.alert { color: #b91c1c; background-color: #fef2f2; }
                    .status-critical { color: #b91c1c; font-weight: 700; }
                    .status-normal { color: #059669; font-weight: 700; }
                    
                    .split-tables { display: flex; justify-content: space-between; width: 100%; gap: 12px; }
                    .split-tables .section-wrapper { width: 48%; margin-bottom: 0; margin-top: 0; }
                    
                    .chart-box { border: 1px solid #cbd5e1; display: flex; align-items: center; justify-content: center; background-color: #ffffff; padding-top: 8px; width: 100%; height: 90px; overflow: hidden; }
                `}</style>

                <div className="header-section">
                    <div className="header-title-left">KneuraSense Biomechanical Report</div>
                    <div className="header-title-right">Patient Data Export</div>
                </div>

                <div className="patient-info-grid">
                    <div className="input-group">
                        <div className="input-label">Patient Name</div>
                        <div className="input-field">{patientData?.name || "N/A"}</div>
                    </div>
                    <div className="input-group">
                        <div className="input-label">Date of Report Generation</div>
                        <div className="input-field">{new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}</div>
                    </div>
                    <div className="input-group">
                        <div className="input-label">Attending / Referring Physician</div>
                        <div className="input-field">{patientData?.physician || "Not Assigned"}</div>
                    </div>
                    <div className="input-group">
                        <div className="input-label">Patient ID / MRN</div>
                        <div className="input-field">{patientData?.id || "Not Assigned"}</div>
                    </div>
                    <div className="input-group">
                        <div className="input-label">Primary Device ID (Hardware)</div>
                        <div className="input-field">{patientData?.deviceId || "Not Assigned"}</div>
                    </div>
                    <div className="input-group">
                        <div className="input-label">Analysis Period (Duration)</div>
                        <div className="input-field">Last 24 Hours (Active Wear)</div>
                    </div>
                </div>

                <div className="section-wrapper">
                    <div className="section-header">Executive Summary Metrics</div>
                    <table>
                        <thead>
                            <tr>
                                <th style={{ width: '15%' }}>Mean Risk Score</th>
                                <th style={{ width: '20%' }}>Critical Overload Events</th>
                                <th style={{ width: '20%' }}>Peak Compressive Force</th>
                                <th style={{ width: '25%' }}>Mean Skin Temp</th>
                                <th style={{ width: '20%' }}>Total Data Points</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="metric-cell">{metrics?.meanRisk || "0"}</td>
                                <td className={`metric-cell ${metrics?.criticalCount > 0 ? 'alert' : ''}`}>
                                    {metrics?.criticalCount || "0"}
                                </td>
                                <td className="metric-cell">{metrics?.peakForce != null ? `${metrics.peakForce} N` : "N/A"}</td>
                                <td className="metric-cell">{metrics?.meanSkinTemp != null && metrics?.meanSkinTemp !== "N/A" ? `${metrics.meanSkinTemp}°C` : "N/A"}</td>
                                <td className="metric-cell">{metrics?.totalLogs || "0"}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="section-wrapper">
                    <div className="section-header">Stress Kinetics Trend</div>
                    <div className="chart-box">
                        {chartData.length > 0 ? (
                            <LineChart width={620} height={80} data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="time" tick={{ fontSize: 8, fill: '#64748b' }} axisLine={false} tickLine={false} minTickGap={40} />
                                <YAxis domain={[0, 100]} tick={{ fontSize: 8, fill: '#64748b' }} axisLine={false} tickLine={false} width={25} />
                                <ReferenceLine y={riskThreshold} stroke="#f43f5e" strokeDasharray="3 3" />
                                <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                            </LineChart>
                        ) : (
                            <span style={{ fontSize: '9px', color: '#9ca3af', fontStyle: 'italic' }}>No trend data available.</span>
                        )}
                    </div>
                </div>

                <div className="section-wrapper">
                    <div className="section-header">Critical Event Logs (Top 10 Deviations)</div>
                    <table>
                        <thead>
                            <tr>
                                <th style={{ width: '25%' }}>Timestamp</th>
                                <th style={{ width: '15%' }}>Risk Score</th>
                                <th style={{ width: '15%' }}>Knee Flexion Angle</th>
                                <th style={{ width: '15%' }}>Skin Temp</th>
                                <th style={{ width: '15%' }}>Movement (AI State)</th>
                                <th style={{ width: '15%' }}>Clinical Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topDeviations.length > 0 ? topDeviations.map((log, index) => {
                                const isCritical = log.riskScore >= riskThreshold;
                                return (
                                    <tr key={index}>
                                        <td>{new Date(log.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                                        <td className={isCritical ? "status-critical" : "status-normal"}>{log.riskScore || "0"}</td>
                                        <td>{log.angle != null ? `${log.angle.toFixed(1)}°` : "0°"}</td>
                                        <td>{log.skinTemp != null ? `${log.skinTemp.toFixed(1)}°C` : "N/A"}</td>
                                        <td style={{ textTransform: 'capitalize' }}>{log.aiState || "Unknown"}</td>
                                        <td className={isCritical ? "status-critical" : "status-normal"}>
                                            {isCritical ? "CRITICAL" : "WNL (Safe)"}
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr><td colSpan="6">No recent log data available</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="split-tables">
                    <div className="section-wrapper">
                        <div className="section-header">Events Trigger (Critical Context - Top 10)</div>
                        <table>
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'left', paddingLeft: '6px' }}>Detected Movement State</th>
                                    <th>Critical Events</th>
                                </tr>
                            </thead>
                            <tbody>
                                {movementStats.length > 0 ? movementStats.slice(0, 10).map(([state, count]) => (
                                    <tr key={state}>
                                        <td style={{ textAlign: 'left', paddingLeft: '6px', textTransform: 'capitalize' }}>{state}</td>
                                        <td className={count > 0 ? "status-critical" : "status-normal"}>{count}</td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="2">No movement data recorded.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="section-wrapper">
                        <div className="section-header">Environmental Averages</div>
                        <table>
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'left', paddingLeft: '6px' }}>Parameter</th>
                                    <th>Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style={{ textAlign: 'left', paddingLeft: '6px' }}>Avg Ambient Temp</td>
                                    <td>{displayAmbientTemp}</td>
                                </tr>
                                <tr>
                                    <td style={{ textAlign: 'left', paddingLeft: '6px' }}>Avg Weather Temp</td>
                                    <td>{displayWeatherTemp}</td>
                                </tr>
                                <tr>
                                    <td style={{ textAlign: 'left', paddingLeft: '6px' }}>Avg Atm. Pressure</td>
                                    <td>{logs && logs.length > 0 && logs[0].pressure ? `${Math.round(logs[0].pressure)} hPa` : "N/A"}</td>
                                </tr>
                                <tr>
                                    <td style={{ textAlign: 'left', paddingLeft: '6px' }}>Overall Weather Mod.</td>
                                    <td>Normal</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px solid #cbd5e1', fontSize: '6px', color: '#64748b', textAlign: 'center' }}>
                    <strong>CONFIDENTIALITY NOTICE:</strong> This document contains protected health information intended only for the use of the named individual/entity. Generated by KneuraSense Analytics Engine • Page 1 of 1
                </div>

            </div>
        </div>
    );
});

BiomechanicalReportTemplate.displayName = 'BiomechanicalReportTemplate';

export default BiomechanicalReportTemplate;