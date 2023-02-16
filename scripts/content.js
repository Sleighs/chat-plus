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
  chatAvatarEnabled: true

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
  chatAvatarEnabled;

  var timestampsEnabled = true;
  var bookmarkedVideos = [];

// Vars that remain in scope
let debugMode = false;
let showUsernameList = false;
let streamerMode = false;
let showFullWindowChat = false;

// Vars for logged in user and current streamer 
let currentUser = '';
let currentStreamer = '';

// Chat history
let currentChatHistory = [];
var userCount = 0;

// Rants
let savedRants = [];
let cachedRants = [];
let newRants = [];
let enableRants = true;
let rantSaverIsRunning = false;



// Text colors
let usernameColors = {
  rumbler: '#88a0b8',
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
  chatPlus: '#E0E9F2',
  rumble: '#d6e0ea',
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
  // Get options and setup extension
  await chrome.storage.sync.get("options")
  .then(function (result) {
    const defaultOptions = {
      enableChatPlus: true,
      colorUsernames: true,
      enableUsernameMenu: false,
      showUsernameListOnStartup: false,
      popupBelow: false,
      playVideoOnPageLoad: false,
      hideFullWindowChatButton: false,
      showListUserCount: false,
      chatStyleNormal: true,
      saveRants: false,
      chatAvatarEnabled: true
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
      "chatAvatarEnabled"
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

      Object.assign(optionsState, defaultOptions);
    } 
    
    if (document.querySelector('.chat-history')){
      chrome.storage.sync.get("savedRants")
        .then(function (result) {
          if (result && result.savedRants && result.savedRants.length > 0){
            savedRants = result.savedRants;
            // Update rant saving state
            rantSaverIsRunning = true;
            document.querySelector('#viewRantsBtn').style.color = 'green';
            
            //console.log('get rants', JSON.stringify(result))
          }
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }).then(() => {
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
        if (enableRants) {
          addViewRantsBtn();
          addRantTestBtn();
          addMissedRantCheckBtn();
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
  })
  .catch((err) => {
    console.log('init', err);
  });
})();





//////   Functions   //////

// Generate an id
const makeId = (length) => {
  let result = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

const insertElementAtPosition = (firstElement, secondElement, position) => {
  if (position >= secondElement.children.length) {
    secondElement.appendChild(firstElement);
  } else {
    secondElement.insertBefore(firstElement, secondElement.children[position]);
  }
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  const milliseconds = date.getMilliseconds().toString().padStart(3, '0');
  return `${hours}:${minutes}:${seconds}.${milliseconds}`;
}

function convertTimeTo12HourFormat(time) {
  const [hours, minutes, seconds] = time.split(':');
  const [secondsOnly, milliseconds] = seconds.split('.');
  const period = hours < 12 ? 'AM' : 'PM';
  const hours12 = (hours % 12) || 12;
  return `${hours12}:${minutes}.${secondsOnly} ${period}`;
}

function formatDate(timestamp) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateWithDayOfWeek(timestamp) {
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const dayOfWeek = daysOfWeek[date.getDay()];
  return `${year}-${month}-${day} ${dayOfWeek}`;
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
  let usernameEle2 = document.querySelectorAll('.media-heading-name');
  
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
const getUserColor = (username) => {
  if (colorUsernames === false ){
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
    let bgColor = bgColors[index/* % bgColors.length*/];
    let regex = new RegExp(term, "gi");
    result = result.replace(regex, `<span style="background-color: ${bgColor};">${term}</span>`);
  });
  return result;
}

const getChatHistory = () => {
  currentChatHistory = [];

  chatHistoryRows.forEach((ele, index) => {
    // Check element classlist for 'chat-history--rant' 
      // Add rant if new otherwise skip
    if (ele.classList.contains('chat-history--rant')) {
      if (saveRants) {
        saveRant(ele, true)
      }
      //console.log('Skipping rant', element);
      return;
    }

    // Remove avatar if chatAvatarEnabled is false
    if (!chatAvatarEnabled
      && ele.childNodes[0].classList.contains("chat-history--user-avatar")){
      ele.querySelector(".chat-history--user-avatar").style.display = "none";
      //ele.childNodes[0].remove();
    }

    let element = ele.querySelector('.chat-history--message-wrapper');
    
    //Assign random color to each unique username in current chat history
    let userColor = getUserColor(element.childNodes[0].textContent);

    // Assign text color to username and message
    element.childNodes[0].style.color = userColor;
    element.childNodes[0].querySelector('a').style.color = userColor;

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
      username: element.childNodes[0].textContent,
      message: element.childNodes[1].textContent,
      color: userColor,
      date: Date.now(),
    });
  });
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
function insertUsername(username, message, caretPos) {
  return message.slice(0, caretPos) + username + ' ' + message.slice(caretPos);
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

      document.getElementById('chat-message-text-input').value = insertUsername(user, messageVal, caretPosition);
            
      // Remove popup
      popup.remove();

      // Focus on chat message input
      document.getElementById('chat-message-text-input').focus();
    });
  }

  // Append popup to page
  document.body.appendChild(popup);

  // Focus popup
  document.querySelector('.chat-plus-popup').focus();
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
    usernameMenuContainer2.style.width = '105px';
  }

  // Create first container for toggle button
  usernameMenuContainer.classList.add('username-menu-toggle-container');
  usernameMenuContainer.style.position = 'absolute';//'relative';
  usernameMenuContainer.style.width = '100%';
  usernameMenuContainer.style.maxWidth = '15px';
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
    toggleChatUsernameMenu(showUsernameList ? false : true);
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
  usernameMenuRefreshButton.innerHTML = (
    showListUserCount 
      ? `<span style="width: fit-content;">${getUserCount(userColors)}</span>`
      : `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="currentColor" class="bi bi-arrow-clockwise" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/><path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/></svg>`
  );
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

  // Bring chat menu to front
  document.querySelector('#chat-main-menu').style.zIndex = '190';
};

