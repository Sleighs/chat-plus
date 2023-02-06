
//////   Define Variables   //////

// Options Variables
let optionsState = {
  enableChatPlus: true,
  debug: true,
  colorUsernames: true,
  showUsernameListOnStartup: false,
  enableUsernameMenu: true,
  popupBelow: false,
};
var enableApp, 
  colorUsernames, 
  debugMode, 
  showUsernameListOnStartup,
  enableUsernameMenu,
  popupBelow;

//var mainUserList = true;
//var popoutUserList = false;

const saveOptionsToStorage = () => {
  chrome.storage.sync.set({ options: {
    enableChatPlus: enableApp,
    debug: debugMode,
    colorUsernames: colorUsernames,
    showUsernameListOnStartup: showUsernameListOnStartup,
    enableUsernameMenu: enableUsernameMenu,
    popupBelow: popupBelow,
  } })
  .then(function (result) {
    //console.log('Options saved to storage')
  });
};


// Chat history
var currentChatHistory = [];

// Text colors
var usernameColors = {
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

var messageColors = { 
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

// Get current user from page if logged in
var currentUser = '';
const rantEle = document.querySelectorAll('.chat-history--rant-head');
const usernameEle = document.querySelectorAll('.chat-history--rant-username');

if (rantEle && usernameEle) {
  if (usernameEle.length > 0) {
    currentUser = usernameEle[usernameEle.length - 1].textContent;
  } 
}

// Get current streamer from page if exists
var currentStreamer = '';
const authorEle = document.querySelector('.media-by--a');
const authorHref = authorEle.getAttribute('href');

if (authorEle && authorHref){
  currentStreamer = authorHref.replace('/c/', '');
}






//////   Chat History  //////

// Get chat elements
const chatHistoryEle = document.querySelectorAll('.chat-history');
const chatHistoryList = document.getElementById('chat-history-list');
const chatHistoryRows = document.querySelectorAll('.chat-history--row');
const chatHistoryNames = document.querySelectorAll('.chat-history--username');
const chatHistoryMessages = document.querySelectorAll('.chat-history--message');

// Retrieves user color from userColor object
const getUserColor = (username) => {
  if ( 
    optionsState.colorUsernames === false
    //|| colorUsernames === false 
  ){
    userColors[username] = usernameColors.rumbler;
  } else if (!userColors[username]) {
    userColors[username] = getRandomColor();
  }
  //console.log('colorUsername, userColors[username], optionsState.colorUsernames', colorUsernames, optionsState.colorUsernames, userColors[username])
  return userColors[username];
}

// Highlight each term in a string, for usernames in messages
function highlightString(text, searchTerm, color, backgroundColor) {
  // Get inde of search term
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
      // If default colors option is selected, igonre
    element.childNodes[0].style.color = userColor;
    //element.childNodes[1].style.color = messageColors.chatPlus;

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

// Get chat history on page load
function wait() {
  var time = 225;
  setTimeout(function() {
  //getChatHistory();
    //console.log('Executed after + ' + time + ' miliseconds.');

    // if enableApp is undefined set to true
  }, time);
}
wait()

// Refresh chat history every 120 seconds
const chatRefreshInterval = setInterval(function(){
  //console.log('refreshing chat history');
  getChatHistory()
}, 120000);

 // Clear interval if there is no chat history
if (!chatHistoryList){
  //console.log('clearing chat refresh interval')
  clearInterval(chatRefreshInterval);
}





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
  popup.style.zIndex = '9999';
  popup.style.padding = '0 7px';
  popup.style.outline = '1px solid rgba(136,136,136,.25)';
  popup.style.outlineOffset = '0px';

  // Position popup
  popup.style.position = 'absolute';
  popup.style.left = coordinates.left + 'px';

  if (popupBelow || optionsState.popupBelow){
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
  popupContent.style.zIndex = '9999';
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





///////   Chat Listeners   ///////

// Create a MutationObserver instance to watch for new chat messages
var chatObserver = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    if (mutation.type === "childList") {
      // Loop through the added nodes to find new messages
      for (var i = 0; i < mutation.addedNodes.length; i++) {
        var addedNode = mutation.addedNodes[i];
        if (addedNode.classList.contains("chat-history--row")) {
          // Check element classlist for 'chat-history--rant' 
          if (addedNode.classList.contains('chat-history--rant')) {
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

  var usernameListPopup = document.querySelector('.chat-plus-popup');

  // If space bar is pressed remove username list popup
  if (usernameListPopup && event.keyCode === 32) {
    // Close popup
    if (usernameListPopup) {
      showUsernameList = false;
      usernameListPopup.remove()
    }
  }

  // If backspace is pressed remove username list popup
  if (usernameListPopup && event.keyCode === 8) {
    // Close popup
    if (usernameListPopup) {
      showUsernameList = false;
      usernameListPopup.remove()
    }
  }
});

// Listen for input in chat message input
let inputElement = document.getElementById("chat-message-text-input");

if (inputElement) {
  inputElement.addEventListener("input", function() {
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

// Listen for resize event
window.addEventListener('resize', function(event){
  var usernameListPopup = document.querySelector('.chat-plus-popup');

  if (usernameListPopup) {
    showUsernameList = false;
    usernameListPopup.remove()
  }  
}, true);





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
  usernameMenuContainer.style.zIndex = '9998';
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
  usernameMenuButton.style.zIndex = '9999';
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
  usernameMenuButtonText.style.zIndex = '8999';
  usernameMenuButtonText.style.color = 'rgb(255,255,255,0.33)';

  usernameMenuButtonText.textContent = 'User List';

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
    usernameMenuContainer.style.width = '100px';
    usernameMenuContainer.style.height = '100%';
    usernameMenuContainer.style.borderLeft = `solid 1pt rgb(255,255,255,0.25)`;
    
    // Remove children from username menu container
    while (usernameMenuContainer.firstChild) {
      usernameMenuContainer.removeChild(usernameMenuContainer.firstChild);
    }

    // Add toggle button element
    const usernameMenuButton = document.createElement('div');
    
    usernameMenuButton.classList.add('username-menu-button');
    usernameMenuButton.style.width = '100%';
    usernameMenuButton.style.height = '17px';
    usernameMenuButton.style.background = 'rgb(133, 199, 66, .95)';
    usernameMenuButton.style.color = messageColors.rumbleDarkBlue;
    usernameMenuButton.style.zIndex = '9999';
    usernameMenuButton.style.fontSize = '.9rem';
    usernameMenuButton.style.display = 'flex';
    usernameMenuButton.style.justifyContent = 'center';
    usernameMenuButton.style.alignItems = 'center';
    usernameMenuButton.textContent = 'Hide';
    
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
    usernameMenuList.style.zIndex = '9999';
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
      
      usernameTextElement.style.color = sortedUserColors[user];
      usernameTextElement.style.fontSize = '1rem';
      usernameTextElement.style.listStyle = 'none';
      usernameTextElement.style.cursor = 'pointer';
      usernameTextElement.style.fontWeight = 'bold';
      usernameTextElement.style.zIndex = '99990';
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
    usernameMenuButton.style.zIndex = '9999';
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
    usernameMenuButtonText.style.zIndex = '8999';
    usernameMenuButtonText.style.color = 'rgb(255,255,255,0.33)';

    usernameMenuButtonText.textContent = 'User List';

    usernameMenuButton.appendChild(usernameMenuButtonText);
    usernameMenuContainer.appendChild(usernameMenuButton);
  }

  showUsernameList = toggle;
  
  // Save options to storage if showUsernameListOnStartup is enabled
  if (showUsernameListOnStartup) {
    saveOptionsToStorage()
  }
};





//////   Initialize App   ///////

// Get options from storage
(() => {
  chrome.storage.sync.get("options")
  .then(function (result) {
    const defaultOptions = {
      enableChatPlus: true,
      debug: false,
      colorUsernames: true,
      showUsernameListOnStartup: false,
      enableUsernameMenu: false,
      popupBelow: false
    };

    var optionsList = [
      "enableChatPlus", 
      "debug", 
      "colorUsernames", 
      "showUsernameListOnStartup",
      "enableUsernameMenu",
      "popupBelow"
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
    }

    let newOptionObj = extractProperties(optionsList, result.options);

    enableApp = newOptionObj.enableChatPlus;
    colorUsernames = newOptionObj.colorUsernames;
    debugMode = newOptionObj.debug;
    showUsernameListOnStartup = newOptionObj.showUsernameListOnStartup;
    enableUsernameMenu = newOptionObj.enableUsernameMenu;
    popupBelow = newOptionObj.popupBelow;

    Object.assign(optionsState, newOptionObj);
    
    if (debugMode) console.log('init optionsState', optionsState)
    
  }).then(() => {
    getChatHistory();
  
    if (optionsState.enableUsernameMenu) {
      addChatUsernameMenu();
    }
    if (
      optionsState.enableUsernameMenu 
      && optionsState.showUsernameListOnStartup
    ) {
      toggleChatUsernameMenu(optionsState.showUsernameList)
    }

    //if (debugMode) console.log('optionsState init2', optionsState);
  });
})();


