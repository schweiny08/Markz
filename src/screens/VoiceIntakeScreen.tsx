import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Alert, PermissionsAndroid, Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../constants/colors';
import { useApp } from '../context/AppContext';
import { StudentRecord, TestSession } from '../types';
import { computeRecord, buildTTSResult, validateMark } from '../services/GradeService';
import { parseVoiceInput } from '../services/NumberParser';
import * as Voice from '../services/VoiceService';
import { speakAsync, speak, stop as stopTTS } from '../services/TTSService';
import WaveformVisualizer from '../components/WaveformVisualizer';
import GradeBadge from '../components/GradeBadge';
import { getGradeInfo } from '../constants/grades';
import { RootStackParamList } from '../../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'VoiceIntake'>;

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }

type SessionStatus = 'idle' | 'listening' | 'processing' | 'done';

export default function VoiceIntakeScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { template } = route.params;
  const { startSession, saveRecord } = useApp();

  const [status, setStatus] = useState<SessionStatus>('idle');
  const [isListening, setIsListening] = useState(false);
  const [currentRoll, setCurrentRoll] = useState(1);
  const [pendingMarks, setPendingMarks] = useState<(number | null)[]>([]);
  const [records, setRecords] = useState<StudentRecord[]>([]);
  const [lastMessage, setLastMessage] = useState('Say "Roll 1" to begin');
  const [rawTranscript, setRawTranscript] = useState('');

  const sessionRef = useRef<TestSession | null>(null);
  const statusRef = useRef<SessionStatus>('idle');
  const rollRef = useRef(1);
  const pendingRef = useRef<(number | null)[]>([]);

  // Keep refs in sync
  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => { rollRef.current = currentRoll; }, [currentRoll]);
  useEffect(() => { pendingRef.current = pendingMarks; }, [pendingMarks]);

  // ── Audio restart loop ─────────────────────────────────────────────────────
  const restartListening = useCallback(async () => {
    if (statusRef.current === 'done') { return; }
    await Voice.stopListening();
    setTimeout(async () => {
      if (statusRef.current !== 'done') {
        await Voice.startListening();
      }
    }, 400);
  }, []);

  // ── Voice result handler ───────────────────────────────────────────────────
  const handleResult = useCallback(async (text: string) => {
    setRawTranscript(text);
    const cmd = parseVoiceInput(text);

    if (cmd.type === 'DONE') {
      setStatus('done');
      statusRef.current = 'done';
      await Voice.stopListening();
      setLastMessage('Session complete. Tap "View Results" to review.');
      speakAsync('Session complete.');
      return;
    }

    if (cmd.type === 'CORRECT') {
      setPendingMarks([]);
      pendingRef.current = [];
      const msg = `Roll ${rollRef.current} cleared. Ready for input.`;
      setLastMessage(msg);
      speakAsync(msg);
      await restartListening();
      return;
    }

    if (cmd.type === 'ROLL') {
      rollRef.current = cmd.rollNumber;
      setCurrentRoll(cmd.rollNumber);
      setPendingMarks([]);
      pendingRef.current = [];
      const msg = `Roll ${cmd.rollNumber}`;
      setLastMessage(msg);
      speakAsync(msg);
      await restartListening();
      return;
    }

    if (cmd.type === 'MARKS') {
      setStatus('processing');
      const subjects = template.subjects;
      const current = pendingRef.current;
      const newMarks = [...current, ...cmd.values];

      // Validate each incoming mark
      for (let i = 0; i < cmd.values.length; i++) {
        const val = cmd.values[i];
        if (val !== null) {
          const subjectIdx = current.length + i;
          const subject = subjects[subjectIdx];
          if (subject) {
            const err = validateMark(val, subject);
            if (err) {
              speakAsync(err);
              setLastMessage(err);
              setStatus('listening');
              await restartListening();
              return;
            }
          }
        }
      }

      setPendingMarks(newMarks);
      pendingRef.current = newMarks;

      // Announce which subjects are still pending
      if (newMarks.length < subjects.length) {
        const nextSubject = subjects[newMarks.length];
        const msg = `${nextSubject?.name}?`;
        setLastMessage(msg);
        speakAsync(msg);
        setStatus('listening');
        await restartListening();
        return;
      }

      // All marks received — compute and save
      const record = computeRecord(
        uid(),
        sessionRef.current!.id,
        rollRef.current,
        newMarks.slice(0, subjects.length),
        subjects,
      );

      await saveRecord(record);
      setRecords(prev => [...prev, record]);

      const msg = buildTTSResult(record);
      setLastMessage(msg);

      // Advance to next roll
      const nextRoll = rollRef.current + 1;
      rollRef.current = nextRoll;
      setCurrentRoll(nextRoll);
      setPendingMarks([]);
      pendingRef.current = [];

      await speak(msg);
      setStatus('listening');
      await restartListening();
      return;
    }

    // UNKNOWN — just restart
    await restartListening();
  }, [template.subjects, saveRecord, restartListening]);

  // ── Init ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    const session: TestSession = {
      id: uid(),
      templateId: template.id,
      templateName: template.name,
      subjects: template.subjects,
      createdAt: Date.now(),
    };
    sessionRef.current = session;
    startSession(session);

    Voice.setCallbacks(
      handleResult,
      (err) => { console.warn('Voice error:', err); restartListening(); },
      setIsListening,
    );

    return () => { Voice.destroy(); stopTTS(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestMicAndStart = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'Markz Voice needs microphone access to record marks.',
          buttonPositive: 'Allow',
        },
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert('Microphone permission denied.');
        return;
      }
    }
    setStatus('listening');
    await Voice.startListening();
    speakAsync('Ready. Say Roll 1 to begin.');
    setLastMessage('Listening…');
  };

  const onFinish = () => {
    setStatus('done');
    Voice.stopListening();
    stopTTS();
    nav.navigate('Results', {
      sessionId: sessionRef.current!.id,
      title: template.name,
    });
  };

  const expectedSubject =
    template.subjects[pendingMarks.length]?.name ?? '—';

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          Voice.stopListening(); stopTTS();
          nav.goBack();
        }}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.templateName}>{template.name}</Text>
          <Text style={styles.subjects}>
            {template.subjects.map(s => s.name).join(' › ')}
          </Text>
        </View>
        <TouchableOpacity onPress={onFinish}>
          <Text style={styles.finishBtn}>DONE</Text>
        </TouchableOpacity>
      </View>

      {/* Live status panel */}
      <View style={styles.statusPanel}>
        <View style={styles.rollBadge}>
          <Text style={styles.rollLabel}>ROLL</Text>
          <Text style={styles.rollNumber}>{currentRoll}</Text>
        </View>

        <View style={styles.statusRight}>
          <Text style={styles.listeningFor}>
            {isListening ? `Listening for: ${expectedSubject}` : 'Tap mic to start'}
          </Text>
          <Text style={styles.transcript} numberOfLines={2}>{rawTranscript}</Text>
        </View>
      </View>

      {/* Waveform */}
      <View style={styles.waveContainer}>
        <WaveformVisualizer active={isListening} />
        <Text style={[styles.statusLabel, { color: isListening ? Colors.listening : Colors.textMuted }]}>
          {isListening ? '● LISTENING' : status === 'processing' ? '◌ PROCESSING' : '○ IDLE'}
        </Text>
      </View>

      {/* TTS feedback message */}
      <View style={styles.messageBox}>
        <Text style={styles.message}>{lastMessage}</Text>
      </View>

      {/* Current row progress */}
      {status !== 'idle' && (
        <View style={styles.progressRow}>
          {template.subjects.map((s, i) => {
            const mark = pendingMarks[i];
            const filled = i < pendingMarks.length;
            return (
              <View key={s.id} style={[styles.slotCard, filled && styles.slotFilled, i === pendingMarks.length && styles.slotActive]}>
                <Text style={styles.slotSubject}>{s.name}</Text>
                <Text style={styles.slotMark}>
                  {filled ? (mark === null ? 'AB' : String(mark)) : '—'}
                </Text>
                <Text style={styles.slotMax}>/{s.maxMarks}</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Entered records */}
      <ScrollView style={styles.recordsScroll} contentContainerStyle={{ paddingBottom: 120 }}>
        {records.length > 0 && (
          <Text style={styles.recordsLabel}>ENTERED RECORDS ({records.length})</Text>
        )}
        {records.map(r => {
          const info = getGradeInfo(r.percentage);
          return (
            <View key={r.id} style={[styles.recordRow, { borderLeftColor: info.bgColor }]}>
              <Text style={styles.recordRoll}>Roll {r.rollNumber}</Text>
              <View style={styles.recordMarks}>
                {r.marks.map((m, i) => (
                  <Text key={i} style={styles.recordMarkVal}>
                    {m === null ? 'AB' : m}
                  </Text>
                ))}
              </View>
              <Text style={styles.recordTotal}>{r.totalMarks} · {r.percentage.toFixed(1)}%</Text>
              <GradeBadge grade={r.grade} percentage={r.percentage} size="sm" />
            </View>
          );
        })}
      </ScrollView>

      {/* Start / Mic button */}
      {status === 'idle' && (
        <TouchableOpacity style={styles.micBtn} onPress={requestMicAndStart}>
          <Text style={styles.micBtnText}>🎤  START VOICE SESSION</Text>
        </TouchableOpacity>
      )}
      {status === 'done' && (
        <TouchableOpacity style={styles.viewBtn} onPress={onFinish}>
          <Text style={styles.viewBtnText}>VIEW RESULTS</Text>
        </TouchableOpacity>
      )}

      {/* Manual correction strip */}
      {status === 'listening' && (
        <View style={styles.commandStrip}>
          <TouchableOpacity
            style={styles.cmdBtn}
            onPress={() => handleResult('correction')}
          >
            <Text style={styles.cmdBtnText}>CLEAR ROW</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cmdBtn}
            onPress={() => handleResult('done')}
          >
            <Text style={styles.cmdBtnText}>FINISH</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14, paddingTop: 20, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  back: { color: Colors.primary, fontSize: 14 },
  headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  templateName: { color: Colors.textPrimary, fontSize: 15, fontWeight: '700' },
  subjects: { color: Colors.textMuted, fontSize: 10, marginTop: 2 },
  finishBtn: { color: Colors.accent, fontWeight: '800', fontSize: 13 },
  statusPanel: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, padding: 14, margin: 12,
    borderRadius: 12, borderWidth: 1, borderColor: Colors.border, gap: 14,
  },
  rollBadge: { alignItems: 'center' },
  rollLabel: { fontSize: 9, color: Colors.textMuted, letterSpacing: 2 },
  rollNumber: { fontSize: 40, fontWeight: '900', color: Colors.primary, lineHeight: 44 },
  statusRight: { flex: 1 },
  listeningFor: { color: Colors.textPrimary, fontSize: 15, fontWeight: '600' },
  transcript: { color: Colors.textMuted, fontSize: 11, marginTop: 4, fontStyle: 'italic' },
  waveContainer: { alignItems: 'center', paddingVertical: 8 },
  statusLabel: { fontSize: 10, letterSpacing: 2, marginTop: 4, fontWeight: '700' },
  messageBox: {
    backgroundColor: Colors.surfaceAlt, marginHorizontal: 12,
    borderRadius: 10, padding: 12, minHeight: 48, justifyContent: 'center',
  },
  message: { color: Colors.textPrimary, fontSize: 16, fontWeight: '600', textAlign: 'center' },
  progressRow: {
    flexDirection: 'row', marginHorizontal: 12, marginTop: 12,
    gap: 6, flexWrap: 'wrap',
  },
  slotCard: {
    flex: 1, minWidth: 60, backgroundColor: Colors.surface, borderRadius: 8,
    padding: 8, alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  slotFilled: { borderColor: Colors.primaryDark, backgroundColor: '#E8F4FD' },
  slotActive: { borderColor: Colors.listening, borderWidth: 2 },
  slotSubject: { fontSize: 9, color: Colors.textMuted, letterSpacing: 0.5 },
  slotMark: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, marginTop: 2 },
  slotMax: { fontSize: 9, color: Colors.textMuted },
  recordsScroll: { flex: 1, marginTop: 12 },
  recordsLabel: { fontSize: 9, color: Colors.textMuted, letterSpacing: 2, paddingHorizontal: 14, marginBottom: 6 },
  recordRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10,
    borderLeftWidth: 3, marginHorizontal: 12, marginBottom: 4,
    backgroundColor: Colors.surface, borderRadius: 8,
  },
  recordRoll: { width: 50, color: Colors.textSecondary, fontSize: 12, fontWeight: '700' },
  recordMarks: { flex: 1, flexDirection: 'row', gap: 8 },
  recordMarkVal: { color: Colors.textPrimary, fontSize: 13, fontWeight: '600', minWidth: 24 },
  recordTotal: { color: Colors.textSecondary, fontSize: 11, marginRight: 8 },
  micBtn: {
    position: 'absolute', bottom: 20, left: 16, right: 16,
    backgroundColor: Colors.listening, borderRadius: 16,
    paddingVertical: 18, alignItems: 'center',
  },
  micBtnText: { color: '#FFFFFF', fontWeight: '900', fontSize: 15, letterSpacing: 1 },
  viewBtn: {
    position: 'absolute', bottom: 20, left: 16, right: 16,
    backgroundColor: Colors.primary, borderRadius: 16,
    paddingVertical: 18, alignItems: 'center',
  },
  viewBtnText: { color: '#FFFFFF', fontWeight: '900', fontSize: 15, letterSpacing: 1 },
  commandStrip: {
    position: 'absolute', bottom: 20, left: 16, right: 16,
    flexDirection: 'row', gap: 10,
  },
  cmdBtn: {
    flex: 1, backgroundColor: Colors.surfaceAlt, borderRadius: 10,
    paddingVertical: 13, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  cmdBtnText: { color: Colors.textSecondary, fontWeight: '700', fontSize: 12, letterSpacing: 1 },
});
