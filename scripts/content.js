

/* # To-Do

  // Add option to turn off username colors

  // If @ is pressed, show list of usernames in chat. 
    // If username is selected, add username to message
*/


// Text colors
var usernameColors = {
  rumbler: '#88a0b8',
  divaPink: '#FF63B4', 
  magenta: '#BD03E5',
  electricPurple: '#850DF4',
  streamerRed: '#EA0101',
  sundayRed: '#FFBBB1',
  brightYellow: '#FFFF6B',
  orange: 'orange',
  springGreen: '#B9E50B',
  streamerGreen: '#15FF8D',
  grassGreen: '#05C305',
  marinerTeal: '#4FB5B0',
  coolBlue: '#07F7F7',
  dreamyBlue: '#2DA3FB',
}

var messageColors = { 
  chatPlus: '#EDF2F7',
  rumble: '#d6e0ea',
  white: '#FFFFFF',
}

let userColors = {}

const getRandomColor = () => {
  const colors = Object.values(usernameColors);
  return colors[Math.floor(Math.random() * colors.length)];
}

var currentChatHistory = [];
var currentUser = '';

// Set current user
const usernameEle = document.querySelector('.chat-history--rant-username');
currentUser = usernameEle.textContent;

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
  var index = text.indexOf(searchTerm);
  if (index >= 0) {
    return (
      text.substring(0, index) +
      "<span style='color: " +
      color +
      "; background-color: " + 
      backgroundColor +
      ";'>" +
      searchTerm +
      "</span>" +
      highlightString(text.substring(index + searchTerm.length), searchTerm, color, backgroundColor)
    );
  }
  return text;
}

const getChatHistory = () => {
  chatHistoryRows.forEach((element, index) => {
    //Assign random color to each unique username in current chat history
    let userColor = getUserColor(element.childNodes[0].textContent);

    // Assign text color to username and message
      // If default colors selected, igonre
    element.childNodes[0].style.color = userColor;
    //element.childNodes[1].style.color = messageColors.chatPlus;

    // Highlight current user's username when tagged with '@'
    if (element.childNodes[1].textContent.toLowerCase().includes(('@' + currentUser).toLowerCase())) {
      element.childNodes[1].innerHTML = highlightString(element.childNodes[1].textContent, '@' + currentUser, 'white', 'rgb(234, 100, 4, .85)');
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
          // Add the message to the chat history
          let userColor = getUserColor(addedNode.childNodes[0].textContent);

          // Assign color to username
          addedNode.childNodes[0].style.color = userColor;

          // Highlight current user's username when tagged with '@'
          if (addedNode.childNodes[1].textContent.toLowerCase().includes(('@' + currentUser).toLowerCase())) {
            addedNode.childNodes[1].innerHTML = highlightString(addedNode.childNodes[1].textContent, '@' + currentUser, 'white', 'rgb(234, 100, 4, .85)');
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


// Append test button to chat window
const testBtn = document.createElement('button');
testBtn.innerHTML = 'Test';
testBtn.addEventListener('click', ()=>{
  //showChatHistory()
  console.log('userColors', userColors);

  testBtn.innerHTML = highlightString('element @AirborneEvil childNodes textContent', '@' + currentUser, 'white', 'rgb(234, 100, 4, .85)');
});
//chatHistoryEle[0].appendChild(testBtn);


