function highlightFootnote(elementId) {
    var element = document.getElementById(elementId);
    var completedAnimation = false;
    element.style.backgroundColor = '#4b4';
    setTimeout(function() {
      element.style.backgroundColor = '';
    }, 2000);
}