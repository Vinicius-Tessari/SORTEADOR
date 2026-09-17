(function (global) {
  "use strict";

  function scheduleChime(audioContext, startAt = audioContext.currentTime) {
    const notes = [523.25, 659.25, 783.99];
    const noteSpacing = 0.34;
    const noteDuration = 0.72;

    notes.forEach((frequency, index) => {
      const noteStart = startAt + index * noteSpacing;
      const noteEnd = noteStart + noteDuration;
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, noteStart);
      gain.gain.setValueAtTime(0.0001, noteStart);
      gain.gain.exponentialRampToValueAtTime(0.085, noteStart + 0.045);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteEnd);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(noteStart);
      oscillator.stop(noteEnd);
    });

    return startAt + (notes.length - 1) * noteSpacing + noteDuration;
  }

  function createAlarm(environment = global) {
    let audioContext = null;

    function getContext() {
      const AudioContextClass = environment.AudioContext || environment.webkitAudioContext;
      if (!AudioContextClass) return null;
      if (!audioContext || audioContext.state === "closed") audioContext = new AudioContextClass();
      return audioContext;
    }

    function arm() {
      const context = getContext();
      if (!context) return false;
      if (context.state === "suspended") context.resume().catch(() => {});
      return true;
    }

    function play() {
      const context = getContext();
      if (!context) return false;
      const sound = () => scheduleChime(context);
      if (context.state === "suspended") context.resume().then(sound).catch(() => {});
      else sound();
      return true;
    }

    return { arm, play };
  }

  const api = { scheduleChime, createAlarm };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  global.PresentationAlarm = api;
})(typeof window !== "undefined" ? window : globalThis);
