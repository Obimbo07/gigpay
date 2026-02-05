import { useWallet } from '@/hooks/use-wallet';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

export default function StatsScreen() {
  const { wallet, transactions, isLoading, refreshWallet, refreshTransactions } = useWallet();
  const [refreshing, setRefreshing] = React.useState(false);

  // Calculate real stats from transactions
  const stats = React.useMemo(() => {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let totalEarnings = 0;
    let totalWithdrawals = 0;
    let thisMonthEarnings = 0;
    let yieldEarned = 0;
    let gigCount = 0;

    transactions.forEach(tx => {
      if (tx.status === 'completed') {
        const txDate = new Date(tx.created_at);
        
        if (tx.type === 'credit' || tx.type === 'deposit') {
          totalEarnings += tx.amount;
          if (txDate >= thisMonthStart) {
            thisMonthEarnings += tx.amount;
          }
          if (tx.type === 'credit') {
            gigCount++;
          }
        } else if (tx.type === 'withdrawal' || tx.type === 'debit') {
          totalWithdrawals += tx.amount;
        } else if (tx.type === 'yield') {
          yieldEarned += tx.amount;
          totalEarnings += tx.amount;
          if (txDate >= thisMonthStart) {
            thisMonthEarnings += tx.amount;
          }
        }
      }
    });

    return {
      totalEarnings,
      totalWithdrawals,
      totalGigs: gigCount,
      averageGigValue: gigCount > 0 ? totalEarnings / gigCount : 0,
      thisMonthEarnings,
      yieldEarned,
    };
  }, [transactions]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshWallet(), refreshTransactions()]);
    setRefreshing(false);
  }, [refreshWallet, refreshTransactions]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#00D9FF" />
        <Text style={styles.loadingText}>Loading statistics...</Text>
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
        <Text style={styles.headerTitle}>Statistics</Text>
        <Text style={styles.headerSubtitle}>Your earnings overview</Text>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryGrid}>
        <View style={styles.summaryCard}>
          <Ionicons name="trending-up" size={28} color="#00D9FF" />
          <Text style={styles.summaryValue}>${stats.totalEarnings.toFixed(2)}</Text>
          <Text style={styles.summaryLabel}>Total Earnings</Text>
        </View>
        <View style={styles.summaryCard}>
          <Ionicons name="arrow-up-circle" size={28} color="#8B9BA8" />
          <Text style={styles.summaryValue}>${stats.totalWithdrawals.toFixed(2)}</Text>
          <Text style={styles.summaryLabel}>Withdrawn</Text>
        </View>
      </View>

      <View style={styles.summaryGrid}>
        <View style={styles.summaryCard}>
          <Ionicons name="briefcase" size={28} color="#00D9FF" />
          <Text style={styles.summaryValue}>{stats.totalGigs}</Text>
          <Text style={styles.summaryLabel}>Total Gigs</Text>
        </View>
        <View style={styles.summaryCard}>
          <Ionicons name="cash" size={28} color="#00FF94" />
          <Text style={styles.summaryValue}>${stats.averageGigValue.toFixed(2)}</Text>
          <Text style={styles.summaryLabel}>Avg per Gig</Text>
        </View>
      </View>

      {/* Monthly Performance */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>This Month</Text>
        <View style={styles.performanceCard}>
          <View style={styles.performanceRow}>
            <Text style={styles.performanceLabel}>Earnings</Text>
            <Text style={styles.performanceValue}>
              ${stats.thisMonthEarnings.toFixed(2)} USDC
            </Text>
          </View>
          <View style={styles.performanceRow}>
            <Text style={styles.performanceLabel}>Yield Generated</Text>
            <Text style={[styles.performanceValue, { color: '#FFA502' }]}>
              +${stats.yieldEarned.toFixed(2)} USDC
            </Text>
          </View>
        </View>
      </View>

      {/* Chart Placeholder */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Earnings Trend</Text>
        <View style={styles.chartPlaceholder}>
          <Ionicons name="bar-chart" size={48} color="#2D4A5C" />
          <Text style={styles.chartPlaceholderText}>
            {transactions.length === 0 
              ? 'Start earning to see your trends' 
              : 'Chart visualization coming soon'
            }
          </Text>
        </View>
      </View>

      {/* Categories - Hidden when no data */}
      {stats.totalGigs > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Categories</Text>
          <View style={styles.emptyState}>
            <Ionicons name="briefcase-outline" size={48} color="#8B9BA8" />
            <Text style={styles.emptyStateText}>
              Category tracking coming soon
            </Text>
          </View>
        </View>
      )}

      {transactions.length === 0 && (
        <View style={styles.section}>
          <View style={styles.emptyState}>
            <Ionicons name="stats-chart-outline" size={64} color="#8B9BA8" />
            <Text style={styles.emptyStateTitle}>No Statistics Yet</Text>
            <Text style={styles.emptyStateText}>
              Complete your first gig to see your earnings statistics
            </Text>
          </View>
        </View>
      )}
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
  header: {
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8B9BA8',
  },
  summaryGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#1A3544',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2D4A5C',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#8B9BA8',
    textAlign: 'center',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  performanceCard: {
    backgroundColor: '#1A3544',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2D4A5C',
  },
  performanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2D4A5C',
  },
  performanceLabel: {
    fontSize: 14,
    color: '#8B9BA8',
  },
  performanceValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00D9FF',
  },
  chartPlaceholder: {
    backgroundColor: '#1A3544',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2D4A5C',
    minHeight: 200,
  },
  chartPlaceholderText: {
    fontSize: 14,
    color: '#8B9BA8',
    marginTop: 12,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1A3544',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2D4A5C',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  categoryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00D9FF',
  },
  emptyState: {
    backgroundColor: '#1A3544',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2D4A5C',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#8B9BA8',
    textAlign: 'center',
    marginTop: 12,
  },
});
