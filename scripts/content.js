
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
};

// Undefined option vars
let enableChatPlus, 
  colorUsernames, 
  enableUsernameMenu,
  showUsernameListOnStartup,
  popupBelow,
  playVideoOnPageLoad,
  hideFullWindowChatButton;

// Vars that remain in scope
let debugMode = false;
let showUsernameList = false;
let streamerMode = false;
let showFullWindowChat = false;

// Save options to storage
const saveOptionsToStorage = () => {
  chrome.storage.sync.set({ options: {
    enableChatPlus: enableChatPlus,
    colorUsernames: colorUsernames,
    enableUsernameMenu: enableUsernameMenu,
    showUsernameListOnStartup: showUsernameListOnStartup,
    popupBelow: popupBelow,
    playVideoOnPageLoad: playVideoOnPageLoad
  } })
  .then(function (result) {
    //if (debugMode) console.log('Options saved to storage')
  });
};





//////   Chat History  //////

// Chat history
let currentChatHistory = [];

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
  dreamyBlue: '#2DA3FB',
}

let messageColors = { 
  chatPlus: '#E0E9F2',
  rumble: '#d6e0ea',
  white: '#FFFFFF',
  rumbleGreen: '#85C742',
  rumbleBlue: '#10212F',
  rumbleDarkBlue: '#061726'
}

// For assigned colors
let userColors = {}

// Gets random color from usernameColors object
const getRandomColor = () => {
  const colors = Object.values(usernameColors);
  return colors[Math.floor(Math.random() * colors.length)];
}

// Vars for logged in user and current streamer 
let currentUser = '';
let currentStreamer = '';

