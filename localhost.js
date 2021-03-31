var handleSuccess = function(stream) {
  recording.srcObject = stream;
};

navigator.mediaDevices.getUserMedia({ audio: true, video: true })
    .then(handleSuccess)
