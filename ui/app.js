const API_BASE = "http://127.0.0.1:8090";
const API_URL = `${API_BASE}/api/chat`;
const SESSIONS_URL = `${API_BASE}/api/sessions`;

const chatArea = document.getElementById("chatArea");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const newChatBtn = document.getElementById("newChatBtn");
const chatHistory = document.getElementById("chatHistory");
const menuBtn = document.getElementById("menuBtn");
const sidebar = document.querySelector(".sidebar");

let messages = [];
let currentSessionId = null;
let sessions = [];


/* ============================================================
   MESSAGE UI
   ============================================================ */

function addMessage(role, text) {

    const message = document.createElement("div");
    message.className = `message ${role}`;

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent =
        role === "user" ? "U" : "🐸";

    const content = document.createElement("div");
    content.className = "message-content";

    const roleName = document.createElement("div");
    roleName.className = "message-role";
    roleName.textContent =
        role === "user" ? "You" : "Jiraiya";

    const textElement = document.createElement("div");
    textElement.textContent = text;

    content.appendChild(roleName);
    content.appendChild(textElement);

    message.appendChild(avatar);
    message.appendChild(content);

    chatArea.appendChild(message);

    chatArea.scrollTop =
        chatArea.scrollHeight;

    return textElement;
}


/* ============================================================
   SESSION API
   ============================================================ */

async function createSession(title = "New Chat") {

    const response = await fetch(
        SESSIONS_URL,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title: title
            })
        }
    );

    const data = await response.json();

    if (!response.ok || !data.ok) {
        throw new Error(
            data.error ||
            "Unable to create session"
        );
    }

    return data.session;
}


async function loadSessions() {

    try {

        const response = await fetch(
            SESSIONS_URL
        );

        const data = await response.json();

        if (!response.ok || !data.ok) {
            throw new Error(
                data.error ||
                "Unable to load sessions"
            );
        }

        sessions = Array.isArray(
            data.sessions
        )
            ? data.sessions
            : [];

        renderSessionList();

    } catch (error) {

        console.error(
            "Session loading error:",
            error
        );
    }
}


async function loadSession(sessionId) {

    const response = await fetch(
        `${SESSIONS_URL}/${sessionId}`
    );

    const data = await response.json();

    if (!response.ok || !data.ok) {
        throw new Error(
            data.error ||
            "Unable to load chat"
        );
    }

    return data.session;
}


async function deleteSession(sessionId) {

    const response = await fetch(
        `${SESSIONS_URL}/${sessionId}`,
        {
            method: "DELETE"
        }
    );

    const data = await response.json();

    if (!response.ok || !data.ok) {
        throw new Error(
            data.error ||
            "Unable to delete chat"
        );
    }

    return true;
}


async function renameSession(
    sessionId,
    title
) {

    const response = await fetch(
        `${SESSIONS_URL}/${sessionId}`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title: title
            })
        }
    );

    const data = await response.json();

    if (!response.ok || !data.ok) {
        throw new Error(
            data.error ||
            "Unable to rename chat"
        );
    }

    return data.session;
}


/* ============================================================
   SESSION LIST UI
   ============================================================ */

function renderSessionList() {

    chatHistory.innerHTML = "";

    if (!sessions.length) {
        return;
    }

    sessions.forEach(session => {

        const item =
            document.createElement("div");

        item.className = "chat-item";

        if (
            session.id ===
            currentSessionId
        ) {
            item.classList.add("active");
        }

        item.textContent =
            session.title ||
            "New Chat";

        item.dataset.sessionId =
            session.id;

        item.addEventListener(
            "click",
            () => {
                openSession(session.id);
            }
        );

        chatHistory.appendChild(item);
    });
}


/* ============================================================
   OPEN SESSION
   ============================================================ */

async function openSession(sessionId) {

    try {

        const session =
            await loadSession(sessionId);

        currentSessionId =
            session.id;

        messages = [];

        chatArea.innerHTML = "";

        const storedMessages =
            Array.isArray(session.messages)
                ? session.messages
                : [];

        storedMessages.forEach(item => {

            if (
                item.role !== "user" &&
                item.role !== "assistant"
            ) {
                return;
            }

            const content =
                String(
                    item.content || ""
                );

            messages.push({
                role: item.role,
                content: content
            });

            if (content) {
                addMessage(
                    item.role,
                    content
                );
            }
        });

        if (!storedMessages.length) {
            showWelcome();
        }

        renderSessionList();

        closeSidebarOnMobile();

        messageInput.focus();

    } catch (error) {

        console.error(
            "Open session error:",
            error
        );
    }
}


/* ============================================================
   SEND MESSAGE
   ============================================================ */

