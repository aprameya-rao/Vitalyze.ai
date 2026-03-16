import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { COLORS, SIZES, moderateScale } from '../constants/theme';

type TabType = 'daily' | 'refill';
type TimingType = 'morning' | 'afternoon' | 'evening';

export default function RemindersScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('daily');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'success' | 'error'>('success');

  // Daily Reminder State
  const [dailyForm, setDailyForm] = useState({
    medicine_name: '',
    timings: [] as TimingType[],
  });

  // Refill Reminder State
  const [refillForm, setRefillForm] = useState({
    medicine_name: '',
    initial_quantity: '10',
    frequency_per_day: '1',
  });

  const handleTimingChange = (timing: TimingType) => {
    setDailyForm((prev) => {
      const exists = prev.timings.includes(timing);
      if (exists) {
        return { ...prev, timings: prev.timings.filter((t) => t !== timing) };
      }
      return { ...prev, timings: [...prev.timings, timing] };
    });
  };

  const handleDailySubmit = async () => {
    setLoading(true);
    setMsg('');

    if (!dailyForm.medicine_name || dailyForm.timings.length === 0) {
      setMsg('Please fill medicine name and select at least one timing.');
      setMsgType('error');
      setLoading(false);
      return;
    }

    try {
      await api.post('/reminders/daily', dailyForm);
      setMsg('Daily reminder set successfully!');
      setMsgType('success');
      setDailyForm({ medicine_name: '', timings: [] });
    } catch (err: any) {
      console.error(err);
      const errorDetail = err.response?.data?.detail || 'Failed to set reminder. Are you logged in?';
      setMsg(errorDetail);
      setMsgType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefillSubmit = async () => {
    setLoading(true);
    setMsg('');

    if (!refillForm.medicine_name) {
      setMsg('Please enter medicine name.');
      setMsgType('error');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        medicine_name: refillForm.medicine_name,
        initial_quantity: parseInt(refillForm.initial_quantity) || 10,
        frequency_per_day: parseInt(refillForm.frequency_per_day) || 1,
      };

      const response = await api.post('/reminders/refill', payload);
      const dateStr = response.data.refill_date
        ? new Date(response.data.refill_date).toLocaleDateString()
        : 'soon';

      setMsg(`Refill reminder set! Next refill date: ${dateStr}`);
      setMsgType('success');
      setRefillForm({ medicine_name: '', initial_quantity: '10', frequency_per_day: '1' });
    } catch (err: any) {
      console.error(err);
      const errorDetail = err.response?.data?.detail || 'Failed to set refill reminder.';
      setMsg(errorDetail);
      setMsgType('error');
    } finally {
      setLoading(false);
    }
  };

  const timings: TimingType[] = ['morning', 'afternoon', 'evening'];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Medicine Reminders</Text>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'daily' && styles.activeTab]}
            onPress={() => setActiveTab('daily')}
          >
            <Ionicons
              name="time-outline"
              size={18}
              color={activeTab === 'daily' ? COLORS.white : COLORS.primary}
            />
            <Text style={[styles.tabText, activeTab === 'daily' && styles.activeTabText]}>
              Daily Intake
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'refill' && styles.activeTab]}
            onPress={() => setActiveTab('refill')}
          >
            <Ionicons
              name="refresh-outline"
              size={18}
              color={activeTab === 'refill' ? COLORS.white : COLORS.primary}
            />
            <Text style={[styles.tabText, activeTab === 'refill' && styles.activeTabText]}>
              Refill Tracker
            </Text>
          </TouchableOpacity>
        </View>

        {/* Status Message */}
        {msg ? (
          <View style={[styles.msgContainer, msgType === 'error' ? styles.errorBg : styles.successBg]}>
            <Ionicons
              name={msgType === 'error' ? 'close-circle' : 'checkmark-circle'}
              size={20}
              color={msgType === 'error' ? COLORS.error : COLORS.success}
            />
            <Text style={[styles.msgText, msgType === 'error' ? styles.errorText : styles.successText]}>
              {msg}
            </Text>
          </View>
        ) : null}

        {/* Daily Form */}
        {activeTab === 'daily' && (
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Medicine Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Paracetamol"
                placeholderTextColor={COLORS.textMuted}
                value={dailyForm.medicine_name}
                onChangeText={(text) => setDailyForm({ ...dailyForm, medicine_name: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Select Timings</Text>
              <View style={styles.checkboxGroup}>
                {timings.map((timing) => (
                  <TouchableOpacity
                    key={timing}
                    style={[
                      styles.checkbox,
                      dailyForm.timings.includes(timing) && styles.checkboxSelected,
                    ]}
                    onPress={() => handleTimingChange(timing)}
                  >
                    <Ionicons
                      name={dailyForm.timings.includes(timing) ? 'checkbox' : 'square-outline'}
                      size={22}
                      color={dailyForm.timings.includes(timing) ? COLORS.primary : COLORS.textSecondary}
                    />
                    <Text
                      style={[
                        styles.checkboxLabel,
                        dailyForm.timings.includes(timing) && styles.checkboxLabelSelected,
                      ]}
                    >
                      {timing.charAt(0).toUpperCase() + timing.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.buttonDisabled]}
              onPress={handleDailySubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Ionicons name="alarm-outline" size={20} color={COLORS.white} />
                  <Text style={styles.submitButtonText}>Set Daily Reminder</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Refill Form */}
        {activeTab === 'refill' && (
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Medicine Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Metformin"
                placeholderTextColor={COLORS.textMuted}
                value={refillForm.medicine_name}
                onChangeText={(text) => setRefillForm({ ...refillForm, medicine_name: text })}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Current Quantity</Text>
                <TextInput
                  style={styles.input}
                  placeholder="10"
                  placeholderTextColor={COLORS.textMuted}
                  value={refillForm.initial_quantity}
                  onChangeText={(text) => setRefillForm({ ...refillForm, initial_quantity: text })}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Daily Frequency</Text>
                <TextInput
                  style={styles.input}
                  placeholder="1"
                  placeholderTextColor={COLORS.textMuted}
                  value={refillForm.frequency_per_day}
                  onChangeText={(text) => setRefillForm({ ...refillForm, frequency_per_day: text })}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.buttonDisabled]}
              onPress={handleRefillSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Ionicons name="calculator-outline" size={20} color={COLORS.white} />
                  <Text style={styles.submitButtonText}>Set Refill Reminder</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: moderateScale(SIZES.padding),
  },
  title: {
    fontSize: moderateScale(SIZES.h2),
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: moderateScale(20),
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: moderateScale(12),
    marginBottom: moderateScale(20),
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: moderateScale(12),
    borderRadius: SIZES.radius / 2,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: 'transparent',
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    color: COLORS.primary,
    fontSize: moderateScale(SIZES.small),
    fontWeight: '500',
  },
  activeTabText: {
    color: COLORS.white,
  },
  msgContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: moderateScale(12),
    borderRadius: SIZES.radius / 2,
    marginBottom: moderateScale(16),
  },
  errorBg: {
    backgroundColor: 'rgba(255, 123, 114, 0.1)',
  },
  successBg: {
    backgroundColor: 'rgba(63, 185, 80, 0.1)',
  },
  msgText: {
    flex: 1,
    fontSize: moderateScale(SIZES.small),
  },
  errorText: {
    color: COLORS.error,
  },
  successText: {
    color: COLORS.success,
  },
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: moderateScale(SIZES.padding),
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputGroup: {
    marginBottom: moderateScale(16),
  },
  label: {
    fontSize: moderateScale(SIZES.small),
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: moderateScale(8),
  },
  input: {
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius / 2,
    padding: moderateScale(14),
    fontSize: moderateScale(SIZES.body),
    color: COLORS.text,
  },
  row: {
    flexDirection: 'row',
  },
  checkboxGroup: {
    gap: moderateScale(10),
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: moderateScale(8),
  },
  checkboxSelected: {},
  checkboxLabel: {
    fontSize: moderateScale(SIZES.body),
    color: COLORS.textSecondary,
  },
  checkboxLabelSelected: {
    color: COLORS.text,
    fontWeight: '500',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius / 2,
    padding: moderateScale(16),
    marginTop: moderateScale(8),
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: moderateScale(SIZES.body),
    fontWeight: '600',
  },
});
