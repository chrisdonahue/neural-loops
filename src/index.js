import StartAudioContext from "startaudiocontext";
import "./index.scss";
import DrumMachine from "./drum-machine";
import MelodyLine from "./melody-line";
import { copyRight } from "./utils";

window.neuraldaw = window.neuraldaw || {};

import "./nd/constants";
import "./nd/drumgan";
import "./nd/timbre";
import "./nd/score";

import NeuralDAW from "./neural-daw";

// const nd = new NeuralDAW();
const _nd = window.neuraldaw;
const nd = new NeuralDAW();
const melodyOne = new MelodyLine("canvas-1");
const melodyTwo = new MelodyLine("canvas-2");
const drumMachine = new DrumMachine("canvas-3", nd);
const tone = window.mm.Player.tone;
const ctx = tone.context;
const { Instruments, DrumInstruments } = nd.constants;
let loading = true;
let seq = {};
let trio = {};
let beatToNotes = {};
let beat = 0;
let sixteenthLengthSeconds = 0;
let swing = 0;
let swingDelaySeconds = 0;
const scoreUpdateJitterAmt = 0.4;

const start = () => {
  const playBtn = document.getElementById("play");
  playBtn.firstChild.textContent = "stop";
  seq.start();
};

const stop = () => {
  const playBtn = document.getElementById("play");
  playBtn.firstChild.textContent = "play";
  seq.stop();
  nd.sounds.stopAll();
};

const resumeTransport = () => {
  tone.Transport.start();
};

const pauseTransport = () => {
  nd.sounds.stopAll();
  tone.Transport.pause();
};

const setBpm = bpm => {
  tone.Transport.bpm.value = bpm;
  sixteenthLengthSeconds = 60 / bpm / 4;
  swingDelaySeconds = swing * sixteenthLengthSeconds;
};

const updateTrio = async newTrioPromise => {
  trio = await newTrioPromise;
  const trioNotes = trio.notes;

  beatToNotes = {};
  for (let i = 0; i < trioNotes.length; ++i) {
    const note = trioNotes[i];
    const s = note.quantizedStartStep % 64;
    if (!(s in beatToNotes)) {
      beatToNotes[s] = [];
    }
    beatToNotes[s].push(note);
  }

  const melodyOneNotes = trioNotes.filter(n => n.instrument === 0);
  const melodyTwoNotes = trioNotes.filter(n => n.instrument === 1);
  const drumNotes = trioNotes.filter(n => n.isDrum);
  melodyOne.updateMelody(melodyOneNotes);
  melodyTwo.updateMelody(melodyTwoNotes);
  drumMachine.updateNotes(drumNotes);
};

const setup = async () => {
  // scores and timbre
  await Promise.all([_nd.timbre.initTone(), _nd.timbre.initDrum()]);
  console.log("(0/2)...loading score and timbres");
  await Promise.all([
    nd.sounds.replaceTone(ctx, Instruments.MLDY),
    nd.sounds.replaceTone(ctx, Instruments.BASS),
    nd.sounds.replaceDrumKit(ctx),
    updateTrio(_nd.score.generateTrio())
  ]);
  console.log("(1/2)...loaded score and timbres");

  // volume and bpm
  setBpm(120);
  tone.Master.volume.value = 20 * Math.log(0.8);

  // sequencer
  seq = new tone.Sequence(
    (time, b) => {
      beat = b;
      // console.log(`b: ${beat}`);

      let notes = [];
      if (beat in beatToNotes) {
        notes = beatToNotes[beat];
      }

      if (b % 2 === 1) {
        time += swingDelaySeconds;
      }

      for (let i = 0; i < notes.length; ++i) {
        const note = notes[i];

        const durationSteps = note.quantizedEndStep - note.quantizedStartStep;
        if (durationSteps <= 0) {
          continue;
        }

        let duration = durationSteps * sixteenthLengthSeconds;
        // TODO: add or subtract swing delay...

        let instrument;
        if (note.instrument === 0) {
          instrument = Instruments.MLDY;
        } else if (note.instrument === 1) {
          instrument = Instruments.BASS;
        } else if (note.instrument === 2) {
          instrument = nd.constants.MidiPitchToDrumInstrument[note.pitch];
        }

        nd.playNote(instrument, note, duration, time);
      }
    },
    Array.from(Array(64).keys()),
    "16n"
  );
  tone.Transport.start();

  // loaded and play
  console.log("(2/2)...the sequencer starts.");

  const playBtn = document.getElementById("play");
  playBtn.firstChild.textContent = "stop";
  loading = false;
  drumMachine.hoveringNotes = Array(9).fill(false);
  melodyOne.hoveringNotes = false;
  melodyTwo.hoveringNotes = false;
  seq.start();
};

