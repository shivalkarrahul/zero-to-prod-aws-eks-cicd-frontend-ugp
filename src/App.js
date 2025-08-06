import React, { useState, useEffect } from 'react';

function App() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  // This URL will be updated by the CI/CD pipeline with the actual EKS service endpoint
  const backendApiUrl = 'http://ugp-eks-cicd-service.default.svc.cluster.local/messages'; 

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await fetch(backendApiUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([{ id: 0, text: 'Could not load messages. Backend might be unavailable.' }]);
    }
  };

  const handlePostMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const response = await fetch(backendApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: newMessage }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Re-fetch all messages to ensure the list is up-to-date
      await fetchMessages();
      setNewMessage(''); // Clear input field
    } catch (error) {
      console.error('Error posting message:', error);
      alert('Failed to post message. Please try again.');
    }
  };

  return (
    <div className="container">
      <h1>EKS Guestbook</h1>
      <div className="message-input">
        <input
          type="text"
          placeholder="Write a message here"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button onClick={handlePostMessage}>Post</button>
      </div>
      <div className="message-list">
        {messages.length > 0 ? (
          messages.map((msg) => (
            <div key={msg.id} className="message-item">
              {msg.text}
            </div>
          ))
        ) : (
          <p>No messages yet. Be the first to post!</p>
        )}
      </div>
    </div>
  );
}

export default App;