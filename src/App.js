import React, { useState, useEffect } from 'react';

function App() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  // IMPORTANT: This URL is hardcoded here for S3 static hosting.
  // When deploying to S3, environment variables (like process.env.REACT_APP_...)
  // are typically baked into the JS during the build step.
  // Replace this with your actual NGINX Ingress Load Balancer URL.
  const backendApiBaseUrl = 'http://a90267d66fa484905b9b65d5675aae9c-214711102.us-east-1.elb.amazonaws.com';

  // Construct the full API URLs for messages and hello
  const messagesApiUrl = `${backendApiBaseUrl}/messages`;
  const helloApiUrl = `${backendApiBaseUrl}/api/hello`; // Assuming /api/hello is still available

  useEffect(() => {
    fetchMessages();
    // Optional: You could also fetch from /api/hello here to test connectivity
    // fetch(helloApiUrl).then(res => res.json()).then(data => console.log('Hello from backend:', data));
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await fetch(messagesApiUrl);
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
      const response = await fetch(messagesApiUrl, {
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
    <div className="container" style={{ fontFamily: 'Inter, sans-serif', maxWidth: '600px', margin: '40px auto', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: '#ffffff' }}>
      <h1 style={{ textAlign: 'center', color: '#333', marginBottom: '20px' }}>EKS Guestbook</h1>
      <div className="message-input" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Write a message here"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          style={{ flexGrow: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px' }}
        />
        <button
          onClick={handlePostMessage}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: '#4CAF50',
            color: 'white',
            fontSize: '16px',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            transition: 'background-color 0.3s ease',
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#45a049'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4CAF50'}
        >
          Post
        </button>
      </div>
      <div className="message-list" style={{ borderTop: '1px solid #eee', paddingTop: '20px' }}>
        {messages.length > 0 ? (
          messages.map((msg) => (
            <div key={msg.id} className="message-item" style={{ padding: '12px 15px', marginBottom: '10px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              {msg.text}
            </div>
          ))
        ) : (
          <p style={{ textAlign: 'center', color: '#666' }}>No messages yet. Be the first to post!</p>
        )}
      </div>
    </div>
  );
}

export default App;
