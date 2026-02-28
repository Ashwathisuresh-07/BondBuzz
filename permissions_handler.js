document.getElementById('grantBtn').addEventListener('click', async () => {
  const statusElement = document.getElementById('status');
  try {
    // This triggers the real browser permission prompt
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    
    // Stop the camera immediately after getting permission
    stream.getTracks().forEach(track => track.stop());
    
    statusElement.textContent = "Permission Granted! You can now close this tab.";
    statusElement.style.color = "green";
    
    // Optional: Close tab automatically after 2 seconds
    setTimeout(() => {
      window.close();
    }, 2000);
    
  } catch (err) {
    statusElement.textContent = "Error: " + err.message;
    statusElement.style.color = "red";
    console.error("Camera permission error:", err);
  }
});