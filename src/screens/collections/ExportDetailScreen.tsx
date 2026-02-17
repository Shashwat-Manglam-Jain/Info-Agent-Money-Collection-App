import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';

import { useApp } from '../../appState/AppProvider';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { Icon } from '../../components/Icon';
import { PopupModal, type PopupAction } from '../../components/PopupModal';
import { ScrollScreen } from '../../components/Screen';
import { SectionHeader } from '../../components/SectionHeader';
import { Skeleton } from '../../components/Skeleton';
import type { RootStackParamList } from '../../navigation/types';
import { getErrorMessage } from '../../utils/errors';
import { paiseToRupees, rupeesToPaise } from '../../utils/money';
import { useTheme } from '../../theme';
import type { Theme } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ExportDetail'>;

type ExportView = {
  fileType: 'PDF' | 'TXT' | 'EXCEL' | 'JSON' | 'UNKNOWN';
  exportedAt: string | null;
  societyName: string;
  agentName: string;
  agentCode: string;
  lotLabel: string | null;
  collections: Array<{
    id: string;
    accountNo: string;
    clientName: string;
    collectedPaise: number;
    collectionDate: string;
    remarks: string | null;
  }>;
};

function formatTimestamp(iso: string | null): string {
  if (!iso) return '—';
  return iso.replace('T', ' ').replace('Z', '');
}

function parseAgentLine(line: string): { agentCode: string; agentName: string } {
  const raw = line.replace(/^Agent:\s*/i, '').trim();
  const match = raw.match(/(\d+)\s*-?\s*(.+)$/);
  if (match) {
    return { agentCode: match[1].trim(), agentName: match[2].trim() };
  }
  return { agentCode: '', agentName: raw };
}

function parseExportFileName(name: string): {
  societyCode: string | null;
  agentCode: string | null;
  dateISO: string | null;
  timeISO: string | null;
  lotCode: string | null;
  extension: string | null;
} {
  const match = name.match(/IAMC_([^_]+)_([^_]+)_(.+)_(\d{8})_(\d{6})(?:_(\d{3}))?Z\.(json|xlsx|xls|txt|pdf)$/i);
  if (!match) {
    return { societyCode: null, agentCode: null, dateISO: null, timeISO: null, lotCode: null, extension: null };
  }
  const [, societyCode, agentCode, lotCode, datePart, timePart, , extension] = match;
  const yyyy = datePart.slice(0, 4);
  const mm = datePart.slice(4, 6);
  const dd = datePart.slice(6, 8);
  const dateISO = `${yyyy}-${mm}-${dd}`;
  const timeISO = `${timePart.slice(0, 2)}:${timePart.slice(2, 4)}:${timePart.slice(4, 6)}`;
  return { societyCode, agentCode, dateISO, timeISO, lotCode, extension: extension.toLowerCase() };
}

function buildDefaults(fileType: ExportView['fileType']): ExportView {
  return {
    fileType,
    exportedAt: null,
    societyName: '—',
    agentName: '—',
    agentCode: '—',
    lotLabel: null,
    collections: [],
  };
}

