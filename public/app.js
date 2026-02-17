const sessionId = Math.random().toString(36).substring(7);
const chatBox = document.getElementById('chat-box');
const input = document.getElementById('userInput');
const btn = document.getElementById('sendBtn');

// Allow sending with Enter
input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') send();
});

btn.addEventListener('click', send);

async function send() {
    const text = input.value.trim();
    if (!text) return;

    // UI Update: User Message
    addMessage(text, 'user');
    input.value = '';
    btn.disabled = true;
    btn.innerText = "PROCESSING...";

    try {
        const req = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text, sessionId })
        });

        if (!req.ok) throw new Error("API Error");
        const data = await req.json();

        // UI Update: AI Message
        addMessage(data.response, 'ai');
    } catch (e) {
        addMessage("Error: Connection lost with Workers AI.", 'ai');
    }

    btn.disabled = false;
    btn.innerText = "EXECUTE";
    input.focus();
}

function addMessage(html, type) {
    const div = document.createElement('div');
    div.className = `message ${type}`;
    div.innerHTML = html.replace(/\n/g, '<br>');
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}
