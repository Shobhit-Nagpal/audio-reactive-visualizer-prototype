console.log("Sup");

const recordBtn = document.getElementById("record-btn");
const leds = document.querySelector("#leds");
let ctx = null;

document.body.onload = () => {
  for (let i = 0; i < 200; i++) {
    const led = document.createElement("div");
    led.id = `led-${i + 1}`;
    led.classList.add("led");
    leds.appendChild(led);
  }
};

recordBtn.addEventListener("click", async () => {
  try {
    const stream = await accessMicrophone();
    if (!ctx) {
      ctx = new AudioContext();
    }
    const source = ctx.createMediaStreamSource(stream);
    const analyser = createAnalyser(ctx);
    analyser.fftSize = 1024;

    source.connect(analyser);

    const buffLength = analyser.fftSize;
    const dataArray = new Uint8Array(buffLength);

    function visualize() {
      //      analyser.getByteFrequencyData(dataArray);
      analyser.getByteTimeDomainData(dataArray);

      const transformedArray = dataArray.map((x) => x - 128);
      const amplitude = rootMeanSquare(transformedArray);
      if (amplitude > 5) {
        document
          .querySelectorAll(".led")
          .forEach((led) => led.classList.add("on"));
      } else {
        document
          .querySelectorAll(".led")
          .forEach((led) => led.classList.remove("on"));
      }
      // Now dataArray contains your frequency data (0-255 values)
      // Each index represents a frequency bin
      //console.log(dataArray); // This is your "view" into the audio
      console.log(amplitude);
      requestAnimationFrame(visualize);
    }
    visualize(dataArray, analyser);
  } catch (err) {
    if (err instanceof DOMException) {
      console.error(err);
      alert("YOU ARE NGMI");
      return;
    }
    console.error(err);
  }
});

/**
 * Access users' microphone
 * @returns {Promise<MediaStream>} mediaStream
 */
async function accessMicrophone() {
  return await navigator.mediaDevices.getUserMedia({
    audio: true,
  });
}

/**
 * Returns an AnalyserNode
 * @param {AudioContext} ctx
 * @returns {AnalyserNode} analyserNode
 */
function createAnalyser(ctx) {
  return ctx.createAnalyser();
}

/**
 * Returns the RMS
 * @param {Uint8Array<ArrayBuffer>} buffer
 * @returns {number}
 */
function rootMeanSquare(buffer) {
  const squared = buffer.map((x) => x * x);
  const sum = squared.reduce((acc, val) => acc + val, 0);
  const mean = sum / buffer.length;
  const rms = Math.sqrt(mean);
  return rms;
}

/*
 *
 *
 * LED Module
 *
 *
 */
