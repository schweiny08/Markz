import Voice, {
  SpeechResultsEvent,
  SpeechErrorEvent,
} from '@react-native-voice/voice';

type ResultCallback = (text: string) => void;
type ErrorCallback = (error: string) => void;
type StateCallback = (listening: boolean) => void;

let resultCb: ResultCallback | null = null;
let errorCb: ErrorCallback | null = null;
let stateCb: StateCallback | null = null;

Voice.onSpeechResults = (e: SpeechResultsEvent) => {
  const text = e.value?.[0] ?? '';
  if (text && resultCb) {
    resultCb(text);
  }
};

Voice.onSpeechError = (e: SpeechErrorEvent) => {
  const msg = e.error?.message ?? 'Voice error';
  // Error code 7 = no match (silence timeout) — just restart, not a real error
  if (e.error?.code !== '7' && errorCb) {
    errorCb(msg);
  }
  stateCb?.(false);
};

Voice.onSpeechStart = () => stateCb?.(true);
Voice.onSpeechEnd = () => stateCb?.(false);

export function setCallbacks(
  onResult: ResultCallback,
  onError: ErrorCallback,
  onStateChange: StateCallback,
) {
  resultCb = onResult;
  errorCb = onError;
  stateCb = onStateChange;
}

export async function startListening(): Promise<void> {
  try {
    await Voice.start('en-IN', {
      // Prefer offline recognition on Android 11+
      EXTRA_PREFER_OFFLINE: true,
      EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 1500,
      EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS: 1000,
    });
  } catch (e) {
    errorCb?.(`Mic error: ${e}`);
  }
}

export async function stopListening(): Promise<void> {
  try {
    await Voice.stop();
  } catch {
    // ignore
  }
}

export async function destroy(): Promise<void> {
  resultCb = null;
  errorCb = null;
  stateCb = null;
  await Voice.destroy();
}
