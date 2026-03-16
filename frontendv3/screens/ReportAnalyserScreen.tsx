import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import Markdown from 'react-native-markdown-display';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { COLORS, SIZES, moderateScale } from '../constants/theme';

type StatusType = 'idle' | 'uploading' | 'analyzing' | 'completed' | 'error';

interface AnalysisResult {
  simple_summary: string;
  vital_indicators?: Array<{ Indicator: string; Value: string }>;
  structured_entities?: Array<{ Description: string; Confidence: number }>;
}

export default function ReportAnalyserScreen() {
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [status, setStatus] = useState<StatusType>('idle');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setSelectedFile(file);
        setErrorMsg('');
        setStatus('idle');
        setAnalysisResult(null);
      }
    } catch (err) {
      console.error('File pick error:', err);
      setErrorMsg('Failed to pick file.');
    }
  };

  const pollTaskStatus = (taskId: string) => {
    const intervalId = setInterval(async () => {
      try {
        const response = await api.get(`/reports/status/${taskId}`);
        const taskState = response.data.status;

        if (taskState === 'SUCCESS') {
          clearInterval(intervalId);
          setAnalysisResult(response.data.result);
          setStatus('completed');
        } else if (taskState === 'FAILURE') {
          clearInterval(intervalId);
          setErrorMsg('Analysis failed. ' + (response.data.error || 'Unknown error'));
          setStatus('error');
        }
      } catch (err) {
        clearInterval(intervalId);
        console.error('Polling Error:', err);
        setErrorMsg('Lost connection to server while checking status.');
        setStatus('error');
      }
    }, 2000);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setStatus('uploading');
    setErrorMsg('');

    try {
      const fileUri = selectedFile.uri;
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      
      if (!fileInfo.exists) {
        throw new Error('File not found');
      }

      const formData = new FormData();
      formData.append('file', {
        uri: fileUri,
        name: selectedFile.name,
        type: 'application/pdf',
      } as any);

      const response = await api.post('/reports/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setStatus('analyzing');
      pollTaskStatus(response.data.task_id);
    } catch (err: any) {
      console.error('Upload Error:', err);
      setStatus('error');
      setErrorMsg(err.response?.data?.detail || 'Failed to upload.');
    }
  };

  // Filter logic for cleaned data
  const rawData =
    analysisResult?.vital_indicators && analysisResult.vital_indicators.length > 0
      ? analysisResult.vital_indicators
      : analysisResult?.structured_entities || [];

  const hasVitals = analysisResult?.vital_indicators && analysisResult.vital_indicators.length > 0;

  const cleanedData = rawData.filter((item: any) => {
    const label = hasVitals ? item.Indicator : item.Description;
    if (!label) return false;
    const lowerLabel = label.toLowerCase();
    const junkWords = ['qr code', 'scanner', 'page', 'result', 'visit', 'date', 'generated', 'unit'];
    if (junkWords.some((word) => lowerLabel.includes(word))) return false;
    if (!isNaN(parseFloat(label)) && isFinite(Number(label))) return false;
    return true;
  });

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Report Analyser</Text>
        <Text style={styles.subtitle}>Upload your medical report (PDF) to get a simplified AI summary.</Text>

        {/* Upload Section */}
        <View style={styles.uploadSection}>
          <TouchableOpacity
            style={styles.filePickerButton}
            onPress={handleFilePick}
            disabled={status === 'uploading' || status === 'analyzing'}
          >
            <Ionicons name="document-outline" size={24} color={COLORS.primary} />
            <Text style={styles.filePickerText}>
              {selectedFile ? selectedFile.name : 'Select PDF File'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.uploadButton,
              (!selectedFile || status === 'uploading' || status === 'analyzing') && styles.buttonDisabled,
            ]}
            onPress={handleUpload}
            disabled={!selectedFile || status === 'uploading' || status === 'analyzing'}
          >
            {status === 'uploading' || status === 'analyzing' ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={20} color={COLORS.white} />
                <Text style={styles.uploadButtonText}>Analyze Report</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Analyzing Status */}
        {status === 'analyzing' && (
          <View style={styles.statusCard}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.statusTitle}>Analyzing your report...</Text>
            <Text style={styles.statusSubtitle}>
              We are extracting text, identifying medical entities, and generating a summary.
            </Text>
          </View>
        )}

        {/* Error Message */}
        {errorMsg ? (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={24} color={COLORS.error} />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* Results */}
        {status === 'completed' && analysisResult && (
          <View style={styles.resultsContainer}>
            {/* Summary Card */}
            <View style={styles.summaryCard}>
              <View style={styles.cardHeader}>
                <Ionicons name="sparkles" size={20} color={COLORS.primary} />
                <Text style={styles.cardTitle}>AI Summary</Text>
              </View>
              <Markdown
                style={{
                  body: {
                    color: COLORS.text,
                    fontSize: moderateScale(SIZES.small),
                    lineHeight: moderateScale(22),
                  },
                  strong: { fontWeight: '700' },
                  paragraph: { marginVertical: 4 },
                }}
              >
                {analysisResult.simple_summary}
              </Markdown>
            </View>

            {/* Entities Card */}
            <View style={styles.entitiesCard}>
              <View style={styles.cardHeader}>
                <Ionicons name="search" size={20} color={COLORS.primary} />
                <Text style={styles.cardTitle}>Extracted Medical Details</Text>
              </View>

              {cleanedData.length > 0 ? (
                <View style={styles.table}>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderText, { flex: 1 }]}>
                      {hasVitals ? 'Medical Indicator' : 'Detected Entity'}
                    </Text>
                    <Text style={[styles.tableHeaderText, { flex: 1 }]}>
                      {hasVitals ? 'Measured Value' : 'Confidence'}
                    </Text>
                  </View>
                  {cleanedData.map((item: any, idx: number) => (
                    <View key={idx} style={styles.tableRow}>
                      {hasVitals ? (
                        <>
                          <Text style={[styles.tableCell, styles.indicatorCell]}>{item.Indicator}</Text>
                          <Text style={[styles.tableCell, styles.valueCell]}>{item.Value}</Text>
                        </>
                      ) : (
                        <>
                          <Text style={[styles.tableCell, { flex: 1 }]}>{item.Description}</Text>
                          <Text style={[styles.tableCell, styles.confidenceCell]}>
                            {(item.Confidence * 100).toFixed(0)}%
                          </Text>
                        </>
                      )}
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.noDataText}>No specific entities detected.</Text>
              )}
            </View>
          </View>
        )}

        {/* Idle Info */}
        {status === 'idle' && (
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Privacy & Tips</Text>
            <View style={styles.infoItem}>
              <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.primary} />
              <Text style={styles.infoText}>Your report is processed securely using our Healthcare AI pipeline.</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="document-outline" size={18} color={COLORS.primary} />
              <Text style={styles.infoText}>We only accept PDF files currently.</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="medkit-outline" size={18} color={COLORS.primary} />
              <Text style={styles.infoText}>Results are for informational purposes only. Always consult a doctor.</Text>
            </View>
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
    marginBottom: moderateScale(8),
  },
  subtitle: {
    fontSize: moderateScale(SIZES.small),
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: moderateScale(24),
  },
  uploadSection: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: moderateScale(SIZES.padding),
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: moderateScale(20),
  },
  filePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: moderateScale(20),
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    borderRadius: SIZES.radius / 2,
    marginBottom: moderateScale(12),
  },
  filePickerText: {
    color: COLORS.text,
    fontSize: moderateScale(SIZES.body),
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius / 2,
    padding: moderateScale(16),
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  uploadButtonText: {
    color: COLORS.white,
    fontSize: moderateScale(SIZES.body),
    fontWeight: '600',
  },
  statusCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: moderateScale(24),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: moderateScale(20),
  },
  statusTitle: {
    fontSize: moderateScale(SIZES.h4),
    fontWeight: '600',
    color: COLORS.text,
    marginTop: moderateScale(16),
    marginBottom: moderateScale(8),
  },
  statusSubtitle: {
    fontSize: moderateScale(SIZES.small),
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 123, 114, 0.1)',
    borderRadius: SIZES.radius / 2,
    padding: moderateScale(14),
    marginBottom: moderateScale(20),
  },
  errorText: {
    flex: 1,
    color: COLORS.error,
    fontSize: moderateScale(SIZES.small),
  },
  resultsContainer: {
    gap: moderateScale(16),
  },
  summaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: moderateScale(SIZES.padding),
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: moderateScale(12),
  },
  cardTitle: {
    fontSize: moderateScale(SIZES.h4),
    fontWeight: '600',
    color: COLORS.text,
  },
  entitiesCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: moderateScale(SIZES.padding),
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  table: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius / 2,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceLight,
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tableHeaderText: {
    fontSize: moderateScale(SIZES.small),
    fontWeight: '600',
    color: COLORS.text,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tableCell: {
    fontSize: moderateScale(SIZES.small),
    color: COLORS.text,
  },
  indicatorCell: {
    flex: 1,
    fontWeight: '600',
  },
  valueCell: {
    flex: 1,
    color: COLORS.primary,
  },
  confidenceCell: {
    flex: 1,
    color: COLORS.textSecondary,
  },
  noDataText: {
    color: COLORS.textSecondary,
    fontSize: moderateScale(SIZES.small),
    textAlign: 'center',
    paddingVertical: moderateScale(16),
  },
  infoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: moderateScale(SIZES.padding),
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoTitle: {
    fontSize: moderateScale(SIZES.h4),
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: moderateScale(16),
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: moderateScale(12),
  },
  infoText: {
    flex: 1,
    fontSize: moderateScale(SIZES.small),
    color: COLORS.textSecondary,
    lineHeight: moderateScale(20),
  },
});
