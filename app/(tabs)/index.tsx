import { useAuth } from '@/contexts/auth-context';
import { formatTransactionTime, useWallet } from '@/hooks/use-wallet';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function HomeScreen() {
  const { user, profile } = useAuth();
  const { 
    wallet, 
    transactions, 
    isLoading, 
    hasWallet, 
    refreshWallet, 
    refreshTransactions 
  } = useWallet();
  const [refreshing, setRefreshing] = React.useState(false);

  // Get display values from wallet or defaults
  const totalBalance = wallet?.balance ?? 0;
  const kesEquivalent = totalBalance * 149.50; // Mock rate
  const walletAddress = wallet?.hedera_account_id ?? 'No wallet';

  // Map transactions to activity format
  const recentActivities = transactions.length > 0 
    ? transactions.slice(0, 5).map(tx => ({
        id: tx.id,
        title: tx.title,
        location: tx.counterparty || tx.location || '',
        time: formatTransactionTime(tx.created_at),
        amount: tx.type === 'debit' || tx.type === 'withdrawal' ? -tx.amount : tx.amount,
        type: tx.type,
        status: tx.status.toUpperCase().replace('_', '-'),
      }))
    : []; // Empty if no transactions

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshWallet(), refreshTransactions()]);
    setRefreshing(false);
  }, [refreshWallet, refreshTransactions]);

  // Show wallet setup prompt if no wallet
  if (!isLoading && !hasWallet) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.profileCircle}>
              <Ionicons name="person" size={24} color="#00D9FF" />
            </View>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>HEDERA NETWORK</Text>
              <Text style={styles.dashboardTitle}>Home</Text>
            </View>
            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.noWalletContainer}>
          <View style={styles.noWalletIcon}>
            <Ionicons name="wallet-outline" size={64} color="#00D9FF" />
          </View>
          <Text style={styles.noWalletTitle}>Set Up Your Wallet</Text>
          <Text style={styles.noWalletSubtitle}>
            Create a Hedera wallet to start receiving payments and earning yield.
          </Text>
          <TouchableOpacity 
            style={styles.setupWalletButton}
            onPress={() => router.push('/(tabs)/wallet-setup')}
          >
            <Ionicons name="add-circle" size={24} color="#0A1F2B" />
            <Text style={styles.setupWalletButtonText}>Create Wallet</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#00D9FF" />
        <Text style={styles.loadingText}>Loading wallet...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#00D9FF"
          colors={['#00D9FF']}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.profileCircle}>
            <Ionicons name="person" size={24} color="#00D9FF" />
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>HEDERA NETWORK</Text>
            <Text style={styles.dashboardTitle}>Home</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceContent}>
          <View style={styles.balanceLeft}>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <Text style={styles.balanceAmount}>{totalBalance.toFixed(2)} USDC</Text>
            <Text style={styles.balanceKes}>≈ {kesEquivalent.toLocaleString()} KES</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '65%' }]} />
            </View>
            <Text style={styles.walletAddress}>{walletAddress}</Text>
          </View>
          <View style={styles.balanceRight}>
            <View style={styles.usdcBadge}>
              <Ionicons name="logo-usd" size={32} color="#00D9FF" />
              <Text style={styles.usdcText}>USDC</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButtonPrimary}>
          <Ionicons name="qr-code" size={24} color="#0A1F2B" />
          <Text style={styles.actionButtonPrimaryText}>Receive</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButtonSecondary}>
          <Ionicons name="repeat" size={24} color="#00D9FF" />
          <Text style={styles.actionButtonSecondaryText}>Earn Yield</Text>
        </TouchableOpacity>
      </View>

      {/* Withdraw to M-Pesa Button */}
      <TouchableOpacity style={styles.withdrawButton}>
        <Ionicons name="phone-portrait" size={20} color="#0A1F2B" />
        <Text style={styles.withdrawButtonText}>Withdraw to M-Pesa</Text>
      </TouchableOpacity>

      {/* Recent Activity */}
      <View style={styles.recentActivity}>
        <View style={styles.activityHeader}>
          <Text style={styles.activityTitle}>Recent Activity</Text>
          {recentActivities.length > 0 && (
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          )}
        </View>

        {recentActivities.length === 0 ? (
          <View style={styles.emptyActivity}>
            <Ionicons name="receipt-outline" size={48} color="#8B9BA8" />
            <Text style={styles.emptyActivityTitle}>No Transactions Yet</Text>
            <Text style={styles.emptyActivitySubtitle}>
              Your transaction history will appear here
            </Text>
          </View>
        ) : (
          recentActivities.map((activity) => (
            <View key={activity.id} style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Ionicons
                  name={
                    activity.type === 'credit' || activity.type === 'deposit'
                      ? 'arrow-down'
                      : activity.type === 'yield'
                      ? 'trending-up'
                      : 'arrow-up'
                  }
                  size={20}
                  color="#00D9FF"
                />
              </View>
              <View style={styles.activityDetails}>
                <Text style={styles.activityName}>{activity.title}</Text>
                <Text style={styles.activityLocation}>
                  {activity.location} {activity.location && '• '}{activity.time}
                </Text>
              </View>
              <View style={styles.activityRight}>
                <Text
                  style={[
                    styles.activityAmount,
                    (activity.type === 'debit' || activity.type === 'withdrawal') && 
                      styles.activityAmountDebit,
                  ]}
                >
                  {activity.amount > 0 ? '+' : ''}
                  {activity.amount.toFixed(2)} USDC
                </Text>
                <Text
                  style={[
                    styles.activityStatus,
                    (activity.status === 'SUCCESS' || activity.status === 'COMPLETED') && 
                      styles.activityStatusSuccess,
                    activity.status === 'AUTO-STAKED' && styles.activityStatusYield,
                  ]}
                >
                  {activity.status}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A1F2B',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8B9BA8',
  },
  noWalletContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  noWalletIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1A3544',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  noWalletTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  noWalletSubtitle: {
    fontSize: 16,
    color: '#8B9BA8',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  setupWalletButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00D9FF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 8,
  },
  setupWalletButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0A1F2B',
  },
  emptyActivity: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A3544',
    borderRadius: 16,
    padding: 32,
    borderWidth: 1,
    borderColor: '#2D4A5C',
  },
  emptyActivityTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyActivitySubtitle: {
    fontSize: 14,
    color: '#8B9BA8',
    textAlign: 'center',
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1A3544',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 12,
    color: '#00D9FF',
    fontWeight: '600',
    marginBottom: 4,
  },
  dashboardTitle: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  notificationButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1A3544',
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#1A3544',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2D4A5C',
  },
  balanceContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceLeft: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#8B9BA8',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  balanceKes: {
    fontSize: 18,
    color: '#00D9FF',
    marginBottom: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#2D4A5C',
    borderRadius: 3,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00D9FF',
    borderRadius: 3,
  },
  walletAddress: {
    fontSize: 12,
    color: '#6B7B88',
  },
  balanceRight: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  usdcBadge: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: '#0A1F2B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  usdcText: {
    fontSize: 12,
    color: '#00D9FF',
    fontWeight: '600',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  actionButtonPrimary: {
    flex: 1,
    backgroundColor: '#00D9FF',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonPrimaryText: {
    color: '#0A1F2B',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
  actionButtonSecondary: {
    flex: 1,
    backgroundColor: '#1A3544',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2D4A5C',
  },
  actionButtonSecondaryText: {
    color: '#00D9FF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
  withdrawButton: {
    marginHorizontal: 20,
    backgroundColor: '#00D9FF',
    padding: 18,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    gap: 8,
  },
  withdrawButtonText: {
    color: '#0A1F2B',
    fontSize: 16,
    fontWeight: '700',
  },
  recentActivity: {
    marginHorizontal: 20,
    marginBottom: 32,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  activityTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  viewAllText: {
    fontSize: 14,
    color: '#00D9FF',
    fontWeight: '600',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A3544',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2D4A5C',
  },
  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0A1F2B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityDetails: {
    flex: 1,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  activityLocation: {
    fontSize: 13,
    color: '#8B9BA8',
  },
  activityRight: {
    alignItems: 'flex-end',
  },
  activityAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00D9FF',
    marginBottom: 4,
  },
  activityAmountDebit: {
    color: '#FFFFFF',
  },
  activityStatus: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8B9BA8',
  },
  activityStatusSuccess: {
    color: '#00FF94',
  },
  activityStatusYield: {
    color: '#FFA502',
  },
});
