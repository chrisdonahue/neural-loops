// import * as mm from '@magenta/music';
const mm = window.mm;
const nd = window.neuraldaw;

export default class NeuralDAW {
  constructor() {
    this.constants = {};
    this.timbre = window.neuraldaw.timbre;
    this.mm = {};
    this.score = {};

    this.initConstants();
    // this.initScore();
    this.initSounds();
  }

  initConstants() {
    const Instruments = {
      MLDY: 0,
      BASS: 1,
      KICK: 2,
      SNAR: 3,
      CHAT: 4,
      OHAT: 5,
      LTOM: 6,
      MTOM: 7,
      HTOM: 8,
      CRSH: 9,
      RIDE: 10
    };

    const ToneInstruments = [Instruments.MLDY, Instruments.BASS];
    const DrumInstruments = [
      Instruments.KICK,
      Instruments.SNAR,
      Instruments.CHAT,
      Instruments.OHAT,
      Instruments.LTOM,
      Instruments.MTOM,
      Instruments.HTOM,
      Instruments.CRSH,
      Instruments.RIDE
    ];

    const AllInstruments = [
      Instruments.MLDY,
      Instruments.BASS,
      Instruments.KICK,
      Instruments.SNAR,
      Instruments.CHAT,
      Instruments.OHAT,
      Instruments.LTOM,
      Instruments.MTOM,
      Instruments.HTOM,
      Instruments.CRSH,
      Instruments.RIDE
    ];

    const MidiPitchToDrumInstrument = {
      36: Instruments.KICK,
      38: Instruments.SNAR,
      42: Instruments.CHAT,
      46: Instruments.OHAT,
      45: Instruments.LTOM,
      48: Instruments.MTOM,
      50: Instruments.HTOM,
      49: Instruments.CRSH,
      51: Instruments.RIDE
    };

    this.constants = {
      Instruments,
      ToneInstruments,
      DrumInstruments,
      AllInstruments,
      MidiPitchToDrumInstrument
    };
  }

  // initScore() {
  //   const MVAE_CKPT =
  //     "https://storage.googleapis.com/magentadata/js/checkpoints/music_vae/trio_4bar";
  //   const mvae = new mm.MusicVAE(MVAE_CKPT);

  //   async function generateTrio(temperature, stepsPerQuarter, qpm) {
  //     return (await mvae.sample(
  //       1,
  //       temperature,
  //       undefined,
  //       stepsPerQuarter,
  //       qpm
  //     ))[0];
  //   }

  //   const updateTrioInstruments = async (
  //     oldTrio,
  //     updateInstruments,
  //     jitterAmt,
  //     temperature,
  //     stepsPerQuarter,
  //     qpm
  //   ) => {
  //     if (updateInstruments.length === 0) {
  //       return oldTrio;
  //     }

  //     let z = await mvae.encode([oldTrio]);

  //     if (jitterAmt !== undefined) {
  //       const zJitter = tf.tidy(() => {
  //         const jitter = tf.randomNormal(z.shape);
  //         const linterp = tf.add(
  //           tf.mul(jitterAmt, jitter),
  //           tf.mul(1 - jitterAmt, z)
  //         );
  //         return linterp;
  //       });
  //       z.dispose();
  //       z = zJitter;
  //     }

  //     const newTrio = (await mvae.decode(
  //       z,
  //       temperature,
  //       undefined,
  //       stepsPerQuarter,
  //       qpm
  //     ))[0];
  //     z.dispose();

  //     const oldNotes = oldTrio.notes;
  //     const newNotes = newTrio.notes;

  //     const mergedNotes = [];
  //     const {
  //       AllInstruments,
  //       Instruments,
  //       MidiPitchToDrumInstrument
  //     } = this.constants;

  //     for (let i = 0; i < AllInstruments.length; ++i) {
  //       const ins = AllInstruments[i];
  //       const update = updateInstruments.indexOf(ins) >= 0;
  //       const noteSource = update ? newNotes : oldNotes;
  //       for (let j = 0; j < noteSource.length; ++j) {
  //         const note = noteSource[j];
  //         if (ins === Instruments.MLDY && note.instrument === 0) {
  //           mergedNotes.push(note);
  //         } else if (ins === Instruments.BASS && note.instrument === 1) {
  //           mergedNotes.push(note);
  //         } else if (note.instrument === 2) {
  //           if (ins === MidiPitchToDrumInstrument[note.pitch]) {
  //             mergedNotes.push(note);
  //           }
  //         }
  //       }
  //     }

