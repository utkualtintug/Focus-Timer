// Get references to DOM elements and initialize audio for alarm
const startBtn = document.getElementById("start");
const resetBtn = document.getElementById("reset");
const timer = document.getElementById("timer");
const saveBtn = document.getElementById("save");
const focusTimeInput = document.getElementById("focusTimeInput");
const shortBreakTimeInput = document.getElementById("shortBreakTimeInput");
const longBreakTimeInput = document.getElementById("longBreakTimeInput");
const modal = document.getElementById("settingsModal");
const btn = document.getElementById("settingsBtn");
const span = document.querySelector(".close");
const toggleSwitch = document.getElementById("toggleSwitch");
const sound = new Audio("../sounds/alarm.mp3");

// Add event listeners for button clicks
startBtn.addEventListener("click", startTimer);
resetBtn.addEventListener("click", resetTimer);
saveBtn.addEventListener("click", saveNewTime);

// Initialize variables for timer state and settings
var isPaused = false;
let countdown = null;
let shortBreak = false;
let defaultFocusTime = 25;
let defaultShortBreakTime = 5;
let defaultLongBreakTime = 15;
let minuteTime = defaultFocusTime;
let time = minuteTime * 60;
let sessionCount = 0;

// Restrict input values to a maximum and minimum range
function enforceMaxValue(input, max) {
    input.addEventListener("input", () => {
        let value = parseInt(input.value, 10);
        if (value > max) {
            input.value = max;
        } else if (value < 0) {
            input.value = 0;
        }
    });
}

// Load saved focus time from localStorage when the page loads
window.addEventListener("load", () => {
    const savedFocusTime = localStorage.getItem("focusTime");
    if (savedFocusTime) {
        defaultFocusTime = parseInt(savedFocusTime, 10);
        minuteTime = defaultFocusTime;
        time = minuteTime * 60;
        const minutesStr = String(minuteTime).padStart(2, "0");
        timer.textContent = `${minutesStr}:00`;
        document.title = `${minutesStr}:00 | Focus Timer`;
    }

    const savedShortBreakTime = localStorage.getItem("shortBreakTime");
    if (savedShortBreakTime) {
        defaultShortBreakTime = parseInt(savedShortBreakTime, 10);
    }

    const savedLongBreakTime = localStorage.getItem("longBreakTime");
    if (savedLongBreakTime) {
        defaultLongBreakTime = parseInt(savedLongBreakTime, 10);
    }

    const savedAutoStart = localStorage.getItem("autoStartBreaks");
    toggleSwitch.checked = savedAutoStart === "true";

    enforceMaxValue(focusTimeInput, 999);
    enforceMaxValue(shortBreakTimeInput, 999);
    enforceMaxValue(longBreakTimeInput, 999);
});

// Close modal on pressing Enter or Escape
document.addEventListener("keydown", (e) => {
    if (e.code === "Enter" && modal.style.display === "block") {
        saveNewTime()
    } else if (e.code === "Escape" && modal.style.display === "block") {
        modal.style.display = "none";
    }
});

// Start or pause the timer
function startTimer() {
    if (!shortBreak) {
        document.getElementById("title").textContent = "Focus!";
    } else {
        document.getElementById("title").textContent = "Short Break";
    }
    if (document.getElementById("start").textContent === "Start") {
        document.getElementById("start").textContent = "Pause";
        isPaused = false;
        logic();
    } else if (document.getElementById("start").textContent === "Pause") {
        pauseTimer();
    } else {
        document.getElementById("start").textContent = "Pause";
        isPaused = false;
    }
}

// Pause the timer
function pauseTimer() {
    document.getElementById("start").textContent = "Resume";
    document.getElementById("title").textContent = "Paused!";
    isPaused = true;
}

// Reset the timer to initial state
function resetTimer() {
    document.getElementById("start").textContent = "Start";
    document.getElementById("title").textContent = "Focus Timer";
    clearInterval(countdown);
    shortBreak = false;
    minuteTime = defaultFocusTime;
    time = minuteTime * 60;
    timer.textContent = `${String(minuteTime).padStart(2, "0")}:00`;
    document.title = `${String(minuteTime).padStart(2, '0')}:00 | Focus Timer`;
    isPaused = true;
    countdown = null;
    resetSessions();
}

