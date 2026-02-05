import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase';
import { DocumentType, KYCStatus } from '@/types';
import {
  compressImage,
  generateKYCFilename,
  validateKYCDocument
} from '@/utils/image-validation';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

type UploadStep = 'document-type' | 'document-upload' | 'selfie-upload' | 'review';

export default function KYCVerificationScreen() {
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState<UploadStep>('document-type');
  const [documentType, setDocumentType] = useState<DocumentType | null>(null);
  const [documentUri, setDocumentUri] = useState<string | null>(null);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Request camera permissions
  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is required to take photos');
      return false;
    }
    return true;
  };

  // Request media library permissions
  const requestMediaLibraryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Media library permission is required to select photos');
      return false;
    }
    return true;
  };

  // Handle document upload (ID, Passport, Military ID)
  const handleDocumentUpload = async (source: 'camera' | 'library') => {
    try {
      let result;

      if (source === 'camera') {
        const hasPermission = await requestCameraPermission();
        if (!hasPermission) return;

        result = await ImagePicker.launchCameraAsync({
          mediaTypes: 'images',
          allowsEditing: true,
          quality: 0.8,
          aspect: [4, 3],
        });
      } else {
        const hasPermission = await requestMediaLibraryPermission();
        if (!hasPermission) return;

        // Allow both images and PDFs for documents
        const docResult = await DocumentPicker.getDocumentAsync({
          type: ['image/*', 'application/pdf'],
          copyToCacheDirectory: true,
        });

        if (!docResult.canceled && docResult.assets[0]) {
          result = {
            canceled: false,
            assets: [docResult.assets[0]],
          };
        } else {
          return;
        }
      }

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];

        // Validate document
        const validation = await validateKYCDocument(
          {
            uri: asset.uri,
            type: asset.mimeType,
            size: asset.fileSize,
            name: asset.fileName || 'document',
          },
          'document'
        );

        if (!validation.isValid) {
          Alert.alert('Invalid Document', validation.error || 'Please select a valid document');
          return;
        }

        // Compress if it's an image
        let finalUri = asset.uri;
        if (asset.mimeType?.startsWith('image/')) {
          finalUri = await compressImage(asset.uri, 1920, 0.8);
        }

        setDocumentUri(finalUri);
        setStep('selfie-upload');
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to select document');
    }
  };

  // Handle selfie upload
  const handleSelfieUpload = async (source: 'camera' | 'library') => {
    try {
      let result;

      if (source === 'camera') {
        const hasPermission = await requestCameraPermission();
        if (!hasPermission) return;

        result = await ImagePicker.launchCameraAsync({
          mediaTypes: 'images',
          allowsEditing: true,
          quality: 0.8,
          aspect: [3, 4],
          cameraType: ImagePicker.CameraType.front,
        });
      } else {
        const hasPermission = await requestMediaLibraryPermission();
        if (!hasPermission) return;

        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: 'images',
          allowsEditing: true,
          quality: 0.8,
          aspect: [3, 4],
        });
      }

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];

        // Validate selfie
        const validation = await validateKYCDocument(
          {
            uri: asset.uri,
            type: asset.mimeType,
            size: asset.fileSize,
            name: 'selfie.jpg',
          },
          'selfie'
        );

        if (!validation.isValid) {
          Alert.alert('Invalid Image', validation.error || 'Please select a valid selfie');
          return;
        }

        // Compress selfie
        const compressedUri = await compressImage(asset.uri, 1280, 0.7);
        setSelfieUri(compressedUri);
        setStep('review');
      }
    } catch (error) {
      console.error('Error taking selfie:', error);
      Alert.alert('Error', 'Failed to capture selfie');
    }
  };

  // Upload files to Supabase Storage and create KYC record
  const handleSubmit = async () => {
    if (!user || !documentType || !documentUri || !selfieUri) {
      Alert.alert('Error', 'Please complete all steps');
      return;
    }

    setIsUploading(true);

    try {
      // Generate unique filenames
      const documentFilename = generateKYCFilename(user.id, 'document', documentType);
      const selfieFilename = generateKYCFilename(user.id, 'selfie');

      // Convert URIs to blobs for upload
      const documentBlob = await fetch(documentUri).then((r) => r.blob());
      const selfieBlob = await fetch(selfieUri).then((r) => r.blob());

      // Upload document
      console.log('Uploading document:', documentFilename);
      const { data: docData, error: docUploadError } = await supabase.storage
        .from('kyc-documents')
        .upload(documentFilename, documentBlob, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (docUploadError) {
        console.error('Document upload error:', docUploadError);
        throw new Error(`Document upload failed: ${docUploadError.message}`);
      }
      console.log('Document uploaded successfully:', docData);

      // Upload selfie
      console.log('Uploading selfie:', selfieFilename);
      const { data: selfieData, error: selfieUploadError } = await supabase.storage
        .from('kyc-selfies')
        .upload(selfieFilename, selfieBlob, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (selfieUploadError) {
        console.error('Selfie upload error:', selfieUploadError);
        throw new Error(`Selfie upload failed: ${selfieUploadError.message}`);
      }
      console.log('Selfie uploaded successfully:', selfieData);

      // Create KYC record in database
      const { error: kycError } = await supabase.from('kyc').insert({
        user_id: user.id,
        status: 'pending' as KYCStatus,
        document_type: documentType,
        document_url: documentFilename,
        selfie_url: selfieFilename,
        submitted_at: new Date().toISOString(),
      });

      if (kycError) throw kycError;

      // Refresh profile to get updated KYC status
      await refreshProfile();

      Alert.alert(
        'Verification Submitted',
        'Your documents have been submitted for review. We will notify you once the verification is complete.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error submitting KYC:', error);
      Alert.alert('Submission Failed', error.message || 'Failed to submit verification');
    } finally {
      setIsUploading(false);
    }
  };

  // Render document type selection
  const renderDocumentTypeStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Select Document Type</Text>
      <Text style={styles.stepSubtitle}>
        Choose the type of identification document you want to upload
      </Text>

      <TouchableOpacity
        style={[styles.docTypeButton, documentType === 'passport' && styles.docTypeButtonActive]}
        onPress={() => {
          setDocumentType('passport');
          setStep('document-upload');
        }}
      >
        <Text
          style={[styles.docTypeText, documentType === 'passport' && styles.docTypeTextActive]}
        >
          Passport
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.docTypeButton,
          documentType === 'national_id' && styles.docTypeButtonActive,
        ]}
        onPress={() => {
          setDocumentType('national_id');
          setStep('document-upload');
        }}
      >
        <Text
          style={[styles.docTypeText, documentType === 'national_id' && styles.docTypeTextActive]}
        >
          National ID
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.docTypeButton,
          documentType === 'military_id' && styles.docTypeButtonActive,
        ]}
        onPress={() => {
          setDocumentType('military_id');
          setStep('document-upload');
        }}
      >
        <Text
          style={[styles.docTypeText, documentType === 'military_id' && styles.docTypeTextActive]}
        >
          Military ID
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Render document upload step
  const renderDocumentUploadStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Upload {documentType?.replace('_', ' ')}</Text>
      <Text style={styles.stepSubtitle}>
        Take a clear photo of your document or upload from gallery
      </Text>

      {documentUri ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: documentUri }} style={styles.previewImage} />
          <TouchableOpacity
            style={styles.changeButton}
            onPress={() => setDocumentUri(null)}
          >
            <Text style={styles.changeButtonText}>Change Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.nextButton}
            onPress={() => setStep('selfie-upload')}
          >
            <Text style={styles.nextButtonText}>Next: Take Selfie</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.uploadOptions}>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => handleDocumentUpload('camera')}
          >
            <Text style={styles.uploadButtonText}>📷 Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => handleDocumentUpload('library')}
          >
            <Text style={styles.uploadButtonText}>📁 Choose from Gallery</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setStep('document-type')}
      >
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>
    </View>
  );

  // Render selfie upload step
  const renderSelfieUploadStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Take a Selfie</Text>
      <Text style={styles.stepSubtitle}>
        Take a clear selfie for identity verification
      </Text>

      {selfieUri ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: selfieUri }} style={styles.previewImage} />
          <TouchableOpacity
            style={styles.changeButton}
            onPress={() => setSelfieUri(null)}
          >
            <Text style={styles.changeButtonText}>Retake Selfie</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.nextButton} onPress={() => setStep('review')}>
            <Text style={styles.nextButtonText}>Next: Review</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.uploadOptions}>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => handleSelfieUpload('camera')}
          >
            <Text style={styles.uploadButtonText}>🤳 Take Selfie</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => handleSelfieUpload('library')}
          >
            <Text style={styles.uploadButtonText}>📁 Choose from Gallery</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setStep('document-upload')}
      >
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>
    </View>
  );

  // Render review step
  const renderReviewStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Review & Submit</Text>
      <Text style={styles.stepSubtitle}>
        Please review your documents before submitting
      </Text>

      <View style={styles.reviewSection}>
        <Text style={styles.reviewLabel}>Document Type:</Text>
        <Text style={styles.reviewValue}>
          {documentType?.replace('_', ' ').toUpperCase()}
        </Text>
      </View>

      <View style={styles.reviewImageContainer}>
        <Text style={styles.reviewImageLabel}>Document Photo:</Text>
        <Image source={{ uri: documentUri! }} style={styles.reviewImage} />
      </View>

      <View style={styles.reviewImageContainer}>
        <Text style={styles.reviewImageLabel}>Selfie:</Text>
        <Image source={{ uri: selfieUri! }} style={styles.reviewImage} />
      </View>

      <TouchableOpacity
        style={[styles.submitButton, isUploading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={isUploading}
      >
        {isUploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Submit for Verification</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setStep('selfie-upload')}
        disabled={isUploading}
      >
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>KYC Verification</Text>
        <Text style={styles.headerSubtitle}>
          Complete your identity verification to access all features
        </Text>
      </View>

      {step === 'document-type' && renderDocumentTypeStep()}
      {step === 'document-upload' && renderDocumentUploadStep()}
      {step === 'selfie-upload' && renderSelfieUploadStep()}
      {step === 'review' && renderReviewStep()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A1F2B',
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8B9BA8',
  },
  stepContainer: {
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#FFFFFF',
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#8B9BA8',
    marginBottom: 24,
  },
  docTypeButton: {
    backgroundColor: '#1A3544',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#2D4A5C',
  },
  docTypeButtonActive: {
    backgroundColor: '#1A3544',
    borderColor: '#00D9FF',
  },
  docTypeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  docTypeTextActive: {
    color: '#00D9FF',
  },
  uploadOptions: {
    marginBottom: 24,
  },
  uploadButton: {
    backgroundColor: '#00D9FF',
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
  },
  uploadButtonText: {
    color: '#0A1F2B',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  previewContainer: {
    marginBottom: 24,
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 16,
    resizeMode: 'cover',
  },
  changeButton: {
    backgroundColor: '#1A3544',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2D4A5C',
  },
  changeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  nextButton: {
    backgroundColor: '#00D9FF',
    padding: 16,
    borderRadius: 12,
  },
  nextButtonText: {
    color: '#0A1F2B',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  reviewSection: {
    backgroundColor: '#1A3544',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2D4A5C',
  },
  reviewLabel: {
    fontSize: 14,
    color: '#8B9BA8',
    marginBottom: 4,
  },
  reviewValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  reviewImageContainer: {
    marginBottom: 16,
  },
  reviewImageLabel: {
    fontSize: 14,
    color: '#8B9BA8',
    marginBottom: 8,
  },
  reviewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  submitButton: {
    backgroundColor: '#00FF94',
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#0A1F2B',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  backButton: {
    padding: 12,
  },
  backButtonText: {
    color: '#00D9FF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