  //     // TODO(chrisdonahue): Sort notes

  //     newTrio.notes = mergedNotes;

  //     return newTrio;
  //   };

  //   this.mm = mm;
  //   this.score = {
  //     generateTrio,
  //     updateTrioInstruments
  //   };
  // }

  initSounds() {
    const tone = mm.Player.tone;
    const { Instruments, DrumInstruments } = this.constants;

    const toneMldyReverb = new tone.Freeverb(0.75);
    toneMldyReverb.wet.value = 0;
    toneMldyReverb.connect(tone.Master);

    const MLDY_PITCHES = [24, 36, 48, 60, 72, 84];
    const toneMldy = new tone.Sampler();
    toneMldy.volume.value = -12;
    toneMldy.connect(toneMldyReverb);

    const BASS_PITCHES = [24, 36, 48, 60, 72, 84];
    const toneBass = new tone.Sampler();
    toneBass.volume.value = -12;
    toneBass.toMaster();

    const drumKitReverb = new tone.Freeverb(0.1);
    drumKitReverb.wet.value = 0;
    drumKitReverb.toMaster();

    const reverbInstruments = [
      Instruments.CHAT,
      Instruments.OHAT,
      Instruments.CRSH,
      Instruments.RIDE
    ];

    const drumKit = {};
    for (let i = 0; i < DrumInstruments.length; ++i) {
      const drumId = DrumInstruments[i];
      drumKit[drumId] = new tone.Sampler();
      if (reverbInstruments.indexOf(drumId) >= 0) {
        drumKit[drumId].volume.value = -12;
        drumKit[drumId].connect(drumKitReverb);
      } else {
        drumKit[drumId].volume.value = -12;
        drumKit[drumId].toMaster();
      }
    }

    const replaceTone = async (ctx, id) => {
      const Instruments = this.constants.Instruments;
      let pitches;
      let sampler;
      if (id === Instruments.MLDY) {
        pitches = MLDY_PITCHES;
        sampler = toneMldy;
      } else if (id === Instruments.BASS) {
        pitches = BASS_PITCHES;
        sampler = toneBass;
      } else {
        throw "Invalid instrument ID";
      }

      // const buffers = await this.timbre.generateTones(pitches, ctx);
      const buffers = await nd.timbre.generateTones(pitches, ctx);
      for (let i = 0; i < pitches.length; ++i) {
        sampler.add(tone.Midi(pitches[i]).toNote(), buffers[i]);
      }
    };

    const replaceDrumKit = async ctx => {
      // const buffers = await this.timbre.generateDrumKit(ctx);
      const buffers = await nd.timbre.generateDrumKit(ctx);
      for (let i = 0; i < DrumInstruments.length; ++i) {
        const drumId = DrumInstruments[i];
        drumKit[drumId].add(tone.Midi(60).toNote(), buffers[i]);
      }
    };

    const replaceDrum = async (ctx, drumId) => {
      // const buffers = await this.timbre.generateDrums([drumId], ctx);
      const buffers = await nd.timbre.generateDrums([drumId], ctx);
      drumKit[drumId].add(tone.Midi(60).toNote(), buffers[0]);
    };

    const stopAll = () => {
      toneMldy.releaseAll();
      toneBass.releaseAll();
      for (let i = 0; i < DrumInstruments.length; ++i) {
        const drumId = DrumInstruments[i];
        drumKit[drumId].releaseAll();
      }
    };

    const setReverb = reverb => {
      toneMldyReverb.wet.value = reverb;
      drumKitReverb.wet.value = reverb;
    };

    this.sounds = {
      drumKit,
      toneMldy,
      toneBass,
      replaceTone,
      replaceDrumKit,
      replaceDrum,
      stopAll,
      setReverb
    };
  }

  playNote(instrument, note, duration, time) {
    const tone = mm.Player.tone;
    const { toneMldy, toneBass, drumKit } = this.sounds;

    if (instrument === this.constants.Instruments.MLDY) {
      toneMldy.triggerAttackRelease(
        tone.Midi(note.pitch).toNote(),
        duration,
        time
      );
    } else if (instrument === this.constants.Instruments.BASS) {
      toneBass.triggerAttackRelease(
        tone.Midi(note.pitch).toNote(),
        duration,
        time
      );
    } else {
      drumKit[instrument].triggerAttackRelease(
        tone.Midi(60).toNote(),
        duration,
        time
      );
    }
  }
}
