import { Audio } from 'expo-audio';
import * as Speech from 'expo-speech';

// Serviço de áudio para reproduzir sons e síntese de fala

let audioInstance = null;

export const playNotificationSound = async () => {
  try {
    // Som de notificação simples usando Web Audio API (funciona em web)
    if (typeof window !== 'undefined' && window.AudioContext) {
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();

        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        oscillator.frequency.value = 800; // Frequência em Hz
        oscillator.type = 'sine';

        gain.gain.setValueAtTime(0.3, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);

        return true;
      } catch (e) {
        console.warn('Erro ao reproduzir som com Web Audio:', e);
      }
    }

    // Fallback para expo-audio (mobile) - usando som gerado programaticamente
    try {
      // Criar som programaticamente como fallback
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT' }
      );
      await sound.playAsync();
      return true;
    } catch (error) {
      console.warn('Erro ao reproduzir áudio fallback:', error);
      return false;
    }
  } catch (error) {
    console.warn('Erro ao reproduzir som:', error);
    return false;
  }
};

export const playWarningSound = async () => {
  try {
    if (typeof window !== 'undefined' && window.AudioContext) {
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();

        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        // Dois beeps
        const now = audioContext.currentTime;
        oscillator.frequency.setValueAtTime(600, now);
        oscillator.frequency.setValueAtTime(1000, now + 0.2);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        gain.gain.setValueAtTime(0.3, now + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

        oscillator.start(now);
        oscillator.stop(now + 0.6);

        return true;
      } catch (e) {
        console.warn('Erro ao reproduzir aviso sonoro:', e);
      }
    }
    return false;
  } catch (error) {
    console.warn('Erro ao tocar aviso:', error);
    return false;
  }
};

export const speak = async (text, language = 'pt-BR') => {
  try {
    await Speech.speak(text, {
      language: language,
      pitch: 1.0,
      rate: 0.9,
    });
    return true;
  } catch (error) {
    console.warn('Erro ao sintetizar fala:', error);
    return false;
  }
};

export const stopSpeech = async () => {
  try {
    await Speech.stop();
  } catch (error) {
    console.warn('Erro ao parar síntese:', error);
  }
};
