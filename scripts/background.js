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
  chatAvatarEnabled: true
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
      "chatAvatarEnabled"
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

chrome.runtime.onStartup.addListener(() => {
  // Keep the service worker alive every 20 seconds
  var keepAliveInterval = setInterval(() => {
    chrome.runtime.sendMessage({
      method: "rantServiceWorker", 
      action: "keepAlive",
      from: 'background'
    });
  }, 20000);
  keepAliveInterval();
});

//////   MessageListener   //////
let rantTimeCounter = 0;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // 2. A page requested user data, respond with a copy of `user`
  if (message.method === 'rantServiceWorker') {
    if (message.action === 'keepAlive') {
      rantTimeCounter = rantTimeCounter + 20;
      sendResponse(rantTimeCounter);
    }
  }

  if (message.action === 'new-window') {
    // Close previous rant windows
    let windowOptions = {
      url: chrome.runtime.getURL("build-rants/index.html"),
      type: "normal",
    } 

    // Close previous rant windows
    chrome.windows.getAll({populate: true}, (windows) => {
      windows.forEach((window) => {
        window.tabs.forEach((tab) => {
          if (tab.url.includes("build-rants/index.html")) {
            chrome.windows.remove(window.id);
          }
        });
      });
    });

    // Open new rant window
    chrome.windows.create(windowOptions, (window)=>{
      sendResponse(JSON.stringify(window));
    });
  }
});