// Build and return recent user list
const buildUsernameList = (appended) => {
  // Get username menu container
  let usernameMenuList = document.querySelector('.username-menu-list');
  
  // Clear username list is exists
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

      document.getElementById('chat-message-text-input').value = insertUsername(user, messageVal, caretPosition);
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
  
  if (toggle) {
    // Set display to flex
    usernameMenuContainer2.style.display = 'flex';

    // Add width
    if (streamerMode){
      usernameMenuContainer2.style.width = '17%';
      usernameMenuContainer2.style.height = '100%';
      usernameMenuContainer2.style.maxHeight = document.querySelector('#chat-history-list').offsetHeight + 'px';
    } else {
      usernameMenuContainer2.style.width = '105px';
    }

    // Change button icon
    document.querySelector('.username-menu-toggle-button-text').innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="currentColor" class="bi bi-chevron-left" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/></svg>`    

    // Gets new user list
    buildUsernameList(false);

    // Change button text
    userListBtn.innerText = 'Hide Recent List';
  } else {
    // Hide container
    usernameMenuContainer2.style.display = 'none';
    // Change button text
    userListBtn.innerText = 'Show Recent List';
    // Change button icon
    document.querySelector('.username-menu-toggle-button-text').innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="currentColor" class="bi bi-chevron-right" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/></svg>`;    
  }

  showUsernameList = toggle;
};





