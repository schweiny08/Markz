import Tts from 'react-native-tts';

let initialized = false;

async function init() {
  if (initialized) { return; }
  try {
    await Tts.setDefaultRate(0.48);
    await Tts.setDefaultPitch(1.0);
    await Tts.setDefaultLanguage('en-IN');
    initialized = true;
  } catch {
    // Fallback to system default language
    await Tts.setDefaultRate(0.48);
    initialized = true;
  }
}

export async function speak(text: string): Promise<void> {
  await init();
  return new Promise((resolve) => {
    Tts.stop();
    // react-native-tts v4 returns void from addEventListener; use removeEventListener to clean up
    const handler = () => {
      Tts.removeEventListener('tts-finish', handler);
      resolve();
    };
    Tts.addEventListener('tts-finish', handler);
    Tts.speak(text);
  });
}

export function speakAsync(text: string): void {
  init().then(() => {
    Tts.stop();
    Tts.speak(text);
  });
}

export function stop(): void {
  Tts.stop();
}