async function parseExportFile(fileUri: string, fileName: string): Promise<ExportView> {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.pdf')) {
    const view = buildDefaults('PDF');
    const meta = parseExportFileName(fileName);
    if (meta.dateISO && meta.timeISO) {
      view.exportedAt = `${meta.dateISO}T${meta.timeISO}Z`;
    }
    if (meta.lotCode) view.lotLabel = meta.lotCode;
    return view;
  }

  if (lower.endsWith('.json')) {
    const text = await new File(fileUri).text();
    const payload = JSON.parse(text) as any;
    const view = buildDefaults('JSON');
    view.exportedAt = payload.exportedAt ?? null;
    view.societyName = payload.society?.name ?? '—';
    view.agentName = payload.agent?.name ?? '—';
    view.agentCode = payload.agent?.code ?? '—';
    view.collections = Array.isArray(payload.collections)
      ? payload.collections.map((c: any, idx: number) => ({
          id: c.id ?? `${fileName}-${idx}`,
          accountNo: String(c.accountNo ?? ''),
          clientName: String(c.clientName ?? ''),
          collectedPaise: Number(c.collectedPaise ?? 0),
          collectionDate: String(c.collectionDate ?? ''),
          remarks: c.remarks ?? null,
        }))
      : [];
    return view;
  }

  if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
    const base64 = await new File(fileUri).base64();
    const workbook = XLSX.read(base64, { type: 'base64' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, raw: false, blankrows: false });
    const view = buildDefaults('EXCEL');
    let headerIndex = -1;

    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i] || [];
      const first = String(row[0] ?? '').trim();
      if (!first) continue;
      if (/^society:/i.test(first)) view.societyName = first.replace(/^society:/i, '').trim();
      if (/^agent:/i.test(first)) {
        const parsed = parseAgentLine(first);
        view.agentName = parsed.agentName || view.agentName;
        view.agentCode = parsed.agentCode || view.agentCode;
      }
      if (/^exported at:/i.test(first)) view.exportedAt = first.replace(/^exported at:/i, '').trim();
      if (/^lot:/i.test(first)) view.lotLabel = first.replace(/^lot:/i, '').trim();
      if (/account\s*no/i.test(first)) {
        headerIndex = i;
        break;
      }
    }

    if (headerIndex >= 0) {
      for (let i = headerIndex + 1; i < rows.length; i += 1) {
        const row = rows[i] || [];
        const accountNo = String(row[0] ?? '').trim();
        if (!accountNo) break;
        const clientName = String(row[1] ?? '').trim();
        const amountRaw = String(row[6] ?? '').trim();
        const collectionDate = String(row[8] ?? '').trim();
        const remarks = String(row[9] ?? '').trim();
        const amount = Number(amountRaw.replace(/,/g, ''));
        view.collections.push({
          id: `${fileName}-${i}`,
          accountNo,
          clientName,
          collectedPaise: rupeesToPaise(Number.isFinite(amount) ? amount : 0),
          collectionDate,
          remarks: remarks || null,
        });
      }
    }

    return view;
  }

  if (lower.endsWith('.txt')) {
    const text = await new File(fileUri).text();
    const lines = text.split(/\r?\n/).filter((line) => line.trim());
    const view = buildDefaults('TXT');
    let headerIndex = -1;

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      if (/^society:/i.test(line)) view.societyName = line.replace(/^society:/i, '').trim();
      if (/^agent:/i.test(line)) {
        const parsed = parseAgentLine(line);
        view.agentName = parsed.agentName || view.agentName;
        view.agentCode = parsed.agentCode || view.agentCode;
      }
      if (/^exported at:/i.test(line)) view.exportedAt = line.replace(/^exported at:/i, '').trim();
      if (/^lot:/i.test(line)) view.lotLabel = line.replace(/^lot:/i, '').trim();
      if (/account\s*no/i.test(line)) {
        headerIndex = i;
        break;
      }
    }

    if (headerIndex >= 0) {
      for (let i = headerIndex + 1; i < lines.length; i += 1) {
        const row = lines[i].split('\t');
        const accountNo = (row[0] ?? '').trim();
        if (!accountNo) break;
        const clientName = (row[1] ?? '').trim();
        const amountRaw = (row[6] ?? '').trim();
        const collectionDate = (row[8] ?? '').trim();
        const remarks = (row[9] ?? '').trim();
        const amount = Number(amountRaw.replace(/,/g, ''));
        view.collections.push({
          id: `${fileName}-${i}`,
          accountNo,
          clientName,
          collectedPaise: rupeesToPaise(Number.isFinite(amount) ? amount : 0),
          collectionDate,
          remarks: remarks || null,
        });
      }
    }

    return view;
  }

  return buildDefaults('UNKNOWN');
}

