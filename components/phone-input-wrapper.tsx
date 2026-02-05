import React from 'react';
import PhoneInput from 'react-native-phone-number-input';

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
 * Phone input component for mobile (Android & iOS)
 * Uses react-native-phone-number-input with full country picker
 */
export const PhoneInputWrapper = React.forwardRef<any, PhoneInputWrapperProps>(
  (
    {
      value,
      onChangeText,
      onChangeFormattedText,
      defaultCode = 'KE',
      containerStyle,
      textContainerStyle,
      textInputStyle,
      codeTextStyle,
      placeholder = 'Phone Number',
    },
    ref
  ) => {
    return (
      <PhoneInput
        ref={ref}
        defaultValue={value}
        defaultCode={defaultCode as any}
        layout="first"
        onChangeText={onChangeText}
        onChangeFormattedText={onChangeFormattedText}
        withDarkTheme={false}
        withShadow={false}
        autoFocus={false}
        containerStyle={containerStyle}
        textContainerStyle={textContainerStyle}
        textInputStyle={textInputStyle}
        codeTextStyle={codeTextStyle}
        placeholder={placeholder}
      />
    );
  }
);
