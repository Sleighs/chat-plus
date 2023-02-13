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
  saveRants: false
};

// Options stored in chrome.storage.sync
let options = {};

let rantPopupType = "popup";

//"normal", "popup", "panel", "app", or "devtools"

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
      "saveRants"
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

  chrome.storage.sync.get("savedRants").then((result) => {
    if ( result && result.savedRants ) {
      console.log("Installed - savedRants retrieved", result.savedRants);
    } else {
      chrome.storage.sync.set({ testRants: [] })
        .then(() => {
          console.log("Installed - savedRants empty", []);
        });
    }
  });
});



//////   Testing  Background //////

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // 2. A page requested user data, respond with a copy of `user`
  if (message === 'store-rant') {
    chrome.storage.sync.get("savedRants").then((result) => {
      sendResponse(result);
    });
  }

  if (message === 'new-window') {
    //window.close();

    chrome.windows.create({
      url: chrome.runtime.getURL("build-rants/index.html"),
      type: rantPopupType
    }, (win)=>{
      //console.log(res);
      sendResponse(JSON.stringify(win));
    })
  }

});