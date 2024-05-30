////////   Installation   ////////

var browser = browser || chrome;

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
};

// Options stored in browser.storage.sync
let options = {};

// Initial setup
browser.runtime.onInstalled.addListener(() => {
  browser.storage.sync.get("options").then((result) => {
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

    // Stores the options object in browser.storage.sync
    if ( result && result.options ) {
      let newOptionObj = extractProperties(optionsList, result.options);
        
      browser.storage.sync.set({ options: newOptionObj })
        .then(() => {
          console.log("Installed - set options", newOptionObj);
        });
    } else {
      browser.storage.sync.set({ options: defaultOptions })
        .then(() => {
          console.log("Installed - default options", defaultOptions);
        });
    }
  });
});

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.method === 'enableChatPlus') {  
    updateIcon();
  }
});

async function updateIcon() {
  await browser.storage.sync.get('options', function(data) {
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
        browser.action.setIcon({path: iconPath});
    } catch (err){
      console.log('Error updating Icon', err);
    }
  });
};