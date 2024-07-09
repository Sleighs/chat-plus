const browser = chrome || browser

////////   Installation   ////////

// Default options
const defaultOptions = {
  enableChatPlus: true,
  colorUsernames: true,
  showUsernameListOnStartup: false,
  enableUsernameMenu: false,
  popupBelow: false,
  playVideoOnPageLoad: false,
  hideFullWindowChatButton: false,
  showListUserCount: false,
  chatStyleNormal: true,
  saveRants: false,
  chatAvatarEnabled: true,
  normalChatColors: false,
  initialBoot: true,
  hideToggleIcon: false
};

// Options stored in chrome.storage.sync
let options = {};

// Initial setup
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get("options").then((result) => {
    let optionsList = [
      "enableChatPlus", 
      "colorUsernames", 
      "showUsernameListOnStartup",
      "enableUsernameMenu",
      "popupBelow",
      "playVideoOnPageLoad",
      "hideFullWindowChatButton",
      "showListUserCount",
      "chatStyleNormal",
      "saveRants",
      "chatAvatarEnabled",
      "normalChatColors",
      "initialBoot",
      "hideToggleIcon"
    ];

    // Creates a new options object from the stored options and the default options
    function extractProperties(names, obj) {
      let extracted = {};
      names.forEach(name => {
        if (name in obj) {
          extracted[name] = obj[name];
        } else {
          extracted[name] = defaultOptions[name];
        }
      });
      return extracted;
    }

    // Stores the options object in chrome.storage.sync
    if ( result && result.options ) {
      let newOptionObj = extractProperties(optionsList, result.options);
        
      chrome.storage.sync.set({ options: newOptionObj })
        .then(() => {
          console.log("Installed - set options", newOptionObj);
        });
    } else {
      chrome.storage.sync.set({ options: defaultOptions })
        .then(() => {
          console.log("Installed - default options", defaultOptions);
        });
    }
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.method === 'enableChatPlus') {  
    updateIcon();
  }
});

async function updateIcon() {
  await chrome.storage.sync.get('options', function(data) {
    try {    
      var iconPath = data.options.enableChatPlus 
        ? {
          "16": "../images/icon-16.png",
          "32": "../images/icon-32.png",
          "128": "../images/icon-128.png"
        }
        : {
          "16": "../images/icon-gray-32.png",
          "32": "../images/icon-gray-32.png",
          "128": "../images/icon-gray-128.png"
        };
      chrome.action.setIcon({path: iconPath});
    } catch (err){
      console.log('Error updating Icon', err);
    }
  });
};