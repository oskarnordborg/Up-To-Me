document.addEventListener("push", (event) => {
  const options = {
    body: event.data.text(),
    icon: "/path/to/your/icon.png",
  };
  event.waitUntil(document.registration.showNotification("UpToMe", options));
});
