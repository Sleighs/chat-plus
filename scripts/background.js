////////   Background Initialization  ////////
const defaultOptions = {
  enableChatPlus: true,
  debug: false,
  colorUsernames: true
}
let options = {}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get("options").then((result) => {

    if (result.options) {
      console.log("Installed - stored options" + JSON.stringify(result));
      //options = result.options;
      Object.assign(options, result.options)
    } else {
      console.log("Installed - default options");
      //options = defaultOptions;
      Object.assign(options, defaultOptions)
    }
  });

  chrome.storage.sync.set({ options: defaultOptions });
});

/*
// Set options object to new values onChange
function setEnableChatPlus(value) { 
  // Set enableChatPlus value in options object
  options.enableChatPlus = value;
  chrome.storage.sync
    .set({ options: (prevData) => { return { enableChatPlus: value, ...prevData}}})
    .then((result) => {
      //console.log("EnableChatPlus is set to " + value);
      console.log("options", result);
    });
}

function setDebugMode(value) { 
  // Set debug value in options object
  options.debug = value;
  chrome.storage.sync
    .set({ options: (prevData) => { return { debug: value, ...prevData}}})
    .then((result) => {
      //console.log("Debug is set to " + value);
      console.log("options", result);
    });
}

function setColorUsernames(value) { 
  // Set colorUsernames value in options object
  options.colorUsernames = value;
  chrome.storage.sync
    .set({ options: (prevData) => { return { colorUsernames: value, ...prevData}}})
    .then((result) => {
      //console.log("colorUsernames is set to " + value);
      console.log("options", result);
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

*/



//////   Options Page   //////

// Initialize the form with the user's option settings
chrome.storage.sync.get("options")
  .then((result) => {
    console.log('optionData result', JSON.stringify(result));
    Object.assign(options, result.options);
  });

let optionsForm = document.querySelector("#optionsForm");

// update input values on page load
window.onload = function() {
  optionsForm.enableChatPlus.checked = Boolean(options.enableChatPlus);
  optionsForm.debug.checked = Boolean(options.debug);
  optionsForm.colorUsernames.checked = Boolean(options.colorUsernames);
};

optionsForm.enableChatPlus.checked = Boolean(options.enableChatPlus);
optionsForm.debug.checked = Boolean(options.debug);
optionsForm.colorUsernames.checked = Boolean(options.colorUsernames);

// Immediately persist options changes
optionsForm.enableChatPlus.addEventListener("change", (event) => {
  options.enableChatPlus = event.target.checked;
  chrome.storage.sync.set({ options });
});

optionsForm.debug.addEventListener("change", (event) => {
  options.debug = event.target.checked;
  chrome.storage.sync.set({ options });
});

optionsForm.colorUsernames.addEventListener("change", (event) => {
  options.colorUsernames = event.target.checked;
  chrome.storage.sync.set({ options });
});


// Watch for changes to the user's options & apply them
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.options?.newValue) {
    const enableChatPlus = Boolean(changes.options.newValue.enableChatPlus);
    console.log('enable chat plus?', enableChatPlus);
    options.enableChatPlus = enableChatPlus;

    const debugMode = Boolean(changes.options.newValue.debug);
    console.log('enable debug mode?', debugMode);
    options.debug = debugMode;

    const colorUsernames = Boolean(changes.options.newValue.colorUsernames);
    console.log('enable color usernames?', colorUsernames);
    options.colorUsernames = colorUsernames;

    //chrome.storage.sync.set({ options });
  }
});


//////   Popup Page   //////
//const popupOptionsForm = document.getElementById("popup");
//console.log('popupOptionsForm', popupOptionsForm)
