console.log("Sup");

const recordBtn = document.getElementById("record-btn");
let ctx = null;

recordBtn.addEventListener("click", async () => {
  try {
    ctx = new AudioContext();
    const stream = await accessMicrophone();
    if (!ctx) {
      throw new Error("Context is not defined");
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
 * @param {AudioContext} ctx
 * @returns {number}
 */
function rootMeanSquare(buffer) {
  const squared = buffer.map((x) => x * x);
  const sum = squared.reduce((acc, val) => acc + val, 0);
  const rms = Math.sqrt(sum);
  return rms;
}
