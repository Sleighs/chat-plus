// In-page cache of the user's options
const options = {};
const popupOptionsForm = document.getElementById("popupOptionsForm");

// Initialize the form with the user's option settings
const data = await chrome.storage.sync.get("options");

Object.assign(options, data.options);

popupOptionsForm.enableChatPlus.checked = Boolean(options.enableChatPlus);
popupOptionsForm.debug.checked = Boolean(options.debug);
popupOptionsForm.colorUsernames.checked = Boolean(options.colorUsernames);

// Immediately persist options changes
popupOptionsForm.enableChatPlus.addEventListener("change", (event) => {
  options.enableChatPlus = event.target.checked;
  chrome.storage.sync.set({ options });
});

popupOptionsForm.debug.addEventListener("change", (event) => {
  options.debug = event.target.checked;
  chrome.storage.sync.set({ options });
});

popupOptionsForm.colorUsernames.addEventListener("change", (event) => {
  options.colorUsernames = event.target.checked;
  chrome.storage.sync.set({ options });
});
