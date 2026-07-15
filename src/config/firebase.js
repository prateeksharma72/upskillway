// src/config/firebase.js
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging and get a reference to the service
const messaging = getMessaging(app);

// Request notification permission and get FCM token
export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      
      // Get FCM token
      const token = await getToken(messaging, {
        vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY
      });
      
      if (token) {
        console.log('FCM Token:', token);
        return token;
      } else {
        console.log('No registration token available.');
        return null;
      }
    } else {
      console.log('Unable to get permission to notify.');
      return null;
    }
  } catch (error) {
    console.error('An error occurred while retrieving token:', error);
    return null;
  }
};

// Handle foreground messages
export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log('Message received in foreground:', payload);
      resolve(payload);
    });
  });

// Send FCM token to your JWT backend server
export const sendTokenToServer = async (fcmToken) => {
  try {
    // Get JWT token from localStorage
    const jwtToken = localStorage.getItem('authToken');
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    
    if (!jwtToken) {
      console.warn('No JWT token available, cannot send FCM token to server');
      return false;
    }

    const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/notifications/fcm-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
      },
      body: JSON.stringify({
        fcmToken,
        userId: userData.id || userData.uid,
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          timestamp: new Date().toISOString()
        }
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('FCM token sent to server successfully:', result);
      return true;
    } else {
      console.error('Failed to send FCM token to server:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error('Error sending FCM token to server:', error);
    return false;
  }
};

// Initialize FCM for authenticated user
export const initializeFirebaseMessaging = async () => {
  try {
    // Check if user is authenticated
    const jwtToken = localStorage.getItem('authToken');
    if (!jwtToken) {
      console.log('User not authenticated, skipping FCM initialization');
      return null;
    }

    // Request permission and get token
    const fcmToken = await requestNotificationPermission();
    
    if (fcmToken) {
      // Send token to server
      await sendTokenToServer(fcmToken);
      
      // Set up foreground message listener
      onMessageListener()
        .then((payload) => {
          console.log('Received foreground message:', payload);
          
          // Show notification
          if (payload.notification) {
            showNotification(payload.notification);
          }
          
          // Handle custom actions if needed
          if (payload.data) {
            handleNotificationData(payload.data);
          }
        })
        .catch((error) => console.error('Error setting up message listener:', error));
      
      return fcmToken;
    }
    
    return null;
  } catch (error) {
    console.error('Error initializing Firebase messaging:', error);
    return null;
  }
};

// Show browser notification
const showNotification = (notification) => {
  try {
    if (Notification.permission === 'granted') {
      const notificationOptions = {
        body: notification.body,
        icon: notification.icon || '/favicon.ico',
        image: notification.image,
        tag: 'firebase-notification',
        requireInteraction: false,
        silent: false,
      };

      const browserNotification = new Notification(notification.title, notificationOptions);
      
      // Auto close after 5 seconds
      setTimeout(() => {
        browserNotification.close();
      }, 5000);

      // Handle notification click
      browserNotification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        browserNotification.close();
        
        // Handle navigation if needed
        if (notification.click_action) {
          window.open(notification.click_action, '_blank');
        }
      };
    }
  } catch (error) {
    console.error('Error showing notification:', error);
  }
};

// Handle notification data (custom actions)
const handleNotificationData = (data) => {
  try {
    console.log('Handling notification data:', data);
    
    // Add your custom notification handling logic here
    // For example:
    // - Update app state
    // - Trigger specific actions
    // - Navigate to specific pages
    // - Update notification counters
    
    // Example: Dispatch custom event for app-wide notification handling
    const customEvent = new CustomEvent('fcmNotificationReceived', {
      detail: data
    });
    window.dispatchEvent(customEvent);
    
  } catch (error) {
    console.error('Error handling notification data:', error);
  }
};

// Remove FCM token from server (call on logout)
export const removeTokenFromServer = async () => {
  try {
    const jwtToken = localStorage.getItem('authToken');
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    
    if (!jwtToken) {
      console.log('No JWT token available for token removal');
      return;
    }

    const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/notifications/fcm-token`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
      },
      body: JSON.stringify({
        userId: userData.id || userData.uid
      })
    });
    
    if (response.ok) {
      console.log('FCM token removed from server successfully');
    } else {
      console.error('Failed to remove FCM token from server');
    }
  } catch (error) {
    console.error('Error removing FCM token from server:', error);
  }
};

// Get current FCM token
export const getCurrentFCMToken = async () => {
  try {
    const token = await getToken(messaging, {
      vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY
    });
    return token || null;
  } catch (error) {
    console.error('Error getting current FCM token:', error);
    return null;
  }
};

// Subscribe to topic (if your backend supports it)
export const subscribeToTopic = async (topic) => {
  try {
    const jwtToken = localStorage.getItem('authToken');
    if (!jwtToken) {
      console.warn('No JWT token available for topic subscription');
      return false;
    }

    const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/notifications/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
      },
      body: JSON.stringify({ topic })
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error subscribing to topic:', error);
    return false;
  }
};

// Unsubscribe from topic
export const unsubscribeFromTopic = async (topic) => {
  try {
    const jwtToken = localStorage.getItem('authToken');
    if (!jwtToken) {
      console.warn('No JWT token available for topic unsubscription');
      return false;
    }

    const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/notifications/unsubscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
      },
      body: JSON.stringify({ topic })
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error unsubscribing from topic:', error);
    return false;
  }
};

export { messaging };