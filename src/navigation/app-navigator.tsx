import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import FrameScreen from '@/screens/frame/Frame';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FrameScreen" component={FrameScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
