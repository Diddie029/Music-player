/* =========================
   AUDIO SETUP
========================= */
const audio = document.getElementById("audio");
const fileInput = document.getElementById("fileInput");

const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

let source;
let analyser = audioCtx.createAnalyser();

/* =========================
   EQ SETUP (10 BAND)
========================= */
const frequencies = [60,170,350,1000,3000,6000,8000,10000,14000,18000];
const filters = [];

/* =========================
   CONNECT AUDIO
========================= */
function connectAudio() {
  source = audioCtx.createMediaElementSource(audio);

  let prev = source;

  frequencies.forEach(freq => {
    let filter = audioCtx.createBiquadFilter();
    filter.type = "peaking";
    filter.frequency.value = freq;
    filter.Q.value = 1;
    filter.gain.value = 0;

    prev.connect(filter);
    filters.push(filter);
    prev = filter;
  });

  prev.connect(analyser);
  analyser.connect(audioCtx.destination);

  analyser.fftSize = 256;
}

fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  audio.src = URL.createObjectURL(file);

  if (!source) connectAudio();
  audio.play();
});

/* =========================
   EQ SLIDERS
========================= */
document.querySelectorAll("#eq input").forEach(slider => {
  slider.addEventListener("input", (e) => {
    let i = e.target.dataset.i;
    filters[i].gain.value = e.target.value;
  });
});

/* =========================
   PLAYLIST SYSTEM
========================= */
let playlist = [];
let currentIndex = 0;

const playlistUI = document.getElementById("playlist");

fileInput.addEventListener("change", (e) => {
  for (let file of e.target.files) {
    playlist.push(URL.createObjectURL(file));
  }

  renderPlaylist();
});

function renderPlaylist() {
  playlistUI.innerHTML = "";

  playlist.forEach((track, i) => {
    let div = document.createElement("div");
    div.className = "playlist-item";
    div.innerText = "Track " + (i + 1);

    div.onclick = () => {
      audio.src = playlist[i];
      audio.play();
    };

    playlistUI.appendChild(div);
  });
}

/* =========================
   MIC INPUT
========================= */
let micOn = false;

document.getElementById("micBtn").onclick = async () => {
  if (!micOn) {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mic = audioCtx.createMediaStreamSource(stream);

    mic.connect(analyser);
    analyser.connect(audioCtx.destination);

    micOn = true;
  }
};

/* =========================
   BASS BOOST
========================= */
let bassBoost = false;
let bassFilter;

document.getElementById("bassBtn").onclick = () => {
  if (!bassBoost) {
    bassFilter = audioCtx.createBiquadFilter();
    bassFilter.type = "lowshelf";
    bassFilter.frequency.value = 200;
    bassFilter.gain.value = 12;

    source.disconnect();
    source.connect(bassFilter);
    bassFilter.connect(analyser);

    bassBoost = true;
  }
};

/* =========================
   VISUALIZER (CANVAS)
========================= */
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

function draw() {
  requestAnimationFrame(draw);

  const buffer = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(buffer);

  ctx.clearRect(0,0,canvas.width,canvas.height);

  let barWidth = canvas.width / buffer.length;

  buffer.forEach((value, i) => {
    let height = value * 1.5;

    ctx.fillStyle = "rgba(124,92,255,0.6)";
    ctx.fillRect(i * barWidth, canvas.height - height, barWidth - 1, height);
  });
}

draw();

/* =========================
   PLAY BUTTON
========================= */
document.getElementById("playBtn").onclick = () => {
  if (audio.paused) audio.play();
  else audio.pause();
};