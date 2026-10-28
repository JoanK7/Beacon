'use client';

// "Listen" button: reads text aloud with the browser's built-in speech engine
// (Web Speech API). Supports learners who prefer listening to reading, with no
// audio files to download on slow connections. Hidden where it isn't supported.
import { useEffect, useState, useSyncExternalStore } from 'react';
import { Square, Volume2 } from 'lucide-react';
import { cx } from './ui';

const noopSubscribe = () => () => {};
const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

/** Pick a clear English voice if the device has one (en-GB first, then any English). */
function pickVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  return voices.find((v) => v.lang === 'en-GB') ?? voices.find((v) => v.lang.startsWith('en'));
}

/** Strip the light markup used in module text (bullets, bold markers) so it reads naturally. */
function toSpeech(text: string): string {
  return text
    .replace(/^\s*-\s+/gm, '')
    .replace(/\*\*/g, '')
    .replace(/\s*\n+\s*/g, '. ')
    .replace(/\.\s*\./g, '.');
}

interface ListenButtonProps {
  text: string;
  /** Accessible name, e.g. "Listen to this section". */
  label?: string;
  className?: string;
  compact?: boolean;
}

export function ListenButton({ text, label = 'Listen', className, compact = false }: ListenButtonProps) {
  const supported = useSyncExternalStore(noopSubscribe, canSpeak, () => false);
  const [speaking, setSpeaking] = useState(false);

  // Stop talking when the button goes away (e.g. navigating to another page).
  useEffect(() => () => {
    if (canSpeak()) window.speechSynthesis.cancel();
  }, []);

  if (!supported) return null;

  function toggle() {
    const synth = window.speechSynthesis;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    synth.cancel(); // only one voice at a time across the page
    const utterance = new SpeechSynthesisUtterance(toSpeech(text));
    const voice = pickVoice();
    if (voice) utterance.voice = voice;
    utterance.rate = 0.95;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    synth.speak(utterance);
  }

  const Icon = speaking ? Square : Volume2;
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={speaking}
      aria-label={speaking ? 'Stop reading aloud' : label}
      title={speaking ? 'Stop' : label}
      className={cx(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full font-bold text-brand-700 ring-1 ring-inset ring-brand-200 transition hover:bg-brand-50',
        compact ? 'size-9 justify-center' : 'min-h-9 px-3 text-xs',
        speaking && 'bg-brand-50',
        className,
      )}
    >
      <Icon className="size-4" aria-hidden />
      {!compact && (speaking ? 'Stop' : 'Listen')}
    </button>
  );
}
