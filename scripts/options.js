// In-page cache of the user's options
let options = {
  //enableChatPlus: true,
  //debug: false,
  //colorUsernames: true
};
var optionsForm = document.querySelector("optionsForm");

// Initialize the form with the user's option settings
chrome.storage.sync.get("options")
  .then((result) => {
    console.log('optionData result', result)
    Object.assign(options, result.options);
  });



console.log('options', options);
console.log('optionsForm', optionsForm);

optionsForm.enableChatPlus.checked = Boolean(options.enableChatPlus);
optionsForm.debug.checked = Boolean(options.debug);
optionsForm.colorUsernames.checked = Boolean(options.colorUsernames);

// Immediately persist options changes
optionsForm.enableChatPlus.addEventListener("change", (event) => {
  options.enableChatPlus = event.target.checked;
  chrome.storage.sync.set({ options });
});

optionsForm.debug.addEventListener("change", (event) => {
  options.debug = event.target.checked;
  chrome.storage.sync.set({ options });
});

optionsForm.colorUsernames.addEventListener("change", (event) => {
  options.colorUsernames = event.target.checked;
  chrome.storage.sync.set({ options });
});


