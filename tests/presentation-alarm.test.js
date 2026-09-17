"use strict";

const assert = require("assert");
const Alarm = require("../presentation-alarm.js");

function createFakeAudioContext() {
  const oscillators = [];
  const gains = [];
  return {
    currentTime: 10,
    destination: {},
    oscillators,
    gains,
    createOscillator() {
      const oscillator = {
        frequency: { setValueAtTime(value, time) { oscillator.frequencyEvent = [value, time]; } },
        connect() {},
        start(time) { this.startedAt = time; },
        stop(time) { this.stoppedAt = time; }
      };
      oscillators.push(oscillator);
      return oscillator;
    },
    createGain() {
      const events = [];
      const gain = {
        gain: {
          setValueAtTime: (value, time) => events.push(["set", value, time]),
          exponentialRampToValueAtTime: (value, time) => events.push(["ramp", value, time])
        },
        events,
        connect() {}
      };
      gains.push(gain);
      return gain;
    }
  };
}

(function schedulesAShortThreeNoteChime() {
  const context = createFakeAudioContext();
  const stopAt = Alarm.scheduleChime(context);
  assert.strictEqual(context.oscillators.length, 3);
  assert.ok(context.oscillators.every(oscillator => oscillator.type === "sine"));
  assert.deepStrictEqual(context.oscillators.map(item => item.frequencyEvent[0]), [523.25, 659.25, 783.99]);
  assert.ok(stopAt > 11 && stopAt < 12);
  assert.ok(context.gains.every(gain => gain.events.length >= 3));
})();

console.log("✓ toque de encerramento validado.");
