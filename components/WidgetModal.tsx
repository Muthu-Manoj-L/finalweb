import React, { useEffect, useMemo, useState, useRef } from 'react';
<<<<<<< HEAD
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, AppState, AppStateStatus, Linking } from 'react-native';
import Svg, { Rect, Path, Circle, Text as SvgText } from 'react-native-svg';
import * as ExpoCamera from 'expo-camera';
=======
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList } from 'react-native';
import Svg, { Rect, Path, Circle, Text as SvgText } from 'react-native-svg';
>>>>>>> origin/main
import { useTheme } from '@/contexts/ThemeContext';

interface Props {
  visible: boolean;
  widget?: string | null;
  onClose: () => void;
}

function generatePoint(i: number) {
  // pseudo-random smooth data
  return Math.round(50 + 40 * Math.sin(i / 6) + (Math.sin(i / 3) * 10));
}

export function WidgetModal({ visible, widget, onClose }: Props) {
  const { colors } = useTheme();
  const title = widget || 'Demo Widget';
  const isRealTime = /real-time|real time|live/i.test(title);
  const isProximityWidget = /proximity/i.test(title);
  const isRecorded = /recorded|previous|history|data/i.test(title);

  // Real-time data stream (used for generic and proximity)
  const [streamData, setStreamData] = useState<number[]>(() => Array.from({ length: 40 }, (_, i) => generatePoint(i)));
  const intervalRef = useRef<number | null>(null);
  const proximityIntervalRef = useRef<number | null>(null);
  const [proximityAvailable, setProximityAvailable] = useState<boolean>(false);
  const [proximityValue, setProximityValue] = useState<number | null>(null);
<<<<<<< HEAD
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [permissionInfo, setPermissionInfo] = useState<any>(null);
  const cameraRef = useRef<any>(null);
  const appState = useRef<AppStateStatus>(AppState.currentState as AppStateStatus);

  // Resolve Camera component safely — some bundlers export the Camera as a module object with .default
  const CameraComponentCandidate: any = (ExpoCamera as any).Camera;
  let CameraComponent: any = null;
  let cameraResolutionInfo = 'none';
  try {
    if (typeof CameraComponentCandidate === 'function') {
      CameraComponent = CameraComponentCandidate;
      cameraResolutionInfo = 'function:direct';
    } else if (CameraComponentCandidate && typeof CameraComponentCandidate === 'object') {
      // try common shapes
      if (typeof CameraComponentCandidate.default === 'function') {
        CameraComponent = CameraComponentCandidate.default;
        cameraResolutionInfo = 'object.default:function';
      } else if (typeof CameraComponentCandidate.Camera === 'function') {
        CameraComponent = CameraComponentCandidate.Camera;
        cameraResolutionInfo = 'object.Camera:function';
      } else if (CameraComponentCandidate.default && typeof CameraComponentCandidate.default.Camera === 'function') {
        CameraComponent = CameraComponentCandidate.default.Camera;
        cameraResolutionInfo = 'object.default.Camera:function';
      } else {
        // not a function — log keys for debugging
        cameraResolutionInfo = 'object:keys=' + Object.keys(CameraComponentCandidate).join(',');
      }
    }
  } catch (e) {
    cameraResolutionInfo = 'resolve-error:' + String(e);
  }

  // debug: log types that might be invalid for rendering
  // eslint-disable-next-line no-console
  console.debug('WidgetModal render debug', {
    CameraComponentType: CameraComponent ? (typeof CameraComponent) : typeof CameraComponentCandidate,
    cameraResolutionInfo,
    ExpoCameraCameraType: typeof CameraComponentCandidate,
    permissionInfo,
    isRealTime,
    title,
  });

  // Simple error boundary to catch render errors inside this modal and show a fallback UI
  class InnerErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null; info?: any }> {
    constructor(props: any) {
      super(props);
      this.state = { error: null };
    }
    componentDidCatch(error: Error, info: any) {
      // store error for display
      // build a summary of direct child types for debugging
      const summarize = (children: React.ReactNode) => {
        const types: string[] = [];
        React.Children.forEach(children, (child: any) => {
          if (!child) { types.push(String(child)); return; }
          const t = child.type;
          if (typeof t === 'string') types.push(t);
          else if (typeof t === 'function') types.push(t.displayName || t.name || 'FunctionComponent');
          else if (typeof t === 'object') {
            // try to inspect common shapes
            if (t && (t.$$typeof || t.default)) types.push('ModuleObject');
            else types.push('Object');
          } else types.push(String(typeof t));
        });
        return types.join(', ');
      };

      let childSummary: string | undefined;
      try { childSummary = summarize(this.props.children); } catch (_) { childSummary = undefined; }

      this.setState({ error, info: { ...info, childSummary } });
      // also log to console so Metro shows it
      // eslint-disable-next-line no-console
      console.error('WidgetModal render error:', error, info);
    }
    render() {
      if (this.state.error) {
        return (
          <View style={{ padding: 12 }}>
            <Text style={{ color: colors.text, fontWeight: '700' }}>Widget error</Text>
            <Text style={{ color: colors.textSecondary, marginTop: 8 }}>{String(this.state.error.message)}</Text>
            <Text style={{ color: colors.textSecondary, marginTop: 8, fontSize: 12 }}>{this.state.info?.componentStack}</Text>
            {this.state.info?.childSummary ? (
              <Text style={{ color: colors.textSecondary, marginTop: 8, fontSize: 12 }}>Child types: {this.state.info.childSummary}</Text>
            ) : null}
            <TouchableOpacity onPress={() => this.setState({ error: null, info: undefined })} style={{ marginTop: 8 }}>
              <Text style={{ color: colors.primary }}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        );
      }
      return this.props.children as any;
    }
  }

  useEffect(() => {
    if (visible && isRealTime) {
      // Request camera permissions when opening real-time widgets
      (async () => {
        const check = async () => {
          try {
            let res: any = null;
            if ((ExpoCamera as any).requestCameraPermissionsAsync) {
              res = await (ExpoCamera as any).requestCameraPermissionsAsync();
            } else if ((ExpoCamera as any).requestPermissionsAsync) {
              res = await (ExpoCamera as any).requestPermissionsAsync();
            } else if ((ExpoCamera as any).useCameraPermissions) {
              // hooks-based API — call getCameraPermissionsAsync as fallback
              res = await (ExpoCamera as any).getCameraPermissionsAsync();
            } else if ((ExpoCamera as any).getCameraPermissionsAsync) {
              res = await (ExpoCamera as any).getCameraPermissionsAsync();
            }
            if (res) {
              setPermissionInfo(res);
              setHasCameraPermission(res.status === 'granted');
            }
          } catch (e) {
            setPermissionInfo(null);
            setHasCameraPermission(false);
          }
        };

        await check();
      })();
=======

  useEffect(() => {
    if (visible && isRealTime) {
>>>>>>> origin/main
      if (isProximityWidget) {
        // Require a native proximity module to be present at runtime.
        let Prox: any = null;
        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          Prox = require('react-native-proximity');
        } catch (e) {
          Prox = null;
        }

        if (!Prox || typeof Prox.addListener !== 'function') {
          // Show a clear state: no native proximity module available. We do not fall back to simulation.
          setProximityAvailable(false);
          setProximityValue(null);
          return;
        }

        setProximityAvailable(true);
        const handler = (data: any) => {
          const v = typeof data.distance === 'number' ? data.distance : (data.proximity ? 0 : 100);
<<<<<<< HEAD
          // debug proximity events so Metro logs show raw data and resolved value
          // eslint-disable-next-line no-console
          console.debug('Proximity event', { raw: data, value: v });
=======
>>>>>>> origin/main
          setProximityValue(v);
          setStreamData((prev) => {
            const next = prev.slice(1);
            next.push(Math.round(v));
            return next;
          });
        };
<<<<<<< HEAD
        // Register listener using common API shapes. Some packages expose addListener(handler)
        // others expose addEventListener(eventName, handler).
        try {
          if (typeof Prox.addListener === 'function') {
            Prox.addListener(handler);
          } else if (typeof Prox.addEventListener === 'function') {
            // some implementations require an event name
            try { Prox.addEventListener('proximity', handler); } catch (e) { Prox.addEventListener(handler); }
          }
        } catch (e) {
          // swallow registration errors but keep availability flag set to false in that case
          // eslint-disable-next-line no-console
          console.warn('Failed to register proximity listener', e);
        }

        return () => {
          try {
            if (typeof Prox.removeListener === 'function') {
              try { Prox.removeListener(handler); } catch (e) { /* fallback to no-arg */ Prox.removeListener(); }
            } else if (typeof Prox.removeEventListener === 'function') {
              try { Prox.removeEventListener('proximity', handler); } catch (e) { Prox.removeEventListener(handler); }
            }
          } catch (e) {
            // ignore
          }
=======
        Prox.addListener(handler);

        return () => {
          try { Prox.removeListener && Prox.removeListener(); } catch (e) {}
>>>>>>> origin/main
          setProximityAvailable(false);
          setProximityValue(null);
        };
      }

      // generic real-time fake stream for non-proximity widgets
      intervalRef.current = setInterval(() => {
        setStreamData((prev) => {
          const next = prev.slice(1);
          next.push(generatePoint(Date.now() / 1000));
          return next;
        });
      }, 600) as unknown as number;
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current as unknown as number);
      intervalRef.current = null;
    };
  }, [visible, isRealTime]);

<<<<<<< HEAD
  // Re-check camera permission when app returns to foreground.
  useEffect(() => {
    const handleAppStateChange = (next: AppStateStatus) => {
      // when coming to active from background/inactive -> re-check
      if (appState.current && appState.current.match(/inactive|background/) && next === 'active') {
        if (visible && isRealTime && /camera/i.test(title)) {
          (async () => {
              try {
                let res: any = null;
                if ((ExpoCamera as any).getCameraPermissionsAsync) {
                  res = await (ExpoCamera as any).getCameraPermissionsAsync();
                } else if ((ExpoCamera as any).getPermissionsAsync) {
                  res = await (ExpoCamera as any).getPermissionsAsync();
                }
                if (res) {
                  setPermissionInfo(res);
                  if (res.status === 'granted') setHasCameraPermission(true);
                }
              } catch (e) {
                // ignore
              }
          })();
        }
      }
      appState.current = next;
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
  }, [visible, isRealTime, title]);

=======
>>>>>>> origin/main
  // Recorded data sample
  const recordedSample = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => ({ id: String(i + 1), x: i + 1, y: Math.round(30 + 70 * Math.abs(Math.sin(i / 4))) }));
  }, []);

  const [recordView, setRecordView] = useState<'scatter' | 'bar' | 'table'>('scatter');

  // small helpers to render line path
  const pathFromData = (data: number[], w = 300, h = 120) => {
    const step = w / Math.max(1, data.length - 1);
    return data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${i * step} ${h - (v / 120) * h}`).join(' ');
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={[styles.backdrop, { backgroundColor: (colors.background === '#0F172A' ? 'rgba(3,6,15,0.75)' : 'rgba(255,255,255,0.6)') }]}>
        <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.primary + '55' }]}> 
<<<<<<< HEAD
          <InnerErrorBoundary>
            <View style={styles.headerRow}>
=======
          <View style={styles.headerRow}>
>>>>>>> origin/main
            <View style={[styles.neon, { backgroundColor: colors.primary + 'DD' }]} />
            <Text style={[styles.title, { color: colors.text, marginTop: 8 }]}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ color: colors.primary }}>Close</Text>
            </TouchableOpacity>
<<<<<<< HEAD
            </View>

          {isRealTime ? (
            <>
                      <View style={styles.realTimeRow}>
                        <View style={styles.graphArea}>
                          {/* Camera preview for camera real-time widget */}
                          { /camera/i.test(title) || /camera/i.test(widget || '') ? (
                              hasCameraPermission === false ? (
                                <View style={{ width: '100%', height: 140, justifyContent: 'center', alignItems: 'center' }}>
                                  <Text style={{ color: colors.text }}>Camera permission denied</Text>
                                  <TouchableOpacity onPress={async () => {
                                    try {
                                      // Try to actively request permission again if the API exists
                                      if ((ExpoCamera as any).requestCameraPermissionsAsync) {
                                        const r = await (ExpoCamera as any).requestCameraPermissionsAsync();
                                        if (r?.status === 'granted') { setHasCameraPermission(true); return; }
                                      } else if ((ExpoCamera as any).requestPermissionsAsync) {
                                        const r = await (ExpoCamera as any).requestPermissionsAsync();
                                        if (r?.status === 'granted') { setHasCameraPermission(true); return; }
                                      }

                                      // If still not granted, open system settings as a fallback so user can enable manually
                                      try {
                                        await Linking.openSettings();
                                      } catch (openErr) {
                                        // Some environments/platforms may not support Linking.openSettings()
                                        // attempt Expo Camera openSettings if available
                                        try { await (ExpoCamera as any).openSettings?.(); } catch (_) { /* ignore */ }
                                      }
                                    } catch (e) {
                                      // ignore failures — user can still open settings manually
                                    }
                                  }} style={{ marginTop: 8 }}>
                                    <Text style={{ color: colors.primary }}>Retry / Open Settings</Text>
                                  </TouchableOpacity>

                                    {/* debug area: show raw permission info and allow manual refresh */}
                                    <View style={{ marginTop: 10, alignItems: 'center' }}>
                                      <TouchableOpacity onPress={async () => {
                                        try {
                                          let res: any = null;
                                          if ((ExpoCamera as any).getCameraPermissionsAsync) {
                                            res = await (ExpoCamera as any).getCameraPermissionsAsync();
                                          } else if ((ExpoCamera as any).getPermissionsAsync) {
                                            res = await (ExpoCamera as any).getPermissionsAsync();
                                          }
                                          if (res) { setPermissionInfo(res); setHasCameraPermission(res.status === 'granted'); }
                                        } catch (e) {}
                                      }} style={{ marginTop: 6 }}>
                                        <Text style={{ color: colors.primary }}>Refresh status</Text>
                                      </TouchableOpacity>
                                      {permissionInfo ? (
                             <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 6 }}>{(() => {
                              try { return JSON.stringify(permissionInfo); } catch (e) { return String(permissionInfo); }
                             })()}</Text>
                                      ) : null}
                                    </View>
                                </View>
                              ) : (
                                <View style={{ width: '100%', height: 140, borderRadius: 8, overflow: 'hidden' }}>
                                  {CameraComponent ? (
                                    // render using JSX to avoid passing module objects to React
                                    // CameraComponent may be a function or a class
                                    // eslint-disable-next-line react/jsx-props-no-spreading
                                    <CameraComponent ref={cameraRef} style={{ flex: 1 }} ratio="16:9" />
                                  ) : (
                                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                      <Text style={{ color: colors.textSecondary }}>Camera component unavailable on this build</Text>
                                    </View>
                                  )}
                                </View>
                              )
                          ) : (
                            <Svg width="100%" height={140} viewBox="0 0 300 140">
                              <Rect x="0" y="0" width="300" height="140" rx="8" fill={colors.surface} />
                              <Path d={pathFromData(streamData)} stroke={colors.primary} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                            </Svg>
                          )}
                        </View>
=======
          </View>

          {isRealTime ? (
            <>
              <View style={styles.realTimeRow}>
                <View style={styles.graphArea}>
                  <Svg width="100%" height={140} viewBox="0 0 300 140">
                    <Rect x="0" y="0" width="300" height="140" rx="8" fill={colors.surface} />
                    <Path d={pathFromData(streamData)} stroke={colors.primary} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                </View>
>>>>>>> origin/main

                <View style={styles.rtSide}>
                  <Text style={[styles.panelTitle, { color: colors.text }]}>{isProximityWidget ? 'Proximity' : 'Current'}</Text>
                  <Text style={[styles.currentValue, { color: colors.primary }]}>{isProximityWidget ? (proximityValue === null ? 'Not available' : `${proximityValue} cm`) : `${streamData[streamData.length - 1]} AU`}</Text>
                  <Text style={[styles.panelLabel, { color: colors.textSecondary }]}>{isProximityWidget ? (proximityAvailable ? 'Source: phone sensor' : 'Proximity native module not available') : 'Integration: 100 ms'}</Text>

                  <View style={styles.qualityBox}>
                    <Text style={{ color: colors.text }}>Transfer Quality</Text>
                    <View style={styles.qualityBarBackground}>
                      <View style={[styles.qualityBar, { backgroundColor: colors.success, width: '82%' }]} />
                    </View>
                    <Text style={[styles.panelLabel, { color: colors.textSecondary }]}>82% packets OK</Text>
                  </View>
                </View>
              </View>
            </>
          ) : isRecorded ? (
            <>
              <View style={styles.recordControls}>
                <View style={styles.tabRow}>
                  <TouchableOpacity onPress={() => setRecordView('scatter')} style={[styles.tabBtn, recordView === 'scatter' && { borderColor: colors.primary }]}>
                    <Text style={{ color: colors.text }}>Scatter</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setRecordView('bar')} style={[styles.tabBtn, recordView === 'bar' && { borderColor: colors.primary }]}>
                    <Text style={{ color: colors.text }}>Bar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setRecordView('table')} style={[styles.tabBtn, recordView === 'table' && { borderColor: colors.primary }]}>
                    <Text style={{ color: colors.text }}>Table</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.recordBody}>
                  {recordView === 'table' ? (
                    <FlatList data={recordedSample} keyExtractor={(i) => i.id} style={{ maxHeight: 220 }} renderItem={({ item }) => (
                      <View style={[styles.tableRow, { borderColor: colors.border }] }>
                        <Text style={{ color: colors.text }}>{item.x}</Text>
                        <Text style={{ color: colors.text }}>{item.y}</Text>
                      </View>
                    )} />
                  ) : (
                    <Svg width="100%" height={220} viewBox="0 0 320 220">
                      <Rect x="0" y="0" width="320" height="220" rx="8" fill={colors.surface} />
                      {/* axes */}
                      <Path d="M40 200 L40 20" stroke={colors.textSecondary} strokeWidth="1" />
                      <Path d="M40 200 L300 200" stroke={colors.textSecondary} strokeWidth="1" />

                      {/* y axis ticks & labels */}
                      {Array.from({ length: 5 }).map((_, ti) => {
                        const y = 200 - ti * 40;
                        const val = Math.round((ti * 30));
                        return (
                          <React.Fragment key={ti}>
                            <Path d={`M36 ${y} L40 ${y}`} stroke={colors.textSecondary} strokeWidth="1" />
                            <SvgText x={8} y={y + 4} fill={colors.textSecondary} fontSize={10}>{String(val)}</SvgText>
                          </React.Fragment>
                        );
                      })}

                      {/* x axis ticks & labels */}
                      {recordedSample.map((d, i) => {
                        const x = 40 + i * ((260) / Math.max(1, recordedSample.length - 1));
                        return (
                          <React.Fragment key={d.id}>
                            <Path d={`M${x} 200 L${x} 204`} stroke={colors.textSecondary} strokeWidth="1" />
                            {i % 5 === 0 && (
                              <SvgText x={x - 6} y={216} fill={colors.textSecondary} fontSize={9}>{String(d.x)}</SvgText>
                            )}
                          </React.Fragment>
                        );
                      })}

                      {recordView === 'bar' ? (
                          recordedSample.map((d, i) => {
                          const x = 40 + i * ((260) / Math.max(1, recordedSample.length - 1));
                          const barW = 8;
                          const barH = (d.y / 120) * 160;
                          const y = 200 - barH;
                          return (
                            <React.Fragment key={d.id}>
                              <Rect x={x - barW / 2} y={y} width={barW} height={barH} fill={colors.primary} />
                              <SvgText x={x - 10} y={y - 6} fill={colors.text} fontSize={10}>{String(d.y)}</SvgText>
                            </React.Fragment>
                          );
                        })
                      ) : (
                        <>
                          <Path d={recordedSample.map((d, i) => `${i === 0 ? 'M' : 'L'} ${40 + i * (260 / Math.max(1, recordedSample.length - 1))} ${200 - (d.y / 120) * 160}`).join(' ')} stroke={colors.primary} strokeWidth={2} fill="none" />
                          {recordedSample.map((d, i) => {
                            const cx = 40 + i * (260 / Math.max(1, recordedSample.length - 1));
                            const cy = 200 - (d.y / 120) * 160;
                            return (
                              <React.Fragment key={d.id}>
                                <Circle cx={cx} cy={cy} r={3} fill={colors.primary} />
                                <SvgText x={cx - 10} y={cy - 8} fill={colors.text} fontSize={9}>{String(d.y)}</SvgText>
                              </React.Fragment>
                            );
                          })}
                        </>
                      )}
                    </Svg>
                  )}
                </View>
              </View>
            </>
          ) : (
            <View style={styles.genericBody}>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Preview content for this widget.</Text>
            </View>
          )}
<<<<<<< HEAD
          </InnerErrorBoundary>
=======
>>>>>>> origin/main
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { width: '92%', borderRadius: 12, padding: 14, borderWidth: 1 },
  neon: { height: 4, borderRadius: 4, marginBottom: 8 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 18, fontWeight: '700' },
  subtitle: { fontSize: 13, marginBottom: 10 },
  realTimeRow: { flexDirection: 'row', gap: 12 },
  graphArea: { flex: 1 },
  rtSide: { width: 140, paddingLeft: 12, justifyContent: 'flex-start' },
  panelTitle: { fontSize: 13, fontWeight: '600' },
  currentValue: { fontSize: 28, fontWeight: '800', marginVertical: 6 },
  panelLabel: { fontSize: 12 },
  qualityBox: { marginTop: 12 },
  qualityBarBackground: { width: '100%', height: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, marginTop: 8, overflow: 'hidden' },
  qualityBar: { height: '100%' },
  recordControls: {},
  tabRow: { flexDirection: 'row', justifyContent: 'flex-start', gap: 8, marginBottom: 10 },
  tabBtn: { padding: 8, borderRadius: 8, borderWidth: 1, marginRight: 8 },
  recordBody: { height: 220 },
  tableRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, paddingHorizontal: 6, borderBottomWidth: 1 },
  genericBody: { padding: 8 },
});
