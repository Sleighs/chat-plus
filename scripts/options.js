// In-page cache of the user's options
const options = {};
const optionsForm = document.getElementById("optionsForm");

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

// Initialize the form with the user's option settings
const data = await chrome.storage.sync.get("options");
Object.assign(options, data.options);
optionsForm.enableChatPlus.checked = Boolean(options.enableChatPlus);
optionsForm.debug.checked = Boolean(options.debug);
optionsForm.colorUsernames.checked = Boolean(options.colorUsernames);