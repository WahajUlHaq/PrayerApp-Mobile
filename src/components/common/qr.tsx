import React from 'react';
import { View, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

interface SimpleQRCodeProps {
  link: string; // pass your link here
  size?: number; // optional size
}

const SimpleQRCode: React.FC<SimpleQRCodeProps> = ({ link, size = 200 }) => {
  if (!link) return null; // if no link, render nothing

  return (
      <QRCode value={link} size={size} />
  );
};

const styles = StyleSheet.create({
  container: {
    // justifyContent: 'center',
    // alignItems: 'center',
  },
});

export default SimpleQRCode;
