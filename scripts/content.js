
var usernameColors = {
  divaPink: '#FF63B4', 
  magenta: '#E509FB',//ff00ff',
  streamerRed: '#FF1515',
  brightYellow: '#FFFF80',
  orange: 'orange',
  springGreen: '#B9E50B',//C4F503',//a6d644',//C1F142',
  streamerGreen: '#15FF8D', //A6FF73
  grassGreen: '#05C305',
  coolBlue: '#07F7F7',
  dreamyBlue: '#1B98F5',
  vacationTeal: '#56B6CA',
  slateGray: '#F2F7F8',//7996B4',//#708090',
  
}

let userColors = {}
const getRandomColor = () => {
  const colors = Object.values(usernameColors);
  return colors[Math.floor(Math.random() * colors.length)];
}
var currentChatHistory = [];
var currentUser = 'AirborneEvil';

// 'class-history' element
const chatHistoryEle = document.querySelectorAll('.chat-history');

// Get chat element id 'class-history-list'
const chatHistoryList = document.getElementById('chat-history-list');
const chatHistoryRows = document.querySelectorAll('.chat-history--row');
const chatHistoryNames = document.querySelectorAll('.chat-history--username');
const chatHistoryMessages = document.querySelectorAll('.chat-history--message');

// Show chat history when user clicks 'test' button


const showChatHistory = () => {
  /*chatHistoryRows.forEach((element, index) => {
    console.log(
      'index: ' + index,
      'username: ' + element.childNodes[0].textContent,
      'message: ' + element.childNodes[1].textContent
    );
  });*/
  console.log('currentChatHistory', currentChatHistory);
}

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

const getChatHistory = () => {
  chatHistoryRows.forEach((element, index) => {
    //Assign random color to each unique username in current chat history
    let userColor = getUserColor(element.childNodes[0].textContent);

    // Add the message to the chat history
    currentChatHistory.push({
      username: element.childNodes[0].textContent,
      message: element.childNodes[1].textContent,
      color: userColor,
      date: Date.now(),
    });

    // Assign color to username
      // If default colors selected, igonre
    element.childNodes[0].style.color = userColor;

    // Highlight current user's username when tagged with '@'
    if (element.childNodes[1].textContent.includes('@' + currentUser)) {
      element.childNodes[1].style.color = 'white';
      element.childNodes[1].style.backgroundColor = 'rgb(234, 100, 4, .85)';
    }
    
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
          /*console.log("New message detected:", 
            addedNode.childNodes[0].textContent,
            addedNode.childNodes[1].textContent
          );*/

          // Add the message to the chat history
          let userColor = getUserColor(addedNode.childNodes[0].textContent);

          // Add the message to the chat history
          currentChatHistory.push({
            username: addedNode.childNodes[0].textContent,
            message: addedNode.childNodes[1].textContent,
            color: userColor,
            date: Date.now(),
          });

          // Assign color to username
          addedNode.childNodes[0].style.color = userColor;

          // Highlight current user's username when tagged with '@'
          if (addedNode.childNodes[1].textContent.includes('@' + currentUser)) {
            addedNode.childNodes[1].style.color = 'white';
            addedNode.childNodes[1].style.backgroundColor = 'rgb(234, 100, 4)';
          }
          
          // Replace '@' tagged username with span element of current user's username
          if (addedNode.childNodes[1].textContent.includes('@' + currentUser)) {
            const message = addedNode.childNodes[1].textContent;
            const messageArray = message.split(' ');
            //const taggedUsername = messageArray[0].substring(1);
            //const newMessage = message.replace('@' + taggedUsername, '<span style="color: white; background-color: Orange;">' + '@' + currentUser + '</span>');
            //addedNode.childNodes[1].innerHTML = newMessage;
          }
        }
      }
    }
  });
});

// Observe the chat container element for changes to its child elements
chatObserver.observe(document.querySelector('#chat-history-list'), { childList: true });


// Append test button to chat window
const testBtn = document.createElement('button');
testBtn.innerHTML = 'Test';
testBtn.addEventListener('click', showChatHistory);
//chatHistoryEle[0].appendChild(testBtn);



/*
window.onload = function() {
  // Get chat history on page load
  getChatHistory();
}
*/


// Set color's for usernames

// highlight user's username when mentioned in chat

// If @ is pressed, show list of usernames in chat. 
  // If username is selected, add username to message
