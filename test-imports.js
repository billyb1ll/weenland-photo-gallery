// Test file to check component imports
import React from 'react';

try {
    const AdminPanel = require('./src/components/AdminPanel.tsx');
    console.log('AdminPanel imported successfully');
} catch (error) {
    console.error('AdminPanel import failed:', error.message);
}

try {
    const DayNavigation = require('./src/components/DayNavigation.tsx');
    console.log('DayNavigation imported successfully');
} catch (error) {
    console.error('DayNavigation import failed:', error.message);
}
