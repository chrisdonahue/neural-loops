import size from 'element-size';
import colors from './palette';


export default class DrumMachine {
	constructor(id, nd) {
    this.id = id;
    this.nd = nd;
		this.notes = [];
		this.ui = {};
    this.loading = true;
    this.waiting = false;

    this.hoveringSounds = Array(9).fill(false);
    this.hoveringNotes = Array(9).fill(true);
  }

  updateNotes(notes) {
    this.loading = false;
    this.notes = notes;
  }

  draw(beat) {
    this.canvas = document.getElementById(this.id);
    const psize = size(this.canvas);
    this.canvas.width = psize[0] | 0;
    this.canvas.height = psize[1] | 0;

    const borderRadius = 5;
    const canvasWidth = this.canvas.width;
    const canvasHeight = this.canvas.height;
    const width = canvasWidth - borderRadius * 2;
    const height = canvasHeight - borderRadius * 2;
    const ctx = this.canvas.getContext('2d');

    ctx.save();

    // background
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.translate(borderRadius, borderRadius * 0.5);

    ctx.save();
    const step = width / 64;
    const thickness = canvasHeight / 9;
    // anchor points
    for (let j = 0; j < 9; j += 1) {
      if (this.hoveringNotes[j]) {
        // hovering notes
        for (let i = 0; i < 64; i += 1) {
          if (i % 4 === 0) {
            ctx.save();
            ctx.fillStyle = colors[6];
            ctx.translate(i * step, (j + 0.25) * thickness);
            if (Math.random() > 0.98) {
              const large = 0.8;
              // ctx.translate(-step * large * 0.25, -step * large * 0.25);
              ctx.fillRect(0, 0, step * large, step * large);
            } else {
              ctx.translate(step * 0.3, step * 0.3);
              ctx.fillRect(0, 0, step * 0.3, step * 0.3);
            }
            ctx.restore();
          }
        }
      } else if (this.hoveringSounds[j]) {
        for (let i = 0; i < 64; i += 1) {
          if (i % 4 === 0) {
            ctx.save();
            ctx.fillStyle = colors[6];
            ctx.translate(i * step, (j + 0.25) * thickness);
            const d = new Date();
            ctx.translate(0, Math.sin(d * 0.005 + i * 0.2 + j * 0.4) * thickness * 0.1);
            const large = 0.3;
            ctx.fillRect(0, 0, step * large, step * large);
            ctx.restore();
          }
        }
      } else {
        // regular
        for (let i = 0; i < 64; i += 1) {
          if (i % 4 === 0) {
            ctx.save();
            ctx.fillStyle = colors[5];
            ctx.translate(i * step, (j + 0.25) * thickness);
            ctx.translate(step * 0.3, step * 0.3);
            ctx.fillRect(0, 0, step * 0.3, step * 0.3);
            ctx.restore();
          }
        }
      }
    }

    if (!this.loading) {
      // notes
      for (let note of this.notes) {
        const { pitch, quantizedStartStep, quantizedEndStep } = note;
        const noteLength = quantizedEndStep - quantizedStartStep;
        const yPosition = this.nd.constants.MidiPitchToDrumInstrument[pitch] - 2;

        ctx.save();

        ctx.translate(quantizedStartStep * step, ((8 - yPosition) + 0.25) * thickness);
        if (!this.waiting) {
          ctx.fillStyle = colors[3];
        } else {
          ctx.fillStyle = colors[5];
        }
        if (quantizedStartStep === beat) {
          // ctx.fillStyle = colors[2];
          ctx.fillStyle = colors[6];
          ctx.translate(step * -0.3, step * -0.3);
          ctx.fillRect(0, 0, step * 1.5, step * 1.5);
        } else {
          ctx.fillRect(0, 0, step * 0.9, step * 0.9);
        }

        ctx.restore();
      }

    }

    ctx.restore();
    ctx.restore();
  }


}
