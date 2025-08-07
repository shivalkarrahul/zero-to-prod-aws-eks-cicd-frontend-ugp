import React, { useState, useEffect } from 'react';

  // IMPORTANT: Replace this with your actual NGINX Ingress Load Balancer URL.
  // For example: 'http://a90267d66fa484905b9b65d5675aae9c-214711102.us-east-1.elb.amazonaws.com'
  const backendApiBaseUrl = 'http://a90267d66fa484905b9b65d5675aae9c-214711102.us-east-1.elb.amazonaws.com';
  const quotesApiUrl = `${backendApiBaseUrl}/quotes`;
  
  function App() {
    const [quotes, setQuotes] = useState([]);
    const [inputs, setInputs] = useState({ name: '', input1: '', input2: '', input3: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
  
    // Fetch quotes on initial load
    useEffect(() => {
      if (backendApiBaseUrl) {
        fetchQuotes();
      } else {
        setMessage('Please configure your backend API URL to fetch quotes.');
      }
    }, []);
  
    // Fetch all quotes from the backend
    const fetchQuotes = async () => {
      try {
        const response = await fetch(quotesApiUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setQuotes(data);
      } catch (error) {
        console.error('Error fetching quotes:', error);
        setMessage('Could not load quotes. Backend might be unavailable.');
      }
    };
  
    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setInputs(prevInputs => ({ ...prevInputs, [name]: value }));
    };
  
    // Generate a new quote by sending data to the backend
    const handleGenerateQuote = async () => {
      const { name, input1, input2, input3 } = inputs;
      if (!name.trim() || !input1.trim() || !input2.trim() || !input3.trim()) {
        setMessage('Please fill in all four fields!');
        return;
      }
  
      setIsLoading(true);
      setMessage('');
  
      try {
        const response = await fetch(quotesApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, input1, input2, input3 }),
        });
  
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
  
        await fetchQuotes();
        setInputs({ name: '', input1: '', input2: '', input3: '' });
        setMessage('Quote generated successfully!');
      } catch (error) {
        console.error('Error generating quote:', error);
        setMessage('Failed to generate quote. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
  
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gray-100 font-sans">
        <div className="w-full max-w-xl mx-auto p-8 rounded-2xl shadow-xl bg-white text-card-foreground">
          <h1 className="text-3xl font-extrabold text-center text-gray-800 mb-2">
            Funny Quote Generator
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Enter your name and three fun words to generate a silly quote!
          </p>
  
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <input
              type="text"
              name="name"
              placeholder="Enter your name"
              value={inputs.name}
              onChange={handleInputChange}
              className="w-full px-4 py-3 text-lg rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              disabled={isLoading}
            />
            <input
              type="text"
              name="input1"
              placeholder="Input 1 (e.g., 'grumpy cat')"
              value={inputs.input1}
              onChange={handleInputChange}
              className="w-full px-4 py-3 text-lg rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              disabled={isLoading}
            />
            <input
              type="text"
              name="input2"
              placeholder="Input 2 (e.g., 'meaning of life')"
              value={inputs.input2}
              onChange={handleInputChange}
              className="w-full px-4 py-3 text-lg rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              disabled={isLoading}
            />
            <input
              type="text"
              name="input3"
              placeholder="Input 3 (e.g., 'old sock')"
              value={inputs.input3}
              onChange={handleInputChange}
              className="w-full px-4 py-3 text-lg rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              disabled={isLoading}
            />
          </div>
          
          <button
            onClick={handleGenerateQuote}
            disabled={isLoading}
            className="w-full px-6 py-3 bg-blue-500 text-white text-lg font-bold rounded-xl shadow-md hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving and Generating...' : 'Generate My Funny Quote'}
          </button>
  
          {message && (
            <div className={`mt-4 p-3 rounded-lg text-sm text-center ${message.includes('success') ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-red-100 text-red-700 border border-red-300'}`}>
              {message}
            </div>
          )}
  
          <hr className="my-8 border-gray-200" />
  
          <div className="quote-list p-6 bg-gray-50 rounded-xl border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 text-center mb-4">
              Generated Quotes
            </h2>
            {quotes.length > 0 ? (
              quotes.map((item) => (
                <div key={item.id} className="p-4 mb-3 bg-blue-50 rounded-xl border border-blue-100 shadow-sm">
                  <p className="m-0 text-gray-700">
                    <span className="font-bold text-blue-600">{item.name}:</span> {item.quote}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500">No quotes yet. Generate one now!</p>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  export default App;
    