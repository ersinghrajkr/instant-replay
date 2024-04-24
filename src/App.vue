<script setup lang="ts">
import JSZip from "jszip";
import { onMounted, reactive, ref } from "vue";

const zip = new JSZip();

let mediaRecorder: MediaRecorder;

const state = reactive({
  isRecordingStarted: false,
});

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

const stopRecording = () => {
  state.isRecordingStarted = false;
  mediaRecorder.stop();
};

const startVideo = () => {
  state.isRecordingStarted = true;
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
    if (!stream) {
      return;
    }
    mediaRecorder = new MediaRecorder(stream);
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
  });
};

const devTools = () => {
  chrome.runtime.sendMessage({
    action: "requestHarLog",
  });
};

const isChecked = ref(false);

const getCurrentTab = async () => {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs: any) => {
      const tab = tabs[0];
      resolve(tab);
    });
  });
};

const getLocalDateTime = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const milliseconds = String(now.getMilliseconds()).padStart(3, "0");

  return `${year}-${month}-${day}T${hours}-${minutes}-${seconds}-${milliseconds}`;
};

const exportFile = async (message: any) => {
  const tab: any = await getCurrentTab();
  if (message.tabId && tab.id !== message.tabId) return;
  const dateString = getLocalDateTime();

  let screenshotData = await chrome.tabs.captureVisibleTab();

  screenshotData = screenshotData.replace("data:image/png;base64,", "");
  screenshotData = screenshotData.replace("data:image/jpeg;base64,", "");
  screenshotData = screenshotData.replace(" ", "+");
  if (tab.id === message.tabId)
    zip.file(`network_logs_${dateString}.har`, JSON.stringify(message.harLog));
  const systemInfoString = getSystemInfo(tab);
  zip.file(`system_infos_${dateString}.txt`, systemInfoString);
  zip.file(`screenshot_${dateString}.png`, screenshotData, { base64: true });

  const zipBlob = await zip.generateAsync({ type: "blob" });

  chrome.downloads.download({
    url: URL.createObjectURL(zipBlob),
    filename: `bug_report_${dateString}.zip`,
  });
};

const getSystemInfo = (tab: any) => {
  const manifest = chrome.runtime.getManifest();
  let systemInfoString =
    `System information\n` +
    `User Agent: ${navigator.userAgent}\n` +
    `OS: ${
      (navigator as any).oscpu ?? (navigator as any).userAgentData.platform
    }\n` +
    `Language: ${navigator.language}\n` +
    `Capture Flow version: ${manifest.version}\n` +
    `Current URL: ${tab.url}`;
  return systemInfoString;
};

const onMessage = (message: any) => {
  if (!message) {
    console.error("ERROR: message object doesn't exist!");
    return;
  }

  switch (message.action) {
    case "exportFile":
      exportFile(message);
      break;
  }
};

onMounted(() => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentUrl = tabs[0].url;
    const isWatching = localStorage.getItem(currentUrl!);
    isChecked.value = JSON.parse(isWatching!);
  });
  chrome.runtime.onMessage.addListener(onMessage);
});

const watchTab = () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    console.log(tabs);
    const currentUrl = tabs[0].url;
    localStorage.setItem(currentUrl!, isChecked.value.toString());
  });
};
</script>

