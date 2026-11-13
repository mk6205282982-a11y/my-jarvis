
const micButton = document.getElementById("micButton");
const stopButton = document.getElementById("stopButton");
const sendButton = document.getElementById("sendButton");
const clearButton = document.getElementById("clearButton");
const saveKeyButton = document.getElementById("saveKey");

const input = document.getElementById("userInput");
const chat = document.getElementById("chat");
const statusText = document.getElementById("status");
const language = document.getElementById("language");
const reactor = document.getElementById("reactor");
const apiKeyInput = document.getElementById("apiKey");

const Recognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

let recognition = null;
let history = [];
let listening = false;
let apiKey = "";

function addMessage(message, type) {
    const div = document.createElement("div");

    div.className = "message " + type;
    div.textContent = message;

    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}

function speak(message) {
    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(message);

    speech.lang = language.value;
    speech.rate = 1;
    speech.pitch = 1;

    window.speechSynthesis.speak(speech);
}

function setStatus(message, active = false) {
    statusText.textContent = message;
    reactor.classList.toggle("active", active);
}

saveKeyButton.addEventListener("click", () => {
    apiKey = apiKeyInput.value.trim();

    if (!apiKey) {
        alert("Please enter your API key.");
        return;
    }

    alert("API key added for this session.");
});

async function askAI(message) {
    if (!apiKey) {
        const reply = "Please add your OpenAI API key first.";
        addMessage(reply, "bot");
        speak(reply);
        return;
    }

    setStatus("JARVIS THINKING...");

    try {
        const response = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + apiKey
                },

                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                        {
                            role: "system",
                            content:
                            "You are JARVIS, a friendly personal AI assistant. Answer in simple Hindi or English according to the user's language. Understand Hinglish too."
                        },
                        ...history.slice(-10),
                        {
                            role: "user",
                            content: message
                        }
                    ],
                    temperature: 0.7
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error?.message || "AI connection failed."
            );
        }

        const answer =
            data.choices[0].message.content;

        addMessage(answer, "bot");

        history.push(
            { role: "user", content: message },
            { role: "assistant", content: answer }
        );

        history = history.slice(-20);

        speak(answer);
        setStatus("SYSTEM READY");

    } catch (error) {
        addMessage(error.message, "bot");
        setStatus("AI CONNECTION ERROR");
    }
}

function handleCommand(message) {
    const command = message.toLowerCase().trim();

    if (!command) return;

    addMessage(message, "user");

    if (
        command.includes("open google") ||
        command.includes("गूगल खोलो")
    ) {
        window.open("https://www.google.com", "_blank");
        speak("Opening Google");
        return;
    }

    if (
        command.includes("open youtube") ||
        command.includes("यूट्यूब खोलो")
    ) {
        window.open("https://www.youtube.com", "_blank");
        speak("Opening YouTube");
        return;
    }

    if (
        command.includes("what is the time") ||
        command === "time" ||
        command.includes("समय क्या हुआ")
    ) {
        const time = new Date().toLocaleTimeString();
        const answer = "The current time is " + time;

        addMessage(answer, "bot");
        speak(answer);
        return;
    }

    if (
        command.includes("today's date") ||
        command.includes("what is the date") ||
        command.includes("आज की तारीख")
    ) {
        const date = new Date().toLocaleDateString();
        const answer = "Today's date is " + date;

        addMessage(answer, "bot");
        speak(answer);
        return;
    }

    if (
        command.includes("who are you") ||
        command.includes("your name")
    ) {
        const answer = "I am JARVIS, your personal AI assistant.";

        addMessage(answer, "bot");
        speak(answer);
        return;
    }

    askAI(message);
}

function startListening() {
    if (!Recognition) {
        alert("Please use updated Google Chrome.");
        return;
    }

    if (listening) return;

    recognition = new Recognition();

    recognition.lang = language.value;
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
        listening = true;
        setStatus("LISTENING... SPEAK NOW", true);
    };

    recognition.onresult = (event) => {
        const message =
            event.results[0][0].transcript;

        handleCommand(message);
    };

    recognition.onerror = (event) => {
        setStatus("MICROPHONE ERROR: " + event.error);
    };

    recognition.onend = () => {
        listening = false;
        setStatus("SYSTEM READY");
    };

    recognition.start();
}

function stopAssistant() {
    if (recognition) {
        recognition.stop();
    }

    window.speechSynthesis.cancel();

    listening = false;
    setStatus("ASSISTANT STOPPED");
}

micButton.addEventListener("click", startListening);

stopButton.addEventListener("click", stopAssistant);

sendButton.addEventListener("click", () => {
    const message = input.value.trim();

    if (!message) return;

    input.value = "";
    handleCommand(message);
});

input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        sendButton.click();
    }
});

clearButton.addEventListener("click", () => {
    chat.innerHTML = "";
    history = [];

    addMessage("Chat cleared. How can I help?", "bot");
});

document.querySelectorAll("[data-command]").forEach(button => {
    button.addEventListener("click", () => {
        handleCommand(button.dataset.command);
    });
});