export function ExportDetailScreen({ navigation, route }: Props) {
  const { society, agent } = useApp();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { fileUri, fileName, exportedAtISO, lotCode, collectionsCount } = route.params;
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<ExportView | null>(null);
  const [popup, setPopup] = useState<{ title: string; message?: string; actions?: PopupAction[] } | null>(null);

  const closePopup = () => setPopup(null);
  const showMessage = (title: string, message?: string) => {
    setPopup({
      title,
      message,
      actions: [{ label: 'OK', onPress: closePopup }],
    });
  };

  useEffect(() => {
    navigation.setOptions({ title: 'Export Details' });
    (async () => {
      setLoading(true);
      try {
        const parsed = await parseExportFile(fileUri, fileName);
        const normalized: ExportView = {
          ...parsed,
          exportedAt: parsed.exportedAt ?? exportedAtISO ?? null,
          lotLabel: parsed.lotLabel ?? lotCode ?? null,
          societyName: parsed.societyName === '—' ? (society?.name ?? '—') : parsed.societyName,
          agentName: parsed.agentName === '—' ? (agent?.name ?? '—') : parsed.agentName,
          agentCode: parsed.agentCode === '—' ? (agent?.code ?? '—') : parsed.agentCode,
        };
        setDetail(normalized);
      } catch (e: unknown) {
        showMessage('Open failed', getErrorMessage(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [agent, exportedAtISO, fileName, fileUri, lotCode, navigation, society]);

  const shareFile = useCallback(async () => {
    try {
      if (!(await Sharing.isAvailableAsync())) {
        showMessage('Share not available', 'Sharing is not available on this device.');
        return;
      }
      await Sharing.shareAsync(fileUri);
    } catch (e: unknown) {
      showMessage('Share failed', getErrorMessage(e));
    }
  }, [fileUri]);

  const deleteFile = useCallback(() => {
    setPopup({
      title: 'Delete export file?',
      message: `This will remove the file from history on this device.\n\n${fileName}`,
      actions: [
        { label: 'Cancel', variant: 'ghost', onPress: closePopup },
        {
          label: 'Delete',
          variant: 'danger',
          onPress: () => {
            closePopup();
            try {
              const file = new File(fileUri);
              if (file.exists) {
                file.delete();
              }
              navigation.goBack();
            } catch (e: unknown) {
              showMessage('Delete failed', getErrorMessage(e));
            }
          },
        },
      ],
    });
  }, [fileName, fileUri, navigation]);

  if (loading) {
    return (
      <ScrollScreen>
        <Card>
          <View style={{ gap: 10 }}>
            <Skeleton height={20} width="70%" />
            <Skeleton height={14} width="55%" />
            <Skeleton height={14} width="80%" />
            <Skeleton height={14} width="60%" />
          </View>
        </Card>
      </ScrollScreen>
    );
  }

  const fileMeta = parseExportFileName(fileName);
  const fileType = detail?.fileType ?? (fileMeta.extension?.toUpperCase() as ExportView['fileType'] | undefined) ?? 'UNKNOWN';
  const collectionsTotal = detail?.collections.length ?? 0;
  const displayCollections = collectionsTotal > 0 ? collectionsTotal : (collectionsCount ?? 0);
  const displayTime = formatTimestamp(detail?.exportedAt ?? exportedAtISO ?? null);
  const displaySociety = detail?.societyName ?? society?.name ?? '—';
  const displayAgent = `${detail?.agentCode ?? agent?.code ?? '—'} • ${detail?.agentName ?? agent?.name ?? '—'}`;
  const displayLot = detail?.lotLabel ?? lotCode ?? '—';

  return (
    <ScrollScreen>
      <Card>
        <SectionHeader
          title="Export File"
          subtitle={fileName}
          icon={fileType === 'PDF' ? 'document-outline' : 'document-text-outline'}
        />
        <View style={{ height: 10 }} />
        <View style={styles.metaGrid}>
          <View style={styles.metaTile}>
            <Text style={styles.metaLabel}>Format</Text>
            <Text style={styles.metaValue}>{fileType}</Text>
          </View>
          <View style={styles.metaTile}>
            <Text style={styles.metaLabel}>Collections</Text>
            <Text style={styles.metaValue}>{displayCollections}</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <View style={styles.infoIconWrap}>
            <Icon name="time-outline" size={14} color={theme.colors.primary} />
          </View>
          <Text style={styles.infoText}>Exported at: {displayTime}</Text>
        </View>
        <View style={styles.infoRow}>
          <View style={styles.infoIconWrap}>
            <Icon name="business-outline" size={14} color={theme.colors.primary} />
          </View>
          <Text style={styles.infoText}>Society: {displaySociety}</Text>
        </View>
        <View style={styles.infoRow}>
          <View style={styles.infoIconWrap}>
            <Icon name="person-outline" size={14} color={theme.colors.primary} />
          </View>
          <Text style={styles.infoText}>Agent: {displayAgent}</Text>
        </View>
        <View style={styles.infoRow}>
          <View style={styles.infoIconWrap}>
            <Icon name="layers-outline" size={14} color={theme.colors.primary} />
          </View>
          <Text style={styles.infoText}>Lot: {displayLot}</Text>
        </View>
        <View style={{ height: 12 }} />
        <View style={styles.actionWrap}>
          <Button title="Share Export File" variant="secondary" iconLeft="share-outline" onPress={shareFile} />
          <Button title="Delete File" variant="danger" iconLeft="trash-outline" onPress={deleteFile} />
        </View>
      </Card>

      <Card>
        <SectionHeader
          title="Collections"
          subtitle={fileType === 'PDF' ? 'PDF shows summary and file details.' : 'Rows parsed from export file.'}
          icon="list-outline"
        />
        <View style={{ height: 10 }} />
        {fileType === 'PDF' ? (
          <EmptyState
            icon="document-outline"
            title="PDF preview not parsed"
            message="PDF details are shown above. Use Share to open the PDF file."
          />
        ) : !detail || detail.collections.length === 0 ? (
          <EmptyState icon="cloud-offline-outline" title="No rows found" message="This file has no readable collection rows." />
        ) : (
          <FlatList
            data={detail.collections}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{item.accountNo} • {item.clientName}</Text>
                  <Text style={styles.rowSub}>Date: {item.collectionDate}</Text>
                  {item.remarks ? <Text style={styles.rowSub}>Remarks: {item.remarks}</Text> : null}
                </View>
                <Text style={styles.rowAmount}>₹{paiseToRupees(item.collectedPaise).toFixed(2)}</Text>
              </View>
            )}
          />
        )}
      </Card>

      <PopupModal
        visible={!!popup}
        title={popup?.title ?? ''}
        message={popup?.message}
        actions={popup?.actions}
        onDismiss={closePopup}
      />
    </ScrollScreen>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    sep: { height: 1, backgroundColor: theme.colors.border },
    metaGrid: { flexDirection: 'row', gap: 10 },
    metaTile: {
      flex: 1,
      paddingVertical: 9,
      paddingHorizontal: 10,
      borderRadius: theme.radii.sm + 2,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.primarySoft,
    },
    metaLabel: { fontSize: 11, color: theme.colors.muted, fontWeight: '700' },
    metaValue: { marginTop: 1, fontSize: 15, color: theme.colors.text, fontWeight: '900' },
    infoRow: { marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
    infoIconWrap: {
      width: 24,
      height: 24,
      borderRadius: theme.radii.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primarySoft,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    infoText: { flex: 1, fontSize: 13, color: theme.colors.text, lineHeight: 18, fontWeight: '700' },
    actionWrap: { gap: 8 },
    row: { paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
    rowTitle: { fontSize: 14, fontWeight: '800', color: theme.colors.text, lineHeight: 18 },
    rowSub: { fontSize: 12, color: theme.colors.muted, marginTop: 2, lineHeight: 17 },
    rowAmount: { fontSize: 14, fontWeight: '900', color: theme.colors.text },
  });
