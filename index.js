console.log("Sup");

const recordBtn = document.getElementById("record-btn");
const leds = document.querySelector("#leds");
let ctx = null;

document.body.onload = () => {
  for (let i = 0; i < 100; i++) {
    const led = document.createElement("div");
    led.id = `led-${i + 1}`;
    led.classList.add("led", "bass");
    leds.appendChild(led);
  }
  for (let i = 0; i < 200; i++) {
    const led = document.createElement("div");
    led.id = `led-${i + 1 + 100}`;
    led.classList.add("led");
    leds.appendChild(led);
  }
  for (let i = 0; i < 100; i++) {
    const led = document.createElement("div");
    led.id = `led-${i + 1 + 300}`;
    led.classList.add("led", "bass");
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
    const amplitudeDataArray = new Uint8Array(buffLength);
    const frequencyDataArray = new Uint8Array(buffLength);

    function visualize() {
      analyser.getByteFrequencyData(frequencyDataArray);
      analyser.getByteTimeDomainData(amplitudeDataArray);

      const bassRange = frequencyDataArray.slice(0, 64); // Low frequencies
      const midRange = frequencyDataArray.slice(64, 256); // Mid frequencies
      const trebRange = frequencyDataArray.slice(256, 512); // High frequencies

      const transformedArray = amplitudeDataArray.map((x) => x - 128);
      const amplitude = rootMeanSquare(transformedArray);
      const bassLevel =
        bassRange.reduce((sum, val) => sum + val, 0) / bassRange.length;

      // Update different LED sections
      updateAmplitudeLEDs(amplitude);
      updateBassLEDs(bassLevel);

      //      if (amplitude > 3) {
      //        Array.from(document.querySelectorAll(".led"))
      //          .filter(
      //            (led) =>
      //              parseInt(led.id.split("-")[1]) >= 100 &&
      //              parseInt(led.id.split("-")[1]) <= 300,
      //          )
      //          .forEach((led) => led.classList.remove("low"));
      //        Array.from(document.querySelectorAll(".led"))
      //          .filter(
      //            (led) =>
      //              parseInt(led.id.split("-")[1]) >= 100 &&
      //              parseInt(led.id.split("-")[1]) <= 300,
      //          )
      //          .forEach((led) => led.classList.add("high"));
      //      } else {
      //        document
      //          .querySelectorAll(".led")
      //          .forEach((led) => led.classList.remove("high"));
      //        document
      //          .querySelectorAll(".led")
      //          .forEach((led) => led.classList.add("low"));
      //      }
      // Now dataArray contains your frequency data (0-255 values)
      // Each index represents a frequency bin
      //console.log(dataArray); // This is your "view" into the audio
      //      console.log(amplitude);
      //      console.log('bass:', bassRange)
      requestAnimationFrame(visualize);
    }
    visualize(amplitudeDataArray, analyser);
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
function updateAmplitudeLEDs(amplitude) {
  const amplitudeLEDs = document.querySelectorAll(".led:not(.bass)"); // LEDs 1-100 and 301-400

  if (amplitude > 2.5) {
    amplitudeLEDs.forEach((led) => {
      led.classList.remove("low");
      led.classList.add("high");
    });
  } else {
    amplitudeLEDs.forEach((led) => {
      led.classList.remove("high");
      led.classList.add("low");
    });
  }
}

function updateBassLEDs(bassLevel) {
  const bassLEDs = document.querySelectorAll(".led.bass"); // LEDs 101-300

  if (bassLevel > 110) {
    // Adjust threshold as needed
    bassLEDs.forEach((led) => {
      led.classList.remove("low");
      led.classList.add("high");
    });
  } else {
    bassLEDs.forEach((led) => {
      led.classList.remove("high");
      led.classList.add("low");
    });
  }
}
