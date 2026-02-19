import { useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import * as Crypto from 'expo-crypto';
import * as DocumentPicker from 'expo-document-picker';
import type { DocumentPickerAsset } from 'expo-document-picker';
import { File } from 'expo-file-system';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useApp } from '../../appState/AppProvider';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Icon } from '../../components/Icon';
import { LoadingModal } from '../../components/LoadingModal';
import { PopupModal, type PopupAction } from '../../components/PopupModal';
import { ScrollScreen } from '../../components/Screen';
import { SectionHeader } from '../../components/SectionHeader';
import {
  getAgentBySocietyAndCode,
  getImportIdentityLock,
  getRegistration,
  getSocietyByCode,
  hasImportedFileHash,
  listAccountLots,
  markImportedFileHash,
  saveImportIdentityLock,
} from '../../db/repo';
import { useI18n } from '../../i18n';
import type { ImportCategory, RootStackParamList } from '../../navigation/types';
import { DEFAULT_AGENT_PIN, importParsedReport } from '../../sync/importAgentReport';
import { parseAgentReportExcel } from '../../sync/parseAgentReportExcel';
import { parseAgentReportText, type ParsedAccount } from '../../sync/parseAgentReport';
import { getErrorMessage } from '../../utils/errors';
import { useTheme } from '../../theme';
import type { Theme } from '../../theme';
import { lotKeyFromParts, lotLabel } from '../../utils/lots';

type Props = NativeStackScreenProps<RootStackParamList, 'ImportMasterData'>;

function detectCategory(account: ParsedAccount): ImportCategory | null {
  if (account.accountType === 'LOAN') return 'loan';
  if (account.frequency === 'DAILY') return 'daily';
  if (account.frequency === 'MONTHLY') return 'monthly';
  return null;
}

function matchesCategory(account: ParsedAccount, category: ImportCategory): boolean {
  if (category === 'loan') return account.accountType === 'LOAN';
  if (category === 'daily') return account.accountType !== 'LOAN' && account.frequency === 'DAILY';
  return account.accountType !== 'LOAN' && account.frequency === 'MONTHLY';
}

function stripDataUrlPrefix(value: string): string {
  const trimmed = value.trim();
  const commaIndex = trimmed.indexOf(',');
  return commaIndex >= 0 ? trimmed.slice(commaIndex + 1) : trimmed;
}

function decodeBase64Text(value: string): string {
  const rawBase64 = stripDataUrlPrefix(value);
  if (typeof atob !== 'function') throw new Error('Browser base64 decoder unavailable');
  const binary = atob(rawBase64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function readBlobAsBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read selected file'));
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Failed to read selected file'));
        return;
      }
      resolve(stripDataUrlPrefix(reader.result));
    };
    reader.readAsDataURL(blob);
  });
}

async function readAssetText(asset: DocumentPickerAsset): Promise<string> {
  if (Platform.OS !== 'web') {
    return new File(asset.uri).text();
  }
  if (asset.file) return asset.file.text();
  if (asset.base64) return decodeBase64Text(asset.base64);
  const response = await fetch(asset.uri);
  if (!response.ok) throw new Error('Failed to read selected file');
  return response.text();
}

async function readAssetBase64(asset: DocumentPickerAsset): Promise<string> {
  if (Platform.OS !== 'web') {
    return new File(asset.uri).base64();
  }
  if (asset.base64) return stripDataUrlPrefix(asset.base64);
  if (asset.file) return readBlobAsBase64(asset.file);
  const response = await fetch(asset.uri);
  if (!response.ok) throw new Error('Failed to read selected file');
  return readBlobAsBase64(await response.blob());
}

