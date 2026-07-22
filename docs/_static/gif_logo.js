document.addEventListener("DOMContentLoaded", function () {
  var logo = document.querySelector(".gif-logo");
  if (!logo) return;

  var staticSrc = logo.dataset.static;
  var gifSrc = logo.dataset.gif;

  logo.addEventListener("mouseenter", function () {
    // cache-bust so the gif restarts from frame 1 every time
    logo.src = gifSrc + "?t=" + Date.now();
  });

  logo.addEventListener("mouseleave", function () {
    logo.src = staticSrc;
  });
});
