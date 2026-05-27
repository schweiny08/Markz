import React, { useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, StatusBar, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../constants/colors';
import { useApp } from '../context/AppContext';
import { TestTemplate } from '../types';
import { RootStackParamList } from '../../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const nav = useNavigation<Nav>();
  const { templates, sessions, loadTemplates, loadSessions, deleteTemplate } = useApp();

  useEffect(() => {
    loadTemplates();
    loadSessions();
  }, [loadTemplates, loadSessions]);

  const onNewTemplate = () => nav.navigate('Setup', { template: null });

  const onEditTemplate = (t: TestTemplate) => nav.navigate('Setup', { template: t });

  const onStartSession = (t: TestTemplate) => nav.navigate('VoiceIntake', { template: t });

  const onDelete = (t: TestTemplate) => {
    Alert.alert('Delete Template', `Delete "${t.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteTemplate(t.id) },
    ]);
  };

  const onViewSession = (sessionId: string, name: string) =>
    nav.navigate('Results', { sessionId, title: name });

  const sessionCountFor = (templateId: string) =>
    sessions.filter(s => s.templateId === templateId).length;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      <View style={styles.header}>
        <Text style={styles.appTitle}>MARKZ VOICE</Text>
        <Text style={styles.subtitle}>Hands-Free Classroom Ledger</Text>
      </View>

      <FlatList
        data={templates}
        keyExtractor={t => t.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No test templates yet.</Text>
            <Text style={styles.emptyHint}>Create one to start recording marks.</Text>
          </View>
        }
        ListHeaderComponent={
          <Text style={styles.sectionLabel}>TEST TEMPLATES</Text>
        }
        renderItem={({ item: t }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardName}>{t.name}</Text>
              <Text style={styles.cardMeta}>
                {t.subjects.length} subjects · {sessionCountFor(t.id)} sessions
              </Text>
            </View>
            <View style={styles.subjects}>
              {t.subjects.map(s => (
                <View key={s.id} style={styles.subjectChip}>
                  <Text style={styles.subjectChipText}>{s.name} /{s.maxMarks}</Text>
                </View>
              ))}
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity style={styles.btnStart} onPress={() => onStartSession(t)}>
                <Text style={styles.btnStartText}>▶  START SESSION</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnEdit} onPress={() => onEditTemplate(t)}>
                <Text style={styles.btnEditText}>EDIT</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnDelete} onPress={() => onDelete(t)}>
                <Text style={styles.btnDeleteText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {sessions.length > 0 && (
        <>
          <Text style={[styles.sectionLabel, { paddingHorizontal: 16, paddingTop: 8 }]}>
            RECENT SESSIONS
          </Text>
          <FlatList
            data={sessions.slice(0, 5)}
            keyExtractor={s => s.id}
            horizontal
            contentContainerStyle={styles.sessionList}
            renderItem={({ item: s }) => (
              <TouchableOpacity
                style={styles.sessionCard}
                onPress={() => onViewSession(s.id, s.templateName)}
              >
                <Text style={styles.sessionName}>{s.templateName}</Text>
                <Text style={styles.sessionDate}>
                  {new Date(s.createdAt).toLocaleDateString('en-IN', {
                    day: '2-digit', month: 'short',
                  })}
                </Text>
              </TouchableOpacity>
            )}
          />
        </>
      )}

      <TouchableOpacity style={styles.fab} onPress={onNewTemplate}>
        <Text style={styles.fabText}>+  NEW TEMPLATE</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: { padding: 20, paddingTop: 32, borderBottomWidth: 1, borderBottomColor: Colors.border },
  appTitle: { fontSize: 26, fontWeight: '900', color: Colors.primary, letterSpacing: 2 },
  subtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2, letterSpacing: 1 },
  list: { padding: 16, paddingBottom: 100 },
  sectionLabel: { fontSize: 10, color: Colors.textMuted, letterSpacing: 2, marginBottom: 8 },
  card: {
    backgroundColor: Colors.surface, borderRadius: 12, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: Colors.border,
  },
  cardHeader: { marginBottom: 10 },
  cardName: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  cardMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  subjects: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  subjectChip: {
    backgroundColor: Colors.surfaceAlt, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  subjectChipText: { fontSize: 11, color: Colors.textSecondary },
  cardActions: { flexDirection: 'row', gap: 8 },
  btnStart: {
    flex: 1, backgroundColor: Colors.primary, borderRadius: 8,
    paddingVertical: 10, alignItems: 'center',
  },
  btnStartText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12, letterSpacing: 1 },
  btnEdit: {
    backgroundColor: Colors.surfaceAlt, borderRadius: 8,
    paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center',
  },
  btnEditText: { color: Colors.textSecondary, fontWeight: '700', fontSize: 12 },
  btnDelete: {
    backgroundColor: '#FDECEA', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 10, alignItems: 'center',
  },
  btnDeleteText: { color: Colors.error, fontWeight: '700', fontSize: 14 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: Colors.textSecondary, fontSize: 16, fontWeight: '600' },
  emptyHint: { color: Colors.textMuted, fontSize: 13, marginTop: 6 },
  sessionList: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  sessionCard: {
    backgroundColor: Colors.surface, borderRadius: 10, padding: 14,
    borderWidth: 1, borderColor: Colors.border, minWidth: 120,
  },
  sessionName: { color: Colors.textPrimary, fontSize: 13, fontWeight: '600' },
  sessionDate: { color: Colors.textMuted, fontSize: 11, marginTop: 4 },
  fab: {
    position: 'absolute', bottom: 24, left: 16, right: 16,
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  },
  fabText: { color: '#FFFFFF', fontWeight: '900', fontSize: 14, letterSpacing: 1.5 },
});
