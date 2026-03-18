import React, { forwardRef, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine } from 'recharts';

const BiomechanicalReportTemplate = forwardRef(({ patientData, metrics, logs }, ref) => {
    
    // Format logs for the chart
    const chartData = useMemo(() => {
        if (!logs || logs.length === 0) return [];
        const step = Math.ceil(logs.length / 100) || 1; 
        return logs.filter((_, i) => i % step === 0).map(log => ({
            time: new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            score: log.riskScore || 0
        }));
    }, [logs]);

    // Dynamically calculate Terrain Triggers from logs
    const terrainStats = useMemo(() => {
        const stats = { stairs: 0, incline: 0, flat: 0, uneven: 0 };
        if (!logs) return stats;
        
        logs.forEach(log => {
            if (log.riskScore >= 75) {
                const t = (log.terrain || 'flat').toLowerCase();
                if (t.includes('stair')) stats.stairs++;
                else if (t.includes('incline') || t.includes('slope')) stats.incline++;
                else if (t.includes('uneven')) stats.uneven++;
                else stats.flat++;
            }
        });
        return stats;
    }, [logs]);

    return (
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
            <div ref={ref} className="form-container">
                <style>{`
                    /* GLOBAL COMPACT STYLES FOR 1-PAGE FIT */
                    .form-container * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; }
                    .form-container { width: 7.5in; background: #ffffff; color: #1a1a1a; }
                    
                    /* Tighter Header */
                    .header-section { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 12px; border-bottom: 2px solid #1e293b; padding-bottom: 6px;}
                    .header-title-left { font-size: 14px; font-weight: 800; color: #1e293b; text-transform: uppercase; }
                    .header-title-right { font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; }
                    
                    /* REPLACED GRID WITH FLEX TO FIX HTML2PDF SCRAMBLING */
                    .patient-info-grid { display: flex; flex-wrap: wrap; justify-content: space-between; margin-bottom: 15px; }
                    .input-group { display: flex; flex-direction: column; width: 48%; margin-bottom: 8px; }
                    .input-label { font-size: 8px; font-weight: 700; text-transform: uppercase; margin-bottom: 2px; color: #4b5563; }
                    
                    /* Added truncation for long UUIDs to prevent box breaking */
                    .input-field { background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 4px 8px; font-size: 10px; font-weight: 600; color: #0f172a; min-height: 22px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                    
                    /* Tighter Sections */
                    .section-wrapper { margin-bottom: 12px; width: 100%; }
                    .section-header { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #1e293b; margin-bottom: 4px; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px;}
                    
                    /* Universal Compact Tables */
                    .form-container table { width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; table-layout: fixed; }
                    .form-container th { background-color: #1e293b; color: #ffffff; font-size: 7px; font-weight: 700; text-transform: uppercase; text-align: center; padding: 4px 2px; border-right: 1px solid #334155; word-wrap: break-word; }
                    .form-container th:last-child { border-right: none; }
                    .form-container td { padding: 4px 2px; font-size: 9px; color: #1a1a1a; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; vertical-align: middle; text-align: center; }
                    .form-container td:last-child { border-right: none; }
                    .form-container tr:nth-child(even) { background-color: #f8fafc; }
                    
                    /* Metrics */
                    .metric-cell { background-color: #ffffff; text-align: center; font-size: 12px; font-weight: 800; }
                    .metric-cell.alert { color: #b91c1c; background-color: #fef2f2; }
                    .status-critical { color: #b91c1c; font-weight: 700; }
                    .status-normal { color: #059669; font-weight: 700; }
                    
                    /* REPLACED GRID WITH FLEX FOR THE BOTTOM TWO TABLES */
                    .split-tables { display: flex; justify-content: space-between; width: 100%; }
                    .split-tables .section-wrapper { width: 48%; }
                    
                    /* Shorter Chart Box */
                    .chart-box { border: 1px solid #cbd5e1; display: flex; align-items: center; justify-content: center; background-color: #ffffff; padding-top: 10px; width: 100%; height: 130px; overflow: hidden; }
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
                                <th style={{ width: '15%' }}>Mean Risk Score<br/>(0-100)</th>
                                <th style={{ width: '20%' }}>Critical Overload<br/>Events</th>
                                <th style={{ width: '20%' }}>Peak Compressive<br/>Force</th>
                                <th style={{ width: '25%' }}>Mean Skin Temp<br/>(Inflammation Proxy)</th>
                                <th style={{ width: '20%' }}>Total Data Points<br/>Logged</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="metric-cell">{metrics?.meanRisk || "0"}</td>
                                <td className={`metric-cell ${metrics?.criticalCount > 0 ? 'alert' : ''}`}>
                                    {metrics?.criticalCount || "0"}
                                </td>
                                <td className="metric-cell">{metrics?.peakForce || "N/A"}</td>
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
                            <LineChart width={620} height={120} data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="time" tick={{ fontSize: 8, fill: '#64748b' }} axisLine={false} tickLine={false} minTickGap={40} />
                                <YAxis domain={[0, 100]} tick={{ fontSize: 8, fill: '#64748b' }} axisLine={false} tickLine={false} width={25} />
                                <ReferenceLine y={75} stroke="#f43f5e" strokeDasharray="3 3" />
                                <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                            </LineChart>
                        ) : (
                            <span style={{ fontSize: '10px', color: '#9ca3af', fontStyle: 'italic' }}>
                                No trend data available for this period.
                            </span>
                        )}
                    </div>
                </div>

                <div className="section-wrapper">
                    <div className="section-header">Critical Event Logs (Top 5 Deviations)</div>
                    <table>
                        <thead>
                            <tr>
                                <th style={{ width: '25%' }}>Timestamp</th>
                                <th style={{ width: '15%' }}>Risk Score</th>
                                <th style={{ width: '15%' }}>Knee Flexion<br/>Angle</th>
                                <th style={{ width: '15%' }}>Skin Temp</th>
                                <th style={{ width: '15%' }}>Terrain Context</th>
                                <th style={{ width: '15%' }}>Clinical Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs && logs.length > 0 ? logs.slice(0, 5).map((log, index) => {
                                const isCritical = log.riskScore >= 75;
                                return (
                                    <tr key={index}>
                                        <td>{new Date(log.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                                        <td className={isCritical ? "status-critical" : "status-normal"}>{log.riskScore || "0"}</td>
                                        <td>{log.angle != null ? `${log.angle.toFixed(1)}°` : "0°"}</td>
                                        <td>{log.skinTemp != null ? `${log.skinTemp.toFixed(1)}°C` : "N/A"}</td>
                                        <td>{log.terrain || "Flat Surface"}</td>
                                        <td className={isCritical ? "status-critical" : "status-normal"}>
                                            {isCritical ? "CRITICAL" : "WNL (Safe)"}
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: "center", padding: "8px" }}>No recent log data available</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="split-tables">
                    <div className="section-wrapper">
                        <div className="section-header">Terrain Triggers (Event Count)</div>
                        <table>
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'left', paddingLeft: '8px' }}>Terrain Type</th>
                                    <th>Critical Events</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style={{ textAlign: 'left', paddingLeft: '8px' }}>Stairs (Ascent/Descent)</td>
                                    <td className={terrainStats.stairs > 0 ? "status-critical" : ""}>{terrainStats.stairs}</td>
                                </tr>
                                <tr>
                                    <td style={{ textAlign: 'left', paddingLeft: '8px' }}>Incline / Slope</td>
                                    <td className={terrainStats.incline > 0 ? "status-critical" : ""}>{terrainStats.incline}</td>
                                </tr>
                                <tr>
                                    <td style={{ textAlign: 'left', paddingLeft: '8px' }}>Flat Surface</td>
                                    <td className={terrainStats.flat > 0 ? "status-critical" : ""}>{terrainStats.flat}</td>
                                </tr>
                                <tr>
                                    <td style={{ textAlign: 'left', paddingLeft: '8px' }}>Uneven Ground</td>
                                    <td className={terrainStats.uneven > 0 ? "status-critical" : ""}>{terrainStats.uneven}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="section-wrapper">
                        <div className="section-header">Environmental Averages</div>
                        <table>
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'left', paddingLeft: '8px' }}>Parameter</th>
                                    <th>Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style={{ textAlign: 'left', paddingLeft: '8px' }}>Avg Ambient Temp</td>
                                    <td>{metrics?.avgAmbientTemp != null && metrics.avgAmbientTemp !== "N/A" ? `${metrics.avgAmbientTemp}°C` : "N/A"}</td>
                                </tr>
                                <tr>
                                    <td style={{ textAlign: 'left', paddingLeft: '8px' }}>Avg Humidity</td>
                                    <td>{metrics?.avgHumidity ? `${metrics.avgHumidity}%` : "N/A"}</td>
                                </tr>
                                <tr>
                                    <td style={{ textAlign: 'left', paddingLeft: '8px' }}>Avg Atm. Pressure</td>
                                    <td>{logs && logs.length > 0 && logs[0].pressure ? `${Math.round(logs[0].pressure)} hPa` : "N/A"}</td>
                                </tr>
                                <tr>
                                    <td style={{ textAlign: 'left', paddingLeft: '8px' }}>Overall Weather Mod.</td>
                                    <td>Normal</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #cbd5e1', fontSize: '7px', color: '#64748b', textAlign: 'center', lineHeight: '1.4' }}>
                    <strong>CONFIDENTIALITY NOTICE:</strong> This document contains protected health information intended only for the use of the named individual/entity. <br/>
                    Generated by KneuraSense Edge AI Analytics Engine • Page 1 of 1
                </div>

            </div>
        </div>
    );
});

BiomechanicalReportTemplate.displayName = 'BiomechanicalReportTemplate';

export default BiomechanicalReportTemplate;