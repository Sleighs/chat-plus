//////   Define Variables   //////

// Default options
let optionsState = {
  enableChatPlus: true,
  colorUsernames: true,
  enableUsernameMenu: true,
  showUsernameListOnStartup: false,
  popupBelow: false,
  playVideoOnPageLoad: false,
  hideFullWindowChatButton: false,
  showListUserCount: false,
  chatStyleNormal: true,
  saveRants: false,
  chatAvatarEnabled: true,
  normalChatColors: true
};

// Undefined option vars
let enableChatPlus, 
  colorUsernames, 
  enableUsernameMenu,
  showUsernameListOnStartup,
  popupBelow,
  playVideoOnPageLoad,
  hideFullWindowChatButton,
  showListUserCount,
  chatStyleNormal,
  saveRants,
  chatAvatarEnabled,
  normalChatColors;

// Vars that remain in scope
let debugMode = false;
let showUsernameList = false;
let streamerMode = false;
let showFullWindowChat = false;
let caretPosition, caretStart, atCaretPossition;

// Vars for logged in user and current streamer 
let currentUser = '';
let currentStreamer = '';

// Chat history
let currentChatHistory = [];
var userCount = 0;

// Rants
let savedRants = [];

// Text colors
let usernameColors = {
  chatplus: '#C2E1FE',
  divaPink: '#FF63B4', 
  magenta: '#BD03E5',
  electricPurple: '#850DF4',
  streamerRed: '#EA0101',
  sundayRed: '#FFBBB1',
  brightYellow: '#FFFF4A',
  orange: 'orange',
  springGreen: '#B9E50B',
  streamerGreen: '#15FF8D',
  grassGreen: '#05C305',
  marinerTeal: '#48A4A0',
  coolBlue: '#07F7F7',
  dreamyBlue: '#2DA3FB'
}

let messageColors = { 
  chatPlusO: '#E0E9F2',
  chatplus: '#C2E1FE',
  rumble: '#d6e0ea',
  rumbler: '#88a0b8',
  white: '#FFFFFF',
}
let rumbleColors = {
  text: '#d6e0ea',
  green: '#85C742',
  blue: '#10212F',
  darkBlue: '#061726'
}

// For assigned colors
let userColors = {};





//////   Initialize App   ///////

// Get options from storage and initialize extension
(async () => {
  //console.log('Running ChatPlus...')

  await chrome.storage.sync.get("options")
  .then(function (result) {
    const defaultOptions = {
      enableChatPlus: true,
      colorUsernames: true,
      enableUsernameMenu: true,
      showUsernameListOnStartup: false,
      popupBelow: false,
      playVideoOnPageLoad: false,
      hideFullWindowChatButton: false,
      showListUserCount: false,
      chatStyleNormal: true,
      saveRants: false,
      chatAvatarEnabled: true,
      normalChatColors: false,
    };

    const optionsList = [
      "enableChatPlus", 
      "colorUsernames", 
      "enableUsernameMenu",
      "showUsernameListOnStartup",
      "popupBelow",
      "playVideoOnPageLoad",
      "hideFullWindowChatButton",
      "showListUserCount",
      "chatStyleNormal",
      "saveRants",
      "chatAvatarEnabled",
      "normalChatColors"
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
    };

    // Get options from storage
    if (result && result.options){
      // Create new object with the wanted properties, filling in defaults for missing ones
      let newOptionObj = extractProperties(optionsList, result.options);

      enableChatPlus = newOptionObj.enableChatPlus;
      colorUsernames = newOptionObj.colorUsernames;      
      enableUsernameMenu = newOptionObj.enableUsernameMenu;
      showUsernameListOnStartup = newOptionObj.showUsernameListOnStartup;
      popupBelow = newOptionObj.popupBelow;
      playVideoOnPageLoad = newOptionObj.playVideoOnPageLoad;
      hideFullWindowChatButton = newOptionObj.hideFullWindowChatButton;
      showListUserCount = newOptionObj.showListUserCount;
      chatStyleNormal = newOptionObj.chatStyleNormal;
      saveRants = newOptionObj.saveRants;
      chatAvatarEnabled = newOptionObj.chatAvatarEnabled;
      normalChatColors = newOptionObj.normalChatColors;

      Object.assign(optionsState, newOptionObj);
    } else {
      enableChatPlus = defaultOptions.enableChatPlus;
      colorUsernames = defaultOptions.colorUsernames;      
      enableUsernameMenu = defaultOptions.enableUsernameMenu;
      showUsernameListOnStartup = defaultOptions.showUsernameListOnStartup;
      popupBelow = defaultOptions.popupBelow;
      playVideoOnPageLoad = defaultOptions.playVideoOnPageLoad;
      hideFullWindowChatButton = defaultOptions.hideFullWindowChatButton;
      showListUserCount = defaultOptions.showListUserCount;
      chatStyleNormal = defaultOptions.chatStyleNormal;
      saveRants = defaultOptions.saveRants;
      chatAvatarEnabled = defaultOptions.chatAvatarEnabled;
      normalChatColors = defaultOptions.normalChatColors;

      Object.assign(optionsState, defaultOptions);
    } 

    // If app is enabled
    if (enableChatPlus) {
      // Check if chat exists
      if (document.querySelector('.chat-history')){
        // Get chat history
        getChatHistory();

        // Add username menu
        if (enableUsernameMenu) {
          addChatUsernameMenu();          
          addUserListBtn();
          if(showUsernameListOnStartup) toggleChatUsernameMenu(true);
        }

        // Add chat menu buttons
        addFullWindowBtn();

        // Observe chat for changes to its child elements to detect new messages
        chatObserver.observe(document.querySelector('#chat-history-list'), { childList: true });

        setListeners();
        setIntervals();
      }

      // Autoplay video on page load
      try {
        function playVideoContent(){
          let isStream = false;
          let videos = document.querySelectorAll('video');

          if (videos.length > 0) {
            if (
              document.querySelectorAll('.streamed-on').length > 0
              || document.querySelectorAll('.watching-now').length > 0
            ) {
              isStream = true;
            }

            videos.forEach((video) => {
              if (isStream) {
                video.autoplay = true;
                // Set timeout to allow video to play after a few seconds, 
                  // Manual override
                setTimeout(() => {
                  video.play();
                  video.click();
                }, 1500);
              } else {
                video.play();
              }
            });
          }
        }

        // Play video on page load if enabled
        if (playVideoOnPageLoad && document.querySelectorAll('video').length > 0) {
          playVideoContent();
        }
      } catch (err) {
        //if (debugMode) console.log(err);
      }
    }    
  });  
})();





