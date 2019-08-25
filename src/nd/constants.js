window.neuraldaw = window.neuraldaw || {};

(function (nd) {
  
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
  
  // https://github.com/tensorflow/magenta/blob/master/magenta/music/drums_encoder_decoder.py
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
  
  // Exports
  nd.constants = {};
  nd.constants.Instruments = Instruments;
  nd.constants.AllInstruments = AllInstruments;
  nd.constants.ToneInstruments = ToneInstruments;
  nd.constants.DrumInstruments = DrumInstruments;
  nd.constants.MidiPitchToDrumInstrument = MidiPitchToDrumInstrument;
  
})(window.neuraldaw);