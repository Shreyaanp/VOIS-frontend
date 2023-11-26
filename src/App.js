import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css'; // Assuming you have a CSS file for styling

const backendUrl = 'https://vois-nine.vercel.app'; // Adjust according to your backend URL

function App() {
  const [userInput, setUserInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [botResponse, setBotResponse] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const [canSpeak, setCanSpeak] = useState(true); // Changed to true by default
  const [interimInput, setInterimInput] = useState('');

  useEffect(() => {
    scrollToBottom();
  }, [botResponse, userInput]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleUserInput = async (inputText = userInput) => {
    if (!inputText) return;
    setIsLoading(true);
    const newUserMessage = { sender: 'user', text: inputText };

    try {
      const response = await axios.post(`${backendUrl}/user_message/`, { user_message: inputText });
      const newBotMessage = { sender: 'bot', text: response.data.bot_response };
      setMessages(messages => [...messages, newUserMessage, newBotMessage]);

      // Always speak the bot's response
      speak(response.data.bot_response);
    } catch (error) {
      console.error('Error sending user message:', error);
      setError('Failed to send message.');
    }

    setIsLoading(false);
  };

  const speak = (text) => {
    if (!canSpeak) return; // Only speak if canSpeak is true
    const speech = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(speech);
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      setError('Speech recognition not supported in this browser.');
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.start();
    setIsListening(true);

    recognition.onresult = (event) => {
      const current = event.resultIndex;
      const transcript = event.results[current][0].transcript;

      if (event.results[current].isFinal) {
        setUserInput(transcript); // Update userInput with the final transcript
        handleUserInput(transcript); // Process final input
        setInterimInput(''); // Reset interim input after processing
        setIsListening(false); // Stop listening after processing final input
      } else {
        setInterimInput(transcript); // Update interim input as you speak
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setError('Error in speech recognition.');
      setIsListening(false);
    };
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
  };

  return (
    <div className="App">
      <h1>Conversation Bot</h1>
      {error && <p className="error">{error}</p>}

      <div className="content">
        <div className="left-panel">
          {/* Existing chat window and input container */}
        </div>

        <div className="right-panel">
          <div className="chat-window">
            {messages.map((msg, index) => (
              <p key={index} className={`${msg.sender === 'user' ? 'user-message' : 'bot-message'} message-enter`}>
                {msg.text}
              </p>
            ))}
            {isListening && (
              <p className="interim-message">{interimInput}</p> // Render interim input without animation
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="input-container">
            <button
              className="action-button"
              onClick={() => handleUserInput()}
              disabled={isLoading}
            >
              Send
            </button>
            <button
              className="action-button"
              onClick={startListening}
              disabled={isListening || isLoading}
            >
              Speak
            </button>
            <button
              className="action-button"
              onClick={stopSpeaking}
              disabled={!canSpeak || isLoading}
            >
              Stop Speaking
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
