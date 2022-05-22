import { choropleth } from  "./choropleth.js";
import { line } from "./line.js";

function main() {
  let initialYear = 2020; // Initialise Time Variable

  timeline(initialYear); // Initialise Timeline
  choropleth("#choropleth", initialYear); // Draw Choropleth
  line("#line", "Total World"); // Draw Line Chart
}

// Timeline & Play/Pause Features
function timeline(year) {
  // Initialise Timeline
  let playButton = document.getElementById("play");
  document.getElementById("year").value = year;
  document.getElementById("yearLabel").innerText = year;

  // Timeline Play/Pause Functionality
  playButton.addEventListener("click", () => {
    // If Timeline Already Playing, Stop
    if (playButton.classList.contains("playing")) {
      let timeoutIDs = setTimeout(function() {}, 0);
      while (timeoutIDs--) clearTimeout(timeoutIDs);
      playButton.classList.remove("playing");
      playButton.innerHTML = "<ion-icon name='play'></ion-icon>";
    }
    // Else Start Timeline Play
    else {
      playButton.classList.add("playing");
      playButton.getElementsByTagName("ion-icon")[0].name = "pause";

      let scrollBar = document.getElementById("year");
      let label = document.getElementById("yearLabel");

      // Reset Scrollbar If At End
      if (scrollBar.value == 2020)
      {
        scrollBar.value = 1966;
        label.innerText = scrollBar.value;
      }

      // Loop Through Timeline
      let loopTimeout = function(i, max, interval, func) {
        if (i > max) { // end of timeline
          playButton.getElementsByTagName("ion-icon")[0].name = "play";
          playButton.classList.remove("playing");
          return;
        }
        func(i); // call update functino
        i++; // increment control variable
        setTimeout(function() { loopTimeout(i, max, interval, func) }, interval);
      };
      loopTimeout(parseInt(scrollBar.value), 2020, 1000, (year) => {
        scrollBar.value = year; label.innerText = year;
        document.getElementById("year").dispatchEvent(new Event("change"));
      });
    }
  });
}

window.onload = main;
