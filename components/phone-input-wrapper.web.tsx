import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

type PhoneInputWrapperProps = {
  value: string;
  onChangeText: (text: string) => void;
  onChangeFormattedText?: (text: string) => void;
  defaultCode?: string;
  containerStyle?: any;
  textContainerStyle?: any;
  textInputStyle?: any;
  codeTextStyle?: any;
  placeholder?: string;
};

/**
 * Web-specific phone input component
 * Uses simple text input for E.164 format phone numbers
 */
export const PhoneInputWrapper = React.forwardRef<any, PhoneInputWrapperProps>(
  (
    {
      value,
      onChangeText,
      onChangeFormattedText,
      containerStyle,
      textInputStyle,
    },
    _ref
  ) => {
    return (
      <View style={[styles.webContainer, containerStyle]}>
        <Text style={styles.webLabel}>Phone Number (International Format)</Text>
        <TextInput
          style={[styles.webInput, textInputStyle]}
          placeholder="+254712345678"
          value={value}
          onChangeText={(text) => {
            onChangeText(text);
            onChangeFormattedText?.(text);
          }}
          autoComplete="tel"
        />
        <Text style={styles.webHint}>
          Enter your phone number with country code (e.g., +254 for Kenya, +1 for USA)
        </Text>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  webContainer: {
    marginBottom: 16,
  },
  webLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  webInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  webHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
  },
});
