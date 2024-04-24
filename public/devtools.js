const onMessage = (message) => {
  if (!message) {
    console.error("ERROR: message object doesn't exist!")
    return
  }

  switch (message.action) {
    case 'getHAR':
      onGetHAR(message)
      break
    case 'requestHarLog':
      onGetHAR(message)
      break
    case 'ping':
      onPing()
      break
  }
}

chrome.runtime.onMessage.addListener(onMessage)

const onPing = () => {
  chrome.runtime.sendMessage({
    action: 'pong',
  })
}

const onGetHAR = (message) => {
  chrome.devtools.network.getHAR((harLog) => {
    chrome.runtime.sendMessage({
      action: 'exportFile',
      tabId: chrome.devtools.inspectedWindow.tabId,
      harLog: { log: harLog },
      actionId: message.actionId,
    })
  })
}
