<template>
<div class="chatbot-wrapper">
    <!-- Floating Chat Icon -->
    <div v-if="!isChatOpen" @click="toggleChat" class="chat-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H5.17L4 17.17V4H20V16ZM7 9H17V11H7V9ZM7 12H15V14H7V12Z"
                fill="currentColor" />
        </svg>
    </div>

    <!-- Chat Window -->
    <div v-if="isChatOpen" class="chat-window">
        <!-- Chat Header -->
        <div class="chat-header">
            <div class="chat-header-content">
                <div class="bot-avatar">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 4L13.5 7H10.5L9 4L3 7V9H4V16H3V18H21V16H20V9H21ZM18 9V16H6V9H18Z"
                            fill="currentColor" />
                    </svg>
                </div>
                <div>
                    <h3>AI Assistant</h3>
                    <span class="status">Online</span>
                </div>
            </div>
            <button @click="toggleChat" class="close-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"
                        fill="currentColor" />
                </svg>
            </button>
        </div>

        <!-- Chat Messages -->
        <div class="chat-messages" ref="messagesContainer">
            <div v-for="message in messages" :key="message.id" :class="['message', message.type]">
                <div v-if="message.type === 'bot'" class="message-avatar">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 4L13.5 7H10.5L9 4L3 7V9H4V16H3V18H21V16H20V9H21ZM18 9V16H6V9H18Z"
                            fill="currentColor" />
                    </svg>
                </div>
                <div class="message-content">
                    <div class="message-bubble">
                        {{ message.text }}
                    </div>
                    <div class="message-time">{{ formatTime(message.timestamp) }}</div>
                </div>
            </div>

            <!-- Typing Indicator -->
            <div v-if="isTyping" class="message bot">
                <div class="message-avatar">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 4L13.5 7H10.5L9 4L3 7V9H4V16H3V18H21V16H20V9H21ZM18 9V16H6V9H18Z"
                            fill="currentColor" />
                    </svg>
                </div>
                <div class="message-content">
                    <div class="message-bubble typing-indicator">
                        <div class="typing-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Chat Input -->
        <div class="chat-input">
            <div class="input-container">
                <input v-model="currentMessage" @keypress.enter="sendMessage" @input="handleInput"
                    placeholder="Type your message..." :disabled="isTyping" class="message-input" ref="messageInput" />
                <button @click="sendMessage" :disabled="!currentMessage.trim() || isTyping" class="send-btn">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="currentColor" />
                    </svg>
                </button>
            </div>
        </div>
    </div>
</div>
</template>

<script lang="ts">
import { ref, onMounted, nextTick } from "vue";

interface Message {
    id: number;
    text: string;
    type: 'user' | 'bot';
    timestamp: Date;
}

