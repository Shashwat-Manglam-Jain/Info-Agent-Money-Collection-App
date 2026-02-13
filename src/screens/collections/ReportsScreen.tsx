import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Directory, File, Paths } from 'expo-file-system';
import * as XLSX from 'xlsx';

import { useApp } from '../../appState/AppProvider';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { PopupModal, type PopupAction } from '../../components/PopupModal';
import { ScrollScreen } from '../../components/Screen';
import { SectionHeader } from '../../components/SectionHeader';
import { listExportsForDate } from '../../db/repo';
import type { ExportRecord } from '../../models/types';
import type { RootStackParamList } from '../../navigation/types';
import { rupeesToPaise } from '../../utils/money';
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
  collectionsCount: number | null;
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

function fileNameFromUri(uri: string | null): string {
  if (!uri) return '—';
  const parts = uri.split('/');
  return parts[parts.length - 1] || uri;
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function parseExportFileName(name: string): {
  societyCode: string | null;
  agentCode: string | null;
  dateISO: string | null;
  timeISO: string | null;
  lotCode: string | null;
  extension: string | null;
} {
  const match = name.match(/IAMC_([^_]+)_([^_]+)_(.+)_(\d{8})_(\d{6})Z\.(json|xlsx|xls|txt|pdf)$/i);
  if (!match) {
    return { societyCode: null, agentCode: null, dateISO: null, timeISO: null, lotCode: null, extension: null };
  }
  const [, societyCode, agentCode, lotCode, datePart, timePart, extension] = match;
  const yyyy = datePart.slice(0, 4);
  const mm = datePart.slice(4, 6);
  const dd = datePart.slice(6, 8);
  const dateISO = `${yyyy}-${mm}-${dd}`;
  const timeISO = `${timePart.slice(0, 2)}:${timePart.slice(2, 4)}:${timePart.slice(4, 6)}`;
  return { societyCode, agentCode, dateISO, timeISO, lotCode, extension };
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
  if (lower.endsWith('.pdf')) {
    const view = buildExportViewDefaults();
    const meta = parseExportFileName(fileName);
    if (meta.dateISO && meta.timeISO) {
      view.exportedAt = `${meta.dateISO}T${meta.timeISO}Z`;
    }
    if (meta.lotCode) {
      view.lotLabel = meta.lotCode;
    }
    return view;
  }

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
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { db, society, agent } = useApp();
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

  useFocusEffect(
    useCallback(() => {
      (async () => {
        if (!db || !agent || !society) return;
        const exports = await listExportsForDate({ db, societyId: society.id, agentId: agent.id, dateISO: selectedDate });

        let files: DeviceFile[] = [];
        try {
          exportDir.create({ intermediates: true, idempotent: true });
          const items = exportDir.list();
          const exportFiles = items.filter((item) => item instanceof File) as File[];

          const resolved = await Promise.all(
            exportFiles.map(async (file): Promise<DeviceFile | null> => {
              const name = fileNameFromUri(file.uri);
              const meta = parseExportFileName(name);
              const matchesByName =
                meta.societyCode?.toUpperCase() === society.code.toUpperCase() &&
                meta.agentCode === agent.code;
              const hasStructuredName = !!meta.societyCode && !!meta.agentCode;
              let dateISO = meta.dateISO;
              let exportedAtISO: string | null = null;
              let collectionsCount: number | null = null;
              let lotCode: string | null = meta.lotCode;
              let matchesByContent = false;

              // If the file name already has society+agent and it does not match current context,
              // skip expensive file parsing.
              if (hasStructuredName && !matchesByName) {
                return null;
              }

              if (!matchesByName || !dateISO || !lotCode) {
                try {
                  const view = await parseExportFile(file.uri, name);
                  exportedAtISO = view.exportedAt ?? null;
                  dateISO = exportedAtISO ? exportedAtISO.slice(0, 10) : dateISO;
                  collectionsCount = view.collections.length;
                  if (view.lotLabel) lotCode = view.lotLabel;
                  matchesByContent =
                    view.agentCode === agent.code &&
                    normalizeText(view.societyName) === normalizeText(society.name);
                } catch {
                  // ignore parse errors
                }
              }

              if (!matchesByName && !matchesByContent) return null;

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
          files = resolved.filter((file): file is DeviceFile => !!file);

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
    }, [agent, db, exportDir, selectedDate, society])
  );

  const historyItems = useMemo(() => {
    const items: HistoryItem[] = [];
    const seen = new Set<string>();
    const availableUris = new Set(deviceFiles.map((file) => file.uri));

    for (const record of exportRecords) {
      if (!record.fileUri || !availableUris.has(record.fileUri)) {
        continue;
      }
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
        collectionsCount: record.collectionsCount,
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
        collectionsCount: file.collectionsCount,
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
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.dot, styles.dotActive]} />
              <Text style={styles.legendText}>Has data</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendSwatch, styles.legendSelected]} />
              <Text style={styles.legendText}>Selected</Text>
            </View>
          </View>
          <Button title="Today" variant="secondary" onPress={goToday} iconLeft="today-outline" style={styles.todayButton} />
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
                    ? nav.navigate('ExportDetail', {
                        fileUri: item.fileUri,
                        fileName: item.fileName,
                        exportedAtISO: item.exportedAtISO,
                        lotCode: item.lotCode,
                        collectionsCount: item.collectionsCount,
                      })
                    : showMessage('File not available', 'This export does not have a file path.')
                }
                style={styles.rowPress}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{item.displayTitle}</Text>
                  <Text style={styles.rowSub}>{item.displaySub}</Text>
                </View>
                <View style={styles.viewChip}>
                  <Text style={styles.viewChipText}>View</Text>
                </View>
              </Pressable>
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
    rowPress: {
      paddingVertical: 12,
      paddingHorizontal: 4,
      borderRadius: theme.radii.sm,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    rowTitle: { fontSize: 15, fontWeight: '900', color: theme.colors.text },
    rowSub: { fontSize: 12, color: theme.colors.muted, marginTop: 3, lineHeight: 17 },
    calendarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    monthLabel: { fontSize: 17, fontWeight: '900', color: theme.colors.text },
    monthNav: {
      width: 38,
      height: 38,
      borderRadius: 19,
      borderWidth: 1,
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
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },
    dayHasData: { backgroundColor: theme.colors.primarySoft },
    daySelected: { backgroundColor: theme.colors.primary },
    dayToday: { borderWidth: 1, borderColor: theme.colors.primary },
    dayText: { fontSize: 13, fontWeight: '700', color: theme.colors.text },
    dayTextSelected: { color: theme.colors.textOnDark },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'transparent', marginTop: 4 },
    dotActive: { backgroundColor: theme.colors.primary },
    calendarLegend: { marginTop: 12, gap: 10 },
    legendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendText: { fontSize: 12, color: theme.colors.muted },
    legendSwatch: { width: 12, height: 12, borderRadius: 6, backgroundColor: theme.colors.surfaceTint },
    legendSelected: { backgroundColor: theme.colors.primary },
    todayButton: { width: '100%' },
    viewChip: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: theme.radii.pill,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceTint,
    },
    viewChipText: { fontSize: 12, fontWeight: '800', color: theme.colors.primary },
  });
