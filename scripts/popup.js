
// Link to the options page
document.getElementById('go-to-options').addEventListener('click', function() {
  if (chrome.runtime.openOptionsPage) {
    console.log('chrome runtime opened options page');
    chrome.runtime.openOptionsPage();
  } else {
    console.log('window opened options page');
    window.open(chrome.runtime.getURL('options.html'));
  }
});



/*
// User's options
var docElement = document.documentElement;
console.log('docElement', docElement)

let popupOptions = {};

// Initialize the form with the user's option settings
(() => {
  chrome.storage.sync.get("options").then((result) => {
  //console.log('popupData result', result)
  Object.assign(popupOptions, result.options);
});
})();

setTimeout(() => {
  console.log('popupOptions', popupOptions)
}, 1000);


const popupOptionsForm = document.getElementById("popup");
console.log('popupOptionsForm', popupOptionsForm)

function setPopupOptions() {
  popupOptionsForm.enableChatPlus.checked = Boolean(popupOptions.enableChatPlus);
  popupOptionsForm.debug.checked = Boolean(popupOptions.debug);
  popupOptionsForm.colorUsernames.checked = Boolean(popupOptions.colorUsernames);
}

// Immediately persist options changes
popupOptionsForm.enableChatPlus.addEventListener("change", (event) => {
  popupOptions.enableChatPlus = event.target.checked;
  chrome.storage.sync.set({ popupOptions });
});

popupOptionsForm.debug.addEventListener("change", (event) => {
  popupOptions.debug = event.target.checked;
  chrome.storage.sync.set({ popupOptions });
});

popupOptionsForm.colorUsernames.addEventListener("change", (event) => {
  popupOptions.colorUsernames = event.target.checked;
  chrome.storage.sync.set({ popupOptions });
});
*/


   
