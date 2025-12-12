import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

function App() {
  const [productName, setProductName] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoadingReviews(true);
    try {
      const response = await axios.get(`${API_URL}/reviews`);
      setReviews(response.data.data);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/analyze-review`, {
        product_name: productName,
        review_text: reviewText
      });

      setResult(response.data.data);
      setProductName('');
      setReviewText('');
      fetchReviews(); // Refresh the list
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (sentiment) => {
    const colors = {
      positive: 'sentiment-positive',
      negative: 'sentiment-negative',
      neutral: 'sentiment-neutral'
    };
    return colors[sentiment] || 'sentiment-neutral';
  };

  return (
    <div className="container">
      <div className="header">
        <h1>🔍 Product Review Analyzer</h1>
        <p>AI-Powered Sentiment Analysis & Key Points Extraction</p>
      </div>

      <div className="content">
        <div className="card">
          <h2>Analyze New Review</h2>
          
          {error && <div className="error">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="productName">Product Name</label>
              <input
                type="text"
                id="productName"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g., iPhone 15 Pro"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="reviewText">Review Text</label>
              <textarea
                id="reviewText"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Enter your detailed product review here..."
                required
              />
            </div>

            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Analyzing...' : 'Analyze Review'}
            </button>
          </form>

          {result && (
            <div className="result">
              <h3>Analysis Results</h3>
              
              <div style={{ marginTop: '15px' }}>
                <strong>Sentiment:</strong>
                <span className={`sentiment-badge ${getSentimentColor(result.sentiment)}`}>
                  {result.sentiment.toUpperCase()}
                </span>
                <div style={{ marginTop: '5px', fontSize: '0.9rem', color: '#666' }}>
                  Confidence: {(result.sentiment_score * 100).toFixed(1)}%
                </div>
              </div>

              <div className="key-points">
                <h4>Key Points:</h4>
                <div className="key-points-content">{result.key_points}</div>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <h2>Recent Analysis</h2>
          
          {loadingReviews ? (
            <div className="loading">Loading reviews...</div>
          ) : reviews.length === 0 ? (
            <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
              No reviews yet. Start by analyzing your first review!
            </p>
          ) : (
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {reviews.slice(0, 5).map((review) => (
                <div key={review.id} className="review-item">
                  <h3>{review.product_name}</h3>
                  <div className="review-text">{review.review_text.substring(0, 150)}...</div>
                  <span className={`sentiment-badge ${getSentimentColor(review.sentiment)}`}>
                    {review.sentiment.toUpperCase()}
                  </span>
                  <div className="review-date">
                    {new Date(review.created_at).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="reviews-list">
        <h2>All Reviews ({reviews.length})</h2>
        {reviews.map((review) => (
          <div key={review.id} className="review-item">
            <h3>{review.product_name}</h3>
            <div className="review-text">{review.review_text}</div>
            <span className={`sentiment-badge ${getSentimentColor(review.sentiment)}`}>
              {review.sentiment.toUpperCase()} ({(review.sentiment_score * 100).toFixed(1)}%)
            </span>
            <div className="key-points">
              <h4>Key Points:</h4>
              <div className="key-points-content">{review.key_points}</div>
            </div>
            <div className="review-date">
              {new Date(review.created_at).toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;