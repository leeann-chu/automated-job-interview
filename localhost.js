let preview = document.getElementById("preview");
let recording = document.getElementById("recording");
let startButton = document.getElementById("startButton");
let stopButton = document.getElementById("stopButton");
let downloadButton = document.getElementById("downloadButton");
let logElement = document.getElementById("log");

let recordingTimeMS = 120000;

function intervalTracking() {
  var timeLeft = (recordingTimeMS - 10000) / 1000;
  log("You have been recording for " + (timeLeft) + " seconds... ");
  return;
}

function log(msg) {
  logElement.innerHTML += msg + "\n";
  logElement.setAttribute('class', "log");
}

function clearLog() {
  logElement.innerHTML = "";
}

function wait(delayInMS) {
  return new Promise(resolve => setTimeout(resolve, delayInMS));
}

function startRecording(stream, lengthInMS) {
  let recorder = new MediaRecorder(stream);
  let data = [];
  var intervalID = window.setInterval(intervalTracking, 10000);

  recorder.ondataavailable = event => data.push(event.data);
  recorder.start();
  log(recorder.state + " for " + (lengthInMS / 1000) + " seconds...");

  let stopped = new Promise((resolve, reject) => {
    recorder.onstop = resolve;
    window.clearInterval(intervalID);
    recorder.onerror = event => reject(event.name);
  });

  let recorded = wait(lengthInMS).then(
    () => recorder.state == "recording" && recorder.stop()
  );

  return Promise.all([
      stopped,
      recorded
    ])
    .then(() => data);
}

function stop(stream) {
  stream.getTracks().forEach(track => track.stop());

  return Promise.all([
    stopped,
    recorded
  ])
  .then(() => data);
}

startButton.addEventListener("click", function () {
  navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    }).then(stream => {
      preview.srcObject = stream;
      downloadButton.href = stream;
      preview.captureStream = preview.captureStream || preview.mozCaptureStream;
      return new Promise(resolve => preview.onplaying = resolve);
    }).then(() => startRecording(preview.captureStream(), recordingTimeMS))
    .then(recordedChunks => {
      let recordedBlob = new Blob(recordedChunks, {
        type: "video/webm"
      });
      recording.src = URL.createObjectURL(recordedBlob);
      downloadButton.href = recording.src;
      downloadButton.download = "RecordedVideo.webm";

      log("Successfully recorded " + recordedBlob.size + " bytes of " +
        recordedBlob.type + " media.");
      log("Success");
    })
    .catch(log);
}, false);
stopButton.addEventListener("click", function () {
  stop(preview.srcObject);
}, false);