const setButtonEvents = () => {
  // play & stop
  const playBtn = document.getElementById("play");
  playBtn.onclick = () => {
    if (!loading) {
      if (seq.state === "started") {
        stop();
      } else {
        start();
      }
    }
  };

  // reload
  document.getElementById("reload").onclick = async () => {
    stop();

    // scores and timbre
    console.log("(0/1)...loading score and timbres");
    drumMachine.waiting = true;
    melodyOne.waiting = true;
    melodyTwo.waiting = true;

    await Promise.all([
      nd.sounds.replaceTone(ctx, Instruments.MLDY),
      nd.sounds.replaceTone(ctx, Instruments.BASS),
      nd.sounds.replaceDrumKit(ctx),
      updateTrio(_nd.score.generateTrio())
    ]);

    console.log("(1/1)...loaded score and timbres");
    drumMachine.waiting = false;
    melodyOne.waiting = false;
    melodyTwo.waiting = false;

    start();
  };
  document.getElementById("reload").onmouseenter = () => {
    melodyOne.hoveringSounds = true;
    melodyTwo.hoveringSounds = true;
    drumMachine.hoveringSounds = Array(9).fill(true);
  };
  document.getElementById("reload").onmouseleave = () => {
    melodyOne.hoveringSounds = false;
    melodyTwo.hoveringSounds = false;
    drumMachine.hoveringSounds = Array(9).fill(false);
  };
  document.getElementById("update-sco-all").onclick = async () => {
    stop();

    // scores and timbre
    console.log("(0/1)...loading score and timbres");
    drumMachine.waiting = true;
    melodyOne.waiting = true;
    melodyTwo.waiting = true;
    await Promise.all([updateTrio(_nd.score.generateTrio())]);
    console.log("(1/1)...loaded score and timbres");
    drumMachine.waiting = false;
    melodyOne.waiting = false;
    melodyTwo.waiting = false;

    start();
  };
  document.getElementById("update-sco-all").onmouseenter = () => {
    melodyOne.hoveringNotes = true;
    melodyTwo.hoveringNotes = true;
    drumMachine.hoveringNotes = Array(9).fill(true);
  };
  document.getElementById("update-sco-all").onmouseleave = () => {
    melodyOne.hoveringNotes = false;
    melodyTwo.hoveringNotes = false;
    drumMachine.hoveringNotes = Array(9).fill(false);
  };

  document.getElementById("update-tim-melody-bass").onclick = async () => {
    stop();

    // scores and timbre
    console.log("(0/1)...loading score and timbres");
    melodyOne.waiting = true;
    melodyTwo.waiting = true;
    await Promise.all([
      nd.sounds.replaceTone(ctx, Instruments.MLDY),
      nd.sounds.replaceTone(ctx, Instruments.BASS)
    ]);
    console.log("(1/1)...loaded score and timbres");
    melodyOne.waiting = false;
    melodyTwo.waiting = false;

    start();
  };
  document.getElementById("update-tim-melody-bass").onmouseenter = () => {
    melodyOne.hoveringSounds = true;
    melodyTwo.hoveringSounds = true;
  };
  document.getElementById("update-tim-melody-bass").onmouseleave = () => {
    melodyOne.hoveringSounds = false;
    melodyTwo.hoveringSounds = false;
  };
  document.getElementById("update-tim-drums").onclick = async () => {
    stop();

    // scores and timbre
    console.log("(0/1)...loading score and timbres");
    drumMachine.waiting = true;
    await Promise.all([nd.sounds.replaceDrumKit(ctx)]);
    console.log("(1/1)...loaded score and timbres");
    drumMachine.waiting = false;

    start();
  };
  document.getElementById("update-tim-drums").onmouseenter = () => {
    drumMachine.hoveringSounds = Array(9).fill(true);
  };
  document.getElementById("update-tim-drums").onmouseleave = () => {
    drumMachine.hoveringSounds = Array(9).fill(false);
  };

  //volume
  document.getElementById("volume").onchange = e => {
    const value = 20 * Math.log(e.target.value * 0.01);
    tone.Master.volume.value = value;
  };

  // bpm
  document.getElementById("bpm").onchange = e => {
    setBpm(e.target.value);
  };

  // swing
  document.getElementById("swing").onchange = e => {
    // Limit swing delay to 32nd note
    swing = 0.5 * (e.target.value / e.target.max);
    swingDelaySeconds = swing * sixteenthLengthSeconds;
  };

  // reverb
  document.getElementById("reverb").onchange = e => {
    const wet = e.target.value / e.target.max;
    nd.sounds.setReverb(wet);
  };

  // melody
  document.getElementById("update-sco-tm").onclick = async () => {
    pauseTransport();
    melodyOne.waiting = true;
    await updateTrio(
      _nd.score.updateTrioInstruments(
        trio,
        [Instruments.MLDY],
        scoreUpdateJitterAmt
      )
    );
    resumeTransport();
    melodyOne.waiting = false;
  };
  document.getElementById("update-sco-tm").onmouseenter = () => {
    melodyOne.hoveringNotes = true;
  };
  document.getElementById("update-sco-tm").onmouseleave = () => {
    melodyOne.hoveringNotes = false;
  };
  document.getElementById("update-tim-tm").onclick = async () => {
    pauseTransport();
    melodyOne.waiting = true;
    await nd.sounds.replaceTone(ctx, Instruments.MLDY);
    resumeTransport();
    melodyOne.waiting = false;
  };
  document.getElementById("update-tim-tm").onmouseenter = () => {
    melodyOne.hoveringSounds = true;
  };
  document.getElementById("update-tim-tm").onmouseleave = () => {
    melodyOne.hoveringSounds = false;
  };

  // bass
  document.getElementById("update-sco-tb").onclick = async () => {
    pauseTransport();
    melodyTwo.waiting = true;
    await _nd.score.updateTrioInstruments(
      trio,
      [Instruments.BASS],
      scoreUpdateJitterAmt
    );
    resumeTransport();
    melodyTwo.waiting = false;
  };
  document.getElementById("update-sco-tb").onmouseenter = () => {
    melodyTwo.hoveringNotes = true;
  };
  document.getElementById("update-sco-tb").onmouseleave = () => {
    melodyTwo.hoveringNotes = false;
  };
  document.getElementById("update-tim-tb").onclick = async () => {
    pauseTransport();
    melodyTwo.waiting = true;
    await nd.sounds.replaceTone(ctx, Instruments.BASS);
    resumeTransport();
    melodyTwo.waiting = false;
  };
  document.getElementById("update-tim-tb").onmouseenter = () => {
    melodyTwo.hoveringSounds = true;
  };
  document.getElementById("update-tim-tb").onmouseleave = () => {
    melodyTwo.hoveringSounds = false;
  };

  // drums
  for (let i = 0; i < DrumInstruments.length; ++i) {
    document.getElementById("update-sco-d" + String(i)).onclick = async () => {
      pauseTransport();
      drumMachine.waiting = true;
      await updateTrio(
        _nd.score.updateTrioInstruments(
          trio,
          [DrumInstruments[i]],
          scoreUpdateJitterAmt
        )
      );
      resumeTransport();
      drumMachine.waiting = false;
    };
    document.getElementById("update-sco-d" + String(i)).onmouseenter = () => {
      drumMachine.hoveringNotes[8 - i] = true;
    };
    document.getElementById("update-sco-d" + String(i)).onmouseleave = () => {
      drumMachine.hoveringNotes[8 - i] = false;
    };
  }
  for (let i = 0; i < DrumInstruments.length; ++i) {
    document.getElementById("update-tim-d" + String(i)).onclick = async () => {
      pauseTransport();
      drumMachine.waiting = true;
      await nd.sounds.replaceDrum(ctx, DrumInstruments[i]);
      resumeTransport();
      drumMachine.waiting = false;
    };
    document.getElementById("update-tim-d" + String(i)).onmouseenter = () => {
      drumMachine.hoveringSounds[8 - i] = true;
    };
    document.getElementById("update-tim-d" + String(i)).onmouseleave = () => {
      drumMachine.hoveringSounds[8 - i] = false;
    };
  }
};

const draw = () => {
  melodyOne.draw(beat);
  melodyTwo.draw(beat);
  drumMachine.draw(beat);
  requestAnimationFrame(() => {
    draw();
  });
};

StartAudioContext(ctx, "#play", () => {
  const playBtn = document.getElementById("play");
  console.log("AudioContext started!");
  console.log("start loading...");
  playBtn.firstChild.textContent = "loading";

  copyRight();
  setup();
  setButtonEvents();
  requestAnimationFrame(() => {
    draw();
  });
});
