// src/components/index.tsx
import React from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  StyleSheet, ViewStyle, TextStyle,
} from 'react-native';
import { Colors, FontSize, Spacing, Radius, Shadow } from '../theme';

// ─── StatusBadge ──────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  available:   { bg: '#dcfce7', color: '#15803d', label: 'Available'   },
  rented:      { bg: '#dbeafe', color: '#1d4ed8', label: 'Rented'      },
  maintenance: { bg: '#fef9c3', color: '#a16207', label: 'Maintenance'  },
  active:      { bg: '#dbeafe', color: '#1d4ed8', label: 'Active'       },
  completed:   { bg: '#dcfce7', color: '#15803d', label: 'Completed'    },
  cancelled:   { bg: '#f1f5f9', color: '#475569', label: 'Cancelled'    },
  moving:      { bg: '#dcfce7', color: '#15803d', label: 'Moving'       },
  parked:      { bg: '#f1f5f9', color: '#64748b', label: 'Parked'       },
};

export function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || { bg: '#f1f5f9', color: '#64748b', label: status };
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <View style={[styles.badgeDot, { backgroundColor: cfg.color }]} />
      <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({
  children, style, onPress,
}: { children: React.ReactNode; style?: ViewStyle; onPress?: () => void }) {
  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.card, style]}
        onPress={onPress}
        activeOpacity={0.75}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

// ─── Button ───────────────────────────────────────────────────────────────────
export function Button({
  title, onPress, variant = 'primary', style, loading = false, disabled = false,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'danger' | 'ghost';
  style?: ViewStyle;
  loading?: boolean;
  disabled?: boolean;
}) {
  const variantStyle = {
    primary: { bg: Colors.accent,   border: Colors.accent,   text: '#fff' },
    outline: { bg: 'transparent',   border: Colors.border,   text: Colors.text },
    danger:  { bg: Colors.red,      border: Colors.red,      text: '#fff' },
    ghost:   { bg: Colors.surface3, border: Colors.surface3, text: Colors.text2 },
  }[variant];

  return (
    <TouchableOpacity
      style={[
        styles.btn,
        { backgroundColor: variantStyle.bg, borderColor: variantStyle.border },
        disabled && { opacity: 0.5 },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}>
      {loading
        ? <ActivityIndicator color={variantStyle.text} size="small" />
        : <Text style={[styles.btnText, { color: variantStyle.text }]}>{title}</Text>
      }
    </TouchableOpacity>
  );
}

// ─── SectionHeader ────────────────────────────────────────────────────────────
export function SectionHeader({
  title, action, onAction,
}: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && (
        <TouchableOpacity onPress={onAction}>
          <Text style={styles.sectionAction}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
export function StatCard({
  label, value, delta, dark = false, onPress, valueColor,
}: {
  label: string; value: string | number; delta?: string;
  dark?: boolean; onPress?: () => void; valueColor?: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.statCard, dark && styles.statCardDark]}
      onPress={onPress}
      activeOpacity={onPress ? 0.8 : 1}>
      <Text style={[styles.statLabel, dark && { color: 'rgba(255,255,255,0.5)' }]}>
        {label}
      </Text>
      <Text style={[
        styles.statValue,
        dark && { color: '#fff' },
        valueColor && { color: valueColor },
      ]}>
        {value}
      </Text>
      {delta ? (
        <Text style={[styles.statDelta, dark && { color: 'rgba(255,255,255,0.4)' }]}>
          {delta}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
export function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

// ─── LoadingScreen ────────────────────────────────────────────────────────────
export function LoadingScreen() {
  return (
    <View style={styles.loadingScreen}>
      <ActivityIndicator size="large" color={Colors.accent} />
    </View>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────
export function Divider({ style }: { style?: ViewStyle }) {
  return <View style={[styles.divider, style]} />;
}

// ─── InfoRow ──────────────────────────────────────────────────────────────────
export function InfoRow({
  label, value, valueColor,
}: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueColor ? { color: valueColor } : {}]}>
        {value}
      </Text>
    </View>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
export function Avatar({
  name, color, size = 44,
}: { name: string; color: string; size?: number }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <View style={[styles.avatar, { backgroundColor: color, width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.32 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Badge
  badge: { flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:9,
           paddingVertical:3, borderRadius:Radius.full },
  badgeDot: { width:5, height:5, borderRadius:Radius.full },
  badgeText: { fontSize:FontSize.xs, fontWeight:'600' },
  // Card
  card: { backgroundColor:Colors.surface, borderRadius:Radius.md,
          borderWidth:1, borderColor:Colors.border, ...Shadow.sm },
  // Button
  btn: { flexDirection:'row', alignItems:'center', justifyContent:'center',
         paddingHorizontal:16, paddingVertical:10, borderRadius:Radius.sm,
         borderWidth:1, gap:6 },
  btnText: { fontSize:FontSize.base, fontWeight:'600' },
  // Section header
  sectionHeader: { flexDirection:'row', alignItems:'center',
                   justifyContent:'space-between', marginBottom:Spacing.sm },
  sectionTitle: { fontSize:FontSize.md, fontWeight:'700', color:Colors.text },
  sectionAction: { fontSize:FontSize.sm, color:Colors.accent, fontWeight:'600' },
  // Stat card
  statCard: { flex:1, backgroundColor:Colors.surface, borderRadius:Radius.md,
              borderWidth:1, borderColor:Colors.border, padding:Spacing.md, ...Shadow.sm },
  statCardDark: { backgroundColor:Colors.brand, borderColor:Colors.brand },
  statLabel: { fontSize:FontSize.xs, fontWeight:'600', color:Colors.text2,
               textTransform:'uppercase', letterSpacing:0.5, marginBottom:6 },
  statValue: { fontSize:FontSize.xxl, fontWeight:'700', color:Colors.text, lineHeight:30 },
  statDelta: { fontSize:FontSize.xs, color:Colors.text3, marginTop:4 },
  // Empty state
  emptyState: { alignItems:'center', justifyContent:'center', padding:Spacing.xxl * 2 },
  emptyIcon: { fontSize:48, marginBottom:Spacing.sm },
  emptyText: { fontSize:FontSize.base, color:Colors.text3, textAlign:'center' },
  // Loading
  loadingScreen: { flex:1, alignItems:'center', justifyContent:'center',
                   backgroundColor:Colors.surface2 },
  // Divider
  divider: { height:1, backgroundColor:Colors.border, marginVertical:Spacing.sm },
  // Info row
  infoRow: { flexDirection:'row', justifyContent:'space-between',
             alignItems:'center', paddingVertical:5 },
  infoLabel: { fontSize:FontSize.sm, color:Colors.text2 },
  infoValue: { fontSize:FontSize.sm, fontWeight:'600', color:Colors.text },
  // Avatar
  avatar: { alignItems:'center', justifyContent:'center' },
  avatarText: { color:'#fff', fontWeight:'700' },
});
