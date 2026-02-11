import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';

import { useApp } from '../../app/AppProvider';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { PopupModal, type PopupAction } from '../../components/PopupModal';
import { ScrollScreen } from '../../components/Screen';
import { SectionHeader } from '../../components/SectionHeader';
import { listExportsForDate } from '../../db/repo';
import type { ExportRecord } from '../../models/types';
import { getErrorMessage } from '../../utils/errors';
import { paiseToRupees, rupeesToPaise } from '../../utils/money';
import { useTheme } from '../../theme';
import type { Theme } from '../../theme';

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

type DeviceFile = {
  uri: string;
  name: string;
  dateISO: string | null;
  exportedAtISO: string | null;
  collectionsCount: number | null;
  lotCode: string | null;
};

type HistoryItem = {
  key: string;
  fileUri: string | null;
  fileName: string;
  displayTitle: string;
  displaySub: string;
  dateISO: string | null;
  exportedAtISO: string | null;
  lotCode: string | null;
};

type ExportView = {
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

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function buildISODate(year: number, monthIndex: number, day: number): string {
  return `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;
}

function formatTimestamp(iso: string | null): string {
  if (!iso) return '—';
  return iso.replace('T', ' ').replace('Z', '');
}

function fileNameFromUri(uri: string | null): string {
  if (!uri) return '—';
  const parts = uri.split('/');
  return parts[parts.length - 1] || uri;
}

function parseExportFileName(name: string): {
  dateISO: string | null;
  timeISO: string | null;
  lotCode: string | null;
  extension: string | null;
} {
  const match = name.match(/IAMC_[^_]+_[^_]+_([^_]+)_(\d{8})_(\d{6})Z\.(json|xlsx|xls|txt)$/i);
  if (!match) return { dateISO: null, timeISO: null, lotCode: null, extension: null };
  const [, lotCode, datePart, timePart, extension] = match;
  const yyyy = datePart.slice(0, 4);
  const mm = datePart.slice(4, 6);
  const dd = datePart.slice(6, 8);
  const dateISO = `${yyyy}-${mm}-${dd}`;
  const timeISO = `${timePart.slice(0, 2)}:${timePart.slice(2, 4)}:${timePart.slice(4, 6)}`;
  return { dateISO, timeISO, lotCode, extension };
}

function buildTitle(dateISO: string | null, timeISO: string | null, lotCode: string | null): string {
  const lot = lotCode ? `Lot ${lotCode}` : 'Export';
  if (!dateISO) return lot;
  if (!timeISO) return `${lot} • ${dateISO}`;
  return `${lot} • ${dateISO} ${timeISO}`;
}

function parseAgentLine(line: string): { agentCode: string; agentName: string } {
  const raw = line.replace(/^Agent:\s*/i, '').trim();
  const match = raw.match(/(\d{4,})\s*-?\s*(.+)$/);
  if (match) {
    return { agentCode: match[1].trim(), agentName: match[2].trim() };
  }
  return { agentCode: '', agentName: raw };
}

function buildExportViewDefaults(): ExportView {
  return {
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
  if (lower.endsWith('.json')) {
    const text = await new File(fileUri).text();
    const payload = JSON.parse(text) as any;
    const view = buildExportViewDefaults();
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
    const view = buildExportViewDefaults();
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
    const view = buildExportViewDefaults();
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

  throw new Error('Unsupported file type');
}

export function ReportsScreen() {
  const { db, agent } = useApp();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const today = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
  }, []);
  const [selectedDate, setSelectedDate] = useState(today);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [dataDates, setDataDates] = useState<Set<string>>(new Set());
  const [exportRecords, setExportRecords] = useState<ExportRecord[]>([]);
  const [deviceFiles, setDeviceFiles] = useState<DeviceFile[]>([]);
  const [exportDetail, setExportDetail] = useState<ExportView | null>(null);
  const [exportDetailSource, setExportDetailSource] = useState<{ fileUri: string; fileName: string } | null>(null);
  const [exportLoadingKey, setExportLoadingKey] = useState<string | null>(null);
  const [popup, setPopup] = useState<{ title: string; message?: string; actions?: PopupAction[] } | null>(null);
  const exportDir = useMemo(() => new Directory(Paths.document, 'exports'), []);

  const closePopup = useCallback(() => setPopup(null), []);

  const showMessage = useCallback((title: string, message?: string) => {
    setPopup({
      title,
      message,
      actions: [{ label: 'OK', onPress: closePopup }],
    });
  }, [closePopup]);

  const monthLabel = useMemo(() => {
    const month = currentMonth.getMonth();
    const year = currentMonth.getFullYear();
    return `${monthNames[month]} ${year}`;
  }, [currentMonth]);

  const calendarCells = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: Array<{ key: string; day?: number; iso?: string }> = [];

    for (let i = 0; i < firstDay; i += 1) {
      cells.push({ key: `empty-${i}` });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const iso = buildISODate(year, month, day);
      cells.push({ key: iso, day, iso });
    }

    return cells;
  }, [currentMonth]);

  const selectDate = useCallback((iso: string) => {
    setSelectedDate(iso);
    const [yearRaw, monthRaw] = iso.split('-');
    const year = Number(yearRaw);
    const month = Number(monthRaw) - 1;
    if (Number.isFinite(year) && Number.isFinite(month)) {
      setCurrentMonth(new Date(year, month, 1));
    }
  }, []);

  const goMonth = useCallback((delta: number) => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  }, []);

  const goToday = useCallback(() => {
    selectDate(today);
  }, [selectDate, today]);

  const openFile = useCallback(
    async (fileUri: string, fileName: string, key: string) => {
      if (exportDetailSource?.fileUri === fileUri) {
        setExportDetail(null);
        setExportDetailSource(null);
        return;
      }
      setExportLoadingKey(key);
      try {
        const view = await parseExportFile(fileUri, fileName);
        setExportDetail(view);
        setExportDetailSource({ fileUri, fileName });
      } catch (e: unknown) {
        showMessage('Open failed', getErrorMessage(e));
      } finally {
        setExportLoadingKey(null);
      }
    },
    [exportDetailSource, showMessage]
  );

  const shareExport = useCallback(async (source: { fileUri: string } | null) => {
    if (!source?.fileUri) return;
    if (!(await Sharing.isAvailableAsync())) return;
    await Sharing.shareAsync(source.fileUri);
  }, []);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        if (!db || !agent) return;
        const exports = await listExportsForDate({ db, agentId: agent.id, dateISO: selectedDate });

        let files: DeviceFile[] = [];
        try {
          exportDir.create({ intermediates: true, idempotent: true });
          const items = exportDir.list();
          const jsonFiles = items.filter((item) => item instanceof File) as File[];

          files = await Promise.all(
            jsonFiles.map(async (file) => {
              const name = fileNameFromUri(file.uri);
              const meta = parseExportFileName(name);
              let dateISO = meta.dateISO;
              let exportedAtISO: string | null = null;
              let collectionsCount: number | null = null;
              let lotCode: string | null = meta.lotCode;

              if (!dateISO || !lotCode) {
                try {
                  const view = await parseExportFile(file.uri, name);
                  exportedAtISO = view.exportedAt ?? null;
                  dateISO = exportedAtISO ? exportedAtISO.slice(0, 10) : dateISO;
                  collectionsCount = view.collections.length;
                  if (view.lotLabel) lotCode = view.lotLabel;
                } catch {
                  // ignore parse errors
                }
              }

              return {
                uri: file.uri,
                name,
                dateISO,
                exportedAtISO,
                collectionsCount,
                lotCode,
              };
            })
          );

          files.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
        } catch {
          files = [];
        }

        setExportRecords(exports);
        setDeviceFiles(files);

        const dates = new Set<string>();
        for (const file of files) {
          if (file.dateISO) dates.add(file.dateISO);
        }
        setDataDates(dates);
      })();
    }, [agent, db, exportDir, selectedDate])
  );

  const historyItems = useMemo(() => {
    const items: HistoryItem[] = [];
    const seen = new Set<string>();

    for (const record of exportRecords) {
      const name = fileNameFromUri(record.fileUri);
      const meta = parseExportFileName(name);
      const dateISO = meta.dateISO ?? record.exportedAt?.slice(0, 10) ?? null;
      if (dateISO && dateISO !== selectedDate) continue;
      const title = buildTitle(dateISO, meta.timeISO, meta.lotCode);
      const subParts = [name, `${record.collectionsCount} collections`];
      items.push({
        key: record.id,
        fileUri: record.fileUri,
        fileName: name,
        displayTitle: title,
        displaySub: subParts.join(' • '),
        dateISO,
        exportedAtISO: record.exportedAt ?? null,
        lotCode: meta.lotCode,
      });
      if (record.fileUri) seen.add(record.fileUri);
    }

    for (const file of deviceFiles) {
      if (seen.has(file.uri)) continue;
      const dateISO = file.dateISO;
      if (dateISO && dateISO !== selectedDate) continue;
      const title = buildTitle(dateISO, null, file.lotCode);
      const countText = file.collectionsCount != null ? `${file.collectionsCount} collections` : 'Collections: —';
      const subParts = [file.name, countText];
      items.push({
        key: file.uri,
        fileUri: file.uri,
        fileName: file.name,
        displayTitle: title,
        displaySub: subParts.join(' • '),
        dateISO: file.dateISO,
        exportedAtISO: file.exportedAtISO,
        lotCode: file.lotCode,
      });
    }

    return items;
  }, [deviceFiles, exportRecords, selectedDate]);

  return (
    <ScrollScreen>
      <Card>
        <SectionHeader
          title="History Filter"
          subtitle="Select a date to view export history."
          icon="calendar-outline"
        />
        <View style={{ height: 12 }} />
        <View style={styles.calendarHeader}>
          <Pressable onPress={() => goMonth(-1)} style={styles.monthNav}>
            <Text style={styles.monthNavText}>‹</Text>
          </Pressable>
          <Text style={styles.monthLabel}>{monthLabel}</Text>
          <Pressable onPress={() => goMonth(1)} style={styles.monthNav}>
            <Text style={styles.monthNavText}>›</Text>
          </Pressable>
        </View>
        <View style={styles.weekRow}>
          {weekDays.map((d, idx) => (
            <Text key={`${d}-${idx}`} style={styles.weekDay}>
              {d}
            </Text>
          ))}
        </View>
        <View style={styles.calendarGrid}>
          {calendarCells.map((cell) => {
            if (!cell.day || !cell.iso) {
              return <View key={cell.key} style={styles.dayCell} />;
            }
            const hasData = dataDates.has(cell.iso);
            const isSelected = cell.iso === selectedDate;
            const isToday = cell.iso === today;
            return (
              <View key={cell.key} style={styles.dayCell}>
                <Pressable
                  onPress={() => selectDate(cell.iso!)}
                  style={[
                    styles.dayButton,
                    hasData && styles.dayHasData,
                    isSelected && styles.daySelected,
                    isToday && styles.dayToday,
                  ]}
                >
                  <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>{cell.day}</Text>
                </Pressable>
                <View style={[styles.dot, hasData && styles.dotActive]} />
              </View>
            );
          })}
        </View>
        <View style={styles.calendarLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.dot, styles.dotActive]} />
            <Text style={styles.legendText}>Has data</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, styles.legendSelected]} />
            <Text style={styles.legendText}>Selected</Text>
          </View>
          <Button title="Today" variant="secondary" onPress={goToday} iconLeft="today-outline" />
        </View>
      </Card>

      <Card>
        <SectionHeader
          title={`History (${selectedDate})`}
          subtitle="Exports saved on this device. Tap to view details."
          icon="cloud-upload-outline"
        />
        <View style={{ height: 10 }} />
        {historyItems.length === 0 ? (
          <EmptyState icon="cloud-offline-outline" title="No history" message="No export files found for this date." />
        ) : (
          <FlatList
            data={historyItems}
            keyExtractor={(item) => item.key}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
            renderItem={({ item }) => (
              <Pressable
                onPress={() =>
                  item.fileUri
                    ? openFile(item.fileUri, item.fileName, item.key)
                    : showMessage('File not available', 'This export does not have a file path.')
                }
                style={styles.rowPress}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{item.displayTitle}</Text>
                  <Text style={styles.rowSub}>{item.displaySub}</Text>
                </View>
                <View style={styles.viewChip}>
                  <Text style={styles.viewChipText}>
                    {exportLoadingKey === item.key ? 'Loading…' : 'View'}
                  </Text>
                </View>
              </Pressable>
            )}
          />
        )}
      </Card>

      {exportDetail && exportDetailSource ? (
        <Card>
          <SectionHeader
            title="Export Details"
            subtitle={exportDetailSource.fileName}
            icon="document-text-outline"
            right={
              <Pressable
                onPress={() => {
                  setExportDetail(null);
                  setExportDetailSource(null);
                }}
                style={styles.closeChip}
              >
                <Text style={styles.closeChipText}>Close</Text>
              </Pressable>
            }
          />
          <View style={{ height: 10 }} />
          <Text style={styles.kv}>Exported at: {formatTimestamp(exportDetail.exportedAt)}</Text>
          <Text style={styles.kv}>Society: {exportDetail.societyName}</Text>
          <Text style={styles.kv}>Agent: {exportDetail.agentCode} • {exportDetail.agentName}</Text>
          {exportDetail.lotLabel ? <Text style={styles.kv}>Lot: {exportDetail.lotLabel}</Text> : null}
          <Text style={styles.kv}>Collections: {exportDetail.collections.length}</Text>
          <View style={{ height: 12 }} />
          <Button
            title="Share Export File"
            variant="secondary"
            iconLeft="share-outline"
            onPress={() => shareExport(exportDetailSource)}
          />
          <View style={{ height: 12 }} />
          <FlatList
            data={exportDetail.collections}
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
        </Card>
      ) : null}
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
    kv: { marginTop: 6, fontSize: 14, color: theme.colors.text },
    sep: { height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border },
    row: { paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
    rowPress: { paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
    rowTitle: { fontSize: 14, fontWeight: '800', color: theme.colors.text },
    rowSub: { fontSize: 12, color: theme.colors.muted, marginTop: 2 },
    rowAmount: { fontSize: 14, fontWeight: '800', color: theme.colors.text },
    calendarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    monthLabel: { fontSize: 16, fontWeight: '800', color: theme.colors.text },
    monthNav: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surfaceTint,
    },
    monthNavText: { fontSize: 20, fontWeight: '800', color: theme.colors.primary },
    weekRow: { flexDirection: 'row', marginTop: 12 },
    weekDay: { width: '14.285%', textAlign: 'center', fontSize: 12, color: theme.colors.muted },
    calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
    dayCell: { width: '14.285%', alignItems: 'center', marginVertical: 6 },
    dayButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },
    dayHasData: { backgroundColor: theme.colors.primarySoft },
    daySelected: { backgroundColor: theme.colors.primary },
    dayToday: { borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.primary },
    dayText: { fontSize: 13, fontWeight: '700', color: theme.colors.text },
    dayTextSelected: { color: theme.colors.textOnDark },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'transparent', marginTop: 4 },
    dotActive: { backgroundColor: theme.colors.primary },
    calendarLegend: { marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendText: { fontSize: 12, color: theme.colors.muted },
    legendSwatch: { width: 12, height: 12, borderRadius: 6, backgroundColor: theme.colors.surfaceTint },
    legendSelected: { backgroundColor: theme.colors.primary },
    viewChip: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: theme.radii.pill,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceTint,
    },
    viewChipText: { fontSize: 12, fontWeight: '800', color: theme.colors.primary },
    closeChip: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: theme.radii.pill,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceTint,
    },
    closeChipText: { fontSize: 12, fontWeight: '800', color: theme.colors.muted },
  });
