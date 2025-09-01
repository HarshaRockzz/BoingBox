import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { FaDownload, FaTimes, FaBell, FaWifi } from "react-icons/fa";

const PWARegistration = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [swRegistration, setSwRegistration] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState('default');

  useEffect(() => {
    registerServiceWorker();
    setupEventListeners();
    checkNotificationPermission();
  }, []);

  const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        setSwRegistration(registration);
        console.log('Service Worker registered successfully:', registration);

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available
              showUpdateNotification();
            }
          });
        });
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  };

  const setupEventListeners = () => {
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      console.log('PWA was installed');
    });

    // Listen for online/offline events
    window.addEventListener('online', () => setIsOnline(true));
    window.addEventListener('offline', () => setIsOnline(false));
  };

  const checkNotificationPermission = async () => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        // Subscribe to push notifications
        subscribeToPushNotifications();
      }
    }
  };

  const subscribeToPushNotifications = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.REACT_APP_VAPID_PUBLIC_KEY
        });
        
        console.log('Push notification subscription:', subscription);
        
        // Send subscription to server
        // await sendSubscriptionToServer(subscription);
      } catch (error) {
        console.error('Failed to subscribe to push notifications:', error);
      }
    }
  };

  const showUpdateNotification = () => {
    if (swRegistration) {
      const updateNotification = document.createElement('div');
      updateNotification.innerHTML = `
        <div style="
          position: fixed;
          top: 20px;
          right: 20px;
          background: #3b82f6;
          color: white;
          padding: 1rem;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          z-index: 1000;
          max-width: 300px;
        ">
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
            <span>🔄</span>
            <strong>Update Available</strong>
          </div>
          <p style="margin: 0 0 1rem 0; font-size: 0.9rem;">
            A new version of BoingBox is available. Refresh to update.
          </p>
          <div style="display: flex; gap: 0.5rem;">
            <button onclick="window.location.reload()" style="
              background: white;
              color: #3b82f6;
              border: none;
              padding: 0.5rem 1rem;
              border-radius: 4px;
              cursor: pointer;
              font-weight: 500;
            ">
              Update Now
            </button>
            <button onclick="this.parentElement.parentElement.remove()" style="
              background: transparent;
              color: white;
              border: 1px solid white;
              padding: 0.5rem 1rem;
              border-radius: 4px;
              cursor: pointer;
            ">
              Later
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(updateNotification);
    }
  };

  const sendTestNotification = () => {
    if ('serviceWorker' in navigator && Notification.permission === 'granted') {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification('BoingBox', {
          body: 'This is a test notification from BoingBox!',
          icon: '/logo192.png',
          badge: '/logo192.png',
          vibrate: [100, 50, 100],
          data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
          },
          actions: [
            {
              action: 'explore',
              title: 'Open App',
              icon: '/logo192.png'
            },
            {
              action: 'close',
              title: 'Close',
              icon: '/logo192.png'
            }
          ]
        });
      });
    }
  };

  return (
    <>
      {/* Install Prompt */}
      {showInstallPrompt && (
        <InstallPrompt>
          <InstallContent>
            <InstallIcon>📱</InstallIcon>
            <InstallText>
              <InstallTitle>Install BoingBox</InstallTitle>
              <InstallDescription>
                Add BoingBox to your home screen for quick access and offline functionality.
              </InstallDescription>
            </InstallText>
            <InstallActions>
              <InstallButton onClick={handleInstallClick}>
                <FaDownload /> Install
              </InstallButton>
              <DismissButton onClick={() => setShowInstallPrompt(false)}>
                <FaTimes />
              </DismissButton>
            </InstallActions>
          </InstallContent>
        </InstallPrompt>
      )}

      {/* Offline Indicator */}
      {!isOnline && (
        <OfflineIndicator>
          <FaWifi />
          <span>You're offline. Some features may be limited.</span>
        </OfflineIndicator>
      )}

      {/* Notification Permission Request */}
      {notificationPermission === 'default' && (
        <NotificationPrompt>
          <NotificationContent>
            <NotificationIcon>
              <FaBell />
            </NotificationIcon>
            <NotificationText>
              <NotificationTitle>Enable Notifications</NotificationTitle>
              <NotificationDescription>
                Get notified about new messages and calls even when the app is closed.
              </NotificationDescription>
            </NotificationText>
            <NotificationActions>
              <NotificationButton onClick={requestNotificationPermission}>
                Enable
              </NotificationButton>
              <NotificationDismiss onClick={() => setNotificationPermission('denied')}>
                <FaTimes />
              </NotificationDismiss>
            </NotificationActions>
          </NotificationContent>
        </NotificationPrompt>
      )}

      {/* Debug Panel (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <DebugPanel>
          <DebugTitle>PWA Debug Info</DebugTitle>
          <DebugInfo>
            <div>Online: {isOnline ? '🟢' : '🔴'}</div>
            <div>Notifications: {notificationPermission}</div>
            <div>SW Registered: {swRegistration ? '✅' : '❌'}</div>
          </DebugInfo>
          <DebugActions>
            <DebugButton onClick={sendTestNotification}>
              Test Notification
            </DebugButton>
            <DebugButton onClick={() => window.location.reload()}>
              Reload App
            </DebugButton>
          </DebugActions>
        </DebugPanel>
      )}
    </>
  );
};

const InstallPrompt = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
  z-index: 1000;
  max-width: 350px;
  animation: slideIn 0.3s ease-out;
`;

const InstallContent = styled.div`
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const InstallIcon = styled.div`
  font-size: 2rem;
  flex-shrink: 0;
`;

const InstallText = styled.div`
  flex: 1;
`;

const InstallTitle = styled.div`
  font-weight: 600;
  font-size: 1.1rem;
  margin-bottom: 0.25rem;
`;

const InstallDescription = styled.div`
  font-size: 0.9rem;
  opacity: 0.9;
  line-height: 1.4;
`;

const InstallActions = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const InstallButton = styled.button`
  background: white;
  color: #3b82f6;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;

  &:hover {
    background: #f8fafc;
    transform: translateY(-1px);
  }
`;

const DismissButton = styled.button`
  background: transparent;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const OfflineIndicator = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: #f59e0b;
  color: white;
  padding: 0.75rem;
  text-align: center;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  z-index: 999;
`;

const NotificationPrompt = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);
  z-index: 1000;
  max-width: 350px;
  animation: slideIn 0.3s ease-out;
`;

const NotificationContent = styled.div`
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const NotificationIcon = styled.div`
  font-size: 1.5rem;
  flex-shrink: 0;
`;

const NotificationText = styled.div`
  flex: 1;
`;

const NotificationTitle = styled.div`
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 0.25rem;
`;

const NotificationDescription = styled.div`
  font-size: 0.85rem;
  opacity: 0.9;
  line-height: 1.4;
`;

const NotificationActions = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const NotificationButton = styled.button`
  background: white;
  color: #10b981;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    background: #f8fafc;
    transform: translateY(-1px);
  }
`;

const NotificationDismiss = styled(DismissButton)`
  border-color: rgba(255, 255, 255, 0.3);
`;

const DebugPanel = styled.div`
  position: fixed;
  bottom: 20px;
  left: 20px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 1rem;
  border-radius: 8px;
  font-size: 0.8rem;
  z-index: 1000;
`;

const DebugTitle = styled.div`
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #3b82f6;
`;

const DebugInfo = styled.div`
  margin-bottom: 0.5rem;
  line-height: 1.4;
`;

const DebugActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const DebugButton = styled.button`
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.7rem;
  transition: all 0.2s ease;

  &:hover {
    background: #2563eb;
  }
`;

export default PWARegistration;