<template>
  <div>
    <div class="header-box">
      <h2>Capture Flow</h2>
    </div>
    <div class="btn-container">
      <button class="btn" @click="capture">
        <div class="btn-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24px"
            height="24px"
            viewBox="0 0 24 24"
          >
            <g transform="translate(2 3)">
              <path
                d="M15.64,18H4.36A4.362,4.362,0,0,1,0,13.645V7.711A4.362,4.362,0,0,1,4.36,3.356a.2.2,0,0,0,.191-.12l.059-.12.083-.175c.261-.55.557-1.173.737-1.533A2.433,2.433,0,0,1,7.64,0h4.71a2.44,2.44,0,0,1,2.22,1.408c.157.315.4.82.627,1.308l.142.3.1.22a.225.225,0,0,0,.2.12A4.362,4.362,0,0,1,20,7.711v5.934A4.362,4.362,0,0,1,15.64,18ZM10,6.4A3.922,3.922,0,0,0,7.21,7.562a3.867,3.867,0,0,0-1.14,2.767A3.924,3.924,0,0,0,10,14.254a3.9,3.9,0,0,0,2.77-1.148,3.915,3.915,0,0,0,.01-5.554A3.9,3.9,0,0,0,10,6.4Zm5.61-.239a.9.9,0,1,0,.911.909A.906.906,0,0,0,15.61,6.163ZM10,12.756a2.423,2.423,0,0,1-2.43-2.427v-.01a2.337,2.337,0,0,1,.7-1.7A2.43,2.43,0,1,1,10,12.756Z"
                fill="currentColor"
              ></path>
            </g>
          </svg>
        </div>
        <div class="btn-text"><span>Take Screenshot</span></div>
      </button>
      <button class="btn" v-if="!state.isRecordingStarted" @click="startVideo">
        <div class="btn-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24px"
            height="24px"
            viewBox="0 0 24 24"
          >
            <g transform="translate(2 4.5)">
              <path
                d="M4.113,15A3.91,3.91,0,0,1,0,10.939V4.061A3.91,3.91,0,0,1,4.113,0H9.905a3.91,3.91,0,0,1,4.113,4.061v6.879A3.91,3.91,0,0,1,9.905,15Zm13.844-2.38-1.48-.747a1.624,1.624,0,0,1-.888-1.457V4.583a1.618,1.618,0,0,1,.888-1.455l1.481-.749a1.384,1.384,0,0,1,1.373.064A1.432,1.432,0,0,1,20,3.662v7.676a1.43,1.43,0,0,1-.669,1.219,1.4,1.4,0,0,1-.743.216A1.384,1.384,0,0,1,17.957,12.621Z"
                fill="currentColor"
              ></path>
            </g>
          </svg>
        </div>
        <div class="btn-text"><span>Record screen</span></div>
      </button>
      <button
        class="btn"
        v-if="state.isRecordingStarted"
        @click="stopRecording"
      >
        <div class="btn-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            version="1.1"
            width="24px"
            height="24px"
            viewBox="0 0 48 48"
            xml:space="preserve"
            fill-rule="evenodd"
          >
            <path
              fill="white"
              opacity="1"
              d="M24 3.5C12.686 3.5 3.5 12.686 3.5 24S12.686 44.5 24 44.5 44.5 35.314 44.5 24 35.314 3.5 24 3.5zm0 3c9.659 0 17.5 7.841 17.5 17.5S33.659 41.5 24 41.5 6.5 33.659 6.5 24 14.341 6.5 24 6.5zm7.5 21.501v-8a3.5 3.5 0 0 0-3.5-3.5h-8a3.5 3.5 0 0 0-3.5 3.5v8a3.5 3.5 0 0 0 3.5 3.5h8a3.5 3.5 0 0 0 3.5-3.5z"
            ></path>
          </svg>
        </div>
        <div class="btn-text"><span>Stop Recording</span></div>
      </button>
      <button class="btn" @click="devTools">
        <div class="btn-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            version="1.1"
            width="24"
            height="24"
            viewBox="0 0 512 512"
            style="padding: 3px"
          >
            <g>
              <path
                fill="white"
                d="m167.164 0 16.82 52.672H512v-37.27C512 6.895 505.125 0 496.648 0zm0 0"
              ></path>
              <path
                fill="white"
                d="M158.16 72.777 134.926 0H15.352C6.875 0 0 6.895 0 15.402v481.196C0 505.105 6.875 512 15.352 512h481.293c8.48 0 15.355-6.895 15.355-15.402V83.477H172.785c-6.672 0-12.59-4.325-14.625-10.7zM47.31 58.945c-8.477 0-15.352-6.89-15.352-15.398 0-8.504 6.875-15.402 15.352-15.402h44.863c8.473 0 15.351 6.898 15.351 15.402 0 8.512-6.878 15.398-15.351 15.398zm304.578 157.246h-21.364c-8.472 0-15.351-6.898-15.351-15.398 0-8.516 6.879-15.402 15.351-15.402h21.364c18.648 0 33.828 15.214 33.828 33.933v55.25h10.113c8.485 0 15.352 6.89 15.352 15.403 0 8.5-6.868 15.398-15.352 15.398h-10.113v53.566c0 18.72-15.18 33.934-33.828 33.934h-21.364c-8.472 0-15.351-6.887-15.351-15.398 0-8.504 6.879-15.403 15.351-15.403h21.364a3.133 3.133 0 0 0 3.12-3.133V219.324a3.135 3.135 0 0 0-3.12-3.133zM218.375 370.484l45.59-170.668c2.187-8.222 10.613-13.101 18.8-10.894 8.188 2.2 13.051 10.648 10.86 18.863l-45.59 170.668c-2.187 8.164-10.562 13.117-18.8 10.895-8.188-2.2-13.051-10.653-10.86-18.864zm-21.547-169.691c0 8.5-6.879 15.398-15.351 15.398h-21.364a3.133 3.133 0 0 0-3.12 3.133v139.617a3.133 3.133 0 0 0 3.12 3.133h21.364c8.472 0 15.351 6.899 15.351 15.399 0 8.515-6.879 15.402-15.351 15.402h-21.364c-18.648 0-33.828-15.215-33.828-33.934v-55.25h-10.113c-8.485 0-15.352-6.898-15.352-15.402 0-8.5 6.867-15.398 15.352-15.398h10.113v-53.567c0-18.719 15.18-33.933 33.828-33.933h21.364c8.472 0 15.351 6.89 15.351 15.402zm0 0"
              ></path>
            </g>
          </svg>
        </div>
        <div class="btn-text"><span>Quick bug report</span></div>
      </button>
      <div class="switch-container">
        <b>Watch tab</b>
        <label class="switch">
          <input type="checkbox" v-model="isChecked" @change="watchTab" />
          <span class="slider round"></span>
        </label>
      </div>
      <button class="btn" v-if="isChecked">
        <div class="btn-icon">
          <svg
            fill="#ffffff"
            height="24px"
            width="24px"
            version="1.1"
            id="Capa_1"
            xmlns="http://www.w3.org/2000/svg"
            xmlns:xlink="http://www.w3.org/1999/xlink"
            viewBox="0 0 420.012 420.012"
            xml:space="preserve"
            stroke="#ffffff"
          >
            <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
            <g
              id="SVGRepo_tracerCarrier"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></g>
            <g id="SVGRepo_iconCarrier">
              <g id="XMLID_36_">
                <path
                  id="XMLID_307_"
                  d="M0,40v340.012h420.012V40H0z M100.006,165.006v30h-40v-30H100.006z M60.006,135.006v-30h40v30H60.006z M100.006,225.006v30h-40v-30H100.006z M100.006,285.006v30h-40v-30H100.006z M290.006,144.796v129.075l-56.471-32.268v33.613 l-103.529-64.538l103.529-64.538v30.924L290.006,144.796z M360.006,165.006v30h-40v-30H360.006z M320.006,135.006v-30h40v30 H320.006z M360.006,225.006v30h-40v-30H360.006z M360.006,285.006v30h-40v-30H360.006z"
                ></path>
              </g>
            </g>
          </svg>
        </div>
        <div class="btn-text"><span>Capture flow</span></div>
      </button>
    </div>
  </div>
