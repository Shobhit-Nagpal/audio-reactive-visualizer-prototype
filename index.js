console.log("Sup");

const recordBtn = document.getElementById("record-btn");
const leds = document.querySelector("#leds");
let ctx = null;

document.body.onload = () => {
  for (let i = 0; i < 300; i++) {
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
    const amplitudeDataArray = new Uint8Array(buffLength);
    const frequencyDataArray = new Uint8Array(buffLength);

    function visualize() {
      analyser.getByteTimeDomainData(amplitudeDataArray);
      analyser.getByteFrequencyData(frequencyDataArray);

      const bassRange = frequencyDataArray.slice(0, 85); // Low frequencies
      const midRange = frequencyDataArray.slice(85, 341); // Mid frequencies
      const trebRange = frequencyDataArray.slice(341, 512); // High frequencies

      const transformedArray = amplitudeDataArray.map((x) => x - 128);
      const amplitude = rootMeanSquare(transformedArray);
      const bassLevel =
        bassRange.reduce((sum, val) => sum + val, 0) / bassRange.length;
      const midLevel =
        midRange.reduce((sum, val) => sum + val, 0) / midRange.length;
      const trebLevel =
        trebRange.reduce((sum, val) => sum + val, 0) / trebRange.length;

      const freqRMS = rootMeanSquare([bassLevel, midLevel, trebLevel]);

      updateAmplitudeLEDs_v3(amplitude);
      //updateFreqLEDs(freqRMS);
      updateBassLEDs(bassLevel, 93);
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
function updateAmplitudeLEDs_v1(amplitude) {
  if (amplitude > 2.5) {
    Array.from(document.querySelectorAll(".led"))
      .filter(
        (led) =>
          parseInt(led.id.split("-")[1]) >= 100 &&
          parseInt(led.id.split("-")[1]) <= 300,
      )
      .forEach((led) => led.classList.remove("low"));
    Array.from(document.querySelectorAll(".led"))
      .filter(
        (led) =>
          parseInt(led.id.split("-")[1]) >= 100 &&
          parseInt(led.id.split("-")[1]) <= 300,
      )
      .forEach((led) => led.classList.add("high"));
  } else {
    document
      .querySelectorAll(".led")
      .forEach((led) => led.classList.remove("high"));
    document
      .querySelectorAll(".led")
      .forEach((led) => led.classList.add("low"));
  }
}
function updateAmplitudeLEDs_v2(amplitude) {
  const amplitudeLEDs = document.querySelectorAll(".led"); // LEDs 1-100 and 301-400

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

function updateAmplitudeLEDs_v3(amplitude) {
  const amplitudeLEDs = document.querySelectorAll(".led"); // LEDs 1-100 and 301-400

  if (amplitude > 2.5) {
    amplitudeLEDs.forEach((led) => {
      led.style.opacity = 0.5;
    });
  } else {
    amplitudeLEDs.forEach((led) => {
      led.style.opacity = 1;
    });
  }
}

function updateBassLEDs(bassLevel, level) {
  const bassLEDs = document.querySelectorAll(".led"); // LEDs 101-300

  const half1 = Array.from(bassLEDs).filter(led => Number(led.id.split('-')[1]) % 2 === 0);
  const half2 = Array.from(bassLEDs).filter(led => Number(led.id.split('-')[1]) % 2 !== 0);

  console.log(bassLevel);

  if (bassLevel > level) {
    // Adjust threshold as needed
    half1.forEach((led) => {
      led.classList.remove("low");
      led.classList.add("high");
    });
    half2.forEach((led) => {
      led.classList.add("low");
      led.classList.remove("high");
    });
  } else {
    half2.forEach((led) => {
      led.classList.remove("low");
      led.classList.add("high");
    });
    half1.forEach((led) => {
      led.classList.add("low");
      led.classList.remove("high");
    });
  }
}

function updateFreqLEDs(freqRMS) {
  const bassLEDs = document.querySelectorAll(".led"); // LEDs 101-300

  if (freqRMS > 69) {
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

/*
 * new Array(1024);
 * [0...1023]
 * 0 <= freq <= 255
 */