//////   Chat History  //////

// Gets random color from usernameColors object
const getRandomColor = () => {
  const colors = Object.values(usernameColors);
  return colors[Math.floor(Math.random() * colors.length)];
}

try {
  // Get current user from page if logged in
  let rantEle = document.querySelectorAll('.chat-history--rant-head');
  let usernameEle = document.querySelectorAll('.chat-history--rant-username');

  if (rantEle && usernameEle) {
    if (usernameEle.length > 0) {
      currentUser = usernameEle[usernameEle.length - 1].textContent;
      chrome.storage.local.set({ currentUser });
    } else {
      chrome.storage.local.get(['currentUser'], (result) => {
        currentUser = result.currentUser;
      });
    } 
  }
  

  // Get current streamer from author element if exists
  const authorEle = document.querySelector('.media-by--a');

  if (authorEle){
    const authorHref = authorEle.getAttribute('href');
    currentStreamer = authorHref.replace('/c/', '');
  }
} catch (error) {
  //if (debugMode) console.log('Error getting current user or streamer', error);
}

// Get chat elements
let chatHistoryEle = document.querySelectorAll('.chat-history');
let chatHistoryList = document.getElementById('chat-history-list');
let chatHistoryRows = document.querySelectorAll('.chat-history--row');
let chatHistoryNames = document.querySelectorAll('.chat-history--username');
let chatHistoryMessages = document.querySelectorAll('.chat-history--message');

// Retrieves user color from userColor object
const getUserColor = (username, color) => {
  if (color) {
    userColors[username] = color;
  } else if (colorUsernames === false ){
    userColors[username] = usernameColors.rumbler;
  } else if (!userColors[username]) {
    userColors[username] = getRandomColor();
  }
  return userColors[username];
}

function getUserCount(userList){
  let count = 0;
  for (let user in userList) {
    if (userList.hasOwnProperty(user)) {
      count++;
    }
  }
  return count;
}

function highlightTerms(text, searchTerms, bgColors) {
  let result = text;
  searchTerms.forEach(function(term, index) {
    let bgColor = bgColors[index % bgColors.length];
    let regex = new RegExp(term, "gi");
    result = result.replace(regex, `<span style="background-color: ${bgColor};">${term}</span>`);
  });
  return result;
}

const getChatHistory = () => {
  currentChatHistory = [];

  try {
    let listRows = chatHistoryList.querySelectorAll('.chat-history--row');

    listRows.forEach((ele, index) => {
      //if (index < 5) console.log('ele', ele);

      // Check element classlist for 'chat-history--rant' and skip row
      if (ele.classList.contains('chat-history--rant')) {
        return;
      }

      // Remove avatar if chatAvatarEnabled is false
      if (!chatAvatarEnabled
        && ele.childNodes[0].classList.contains("chat-history--user-avatar")
      ){
        ele.querySelector(".chat-history--user-avatar").style.display = "none";
      }

      let element = ele.querySelector('.chat-history--message-wrapper');
      let usernameEle = element.querySelector('.chat-history--username');

      //console.log('username ' + index, username)

      //Assign random color to each unique username in current chat history
      let userColor;

      if (!normalChatColors) {
        userColor = getUserColor(usernameEle.querySelector('a').textContent, null);

      } else {
        userColor = getUserColor(usernameEle.querySelector('a').textContent, usernameEle.querySelector('a').style.color);

      }

      if (!normalChatColors){
        // Assign text color to username and message
        usernameEle.querySelector('a').style.color = userColor;
      }

      // Assign background color to row if chatStyleNormal is on
      if (chatStyleNormal) element.style.background = rumbleColors.darkBlue;

      // Highlight current user's username when tagged with '@'
      if ( currentUser && currentUser.length > 2 ){
        if (
          element.childNodes[1].textContent.toLowerCase().includes(('@' + currentUser).toLowerCase()) ||
          element.childNodes[1].textContent.toLowerCase().includes(('@' + currentStreamer).toLowerCase())
        ) {
          element.childNodes[1].innerHTML = highlightTerms(
            element.childNodes[1].textContent, 
            ['@' + currentUser, '@' + currentStreamer], 
            ['rgb(234, 100, 4, .7)', 'rgb(187, 194, 11, .5)']
          );
        } else if (
          element.childNodes[1].textContent.toLowerCase().includes((currentUser).toLowerCase())
          || element.childNodes[1].textContent.toLowerCase().includes((currentStreamer).toLowerCase())
        ) {
          element.childNodes[1].innerHTML = highlightTerms(
            element.childNodes[1].textContent, 
            [currentUser, currentStreamer], 
            ['rgb(234, 100, 4, .7)', 'rgb(187, 194, 11, .5)']
          );
        }
      }

      // Add the message to the chat history
      currentChatHistory.push({
        username: usernameEle.querySelector('a') && usernameEle.querySelector('a').textContent,
        message: element.childNodes[1].textContent,
        color: userColor,
        date: Date.now(),
      });
    });
  } catch (error) {
    if (debugMode) console.log('Error getting chat history', error);
  }
};





///////   Username List Popup    ///////

// Get page coordinates of the message input caret position
function getPageCoordinates(element) {
  var rect = element.getBoundingClientRect();
  return {
    x: rect.left + window.pageXOffset,
    y: rect.top + window.pageYOffset,
    left: rect.left + window.pageXOffset,
    top: rect.top + window.pageYOffset,
  };
}

// Get caret position in message input
function storeCaretPosition(input) {
  const caretPosition = input.selectionStart;
  return caretPosition;
}

// Inserts a username into a message
function insertUsername(username, message, caretPos, atPos) {
  // Get the position of the last @ before the caretPos
  const lastAtPos = message.slice(0, caretPos).lastIndexOf('@');
  // Return the message with the username inserted
  return message.slice(0, lastAtPos) + '@' + username + ' ' + message.slice(caretPos);
}

