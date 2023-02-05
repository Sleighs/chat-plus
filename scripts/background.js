////////   Background Initialization   ////////
const defaultOptions = {
  enableChatPlus: true,
  debug: false,
  colorUsernames: true
};
let options = {};

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get("options").then((result) => {

    if (result.options) {
      Object.assign(options, result.options);
      console.log("Installed - stored options" + JSON.stringify(result), options);
    } else {
      Object.assign(options, defaultOptions);
      console.log("Installed - default options", options);
    }
  });
  
  chrome.storage.sync.set({ options: options });
});