</template>

<style scoped>
h2 {
  white-space: nowrap;
  font-weight: 400 !important;
}

.header-box {
  background-color: #1e272e;
  height: 60px;
  padding: 15px 160px 35px 15px;
  text-align: left;
}

.video-capture-container {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

.btn-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
  align-items: stretch;
  text-align: center;
  margin: 20px 55px;
}

.btn {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  background-color: #4caf50;
  color: #fff;
  border: none;
  padding: 5px 3vw;
  text-align: center;
  text-decoration: none;
  font-size: 14px;
  border-radius: 5px;
  gap: 5px;
}

.btn:hover {
  background-color: #45a049;
  /* Darker green */
}

.btn .btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20%;
  min-width: 24px;
  max-width: 35px;
}

.btn .btn-text {
  display: inline-flex;
  justify-content: center;
  align-items: center;
}

.btn .btn-icon svg {
  min-width: 24px;
  min-height: 24px;
}

.switch-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 16px;
}

/* The switch - the box around the slider */
.switch {
  position: relative;
  display: inline-block;
  width: 54px;
  height: 26px;
}

/* Hide default HTML checkbox */
.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

/* The slider */
.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  -webkit-transition: 0.4s;
  transition: 0.4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  -webkit-transition: 0.4s;
  transition: 0.4s;
}

input:checked + .slider {
  background-color: #4caf50;
}

input:focus + .slider {
  box-shadow: 0 0 1px #4caf50;
}

input:checked + .slider:before {
  -webkit-transform: translateX(26px);
  -ms-transform: translateX(26px);
  transform: translateX(26px);
}

/* Rounded sliders */
.slider.round {
  border-radius: 34px;
}

.slider.round:before {
  border-radius: 50%;
}
</style>
