import React, { useState } from 'react';
import { StyleSheet, View, StatusBar } from 'react-native';
import AdminRoute from './AdminRoute';
import AdminPanelScreen from './AdminPanelScreen';

export default function AdminEntry() {
  const [adminUser, setAdminUser] = useState(null);

  const handleAdminLogin = (userData) => {
    setAdminUser(userData);
  };

  const handleLogout = () => {
    setAdminUser(null);
  };

  return (
    <View style={styles.container}>
      {!adminUser ? (
        <AdminRoute onAdminLogin={handleAdminLogin} />
      ) : (
        <AdminPanelScreen adminUser={adminUser} onLogout={handleLogout} />
      )}
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});
