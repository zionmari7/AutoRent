// src/navigation/AppNavigator.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

import DashboardScreen  from '../screens/DashboardScreen';
import FleetScreen      from '../screens/FleetScreen';
import RentalsScreen    from '../screens/RentalsScreen';
import CustomersScreen  from '../screens/CustomersScreen';
import PaymentsScreen   from '../screens/PaymentsScreen';
import TrackingScreen   from '../screens/TrackingScreen';

import { Colors, FontSize } from '../theme';

const Tab   = createBottomTabNavigator();
const Stack = createStackNavigator();

// Tab bar icon using emoji (no icon font needed for setup)
function TabIcon({
  emoji, label, focused,
}: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={[styles.tabItem, focused && styles.tabItemActive]}>
      <Text style={[styles.tabEmoji, focused && styles.tabEmojiActive]}>{emoji}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

const TAB_SCREENS = [
  { name:'Dashboard', component:DashboardScreen,  emoji:'⊞',  label:'Home'     },
  { name:'Fleet',     component:FleetScreen,       emoji:'🚗',  label:'Fleet'    },
  { name:'Tracking',  component:TrackingScreen,    emoji:'📍', label:'Track'    },
  { name:'Rentals',   component:RentalsScreen,     emoji:'📄',  label:'Rentals'  },
  { name:'Customers', component:CustomersScreen,   emoji:'👥',  label:'Customers'},
  { name:'Payments',  component:PaymentsScreen,    emoji:'💳',  label:'Payments' },
];

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle:     { backgroundColor: Colors.brand },
        headerTintColor: '#fff',
        headerTitleStyle:{ fontWeight: '700', fontSize: FontSize.lg },
        headerRight: () => (
          <View style={styles.headerBrand}>
            <Text style={styles.headerLogo}>Auto<Text style={styles.headerLogoAccent}>Rent</Text></Text>
          </View>
        ),
        tabBarStyle: {
          backgroundColor: Colors.brand,
          borderTopColor: 'rgba(255,255,255,0.08)',
          height: 62,
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarShowLabel: false,
      }}>
      {TAB_SCREENS.map(({ name, component, emoji, label }) => (
        <Tab.Screen
          key={name}
          name={name}
          component={component}
          options={{
            title: name,
            tabBarIcon: ({ focused }) => (
              <TabIcon emoji={emoji} label={label} focused={focused} />
            ),
          }} />
      ))}
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabItem:       { alignItems:'center', justifyContent:'center', gap:2, paddingHorizontal:4 },
  tabItemActive: {},
  tabEmoji:      { fontSize:20, opacity:0.5 },
  tabEmojiActive:{ opacity:1 },
  tabLabel:      { fontSize:9, color:'rgba(255,255,255,0.4)', fontWeight:'500' },
  tabLabelActive:{ color:'#fff' },
  headerBrand:   { marginRight:16 },
  headerLogo:    { fontSize:16, fontWeight:'700', color:'rgba(255,255,255,0.85)' },
  headerLogoAccent: { color: Colors.accent },
});
