const startBtn = document.getElementById("start-btn");
const canvas = document.getElementById("canvas");

/*
 * =================== Web socket start ====================
 */
const ws = new WebSocket("ws://10.106.222.59/ws");
ws.onopen = function () {
  document.getElementById("status").innerHTML = "Connected to ESP32";
};

ws.onmessage = function(event) {
  document.getElementById('messages').innerHTML += '<br>ESP32 says: ' + event.data;
};

ws.onclose = function() {
  document.getElementById('status').innerHTML = 'Disconnected';
};

/*
 * =================== Web socket end ====================
 */

/**
 * @type {AudioContext}
 */
let audioContext = null;

/**
 * @type {CanvasRenderingContext2D}
 */
const canvasContext = canvas.getContext("2d");

startBtn.addEventListener("click", () => {
  init();
});

async function init() {
  audioContext = new AudioContext();

  const source = await getAudioSource();

  if (!source) {
    alert("Please give access to browser to use mic");
    return;
  }

  const analyser = audioContext.createAnalyser();
  source.connect(analyser);

  analyser.fftSize = 1024;

  const bufferLength = analyser.frequencyBinCount; // fftSize / 2
  const freqDataArray = new Uint8Array(bufferLength);
  const ampDataArray = new Uint8Array(bufferLength);
  const range = createFrequencyRanges(
    audioContext.sampleRate,
    analyser.fftSize,
  );

  function draw() {
    // Do the visual part here
    analyser.getByteFrequencyData(freqDataArray);
    analyser.getByteTimeDomainData(ampDataArray);

    const frequencies = extractFrequencyFeatures(freqDataArray, range);
    const amplitude = extractAmplitude(ampDataArray);

    console.log("f:", frequencies);
    console.log("a:", amplitude);

    sendMessage(amplitude);

    requestAnimationFrame(draw);
  }

  draw();
}

/**
 * Gets audio source by asking user about device perms
 * @returns {Promise<MediaStreamAudioSourceNode> | Promise<null>}
 */
async function getAudioSource() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });

    return audioContext.createMediaStreamSource(stream);
  } catch (err) {
    console.error("Bruh moment", err);
    return null;
  }
}

/**
 * @param {Uint8Array} dataArray - represents frequency domain data
 * @param {object} range - object containing upper and lower values on frequency ranges
 * @returns {bass: number[], lowMids: number[], mids: number[], highMids: number[], highs: number[]}
 */
function extractFrequencyFeatures(dataArray, range) {
  console.log("length:", dataArray.length);
  const bass = dataArray.slice(range.BASS.LOWER, range.BASS.UPPER);
  const lowMids = dataArray.slice(range.LOW_MIDS.LOWER, range.LOW_MIDS.UPPER);
  const mids = dataArray.slice(range.MIDS.LOWER, range.MIDS.UPPER);
  const highMids = dataArray.slice(
    range.HIGH_MIDS.LOWER,
    range.HIGH_MIDS.UPPER,
  );
  const highs = dataArray.slice(range.HIGHS.LOWER, range.HIGHS.UPPER);

  return {
    bass,
    lowMids,
    mids,
    highMids,
    highs,
  };
}

/**
 * Performs RMS on time-domain data to get amplitude
 * @param {Uint8Array} dataArray - represents time-domain data
 * @returns {number} amplitude
 */
function extractAmplitude(dataArray) {
  let sum = 0;
  for (let i = 0; i < dataArray.length; i++) {
    const val = (dataArray[i] - 128) / 128;
    const squared = val * val;
    sum += squared;
  }

  const amplitude = Math.sqrt(sum / dataArray.length);

  return amplitude;
}

/**
 * Tells number of bins for a frequency
 * @param {number} frequency
 * @param {number} sampleRate
 * @param {number} fftSize
 * @return {number} bin
 */
function frequencyToBin(frequency, sampleRate, fftSize) {
  const nyquist = sampleRate / 2;
  const binWidth = nyquist / (fftSize / 2);
  const bin = Math.floor(frequency / binWidth);
  return bin;
}

/**
 * @param {number} sampleRate
 * @param {number} fftSize
 * @return {object} - Frequency ranges object with upper and lower values
 */
function createFrequencyRanges(sampleRate, fftSize) {
  return {
    BASS: {
      LOWER: frequencyToBin(80, sampleRate, fftSize),
      UPPER: frequencyToBin(250, sampleRate, fftSize),
    },
    LOW_MIDS: {
      LOWER: frequencyToBin(250, sampleRate, fftSize),
      UPPER: frequencyToBin(800, sampleRate, fftSize),
    },
    MIDS: {
      LOWER: frequencyToBin(800, sampleRate, fftSize),
      UPPER: frequencyToBin(3_000, sampleRate, fftSize),
    },
    HIGH_MIDS: {
      LOWER: frequencyToBin(3_000, sampleRate, fftSize),
      UPPER: frequencyToBin(8_000, sampleRate, fftSize),
    },
    HIGHS: {
      LOWER: frequencyToBin(8_000, sampleRate, fftSize),
      UPPER: frequencyToBin(15_000, sampleRate, fftSize),
    },
  };
}

/**
 * Send message to Websocket server
 * @param {number} amplitude 
  */
function sendMessage(amplitude) {
  const jsonData = {
    number: parseInt(amplitude) || 0,
    name: "amplitude",
    timestamp: Date.now(),
  }
  ws.send(JSON.stringify(jsonData));
  document.getElementById('messages').innerHTML += '<br>Sent: ' + JSON.stringify(jsonData);
}