// Open popup with username list
const openChatUsernamesPopup = (coordinates) => {
  // Create element for popup
  let popup = document.createElement('div');

  // Get dimensions of the message input
  let popupAdjustedHeight = document.getElementById("chat-message-text-input").clientHeight;
  let popupAdjustedWidth = document.getElementById("chat-message-text-input").clientWidth;

  popup.classList.add('chat-plus-popup');
  popup.style.position = 'relative';
  popup.style.width = '100%';
  popup.style.maxWidth = popupAdjustedWidth - 14 + 'px';
  popup.style.height = '100%';
  popup.style.maxHeight = '140px';
  popup.style.overflowY = 'scroll';
  popup.style.overflowX = 'auto';
  popup.style['-ms-overflow-style'] = 'none';
  popup.style.backgroundColor = '#061726';
  popup.style.borderRadius = '5px';
  popup.style.zIndex = '199';
  popup.style.outline = '1px solid rgba(136,136,136,.25)';
  popup.style.outlineOffset = '0px';

  // Position popup
  popup.style.position = 'absolute';
  popup.style.left = coordinates.left + 'px';

  if (popupBelow){
    //Show popup below message input
    popup.style.top = coordinates.top + popupAdjustedHeight + 5 + 'px';
  } else {
    // Show popup above message input
    popup.style.top = coordinates.top - 145 + 'px';
  }
  
  // Create a list element
  let popupContent = document.createElement('ul');
  popupContent.classList.add('chat-plus-popup-content');
  popupContent.style.position = 'relative';
  popupContent.style.width = '100%';
  popupContent.style.height = '100%';
  popupContent.style.zIndex = '199';
  popupContent.style.overflow = 'auto';
  popup.appendChild(popupContent);

  // Append popup to page
  document.body.appendChild(popup);

  // Focus popup
  document.querySelector('.chat-plus-popup').focus();

  populateMentionPopup();
}

const populateMentionPopup = (text) => {
  // Define popup element
  let popup = document.querySelector('.chat-plus-popup');
  // Define popup list element
  let popupContent = document.querySelector('.chat-plus-popup-content');

  // Remove all children from username list
  while (popupContent && popupContent.firstChild) {
    popupContent.removeChild(popupContent.firstChild);
  }

  // Sort userColors object by username
  function sortObjectByPropName(obj) {
    const sorted = {};
    
    Object.keys(obj)
      .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
      .forEach((key, index) => {
        // Get caret position
        let thisCaret = storeCaretPosition(document.getElementById('chat-message-text-input'));
        // Get text from message input
        let thisText = document.getElementById('chat-message-text-input').value;
        // Get the typed text after the caret position
        let textBetweenIndexes = thisText.substring(caretStart, thisCaret);
        
        // If there is no typed text or the text includes a space, add all usernames to the list. 
        if (
          textBetweenIndexes == null 
          || textBetweenIndexes.length == ''
          || textBetweenIndexes.includes(' ')
        ){
          sorted[key] = obj[key];
        } else 
        // Otherwise add usernames that match the typed text to the list
        if (key.toLowerCase().includes(textBetweenIndexes.toLowerCase())) {
          sorted[key] = obj[key];
        }
      });

    return sorted;
  }
  let sortedUserColors = sortObjectByPropName(userColors);

  // Loop through sortedUserColors object and add usernames to popup content
  for (let user in sortedUserColors) {
    let usernameTextElement = document.createElement('li');
    usernameTextElement.style.color = sortedUserColors[user];
    usernameTextElement.style.fontSize = '1.1rem';
    usernameTextElement.style.listStyle = 'none';
    usernameTextElement.style.cursor = 'pointer';
    usernameTextElement.style.fontWeight = 'bold';
    usernameTextElement.style.padding = '0 7px';
    usernameTextElement.innerHTML = user;
    popupContent.appendChild(usernameTextElement);

    // Add hover effect
    usernameTextElement.addEventListener('mouseover', () => {
      usernameTextElement.style.backgroundColor = 'rgba(255,255,255,.1)';
    });
    // Remove hover effect
    usernameTextElement.addEventListener('mouseout', () => {
      usernameTextElement.style.backgroundColor = 'transparent';
    });

    usernameTextElement.addEventListener('click', () => {
      // Add username to chat message input
      let messageEle = document.getElementById('chat-message-text-input')
      let messageVal = messageEle.value;
      const input = document.querySelector("input[type='text']");
      const caretPosition = storeCaretPosition(messageEle);

      // Add username to message input
      document.getElementById('chat-message-text-input').value = document.getElementById('chat-message-text-input').value + insertUsername(user, messageVal, caretPosition);
            
      // Remove popup
      popup.remove();

      // Focus on chat message input
      document.getElementById('chat-message-text-input').focus();
    });
  }
}

const clearMentionPopup = () => {
  // Define popup element
  let popup = document.querySelector('.chat-plus-popup');
  // Define popup list element
  if (popup) popup.remove();
  // reset caretStart
  caretStart = null;
}





///////   Main Chat Username List   ///////

