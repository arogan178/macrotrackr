import { useEffect } from 'react';
import { useAppState } from "../store/app-state";

// This hook has been deprecated and removed.
// Please use useAppState directly for settings management:
//
// import { useAppState } from '../store/app-state';
//
// Example usage:
// const { 
//   settings, 
//   updateSetting, 
//   saveSettings,
//   fetchSettings,
//   validateSettingsForm,
// } = useAppState();
//
// // Ensure fetchSettings is called on component mount
// useEffect(() => {
//   fetchSettings();
// }, [fetchSettings]);
