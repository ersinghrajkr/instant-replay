<script setup lang="ts">
const capture = () => {
  chrome.tabs.captureVisibleTab((dataUrl) => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError.message);
      return;
    }

    // Prompt user to save the screenshot
    chrome.downloads.download({
      url: dataUrl,
      filename: "screenshot.jpg", // default filename
      saveAs: true, // prompt user to choose filename/location
    });
  });
};

const startVideo = () => {
  const captureOptions = {
    audio: false,
    video: true,
    videoConstraints: {
      mandatory: {
        chromeMediaSource: "tab",
      },
    },
  };

  chrome.tabCapture.capture(captureOptions, (stream) => {
    const mediaRecorder = new MediaRecorder(stream!);
    let chunks: BlobPart[] = [];

    mediaRecorder.ondataavailable = (event) => {
      chunks.push(event.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);

      chrome.downloads.download({
        url: url,
        filename: "capturedVideo.webm", // default filename
        saveAs: true, // prompt user to choose filename/location
      });
    };

    mediaRecorder.start();

    // Stop recording after 5 seconds and trigger the download
    setTimeout(() => {
      mediaRecorder.stop();
    }, 5000);
  });
};

const devTools = () => {
};

</script>

<template>
  <h1>Capture Flow</h1>
  <button class="btn" @click="capture">Take Screenshot</button>
  <div class="video-capture-container">
    <button class="btn" @click="startVideo">Record screen (5sec)</button>
  </div>
  <button class="capture-btn" @click="devTools">View DevTool Logs</button>
</template>

<style scoped>
h1 {
  white-space: nowrap;
}

.video-capture-container {
  margin-top: 16px;
}

.btn {
  white-space: nowrap;
  background-color: #4caf50; /* Green */
  color: white;
  border: none;
  padding: 8px 8px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
}

.btn:hover {
  background-color: #45a049; /* Darker green */
}
</style>