// Add username list tab to chat window
const addChatUsernameMenu = () => {
  // Create container element
  let usernameMenuContainer = document.createElement('div');
  let usernameMenuContainer2 = document.createElement('div');

  // Add hover effect to container 1
  usernameMenuContainer.addEventListener('mouseover', () => {
    usernameMenuContainer.style.backgroundColor = 'rgba(255,255,255,.1)';
  });
  // Remove hover effect
  usernameMenuContainer.addEventListener('mouseout', () => {
    usernameMenuContainer.style.backgroundColor = 'transparent';
  });
  
  // Add width to container 2
  if (streamerMode){
    usernameMenuContainer2.style.width = '17%';
  } else {
    usernameMenuContainer2.style.minWidth = '105px';
    usernameMenuContainer2.style.width = '100%';
    usernameMenuContainer2.style.maxWidth = '22%';
  }

  // Create first container for toggle button
  usernameMenuContainer.classList.add('username-menu-toggle-container');
  usernameMenuContainer.style.position = 'absolute';//'relative';
  usernameMenuContainer.style.width = '100%';
  usernameMenuContainer.style.maxWidth = '12px';
  usernameMenuContainer.style.height = '100%';
  usernameMenuContainer.style.boxSizing = 'border-box';
  usernameMenuContainer.style.overflow = 'hidden';
  //usernameMenuContainer.style.zIndex = '190';
  usernameMenuContainer.style.borderLeft = `solid 1pt rgb(255,255,255,0)`;
  usernameMenuContainer.style.display = 'flex';
  usernameMenuContainer.style.flexDirection = 'column';
  usernameMenuContainer.style.justifyContent = 'center';
  usernameMenuContainer.style.alignItems = 'center';
  usernameMenuContainer.style.cursor = 'pointer';
  usernameMenuContainer.style.top = '0';
  usernameMenuContainer.style.left = '0';

  // Create second container for list
  usernameMenuContainer2.classList.add('username-menu-container2');
  usernameMenuContainer2.style.height = '100%';
  usernameMenuContainer2.style.position = 'relative';
  usernameMenuContainer2.style.backgroundColor = 'transparent';
  usernameMenuContainer2.style.borderLeft = `solid 1pt rgb(255,255,255,0.25)`;
  usernameMenuContainer2.style.display = 'none';
  usernameMenuContainer2.style.flexDirection = 'column';
  usernameMenuContainer2.style.alignItems = 'flex-start';
  usernameMenuContainer2.style.justifyContent = 'center';
  //usernameMenuContainer2.style.zIndex = '190';
  
  // Create toggle button element for container 1
  let usernameMenuButton = document.createElement('div');
  //usernameMenuButton.title = 'Toggle Recent Users';
  usernameMenuButton.classList.add('username-menu-toggle-button');
  usernameMenuButton.style.width = '100%';
  usernameMenuButton.style.height = '100%';
  usernameMenuButton.style.color = rumbleColors.text;
  usernameMenuButton.style.boxSizing = 'border-box';
  //usernameMenuButton.style.zIndex = '195';
  usernameMenuButton.style.display = 'flex';
  usernameMenuButton.style.justifyContent = 'center';
  usernameMenuButton.style.alignItems = 'center';
  usernameMenuButton.style.textAlign = 'center';
  usernameMenuButton.style.cursor = 'pointer';
  usernameMenuButton.addEventListener('click', () => {
    toggleChatUsernameMenu(
      !showUsernameList 
      //? false : true\
      );
  });

  // Create text element for toggle button 
  let usernameMenuButtonText = document.createElement('div');
  usernameMenuButtonText.classList.add('username-menu-toggle-button-text');
  usernameMenuButtonText.style.width = 'fit-content';
  usernameMenuButtonText.style.height = 'fit-content';
  usernameMenuButtonText.style.marginTop = '-6%';//'-20px';
  //usernameMenuButtonText.style.zIndex = '189';
  usernameMenuButtonText.style.color = 'rgb(255,255,255,0.45)';
  usernameMenuButtonText.style.writingMode = 'vertical-rl';
  usernameMenuButtonText.style.transform = 'rotate(180deg)';
  usernameMenuButtonText.style.fontWeight = 'bold';
  usernameMenuButtonText.style.textAlign = 'center';
  usernameMenuButtonText.style.opacity = '0.3';
  usernameMenuButtonText.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="currentColor" class="bi bi-chevron-right" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/></svg>`;
  
  // Create button container
  let usernameMenuButtonContainer = document.createElement('div');
  usernameMenuButtonContainer.classList.add('username-menu-button-container');
  usernameMenuButtonContainer.style.width = '100%';
  usernameMenuButtonContainer.style.height = '17px';
  usernameMenuButtonContainer.style.background = 'rgb(133, 199, 66, 1)';
  usernameMenuButtonContainer.style.display = 'flex';
  usernameMenuButtonContainer.style.alignItems = 'center';
  usernameMenuButtonContainer.style.justifyContent = 'space-between';
  usernameMenuButtonContainer.style.color = rumbleColors.darkBlue;
  
  // Create close button
  let usernameMenuCloseButton = document.createElement('div');
  usernameMenuCloseButton.classList.add('username-menu-list-button');
  usernameMenuCloseButton.title = 'Close List';
  usernameMenuCloseButton.style.width = '20%';
  usernameMenuCloseButton.style.height = '100%';
  //usernameMenuCloseButton.style.zIndex = '199';
  usernameMenuCloseButton.style.display = 'flex';
  usernameMenuCloseButton.style.justifyContent = 'center';
  usernameMenuCloseButton.style.alignItems = 'center';
  usernameMenuCloseButton.style.cursor = 'pointer';  
  usernameMenuCloseButton.style.opacity = '0.36';
  usernameMenuCloseButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="currentColor" class="bi bi-x-circle-fill" viewBox="0 0 16 16">T<path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/></svg>`;
  usernameMenuCloseButton.onclick = function(){
    toggleChatUsernameMenu(false);
  };
  // Add hover effect
  usernameMenuCloseButton.addEventListener('mouseover', () => {
    usernameMenuCloseButton.style.background = 'rgb(0,0,0,0.25)';
  });
  // Remove hover effect
  usernameMenuCloseButton.addEventListener('mouseout', () => {
    usernameMenuCloseButton.style.background = 'transparent';
  });

  // Add a Refresh menu button 
  let usernameMenuRefreshButton = document.createElement('div');
  usernameMenuRefreshButton.classList.add('username-menu-refresh-button');
  usernameMenuRefreshButton.title = 'Refresh List';
  usernameMenuRefreshButton.style.width = '42%';
  usernameMenuRefreshButton.style.height = '100%';
  usernameMenuRefreshButton.style.fontSize = '0.83rem';
  //usernameMenuRefreshButton.style.zIndex = '199';
  usernameMenuRefreshButton.style.display = 'flex';
  usernameMenuRefreshButton.style.justifyContent = 'right';
  usernameMenuRefreshButton.style.alignItems = 'center';
  usernameMenuRefreshButton.style.paddingRight =  '5px'; 
  usernameMenuRefreshButton.style.cursor = 'pointer';
  usernameMenuRefreshButton.style.opacity = '0.75';
  setTimeout(() => {
    usernameMenuRefreshButton.innerHTML = (
      showListUserCount 
        ? `<span style="width: fit-content;">${getUserCount(userColors)}</span>`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="currentColor" class="bi bi-arrow-clockwise" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/><path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/></svg>`
    );
  }, 1500);
  usernameMenuRefreshButton.onclick = function(){
    // Build new username list
    buildUsernameList(false)

    // Update user count
    usernameMenuRefreshButton.innerHTML = (
      showListUserCount 
        ? `<span>${getUserCount(userColors)}</span>`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="currentColor" class="bi bi-arrow-clockwise" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/><path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/></svg>`
    );
  };
  // Add hover effect
  usernameMenuRefreshButton.addEventListener('mouseover', () => {
    usernameMenuRefreshButton.style.background = 'rgb(0, 0, 0, 0.25)';
  });
  // Remove hover effect
  usernameMenuRefreshButton.addEventListener('mouseout', () => {
    usernameMenuRefreshButton.style.background = 'transparent';
  });
  // Add flash effect
  usernameMenuRefreshButton.addEventListener('click', () => {
    setTimeout(() => {
      usernameMenuRefreshButton.style.background = 'rgb(7, 247, 247, 0.5)';
      setTimeout(() => {
        usernameMenuRefreshButton.style.background = 'transparent';
      }, 500);
    }, 100);
  });

  // Add buttons to wrapper
  usernameMenuButtonContainer.appendChild(usernameMenuCloseButton);
  usernameMenuButtonContainer.appendChild(usernameMenuRefreshButton);
  // Add button wrapper to list container
  usernameMenuContainer2.appendChild(usernameMenuButtonContainer);
  usernameMenuContainer2.appendChild(buildUsernameList(true));
  
  // Add text element to button
  usernameMenuButton.appendChild(usernameMenuButtonText);
  usernameMenuContainer.appendChild(usernameMenuButton);
  // Add container to page
  chatHistoryEle[0].appendChild(usernameMenuContainer);
  chatHistoryEle[0].appendChild(usernameMenuContainer2);
  
  // Add menu toggle to class=chat--header-buttons-wrapper
  //let chatHeaderButtons = document.querySelector('.chat--header-buttons-wrapper');
  chatHistoryList.appendChild(usernameMenuContainer);

  // Bring chat menu to front
  document.querySelector('#chat-main-menu').style.zIndex = '1900';
};

// Build and return recent user list
const buildUsernameList = (appended) => {
  // Get username menu container
  let usernameMenuList = document.querySelector('.username-menu-list');
  
  // Clear username list exists
  if (usernameMenuList){
    while (usernameMenuList.firstChild) {
      usernameMenuList.removeChild(usernameMenuList.firstChild);
    }
  } else {
    // Make new list
    usernameMenuList = document.createElement('ul');

    // Create username list element    
    usernameMenuList.classList.add('username-menu-list');
    usernameMenuList.style.position = 'relative';
    usernameMenuList.style.width = '100%';
    usernameMenuList.style.height = '100%';
    //usernameMenuList.style.zIndex = '195';
    usernameMenuList.style.overflow = 'scroll';
    usernameMenuList.style.boxSizing = 'border-box';
    usernameMenuList.style.padding = '6px 0';
  }
  
  // Sort userColors object by username
  function sortObjectByPropName(obj) {
    const sorted = {};
    Object.keys(obj)
      .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
      .forEach(key => {
        sorted[key] = obj[key];
      });
    return sorted;
  }

  const sortedUserColors = sortObjectByPropName(userColors);

  // Loop through sortedUserColors object and add usernames to popup content
  for (let user in sortedUserColors) {
    let usernameTextElement = document.createElement('li');

    // Add hover effect
    usernameTextElement.addEventListener('mouseover', () => {
      usernameTextElement.style.backgroundColor = 'rgba(255,255,255,.1)';
    });
    // Remove hover effect
    usernameTextElement.addEventListener('mouseout', () => {
      usernameTextElement.style.backgroundColor = 'transparent';
    });
    
    if (streamerMode){
      usernameTextElement.style.fontSize = '1.1rem';
    } else {
      usernameTextElement.style.fontSize = '.95rem';
    }
    usernameTextElement.style.color = sortedUserColors[user];
    usernameTextElement.style.listStyle = 'none';
    usernameTextElement.style.cursor = 'pointer';
    usernameTextElement.style.fontWeight = 'bold';
    //usernameTextElement.style.zIndex = '195';
    usernameTextElement.style.padding = '0 6px';
    usernameTextElement.innerHTML = user;

    // Add username to list
    usernameMenuList.appendChild(usernameTextElement);

    usernameTextElement.addEventListener('click', () => {
      // Add username to chat message input
      let messageEle = document.getElementById('chat-message-text-input')
      let messageVal = messageEle.value;
      const input = document.querySelector("input[type='text']");
      const caretPosition = storeCaretPosition(messageEle);

      // Add username to message input
      document.getElementById('chat-message-text-input').value = document.getElementById('chat-message-text-input').value + insertUsername(user, messageVal, caretPosition);
    });
  }

  if (appended) {
    return usernameMenuList;
  }
}

// Add username list menu to page
const toggleChatUsernameMenu = (toggle) => {
  let usernameMenuContainer2 = document.querySelector('.username-menu-container2');
  let userListBtn = document.querySelector('#userListBtn');
  
  // Update global variable
  showUsernameList = toggle;

  if (toggle) {
    // Set display to flex
    usernameMenuContainer2.style.display = 'flex';

    // Add width
    if (streamerMode){
      usernameMenuContainer2.style.width = '17%';
      usernameMenuContainer2.style.height = '100%';
      usernameMenuContainer2.style.maxHeight = document.querySelector('#chat-history-list').offsetHeight + 'px';
    } else {
      usernameMenuContainer2.style.minWidth = '105px';
      usernameMenuContainer2.style.width = '100%';
      usernameMenuContainer2.style.maxWidth = '22%';
    }

    // Change button icon
    document.querySelector('.username-menu-toggle-button-text').innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="currentColor" class="bi bi-chevron-left" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/></svg>`    

    // Gets new user list
    buildUsernameList(false);

    // Change button text
    //userListBtn.innerText = 'Hide Recent List';
  } else {
    // Hide container
    usernameMenuContainer2.style.display = 'none';

    // Change button text
    //userListBtn.innerText = 'Show Recent List';
    
    // Change button icon
    document.querySelector('.username-menu-toggle-button-text').innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="currentColor" class="bi bi-chevron-right" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/></svg>`;    
  }
};





//////   In Page Options   //////

const toggleStreamerMode = (toggle) => {
  streamerMode = toggle;

  if (toggle) {
    if (!enableUsernameMenu){
      // Hide username list if open
      if (showUsernameList){
        toggleChatUsernameMenu(false);
      }
      addChatUsernameMenu();
    }
    
    // Hide comments
    if (document.getElementById("video-comments")) document.getElementById("video-comments").style.display = 'none';
    // Hide video player
    if (document.querySelector(".main-content")) document.querySelector(".main-content").style.display = 'none';
    // Hide recommended videos
    if (document.querySelector(".mediaList-list")) document.querySelector(".mediaList-list").style.display = 'none';
    // Hide header
    if (document.querySelector(".header")) document.querySelector(".header").style.display = 'none';
    // Hide footer
    if (document.querySelector(".foot")) document.querySelector(".foot").style.display = 'none';    
    // Hide chat visibility and pop-out button in chat menu
    if (document.querySelector("#chat-main-menu")) document.querySelector("#chat-toggle-chat-visibility").style.display = 'none';
    if (document.querySelector("#chat-main-menu")) document.querySelector("#chat-toggle-popup").style.display = 'none';
    // Hide rant button
    if (document.querySelector(".chat--rant")) document.querySelector(".chat--rant").style.display = 'none';

    try {
      // Pause all video elements
      const videoElements = document.querySelectorAll("video");

      videoElements.forEach((videoElement) => {
        videoElement.pause();
      });
    } catch (error) {
      //if (debugMode) console.log(error);
    }

    try {
      // Get 'main' element and set height to viewport height
      let mainEle = document.querySelector("main");
      mainEle.style.padding = 0;
      mainEle.style.margin = 0;
      mainEle.style.maxHeight = '100vh';
      mainEle.style.height = '100%';
      mainEle.style.position = 'relative';
      //mainEle.style.overflow = 'hidden';

      // .main-and-sidebar
      let mainAndSidebarEle = document.querySelector(".main-and-sidebar");
      mainAndSidebarEle.style.height = '100%';
      mainAndSidebarEle.style.position = 'relative';
      mainAndSidebarEle.style.margin = 0;
      mainAndSidebarEle.style.padding = 0;

      // .constrained 
      let mainChildEle = document.querySelector(".constrained");
      mainChildEle.style.padding = 0;
      mainChildEle.style.margin = 0;
      mainChildEle.style.boxSizing = 'border-box';
      mainChildEle.style.height = '100%';
      mainChildEle.style.maxHeight = '100vh';
      mainChildEle.style.position = 'relative';
      //mainChildEle.style.overflow = 'hidden';

      // .sidebar
      let sidebarEle = document.querySelector(".sidebar");  
      sidebarEle.style.fontSize = '1.2rem';
      sidebarEle.style.margin = 0;
      sidebarEle.style.padding = 0;
      sidebarEle.style.position = 'relative';
      sidebarEle.style.height = '100%';
      sidebarEle.style.maxHeight = '100vh';
      sidebarEle.style.width = '100%';
      sidebarEle.style.minWidth = '100vw';

      // .chat 
      let chatContainerEle = document.querySelector(".chat");
      chatContainerEle.style.position = 'relative';
      chatContainerEle.style.margin = 0;
      chatContainerEle.style.padding = 0;
      chatContainerEle.style.height = '100%';
      chatContainerEle.style.maxHeight = '100vh';
      chatContainerEle.style.width = '100%';
      //chatContainerEle.style.overflow = 'scroll';

      // .chat--history
      let chatHistoryElement = document.querySelector(".chat--container");
      chatHistoryElement.style.position = 'relative';
      chatHistoryElement.style.margin = 0;
      chatHistoryElement.style.padding = 0;
      chatHistoryElement.style.height = '100%';

      // .container
      let containerEle = document.querySelector(".container");
      containerEle.style.position = 'relative';
      containerEle.style.margin = 0;
      containerEle.style.height = '90%';

      // .chat--height
      let chatListElement = document.querySelector(".chat--height");
      chatListElement.style.position = 'relative';
      chatListElement.style.height = '100%';
      chatListElement.style.maxHeight = '85vh';
      
      // .chat--header
      let chatHeaderElement = document.querySelector(".chat--header");
      chatHeaderElement.style.position = 'relative';
      chatHeaderElement.style.height = '6vh';
      chatHeaderElement.style.margin = 0;
      chatHeaderElement.style.paddingLeft = '1%';
      chatHeaderElement.style.paddingRight = '1%';
      chatHeaderElement.style.boxSizing = 'border-box';

      // .chat--header--title
      let rantsContainer = document.querySelector('#chat-sticky-rants');
      rantsContainer.style.height = 'fit-content';
      rantsContainer.style.padding = 0;

      // .chat-message-form
      var chatMessageEle = document.querySelector('#chat-message-form');
      chatMessageEle.style.padding = 0;
      chatMessageEle.style.height = '9vh';

      // Bring chat to front
      //document.querySelector('#chat-main-menu').style.zIndex = '199';
      
      // Increase chat font size
      if (document.querySelector('.username-menu-list')) {
        document.querySelector('.username-menu-list').style.fontSize = '1.25rem';
        document.querySelector('.username-menu-button-container').style.fontSize = '1.2rem';
      }

      // Change button dimensions
      document.querySelector('.username-menu-toggle-container').style.maxWidth = '20px';
      document.querySelector('.username-menu-toggle-button-text').style.marginTop = '3%';
      document.querySelector('.username-menu-button-container').style.height = '20px';
      //document.querySelector('#chat--num-unread-messages').zIndex = 150;//'199';
      // Change chat menu button text
      document.getElementById('fullWindowChatBtn').innerText = 'Restore Normal Chat';
    } catch (error){
      //if (debugMode) console.log(error);
    }

    // Pause all video elements
    const videoElements = document.querySelectorAll("video");

    videoElements.forEach((videoElement) => {
      videoElement.pause();
    });

    // Open username menu
    //toggleChatUsernameMenu(true);
  } else if (!toggle){
    window.location.reload()
    // Save username colors to storage
  }  
}

const addFullWindowBtn = () => {
  // Create button for full screen chat 
  let fullWindowChatBtn = document.createElement('button');

  fullWindowChatBtn.id = 'fullWindowChatBtn';
  fullWindowChatBtn.addClassName = 'cmi';
  fullWindowChatBtn.innerText = 'Full Window Chat';

  fullWindowChatBtn.style.color = '#D6E0EA';
  fullWindowChatBtn.style.cursor = 'pointer';
  fullWindowChatBtn.style.backgroundColor = 'transparent';
  fullWindowChatBtn.style.borderStyle = 'none';
  fullWindowChatBtn.style.fontFamily = 'inherit';
  fullWindowChatBtn.style.fontWeight = 'inherit';
  fullWindowChatBtn.style.fontSize = 'inherit';
  fullWindowChatBtn.style.textDecoration = 'inherit';
  fullWindowChatBtn.style.fontStyle = 'inherit';
  fullWindowChatBtn.style.lineHeight = 'inherit';
  fullWindowChatBtn.style.borderWidth = '2px';
  fullWindowChatBtn.style.padding = '8px 1rem';
  fullWindowChatBtn.style.paddingLeft = '1.5rem';
  fullWindowChatBtn.style.paddingRight = '1.5rem';
  fullWindowChatBtn.style.textAlign = 'left';
  fullWindowChatBtn.style.whiteSpace = 'normal';
  fullWindowChatBtn.style.width = '100%';
  fullWindowChatBtn.style.maxWidth = '100%';
  fullWindowChatBtn.style.outlineOffset = '-3px';
  fullWindowChatBtn.style.userSelect = 'none';
  
  // Add hover effect
  fullWindowChatBtn.addEventListener('mouseover', ()=>{
    fullWindowChatBtn.style.backgroundColor = 'rgb(214, 224, 234, .025)';
  });

  // Remove hover effect
  fullWindowChatBtn.addEventListener('mouseout', ()=>{
    fullWindowChatBtn.style.backgroundColor = 'transparent';
  });

  if (chatHistoryEle[0]){
    // Check data-chat-visible attribute
    //var chatVisibilityDataAtr = document.querySelector('#chat-toggle-chat-visibility').getAttribute('data-chat-visible');
    var chatVisibilityDataset = document.querySelector('#chat-toggle-chat-visibility')?.dataset.chatVisible;

    if (chatVisibilityDataset){
      document.querySelector('#chat-main-menu').appendChild(fullWindowChatBtn);
    }
    
    fullWindowChatBtn.addEventListener('click', ()=>{
      toggleStreamerMode(!streamerMode)
    });

    // Listen for chat visibility toggle to add/remove full window chat button
      // This is used to prevent expanding the hidden chat
    if (document.querySelector('#chat-toggle-chat-visibility')) {
      document.querySelector('#chat-toggle-chat-visibility').addEventListener('click', function(e){
        if (!showFullWindowChat) {
          document.querySelector('#chat-main-menu').removeChild(fullWindowChatBtn);
        } else {
          document.querySelector('#chat-main-menu').appendChild(fullWindowChatBtn);
        }
        showFullWindowChat = !showFullWindowChat
      });
    }
  }
}

const addUserListBtn = () => {
  // Create button for full screen chat 
  let userListBtn = document.createElement('button');

  userListBtn.id = 'userListBtn';
  userListBtn.addClassName = 'cmi';
  if (showUsernameList){
    userListBtn.innerText = 'Hide Recent List';
  } else {
    userListBtn.innerText = 'Show Recent List';
  }

  userListBtn.style.color = '#D6E0EA';
  userListBtn.style.cursor = 'pointer';
  userListBtn.style.backgroundColor = 'transparent';
  userListBtn.style.borderStyle = 'none';
  userListBtn.style.fontFamily = 'inherit';
  userListBtn.style.fontWeight = 'inherit';
  userListBtn.style.fontSize = 'inherit';
  userListBtn.style.textDecoration = 'inherit';
  userListBtn.style.fontStyle = 'inherit';
  userListBtn.style.lineHeight = 'inherit';
  userListBtn.style.borderWidth = '2px';
  userListBtn.style.padding = '8px 1rem';
  userListBtn.style.paddingLeft = '1.5rem';
  userListBtn.style.paddingRight = '1.5rem';
  userListBtn.style.textAlign = 'left';
  userListBtn.style.whiteSpace = 'normal';
  userListBtn.style.width = '100%';
  userListBtn.style.maxWidth = '100%';
  userListBtn.style.outlineOffset = '-3px';
  userListBtn.style.userSelect = 'none';
  
  // Add hover effect
  userListBtn.addEventListener('mouseover', ()=>{
    userListBtn.style.backgroundColor = 'rgb(214, 224, 234, .025)';
  });

  // Remove hover effect
  userListBtn.addEventListener('mouseout', ()=>{
    userListBtn.style.backgroundColor = 'transparent';
  });

  if (chatHistoryEle[0]){
    // Check data-chat-visible attribute
    //var chatVisibilityDataAtr = document.querySelector('#chat-toggle-chat-visibility').getAttribute('data-chat-visible');
    var chatVisibilityDataset = document.querySelector('#chat-toggle-chat-visibility')?.dataset.chatVisible;

    if (chatVisibilityDataset){
      document.querySelector('#chat-main-menu').appendChild(userListBtn);
    }
    
    userListBtn.onclick = function() {
      toggleChatUsernameMenu(showUsernameList ? false : true);
    }
  }
}





///////   Event Listeners   ///////

// Create a MutationObserver to watch for new chat messages
var chatObserver = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    if (mutation.type === "childList") {
      // Loop through the added nodes to find new messages
      for (var i = 0; i < mutation.addedNodes.length; i++) {
        if (mutation.addedNodes[i].classList.contains("chat-history--row")) {
          // Check element classlist for 'chat-history--rant' 
          if (!enableChatPlus || mutation.addedNodes[i].classList.contains('chat-history--rant')) {
            // Save rant to chrome.storage.sync
            return;
          }

          if (
            !chatAvatarEnabled 
            && mutation.addedNodes[i].childNodes[0].classList.contains("chat-history--user-avatar")
          ){
            mutation.addedNodes[i].childNodes[0].style.display = "none";
          }

          let addedNode = mutation.addedNodes[i].querySelector('.chat-history--message-wrapper');
          let usernameEle = addedNode.querySelector('.chat-history--username');

          // For styling with other extensions
          if (chatStyleNormal && addedNode) {addedNode.style.background = rumbleColors.darkBlue;}

          // Add the message to the chat history
          let userColor = getUserColor(usernameEle.querySelector('a').textContent);

          // Log chat messages
          if (debugMode) {
            console.log(usernameEle.querySelector('a').textContent + ': ' + addedNode.childNodes[1].textContent);
          }

          if (!normalChatColors) {
            userColor = getUserColor(usernameEle.querySelector('a').textContent, null);
          } else {
            userColor = getUserColor(usernameEle.querySelector('a').textContent, usernameEle.querySelector('a').style.color);
          }

          if (!normalChatColors){
            // Assign color to username
            usernameEle.querySelector('a').style.color = userColor;
          }

          //console.log('Current User: ' + currentUser);
          //console.log('Current Streamer: ' + currentStreamer);
          
          // Highlight current user's username and streamer's name when mentioned
          if (
            (currentUser && currentUser.length > 2)
            //|| (currentStreamer && currentStreamer.length > 2)
          ){
            if (
              addedNode.childNodes[1].textContent.toLowerCase().includes(('@' + currentUser).toLowerCase())
              || addedNode.childNodes[1].textContent.toLowerCase().includes(('@' + currentStreamer).toLowerCase())
            ) {
              addedNode.childNodes[1].innerHTML =  highlightTerms(
                addedNode.childNodes[1].textContent, 
                ['@' + currentUser, '@' + currentStreamer], 
                ['rgb(234, 100, 4, .7)', 'rgb(187, 194, 11, .5)']
              );
            } else 

            if (
              currentUser.length > 0 &&
              addedNode.childNodes[1].textContent.toLowerCase().includes((currentUser).toLowerCase())
              || addedNode.childNodes[1].textContent.toLowerCase().includes((currentStreamer).toLowerCase())
            ) {
              addedNode.childNodes[1].innerHTML =  highlightTerms(
                addedNode.childNodes[1].textContent, 
                [currentUser, currentStreamer], 
                ['rgb(234, 100, 4, .7)', 'rgb(187, 194, 11, .5)']
              );
            } 
          }

          // If username not found in currentChatHistory, rebuild username list
          if (!currentChatHistory.find(user => user.username === usernameEle.querySelector('a').textContent)){
            buildUsernameList(false);
            //if (debugMode) console.log('Rebuilding username list for ' + usernameEle.querySelector('a').textContent);
          
            // Refresh user list count if enabled
            if (
              showUsernameList 
              && showListUserCount 
              && document.querySelector('.username-menu-refresh-button')
            ){
              // Get new chat usernames for list
              document.querySelector('.username-menu-refresh-button').innerHTML = `<span>${getUserCount(userColors)}</span>`   
            }
          }

          // Add the message to the chat history
          currentChatHistory.push({
            username: usernameEle.querySelector('a').textContent,
            message: addedNode.childNodes[1].textContent,
            color: userColor,
            date: Date.now(),
          });
        }

        // Check if the added node has element id 'chat--num-unread-messages' to position on top of the username menu
        if (document.getElementById("chat--num-unread-messages") && showUsernameList) {
          // Set the z-index and opacity of the unread message count
          document.getElementById('chat--num-unread-messages').style.zIndex = '100';
          document.getElementById('chat--num-unread-messages').style.opacity = '1';
        } else if (document.getElementById("chat--num-unread-messages")) {
          // Set the z-index and opacity of the unread message count
          document.getElementById('chat--num-unread-messages').style.zIndex = '';
          document.getElementById('chat--num-unread-messages').style.opacity = '';
        }
      }
    }
  });
});

