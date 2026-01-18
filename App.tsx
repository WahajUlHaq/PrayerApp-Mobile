import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { Provider as ReduxProvider } from 'react-redux';
import { QueryClientProvider } from 'react-query';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'react-native';

import { queryClient } from '@/api/clients/query-client-configs';
import AppNavigator from '@/navigation/app-navigator';

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      {/* <PaperProvider theme={theme}> */}
      <SafeAreaProvider>
        <NavigationContainer>
          {/* <StatusBar
                barStyle="dark-content"
                backgroundColor={theme.colors.background.default}
              /> */}
          <AppNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
      {/* </PaperProvider> */}
    </QueryClientProvider>
  );
};

export default App;
