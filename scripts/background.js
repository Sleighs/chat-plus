////////   Background Initialization   ////////
const defaultOptions = {
  enableChatPlus: true,
  debug: false,
  colorUsernames: true
}
let options = {}

let optionsForm = document.querySelector("#optionsForm");

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get("options").then((result) => {

    if (result.options) {
      Object.assign(options, result.options)
      console.log("Installed - stored options" + JSON.stringify(result), options);
      //options = result.options;
    } else {
      Object.assign(options, defaultOptions)
      console.log("Installed - default options", options);
      //options = defaultOptions;
    }
  });
  
  //optionsForm.enableChatPlus.checked = Boolean(result.options.enableChatPlus);
  //optionsForm.debug.checked = Boolean(result.options.debug);
  //optionsForm.colorUsernames.checked = Boolean(result.options.colorUsernames);

  chrome.storage.sync.set({ options: options });
});

// Saves options to chrome.storage
function saveOptions() {
  var debugEle = document.getElementById('debug-input').checked;
  var colorUsernamesEle = document.getElementById('color-usernames-input').checked;
  var enableChatPlusEle = document.getElementById('enable-chatplus-input').checked;

  const currentOptions = {
    debug: debugEle,
    colorUsernames: colorUsernamesEle,
    enableChatPlus: enableChatPlusEle
  };

  chrome.storage.sync.set({ options: currentOptions }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 2500);
  });
}

// Restores select checkbox state from chrome.storage data
function restoreOptions() {
  chrome.storage.sync.get("options")
  .then((result) => {
    console.log('restoreOptions result', JSON.stringify(result));
    document.getElementById('debug-input').checked = result.options.debug;
    document.getElementById('color-usernames-input').checked = result.options.colorUsernames;
    document.getElementById('enable-chatplus-input').checked = result.options.enableChatPlus;
  });
}



// Load options on page load
document.addEventListener('DOMContentLoaded', restoreOptions);

// Save options
document.getElementById('save-options').addEventListener('click', saveOptions);

