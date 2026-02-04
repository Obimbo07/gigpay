import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase';
import { KYC, KYCStatus } from '@/types';
import { parseE164ToDisplay } from '@/utils/phone-validation';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function ProfileScreen() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [kycData, setKycData] = useState<KYC | null>(null);
  const [isLoadingKYC, setIsLoadingKYC] = useState(true);

  useEffect(() => {
    fetchKYCStatus();
  }, [user]);

  const fetchKYCStatus = async () => {
    if (!user) return;

    try {
      setIsLoadingKYC(true);
      const { data, error } = await supabase
        .from('kyc')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "no rows returned" error
        throw error;
      }

      setKycData(data);
    } catch (error) {
      console.error('Error fetching KYC status:', error);
    } finally {
      setIsLoadingKYC(false);
    }
  };

  const handleStartKYC = () => {
    router.push('/(tabs)/kyc-verification');
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const getKYCStatusColor = (status: KYCStatus | null) => {
    if (!status) return '#999';
    switch (status) {
      case 'pending':
        return '#FFA500';
      case 'under_review':
        return '#007AFF';
      case 'verified':
        return '#28a745';
      case 'rejected':
        return '#dc3545';
      default:
        return '#999';
    }
  };

  const getKYCStatusText = (status: KYCStatus | null) => {
    if (!status) return 'Not Started';
    switch (status) {
      case 'pending':
        return 'Pending Review';
      case 'under_review':
        return 'Under Review';
      case 'verified':
        return 'Verified ✓';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Unknown';
    }
  };

  const canSubmitKYC = !kycData || kycData.status === 'rejected';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      {/* User Info Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account Information</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Name:</Text>
          <Text style={styles.infoValue}>{profile?.full_name || 'Not set'}</Text>
        </View>

        {profile?.email && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{profile.email}</Text>
          </View>
        )}

        {profile?.phone && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone:</Text>
            <Text style={styles.infoValue}>{parseE164ToDisplay(profile.phone)}</Text>
          </View>
        )}

        {profile?.country_code && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Country:</Text>
            <Text style={styles.infoValue}>{profile.country_code}</Text>
          </View>
        )}
      </View>

      {/* KYC Status Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>KYC Verification</Text>

        {isLoadingKYC ? (
          <ActivityIndicator size="small" color="#007AFF" style={styles.loader} />
        ) : (
          <>
            <View style={styles.kycStatusContainer}>
              <Text style={styles.kycStatusLabel}>Status:</Text>
              <View
                style={[
                  styles.kycStatusBadge,
                  { backgroundColor: getKYCStatusColor(kycData?.status || null) },
                ]}
              >
                <Text style={styles.kycStatusText}>
                  {getKYCStatusText(kycData?.status || null)}
                </Text>
              </View>
            </View>

            {kycData?.status === 'rejected' && kycData.rejection_reason && (
              <View style={styles.rejectionContainer}>
                <Text style={styles.rejectionLabel}>Rejection Reason:</Text>
                <Text style={styles.rejectionReason}>{kycData.rejection_reason}</Text>
              </View>
            )}

            {kycData?.verified_at && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Verified On:</Text>
                <Text style={styles.infoValue}>
                  {new Date(kycData.verified_at).toLocaleDateString()}
                </Text>
              </View>
            )}

            {kycData?.submitted_at && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Submitted On:</Text>
                <Text style={styles.infoValue}>
                  {new Date(kycData.submitted_at).toLocaleDateString()}
                </Text>
              </View>
            )}

            {canSubmitKYC && (
              <TouchableOpacity style={styles.kycButton} onPress={handleStartKYC}>
                <Text style={styles.kycButtonText}>
                  {kycData?.status === 'rejected' ? 'Resubmit Verification' : 'Start Verification'}
                </Text>
              </TouchableOpacity>
            )}

            {kycData?.status === 'pending' && (
              <Text style={styles.kycNote}>
                Your documents are pending review. We'll notify you once the verification is
                complete.
              </Text>
            )}

            {kycData?.status === 'under_review' && (
              <Text style={styles.kycNote}>
                Our team is currently reviewing your documents. This usually takes 1-3 business
                days.
              </Text>
            )}
          </>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actionsCard}>
        <TouchableOpacity style={styles.actionButton} onPress={refreshProfile}>
          <Text style={styles.actionButtonText}>🔄 Refresh Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.userId}>User ID: {user?.id}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
    marginTop: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#000',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    textAlign: 'right',
  },
  loader: {
    paddingVertical: 20,
  },
  kycStatusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  kycStatusLabel: {
    fontSize: 16,
    color: '#666',
  },
  kycStatusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  kycStatusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  rejectionContainer: {
    backgroundColor: '#fff5f5',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545',
    marginBottom: 16,
  },
  rejectionLabel: {
    fontSize: 12,
    color: '#dc3545',
    fontWeight: '600',
    marginBottom: 4,
  },
  rejectionReason: {
    fontSize: 14,
    color: '#666',
  },
  kycButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  kycButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  kycNote: {
    fontSize: 12,
    color: '#666',
    marginTop: 12,
    fontStyle: 'italic',
  },
  actionsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButton: {
    backgroundColor: '#f5f5f5',
    padding: 14,
    borderRadius: 8,
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  signOutButton: {
    backgroundColor: '#dc3545',
    padding: 16,
    borderRadius: 8,
  },
  signOutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  userId: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
});
