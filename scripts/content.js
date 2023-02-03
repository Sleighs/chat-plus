

/* # To-Do

  1. Add option to turn off username colors

  2. Add popup to show list of usernames in chat
    - If @ is pressed, show list of usernames in chat. 
    - If username is selected, add username to message
    - add new users to list as they join chat
    - remove users from list periodically

  3. Find all username mentions

*/




// Store chat history
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
  marinerTeal: '#4FB5B0',
  coolBlue: '#07F7F7',
  dreamyBlue: '#2DA3FB',
}

var messageColors = { 
  chatPlus: '#E0E9F2',
  rumble: '#d6e0ea',
  white: '#FFFFFF',
}

let userColors = {}

const getRandomColor = () => {
  const colors = Object.values(usernameColors);
  return colors[Math.floor(Math.random() * colors.length)];
}

var currentUser = '';

// Set current user
const rantEle = document.querySelectorAll('.chat-history--rant-head');
const usernameEle = document.querySelectorAll('.chat-history--rant-username');

// Get current user
if (rantEle && usernameEle) {
  if (usernameEle.length > 0) {
    currentUser = usernameEle[usernameEle.length - 1].textContent;
  } 
}

// 'class-history' element
const chatHistoryEle = document.querySelectorAll('.chat-history');

// Get chat element id 'class-history-list'
const chatHistoryList = document.getElementById('chat-history-list');
const chatHistoryRows = document.querySelectorAll('.chat-history--row');
const chatHistoryNames = document.querySelectorAll('.chat-history--username');
const chatHistoryMessages = document.querySelectorAll('.chat-history--message');

// Asign random color to each unique username in current chat history
const assignRandomColor = (array) => {
  const colors = Object.values(usernameColors);
  let colorIndex = 0;

  for (let i = 0; i < array.length; i++) {
    const user = array[i];
    if (!userColors[user.username]) {
      userColors[user.username] = colors[colorIndex % colors.length];
      colorIndex++;
    }
    console.log('assignRandomColor', user, colors, userColors )
  }
}

const getUserColor = (username) => {
  if (!userColors[username]) {
    userColors[username] = getRandomColor();
  }
  return userColors[username];
}

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

function insertUsername(username, message, caretPos) {
  return message.slice(0, caretPos) + username + message.slice(caretPos);
}

