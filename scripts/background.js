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

chrome.runtime.onStartup.addListener(() => {
  // Keep the service worker alive every 20 seconds
  var testInterval = setInterval(() => {
    chrome.runtime.sendMessage({method: "rantServiceWorker", action: "keepAlive"});
  }, 20000);
  testInterval();
});

//////   MessageListener   //////
let rantTimeCounter = 0;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // 2. A page requested user data, respond with a copy of `user`
  if (message === 'store-rant') {
    chrome.storage.sync.get("savedRants").then((result) => {
      sendResponse(result);
    });
  }

  if (message === 'new-window') {
    // Close previous rant windows
    let windowOptions = {
      url: chrome.runtime.getURL("build-rants/index.html"),
      type: rantPopupType
    }

    // Open new rant window
    chrome.windows.create(windowOptions, (win)=>{
      sendResponse(JSON.stringify(win));
    });

    //sendResponse()
  }

  if (message.method === 'rantServiceWorker') {
    if (message.action === 'keepAlive') {
      rantTimeCounter = rantTimeCounter + 20;
      sendResponse(rantTimeCounter);
    }
  }
});

/*
let portFromCS;

function connected(p) {
  if (p.message === 'new-rant-window') {
    // Close previous rant windows
    let windowOptions = {
      url: chrome.runtime.getURL("build-rants/index.html"),
      type: rantPopupType
    }

    // Open new rant window
    chrome.windows.create(windowOptions, (win)=>{
      sendResponse(JSON.stringify(win));
    });
  }

  portFromCS = p;
  portFromCS.postMessage({greeting: "hi there content script!"});
  portFromCS.onMessage.addListener((m) => {
    console.log("In background script, received message from content script")
    console.log(m.greeting);
  });
}


chrome.runtime.onConnect.addListener(connected);

// create the offscreen document if it doesn't already exist
async function createOffscreen() {
  if (await chrome.offscreen.hasDocument?.()) return;
  await chrome.offscreen.createDocument({
    url: 'offscreen.html',
    reasons: ['rantServiceWorker'],
    justification: 'keep service worker running',
  });
}
chrome.runtime.onStartup.addListener(() => {
  createOffscreen();
});

// a message from an offscreen document every 20 second resets the inactivity timer
chrome.runtime.onMessage.addListener(msg => {
  if (msg.keepAlive) console.log('keepAlive');
});



chrome.webNavigation.onBeforeNavigate.addListener(function(r){
  chrome.webRequest.onResponseStarted.addListener(function(details){

     //.............
     
        //.............
    
  },{urls: ["https://rumble.com/*"],types: ["main_frame"]});
},{
   url: [{hostContains:"rumble.com"}]
});

*/