// Update the timer display and handle timer completion
function update() {
    if (time <= 0) {
        playSound();
        clearInterval(countdown);
        countdown = null;
        isPaused = true;
        document.getElementById("start").textContent = "Start";

        if (toggleSwitch.checked) {
            if (!shortBreak) {
                completeFocus();
                if (sessionCount === 3) {
                    time = defaultLongBreakTime * 60;
                    minuteTime = defaultLongBreakTime;
                    document.getElementById("title").textContent = "Long Break";
                } else {
                    time = defaultShortBreakTime * 60;
                    minuteTime = defaultShortBreakTime;
                    document.getElementById("title").textContent = "Short Break";
                }
                shortBreak = true;
                isPaused = false;
                document.getElementById("start").textContent = "Pause";
                timer.textContent = `${String(minuteTime).padStart(2, '0')}:00`;
                document.title = `${String(minuteTime).padStart(2, '0')}:00 | Focus Timer`;
                logic();
            } else {
                completeBreak();
                if (sessionCount === 4) {
                    resetSessions();
                }
                time = defaultFocusTime * 60;
                minuteTime = defaultFocusTime;
                shortBreak = false;
                document.getElementById("title").textContent = "Focus!";
                isPaused = false;
                document.getElementById("start").textContent = "Pause";
                timer.textContent = `${String(minuteTime).padStart(2, '0')}:00`;
                document.title = `${String(minuteTime).padStart(2, '0')}:00 | Focus Timer`;
                logic();
            }
        } else {
            if (!shortBreak) {
                completeFocus();
                if (sessionCount === 3) {
                    time = defaultLongBreakTime * 60;
                    minuteTime = defaultLongBreakTime;
                    document.getElementById("title").textContent = "Long Break";
                    shortBreak = true;
                } else {
                    time = defaultShortBreakTime * 60;
                    minuteTime = defaultShortBreakTime;
                    document.getElementById("title").textContent = "Short Break";
                    shortBreak = true;
                }
            } else {
                completeBreak();
                if (sessionCount === 4) {
                    resetSessions();
                }
                time = defaultFocusTime * 60;
                minuteTime = defaultFocusTime;
                shortBreak = false;
                document.getElementById("title").textContent = "Focus!";
            }
        }

        let m = String(Math.floor(time / 60)).padStart(2, '0');
        let s = String(time % 60).padStart(2, '0');
        timer.textContent = `${m}:${s}`;
        document.title = `${m}:${s} | Focus Timer`;
        return;
    }

    if (!isPaused) {
        const m = String(Math.floor(time / 60)).padStart(2, '0');
        const s = String(time % 60).padStart(2, '0');
        timer.textContent = `${m}:${s}`;
        document.title = `${m}:${s} | Focus Timer`;
        time--;
    }
}

// Timer logic and interval management
function logic() {
    if (countdown === null) {
        update()
        countdown = setInterval(update, 1000);
    }
}

// Save new time settings from the modal inputs
function saveNewTime() {
    const newFocusTime = parseInt(focusTimeInput.value, 10);
    const newShortBreakTime = parseInt(shortBreakTimeInput.value, 10);
    const newLongBreakTime = parseInt(longBreakTimeInput.value, 10);

    if ((!isNaN(newFocusTime) && newFocusTime > 0 && newFocusTime <= 999) &&
        (!isNaN(newShortBreakTime) && newShortBreakTime > 0 && newShortBreakTime <= 999) &&
        (!isNaN(newLongBreakTime) && newLongBreakTime > 0 && newLongBreakTime <= 999)
    ) {
        defaultFocusTime = newFocusTime;
        defaultShortBreakTime = newShortBreakTime;
        defaultLongBreakTime = newLongBreakTime;

        minuteTime = newFocusTime;
        time = minuteTime * 60;

        localStorage.setItem("focusTime", newFocusTime);
        localStorage.setItem("shortBreakTime", newShortBreakTime);
        localStorage.setItem("longBreakTime", newLongBreakTime);
        localStorage.setItem("autoStartBreaks", toggleSwitch.checked);

        const minutesStr = String(minuteTime).padStart(2, "0");
        timer.textContent = `${minutesStr}:00`;
        document.title = `${minutesStr}:00 | Focus Timer`;
    } else {
        alert("Please enter numbers between 1 and 999!");
    }

    focusTimeInput.value = "";
    shortBreakTimeInput.value = "";
    longBreakTimeInput.value = "";
    modal.style.display = "none";
}

// Open the settings modal and populate it with current values
btn.onclick = function () {
    modal.style.display = "block";
    focusTimeInput.value = defaultFocusTime;
    shortBreakTimeInput.value = defaultShortBreakTime;
    longBreakTimeInput.value = defaultLongBreakTime;
    focusTimeInput.focus();
}

// Close the modal when the user clicks on the close button
span.onclick = function () {
    modal.style.display = "none";
}

// Close the modal when clicking outside of it
window.onclick = function (event) {
    if (event.target === modal) {
        modal.style.display = "none";
    }
}

// Play the alarm sound
function playSound() {
    sound.currentTime = 0;
    sound.volume = 0.2;
    sound.play();
}

// Visually indicate completion of a focus session
function completeFocus() {
    if (sessionCount < 4) {
        const dots = document.querySelectorAll(".dot");
        dots[sessionCount].classList.add("half-filled");
    }
}

// Visually indicate completion of a break session
function completeBreak() {
    if (sessionCount < 4) {
        const dots = document.querySelectorAll(".dot");
        dots[sessionCount].classList.remove("half-filled");
        dots[sessionCount].classList.add("filled");
        sessionCount++;
    }
}

// Reset the visual indicators for sessions
function resetSessions() {
    const dots = document.querySelectorAll(".dot");
    dots.forEach(dot => {
        dot.classList.remove("half-filled", "filled");
    });
    sessionCount = 0;
}
