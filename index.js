import { registerRootComponent } from 'expo';

import RobustApp from './RobustApp';

// registerRootComponent calls AppRegistry.registerComponent('main', () => RobustApp);
// It also ensures that whether you load the app in Expo Go or in a native build,
// environment is set up appropriately
registerRootComponent(RobustApp);
