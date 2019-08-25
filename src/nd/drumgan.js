window.drumgan = window.drumgan || {};

(function (tf, dg) {
  
  const FS = 22050;
  const Z_DIM = 50;
  const C_DIM = 8;
  
  const DrumInstruments = {
    KICK: 0,
    SNARE: 1,
    CHAT: 2,
    OHAT: 3,
    TOM: 4,
    CRASH: 5,
    RIDE: 6,
    CLAP: 7
  };
  
  const DrumGAN = function (checkpointURI) {
    this.initialized = false;
    this.checkpointURI = checkpointURI;
  };
  
  DrumGAN.prototype.initialize = async function () {
    if (this.initialized) {
      this.dispose();
    }

    if (this.checkpointURI === undefined) {
      throw new Error('Need to specify checkpoint URI');
    }

    const vars = await fetch(`${this.checkpointURI}/weights_manifest.json`)
      .then((response) => response.json())
      .then(
        (manifest) =>
          tf.io.loadWeights(manifest, this.checkpointURI));
    this.modelVars = vars;

    this.initialized = true;
  };
  
  DrumGAN.prototype.sampleLatentVector = async function (batchSize, seed) {
    //const backend = tf.getBackend();
    //tf.setBackend('cpu');
    
    const z = tf.randomUniform([batchSize, Z_DIM], -1., 1., 'float32', seed);
    const _z = await z.data();
    z.dispose();
    
    //tf.setBackend(backend);
    
    const _zs = [];
    for (let i = 0; i < batchSize; ++i) {
      _zs.push(_z.slice(i * Z_DIM, (i + 1) * Z_DIM));
    }
    
    return _zs;
  };
  
  const conv1dTranspose = function (x, filter, stride) {
    const batchSize = x.shape[0];
    const numSamps = x.shape[1];
    const numCh = filter.shape[2];
    
    x = tf.expandDims(x, 1);
    x = tf.conv2dTranspose(
      x,
      filter,
      [batchSize, 1, numSamps * stride, numCh],
      [1, stride],
      'same');
    x = tf.squeeze(x, 1);
    
    return x;
  };
  
  DrumGAN.prototype.generate = async function (cs, zs) {
    if (zs.length !== cs.length) {
      throw new Error('Array of latent vectors must be same length as array of drum IDs');
    }
    
    const batchSize = zs.length;
    
    const waveforms = tf.tidy(() => {
      const z = tf.tensor2d(zs, [batchSize, Z_DIM], 'float32');

      const c = tf.tensor1d(cs, 'int32');
      const coh = tf.oneHot(c, C_DIM);
      
      // Concat c and z
      let x = tf.concat([coh, z], 1);
      
      // Dense
      x = tf.matMul(x, this.modelVars['G/z_project/dense/kernel']);
      x = tf.add(x, this.modelVars['G/z_project/dense/bias']);
      x = tf.relu(x);
      
      // Convolve input
      x = tf.reshape(x, [batchSize, 16, -1]);
      
      // Convolve
      x = conv1dTranspose(x, this.modelVars['G/upconv_0/conv2d_transpose/kernel'], 4);
      x = tf.add(x, this.modelVars['G/upconv_0/conv2d_transpose/bias']);
      x = tf.relu(x);

      x = conv1dTranspose(x, this.modelVars['G/upconv_1/conv2d_transpose/kernel'], 4);
      x = tf.add(x, this.modelVars['G/upconv_1/conv2d_transpose/bias']);
      x = tf.relu(x);

      x = conv1dTranspose(x, this.modelVars['G/upconv_2/conv2d_transpose/kernel'], 4);
      x = tf.add(x, this.modelVars['G/upconv_2/conv2d_transpose/bias']);
      x = tf.relu(x);
      
      x = conv1dTranspose(x, this.modelVars['G/upconv_3/conv2d_transpose/kernel'], 4);
      x = tf.add(x, this.modelVars['G/upconv_3/conv2d_transpose/bias']);
      x = tf.relu(x);
      
      x = conv1dTranspose(x, this.modelVars['G/upconv_4/conv2d_transpose/kernel'], 4);
      x = tf.add(x, this.modelVars['G/upconv_4/conv2d_transpose/bias']);
      x = tf.relu(x);
      
      x = conv1dTranspose(x, this.modelVars['G/upconv_5/conv2d_transpose/kernel'], 2);
      x = tf.add(x, this.modelVars['G/upconv_5/conv2d_transpose/bias']);
      x = tf.tanh(x);
      
      // Post process
      x = tf.conv1d(x, this.modelVars['G/pp_filt/conv1d/kernel'], 1, 'same');
      
      return x;
    });
    
    const _waveforms = await waveforms.data();
    waveforms.dispose();
    
    const waveformArrs = [];
    for (let i = 0; i < batchSize; ++i) {
      waveformArrs.push(_waveforms.slice(i * 32768, (i + 1) * 32768));
    }
    
    return waveformArrs;
  };
  
  DrumGAN.prototype.dispose = function () {
    if (!this.initialized) {
      return;
    }
    Object.keys(this.modelVars).forEach(
      name => this.modelVars[name].dispose());
    this.initialized = false;
  };

  // Exports
  dg.DrumGAN = DrumGAN;

  
})(window.tf, window.drumgan);