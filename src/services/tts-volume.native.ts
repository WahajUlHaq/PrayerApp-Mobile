import { NativeModules } from 'react-native';

interface TTSVolumeModuleInterface {
  setMaxVolume(): Promise<string>;
  getCurrentVolume(): Promise<string>;
}

const { TTSVolumeModule } = NativeModules;

export default TTSVolumeModule as TTSVolumeModuleInterface;
