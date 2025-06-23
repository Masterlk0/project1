import React from 'react';

const reviewListStyle = {
  marginTop: '20px',
};

const reviewItemStyle = {
  borderBottom: '1px solid #eee',
  padding: '10px 0',
  marginBottom: '10px',
};

const StarDisplay = ({ rating }) => {
  const totalStars = 5;
  return (
    <div>
      {[...Array(totalStars)].map((_, index) => (
        <span key={index} style={{ color: index < rating ? 'gold' : 'lightgray', fontSize: '18px' }}>
          ★
        </span>
      ))}
    </div>
  );
};


const ReviewList = ({ reviews }) => {
  if (!reviews || reviews.length === 0) {
    return <p style={{ marginTop: '20px' }}>No reviews yet for this item.</p>;
  }

  return (
    <div style={reviewListStyle}>
      <h4>Customer Reviews ({reviews.length})</h4>
      {reviews.map((review) => (
        <div key={review._id || review.user} style={reviewItemStyle}> {/* Use review._id if available from backend */}
          <p>
            <strong>{review.username || review.user?.username || 'Anonymous'}</strong>
            <span style={{ marginLeft: '10px', color: '#777' }}>
              {new Date(review.createdAt).toLocaleDateString()}
            </span>
          </p>
          <StarDisplay rating={review.rating} />
          {review.comment && <p style={{ marginTop: '5px' }}>{review.comment}</p>}
        </div>
      ))}
    </div>
  );
};

export default ReviewList;