var setListeners = function() {
  if (debugMode){
  let usernameListPopup = document.querySelector('.chat-plus-popup');
  let inputElement = document.getElementById("chat-message-text-input");

  document.addEventListener("keydown", function(event) {
    if (enableChatPlus) {
      // If space bar is pressed remove username list popup
      if (usernameListPopup && event.keyCode === 32) {
        // Close popup
        showUsernameList = false;
        clearMentionPopup();
      }

      // If escape key is pressed hide username list
      if (showUsernameList && event.keyCode === 27) {
        showUsernameList = false;
        clearMentionPopup();
        toggleChatUsernameMenu(false);
      }
    }
  });

  // Listen for inputs in chat message input
  
  if (inputElement) {
    inputElement.addEventListener("input", function(e) {
      if (enableChatPlus) {
        
        let inputValue = inputElement.value;
        
        // Get all indexes of @
        let atSignIndexes = [];
        for (var i = 0; i < inputValue.length; i++) {
          if (inputValue[i] === "@") {
            atSignIndexes.push(i);
          }
        }

        // Get caret position
        caretPosition = storeCaretPosition(inputElement);

        // Get coordinates of input element
        let messageCoordinates = getPageCoordinates(inputElement);

        // If "@"" is found in the input and caret is next to it
        if ( 
          !document.querySelector('.chat-plus-popup') 
          && atSignIndexes.includes(caretPosition - 1)
        ) {
          // Open username list popup
          showUsernameList = true;
          openChatUsernamesPopup(messageCoordinates);
          caretStart = caretPosition;
        } 

        // Remove popup if input is empty
        if (inputValue === ''){
          showUsernameList = false;
          clearMentionPopup();
        }

        if (showUsernameList) {
          populateMentionPopup();
        } 

        // If space is entered remove username list popup
        if (caretStart && inputValue.substring(caretStart, caretPosition).includes(' ')) {
          // Close popup
          showUsernameList = false;
          clearMentionPopup();
        }
      }
    });
  }
  
  // Close popup when user clicks outside of element
  document.addEventListener("click", function(event) {
    var usernameListPopup = document.querySelector('.chat-plus-popup');

    if (
      usernameListPopup 
      && !usernameListPopup.contains(event.target)
    ) {
      showUsernameList = false;
      clearMentionPopup();
    }
  });
  }

  // Listen for window resize 
  window.addEventListener('resize', function(event){
    var usernameListPopup = document.querySelector('.chat-plus-popup');

    if (usernameListPopup) {
      showUsernameList = false;
      clearMentionPopup();
    }  

    // Update size of streamer mode chat window 
    var sidebarEle = document.querySelector(".sidebar");  
  
    if (sidebarEle && streamerMode){
      if (window.innerWidth > 899) {
        sidebarEle.style.width = '93.75%';
      } else {
        sidebarEle.style.width = '99.5%';
      }
    }
  }, true);
}





//////   Intervals   //////

setTimeout(() => {
  // Get initial chat history
  buildUsernameList(false);
  getChatHistory();
  //buildUsernameList(false);
}, 1500);

var setIntervals = function() {
  // Refresh chat history every 60 seconds
  const chatRefreshInterval = setInterval(function(){
    //if (debugMode) console.log('refreshing chat history');
    if (enableChatPlus) {
      getChatHistory();
      buildUsernameList(false);
    }

    // Refresh user list count if enabled
    if (
      showUsernameList 
      && showListUserCount 
      && document.querySelector('.username-menu-refresh-button')
    ){
      // Get new chat usernames for list
      document.querySelector('.username-menu-refresh-button').innerHTML = `<span>${getUserCount(userColors)}</span>`   
    }

    // Refresh user list if enabled
    if (
      enableUsernameMenu 
      && document.querySelector('.username-menu-list')
    ) {
      buildUsernameList(false);
    }
  }, 60000);

  if (!chatHistoryList || !enableChatPlus){
    //if (debugMode) console.log('clearing chat refresh interval')
    clearInterval(chatRefreshInterval);
  }
}
