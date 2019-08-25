import colors from './palette';
import size from 'element-size';


export default class MelodyLine {
  constructor(id) {
    this.id = id;
    this.melody = [];
    this.loading = true;
    this.currentPosition = 0;
    this.canvas = document.getElementById(this.id);

    this.hoveringNotes = true;
    this.hoveringSounds = false;
    this.waiting = false;
  }

  updateMelody(m) {
    this.loading = false;
    this.melody = m;
    // console.log(m);
  }

  draw(beat) {
    // fit the size
    this.canvas = document.getElementById(this.id);
    const psize = size(this.canvas);
    this.canvas.width = psize[0]|0;
    this.canvas.height = psize[1]|0;

    const borderRadius = 5;
    const canvasWidth = this.canvas.width;
    const canvasHeight = this.canvas.height;
    const width = canvasWidth - borderRadius * 2;
    const height = canvasHeight - borderRadius * 2;
    const ctx = this.canvas.getContext('2d');


    ctx.save();

    // background
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.translate(borderRadius, borderRadius);
    this.drawAnchorPoints(ctx, width, height, width / 16);

    if (!this.loading) {
      ctx.save();

      const step = width / 64;
      const thickness = height / 64;

      for (let note of this.melody) {
        const { pitch, quantizedStartStep, quantizedEndStep } = note;
        const noteLength = quantizedEndStep - quantizedStartStep;

        ctx.save();

        ctx.translate(quantizedStartStep * step, (64 - (pitch - 28)) * thickness);
        if (!this.waiting) {
          ctx.fillStyle = colors[3];
        } else {
          ctx.fillStyle = colors[5];
        }
        if (beat >= quantizedStartStep && beat < quantizedEndStep) {
          // ctx.fillStyle = colors[2];
          ctx.fillStyle = colors[6];
          ctx.translate(-noteLength * step * 0.1, -2.5);
          ctx.fillRect(0, 0, noteLength * step * 1.1, 10);
        } else {
          ctx.fillRect(0, 0, noteLength * step * 0.9, 5);
        }

        ctx.restore();
      }

      ctx.restore();
    }
    ctx.restore();
  }

  drawAnchorPoints(ctx, w, h, unit) {
    ctx.save();
    const size = 2;
    const xSteps = w / unit;
    const ySteps = h / unit;
    for (let i = 0; i <= xSteps; i += 1) {
      for (let j = 0; j <= ySteps + 1; j += 1) {
        ctx.save();
        ctx.fillStyle = colors[5];
        ctx.translate(i * unit, j * unit);


        if (this.hoveringSounds) {
          ctx.fillStyle = colors[6];
          const d = new Date();
          ctx.translate(0, Math.sin(d * 0.005 + i * 0.3 + j * 0.3) * ySteps * 0.5);
          ctx.fillRect(0, 0, size, size);
        } else if (this.hoveringNotes) {
          ctx.fillStyle = colors[6];
          if (Math.random() > 0.98) {
            ctx.translate(-size * 1.5, -size * 1.5);
            ctx.fillRect(0, 0, size * 3, size * 3);
          } else {
            ctx.fillRect(0, 0, size, size);
          }
        } else {
          ctx.fillRect(0, 0, size, size);
        }
        ctx.restore();
      }
    }
    ctx.restore();
  }

}