function storeCaretPosition(input) {
  const caretPosition = input.selectionStart;
  return caretPosition;
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

const openChatUsernamesPopup = () => {
  // Create popup element
  const popup = document.createElement('div');
  popup.classList.add('chat-plus-popup');
  popup.style.position = 'relative';
  popup.style.width = '125px';
  popup.style.maxWidth = '125px';
  popup.style.height = '135px';
  popup.style.overflowY = 'scroll';
  popup.style.overflowX = 'auto';
  popup.style['-ms-overflow-style'] = 'none';
  popup.style.backgroundColor = '#061726';
  popup.style.borderRadius = '5px';
  popup.style.zIndex = '9999';
  popup.style.padding = '0 5px';
  popup.style.marginLeft = '10px';

  // Create popup close button
  const popupClose = document.createElement('button');
  popupClose.classList.add('chat-plus-popup-close');
  popupClose.style.position = 'fixed';
  popupClose.style.marginTop = '0';
  popupClose.style.padding = '6px';
  popupClose.style.backgroundColor = 'transparent';
  popupClose.style.color = 'black';
  popupClose.style.border = 'none';
  popupClose.style.zIndex = '9999';
  popupClose.innerHTML = 'X';
  popupClose.addEventListener('click', () => {
    popup.remove();
  });
  popup.appendChild(popupClose);

  // Create popup content element
  const popupContent = document.createElement('ul');
  popupContent.classList.add('chat-plus-popup-content');
  popupContent.style.position = 'relative';
  popupContent.style.width = '100%';
  popupContent.style.height = '100%';
  popupContent.style.zIndex = '9999';
  popupContent.style.overflow = 'auto';
  popup.appendChild(popupContent);


  // Populate popup content with usernames from userColors object

  // Create a sorted object of userColors by username
  const sortedUserColors = Object.keys(userColors).sort().reduce(
    (obj, key) => {
      obj[key] = userColors[key];
      return obj;
    }, {}
  );

  // Loop through sortedUserColors object and add usernames to popup content
  for (let user in sortedUserColors) {
    const usernameTextElement = document.createElement('li');
    usernameTextElement.style.color = sortedUserColors[user];
    usernameTextElement.style.fontSize = '1rem';
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

  var chatFormEle = document.getElementById('chat-message-form')

  chatFormEle.appendChild(popup);
}
  

/*
// Get chat history from chrome storage
const getChatHistoryFromStorage = () => {
  chrome.storage.sync.get(['chatHistory'], function(result) {
    console.log('Value currently is ' + result.chatHistory);
    
    // Compare current chat history with stored chat history
    currentChatHistory = result.chatHistory;
  }); 
};

// Store chat history in chrome storage
const storeChatHistory = () => {
  chrome.storage.sync.set({ chatHistory: currentChatHistory }, function() {
    console.log('Value is set to ' + currentChatHistory);
  });
};
*/

// Get chat history on page load
getChatHistory();

// Create a MutationObserver instance
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
              console.log('username detected with @', 
                addedNode.childNodes[1].textContent,
                currentUser,
              )
              addedNode.childNodes[1].innerHTML = highlightString(addedNode.childNodes[1].textContent, '@' + currentUser, 'white', 'rgb(234, 100, 4, .85)');
            } else 

            if (
              addedNode.childNodes[1].textContent.toLowerCase().includes((currentUser).toLowerCase())
            ) {
              console.log('username detected', 
                addedNode.childNodes[1].textContent,
                currentUser,
              )
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
chatObserver.observe(document.querySelector('#chat-history-list'), { childList: true });

// Listen for "@" keypress to open popup
document.addEventListener("keydown", function(event) {
  // If "2" key is pressed and shift key is held down
  /*if (event.keyCode === 50 && event.shiftKey && !document.querySelector('.chat-plus-popup')) {
    // Open username list popup
    openChatUsernamesPopup();
  }*/

  // If space bar is pressed remove username list popup
  if (event.keyCode === 32) {
    // Close popup
    var usernameListPopup = document.querySelector('.chat-plus-popup');
    if (usernameListPopup) {
      usernameListPopup.remove()
    }
  }

  // If backspace is pressed remove username list popup
  if (event.keyCode === 8) {
    // Close popup
    var usernameListPopup = document.querySelector('.chat-plus-popup');
    if (usernameListPopup) {
      usernameListPopup.remove()
    }
  }
});

// Listen for input in chat message input
let inputElement = document.getElementById("chat-message-text-input");

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

  // If @ is found in the input and caret is next to it
  if ( 
    !document.querySelector('.chat-plus-popup') 
    && atSignIndexes.includes(caretPosition - 1)
  ) {
    //console.log("The @ character was found at index " + atSignIndexes);

    // Open username list popup
    openChatUsernamesPopup();
  } 
});

// Close popup when clicking outside of it
document.addEventListener("click", function(event) {
  var usernameListPopup = document.querySelector('.chat-plus-popup');

  if (usernameListPopup && !usernameListPopup.contains(event.target)) {
    usernameListPopup.remove()
  }
});

// Refresh chat history every 120 seconds
setInterval(function(){
  console.log('refreshing chat history');
  getChatHistory()
  //console.log('currentChatHistory', currentChatHistory)
  
  
  // Clear interval when user is logged out
  if (currentUser === ''){
    clearInterval();
  }
}, 12000);








// Append test button to chat window
const testBtn = document.createElement('div');
testBtn.innerHTML = 'Test';
testBtn.style.maxWidth = '200px';
testBtn.style.wordWrap = 'break-word';
testBtn.style. height = '100%';
testBtn.addEventListener('click', ()=>{
  //showChatHistory()
  //console.log('userColors', userColors);
  //console.log('currentChatHistory', currentChatHistory);
  //openChatUsernamesPopup();
  var sampletext = 'element @airborneevil childNodes @AirborneEvil textContent airborneevil;;;';
  var newEle1 = document.createElement('div');
  var newEle2 = document.createElement('div');
  newEle1.innerHTML = highlightString(sampletext, currentUser, 'white', 'rgb(234, 100, 4, .85)');
  newEle2.innerHTML = highlightString(sampletext, currentUser, 'white', 'rgb(234, 100, 4, .85)');
  testBtn.appendChild(newEle1);
  testBtn.appendChild(newEle2);
});
//chatHistoryEle[0].appendChild(testBtn);