async function sendMessage() {

    const message =
        messageInput.value.trim();

    if (
        !message ||
        sendBtn.disabled
    ) {
        return;
    }


    /*
     * Create a session automatically
     * if one does not exist.
     */

    if (!currentSessionId) {

        try {

            const session =
                await createSession(
                    message.slice(0, 40)
                );

            currentSessionId =
                session.id;

            sessions.unshift(session);

            renderSessionList();

        } catch (error) {

            alert(
                "Unable to create chat: " +
                error.message
            );

            return;
        }
    }


    const welcome =
        document.getElementById(
            "welcome"
        );

    if (welcome) {
        welcome.remove();
    }


    addMessage(
        "user",
        message
    );

    messages.push({
        role: "user",
        content: message
    });


    messageInput.value = "";

    messageInput.style.height =
        "auto";

    sendBtn.disabled = true;


    const replyElement =
        addMessage(
            "assistant",
            "Jiraiya is thinking..."
        );


    try {

        /*
         * Send previous conversation
         * WITHOUT duplicating the current
         * message in history.
         */

        const history =
            messages.slice(0, -1);


        const response =
            await fetch(
                API_URL,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({
                        message: message,
                        history: history,
                        session_id:
                            currentSessionId
                    })
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.ok
        ) {
            throw new Error(
                data.error ||
                "API request failed"
            );
        }


        const reply =
            data.reply || "";


        replyElement.textContent =
            reply ||
            "No response received.";


        messages.push({
            role: "assistant",
            content: reply
        });


        /*
         * Update session title
         * after first message.
         */

        if (
            messages.length === 2
        ) {

            try {

                const title =
                    message.length > 40
                        ? message.slice(0, 40) + "..."
                        : message;

                await renameSession(
                    currentSessionId,
                    title
                );

            } catch (error) {

                console.warn(
                    "Title update failed:",
                    error
                );
            }
        }


        await loadSessions();

    } catch (error) {

        replyElement.textContent =
            "❌ Connection error: " +
            error.message;

        /*
         * Remove failed assistant
         * message from local history.
         */

        messages.pop();
    }


    sendBtn.disabled = false;

    messageInput.focus();
}


/* ============================================================
   NEW CHAT
   ============================================================ */

async function newChat() {

    try {

        const session =
            await createSession(
                "New Chat"
            );

        currentSessionId =
            session.id;

        messages = [];

        sessions.unshift(session);

        renderSessionList();

        showWelcome();

        closeSidebarOnMobile();

        messageInput.focus();

    } catch (error) {

        alert(
            "Unable to create new chat: " +
            error.message
        );
    }
}


function showWelcome() {

    chatArea.innerHTML = `
        <div class="welcome" id="welcome">
            <div class="welcome-logo">🐸</div>

            <h2>Namaste, I'm Jiraiya.</h2>

            <p>How can I help you today?</p>

            <div class="suggestions">

                <button
                    data-prompt="Explain something to me">
                    💡 Explain something
                </button>

                <button
                    data-prompt="Help me write some code">
                    💻 Help me code
                </button>

                <button
                    data-prompt="Search the web for something">
                    🌐 Search the web
                </button>

                <button
                    data-prompt="Calculate something for me">
                    🧮 Calculate
                </button>

            </div>
        </div>
    `;

    setupSuggestions();
}


/* ============================================================
   MOBILE SIDEBAR
   ============================================================ */

function closeSidebarOnMobile() {

    if (
        window.innerWidth <= 768 &&
        sidebar
    ) {
        sidebar.classList.remove(
            "open"
        );
    }
}


/* ============================================================
   SUGGESTIONS
   ============================================================ */

function setupSuggestions() {

    document
        .querySelectorAll(
            "[data-prompt]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    messageInput.value =
                        button.dataset.prompt;

                    messageInput.focus();

                    autoResize();
                }
            );
        });
}


/* ============================================================
   INPUT RESIZE
   ============================================================ */

function autoResize() {

    messageInput.style.height =
        "auto";

    messageInput.style.height =
        Math.min(
            messageInput.scrollHeight,
            160
        ) + "px";
}


/* ============================================================
   INITIAL SESSION RESTORE
   ============================================================ */

async function initializeApp() {

    await loadSessions();

    /*
     * Restore most recently updated
     * session automatically.
     */

    if (sessions.length) {

        const lastSession =
            sessions[0];

        try {

            await openSession(
                lastSession.id
            );

        } catch (error) {

            console.error(
                "Session restore error:",
                error
            );

            showWelcome();
        }

    } else {

        showWelcome();
    }
}


/* ============================================================
   EVENT LISTENERS
   ============================================================ */

sendBtn.addEventListener(
    "click",
    sendMessage
);


messageInput.addEventListener(
    "input",
    autoResize
);


messageInput.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            sendMessage();
        }
    }
);


newChatBtn.addEventListener(
    "click",
    newChat
);


menuBtn.addEventListener(
    "click",
    () => {

        if (sidebar) {

            sidebar.classList.toggle(
                "open"
            );
        }
    }
);


/* ============================================================
   START
   ============================================================ */

initializeApp();
