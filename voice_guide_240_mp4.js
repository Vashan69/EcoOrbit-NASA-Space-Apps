/* VLZO EcoOrbit — 240-second AI voice tour recorder
   Records the current tab's video + tab audio, then converts the recording to MP4 locally.
*/

(() => {
  "use strict";

  const TOUR_SECONDS = 240;
  const DB_NAME = "vlzo_media";
  const DB_STORE = "v";

  let tourTimer = null;
  let tourRunning = false;
  let mediaRecorder = null;
  let recordedChunks = [];
  let currentBlob = null;
  let currentUrl = null;

  const $ = (s, root = document) => root.querySelector(s);

  function createRecorderUI() {
    if ($("#vlzo-tour-recorder")) return;

    const box = document.createElement("div");
    box.id = "vlzo-tour-recorder";
    box.innerHTML = `
      <div style="
        position:fixed;
        right:20px;
        bottom:20px;
        z-index:999999;
        width:340px;
        padding:18px;
        border-radius:18px;
        background:#101820;
        color:white;
        font-family:Arial,sans-serif;
        box-shadow:0 10px 40px rgba(0,0,0,.4);
      ">
        <div style="font-size:20px;font-weight:700;margin-bottom:8px">
          🎙️ VLZO AI Tour
        </div>

        <div style="font-size:13px;line-height:1.5;opacity:.9;margin-bottom:12px">
          Record the complete <b>240-second</b> tour with the AI voice.
          When Chrome asks, choose <b>This tab</b> and enable
          <b>Share tab audio</b>.
        </div>

        <button id="vlzo-start-tour" style="
          width:100%;
          padding:12px;
          border:0;
          border-radius:10px;
          background:#19c37d;
          color:white;
          font-size:15px;
          font-weight:700;
          cursor:pointer;
        ">
          🎥 Record 240-Second Tour
        </button>

        <div id="vlzo-tour-status"
          style="margin-top:10px;font-size:13px;text-align:center;opacity:.9">
          Ready
        </div>
      </div>
    `;

    document.body.appendChild(box);

    $("#vlzo-start-tour").addEventListener("click", startTourRecording);
  }

  function setStatus(text) {
    const el = $("#vlzo-tour-status");
    if (el) el.textContent = text;
  }

  function speak(text, rate = 1) {
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = Math.max(0.1, Math.min(10, rate));
    utterance.pitch = 1;
    utterance.volume = 1;

    window.speechSynthesis.speak(utterance);
  }

  function getTourText() {
    const textNodes = [];

    document.querySelectorAll(
      "main p, main h1, main h2, main h3, main h4, main li"
    ).forEach(el => {
      const text = el.innerText.trim();
      if (text.length > 20) {
        textNodes.push(text);
      }
    });

    if (textNodes.length) {
      return textNodes.join(". ");
    }

    return `
      Welcome to the VLZO EcoOrbit experience.
      This tour introduces our vision, technology, sustainability,
      space exploration, artificial intelligence, and the future of humanity.
      Follow along as the AI guide explains each part of the EcoOrbit project.
    `;
  }

  function calculateSpeechRate(text) {
    const words = text.trim().split(/\s+/).length;

    // Target approximately 240 seconds.
    const targetWordsPerMinute = (words / TOUR_SECONDS) * 60;

    // Browser speech rate is approximate, so clamp to usable range.
    return Math.max(
      0.5,
      Math.min(10, targetWordsPerMinute / 150)
    );
  }

  async function startTourRecording() {
    if (tourRunning) return;

    if (!navigator.mediaDevices?.getDisplayMedia) {
      alert("Your browser does not support screen/tab recording.");
      return;
    }

    tourRunning = true;
    recordedChunks = [];

    const button = $("#vlzo-start-tour");
    if (button) {
      button.disabled = true;
      button.textContent = "⏺ Recording...";
    }

    setStatus("Choose THIS TAB and enable Share tab audio...");

    let displayStream;

    try {
      displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          frameRate: 30
        },
        audio: true,
        preferCurrentTab: true,
        selfBrowserSurface: "include",
        surfaceSwitching: "exclude"
      });
    } catch (error) {
      console.error(error);

      tourRunning = false;

      if (button) {
        button.disabled = false;
        button.textContent = "🎥 Record 240-Second Tour";
      }

      setStatus("Recording cancelled.");
      return;
    }

    const videoTrack = displayStream.getVideoTracks()[0];

    if (!videoTrack) {
      alert("No video track was captured.");
      displayStream.getTracks().forEach(t => t.stop());
      tourRunning = false;
      return;
    }

    const canvas = document.createElement("canvas");

    canvas.width = 1920;
    canvas.height = 1080;

    const ctx = canvas.getContext("2d");

    const video = document.createElement("video");
    video.srcObject = displayStream;
    video.muted = true;
    video.playsInline = true;

    try {
      await video.play();
    } catch (error) {
      console.warn("Video preview play error:", error);
    }

    function drawFrame() {
      if (!tourRunning) return;

      if (video.readyState >= 2) {
        ctx.drawImage(
          video,
          0,
          0,
          canvas.width,
          canvas.height
        );
      }

      requestAnimationFrame(drawFrame);
    }

    drawFrame();

    const canvasStream = canvas.captureStream(30);

    // Add captured tab audio.
    displayStream.getAudioTracks().forEach(track => {
      canvasStream.addTrack(track);
    });

    const mimeTypes = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
      "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
      "video/mp4"
    ];

    let mimeType = "";

    for (const type of mimeTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        mimeType = type;
        break;
      }
    }

    try {
      mediaRecorder = new MediaRecorder(
        canvasStream,
        mimeType ? { mimeType } : undefined
      );
    } catch (error) {
      console.error(error);

      alert("Your browser could not start the recorder.");

      displayStream.getTracks().forEach(t => t.stop());
      canvasStream.getTracks().forEach(t => t.stop());

      tourRunning = false;

      if (button) {
        button.disabled = false;
        button.textContent = "🎥 Record 240-Second Tour";
      }

      return;
    }

    mediaRecorder.ondataavailable = event => {
      if (event.data && event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    mediaRecorder.onerror = event => {
      console.error("MediaRecorder error:", event.error);
      setStatus("Recorder error.");
    };

    mediaRecorder.onstop = async () => {
      tourRunning = false;

      if (tourTimer) {
        clearTimeout(tourTimer);
        tourTimer = null;
      }

      window.speechSynthesis.cancel();

      displayStream.getTracks().forEach(track => track.stop());
      canvasStream.getTracks().forEach(track => track.stop());

      const sourceMime =
        mediaRecorder.mimeType || "video/webm";

      const sourceBlob = new Blob(
        recordedChunks,
        { type: sourceMime }
      );

      setStatus("Recording finished. Preparing MP4...");

      try {
        currentBlob = await convertTourToMp4(sourceBlob);

        showResult(currentBlob, true);
      } catch (error) {
        console.warn("MP4 conversion failed:", error);

        currentBlob = sourceBlob;

        showResult(currentBlob, false);
      }

      if (button) {
        button.disabled = false;
        button.textContent = "🎥 Record 240-Second Tour";
      }
    };

    mediaRecorder.start(1000);

    setStatus("🔴 Recording 240-second tour...");

    const tourText = getTourText();

    // Adjust speech speed so the existing page narration targets 240 seconds.
    const speechRate = calculateSpeechRate(tourText);

    speak(tourText, speechRate);

    tourTimer = setTimeout(() => {
      if (mediaRecorder && mediaRecorder.state !== "inactive") {
        setStatus("Finishing recording...");
        mediaRecorder.stop();
      }
    }, TOUR_SECONDS * 1000);

    videoTrack.addEventListener("ended", () => {
      if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
      }
    });
  }

  async function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(
        `script[src="${src}"]`
      );

      if (existing) {
        if (window.FFmpeg) {
          resolve();
        } else {
          existing.addEventListener("load", resolve);
          existing.addEventListener("error", reject);
        }
        return;
      }

      const script = document.createElement("script");

      script.src = src;
      script.onload = resolve;
      script.onerror = reject;

      document.head.appendChild(script);
    });
  }

  let ffmpegInstance = null;

  async function loadFfmpeg() {
    if (ffmpegInstance) {
      return ffmpegInstance;
    }

    await loadScript(
      "https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.15/dist/umd/ffmpeg.js"
    );

    if (!window.FFmpeg) {
      throw new Error("FFmpeg library failed to load.");
    }

    const { FFmpeg } = window.FFmpeg;

    const ffmpeg = new FFmpeg();

    await ffmpeg.load({
      coreURL:
        "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd/ffmpeg-core.js",

      wasmURL:
        "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd/ffmpeg-core.wasm"
    });

    ffmpegInstance = ffmpeg;

    return ffmpeg;
  }

  async function convertTourToMp4(webmBlob) {
    const ffmpeg = await loadFfmpeg();

    setStatus("Converting video to MP4...");

    const inputName = "vlzo-tour.webm";
    const outputName = "vlzo-tour.mp4";

    const data = new Uint8Array(
      await webmBlob.arrayBuffer()
    );

    await ffmpeg.writeFile(inputName, data);

    await ffmpeg.exec([
      "-i",
      inputName,

      "-c:v",
      "libx264",

      "-preset",
      "veryfast",

      "-crf",
      "23",

      "-pix_fmt",
      "yuv420p",

      "-c:a",
      "aac",

      "-b:a",
      "128k",

      "-movflags",
      "+faststart",

      outputName
    ]);

    const output = await ffmpeg.readFile(outputName);

    const mp4Blob = new Blob(
      [output.buffer],
      { type: "video/mp4" }
    );

    try {
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);
    } catch (e) {
      console.warn("FFmpeg cleanup warning:", e);
    }

    return mp4Blob;
  }

  function showResult(blob, isMp4) {
    if (currentUrl) {
      URL.revokeObjectURL(currentUrl);
    }

    currentUrl = URL.createObjectURL(blob);

    const extension = isMp4 ? "mp4" : "webm";
    const filename =
      isMp4
        ? "VLZO_EcoOrbit_Tour_240s.mp4"
        : "VLZO_EcoOrbit_Tour_240s.webm";

    const old = $("#vlzo-tour-result");

    if (old) {
      old.remove();
    }

    const box = document.createElement("div");

    box.id = "vlzo-tour-result";

    box.style.cssText = `
      position:fixed;
      inset:0;
      z-index:1000000;
      display:flex;
      align-items:center;
      justify-content:center;
      background:rgba(0,0,0,.82);
      font-family:Arial,sans-serif;
      padding:20px;
    `;

    const sizeMB =
      (blob.size / 1024 / 1024).toFixed(2);

    box.innerHTML = `
      <div style="
        width:min(900px,95vw);
        max-height:95vh;
        overflow:auto;
        background:#101820;
        color:white;
        border-radius:20px;
        padding:24px;
        box-shadow:0 20px 70px rgba(0,0,0,.6);
      ">

        <h2 style="margin-top:0">
          🎬 Your 240-Second Tour Is Ready
        </h2>

        <p style="opacity:.9">
          ${isMp4 ? "MP4" : "WebM"} ready.
          Video size: ${sizeMB} MB
        </p>

        <video
          controls
          playsinline
          style="
            width:100%;
            max-height:55vh;
            border-radius:14px;
            background:#000;
          "
          src="${currentUrl}">
        </video>

        <div style="
          margin-top:16px;
          padding:14px;
          border-radius:12px;
          background:rgba(255,255,255,.08);
          line-height:1.5;
          font-size:14px;
        ">
          🎙️ The recording contains the website visuals and
          the AI narration captured from the shared browser tab.
          <br><br>
          If the AI voice is missing, record again and make sure
          <b>Share tab audio</b> is enabled in Chrome.
        </div>

        <div style="
          display:flex;
          gap:10px;
          flex-wrap:wrap;
          margin-top:18px;
        ">

          <a
            href="${currentUrl}"
            download="${filename}"
            style="
              flex:1;
              min-width:180px;
              text-align:center;
              padding:13px;
              border-radius:10px;
              background:#19c37d;
              color:white;
              text-decoration:none;
              font-weight:700;
            "
          >
            ⬇️ Download ${extension.toUpperCase()}
          </a>

          <button
            id="vlzo-save-pitch"
            style="
              flex:1;
              min-width:180px;
              padding:13px;
              border:0;
              border-radius:10px;
              background:#2563eb;
              color:white;
              font-weight:700;
              cursor:pointer;
            "
          >
            🎯 Use as 240s Pitch Video
          </button>

          <button
            id="vlzo-close-result"
            style="
              flex:1;
              min-width:180px;
              padding:13px;
              border:0;
              border-radius:10px;
              background:#374151;
              color:white;
              font-weight:700;
              cursor:pointer;
            "
          >
            Close
          </button>

        </div>

      </div>
    `;

    document.body.appendChild(box);

    $("#vlzo-close-result").onclick = () => {
      box.remove();
    };

    $("#vlzo-save-pitch").onclick = async () => {
      try {
        await saveMedia("tourLong", blob);

        await saveMedia("use", blob);

        $("#vlzo-save-pitch").textContent =
          "✓ Saved for VLZO TV / Pitch";

      } catch (error) {
        console.error(error);

        $("#vlzo-save-pitch").textContent =
          "Save failed";
      }
    };

    setStatus(
      isMp4
        ? "MP4 ready."
        : "MP4 conversion failed — WebM ready."
    );
  }

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(
        DB_NAME,
        1
      );

      request.onupgradeneeded = () => {
        const db = request.result;

        if (!db.objectStoreNames.contains(DB_STORE)) {
          db.createObjectStore(DB_STORE);
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async function saveMedia(key, blob) {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
      const transaction =
        db.transaction(DB_STORE, "readwrite");

      const store =
        transaction.objectStore(DB_STORE);

      const request =
        store.put(blob, key);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // Initialize after page load.
  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      createRecorderUI
    );
  } else {
    createRecorderUI();
  }

})();