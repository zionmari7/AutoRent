// src/screens/DashboardScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { getDashboard, getTracking } from '../services/api';
import { StatusBadge, Card, SectionHeader, StatCard, LoadingScreen } from '../components';
import { Colors, Spacing, FontSize, Radius } from '../theme';
import { format } from 'date-fns';

function fmt(n: number) { return '₱' + Number(n).toLocaleString(); }
function fmtDate(d: string) {
  try { return format(new Date(d), 'MMM d'); } catch { return d; }
}

function FleetBar({ label, count, total, color }:
  { label: string; count: number; total: number; color: string }) {
  const pct = total ? count / total : 0;
  return (
    <View style={{ marginBottom: 10 }}>
      <View style={styles.barRow}>
        <Text style={styles.barLabel}>{label}</Text>
        <Text style={styles.barCount}>{count} / {total}</Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export default function DashboardScreen({ navigation }: any) {
  const [data, setData]           = useState<any>(null);
  const [moving, setMoving]       = useState(0);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [dash, track] = await Promise.all([getDashboard(), getTracking()]);
      setData(dash as any);
      setMoving((track as any[]).filter((v: any) => v.speed_kph > 0).length);
    } catch (e: any) {
      console.error(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingScreen />;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.accent} />}>

      {/* ── Stat row 1 ── */}
      <View style={styles.statRow}>
        <StatCard
          label="Monthly Revenue"
          value={fmt(data?.monthly_revenue ?? 0)}
          delta="this month"
          dark />
        <StatCard
          label="Fleet"
          value={data?.fleet?.total ?? 0}
          delta={`${data?.fleet?.available ?? 0} avail`}
          onPress={() => navigation.navigate('Fleet')} />
      </View>

      {/* ── Stat row 2 ── */}
      <View style={styles.statRow}>
        <StatCard
          label="Active Rentals"
          value={data?.rentals?.active ?? 0}
          delta="currently out"
          valueColor={Colors.blue}
          onPress={() => navigation.navigate('Rentals')} />
        <StatCard
          label="On Road Now"
          value={moving}
          delta="live tracking"
          valueColor={Colors.green}
          onPress={() => navigation.navigate('Tracking')} />
      </View>

      {/* ── Recent Rentals ── */}
      <SectionHeader
        title="Recent Rentals"
        action="View all →"
        onAction={() => navigation.navigate('Rentals')} />
      <Card style={{ marginBottom: Spacing.lg, padding: 0, overflow: 'hidden' }}>
        {(data?.recent_rentals ?? []).length === 0 ? (
          <Text style={styles.empty}>No rentals yet</Text>
        ) : (data.recent_rentals as any[]).map((r: any, i: number) => (
          <View key={r.id} style={[
            styles.rentalRow,
            i < data.recent_rentals.length - 1 && styles.rentalBorder,
          ]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rentalCustomer}>{r.customer_name}</Text>
              <Text style={styles.rentalVehicle}>{r.vehicle_name}</Text>
              <Text style={styles.rentalDate}>
                {fmtDate(r.start_date)} – {fmtDate(r.end_date)}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <Text style={styles.rentalAmount}>{fmt(r.total_amount)}</Text>
              <StatusBadge status={r.status} />
            </View>
          </View>
        ))}
      </Card>

      {/* ── Fleet Status ── */}
      <SectionHeader title="Fleet Breakdown" />
      <Card style={{ marginBottom: Spacing.xl }}>
        <FleetBar label="Available"   count={data?.fleet?.available ?? 0}   total={data?.fleet?.total ?? 1} color={Colors.green}  />
        <FleetBar label="Rented"      count={data?.fleet?.rented ?? 0}      total={data?.fleet?.total ?? 1} color={Colors.blue}   />
        <FleetBar label="Maintenance" count={data?.fleet?.maintenance ?? 0} total={data?.fleet?.total ?? 1} color={Colors.yellow} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface2 },
  content:   { padding: Spacing.lg, paddingBottom: 40 },
  statRow:   { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  barRow:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  barLabel:  { fontSize: FontSize.sm, color: Colors.text2 },
  barCount:  { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text },
  barTrack:  { height: 7, backgroundColor: Colors.surface3, borderRadius: 999, overflow: 'hidden' },
  barFill:   { height: 7, borderRadius: 999 },
  rentalRow: { flexDirection: 'row', padding: Spacing.md, alignItems: 'center' },
  rentalBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  rentalCustomer: { fontSize: FontSize.base, fontWeight: '600', color: Colors.text },
  rentalVehicle:  { fontSize: FontSize.sm, color: Colors.text2, marginTop: 1 },
  rentalDate:     { fontSize: FontSize.xs, color: Colors.text3, marginTop: 2 },
  rentalAmount:   { fontSize: FontSize.base, fontWeight: '700', color: Colors.text },
  empty: { padding: Spacing.xl, textAlign: 'center', color: Colors.text3 },
});
