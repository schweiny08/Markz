import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../constants/colors';
import { useApp } from '../context/AppContext';
import { Subject, TestTemplate } from '../types';
import { RootStackParamList } from '../../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'Setup'>;

const MAX_MARK_OPTIONS = [25, 50, 75, 100];
const DEFAULT_SUBJECT_NAMES = ['English', 'Kannada', 'Mathematics', 'Science', 'Social Science', 'Hindi'];

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function makeSubject(name: string, maxMarks: number): Subject {
  return { id: uid(), name, maxMarks };
}

export default function SetupScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();
  const existing = route.params?.template;
  const { saveTemplate } = useApp();

  const [name, setName] = useState(existing?.name ?? '');
  const [subjects, setSubjects] = useState<Subject[]>(
    existing?.subjects ?? [makeSubject('English', 100), makeSubject('Kannada', 100)],
  );

  const addSubject = () => {
    if (subjects.length >= 8) {
      Alert.alert('Limit reached', 'Maximum 8 subjects allowed.');
      return;
    }
    const defaultName = DEFAULT_SUBJECT_NAMES[subjects.length] ?? `Subject ${subjects.length + 1}`;
    setSubjects(prev => [...prev, makeSubject(defaultName, 100)]);
  };

  const removeSubject = (id: string) => {
    if (subjects.length <= 2) {
      Alert.alert('Minimum 2 subjects required.');
      return;
    }
    setSubjects(prev => prev.filter(s => s.id !== id));
  };

  const updateName = (id: string, value: string) =>
    setSubjects(prev => prev.map(s => s.id === id ? { ...s, name: value } : s));

  const updateMaxMarks = (id: string, maxMarks: number) =>
    setSubjects(prev => prev.map(s => s.id === id ? { ...s, maxMarks } : s));

  const onSave = async () => {
    if (!name.trim()) {
      Alert.alert('Enter a template name.');
      return;
    }
    for (const s of subjects) {
      if (!s.name.trim()) {
        Alert.alert('All subjects need a name.');
        return;
      }
    }
    const template: TestTemplate = {
      id: existing?.id ?? uid(),
      name: name.trim(),
      subjects,
      createdAt: existing?.createdAt ?? Date.now(),
    };
    await saveTemplate(template);
    nav.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.titleBar}>
        <TouchableOpacity onPress={() => nav.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{existing ? 'Edit Template' : 'New Template'}</Text>
        <TouchableOpacity onPress={onSave}>
          <Text style={styles.saveBtn}>SAVE</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>TEMPLATE NAME</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Unit Test 1 — Class 10A"
          placeholderTextColor={Colors.textMuted}
        />

        <Text style={[styles.label, { marginTop: 24 }]}>
          SUBJECTS  ({subjects.length})
        </Text>
        <Text style={styles.hint}>
          Define the sequence in which you'll dictate marks.
        </Text>

        {subjects.map((s, idx) => (
          <View key={s.id} style={styles.subjectRow}>
            <View style={styles.indexCircle}>
              <Text style={styles.indexText}>{idx + 1}</Text>
            </View>
            <TextInput
              style={[styles.input, styles.subjectInput]}
              value={s.name}
              onChangeText={v => updateName(s.id, v)}
              placeholder="Subject name"
              placeholderTextColor={Colors.textMuted}
            />
            <View style={styles.markPicker}>
              {MAX_MARK_OPTIONS.map(m => (
                <TouchableOpacity
                  key={m}
                  style={[styles.markChip, s.maxMarks === m && styles.markChipActive]}
                  onPress={() => updateMaxMarks(s.id, m)}
                >
                  <Text style={[styles.markChipText, s.maxMarks === m && styles.markChipTextActive]}>
                    {m}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.removeBtn} onPress={() => removeSubject(s.id)}>
              <Text style={styles.removeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={styles.addBtn} onPress={addSubject}>
          <Text style={styles.addBtnText}>+  ADD SUBJECT</Text>
        </TouchableOpacity>

        <View style={styles.preview}>
          <Text style={styles.previewLabel}>VOICE SEQUENCE PREVIEW</Text>
          <Text style={styles.previewText}>
            "Roll 1: {subjects.map(s => `[${s.name} /${s.maxMarks}]`).join(', ')}"
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  titleBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, paddingTop: 20, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  back: { color: Colors.primary, fontSize: 15 },
  title: { color: Colors.textPrimary, fontSize: 17, fontWeight: '700' },
  saveBtn: { color: Colors.primary, fontSize: 15, fontWeight: '800' },
  content: { padding: 16, paddingBottom: 60 },
  label: { fontSize: 10, color: Colors.textMuted, letterSpacing: 2, marginBottom: 8 },
  hint: { fontSize: 12, color: Colors.textSecondary, marginBottom: 16 },
  input: {
    backgroundColor: Colors.surface, borderRadius: 10, borderWidth: 1,
    borderColor: Colors.border, padding: 13, color: Colors.textPrimary,
    fontSize: 15, marginBottom: 6,
  },
  subjectRow: { marginBottom: 14 },
  subjectInput: { marginBottom: 6 },
  indexCircle: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.primaryDark,
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  indexText: { color: '#FFF', fontSize: 11, fontWeight: '800' },
  markPicker: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  markChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8,
    backgroundColor: Colors.surfaceAlt, borderWidth: 1, borderColor: Colors.border,
  },
  markChipActive: { backgroundColor: Colors.primaryDark, borderColor: Colors.primary },
  markChipText: { color: Colors.textSecondary, fontWeight: '600', fontSize: 13 },
  markChipTextActive: { color: '#FFF' },
  removeBtn: { alignSelf: 'flex-end' },
  removeBtnText: { color: Colors.error, fontSize: 18, padding: 4 },
  addBtn: {
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: Colors.primary,
    borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 8,
  },
  addBtnText: { color: Colors.primary, fontWeight: '700', letterSpacing: 1 },
  preview: {
    backgroundColor: Colors.surfaceAlt, borderRadius: 10, padding: 14,
    marginTop: 24, borderLeftWidth: 3, borderLeftColor: Colors.primary,
  },
  previewLabel: { fontSize: 9, color: Colors.textMuted, letterSpacing: 2, marginBottom: 8 },
  previewText: { color: Colors.textSecondary, fontSize: 12, lineHeight: 20 },
});
