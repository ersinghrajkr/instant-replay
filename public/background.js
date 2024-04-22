// Connect to the Chrome DevTools Protocol
// const target = chrome.devtools.inspectedWindow.tabId;
var currentTabId;
chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed.');
});

chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    currentTabId = tabs[0].id;
    if (!currentTabId) {
        console.error('No active tab found.');
        return;
    }
})

// Function to filter out prototype properties
function filterPrototypes(data) {
    if (typeof data === 'object' && data !== null) {
        if (Array.isArray(data)) {
            // Filter array elements
            return data.map(item => filterPrototypes(item));
        } else {
            // Filter object properties
            const filteredObj = {};
            for (const key in data) {
                if (Object.prototype.hasOwnProperty.call(data, key)) {
                    filteredObj[key] = filterPrototypes(data[key]);
                }
            }
            return filteredObj;
        }
    } else {
        return data;
    }
}


chrome.webRequest.onBeforeRequest.addListener(
    function (details) {
        if (details.method === 'POST' && details.url.startsWith('https://')) {
            console.log('POST Request URL:', details.url);
            if (details.requestBody && details.requestBody.formData) {
                console.log('Request Body (Form Data):', details.requestBody.formData);
            } else if (details.requestBody && details.requestBody.raw) {
                const bodyData = details.requestBody.raw.map(entry => String.fromCharCode.apply(null, new Uint8Array(entry.bytes))).join('');
                try {
                    // Parse the JSON data
                    const jsonData = JSON.parse(bodyData);

                    // Filter out prototype properties
                    const filteredData = filterPrototypes(jsonData);

                    console.log('Request Body (Filtered JSON):', filteredData);
                } catch (error) {
                    console.error('Error parsing JSON data:', error);
                }
            } else {
                console.log('Request Body: Not Available');
            }
        }
    },
    {
        urls: ["<all_urls>"], tabId: currentTabId
    },
    ['requestBody']
)


chrome.webRequest.onCompleted.addListener(
    function (details) {
        console.log('Request URL:', details.url);
        console.log('Request Method:', details.method);
        console.log('Status Code:', details.statusCode);
        console.log('responseHeaders:', details.responseHeaders);
        console.log('currentTab:', currentTabId);
        if (details.method === 'POST' && details.url.startsWith('https://')) {
            console.log('POST Response URL:', details.url);
            fetch(details.url)
                .then(response => response.text())
                .then(responseBody => {
                    console.log('Response Body:', responseBody);
                })
                .catch(error => {
                    console.error('Error fetching response body:', error);
                });
        }
    },
    {
        urls: ["<all_urls>"], tabId: currentTabId
    },
    []
)



