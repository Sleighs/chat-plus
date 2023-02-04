const defaultOptions = {
  enableChatPlus: true,
  debug: false,
  colorUsernames: true
}
let options = {}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ options: defaultOptions });
});

chrome.runtime.onStartup.addListener(() =>{
  chrome.storage.sync.get("options").then((result) => {
    console.log("Startup " + result);
    options = result;
  });
})


/*
chrome.storage.sync.set({ colorizeUsernames: true  }).then(() => {
  console.log("Value is set to " + value);
});

chrome.storage.sync.get(["colorizeUsernames"]).then((result) => {
  console.log("Value currently is " + result.key);
});


chrome.storage.onChanged.addListener((changes, namespace) => {
  for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
    console.log(
      `Storage key "${key}" in namespace "${namespace}" changed.`,
      `Old value was "${oldValue}", new value is "${newValue}".`
    );
  }
});
*/

function setEnableChatPlus(value) { 
  // Set enableChatPlus value in options object
  options.enableChatPlus = value;
  chrome.storage.sync
    .set({ options: (prevData) => { return { enableChatPlus: value, ...prevData}}})
    .then(() => {
      //console.log("EnableChatPlus is set to " + value);
    });
}

function setDebugMode(value) { 
  // Set debug value in options object
  options.debug = value;
  chrome.storage.sync
    .set({ options: (prevData) => { return { debug: value, ...prevData}}})
    .then(() => {
      //console.log("Debug is set to " + value);
    });
}

function setColorUsernames(value) { 
  // Set colorUsernames value in options object
  options.colorUsernames = value;
  chrome.storage.sync
    .set({ options: (prevData) => { return { colorUsernames: value, ...prevData}}})
    .then(() => {
      //console.log("colorUsernames is set to " + value);
    });
 }

// Watch for changes to the user's options & apply them
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.options?.newValue) {
    const enableChatPlus = Boolean(changes.options.newValue.enableChatPlus);
    console.log('enable chat plus?', enableChatPlus);
    setEnableChatPlus(enableChatPlus);

    const debugMode = Boolean(changes.options.newValue.debug);
    console.log('enable debug mode?', debugMode);
    setDebugMode(debugMode);

    const colorUsernames = Boolean(changes.options.newValue.colorUsernames);
    console.log('enable color usernames?', colorUsernames);
    setColorUsernames(colorUsernames);
  }

});

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  // communication tree
  if (message === 'get_options') {
    chrome.storage.sync.get("options").then((result) => {
      console.log("get_options value currently is " + JSON.stringify(result));
      sendResponse(result);
    });
  }
});