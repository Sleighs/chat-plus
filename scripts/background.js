////////   Background Initialization   ////////
const defaultOptions = {
  enableChatPlus: true,
  debug: false,
  colorUsernames: true,
  showUsernameListOnStartup: false,
  enableUsernameMenu: true
};
let options = {};

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get("options").then((result) => {
    var optionsList = [
      "enableChatPlus", 
      "debug", 
      "colorUsernames", 
      "showUsernameListOnStartup",
      "enableUsernameMenu"
    ];

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

    var newOptionObj = extractProperties(optionsList, result.options);
  
    chrome.storage.sync.set({ options: newOptionObj })
      .then(() => {
        console.log("Installed - set options", newOptionObj);
      });
  });
});


