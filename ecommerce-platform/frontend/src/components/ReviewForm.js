import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Basic styling for the form
const formStyle = {
  marginTop: '20px',
  padding: '15px',
  border: '1px solid #eee',
  borderRadius: '5px',
  background: '#f9f9f9'
};

const starRatingStyle = {
  display: 'flex',
  gap: '5px',
  marginBottom: '10px',
  cursor: 'pointer'
};

const Star = ({ filled, onClick }) => (
  <span onClick={onClick} style={{ color: filled ? 'gold' : 'lightgray', fontSize: '24px' }}>
    ★
  </span>
);

const ReviewForm = ({ itemId, itemType, onSubmitReview }) => {
  const { isAuthenticated, token } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleRatingClick = (rateValue) => {
    setRating(rateValue);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setError('You must be logged in to submit a review.');
      return;
    }
    if (rating === 0) {
      setError('Please select a rating.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await onSubmitReview({ rating, comment }, token);
      setRating(0);
      setComment('');
      // Optionally, trigger a refresh of reviews on the parent page
    } catch (err) {
      setError(err.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return <p>Please <a href="/login">login</a> to write a review.</p>;
  }

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <h4>Write a Review</h4>
      <div>
        <label>Your Rating:</label>
        <div style={starRatingStyle}>
          {[1, 2, 3, 4, 5].map((starValue) => (
            <Star
              key={starValue}
              filled={starValue <= (hoverRating || rating)}
              onClick={() => handleRatingClick(starValue)}
              onMouseEnter={() => setHoverRating(starValue)}
              onMouseLeave={() => setHoverRating(0)}
            />
          ))}
        </div>
      </div>
      <div>
        <label htmlFor={`comment-${itemId}`}>Your Comment (Optional):</label>
        <textarea
          id={`comment-${itemId}`}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows="4"
          style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
        />
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button type="submit" disabled={submitting} style={{ padding: '10px 15px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '10px' }}>
        {submitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  );
};

export default ReviewForm;
