
//////   Define Variables   //////

// Options
var optionsState = {
  enableChatPlus: true,
  debug: true,
  colorUsernames: true
};
var enableApp, colorUsernames, debugMode;

//var showUsernameList = false;
//var mainUserList = true;
//var popoutUserList = false;

// Get options from storage
(() => {
  chrome.storage.sync.get("options")
  .then(function (result) {
    const defaultOptions = {
      enableChatPlus: true,
      debug: false,
      colorUsernames: true
    };

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

    let newOptionObj = extractProperties(optionsList, result.options);

    enableApp = newOptionObj.enableChatPlus;
    colorUsernames = newOptionObj.colorUsernames;
    debugMode = newOptionObj.debug;

    //optionsState = newOptionObj;
    Object.assign(optionsState, newOptionObj);

    if (debugMode) console.log('optionsState1', optionsState)
  });
})();

// Block function if app is disabled
if (
  optionsState.enableApp === false
  //|| enableApp === false
) {
  console.log('ChatPlus is disabled');
} else {

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
  brightYellow: '#FFFF4A',//FFFF6B',
  orange: 'orange',
  springGreen: '#B9E50B',
  streamerGreen: '#15FF8D',
  grassGreen: '#05C305',
  marinerTeal: '#48A4A0',//4FB5B0',
  coolBlue: '#07F7F7',
  dreamyBlue: '#2DA3FB',
}

var messageColors = { 
  chatPlus: '#E0E9F2',
  rumble: '#d6e0ea',
  white: '#FFFFFF',
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
  var time = 250;
  setTimeout(function() {
  getChatHistory();
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

  // Position popup below caret
  popup.style.position = 'absolute';
  popup.style.top = coordinates.top + popupAdjustedHeight + 5 + 'px';
  popup.style.left = coordinates.left + 'px';

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
  



///////   Main Chat User List   ///////

var chatContainerElement = document.querySelector('.chat--container');


const addMainList = () => {
  var chatContainerElement = document.querySelector('.chat--container');

  const chatUserListElement = document.createElement('div');
  let chatContainerCoordinates = chatContainerElement.getBoundingClientRect();


  console.log('chatContainerCoordinates', chatContainerCoordinates)

  chatUserListElement.classList.add('chat-plus-user-list');
  chatUserListElement.style.position = 'absolute';

  chatUserListElement.style.top = '0';

  const chatUserListContentElement = document.createElement('ul');

};




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
  // Get chat container coordinates
  chatContainerCoordinates = chatContainerElement.getBoundingClientRect();
  //console.log('resized chatContainerCoordinates', chatContainerCoordinates)

  var usernameListPopup = document.querySelector('.chat-plus-popup');

  if (usernameListPopup) {
    showUsernameList = false;
    usernameListPopup.remove()
  }  
}, true);



  
} 