export default {
    name: "ChatbotComponent",
    setup() {
        const isChatOpen = ref(false);
        const currentMessage = ref('');
        const isTyping = ref(false);
        const messages = ref<Message[]>([]);
        const messageIdCounter = ref(0);
        // TODO: Replace with your actual Gemini API key
        const geminiApiKey = ref('AIzaSyCHKf3dxXorcS6wcoxE1ZfTK_G2KzNHTvI');
        // TODO: Customize this system prompt according to your needs
        const systemPrompt = ref('Answer all questions professionally and maintain a formal tone even if the user is casual. Provide helpful, accurate, and concise responses. You are an AI assistant for a professional organization.');

        const messagesContainer = ref<HTMLElement | null>(null);
        const messageInput = ref<HTMLInputElement | null>(null);

        const scrollToBottom = () => {
            const container = messagesContainer.value;
            if (container) {
                container.scrollTop = container.scrollHeight;
            }
        };

        const focusInput = () => {
            const input = messageInput.value;
            if (input) {
                input.focus();
            }
        };

        const addMessage = (text: string, type: 'user' | 'bot') => {
            messageIdCounter.value++;
            messages.value.push({
                id: messageIdCounter.value,
                text,
                type,
                timestamp: new Date()
            });
            nextTick(() => {
                scrollToBottom();
            });
        };

        const callGeminiAPI = async (): Promise<string> => {
            if (geminiApiKey.value === 'YOUR_GEMINI_API_KEY_HERE') {
                // Return a mock response when API key is not set
                await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
                return "Please configure your Gemini API key in the component to enable AI responses.";
            }

            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey.value}`;

            // Build conversation history. The Gemini API requires roles to alternate, starting with 'user'.
            // We skip the initial UI-only 'bot' greeting message in the history sent to the API.
            const history = messages.value
                .slice(messages.value[0]?.type === 'bot' ? 1 : 0)
                .map((msg: Message) => ({
                    role: msg.type === 'bot' ? 'model' : 'user',
                    parts: [{ text: msg.text }]
                }));

            const requestBody = {
                contents: history,
                systemInstruction: {
                    parts: [{ text: systemPrompt.value }]
                },
                generationConfig: {
                    temperature: 0.7,
                    topK: 1,
                    topP: 1,
                    maxOutputTokens: 2048,
                },
                safetySettings: [{
                    category: "HARM_CATEGORY_HARASSMENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                }, {
                    category: "HARM_CATEGORY_HATE_SPEECH",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                }, {
                    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                }, {
                    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                }]
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Gemini API Error:', errorData);
                throw new Error(`HTTP error! status: ${response.status} - ${errorData.error?.message || 'Request failed'}`);
            }

            const data = await response.json();

            if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
                return data.candidates[0].content.parts[0].text;
            } else if (data.candidates && data.candidates[0]?.finishReason) {
                // Handle cases where the response was stopped, e.g., for safety.
                console.warn(`Gemini response stopped. Reason: ${data.candidates[0].finishReason}`);
                return "I'm sorry, but I can't provide a response for that. Please try a different query.";
            } else {
                console.error('Invalid response format from Gemini API:', data);
                throw new Error('Invalid response format from Gemini API. Check console for details.');
            }
        };

        const sendMessage = async () => {
            if (!currentMessage.value.trim() || isTyping.value) return;

            const userMessage = currentMessage.value.trim();
            addMessage(userMessage, 'user');
            currentMessage.value = '';
            isTyping.value = true;

            try {
                const response = await callGeminiAPI();
                addMessage(response, 'bot');
            } catch (error) {
                console.error('Error calling Gemini API:', error);
                addMessage('Sorry, I encountered an error while processing your request. Please try again.', 'bot');
            } finally {
                isTyping.value = false;
                focusInput();
            }
        };

        const handleInput = () => {
            // Auto-resize input if needed (for future enhancement)
        };

        const formatTime = (timestamp: Date): string => {
            return timestamp.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
        };

        const toggleChat = () => {
            isChatOpen.value = !isChatOpen.value;
            if (isChatOpen.value) {
                nextTick(() => {
                    scrollToBottom();
                    focusInput();
                });
            }
        };

        onMounted(() => {
            // Add welcome message when component is mounted
            addMessage("Hello! How can I assist you today?", 'bot');
        });

        return {
            isChatOpen,
            currentMessage,
            isTyping,
            messages,
            messagesContainer,
            messageInput,
            toggleChat,
            sendMessage,
            handleInput,
            formatTime,
        };
    }
}
</script>

<style scoped>
.chatbot-wrapper {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 1000;
}

.chat-icon {
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: white;
    box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
    transition: all 0.3s ease;
    animation: pulse 2s infinite;
}

.chat-icon:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 25px rgba(102, 126, 234, 0.6);
}

@keyframes pulse {
    0% {
        box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
    }

    50% {
        box-shadow: 0 4px 20px rgba(102, 126, 234, 0.8);
    }

    100% {
        box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
    }
}

.chat-window {
    width: 380px;
    height: 500px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.chat-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.chat-header-content {
    display: flex;
    align-items: center;
    gap: 12px;
}

.bot-avatar {
    width: 36px;
    height: 36px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.chat-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
}

.status {
    font-size: 12px;
    opacity: 0.8;
}

.close-btn {
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: background-color 0.2s;
}

.close-btn:hover {
    background: rgba(255, 255, 255, 0.1);
}

.chat-messages {
    flex: 1;
    padding: 16px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
    background: #f8fafc;
}

.message {
    display: flex;
    gap: 8px;
    animation: messageAppear 0.3s ease-out;
}

@keyframes messageAppear {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.message.user {
    flex-direction: row-reverse;
}

.message-avatar {
    width: 28px;
    height: 28px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    flex-shrink: 0;
}

.message-content {
    display: flex;
    flex-direction: column;
    max-width: 80%;
}

.message.user .message-content {
    align-items: flex-end;
}

.message-bubble {
    background: white;
    padding: 12px 16px;
    border-radius: 18px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    word-wrap: break-word;
    line-height: 1.4;
}

.message.user .message-bubble {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.message-time {
    font-size: 11px;
    color: #64748b;
    margin-top: 4px;
    padding: 0 4px;
}

.typing-indicator {
    padding: 16px !important;
}

.typing-dots {
    display: flex;
    gap: 4px;
}

.typing-dots span {
    width: 8px;
    height: 8px;
    background: #cbd5e1;
    border-radius: 50%;
    animation: typing 1.4s infinite ease-in-out;
}

.typing-dots span:nth-child(1) {
    animation-delay: -0.32s;
}

.typing-dots span:nth-child(2) {
    animation-delay: -0.16s;
}

@keyframes typing {

    0%,
    80%,
    100% {
        transform: scale(0.8);
        opacity: 0.5;
    }

    40% {
        transform: scale(1);
        opacity: 1;
    }
}

.chat-input {
    padding: 16px;
    background: white;
    border-top: 1px solid #e2e8f0;
}

.input-container {
    display: flex;
    gap: 8px;
    align-items: center;
}

.message-input {
    flex: 1;
    border: 1px solid #e2e8f0;
    border-radius: 24px;
    padding: 12px 16px;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s;
}

.message-input:focus {
    border-color: #667eea;
}

.message-input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.send-btn {
    width: 44px;
    height: 44px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    border-radius: 50%;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
}

.send-btn:hover:not(:disabled) {
    transform: scale(1.05);
}

.send-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
}

/* Scrollbar styling */
.chat-messages::-webkit-scrollbar {
    width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
    background: transparent;
}

.chat-messages::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}

/* Responsive design */
@media (max-width: 480px) {
    .chat-window {
        width: calc(100vw - 40px);
        height: calc(100vh - 100px);
        bottom: 80px;
        right: 20px;
    }

    .chatbot-wrapper {
        bottom: 20px;
        right: 20px;
    }
}
</style>