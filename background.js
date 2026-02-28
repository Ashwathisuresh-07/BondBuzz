// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, push, onChildAdded } 
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// 🔥 Replace with your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBdlExvjIRseA9lfF6o-SVaSgY7d_kZpZ4",
  authDomain: "bondbuzz-7bba4.firebaseapp.com",
  databaseURL: "https://bondbuzz-7bba4-default-rtdb.firebaseio.com",
  projectId: "bondbuzz-7bba4",
  storageBucket: "bondbuzz-7bba4.firebasestorage.app",
  messagingSenderId: "360089807103",
  appId: "1:360089807103:web:2dca5dfefe01715f72c4ca"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let currentRoom = null;
let listenerAttached = false;

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  // When user connects to a room
  if (request.type === "CONNECT_ROOM") {
    currentRoom = request.room;
    listenForMessages(currentRoom);
    listenerAttached = true;
  }

  // When user sends a message
  if (request.type === "SEND_MESSAGE") {
    if (!currentRoom) return;

    push(ref(db, "rooms/" + currentRoom), {
      message: request.message,
      timestamp: Date.now()
    });
  }
  //when user sends image
  if (request.type === "SEND_IMAGE") {
    push(ref(db, "rooms/" + currentRoom), {
      type: "image",
      image: request.imageData,
      timestamp: Date.now()
    });
  }
});
//overlay
function showOverlay(message) {

  // Remove old popup if exists
  const old = document.getElementById("bondbuzz-overlay");
  if (old) old.remove();

  const box = document.createElement("div");
  box.id = "bondbuzz-overlay";

  // Check message type and create content accordingly
  if (message.type === "text") {
    box.innerText = message.content;
  } else if (message.type === "image") {
    const img = document.createElement("img");
    img.src = message.content;
    img.style.maxWidth = "100%";
    img.style.height = "auto";
    box.appendChild(img);
  } else {
      box.innerText = "Unknown message type.";
  }

  box.style.position = "fixed";
  box.style.top = "20px";
  box.style.right = "20px";
  box.style.background = "#ff4d6d";
  box.style.color = "white";
  box.style.padding = "15px 20px";
  box.style.borderRadius = "12px";
  box.style.boxShadow = "0 5px 15px rgba(0,0,0,0.3)";
  box.style.zIndex = "999999";
  box.style.fontSize = "16px";
  box.style.fontFamily = "Arial";
  box.style.maxWidth = "250px";

  document.body.appendChild(box);

  setTimeout(() => {
    box.remove();
  }, 5000);
  if (message.type === "image") {
    const img = document.createElement("img");
    img.src = message.content;
    img.style.width = "100%";
    img.style.borderRadius = "8px";
    img.style.display = "block";
    box.appendChild(img);
    
    const label = document.createElement("div");
    label.innerText = "Sent you a photo! 📸";
    label.style.fontSize = "12px";
    label.style.marginTop = "5px";
    box.appendChild(label);
  } else {
    box.innerText = message.content || message;
  }

  document.body.appendChild(box);

  // Auto-remove after 8 seconds
  setTimeout(() => { if(box) box.remove(); }, 8000);
}

// Listen for incoming messages
function listenForMessages(room) {

  const roomRef = ref(db, "rooms/" + room);

  onChildAdded(roomRef, (snapshot) => {

    const data = snapshot.val();

    // Show Chrome notification
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      
      // ✅ FIX: Verify tab exists and is NOT a chrome:// or restricted URL
      if (activeTab && activeTab.url && activeTab.url.startsWith("http")) {
        chrome.scripting.executeScript({
          target: { tabId: activeTab.id },
          func: showOverlay,
          args: [data.message]
        }).catch(err => console.error("Injection failed:", err));
      } else {
        console.warn("Overlay skipped: Cannot inject into restricted Chrome page.");
      }
    });
  });
}