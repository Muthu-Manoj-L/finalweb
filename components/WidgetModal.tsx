import React, { useEffect, useMemo, useState, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList } from 'react-native';
import Svg, { Rect, Path, Circle, Text as SvgText } from 'react-native-svg';
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

  useEffect(() => {
    if (visible && isRealTime) {
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
          setProximityValue(v);
          setStreamData((prev) => {
            const next = prev.slice(1);
            next.push(Math.round(v));
            return next;
          });
        };
        Prox.addListener(handler);

        return () => {
          try { Prox.removeListener && Prox.removeListener(); } catch (e) {}
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
          <View style={styles.headerRow}>
            <View style={[styles.neon, { backgroundColor: colors.primary + 'DD' }]} />
            <Text style={[styles.title, { color: colors.text, marginTop: 8 }]}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ color: colors.primary }}>Close</Text>
            </TouchableOpacity>
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