//////   Chat Options   //////

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
    // Hide chat visibility button
    if (document.querySelector("#chat-main-menu")) document.querySelector("#chat-toggle-chat-visibility").style.display = 'none';
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
      mainEle.style.overflow = 'scroll';

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
      mainChildEle.style.overflow = 'scroll';

      // .sidebar
      let sidebarEle = document.querySelector(".sidebar");  
      sidebarEle.style.fontSize = '1.2rem';
      sidebarEle.style.margin = 0;
      sidebarEle.style.padding = 0;
      sidebarEle.style.position = 'relative';
      sidebarEle.style.height = '100vh';
      sidebarEle.style.width = '100%';
      sidebarEle.style.minWidth = '100vw';

      // .chat 
      let chatContainerEle = document.querySelector(".chat");
      chatContainerEle.style.position = 'relative';
      chatContainerEle.style.margin = 0;
      chatContainerEle.style.padding = 0;
      chatContainerEle.style.height = '100vh';
      chatContainerEle.style.width = '100%';
      chatContainerEle.style.overflow = 'scroll';

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
      containerEle.style.height = '100%';

      // .chat--height
      let chatListElement = document.querySelector(".chat--height");
      chatListElement.style.position = 'relative';
      chatListElement.style.height = '81%';
      
      // .chat--header
      let chatHeaderElement = document.querySelector(".chat--header");
      chatHeaderElement.style.position = 'relative';
      chatHeaderElement.style.height = '28px';
      chatHeaderElement.style.margin = 0;
      chatHeaderElement.style.paddingLeft = '1.5%';
      chatHeaderElement.style.paddingRight = '1%';
      chatHeaderElement.style.boxSizing = 'border-box';

      // .chat--header--title
      let rantsContainer = document.querySelector('#chat-sticky-rants');
      rantsContainer.style.height = 'fit-content';
      rantsContainer.style.padding = 0;

      // .chat--header--title
      var chatMessageEle = document.querySelector('#chat-message-form');
      chatMessageEle.style.padding = 0;
      chatMessageEle.style.height = '50px';

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
    toggleChatUsernameMenu(true);
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
    var chatVisibilityDataset = document.querySelector('#chat-toggle-chat-visibility').dataset.chatVisible;

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
    var chatVisibilityDataset = document.querySelector('#chat-toggle-chat-visibility').dataset.chatVisible;

    if (chatVisibilityDataset){
      document.querySelector('#chat-main-menu').appendChild(userListBtn);
    }
    
    userListBtn.onclick = function() {
      toggleChatUsernameMenu(showUsernameList ? false : true);
    }
  }
}


const addViewRantsBtn = () => {
  // Create button for full screen chat 
  let viewRantsBtn = document.createElement('button');

  viewRantsBtn.id = 'viewRantsBtn';
  viewRantsBtn.addClassName = 'cmi';
  viewRantsBtn.innerText = 'View Rants';

  viewRantsBtn.style.color = '#D6E0EA';
  viewRantsBtn.style.cursor = 'pointer';
  viewRantsBtn.style.backgroundColor = 'transparent';
  viewRantsBtn.style.borderStyle = 'none';
  viewRantsBtn.style.fontFamily = 'inherit';
  viewRantsBtn.style.fontWeight = 'inherit';
  viewRantsBtn.style.fontSize = 'inherit';
  viewRantsBtn.style.textDecoration = 'inherit';
  viewRantsBtn.style.fontStyle = 'inherit';
  viewRantsBtn.style.lineHeight = 'inherit';
  viewRantsBtn.style.borderWidth = '2px';
  viewRantsBtn.style.padding = '8px 1rem';
  viewRantsBtn.style.paddingLeft = '1.5rem';
  viewRantsBtn.style.paddingRight = '1.5rem';
  viewRantsBtn.style.textAlign = 'left';
  viewRantsBtn.style.whiteSpace = 'normal';
  viewRantsBtn.style.width = '100%';
  viewRantsBtn.style.maxWidth = '100%';
  viewRantsBtn.style.outlineOffset = '-3px';
  viewRantsBtn.style.userSelect = 'none';
  
  // Add hover effect
  viewRantsBtn.addEventListener('mouseover', ()=>{
    viewRantsBtn.style.backgroundColor = 'rgb(214, 224, 234, .025)';
  });

  // Remove hover effect
  viewRantsBtn.addEventListener('mouseout', ()=>{
    viewRantsBtn.style.backgroundColor = 'transparent';
  });

  if (chatHistoryEle[0]){
    // Check data-chat-visible attribute
    //var chatVisibilityDataAtr = document.querySelector('#chat-toggle-chat-visibility').getAttribute('data-chat-visible');
    var chatVisibilityDataset = document.querySelector('#chat-toggle-chat-visibility').dataset.chatVisible;

    if (chatVisibilityDataset){
      document.querySelector('#chat-main-menu').appendChild(viewRantsBtn);
    }
    
    viewRantsBtn.onclick = function() {
      try {
        chrome.runtime.sendMessage({ action:'new-window' }, (response) => {
          //console.log('new rants window', response);
        });
      } catch (error) {
        console.log('new rants window error', error);
      } 
    }
  }
}

