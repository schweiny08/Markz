import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Share,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../constants/colors';
import { useApp } from '../context/AppContext';
import { StudentRecord } from '../types';
import { getGradeInfo } from '../constants/grades';
import GradeBadge from '../components/GradeBadge';
import { RootStackParamList } from '../../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'Results'>;

export default function ResultsScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { sessionId, title } = route.params;
  const { getSessionRecords } = useApp();

  const [records, setRecords] = useState<StudentRecord[]>([]);

  useEffect(() => {
    getSessionRecords(sessionId).then(setRecords);
  }, [sessionId, getSessionRecords]);

  const gradeDistribution = () => {
    const dist: Record<string, number> = {};
    records.forEach(r => {
      dist[r.grade] = (dist[r.grade] ?? 0) + 1;
    });
    return dist;
  };

  const avg = records.length > 0
    ? records.reduce((s, r) => s + r.percentage, 0) / records.length
    : 0;

  const exportCSV = async () => {
    if (records.length === 0) { return; }
    const header = `Roll,${records[0].marks.map((_, i) => `Sub${i + 1}`).join(',')},Total,Percentage,Grade`;
    const rows = records.map(r =>
      `${r.rollNumber},${r.marks.map(m => m === null ? 'AB' : m).join(',')},${r.totalMarks},${r.percentage.toFixed(2)},${r.grade}`,
    );
    const csv = [header, ...rows].join('\n');
    await Share.share({ message: csv, title: `${title} Results` });
  };

  const dist = gradeDistribution();

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity onPress={exportCSV}>
          <Text style={styles.exportBtn}>EXPORT</Text>
        </TouchableOpacity>
      </View>

      {/* Summary card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryVal}>{records.length}</Text>
          <Text style={styles.summaryKey}>Students</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryVal}>{avg.toFixed(1)}%</Text>
          <Text style={styles.summaryKey}>Class Avg</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryVal, { color: getGradeInfo(avg).bgColor }]}>
            {getGradeInfo(avg).grade}
          </Text>
          <Text style={styles.summaryKey}>Avg Grade</Text>
        </View>
      </View>

      {/* Grade distribution */}
      <View style={styles.distRow}>
        {Object.entries(dist).map(([g, count]) => {
          const info = getGradeInfo(
            g === 'A+' ? 95 : g === 'A' ? 80 : g === 'B+' ? 65 : g === 'B' ? 50 : g === 'C' ? 36 : 0,
          );
          return (
            <View key={g} style={[styles.distBadge, { backgroundColor: info.bgColor }]}>
              <Text style={[styles.distGrade, { color: info.textColor }]}>{g}</Text>
              <Text style={[styles.distCount, { color: info.textColor }]}>{count}</Text>
            </View>
          );
        })}
      </View>

      <FlatList
        data={records}
        keyExtractor={r => r.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Text style={styles.listLabel}>ALL RECORDS</Text>
        }
        renderItem={({ item: r }) => {
          const info = getGradeInfo(r.percentage);
          return (
            <View style={[styles.row, { borderLeftColor: info.bgColor }]}>
              <View style={styles.rowLeft}>
                <Text style={styles.rollNo}>Roll {r.rollNumber}</Text>
                <View style={styles.marksRow}>
                  {r.marks.map((m, i) => (
                    <Text key={i} style={[styles.markVal, m === null && styles.absentVal]}>
                      {m === null ? 'AB' : m}
                    </Text>
                  ))}
                </View>
              </View>
              <View style={styles.rowRight}>
                <Text style={styles.total}>{r.totalMarks}</Text>
                <Text style={styles.pct}>{r.percentage.toFixed(1)}%</Text>
                <GradeBadge grade={r.grade} percentage={r.percentage} size="sm" />
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, paddingTop: 20, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  back: { color: Colors.primary, fontSize: 14 },
  title: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700', flex: 1, textAlign: 'center' },
  exportBtn: { color: Colors.accent, fontWeight: '800', fontSize: 13 },
  summaryCard: {
    flexDirection: 'row', backgroundColor: Colors.surface,
    margin: 12, borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryVal: { fontSize: 26, fontWeight: '900', color: Colors.textPrimary },
  summaryKey: { fontSize: 10, color: Colors.textMuted, marginTop: 4, letterSpacing: 1 },
  summaryDivider: { width: 1, backgroundColor: Colors.border, marginVertical: 4 },
  distRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
    paddingHorizontal: 12, marginBottom: 12,
  },
  distBadge: {
    flexDirection: 'row', gap: 4, alignItems: 'center',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
  },
  distGrade: { fontWeight: '800', fontSize: 13 },
  distCount: { fontSize: 12, fontWeight: '600' },
  list: { padding: 12, paddingBottom: 40 },
  listLabel: { fontSize: 9, color: Colors.textMuted, letterSpacing: 2, marginBottom: 8 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: 8, padding: 12,
    marginBottom: 6, borderLeftWidth: 3,
  },
  rowLeft: { flex: 1 },
  rollNo: { color: Colors.textSecondary, fontSize: 12, fontWeight: '700', marginBottom: 4 },
  marksRow: { flexDirection: 'row', gap: 8 },
  markVal: { color: Colors.textPrimary, fontSize: 14, fontWeight: '600', minWidth: 22 },
  absentVal: { color: Colors.absent },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  total: { color: Colors.textPrimary, fontSize: 16, fontWeight: '800' },
  pct: { color: Colors.textSecondary, fontSize: 11 },
});
