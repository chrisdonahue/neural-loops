window.neuraldaw = window.neuraldaw || {};

(function (tf, mm, dg, nd) {
  
  const DRUMGAN_FS = 22050;
  const TONEGAN_FS = 16000;
  
  //const DRUMGAN_Z_DIM = 50;
  const TONEGAN_Z_DIM = 256;
  
  const DRUMGAN_CKPT = 'https://cdn.glitch.com/4437fe19-97b4-4470-a9cf-94e3543ccbac';
  const TONEGAN_CKPT = 'https://storage.googleapis.com/magentadata/js/checkpoints/gansynth/acoustic_only';
  
  const MVAE_ID_TO_DRUMGAN_ID = {
    2: 0,
    3: 1,
    4: 2,
    5: 3,
    6: 4,
    7: 4,
    8: 4,
    9: 5,
    10: 6,
    11: 7
  };
  
  const Instruments = nd.constants.Instruments;
  const AllInstruments = nd.constants.AllInstruments;
  
  const tonegan = new mm.GANSynth(TONEGAN_CKPT);
  const drumgan = new dg.DrumGAN(DRUMGAN_CKPT);
  
  function arraysToBuffers(x, sampleRate, ctx) {
    const buffers = [];
    for (let i = 0; i < x.length; ++i) {
      const array = x[i];
      const buffer = ctx.createBuffer(1, array.length, sampleRate);
      const ch = buffer.getChannelData(0);
      for (let j = 0; j < array.length; ++j) {
        ch[j] = array[j];
      }
      buffers.push(buffer);
    }
    return buffers;
  }
  
  async function initTone() {
    console.log('init');
    await tonegan.initialize();
  }
  
  async function generateToneLatentVectors(batchSize, seed) {
    //const backend = tf.getBackend();
    //tf.setBackend('cpu');
    
    const z = tf.randomNormal([batchSize, TONEGAN_Z_DIM], 0., 1., 'float32', seed);
    const _z = await z.data();
    z.dispose();
    
    //tf.setBackend(backend);
    
    const _zs = [];
    for (let i = 0; i < batchSize; ++i) {
      _zs.push(_z.slice(i * TONEGAN_Z_DIM, (i + 1) * TONEGAN_Z_DIM));
    }
    
    return _zs;
  }
  
  async function generateTones(midiPitches, ctx, zs, seed) {
    // TODO: Check that midiPitches is a list and that it contains valid MIDI range [24, 84]
    
    if (!tonegan.isInitialized()) {
      throw 'Call initTone first';
    }
    
    const batchSize = midiPitches.length;
    
    if (zs === undefined) {
      zs = await generateToneLatentVectors(1, seed);
    }
    
    const specgrams = tonegan.oneTimbreMultiplePitches(zs[0], midiPitches);
    const waveforms = [];
    for (let i = 0; i < midiPitches.length; ++i) {
      waveforms.push(await tonegan.specgramsToAudio(specgrams, i));
    }
    specgrams.dispose();
    
    const buffers = arraysToBuffers(waveforms, TONEGAN_FS, ctx);
    return buffers;
  }
  
  async function initDrum() {
    await drumgan.initialize();
  }
  
  async function generateDrumLatentVectors(batchSize, seed) {
    return await drumgan.sampleLatentVector(batchSize, seed);
  }
  
  async function generateDrums(drumIds, ctx, zs, seed) {
    const batchSize = drumIds.length;
    
    const cs = [];
    for (let i = 0; i < batchSize; ++i) {
      cs.push(MVAE_ID_TO_DRUMGAN_ID[drumIds[i]]);
    }
    
    if (zs === undefined) {
      zs = await generateDrumLatentVectors(batchSize, seed);
    }
    
    const waveforms = await drumgan.generate(cs, zs);
    
    const buffers = arraysToBuffers(waveforms, DRUMGAN_FS, ctx);
    return buffers;
  }
  
  async function generateDrumKit(ctx, z, seed) {
    return await generateDrums(nd.constants.DrumInstruments, ctx, z, seed);
  }

  // Exports
  nd.timbre = {};
  nd.timbre.initTone = initTone;
  nd.timbre.generateToneLatentVectors = generateToneLatentVectors;
  nd.timbre.generateTones = generateTones;
  nd.timbre.initDrum = initDrum;
  nd.timbre.generateDrumLatentVectors = generateDrumLatentVectors;
  nd.timbre.generateDrums = generateDrums;
  nd.timbre.generateDrumKit = generateDrumKit;

  
})(window.tf, window.mm, window.drumgan, window.neuraldaw);