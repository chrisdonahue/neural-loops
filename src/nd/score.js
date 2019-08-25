window.neuraldaw = window.neuraldaw || {};

(function (mm, nd) {
  
  const TRIO_CKPT = 'https://storage.googleapis.com/magentadata/js/checkpoints/music_vae/trio_4bar';
  const HUMANIZE_CKPT = 'https://storage.googleapis.com/magentadata/js/checkpoints/music_vae/groovae_unquantize_4bar';
  const Instruments = nd.constants.Instruments;
  const AllInstruments = nd.constants.AllInstruments;
  
  const mvaeTrio = new mm.MusicVAE(TRIO_CKPT);
  const mvaeGroove = new mm.MusicVAE(HUMANIZE_CKPT);
  
  async function generateTrio(temperature, stepsPerQuarter, qpm, humanize) {
    const trio = (await mvaeTrio.sample(1, temperature, undefined, stepsPerQuarter, qpm))[0];

    /*
    const z = (await mvaeGroove.encode([trio]));
    const trioHuman = (await mvaeGroove.decode(z, temperature, undefined, stepsPerQuarter, qpm))[0];
    z.dispose();
    */
    
    return trio;
  }
  
  async function updateTrioInstruments(oldTrio, updateInstruments, temperature, stepsPerQuarter, qpm) {
    if (updateInstruments.length === 0) {
      return oldTrio;
    }
    
    const z = await mvaeTrio.encode([oldTrio]);
    const newTrio = (await mvaeTrio.decode(z, temperature, undefined, stepsPerQuarter, qpm))[0];
    z.dispose();

    const oldNotes = oldTrio.notes;
    const newNotes = newTrio.notes;
    
    const mergedNotes = [];    
    for (let i = 0; i < AllInstruments.length; ++i) {
      const ins = AllInstruments[i];
      const update = updateInstruments.indexOf(ins) >= 0;
      const noteSource = update ? newNotes : oldNotes;
      for (let j = 0; j < noteSource.length; ++j) {
        const note = noteSource[j];
        if (ins === Instruments.MLDY && note.instrument === 0) {
          mergedNotes.push(note);
        } else if (ins === Instruments.BASS && note.instrument === 1) {
          mergedNotes.push(note);
        } else if (note.instrument === 2) {
          if (ins === nd.constants.MidiPitchToDrumInstrument[note.pitch]) {
            mergedNotes.push(note);
          }
        }
      }
    }
    
    // TODO(chrisdonahue): Sort notes
    
    newTrio.notes = mergedNotes;
    
    return newTrio;
  }
  
  // Exports
  nd.score = {}
  nd.score.generateTrio = generateTrio;
  nd.score.updateTrioInstruments = updateTrioInstruments;
  
})(window.mm, window.neuraldaw);