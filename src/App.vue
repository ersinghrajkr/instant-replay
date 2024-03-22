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
</script>

<template>
  <h1>Capture Flow</h1>
  <button class="capture-btn" @click="capture">Capture</button>
</template>

<style scoped>
h1 {
  white-space: nowrap;
}

.capture-btn {
  background-color: #4caf50; /* Green */
  color: white;
  border: none;
  padding: 8px 8px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
}

.capture-btn:hover {
  background-color: #45a049; /* Darker green */
}
</style>
