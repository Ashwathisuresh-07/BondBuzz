document.getElementById('grantBtn').addEventListener('click', async () => {
  try {
    await navigator.mediaDevices.getUserMedia({ video: true });
    alert("Permission granted! You can close this tab.");
    window.close(); 
  } catch (e) {
    console.error("Still no access:", e);
  }
});