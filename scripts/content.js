//////   Define Variables   //////

let browser = chrome || browser;

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
  normalChatColors: true,
  initialBoot: true,
  hideToggleIcon: false,
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
  normalChatColors,
  initialBoot,
  hideToggleIcon;

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

  await browser.storage.sync.get("options")
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
      initialBoot: true,
      hideToggleIcon: false
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
      "normalChatColors",
      "initialBoot",
      "hideToggleIcon"
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
      initialBoot = newOptionObj.initialBoot;
      hideToggleIcon = newOptionObj.hideToggleIcon;

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
      initialBoot = defaultOptions.initialBoot;
      hideToggleIcon = defaultOptions.hideToggleIcon;

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
          if(showUsernameListOnStartup) toggleChatUsernameMenu(true);
        }

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



//////   Functions   //////

const setOptions = async (data) => {
  await browser.storage.sync.set({ options: data })
    .then(() => { 
      if (debugMode) {console.log('Options saved.');} 
    });
}

const getOptions = async (optionName) => {
  const options = await browser.storage.sync.get(['options'])
    .then((result) => {
      return result.options;
    });

  if (optionName) {
    return options[optionName];
  }

  return options;
}




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
      browser.storage.local.set({ currentUser });
    } else {
      browser.storage.local.get(['currentUser'], (result) => {
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





///////   Message Input Username List Popup    ///////

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
  // Create container elements
  // Add container for username list toggle button next to chat
  let usernameMenuContainer = document.createElement('div');
  usernameMenuContainer.classList.add('username-menu-container', 'username-menu-toggle-container', `${initialBoot ? 'username-menu-toggle-button-initial' : 'username-menu-toggle-button-normal'}`);
  // Add container for username list
  let usernameMenuContainer2 = document.createElement('div');
  usernameMenuContainer2.classList.add('username-menu-container2');
  // Create toggle button element for container 1
  let usernameMenuButton = document.createElement('div');
  // Create text element for toggle button 
  let usernameMenuButtonText = document.createElement('div');
  // Create button container
  let usernameMenuButtonContainer = document.createElement('div');
  // Create close button
  let usernameMenuCloseButton = document.createElement('div');
  // Add a Refresh menu button 
  let usernameMenuRefreshButton = document.createElement('div');


  // Set the username list width 
  if (streamerMode){
    usernameMenuContainer2.style.width = '17%';
  } else {
    usernameMenuContainer2.style.minWidth = '105px';
    usernameMenuContainer2.style.width = '100%';
    usernameMenuContainer2.style.maxWidth = '22%';
  }


  // Button Elements

  // Add hover effect to the button container
  usernameMenuContainer.addEventListener('mouseover', () => {usernameMenuContainer.style.backgroundColor = 'rgba(255,255,255,0.12)';});
  usernameMenuContainer.addEventListener('mouseleave', () => {usernameMenuContainer.style.backgroundColor = 'rgba(255,255,255,0)';});


  // Toggle Button
  usernameMenuButton.title = 'Toggle Users List';
  usernameMenuButton.classList.add('username-menu-toggle-button');
  usernameMenuButton.style.color = rumbleColors.text;
  usernameMenuButton.addEventListener('click', () => {toggleChatUsernameMenu(!showUsernameList);});
  usernameMenuButton.addEventListener('mouseover', () => {usernameMenuButtonText.style.color = 'rgba(255,255,255,.9)';  });
  usernameMenuButton.addEventListener('mouseleave', () => {usernameMenuButtonText.style.color = hideToggleIcon ? 'rgba(255,255,255,0)' : 'rgba(255,255,255,.3)';  });


  // Toggle button text
  usernameMenuButtonText.classList.add('username-menu-toggle-button-text');
  usernameMenuButtonText.style.color = hideToggleIcon ? 'rgba(255,255,255,0)' : 'rgba(255,255,255,.3)';
  usernameMenuButtonText.addEventListener('click', () => {toggleChatUsernameMenu(!showUsernameList);});


  // Create the icon element
  const svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svgElement.setAttribute("width", "16");
  svgElement.setAttribute("height", "16");
  svgElement.setAttribute("fill", "currentColor");
  svgElement.setAttribute("class", "bi bi-caret-left");
  svgElement.setAttribute("viewBox", "0 0 16 16");
  // Create the path element
  const pathElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
  pathElement.setAttribute("d", "M6 12.796V3.204L11.481 8zm.659.753 5.48-4.796a1 1 0 0 0 0-1.506L6.66 2.451C6.011 1.885 5 2.345 5 3.204v9.592a1 1 0 0 0 1.659.753");
  // Append the path element to the SVG element
  svgElement.appendChild(pathElement);

  // Append the SVG element to the desired parent element
  usernameMenuButtonText.appendChild(svgElement);
  // Add a click event listener to the SVG element
  svgElement.addEventListener('click', () => {
    toggleChatUsernameMenu(!showUsernameList);
  });



  // List Elements
  
  // List Button container
  usernameMenuButtonContainer.classList.add('username-menu-button-container');
  usernameMenuButtonContainer.style.width = '100%';
  usernameMenuButtonContainer.style.height = '17px';
  usernameMenuButtonContainer.style.background = 'rgb(133, 199, 66, 1)';
  usernameMenuButtonContainer.style.display = 'flex';
  usernameMenuButtonContainer.style.alignItems = 'center';
  usernameMenuButtonContainer.style.justifyContent = 'space-between';
  usernameMenuButtonContainer.style.color = rumbleColors.darkBlue;
  

  // Close Button
  usernameMenuCloseButton.classList.add('username-menu-list-button');
  usernameMenuCloseButton.title = 'Close List';
  usernameMenuCloseButton.style.width = '20%';
  usernameMenuCloseButton.style.height = '100%';
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
    usernameMenuCloseButton.style.background = 'rgb(0,0,0,0.4)';
  });
  // Remove hover effect
  usernameMenuCloseButton.addEventListener('mouseout', () => {
    usernameMenuCloseButton.style.background = 'transparent';
  });


  // Refresh Button
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

    // Change button icon to right arrow
    // document.querySelector('.username-menu-toggle-button-text').innerHTML = 
    //   //Right Caret
    //   `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-caret-left" viewBox="0 0 16 16">
    //     <path d="M10 12.796V3.204L4.519 8zm-.659.753-5.48-4.796a1 1 0 0 1 0-1.506l5.48-4.796A1 1 0 0 1 11 3.204v9.592a1 1 0 0 1-1.659.753"/>
    //   </svg>`;
    
    // Create filled icon
    const svgElement2 = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgElement2.setAttribute("width", "16");
    svgElement2.setAttribute("height", "16");
    svgElement2.setAttribute("fill", "currentColor");
    svgElement2.setAttribute("class", "bi bi-caret-left");
    svgElement2.setAttribute("viewBox", "0 0 16 16");
    svgElement2.addEventListener('click', () => {
      toggleChatUsernameMenu(!showUsernameList);
    });
    // Create the path element
    const pathElement2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathElement2.setAttribute("d", "m12.14 8.753-5.482 4.796c-.646.566-1.658.106-1.658-.753V3.204a1 1 0 0 1 1.659-.753l5.48 4.796a1 1 0 0 1 0 1.506z");
    svgElement2.appendChild(pathElement2);
    // Add the path element to the SVG element
    document.querySelector('.username-menu-toggle-button-text').innerHTML = '';
    document.querySelector('.username-menu-toggle-button-text').appendChild(svgElement2);

    // Gets new user list
    buildUsernameList(false);
  } else {
    // Hide container
    usernameMenuContainer2.style.display = 'none';

    // Change button icon to left arrow
    // document.querySelector('.username-menu-toggle-button-text').innerHTML = 
    //   // Left Caret
    //   `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-caret-right" viewBox="0 0 16 16">
    //     <path d="M6 12.796V3.204L11.481 8zm.659.753 5.48-4.796a1 1 0 0 0 0-1.506L6.66 2.451C6.011 1.885 5 2.345 5 3.204v9.592a1 1 0 0 0 1.659.753"/>
    //   </svg>`;
    
    const svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgElement.setAttribute("width", "16");
    svgElement.setAttribute("height", "16");
    svgElement.setAttribute("fill", "currentColor");
    svgElement.setAttribute("class", "bi bi-caret-left");
    svgElement.setAttribute("viewBox", "0 0 16 16");
    svgElement.addEventListener('click', () => {
      toggleChatUsernameMenu(!showUsernameList);
    });
    // Create the path element
    const pathElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathElement.setAttribute("d", "M6 12.796V3.204L11.481 8zm.659.753 5.48-4.796a1 1 0 0 0 0-1.506L6.66 2.451C6.011 1.885 5 2.345 5 3.204v9.592a1 1 0 0 0 1.659.753");
    // Append the path element to the SVG element
    svgElement.appendChild(pathElement);
    // Add the path element to the SVG element
    document.querySelector('.username-menu-toggle-button-text').innerHTML = '';
    document.querySelector('.username-menu-toggle-button-text').appendChild(svgElement);
  }

  // Initial boot logic
      
  // Prevent future animations after first click
  // if (initialBoot) {
  //   initialBoot = false;
  //   setOptions({
  //     ...optionsState,
  //     initialBoot: false
  //   });

  //   // Remove initial animation class
  //   usernameMenuContainer.classList.remove('username-menu--initial-animation');
  //   // Add normal animation class
  //   usernameMenuContainer.classList.add('username-menu--normal-animation');
  // }
};






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

          // Add the message to the chat history
          let userColor = getUserColor(usernameEle.textContent);

          // Log chat messages
          if (debugMode) {
            console.log(usernameEle.querySelector('a').textContent + ': ' + addedNode.childNodes[1].textContent);
          }

          if (!normalChatColors) {
            userColor = getUserColor(usernameEle.textContent, null);
          } else {
            userColor = getUserColor(usernameEle.textContent, usernameEle.style.color);
          }

          if (!normalChatColors){
            // Assign color to username
            usernameEle.style.color = userColor;
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
          if (!currentChatHistory.find(user => user.username === usernameEle.textContent)){
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
            username: usernameEle.textContent,
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