try {
  // Get current user from page if logged in
  const rantEle = document.querySelectorAll('.chat-history--rant-head');
  const usernameEle = document.querySelectorAll('.chat-history--rant-username');

  if (rantEle && usernameEle) {
    if (usernameEle.length > 0) {
      currentUser = usernameEle[usernameEle.length - 1].textContent;
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
const chatHistoryEle = document.querySelectorAll('.chat-history');
const chatHistoryList = document.getElementById('chat-history-list');
const chatHistoryRows = document.querySelectorAll('.chat-history--row');
const chatHistoryNames = document.querySelectorAll('.chat-history--username');
const chatHistoryMessages = document.querySelectorAll('.chat-history--message');

// Retrieves user color from userColor object
const getUserColor = (username) => {
  if (colorUsernames === false ){
    userColors[username] = usernameColors.rumbler;
  } else if (!userColors[username]) {
    userColors[username] = getRandomColor();
  }
  return userColors[username];
}

// Highlight each term in a string, for usernames in messages
function highlightString(text, searchTerm, color, backgroundColor) {
  // Get index of search term
  var index = text.toLowerCase().indexOf(searchTerm.toLowerCase());

  // Get original matched text
  var matchedText = text.substring(index, index + searchTerm.length);

  //Return string with styling
  if (index >= 0) {
    return (
      text.substring(0, index) +
      "<span style='color: " +
      color +
      "; background-color: " + 
      backgroundColor +
      ";'>" +
      matchedText +
      "</span>" +
      // Recursively highlight the rest of the string
      highlightString(text.substring(index + searchTerm.length), searchTerm, color, backgroundColor)
    );
  }
  return text;
}

const getChatHistory = () => {
  currentChatHistory = [];

  chatHistoryRows.forEach((element, index) => {
    // Check element classlist for 'chat-history--rant' and skip row
    if (element.classList.contains('chat-history--rant')) {
      return;
    }

    //Assign random color to each unique username in current chat history
    let userColor = getUserColor(element.childNodes[0].textContent);

    // Assign text color to username and message
    element.childNodes[0].style.color = userColor;

    // Highlight current user's username when tagged with '@'
    if ( currentUser && currentUser.length > 2 ){
      if (
        element.childNodes[1].textContent.toLowerCase().includes(('@' + currentUser).toLowerCase())
      ) {
        element.childNodes[1].innerHTML = highlightString(element.childNodes[1].textContent, '@' + currentUser, 'white', 'rgb(234, 100, 4, .85)');
      } else if (
        element.childNodes[1].textContent.toLowerCase().includes((currentUser).toLowerCase())
      ) {
        element.childNodes[1].innerHTML = highlightString(element.childNodes[1].textContent, currentUser, 'white', 'rgb(234, 100, 4, .85)');
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
  const popup = document.createElement('div');

  // Get dimensions of the message input
  var popupAdjustedHeight = document.getElementById("chat-message-text-input").clientHeight;
  var popupAdjustedWidth = document.getElementById("chat-message-text-input").clientWidth;

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
  popup.style.padding = '0 7px';
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
  const popupContent = document.createElement('ul');
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
  const sortedUserColors = sortObjectByPropName(userColors);

  // Loop through sortedUserColors object and add usernames to popup content
  for (let user in sortedUserColors) {
    const usernameTextElement = document.createElement('li');
    usernameTextElement.style.color = sortedUserColors[user];
    usernameTextElement.style.fontSize = '1.1rem';
    usernameTextElement.style.listStyle = 'none';
    usernameTextElement.style.cursor = 'pointer';
    usernameTextElement.style.fontWeight = 'bold';
    usernameTextElement.innerHTML = user;
    popupContent.appendChild(usernameTextElement);
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

const addChatUsernameMenu = () => {
  // Create container element
  const usernameMenuContainer = document.createElement('div');
  
  usernameMenuContainer.classList.add('username-menu-container');
  usernameMenuContainer.style.position = 'relative';
  usernameMenuContainer.style.width = '16px';
  usernameMenuContainer.style.height = '100%';
  usernameMenuContainer.style.boxSizing = 'border-box';
  usernameMenuContainer.style.overflow = 'hidden';
  usernameMenuContainer.style.zIndex = '190';
  usernameMenuContainer.style.borderLeft = `solid 1pt rgb(255,255,255,0)`;
  usernameMenuContainer.style.display = 'flex';
  usernameMenuContainer.style.flexDirection = 'column';
  usernameMenuContainer.style.justifyContent = 'center';
  usernameMenuContainer.style.alignItems = 'center';
  
  // Add toggle button element to container
  const usernameMenuButton = document.createElement('div');
  usernameMenuButton.classList.add('username-menu-button');
  usernameMenuButton.style.width = '100%';
  usernameMenuButton.style.height = '100%';
  usernameMenuButton.style.color = messageColors.rumble;
  usernameMenuButton.style.boxSizing = 'border-box';
  usernameMenuButton.style.zIndex = '195';
  usernameMenuButton.style.writingMode = 'vertical-rl';
  usernameMenuButton.style.display = 'flex';
  usernameMenuButton.style.justifyContent = 'center';
  usernameMenuButton.style.cursor = 'pointer';
  usernameMenuButton.style.transition = 'all 0.2s ease-in-out';

  usernameMenuButton.addEventListener('click', () => {
    toggleChatUsernameMenu(true)
  });

  // Create text element
  const usernameMenuButtonText = document.createElement('div');

  usernameMenuButtonText.classList.add('username-menu-button-text');
  usernameMenuButtonText.style.width = '100%';
  usernameMenuButtonText.style.height = 'fit-content';
  usernameMenuButtonText.style.marginTop = '-40px';
  usernameMenuButtonText.style.zIndex = '189';
  usernameMenuButtonText.style.color = 'rgb(255,255,255,0.45)';
  
  usernameMenuButtonText.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" class="bi bi-chevron-right" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/></svg>';
  //usernameMenuButtonText.textContent = 'User List';

  usernameMenuButton.appendChild(usernameMenuButtonText);
  usernameMenuContainer.appendChild(usernameMenuButton);

  // Add container to page
  chatHistoryEle[0].appendChild(usernameMenuContainer);
};

// Add username list menu to page
const toggleChatUsernameMenu = (toggle) => {
  // Container element
  const usernameMenuContainer = document.querySelector('.username-menu-container');

  if (toggle) {
    // Update dimensions

    if (streamerMode){
      usernameMenuContainer.style.width = '16.5%';
    } else {
      usernameMenuContainer.style.width = '105px';
    }
    usernameMenuContainer.style.height = '100%';
    usernameMenuContainer.style.borderLeft = `solid 1pt rgb(255,255,255,0.25)`;
    
    // Remove children from username menu container
    while (usernameMenuContainer.firstChild) {
      usernameMenuContainer.removeChild(usernameMenuContainer.firstChild);
    }

    // Add a close menu button 
    const usernameMenuButton = document.createElement('div');
    
    usernameMenuButton.classList.add('username-menu-button');
    usernameMenuButton.style.width = '100%';
    usernameMenuButton.style.height = '17px';
    usernameMenuButton.style.background = 'rgb(133, 199, 66, 1)';
    usernameMenuButton.style.color = messageColors.rumbleDarkBlue;
    usernameMenuButton.style.zIndex = '195';
    //usernameMenuButton.style.fontSize = '.9rem';
    usernameMenuButton.style.display = 'flex';
    usernameMenuButton.style.justifyContent = 'flex-start';
    usernameMenuButton.style.alignItems = 'center';
    usernameMenuButton.style.cursor = 'pointer';

    //usernameMenuButton.textContent = 'Close';
    //usernameMenuButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="currentColor" class="bi bi-chevron-left" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/></svg>';
    usernameMenuButton.innerHTML = '<span>&nbsp;</span><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="currentColor" class="bi bi-caret-left-fill" viewBox="0 0 16 16"><path d="m3.86 8.753 5.482 4.796c.646.566 1.658.106 1.658-.753V3.204a1 1 0 0 0-1.659-.753l-5.48 4.796a1 1 0 0 0 0 1.506z"/></svg>'
    
    usernameMenuButton.addEventListener('click', () => {
      toggleChatUsernameMenu(false)
    });

    usernameMenuContainer.appendChild(usernameMenuButton);

    // Create username list element
    const usernameMenuList = document.createElement('ul');
    
    usernameMenuList.classList.add('username-menu-list');
    usernameMenuList.style.position = 'relative';
    usernameMenuList.style.width = '100%';
    usernameMenuList.style.height = '100%';
    usernameMenuList.style.zIndex = '195';
    usernameMenuList.style.overflow = 'scroll';
    usernameMenuList.style.padding = '7px';
    usernameMenuList.style.boxSizing = 'border-box';

    // Add list element to container
    usernameMenuContainer.appendChild(usernameMenuList);

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
      const usernameTextElement = document.createElement('li');
      
      if (streamerMode){
        usernameTextElement.style.fontSize = '1.05rem';
      } else {
        usernameTextElement.style.fontSize = '.9rem';
      }
      usernameTextElement.style.color = sortedUserColors[user];
      usernameTextElement.style.listStyle = 'none';
      usernameTextElement.style.cursor = 'pointer';
      usernameTextElement.style.fontWeight = 'bold';
      usernameTextElement.style.zIndex = '195';
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
              
        // Focus on chat message input
        document.getElementById('chat-message-text-input').focus();
      });
    }

    // Add list to container
    usernameMenuContainer.appendChild(usernameMenuList);
  } else {
    // Update Dimensions
    usernameMenuContainer.style.width = '16px';
    usernameMenuContainer.style.height = '100%';
    usernameMenuContainer.style.borderLeft = `solid 1pt rgb(255,255,255,0)`;

    // Remove list
    while (usernameMenuContainer.firstChild) {
      usernameMenuContainer.removeChild(usernameMenuContainer.firstChild);
    }

    // Add toggle button element to container
    const usernameMenuButton = document.createElement('div');
    
    usernameMenuButton.classList.add('username-menu-button');
    usernameMenuButton.style.width = '100%';
    usernameMenuButton.style.height = '100%';
    usernameMenuButton.style.boxSizing = 'border-box';
    usernameMenuButton.style.zIndex = '195';
    usernameMenuButton.style.writingMode = 'vertical-rl';
    usernameMenuButton.style.display = 'flex';
    usernameMenuButton.style.justifyContent = 'center';
    usernameMenuButton.style.cursor = 'pointer';
    
    usernameMenuButton.addEventListener('click', () => {
      toggleChatUsernameMenu(true)
    });

    // Create text element
    const usernameMenuButtonText = document.createElement('div');

    usernameMenuButtonText.classList.add('username-menu-button-text');
    usernameMenuButtonText.style.width = '100%';
    usernameMenuButtonText.style.height = 'fit-content';
    usernameMenuButtonText.style.marginTop = '-40px';
    usernameMenuButtonText.style.zIndex = '190';
    usernameMenuButtonText.style.color = 'rgb(255,255,255,0.45)';
    usernameMenuButtonText.style.cursor = 'pointer';

    //usernameMenuButtonText.textContent = 'User List';
    usernameMenuButtonText.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" class="bi bi-chevron-right" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/></svg>';

    usernameMenuButton.appendChild(usernameMenuButtonText);
    usernameMenuContainer.appendChild(usernameMenuButton);
  }

  showUsernameList = toggle;
  
  // Save options to storage if showUsernameListOnStartup is enabled
  /*if (showUsernameListOnStartup) {
    saveOptionsToStorage()
  }*/
};




//////   In Page Options   //////

const toggleStreamerMode = (toggle) => {
  streamerMode = toggle;

  if (toggle) {
    if (!enableUsernameMenu){
      addChatUsernameMenu();
    }
  
    if (!showUsernameList){
      toggleChatUsernameMenu(true);
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
      // Get main html element
      var mainEle = document.querySelector("main");
      mainEle.style.padding = 0;
      mainEle.style.margin = 0;
      mainEle.style.maxHeight = '100vh';

      // Get main child
      var mainChildEle = document.querySelector(".constrained");
      mainChildEle.style.padding = 0;
      mainChildEle.style.margin = 0;

      var sidebarEle = document.querySelector(".sidebar");  
      sidebarEle.style.fontSize = '1.2rem';

      var usernameMenuEle = document.querySelector('.username-menu-list');
      if (document.querySelector('.username-menu-list')) {
        usernameMenuEle.style.fontSize = '1.25rem';
      }

      // Page width is 900px
      if (window.innerWidth > 899) {
        sidebarEle.style.width = '93.75%';
      } else {
        sidebarEle.style.width = '99.25%';
      }

      // Update icon
      //document.getElementById('fullWindowChatBtn').title = 'Exit mode and refresh'
      //document.getElementById('fullWindowChatBtn').innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-arrow-clockwise" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/><path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/></svg>'  
      
      document.getElementById('fullWindowChatBtn').innerText = 'Restore Normal Chat';
    } catch (error){
      //if (debugMode) console.log(error);
    }

    // Pause all video elements
    const videoElements = document.querySelectorAll("video");

    videoElements.forEach((videoElement) => {
      videoElement.pause();
    });
  } else if (!toggle){
    window.location.reload()
  }  
}

const addFullWindowBtn = () => {
  // Create button for full screen chat 
  //const fullWindowChatBtn = document.createElement('div');
  const fullWindowChatBtn = document.createElement('button');

  fullWindowChatBtn.id = 'fullWindowChatBtn';
  //fullWindowChatBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="currentColor" class="bi bi-arrows-fullscreen" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M5.828 10.172a.5.5 0 0 0-.707 0l-4.096 4.096V11.5a.5.5 0 0 0-1 0v3.975a.5.5 0 0 0 .5.5H4.5a.5.5 0 0 0 0-1H1.732l4.096-4.096a.5.5 0 0 0 0-.707zm4.344 0a.5.5 0 0 1 .707 0l4.096 4.096V11.5a.5.5 0 1 1 1 0v3.975a.5.5 0 0 1-.5.5H11.5a.5.5 0 0 1 0-1h2.768l-4.096-4.096a.5.5 0 0 1 0-.707zm0-4.344a.5.5 0 0 0 .707 0l4.096-4.096V4.5a.5.5 0 1 0 1 0V.525a.5.5 0 0 0-.5-.5H11.5a.5.5 0 0 0 0 1h2.768l-4.096 4.096a.5.5 0 0 0 0 .707zm-4.344 0a.5.5 0 0 1-.707 0L1.025 1.732V4.5a.5.5 0 0 1-1 0V.525a.5.5 0 0 1 .5-.5H4.5a.5.5 0 0 1 0 1H1.732l4.096 4.096a.5.5 0 0 1 0 .707z"/></svg>';
  //fullWindowChatBtn.title = 'Full Window Chat';

  /*
  fullWindowChatBtn.style.color = messageColors.rumble;
  fullWindowChatBtn.style.opacity = .25;
  fullWindowChatBtn.style.width = '30px';
  fullWindowChatBtn.style.height = '30px';
  fullWindowChatBtn.style.wordWrap = 'break-word';
  fullWindowChatBtn.style.display = 'flex';
  fullWindowChatBtn.style.alignItems = 'center';
  fullWindowChatBtn.style.justifyContent = 'center';
  fullWindowChatBtn.style.zIndex = '195';
  fullWindowChatBtn.style.cursor = 'pointer';
  */

  // Updated to Rumble 2/7/2023 update

  /*
    cursor: pointer;
    background-color: transparent;
    border-style: none;
    font-family: inherit;
    font-weight: inherit;
    font-size: inherit;
    text-decoration: inherit;
    font-style: inherit;
    line-height: inherit;
    border-width: 2px;
    padding-left: 1.5rem;

    padding-right: 1.5rem;


    text-align: left;
    white-space: normal;
    width: 100%;
    color: #D6E0EA;

    padding: 8px 1rem;
    max-width: 100%;
    outline-offset: -3px;

    highlight on hover
  */

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
  
  // Add hover effect
  fullWindowChatBtn.addEventListener('mouseover', ()=>{
    fullWindowChatBtn.style.backgroundColor = 'rgb(214, 224, 234, .025)';
  });

  // Remove hover effect
  fullWindowChatBtn.addEventListener('mouseout', ()=>{
    fullWindowChatBtn.style.backgroundColor = 'transparent';
  });

  if (chatHistoryEle[0]){
    // Styling for previus Rumble version
    //fullWindowChatBtn.style.position = 'absolute';
    //fullWindowChatBtn.style.top = '-42px';
    //fullWindowChatBtn.style.right = '14px';
    // Previous Rumble version 
    //chatHistoryEle[0].appendChild(fullWindowChatBtn);
    //document.querySelector('.chat--header').appendChild(fullWindowChatBtn);

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





//////   Initialize App   ///////

// Get options from storage and initialize extension
(() => {
  chrome.storage.sync.get("options")
  .then(function (result) {
    const defaultOptions = {
      enableChatPlus: true,
      colorUsernames: true,
      enableUsernameMenu: false,
      showUsernameListOnStartup: false,
      popupBelow: false,
      playVideoOnPageLoad: false,
      hideFullWindowChatButton: false
    };

    const optionsList = [
      "enableChatPlus", 
      "colorUsernames", 
      "enableUsernameMenu",
      "showUsernameListOnStartup",
      "popupBelow",
      "playVideoOnPageLoad",
      "hideFullWindowChatButton"
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

      Object.assign(optionsState, newOptionObj);
    } else {
      enableChatPlus = defaultOptions.enableChatPlus;
      colorUsernames = defaultOptions.colorUsernames;      
      enableUsernameMenu = defaultOptions.enableUsernameMenu;
      showUsernameListOnStartup = defaultOptions.showUsernameListOnStartup;
      popupBelow = defaultOptions.popupBelow;
      playVideoOnPageLoad = defaultOptions.playVideoOnPageLoad;
      hideFullWindowChatButton = defaultOptions.hideFullWindowChatButton;

      Object.assign(optionsState, defaultOptions);
    } 
  }).then(() => {
    // If app is enabled
    if (enableChatPlus) {
      try {
        function playVideoContent(){
          let isStream = false;
          let videos = document.querySelectorAll('video');

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
              }, 2500);
            } else {
              video.play();
            }
          });
        }

        // Play video on page load if enabled
        if (playVideoOnPageLoad ) {
          playVideoContent();
        }
      } catch (err) {
        //if (debugMode) console.log(err);
      }

      if (document.querySelector('.chat-history')){
        // Get chat history
        getChatHistory();

        // Add username menu
        if (enableUsernameMenu) {
            addChatUsernameMenu();
        }
      }

      // Handle "Hide Full Window Chat Button" option
      if (!hideFullWindowChatButton){
        addFullWindowBtn();
      }
    }    
  });  
})();





///////   Event Listeners   ///////

// Create a MutationObserver to watch for new chat messages
var chatObserver = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    if (mutation.type === "childList") {
      // Loop through the added nodes to find new messages
      for (var i = 0; i < mutation.addedNodes.length; i++) {
        var addedNode = mutation.addedNodes[i];

        if (addedNode.classList.contains("chat-history--row")) {
          // Check element classlist for 'chat-history--rant' 
          if (!enableChatPlus || addedNode.classList.contains('chat-history--rant')) {
            // Skip node
            return;
          }

          // Add the message to the chat history
          let userColor = getUserColor(addedNode.childNodes[0].textContent);

          // Assign color to username
          addedNode.childNodes[0].style.color = userColor;

          // Highlight current user's username when tagged with '@'
          if (currentUser && currentUser.length > 2){
            if (
              addedNode.childNodes[1].textContent.toLowerCase().includes(('@' + currentUser).toLowerCase())
            ) {
              addedNode.childNodes[1].innerHTML = highlightString(addedNode.childNodes[1].textContent, '@' + currentUser, 'white', 'rgb(234, 100, 4, .85)');
            } else 

            if (
              addedNode.childNodes[1].textContent.toLowerCase().includes((currentUser).toLowerCase())
            ) {
              addedNode.childNodes[1].innerHTML = highlightString(addedNode.childNodes[1].textContent, currentUser, 'white', 'rgb(234, 100, 4, .85)');
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
          document.getElementById('chat--num-unread-messages').style.zIndex = '199';
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

// Observe chat for changes to its child elements to detect new messages
if (chatHistoryList){
  chatObserver.observe(document.querySelector('#chat-history-list'), { childList: true });
}

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





//////   Intervals   //////

// Refresh chat history every 120 seconds
const chatRefreshInterval = setInterval(function(){
  //if (debugMode) console.log('refreshing chat history');
  if (enableChatPlus) {
    getChatHistory();
  }
}, 120000);

// Clear interval if there is no chat history
if (!chatHistoryList || !enableChatPlus){
  //if (debugMode) console.log('clearing chat refresh interval')
  clearInterval(chatRefreshInterval);
}

