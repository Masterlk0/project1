import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const AccountPage = () => {
  const { user } = useAuth();

  if (!user) {
    return <p>Loading user data...</p>;
  }

  return (
    <div>
      <h2>My Account</h2>
      <p><strong>Username:</strong> {user.username}</p>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Role:</strong> {user.role}</p>
      {user.firstName && <p><strong>First Name:</strong> {user.firstName}</p>}
      {user.lastName && <p><strong>Last Name:</strong> {user.lastName}</p>}
      {/* Add more user details and account management options here */}
    </div>
  );
};

export default AccountPage;
