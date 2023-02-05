////////   Background Initialization   ////////
const defaultOptions = {
  enableChatPlus: true,
  debug: false,
  colorUsernames: true
};
let options = {};

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get("options").then((result) => {
    var optionsList = ["enableChatPlus", "debug", "colorUsernames"];

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
    
    console.log( 
      "Installed - stored options", 
      'result: ' + JSON.stringify(result), 
      'newOptionsObj: ' + JSON.stringify(newOptionObj)
    );
    
    /*if (resultLength > 1) {
      Object.assign(options, result.options);
      console.log("Installed - stored options" + JSON.stringify(result), options);
    } else {
      Object.assign(options, defaultOptions);
      console.log("Installed - default options", options);
    }
  });*/
  
  chrome.storage.sync.set({ options: newOptionObj })
    .then(() => {
      console.log("Installed - set options", newOptionObj);
    });
  });
});


