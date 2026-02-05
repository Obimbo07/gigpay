import { useAuth } from '@/contexts/auth-context';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function DashboardScreen() {
  const { user } = useAuth();

  // Mock data - replace with actual data from your backend
  const totalBalance = 1240.50;
  const kesEquivalent = 185200.00;
  const walletAddress = '0.0.1284591';

  const recentActivities = [
    {
      id: '1',
      title: 'Payment from John D.',
      location: 'Canada',
      time: 'Today, 10:45 AM',
      amount: 450.00,
      type: 'credit',
      status: 'SUCCESS',
    },
    {
      id: '2',
      title: 'M-Pesa Withdrawal',
      location: 'To 0712***789',
      time: 'Yesterday',
      amount: -200.00,
      type: 'debit',
      status: 'COMPLETED',
    },
    {
      id: '3',
      title: 'Freelance Gig UI/UX',
      location: 'Germany',
      time: '2 days ago',
      amount: 850.00,
      type: 'credit',
      status: 'SUCCESS',
    },
    {
      id: '4',
      title: 'SaucerSwap Yield',
      location: 'Reward Distribution',
      time: 'Weekly',
      amount: 12.45,
      type: 'yield',
      status: 'AUTO-STAKED',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.profileCircle}>
            <Ionicons name="person" size={24} color="#00D9FF" />
          </View>
          <Text style={styles.headerTitle}>HEDERA NETWORK</Text>
          <Text style={styles.dashboardTitle}>Dashboard</Text>
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
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {recentActivities.map((activity) => (
          <View key={activity.id} style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Ionicons
                name={
                  activity.type === 'credit'
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
                {activity.location} • {activity.time}
              </Text>
            </View>
            <View style={styles.activityRight}>
              <Text
                style={[
                  styles.activityAmount,
                  activity.type === 'debit' && styles.activityAmountDebit,
                ]}
              >
                {activity.amount > 0 ? '+' : ''}
                {activity.amount.toFixed(2)} USDC
              </Text>
              <Text
                style={[
                  styles.activityStatus,
                  activity.status === 'SUCCESS' && styles.activityStatusSuccess,
                  activity.status === 'AUTO-STAKED' && styles.activityStatusYield,
                ]}
              >
                {activity.status}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A1F2B',
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
  },
  profileCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1A3544',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    left: 0,
  },
  headerTitle: {
    fontSize: 12,
    color: '#00D9FF',
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  dashboardTitle: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
    position: 'absolute',
    left: 0,
    right: 0,
    top: 20,
  },
  notificationButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1A3544',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: 0,
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
