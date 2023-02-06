////////   Installation   ////////

const defaultOptions = {
  enableChatPlus: true,
  debug: false,
  colorUsernames: true,
  showUsernameListOnStartup: false,
  enableUsernameMenu: false
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

    if ( result && result.options ) {
      let newOptionObj = extractProperties(optionsList, result.options);
      
      // Stores the options object in chrome.storage.sync
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


