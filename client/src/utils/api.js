// API utility functions for making requests
export const fetchWithAuth = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    credentials: 'include', // Include cookies for authentication
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok && response.status === 401) {
    // Redirect to login if unauthorized
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  
  return response;
};

export const logout = async () => {
  try {
    const response = await fetch('/user/logout', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      window.location.href = '/';
    } else {
      alert('Logout failed. Please try again.');
    }
  } catch (error) {
    console.error('Error during logout:', error);
    alert('Logout failed. Please try again.');
  }
};

export const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return hours + ':' + minutes.toString().padStart(2, '0') + ':' + secs.toString().padStart(2, '0');
  } else if (minutes > 0) {
    return minutes + ':' + secs.toString().padStart(2, '0');
  } else {
    return secs + ' sec';
  }
};