const addMissedRantCheckBtn = () => {
  // Create button for full screen chat 
  let missedRantCheckBtn = document.createElement('button');

  missedRantCheckBtn.id = 'viewRantsBtn';
  missedRantCheckBtn.addClassName = 'cmi';
  missedRantCheckBtn.innerText = 'View Missed Rants';
  missedRantCheckBtn.title = 'See unsaved Rants received while tab was idle. Missed Rants are gone after page refresh.';

  missedRantCheckBtn.style.color = '#D6E0EA';
  missedRantCheckBtn.style.cursor = 'pointer';
  missedRantCheckBtn.style.backgroundColor = 'transparent';
  missedRantCheckBtn.style.borderStyle = 'none';
  missedRantCheckBtn.style.fontFamily = 'inherit';
  missedRantCheckBtn.style.fontWeight = 'inherit';
  missedRantCheckBtn.style.fontSize = 'inherit';
  missedRantCheckBtn.style.textDecoration = 'inherit';
  missedRantCheckBtn.style.fontStyle = 'inherit';
  missedRantCheckBtn.style.lineHeight = 'inherit';
  missedRantCheckBtn.style.borderWidth = '2px';
  missedRantCheckBtn.style.padding = '8px 1rem';
  missedRantCheckBtn.style.paddingLeft = '1.5rem';
  missedRantCheckBtn.style.paddingRight = '1.5rem';
  missedRantCheckBtn.style.textAlign = 'left';
  missedRantCheckBtn.style.whiteSpace = 'normal';
  missedRantCheckBtn.style.width = '100%';
  missedRantCheckBtn.style.maxWidth = '100%';
  missedRantCheckBtn.style.outlineOffset = '-3px';
  missedRantCheckBtn.style.userSelect = 'none';
  
  // Add hover effect
  missedRantCheckBtn.addEventListener('mouseover', ()=>{
    missedRantCheckBtn.style.backgroundColor = 'rgb(214, 224, 234, .025)';
  });

  // Remove hover effect
  missedRantCheckBtn.addEventListener('mouseout', ()=>{
    missedRantCheckBtn.style.backgroundColor = 'transparent';
  });

  if (chatHistoryEle[0]){
    // Check data-chat-visible attribute
    //var chatVisibilityDataAtr = document.querySelector('#chat-toggle-chat-visibility').getAttribute('data-chat-visible');
    var chatVisibilityDataset = document.querySelector('#chat-toggle-chat-visibility').dataset.chatVisible;

    if (chatVisibilityDataset){
      document.querySelector('#chat-main-menu').appendChild(missedRantCheckBtn);
    }
    
    missedRantCheckBtn.onclick = function() {
      //console.log('Missed rants button clicked');
      getChatHistory();

      console.log('Missed Rants', JSON.stringify(cachedRants));
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
            if (mutation.addedNodes[i].classList.contains('chat-history--rant')) {
              // Save rant to sync storage
              if (saveRants){
                saveRant(mutation.addedNodes[i]);
              }
              return;
            }

            //console.log(mutation.addedNodes[i].querySelector(".chat-history--user-avatar"))
            
          // If hide pictures is enabled, hide the picture
          if (
            !chatAvatarEnabled 
            && mutation.addedNodes[i].childNodes[0].classList.contains("chat-history--user-avatar")){
            mutation.addedNodes[i].childNodes[0].style.display = "none";
            //mutation.addedNodes[i].childNodes[0].remove();
          }
      
          let addedNode = mutation.addedNodes[i].querySelector('.chat-history--message-wrapper');

          // For styling with RantsStats extension
          if (chatStyleNormal) {addedNode.style.background = rumbleColors.darkBlue;}

          // Add the message to the chat history
          let userColor = getUserColor(addedNode.childNodes[0].textContent);
          //let userColor = getUserColor(wrapperEle.childNodes[0].textContent);

          // Assign color to username
          addedNode.childNodes[0].style.color = userColor;
          addedNode.childNodes[0].querySelector('a').style.color = userColor;

          //wrapperEle.childNodes[0].style.color = userColor;

          // Highlight current user's username and streamer's name when mentioned
          if (
            (currentUser && currentUser.length > 2)
            || (currentStreamer && currentStreamer.length > 2)
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

          // Add the message to the chat history
          currentChatHistory.push({
            username: addedNode.childNodes[0].textContent,
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
  // Listen for "@" keypress to open popup
  document.addEventListener("keydown", function(event) {
    // If "2" key is pressed and shift key is held down
    /*if (event.keyCode === 50 && event.shiftKey && !document.querySelector('.chat-plus-popup')) {
      // Open username list popup
      openChatUsernamesPopup();
    }*/

    if (enableChatPlus) {
      var usernameListPopup = document.querySelector('.chat-plus-popup');

      // If space bar is pressed remove username list popup
      if (usernameListPopup && event.keyCode === 32) {
        // Close popup
        if (usernameListPopup) {
          usernameListPopup.remove()
        }
      }

      // If backspace is pressed remove username list popup
      if (usernameListPopup && event.keyCode === 8) {
        // Close popup
        if (usernameListPopup) {
          usernameListPopup.remove()
        }
      }

      // If escape key is pressed hide username list
      if (showUsernameList && event.keyCode === 27) {
        showUsernameList = false;
        toggleChatUsernameMenu(false)
      }
    }
  });

  // Listen for input in chat message input
  let inputElement = document.getElementById("chat-message-text-input");

  if (inputElement) {
    inputElement.addEventListener("input", function() {
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
        let caretPosition = storeCaretPosition(inputElement);

        // Get coordinates of input element
        let messageCoordinates = getPageCoordinates(inputElement)

        // If "@"" is found in the input and caret is next to it
        if ( 
          !document.querySelector('.chat-plus-popup') 
          && atSignIndexes.includes(caretPosition - 1)
        ) {
          // Open username list popup
          showUsernameList = true;
          openChatUsernamesPopup(messageCoordinates);
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
      usernameListPopup.remove()
    }
  });

  // Listen for window resize 
  window.addEventListener('resize', function(event){
    var usernameListPopup = document.querySelector('.chat-plus-popup');

    if (usernameListPopup) {
      showUsernameList = false;
      usernameListPopup.remove()
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

var setIntervals = function() {
  // Refresh chat history every 60 seconds
  const chatRefreshInterval = setInterval(function(){
    //if (debugMode) console.log('refreshing chat history');
    if (enableChatPlus) {
      getChatHistory();
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

  // Service Worker
  let rantServiceWorker = {
    method: 'rantServiceWorker',
    action: 'keepAlive', 
    from: 'content'
  } 
  if (saveRants){
    var rantInterval = setInterval(() => {
      try {
        chrome.runtime.sendMessage(rantServiceWorker).then(function(response) {
          console.log('Rant SW sendMessage', response);
          rantSaverIsRunning = true;
          document.querySelector('#viewRantsBtn').style.color = 'green';
        });
      } catch (e) {
        setTimeout(() => {
          rantSaverIsRunning = false;
          document.querySelector('#viewRantsBtn').style.color = 'darkred';
        }, 21000);
      }
    }, 20000);
  } else {
    clearInterval(rantInterval);
  }
}





//////   Rants   //////

const checkRantExists = function(element, rant) {
  let newDate = new Date();

  // Make rant object
  let newRant = {
    username: element.querySelector('.chat-history--rant-username').textContent,
    channel: currentStreamer,
    message: element.querySelector('.chat-history--rant-text').textContent,
    amount: element.querySelector('.chat-history--rant-price').textContent,
    timestamp: convertTimeTo12HourFormat(formatTimestamp(newDate)),//newDate.toTimeString(),
    dateOfStream: formatDateWithDayOfWeek(newDate),
    timeInMs: newDate.getTime(),
    markedRead: false,
    id: makeId(24),
    duplicateCount: 0
  }

  let rantExists = false;
  let rantIndex = [];
  let rantId = [];
  let duplicateCount = 0;

  if (savedRants.length > 0) {
    for (let i = 0; i < savedRants.length; i++) {
      if (
        savedRants[i].username === newRant.username
        && savedRants[i].channel === newRant.channel
        && savedRants[i].message === newRant.message
        && savedRants[i].amount === newRant.amount
      ) {
        // Add 1 to duplicate count
        rantExists = true;
        rantIndex.push(i);
        duplicateCount = duplicateCount + 1;
        // Add rant id to array
        rantId.push(savedRants[i].id)
      } 
    }
    for (let j = 0; j < rantIndex.length; j++) {
      savedRants[rantIndex[j]].duplicateCount = duplicateCount;
    }
  } 
  
  newRant.duplicateCount = duplicateCount;

  return {
    rantExists: rantExists,
    rantIndex: rantIndex,
    rantId: rantId,
    duplicateCount: duplicateCount
  }
}

const saveRant = function(element, history) {
  // Check if rant already exists in element and get duplicate count
  let rantExists = checkRantExists(element);
  //console.log('rant exists: ', rantExists.rantExists, JSON.stringify(rantExists));

  // Skip adding rant on getChatHistory()
  if (rantExists.rantExists === true && history === true) {
    //console.log('Rant already exists, not saving')
    return;
  }

  // Save rant to API.storage.sync
  let newDate = new Date();

  let newRant = {
    username: element.querySelector('.chat-history--rant-username').textContent,
    channel: currentStreamer,
    message: element.querySelector('.chat-history--rant-text').textContent,
    amount: element.querySelector('.chat-history--rant-price').textContent,
    timestamp: convertTimeTo12HourFormat(formatTimestamp(newDate)),//newDate.toTimeString(),
    dateOfStream: formatDateWithDayOfWeek(newDate),
    timeInMs: newDate.getTime(),
    markedRead: false,
    id: makeId(24),
    duplicateCount: rantExists.duplicateCount
  }

  console.log('newRant' + newRants.length + ': ' + newRant.username + ' - ' + newRant.message);
  
  newRants.push(newRant);

  // Save rants to storage
  storeRants(newRant);
}

const getRants = function() {
  // Get rants from storage
  try {
    chrome.storage.sync.get('savedRants')
      .then((result) => {
        rantSaverIsRunning = true;
        savedRants = result.savedRants.concat(newRants);
        newRants = []; 
      });
  } catch (error) {
    console.log('getRants - Refresh required.' + error);
    // Update rant saver state
    rantSaverIsRunning = false;
    document.querySelector('#viewRantsBtn').style.color = 'darkred';
  }
}

const storeRants = function(rant) {
  try {
    chrome.storage.sync.get('savedRants')
      .then((result) => {
        rantSaverIsRunning = true;

        // Combine new rants with saved rants
        savedRants = result.savedRants.concat(newRants);
        newRants = []; 

        chrome.storage.sync.set({savedRants: savedRants}, function() {
          //console.log('Rants stored successfully'/* + JSON.stringify(savedRants)*/);
        }); 
      });
  } catch (error) {
    // if (debugMode) console.log('Refresh required.' + error);

    // Update rant saver state
    rantSaverIsRunning = false;
    document.querySelector('#viewRantsBtn').style.color = 'darkred';
            
    getChatHistory();

    // Add rant to cachedRants 
    cachedRants.push(rant);

    // If Missed Rants is open, show rants not in savedRants(cachedRants)
    console.log('cachedRants: ' + JSON.stringify(cachedRants));
  }
}











//////  Rant Test   //////


const addRantTestBtn = () => {
  // Create button for full screen chat 
  let rantTestBtn = document.createElement('button');

  rantTestBtn.id = 'rantTestBtn';
  rantTestBtn.addClassName = 'cmi';
  rantTestBtn.innerText = 'Test Rant';

  rantTestBtn.style.color = '#D6E0EA';
  rantTestBtn.style.cursor = 'pointer';
  rantTestBtn.style.backgroundColor = 'transparent';
  rantTestBtn.style.borderStyle = 'none';
  rantTestBtn.style.fontFamily = 'inherit';
  rantTestBtn.style.fontWeight = 'inherit';
  rantTestBtn.style.fontSize = 'inherit';
  rantTestBtn.style.textDecoration = 'inherit';
  rantTestBtn.style.fontStyle = 'inherit';
  rantTestBtn.style.lineHeight = 'inherit';
  rantTestBtn.style.borderWidth = '2px';
  rantTestBtn.style.padding = '8px 1rem';
  rantTestBtn.style.paddingLeft = '1.5rem';
  rantTestBtn.style.paddingRight = '1.5rem';
  rantTestBtn.style.textAlign = 'left';
  rantTestBtn.style.whiteSpace = 'normal';
  rantTestBtn.style.width = '100%';
  rantTestBtn.style.maxWidth = '100%';
  rantTestBtn.style.outlineOffset = '-3px';
  rantTestBtn.style.userSelect = 'none';
  
  // Add hover effect
  rantTestBtn.addEventListener('mouseover', ()=>{
    rantTestBtn.style.backgroundColor = 'rgb(214, 224, 234, .025)';
  });

  // Remove hover effect
  rantTestBtn.addEventListener('mouseout', ()=>{
    rantTestBtn.style.backgroundColor = 'transparent';
  });

  let rantPrice = 2;

  if (chatHistoryEle[0]){
    // Check data-chat-visible attribute
    //var chatVisibilityDataAtr = document.querySelector('#chat-toggle-chat-visibility').getAttribute('data-chat-visible');
    var chatVisibilityDataset = document.querySelector('#chat-toggle-chat-visibility').dataset.chatVisible;

    if (chatVisibilityDataset){
      document.querySelector('#chat-main-menu').appendChild(rantTestBtn);
    }
    
    rantTestBtn.addEventListener('click', ()=>{  
      let chatHistoryRow = document.createElement('li');
      chatHistoryRow.classList.add('chat-history--row');
      chatHistoryRow.classList.add('chat-history--rant');
      chatHistoryRow.style.display = 'flex';
      chatHistoryRow.style.flexDirection = 'row';
      
      let testRant = `
        <div class='chat-history--row chat-history--rant'>
          <div class='chat-history--rant'>
            <div class='chat-history--rant-head'>
              <div class='chat--profile-pic'>
                <img src='https://static-cdn.jtvnw.net/jtv_user_pictures/8e0b0e0e-1b1c-4b1f-8b1f-8b1f8b1f8b1f-profile_image-300x300.png'>
              </div>
              <div>
                <a class='chat-history--rant-username' 
                  href='/user/${currentUser}' target='_blank'>${currentUser}
                </a>
                <div class='chat-history--rant-price'>$${rantPrice}</div>
              </div>
            </div>
            <div class='chat-history--rant-text'>
              "test message from ${currentUser} for ${currentStreamer} and this is a really long message to test the width of the rant"
            </div>
          </div>
        </div>`;

      rantPrice += 15;

      chatHistoryRow.innerHTML = testRant;
      chatHistoryList.appendChild(chatHistoryRow);
    });
  }
}


/*
if (saveRants){
  let intCount = 0;
  // Listen for messages from background.js
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.method == 'rantServiceWorker') {
      intCount = intCount + 20;
      console.log('rantServiceWorker', intCount)

      sendResponse({ savedRants: savedRants, cachedRants });
    }
  })
  .catch((error) => {
    rantSaverIsRunning = false;
    document.querySelector('#viewRantsBtn').style.color = 'darkred';
  });
}
*/