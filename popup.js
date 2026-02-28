// Get elements
const roomInput = document.getElementById("roomCode");
const connectBtn = document.getElementById("connectBtn");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const statusText = document.getElementById("status");
const startCameraBtn = document.getElementById("startCameraBtn");
const videoFeed = document.getElementById("videoFeed");
const captureBtn = document.getElementById("captureBtn");
const canvas = document.getElementById("canvas");
const capturedImage = document.getElementById("capturedImage");
const sendImageBtn = document.getElementById("sendImageBtn");

let currentRoom = null;
let mediaStream = null;

// Load saved room when popup opens
chrome.storage.local.get(["room"], (result) => {
  if (result.room) {
    currentRoom = result.room;
    roomInput.value = currentRoom;
    statusText.textContent = "Connected to room: " + currentRoom;
  }
});

// Connect button
connectBtn.addEventListener("click", () => {
  const roomCode = roomInput.value.trim();

  if (!roomCode) {
    statusText.textContent = "Please enter a room code.";
    return;
  }

  currentRoom = roomCode;

  // Save room locally
  chrome.storage.local.set({ room: roomCode });

  statusText.textContent = "Connected to room: " + roomCode;

  // Inform background script
  chrome.runtime.sendMessage({
    type: "CONNECT_ROOM",
    room: roomCode
  });
});


// Send button
sendBtn.addEventListener("click", () => {
  const message = messageInput.value.trim();

  if (!message) {
    statusText.textContent = "Message cannot be empty.";
    return;
  }

  if (!currentRoom) {
    statusText.textContent = "Please connect to a room first.";
    return;
  }

  // Send message to background script
  chrome.runtime.sendMessage({
    type: "SEND_MESSAGE",
    room: currentRoom,
    message: {type: "text",content: message}
  });

  messageInput.value = "";
  statusText.textContent = "Message sent 💖";
});

//camera access
async function requestCamera() {
  try {
    // Attempting to access camera directly in popup
    mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
    
    // If successful, show the video feed
    videoFeed.srcObject = mediaStream;
    videoFeed.style.display = "block";
    captureBtn.style.display = "block";
    startCameraBtn.style.display = "none";
    statusText.textContent = "Camera started.";
  } catch (err) {
    // If permission is denied or blocked by the popup context, open dedicated page
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' || err.name === 'NotFoundError') {
      chrome.tabs.create({ url: 'permissions.html' });
      statusText.textContent = "Opening permission page...";
    } else {
      console.error("Camera error:", err);
      statusText.textContent = "Error: " + err.message;
    }
  }
}

// Camera Functionality (NEW)

startCameraBtn.addEventListener("click", async () => {
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoFeed.srcObject = mediaStream;
    videoFeed.style.display = "block";
    captureBtn.style.display = "block";
    startCameraBtn.style.display = "none";
    statusText.textContent = "Camera started.";
  } catch (error) {
  {chrome.tabs.create({ url: 'permissions.html' });}
}})

captureBtn.addEventListener("click", () => {
  if (!mediaStream) return;

  const context = canvas.getContext("2d");
  canvas.width = videoFeed.videoWidth;
  canvas.height = videoFeed.videoHeight;
  context.drawImage(videoFeed, 0, 0, canvas.width, canvas.height);

  const imageDataUrl = canvas.toDataURL("image/png");
  capturedImage.src = imageDataUrl;
  capturedImage.style.display = "block";
  sendImageBtn.style.display = "block";
  
  // Hide video and capture button
  videoFeed.style.display = "none";
  captureBtn.style.display = "none";
  
  // Stop camera stream
  mediaStream.getTracks().forEach(track => track.stop());
  mediaStream = null;
  statusText.textContent = "Image captured.";
});

sendImageBtn.addEventListener("click", () => {
  if (!currentRoom) {
    statusText.textContent = "Please connect to a room first.";
    return;
  }

  const imageDataUrl = capturedImage.src;
  
  if (!imageDataUrl || imageDataUrl === "") {
      statusText.textContent = "No image captured to send.";
      return;
  }

  // Send message with image data to background script
  chrome.runtime.sendMessage({
    type: "SEND_MESSAGE",
    room: currentRoom,
    message: { type: "image", content: imageDataUrl } // Send as base64
  });

  // Reset camera section
  capturedImage.style.display = "none";
  capturedImage.src = "";
  sendImageBtn.style.display = "none";
  startCameraBtn.style.display = "block";
  
  statusText.textContent = "Image sent 📸💖";
});