export function ImportMasterDataScreen({ navigation, route }: Props) {
  const { db, signIn, agent, society, setActiveLot } = useApp();
  const { t } = useI18n();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [busy, setBusy] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(false);
  const [registration, setRegistration] = useState<{ societyName: string; agentName: string } | null>(null);
  const [popup, setPopup] = useState<{ title: string; message?: string; actions?: PopupAction[] } | null>(null);
  const mode = route.params?.mode ?? 'replace';
  const category = route.params?.category;
  const isAddMode = mode === 'add';
  const localizedCategoryText =
    category === 'daily'
      ? t('import.category.daily')
      : category === 'monthly'
        ? t('import.category.monthly')
        : category === 'loan'
          ? t('import.category.loan')
          : t('import.category.account');
  const localizedCategoryLower = localizedCategoryText.toLowerCase();

  useEffect(() => {
    if (!pendingNavigation || !agent) return;
    setPendingNavigation(false);
    navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
  }, [agent, navigation, pendingNavigation]);

  useEffect(() => {
    navigation.setOptions({
      title: category
        ? t('import.screen.navTitleCategory', {
            category: localizedCategoryText,
          })
        : t('import.screen.navTitleDefault'),
    });
  }, [category, localizedCategoryText, navigation, t]);

  useEffect(() => {
    if (!db) return;
    (async () => {
      const reg = await getRegistration(db);
      setRegistration(reg);
    })();
  }, [db]);

  const isExcelAsset = (asset: DocumentPickerAsset): boolean => {
    const name = asset.name?.toLowerCase() ?? '';
    const mime = asset.mimeType?.toLowerCase() ?? '';
    return (
      name.endsWith('.xls') ||
      name.endsWith('.xlsx') ||
      mime.includes('excel') ||
      mime.includes('spreadsheet') ||
      mime === 'application/vnd.ms-excel' ||
      mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
  };

  const closePopup = () => setPopup(null);

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.reset({ index: 0, routes: [{ name: agent ? 'MainTabs' : 'Login' }] });
  };

  const showMessage = (title: string, message?: string, actions?: PopupAction[]) => {
    setPopup({
      title,
      message,
      actions: actions ?? [{ label: t('common.ok'), onPress: closePopup }],
    });
  };

  const pickAndImport = async () => {
    if (!db) return;
    setBusy(true);
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: [
          'text/plain',
          'text/*',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ],
        copyToCacheDirectory: true,
        base64: Platform.OS === 'web',
        multiple: false,
      });

      if (res.canceled) return;
      const asset = res.assets?.[0];
      if (!asset?.uri) throw new Error('No file selected');

      const isExcel = isExcelAsset(asset);
      const fileContent = isExcel
        ? await readAssetBase64(asset)
        : await readAssetText(asset);
      const report = isExcel
        ? parseAgentReportExcel(fileContent)
        : parseAgentReportText(fileContent);
      const fileHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        `${isExcel ? 'excel' : 'text'}:${fileContent}`
      );
      const selectedSocietyCode = report.societyCode.trim().toUpperCase();
      const selectedAgentCode = report.agentCode.trim().toUpperCase();
      const signedInSocietyCode = society?.code.trim().toUpperCase() ?? null;
      const signedInAgentCode = agent?.code.trim().toUpperCase() ?? null;
      const importLock = await getImportIdentityLock(db);

      if (
        signedInSocietyCode &&
        signedInAgentCode &&
        (signedInSocietyCode !== selectedSocietyCode ||
          signedInAgentCode !== selectedAgentCode)
      ) {
        showMessage(
          t('import.popup.otherAgentFileTitle'),
          t('import.popup.otherAgentFileMessage', {
            registeredAgentCode: signedInAgentCode,
            registeredSocietyCode: signedInSocietyCode,
            selectedAgentCode,
            selectedSocietyCode,
          })
        );
        return;
      }

      if (
        importLock &&
        (importLock.societyCode !== selectedSocietyCode ||
          importLock.agentCode !== selectedAgentCode)
      ) {
        showMessage(
          t('import.popup.otherAgentFileTitle'),
          t('import.popup.otherAgentFileMessage', {
            registeredAgentCode: importLock.agentCode,
            registeredSocietyCode: importLock.societyCode,
            selectedAgentCode,
            selectedSocietyCode,
          })
        );
        return;
      }

      const alreadyImported = await hasImportedFileHash(db, {
        societyCode: selectedSocietyCode,
        agentCode: selectedAgentCode,
        fileHash,
      });
      if (alreadyImported) {
        showMessage(
          t('import.popup.duplicateFileTitle'),
          t('import.popup.duplicateFileMessage')
        );
        return;
      }

      const firstAccount = report.accounts[0];
      if (category && !matchesCategory(firstAccount, category)) {
        const detected = detectCategory(firstAccount);
        const detectedText =
          detected === 'daily'
            ? t('import.category.daily')
            : detected === 'monthly'
              ? t('import.category.monthly')
              : detected === 'loan'
                ? t('import.category.loan')
                : t('import.category.different');
        showMessage(
          t('import.popup.wrongFileTitle'),
          t('import.popup.wrongFileMessage', {
            expectedCategory: localizedCategoryText,
            detectedCategory: detectedText,
          })
        );
        return;
      }

      const newLotKey = lotKeyFromParts(firstAccount.accountHeadCode, firstAccount.accountType, firstAccount.frequency);
      const newLotLabel = lotLabel({
        accountHead: firstAccount.accountHead,
        accountHeadCode: firstAccount.accountHeadCode,
        accountType: firstAccount.accountType,
        frequency: firstAccount.frequency,
      });

      if (mode === 'add') {
        const existingSociety = await getSocietyByCode(db, report.societyCode);
        if (existingSociety) {
          const existingAgent = await getAgentBySocietyAndCode(db, existingSociety.id, report.agentCode);
          if (existingAgent) {
            const lots = await listAccountLots(db, existingSociety.id, existingAgent.id);
            if (lots.find((lot) => lot.key === newLotKey)) {
              showMessage(
                t('import.popup.accountTypeLoadedTitle'),
                t('import.popup.accountTypeLoadedMessage', { lotLabel: newLotLabel })
              );
              return;
            }
          }
        }
      }

      const result = await importParsedReport(db, report, { replaceExisting: mode !== 'add' });
      await saveImportIdentityLock(db, {
        societyCode: selectedSocietyCode,
        agentCode: selectedAgentCode,
      });
      await markImportedFileHash(db, {
        societyCode: selectedSocietyCode,
        agentCode: selectedAgentCode,
        fileHash,
      });

      const signedIn = await signIn({
        societyCode: result.societyCode,
        agentCode: result.agentCode,
        pin: DEFAULT_AGENT_PIN,
      });

      if (!signedIn) {
        showMessage(
          t('import.popup.importedSignInFailedTitle'),
          t('import.popup.importedSignInFailedMessage', {
            societyName: result.societyName,
            societyCode: result.societyCode,
            agentCode: result.agentCode,
            accountsUpserted: result.accountsUpserted,
          })
        );
        return;
      }

      await setActiveLot({
        key: newLotKey,
        accountHead: firstAccount.accountHead,
        accountHeadCode: firstAccount.accountHeadCode,
        accountType: firstAccount.accountType,
        frequency: firstAccount.frequency,
      });

      showMessage(
        t('import.popup.importedTitle'),
        t('import.popup.importedMessage', {
          societyName: result.societyName,
          societyCode: result.societyCode,
          agentCode: result.agentCode,
          accountsUpserted: result.accountsUpserted,
          lotLabel: newLotLabel,
        }),
        [
          { label: t('common.stay'), variant: 'ghost', onPress: closePopup },
          {
            label: t('common.openDashboard'),
            onPress: () => {
              closePopup();
              setPendingNavigation(true);
            },
          },
        ]
      );
    } catch (e: unknown) {
      showMessage(t('import.popup.importFailedTitle'), getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollScreen>
      <Card>
        <SectionHeader
          title={
            isAddMode
              ? t('import.screen.titleAdd', { category: localizedCategoryText })
              : t('import.screen.titleImport', { category: localizedCategoryText })
          }
          subtitle={
            isAddMode
              ? t('import.screen.subtitleAdd', {
                  category: localizedCategoryLower,
                })
              : category
                ? t('import.screen.subtitleCategory', {
                    category: localizedCategoryLower,
                  })
                : t('import.screen.subtitleAll')
          }
          icon="cloud-download-outline"
        />
        <Text style={styles.registered}>
          {registration
            ? t('import.screen.registered', {
                societyName: registration.societyName,
                agentName: registration.agentName,
              })
            : t('import.screen.registrationOptional')}
        </Text>
      </Card>

      <Card>
        <SectionHeader
          title={t('import.screen.guideTitle')}
          icon="sparkles-outline"
          subtitle={t('import.screen.guideSubtitle')}
        />

        <View style={styles.guideHero}>
          <View style={styles.guideHeroIconWrap}>
            <Icon name="cloud-upload-outline" size={18} color={theme.colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.guideHeroTitle}>
              {isAddMode
                ? t('import.screen.heroAddTitle', { category: localizedCategoryText })
                : t('import.screen.heroImportTitle', {
                    category: localizedCategoryText,
                  })}
            </Text>
            <Text style={styles.guideHeroText}>
              {t('import.screen.heroText')}
            </Text>
          </View>
        </View>

        <View style={styles.formatRow}>
          <View style={styles.formatChip}>
            <Icon name="document-text-outline" size={14} color={theme.colors.primary} />
            <Text style={styles.formatChipText}>TXT</Text>
          </View>
          <View style={styles.formatChip}>
            <Icon name="grid-outline" size={14} color={theme.colors.primary} />
            <Text style={styles.formatChipText}>XLS</Text>
          </View>
          <View style={styles.formatChip}>
            <Icon name="grid-outline" size={14} color={theme.colors.primary} />
            <Text style={styles.formatChipText}>XLSX</Text>
          </View>
        </View>

        <View style={styles.stepsList}>
          <View style={styles.stepRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>1</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>{t('import.screen.step1Title')}</Text>
              <Text style={styles.stepText}>{t('import.screen.step1Text')}</Text>
            </View>
          </View>
          <View style={styles.stepRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>2</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>{t('import.screen.step2Title')}</Text>
              <Text style={styles.stepText}>{t('import.screen.step2Text')}</Text>
            </View>
          </View>
          <View style={styles.stepRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>3</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>{t('import.screen.step3Title')}</Text>
              <Text style={styles.stepText}>{t('import.screen.step3Text')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.tipBox}>
          <Icon name="information-circle-outline" size={16} color={theme.colors.primary} />
          <Text style={styles.tipText}>
            {category
              ? t('import.screen.tipCategory', {
                  category: localizedCategoryLower,
                })
              : t('import.screen.tipAll')}
          </Text>
        </View>
      </Card>

      <Card>
        <View style={{ gap: 12 }}>
          <Button
            title={
              busy
                ? t('import.screen.buttonImporting')
                : isAddMode
                  ? t('import.screen.buttonPickAdd', {
                      category: localizedCategoryText,
                    })
                  : t('import.screen.buttonPickImport', {
                      category: localizedCategoryText,
                    })
            }
            iconLeft="folder-open-outline"
            onPress={pickAndImport}
            disabled={busy}
          />
          <Button
            title={t('import.screen.buttonRefreshSession')}
            variant="secondary"
            iconLeft="refresh-outline"
            onPress={() => {
              if (agent) {
                navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
              } else {
                navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
              }
            }}
            disabled={busy}
          />
          <Button
            title={t('import.screen.buttonBack')}
            variant="ghost"
            iconLeft="arrow-back-outline"
            onPress={handleBack}
            disabled={busy}
          />
        </View>
      </Card>

      <PopupModal
        visible={!!popup}
        title={popup?.title ?? ''}
        message={popup?.message}
        actions={popup?.actions}
        onDismiss={closePopup}
      />
      <LoadingModal
        visible={busy && !popup}
        title={t('import.screen.loadingTitle')}
        message={t('import.screen.loadingMessage')}
      />
    </ScrollScreen>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    guideHero: {
      marginTop: 12,
      flexDirection: 'row',
      gap: 10,
      padding: 12,
      borderRadius: theme.radii.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.primarySoft,
    },
    guideHeroIconWrap: {
      width: 32,
      height: 32,
      borderRadius: theme.radii.pill,
      backgroundColor: theme.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    guideHeroTitle: {
      fontSize: 13,
      fontWeight: '900',
      color: theme.colors.text,
    },
    guideHeroText: {
      marginTop: 3,
      fontSize: 12,
      color: theme.colors.muted,
      lineHeight: 17,
    },
    formatRow: {
      marginTop: 10,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    formatChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: theme.radii.pill,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceTint,
    },
    formatChipText: {
      fontSize: 11,
      fontWeight: '900',
      color: theme.colors.primary,
      letterSpacing: 0.2,
    },
    stepsList: {
      marginTop: 12,
      padding: 12,
      borderRadius: theme.radii.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceTint,
      gap: 10,
    },
    stepRow: {
      flexDirection: 'row',
      gap: 10,
      alignItems: 'flex-start',
    },
    stepBadge: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
    },
    stepBadgeText: {
      fontSize: 12,
      fontWeight: '900',
      color: theme.colors.textOnDark,
      lineHeight: 12,
    },
    stepTitle: {
      fontSize: 12,
      fontWeight: '900',
      color: theme.colors.text,
    },
    stepText: {
      marginTop: 2,
      fontSize: 12,
      lineHeight: 17,
      color: theme.colors.muted,
    },
    tipBox: {
      marginTop: 10,
      paddingVertical: 9,
      paddingHorizontal: 10,
      borderRadius: theme.radii.sm + 2,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.primarySoft,
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
    },
    tipText: { flex: 1, fontSize: 12, color: theme.colors.text, lineHeight: 17, fontWeight: '700' },
    registered: { marginTop: 9, fontSize: 12, color: theme.colors.muted, lineHeight: 17 },
  });
