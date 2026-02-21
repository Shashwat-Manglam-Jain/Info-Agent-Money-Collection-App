// import { useCallback, useMemo, useState } from "react";
// import { StyleSheet, Text, View } from "react-native";
// import { useFocusEffect, useNavigation } from "@react-navigation/native";
// import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

// import { useApp } from "../../appState/AppProvider";
// import { Button } from "../../components/Button";
// import { Card } from "../../components/Card";
// import { PopupModal, type PopupAction } from "../../components/PopupModal";
// import { SocietySwitcherCard } from "../../components/SocietySwitcherCard";
// import { Skeleton } from "../../components/Skeleton";
// import { ScrollScreen } from "../../components/Screen";
// import { SectionHeader } from "../../components/SectionHeader";
// import {
//   clearClientDataByLots,
//   getAccountCount,
//   getPendingExportCounts,
// } from "../../db/repo";
// import type {
//   ImportCategory,
//   RootStackParamList,
// } from "../../navigation/types";
// import {
//   exportPendingAndShare,
//   type ExportCategory,
//   type ExportFormat,
// } from "../../sync/exportPending";
// import { useI18n } from "../../i18n";
// import { getErrorMessage } from "../../utils/errors";
// import { useTheme } from "../../theme";
// import type { Theme } from "../../theme";

// const exportCategories: ExportCategory[] = ["daily", "monthly", "loan"];

// export function SyncScreen() {
//   const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
//   const { db, society, agent, activeLot, signOut } = useApp();
//   const { t } = useI18n();
//   const theme = useTheme();
//   const styles = useMemo(() => makeStyles(theme), [theme]);
//   const [pendingCollections, setPendingCollections] = useState(0);
//   const [pendingDaily, setPendingDaily] = useState(0);
//   const [pendingMonthly, setPendingMonthly] = useState(0);
//   const [pendingLoan, setPendingLoan] = useState(0);
//   const [accountCount, setAccountCount] = useState(0);
//   const [exportingCategory, setExportingCategory] =
//     useState<ExportCategory | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [popup, setPopup] = useState<{
//     title: string;
//     message?: string;
//     actions?: PopupAction[];
//   } | null>(null);

//   const refresh = useCallback(async () => {
//     if (!db || !agent || !society) return;
//     setLoading(true);
//     try {
//       const [pending, count] = await Promise.all([
//         getPendingExportCounts({
//           db,
//           societyId: society.id,
//           agentId: agent.id,
//         }),
//         getAccountCount(db, society.id, agent.id),
//       ]);
//       setPendingCollections(pending.collections);
//       setPendingDaily(pending.daily);
//       setPendingMonthly(pending.monthly);
//       setPendingLoan(pending.loan);
//       setAccountCount(count);
//     } finally {
//       setLoading(false);
//     }
//   }, [agent, db, society]);

//   useFocusEffect(
//     useCallback(() => {
//       void refresh();
//     }, [refresh]),
//   );

//   const fileNameFromUri = (uri: string): string => {
//     const parts = uri.split("/");
//     return parts[parts.length - 1] || uri;
//   };
//   const closePopup = () => setPopup(null);
//   const categoryLabel = (category: ExportCategory | ImportCategory): string =>
//     category === "daily"
//       ? t("import.category.daily")
//       : category === "monthly"
//         ? t("import.category.monthly")
//         : t("import.category.loan");

//   const selectedExportCategory = useMemo<ExportCategory | null>(() => {
//     if (!activeLot) return null;
//     if (activeLot.accountType === "LOAN") return "loan";
//     if (activeLot.frequency === "DAILY") return "daily";
//     if (activeLot.frequency === "MONTHLY") return "monthly";
//     return null;
//   }, [activeLot]);

//   const pendingCountFor = (category: ExportCategory): number => {
//     if (category === "daily") return pendingDaily;
//     if (category === "monthly") return pendingMonthly;
//     return pendingLoan;
//   };

//   const doExport = async (format: ExportFormat, category: ExportCategory) => {
//     if (!db || !society || !agent) return;
//     setExportingCategory(category);
//     try {
//       const result = await exportPendingAndShare({
//         db,
//         society,
//         agent,
//         format,
//         category,
//       });
//       if (!result) {
//         setPopup({
//           title: "Nothing to export",
//           message: `No pending ${categoryLabel(category)} collections.`,
//           actions: [{ label: "OK", onPress: closePopup }],
//         });
//         return;
//       }
//       await clearClientDataByLots(
//         db,
//         society.id,
//         agent.id,
//         result.files.map((file) => file.lot),
//       );

//       const filesInfo = result.files
//         .map(
//           (f) =>
//             `${f.lotCode ? `Lot ${f.lotCode}` : f.lotName}: ${fileNameFromUri(f.fileUri)}`,
//         )
//         .join("\n");
//       const shareNote = result.shareError
//         ? `\n\nShare skipped: ${result.shareError}\nSaved copy is available in Reports.`
//         : "";

//       await refresh();

//       setPopup({
//         title: `${categoryLabel(category)} Exported`,
//         message: `Files: ${result.files.length}\n${filesInfo}\n\n${t("sync.export.popup.clientDataDeleted")}\nSaved copy kept in export history.${shareNote}`,
//         actions: [{ label: "OK", onPress: closePopup }],
//       });
//     } catch (e: unknown) {
//       setPopup({
//         title: "Export failed",
//         message: getErrorMessage(e),
//         actions: [{ label: "OK", onPress: closePopup }],
//       });
//     } finally {
//       setExportingCategory(null);
//     }
//   };

//   const openExportPopup = (category: ExportCategory) => {
//     if (!db || !society || !agent) return;
//     const count = pendingCountFor(category);
//     if (count === 0) {
//       setPopup({
//         title: "Nothing to export",
//         message: `No pending ${categoryLabel(category)} collections.`,
//         actions: [{ label: "OK", onPress: closePopup }],
//       });
//       return;
//     }
//     setPopup({
//       title: `${categoryLabel(category)} Export Format`,
//       message: `Choose format for ${categoryLabel(category)} export (${count} collections).`,
//       actions: [
//         { label: "Cancel", variant: "ghost", onPress: closePopup },
//         {
//           label: "Excel (default)",
//           onPress: () => {
//             closePopup();
//             void doExport("xlsx", category);
//           },
//         },
//         {
//           label: "Text (TXT)",
//           variant: "secondary",
//           onPress: () => {
//             closePopup();
//             void doExport("txt", category);
//           },
//         },
//         {
//           label: "PDF",
//           variant: "secondary",
//           onPress: () => {
//             closePopup();
//             void doExport("pdf", category);
//           },
//         },
//       ],
//     });
//   };

//   return (
//     <ScrollScreen>
//       <SocietySwitcherCard />

//       <Card>
//         <SectionHeader title={t("sync.pending.title")} icon="time-outline" />
//         <View style={{ height: 10 }} />
//         {loading ? (
//           <View style={{ gap: 8 }}>
//             <Skeleton height={12} width="55%" />
//             <Skeleton height={12} width="45%" />
//             <Skeleton height={12} width="50%" />
//             <Skeleton height={12} width="40%" />
//             <Skeleton height={12} width="45%" />
//           </View>
//         ) : (
//           <View style={styles.pendingGrid}>
//             <View style={styles.pendingTile}>
//               <Text style={styles.pendingValue}>{pendingCollections}</Text>
//               <Text style={styles.pendingLabel}>
//                 {t("sync.pending.collections")}
//               </Text>
//             </View>
//             <View style={styles.pendingTile}>
//               <Text style={styles.pendingValue}>{pendingDaily}</Text>
//               <Text style={styles.pendingLabel}>{categoryLabel("daily")}</Text>
//             </View>
//             <View style={styles.pendingTile}>
//               <Text style={styles.pendingValue}>{pendingMonthly}</Text>
//               <Text style={styles.pendingLabel}>
//                 {categoryLabel("monthly")}
//               </Text>
//             </View>
//             <View style={styles.pendingTile}>
//               <Text style={styles.pendingValue}>{pendingLoan}</Text>
//               <Text style={styles.pendingLabel}>{categoryLabel("loan")}</Text>
//             </View>
//             <View style={styles.pendingTileWide}>
//               <Text style={styles.pendingValue}>{accountCount}</Text>
//               <Text style={styles.pendingLabel}>
//                 {t("sync.pending.clientsLoaded")}
//               </Text>
//             </View>
//           </View>
//         )}
//       </Card>

//       <Card>
//         <SectionHeader
//           title={t("sync.export.title")}
//           subtitle={
//             selectedExportCategory
//               ? t("sync.export.subtitleSelected", {
//                   category: categoryLabel(selectedExportCategory),
//                 })
//               : t("sync.export.subtitleDefault")
//           }
//           icon="share-outline"
//         />
//         <View style={{ height: 10 }} />
//         {exportCategories.map((category) => (
//           <View key={category} style={styles.rowGap}>
//             <Button
//               title={
//                 exportingCategory === category
//                   ? t("sync.export.buttonExporting")
//                   : t("sync.export.buttonExport", {
//                       category: categoryLabel(category),
//                       count: pendingCountFor(category),
//                     })
//               }
//               variant={selectedExportCategory === category ? "primary" : "secondary"}
//               disabled={
//                 loading ||
//                 !!exportingCategory ||
//                 pendingCountFor(category) === 0
//               }
//               iconLeft={selectedExportCategory === category ? "checkmark-circle" : "share-outline"}
//               onPress={() => openExportPopup(category)}
//             />
//           </View>
//         ))}
//       </Card>

//       <Card>
//         <SectionHeader
//           title={t("sync.import.title")}
//           subtitle="Choose the exact file type to avoid confusion."
//           icon="cloud-download-outline"
//         />
//         <View style={{ height: 10 }} />
//         <View style={styles.rowGap}>
//           <Button
//             title={t("sync.import.buttonWithFormat", {
//               label: t("actions.importDailyFile"),
//             })}
//             iconLeft="cloud-download-outline"
//             onPress={() =>
//               nav.navigate("ImportMasterData", {
//                 mode: "replace",
//                 category: "daily",
//               })
//             }
//           />
//         </View>
//         <View style={styles.rowGap}>
//           <Button
//             title={t("sync.import.buttonWithFormat", {
//               label: t("actions.importMonthlyFile"),
//             })}
//             variant="secondary"
//             iconLeft="cloud-download-outline"
//             onPress={() =>
//               nav.navigate("ImportMasterData", {
//                 mode: "replace",
//                 category: "monthly",
//               })
//             }
//           />
//         </View>
//         <View style={styles.rowGap}>
//           <Button
//             title={t("sync.import.buttonWithFormat", {
//               label: t("actions.importLoanFile"),
//             })}
//             variant="secondary"
//             iconLeft="cloud-download-outline"
//             onPress={() =>
//               nav.navigate("ImportMasterData", {
//                 mode: "replace",
//                 category: "loan",
//               })
//             }
//           />
//         </View>
//       </Card>

//       <Card>
//         {accountCount === 0 ? (
//           <Button
//             title={t("sync.account.buttonGoToLoginRegister")}
//             variant="secondary"
//             iconLeft="log-in-outline"
//             onPress={() => nav.navigate("Login")}
//           />
//         ) : null}
//         <View style={{ height: accountCount === 0 ? 10 : 0 }} />
//         <Button
//           title={t("sync.account.buttonLogout")}
//           variant="danger"
//           iconLeft="log-out-outline"
//           onPress={signOut}
//         />
//       </Card>

//       <PopupModal
//         visible={!!popup}
//         title={popup?.title ?? ""}
//         message={popup?.message}
//         actions={popup?.actions}
//         onDismiss={closePopup}
//       />
//     </ScrollScreen>
//   );
// }

// const makeStyles = (theme: Theme) =>
//   StyleSheet.create({
//     pendingGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
//     pendingTile: {
//       width: "48%",
//       minHeight: 76,
//       borderRadius: theme.radii.sm + 2,
//       borderWidth: 1,
//       borderColor: theme.colors.border,
//       backgroundColor: theme.colors.surfaceTint,
//       paddingHorizontal: 10,
//       paddingVertical: 10,
//       justifyContent: "center",
//       gap: 3,
//     },
//     pendingTileWide: {
//       width: "100%",
//       minHeight: 76,
//       borderRadius: theme.radii.sm + 2,
//       borderWidth: 1,
//       borderColor: theme.colors.border,
//       backgroundColor: theme.colors.surfaceTint,
//       paddingHorizontal: 10,
//       paddingVertical: 10,
//       justifyContent: "center",
//       gap: 3,
//     },
//     pendingValue: {
//       fontSize: 16,
//       fontWeight: "900",
//       color: theme.colors.text,
//     },
//     pendingLabel: {
//       fontSize: 11,
//       fontWeight: "700",
//       color: theme.colors.muted,
//       letterSpacing: 0.35,
//       textTransform: "uppercase",
//     },
//     rowGap: { marginTop: 10 },
//   });

// import { useCallback, useMemo, useState, useEffect } from "react";
// import {
//   StyleSheet,
//   Text,
//   View,
//   FlatList,
//   TouchableOpacity,
//   Modal,
// } from "react-native";
// import { useFocusEffect, useNavigation } from "@react-navigation/native";
// import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
// import DateTimePicker from "@react-native-community/datetimepicker";

// import { useApp } from "../../appState/AppProvider";
// import { Button } from "../../components/Button";
// import { Card } from "../../components/Card";
// import { PopupModal, type PopupAction } from "../../components/PopupModal";
// import { SocietySwitcherCard } from "../../components/SocietySwitcherCard";
// import { Skeleton } from "../../components/Skeleton";
// import { ScrollScreen } from "../../components/Screen";
// import { SectionHeader } from "../../components/SectionHeader";
// import {
//   clearClientDataByLots,
//   getAccountCount,
//   getPendingExportCounts,
//   getCollectionTotalsForDate,
//   listCollectionsForDate,
// } from "../../db/repo";
// import type {
//   ImportCategory,
//   RootStackParamList,
// } from "../../navigation/types";
// import {
//   exportPendingAndShare,
//   type ExportCategory,
//   type ExportFormat,
// } from "../../sync/exportPending";
// import { useI18n } from "../../i18n";
// import { getErrorMessage } from "../../utils/errors";
// import { useTheme } from "../../theme";
// import type { Theme } from "../../theme";
// import { toISODate } from "../../utils/dates";

// // Define CollectionEntry type locally since it's not exported
// type CollectionEntry = {
//   id: string;
//   societyId: string;
//   agentId: string;
//   accountId: string;
//   accountNo: string;
//   collectedPaise: number;
//   collectedAt: string;
//   collectionDate: string;
//   status: string;
//   exportedAt: string | null;
//   remarks: string | null;
// };

// const exportCategories: ExportCategory[] = ["daily", "monthly", "loan"];

// // Type for date-wise collection summary
// type DateCollectionSummary = {
//   date: string;
//   totalAmount: number;
//   count: number;
//   dailyAmount: number;
//   monthlyAmount: number;
//   loanAmount: number;
// };

// // Simple date formatter for display
// const formatDateForDisplay = (date: Date): string => {
//   const day = date.getDate().toString().padStart(2, "0");
//   const month = (date.getMonth() + 1).toString().padStart(2, "0");
//   const year = date.getFullYear();
//   return `${day}/${month}/${year}`;
// };

// // Check if date is today
// const isToday = (date: Date): boolean => {
//   const today = new Date();
//   return (
//     date.getDate() === today.getDate() &&
//     date.getMonth() === today.getMonth() &&
//     date.getFullYear() === today.getFullYear()
//   );
// };

// export function SyncScreen() {
//   const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
//   const { db, society, agent, activeLot, signOut } = useApp();
//   const { t } = useI18n();
//   const theme = useTheme();
//   const styles = useMemo(() => makeStyles(theme), [theme]);

//   // State for pending collections
//   const [pendingCollections, setPendingCollections] = useState(0);
//   const [pendingDaily, setPendingDaily] = useState(0);
//   const [pendingMonthly, setPendingMonthly] = useState(0);
//   const [pendingLoan, setPendingLoan] = useState(0);
//   const [accountCount, setAccountCount] = useState(0);
//   const [exportingCategory, setExportingCategory] =
//     useState<ExportCategory | null>(null);
//   const [loading, setLoading] = useState(true);

//   // State for date picker
//   const [selectedDate, setSelectedDate] = useState(new Date());
//   const [showDatePicker, setShowDatePicker] = useState(false);
//   const [dateCollections, setDateCollections] = useState<CollectionEntry[]>([]);
//   const [dateTotal, setDateTotal] = useState({ count: 0, totalPaise: 0 });
//   const [loadingDateData, setLoadingDateData] = useState(false);

//   // State for date-wise collections modal
//   const [showDateModal, setShowDateModal] = useState(false);
//   const [allDateCollections, setAllDateCollections] = useState<
//     DateCollectionSummary[]
//   >([]);
//   const [loadingAllDates, setLoadingAllDates] = useState(false);
//   const [selectedDateDetail, setSelectedDateDetail] = useState<string | null>(
//     null,
//   );
//   const [totalCollectionAmount, setTotalCollectionAmount] = useState(0);

//   const [popup, setPopup] = useState<{
//     title: string;
//     message?: string;
//     actions?: PopupAction[];
//   } | null>(null);

//   const refresh = useCallback(async () => {
//     if (!db || !agent || !society) return;
//     setLoading(true);
//     try {
//       // Get pending export counts
//       const [pending, count] = await Promise.all([
//         getPendingExportCounts({
//           db,
//           societyId: society.id,
//           agentId: agent.id,
//         }),
//         getAccountCount(db, society.id, agent.id),
//       ]);

//       setPendingCollections(pending.collections);
//       setPendingDaily(pending.daily);
//       setPendingMonthly(pending.monthly);
//       setPendingLoan(pending.loan);
//       setAccountCount(count);

//       // Load data for selected date
//       await loadDateData(selectedDate);

//       // Load total collection amount
//       await loadTotalCollectionAmount();
//     } finally {
//       setLoading(false);
//     }
//   }, [agent, db, society, selectedDate]);

//   const loadDateData = useCallback(
//     async (date: Date) => {
//       if (!db || !agent || !society) return;
//       setLoadingDateData(true);
//       try {
//         const dateStr = toISODate(date);

//         // Get totals for the date
//         const totals = await getCollectionTotalsForDate({
//           db,
//           societyId: society.id,
//           agentId: agent.id,
//           collectionDate: dateStr,
//         });
//         setDateTotal(totals);

//         // Get collections for the date
//         const collections = await listCollectionsForDate({
//           db,
//           societyId: society.id,
//           agentId: agent.id,
//           collectionDate: dateStr,
//         });
//         setDateCollections(collections);
//       } catch (error) {
//         console.error("Error loading date data:", error);
//       } finally {
//         setLoadingDateData(false);
//       }
//     },
//     [agent, db, society],
//   );

//   const loadTotalCollectionAmount = useCallback(async () => {
//     if (!db || !agent || !society) return;
//     try {
//       // Get total collection amount from all dates
//       const query = `
//         SELECT COALESCE(SUM(c.collected_paise), 0) as totalAmount
//         FROM collections c
//         WHERE c.society_id = ? AND c.agent_id = ?
//       `;

//       const result = await db.getFirstAsync<{ totalAmount: number }>(
//         query,
//         society.id,
//         agent.id,
//       );
//       setTotalCollectionAmount(result?.totalAmount || 0);
//     } catch (error) {
//       console.error("Error loading total collection amount:", error);
//     }
//   }, [agent, db, society]);

//   const loadAllDateCollections = useCallback(async () => {
//     if (!db || !agent || !society) return;
//     setLoadingAllDates(true);
//     try {
//       // Get all collection dates with their totals and category breakdown
//       const query = `
//         SELECT
//           c.collection_date as date,
//           COUNT(*) as count,
//           COALESCE(SUM(c.collected_paise), 0) as totalAmount,
//           COALESCE(SUM(CASE WHEN a.account_type = 'LOAN' THEN c.collected_paise ELSE 0 END), 0) as loanAmount,
//           COALESCE(SUM(CASE WHEN a.account_type <> 'LOAN' AND a.frequency = 'DAILY' THEN c.collected_paise ELSE 0 END), 0) as dailyAmount,
//           COALESCE(SUM(CASE WHEN a.account_type <> 'LOAN' AND a.frequency = 'MONTHLY' THEN c.collected_paise ELSE 0 END), 0) as monthlyAmount
//         FROM collections c
//         JOIN accounts a ON a.id = c.account_id
//         WHERE c.society_id = ? AND c.agent_id = ?
//         GROUP BY c.collection_date
//         ORDER BY c.collection_date DESC
//       `;

//       const rows = await db.getAllAsync<any>(query, society.id, agent.id);

//       const collections: DateCollectionSummary[] = rows.map((row) => ({
//         date: row.date,
//         totalAmount: row.totalAmount || 0,
//         count: row.count || 0,
//         dailyAmount: row.dailyAmount || 0,
//         monthlyAmount: row.monthlyAmount || 0,
//         loanAmount: row.loanAmount || 0,
//       }));

//       setAllDateCollections(collections);
//     } catch (error) {
//       console.error("Error loading all date collections:", error);
//     } finally {
//       setLoadingAllDates(false);
//     }
//   }, [agent, db, society]);

//   // Load total on initial mount and when dependencies change
//   useEffect(() => {
//     if (db && agent && society) {
//       loadTotalCollectionAmount();
//     }
//   }, [db, agent, society, loadTotalCollectionAmount]);

//   useFocusEffect(
//     useCallback(() => {
//       void refresh();
//     }, [refresh]),
//   );

//   const handleDateChange = (event: any, date?: Date) => {
//     setShowDatePicker(false);
//     if (date) {
//       setSelectedDate(date);
//       void loadDateData(date);
//     }
//   };

//   const openAllDatesModal = async () => {
//     await loadAllDateCollections();
//     setShowDateModal(true);
//   };

//   // Get collection label based on selected date
//   const collectionLabel = useMemo(() => {
//     return isToday(selectedDate)
//       ? "Today's Collection"
//       : `Collection for ${formatDateForDisplay(selectedDate)}`;
//   }, [selectedDate]);

//   const fileNameFromUri = (uri: string): string => {
//     const parts = uri.split("/");
//     return parts[parts.length - 1] || uri;
//   };

//   const closePopup = () => setPopup(null);

//   const categoryLabel = (category: ExportCategory | ImportCategory): string =>
//     category === "daily"
//       ? t("import.category.daily")
//       : category === "monthly"
//         ? t("import.category.monthly")
//         : t("import.category.loan");

//   const selectedExportCategory = useMemo<ExportCategory | null>(() => {
//     if (!activeLot) return null;
//     if (activeLot.accountType === "LOAN") return "loan";
//     if (activeLot.frequency === "DAILY") return "daily";
//     if (activeLot.frequency === "MONTHLY") return "monthly";
//     return null;
//   }, [activeLot]);

//   const pendingCountFor = (category: ExportCategory): number => {
//     if (category === "daily") return pendingDaily;
//     if (category === "monthly") return pendingMonthly;
//     return pendingLoan;
//   };

//   const doExport = async (format: ExportFormat, category: ExportCategory) => {
//     if (!db || !society || !agent) return;
//     setExportingCategory(category);
//     try {
//       const result = await exportPendingAndShare({
//         db,
//         society,
//         agent,
//         format,
//         category,
//       });
//       if (!result) {
//         setPopup({
//           title: "Nothing to export",
//           message: `No pending ${categoryLabel(category)} collections.`,
//           actions: [{ label: "OK", onPress: closePopup }],
//         });
//         return;
//       }
//       await clearClientDataByLots(
//         db,
//         society.id,
//         agent.id,
//         result.files.map((file) => file.lot),
//       );

//       const filesInfo = result.files
//         .map(
//           (f) =>
//             `${f.lotCode ? `Lot ${f.lotCode}` : f.lotName}: ${fileNameFromUri(f.fileUri)}`,
//         )
//         .join("\n");
//       const shareNote = result.shareError
//         ? `\n\nShare skipped: ${result.shareError}\nSaved copy is available in Reports.`
//         : "";

//       await refresh();

//       setPopup({
//         title: `${categoryLabel(category)} Exported`,
//         message: `Files: ${result.files.length}\n${filesInfo}\n\n${t("sync.export.popup.clientDataDeleted")}\nSaved copy kept in export history.${shareNote}`,
//         actions: [{ label: "OK", onPress: closePopup }],
//       });
//     } catch (e: unknown) {
//       setPopup({
//         title: "Export failed",
//         message: getErrorMessage(e),
//         actions: [{ label: "OK", onPress: closePopup }],
//       });
//     } finally {
//       setExportingCategory(null);
//     }
//   };

//   const openExportPopup = (category: ExportCategory) => {
//     if (!db || !society || !agent) return;
//     const count = pendingCountFor(category);
//     if (count === 0) {
//       setPopup({
//         title: "Nothing to export",
//         message: `No pending ${categoryLabel(category)} collections.`,
//         actions: [{ label: "OK", onPress: closePopup }],
//       });
//       return;
//     }
//     setPopup({
//       title: `${categoryLabel(category)} Export Format`,
//       message: `Choose format for ${categoryLabel(category)} export (${count} collections).`,
//       actions: [
//         { label: "Cancel", variant: "ghost", onPress: closePopup },
//         {
//           label: "Excel (default)",
//           onPress: () => {
//             closePopup();
//             void doExport("xlsx", category);
//           },
//         },
//         {
//           label: "Text (TXT)",
//           variant: "secondary",
//           onPress: () => {
//             closePopup();
//             void doExport("txt", category);
//           },
//         },
//         {
//           label: "PDF",
//           variant: "secondary",
//           onPress: () => {
//             closePopup();
//             void doExport("pdf", category);
//           },
//         },
//       ],
//     });
//   };

//   const renderDateItem = ({ item }: { item: DateCollectionSummary }) => (
//     <TouchableOpacity
//       style={[styles.dateItem, { backgroundColor: theme.colors.surface }]}
//       onPress={() =>
//         setSelectedDateDetail(
//           selectedDateDetail === item.date ? null : item.date,
//         )
//       }
//     >
//       <View style={[styles.dateHeader, { backgroundColor: theme.colors.surfaceTint }]}>
//         <Text style={[styles.dateText, { color: theme.colors.text }]}>{item.date}</Text>
//         <Text style={[styles.dateAmount, { color: theme.colors.primary }]}>
//           ₹
//           {(item.totalAmount / 100).toLocaleString(undefined, {
//             minimumFractionDigits: 2,
//             maximumFractionDigits: 2,
//           })}
//         </Text>
//       </View>
//       {selectedDateDetail === item.date && (
//         <View style={[styles.dateDetails, { borderTopColor: theme.colors.border }]}>
//           <View style={styles.categoryBreakdown}>
//             <Text style={[styles.categoryText, { color: theme.colors.text }]}>
//               Daily: ₹
//               {(item.dailyAmount / 100).toLocaleString(undefined, {
//                 minimumFractionDigits: 2,
//                 maximumFractionDigits: 2,
//               })}
//             </Text>
//             <Text style={[styles.categoryText, { color: theme.colors.text }]}>
//               Monthly: ₹
//               {(item.monthlyAmount / 100).toLocaleString(undefined, {
//                 minimumFractionDigits: 2,
//                 maximumFractionDigits: 2,
//               })}
//             </Text>
//             <Text style={[styles.categoryText, { color: theme.colors.text }]}>
//               Loan: ₹
//               {(item.loanAmount / 100).toLocaleString(undefined, {
//                 minimumFractionDigits: 2,
//                 maximumFractionDigits: 2,
//               })}
//             </Text>
//           </View>
//           <Text style={[styles.collectionCount, { color: theme.colors.muted }]}>
//             Collections: {item.count}
//           </Text>
//         </View>
//       )}
//     </TouchableOpacity>
//   );

//   const renderCollectionItem = ({ item }: { item: CollectionEntry }) => (
//     <View style={[styles.collectionItem, {
//       backgroundColor: theme.colors.surface,
//       borderColor: theme.colors.border
//     }]}>
//       <Text style={[styles.collectionAccountNo, { color: theme.colors.text }]}>{item.accountNo}</Text>
//       <Text style={[styles.collectionAmount, { color: theme.colors.primary }]}>
//         ₹
//         {(item.collectedPaise / 100).toLocaleString(undefined, {
//           minimumFractionDigits: 2,
//           maximumFractionDigits: 2,
//         })}
//       </Text>
//     </View>
//   );

//   // Date picker button component to use in SectionHeader's right prop
//   const DatePickerButton = () => (
//     <TouchableOpacity
//       style={[styles.datePickerButton, {
//         backgroundColor: theme.colors.surfaceTint,
//         borderColor: theme.colors.border
//       }]}
//       onPress={() => setShowDatePicker(true)}
//     >
//       <Text style={[styles.datePickerButtonText, { color: theme.colors.primary }]}>
//         {formatDateForDisplay(selectedDate)} ▼
//       </Text>
//     </TouchableOpacity>
//   );

//   return (
//     <ScrollScreen>
//       <SocietySwitcherCard />

//       <Card>
//         <SectionHeader title={t("sync.pending.title")} icon="time-outline" />

//         <View style={{ height: 10 }} />

//         {loading ? (
//           <View style={{ gap: 8 }}>
//             <Skeleton height={12} width="55%" />
//             <Skeleton height={12} width="45%" />
//             <Skeleton height={12} width="50%" />
//             <Skeleton height={12} width="40%" />
//             <Skeleton height={12} width="45%" />
//           </View>
//         ) : (
//           <View style={styles.pendingGrid}>
//             <View style={[styles.pendingTile, {
//               backgroundColor: theme.colors.surfaceTint,
//               borderColor: theme.colors.border
//             }]}>
//               <Text style={[styles.pendingValue, { color: theme.colors.text }]}>{pendingCollections}</Text>
//               <Text style={[styles.pendingLabel, { color: theme.colors.muted }]}>
//                 {t("sync.pending.collections")}
//               </Text>
//             </View>
//             <View style={[styles.pendingTile, {
//               backgroundColor: theme.colors.surfaceTint,
//               borderColor: theme.colors.border
//             }]}>
//               <Text style={[styles.pendingValue, { color: theme.colors.text }]}>{pendingDaily}</Text>
//               <Text style={[styles.pendingLabel, { color: theme.colors.muted }]}>{categoryLabel("daily")}</Text>
//             </View>
//             <View style={[styles.pendingTile, {
//               backgroundColor: theme.colors.surfaceTint,
//               borderColor: theme.colors.border
//             }]}>
//               <Text style={[styles.pendingValue, { color: theme.colors.text }]}>{pendingMonthly}</Text>
//               <Text style={[styles.pendingLabel, { color: theme.colors.muted }]}>
//                 {categoryLabel("monthly")}
//               </Text>
//             </View>
//             <View style={[styles.pendingTile, {
//               backgroundColor: theme.colors.surfaceTint,
//               borderColor: theme.colors.border
//             }]}>
//               <Text style={[styles.pendingValue, { color: theme.colors.text }]}>{pendingLoan}</Text>
//               <Text style={[styles.pendingLabel, { color: theme.colors.muted }]}>{categoryLabel("loan")}</Text>
//             </View>
//             <View style={[styles.pendingTileWide, {
//               backgroundColor: theme.colors.surfaceTint,
//               borderColor: theme.colors.border
//             }]}>
//               <Text style={[styles.pendingValue, { color: theme.colors.text }]}>{accountCount}</Text>
//               <Text style={[styles.pendingLabel, { color: theme.colors.muted }]}>
//                 {t("sync.pending.clientsLoaded")}
//               </Text>
//             </View>

//             {/* Collection for selected date - dynamic label */}
//             <View style={[styles.pendingTileWide, styles.todayCollectionTile, {
//               backgroundColor: `${theme.colors.primary}20`,
//               borderColor: theme.colors.border
//             }]}>
//               <View style={styles.rowContainer}>
//                 <Text style={[ { color: theme.colors.muted }]}>{collectionLabel}</Text>
//                 <Text style={[styles.todayCollectionLabel, {
//                   color: theme.colors.text ,
//                 }]}>
//                 </Text>
//                 <DatePickerButton />
//               </View>

//               {loadingDateData ? (
//                 <Skeleton height={20} width="60%" />
//               ) : (
//                 <View>
//                   <Text style={[styles.todayCollectionValue, {
//                     color: theme.colors.primary
//                   }]}>
//                     ₹
//                     {(dateTotal.totalPaise / 100).toLocaleString(undefined, {
//                       minimumFractionDigits: 2,
//                       maximumFractionDigits: 2,
//                     })}
//                   </Text>
//                   <Text style={[styles.todayCollectionCount, { color: theme.colors.muted }]}>
//                     {dateTotal.count}{" "}
//                     {dateTotal.count === 1 ? "collection" : "collections"}
//                   </Text>
//                 </View>
//               )}
//             </View>

//             {/* Total Collection Tile */}
//             <View style={[styles.pendingTileWide, styles.totalCollectionTile, {
//               backgroundColor: `${theme.colors.primary}20`,
//               borderColor: theme.colors.border
//             }]}>
//               <Text style={[styles.pendingLabel, { color: theme.colors.muted }]}>
//                 Total Collection Amount
//               </Text>
//               <Text style={[styles.totalCollectionValue, {
//                  color: theme.colors.primary
//               }]}>
//                 ₹
//                 {(totalCollectionAmount / 100).toLocaleString(undefined, {
//                   minimumFractionDigits: 2,
//                   maximumFractionDigits: 2,
//                 })}
//               </Text>

//             </View>
//           </View>
//         )}
//       </Card>

//       <Card>
//         <SectionHeader
//           title={t("sync.export.title")}
//           subtitle={
//             selectedExportCategory
//               ? t("sync.export.subtitleSelected", {
//                   category: categoryLabel(selectedExportCategory),
//                 })
//               : t("sync.export.subtitleDefault")
//           }
//           icon="share-outline"
//         />
//         <View style={{ height: 10 }} />
//         {exportCategories.map((category) => (
//           <View key={category} style={styles.rowGap}>
//             <Button
//               title={
//                 exportingCategory === category
//                   ? t("sync.export.buttonExporting")
//                   : t("sync.export.buttonExport", {
//                       category: categoryLabel(category),
//                       count: pendingCountFor(category),
//                     })
//               }
//               variant={
//                 selectedExportCategory === category ? "primary" : "secondary"
//               }
//               disabled={
//                 loading ||
//                 !!exportingCategory ||
//                 pendingCountFor(category) === 0
//               }
//               iconLeft={
//                 selectedExportCategory === category
//                   ? "checkmark-circle"
//                   : "share-outline"
//               }
//               onPress={() => openExportPopup(category)}
//             />
//           </View>
//         ))}
//       </Card>

//       <Card>
//         <SectionHeader
//           title={t("sync.import.title")}
//           subtitle="Choose the exact file type to avoid confusion."
//           icon="cloud-download-outline"
//         />
//         <View style={{ height: 10 }} />
//         <View style={styles.rowGap}>
//           <Button
//             title={t("sync.import.buttonWithFormat", {
//               label: t("actions.importDailyFile"),
//             })}
//             iconLeft="cloud-download-outline"
//             onPress={() =>
//               nav.navigate("ImportMasterData", {
//                 mode: "replace",
//                 category: "daily",
//               })
//             }
//           />
//         </View>
//         <View style={styles.rowGap}>
//           <Button
//             title={t("sync.import.buttonWithFormat", {
//               label: t("actions.importMonthlyFile"),
//             })}
//             variant="secondary"
//             iconLeft="cloud-download-outline"
//             onPress={() =>
//               nav.navigate("ImportMasterData", {
//                 mode: "replace",
//                 category: "monthly",
//               })
//             }
//           />
//         </View>
//         <View style={styles.rowGap}>
//           <Button
//             title={t("sync.import.buttonWithFormat", {
//               label: t("actions.importLoanFile"),
//             })}
//             variant="secondary"
//             iconLeft="cloud-download-outline"
//             onPress={() =>
//               nav.navigate("ImportMasterData", {
//                 mode: "replace",
//                 category: "loan",
//               })
//             }
//           />
//         </View>
//       </Card>

//       <Card>
//         {accountCount === 0 ? (
//           <Button
//             title={t("sync.account.buttonGoToLoginRegister")}
//             variant="secondary"
//             iconLeft="log-in-outline"
//             onPress={() => nav.navigate("Login")}
//           />
//         ) : null}
//         <View style={{ height: accountCount === 0 ? 10 : 0 }} />
//         <Button
//           title={t("sync.account.buttonLogout")}
//           variant="danger"
//           iconLeft="log-out-outline"
//           onPress={signOut}
//         />
//       </Card>

//       {/* Date Picker Modal */}
//       {showDatePicker && (
//         <DateTimePicker
//           value={selectedDate}
//           mode="date"
//           display="default"
//           onChange={handleDateChange}
//         />
//       )}

//       {/* All Dates Collections Modal */}
//       <Modal
//         visible={showDateModal}
//         animationType="slide"
//         transparent={true}
//         onRequestClose={() => setShowDateModal(false)}
//       >
//         <View style={styles.modalContainer}>
//           <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
//             <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
//               <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
//                 All Collections by Date
//               </Text>
//               <TouchableOpacity
//                 onPress={() => setShowDateModal(false)}
//                 style={[styles.closeButton, { backgroundColor: theme.colors.surfaceTint }]}
//               >
//                 <Text style={[styles.closeButtonText, { color: theme.colors.muted }]}>✕</Text>
//               </TouchableOpacity>
//             </View>

//             {loadingAllDates ? (
//               <View style={styles.modalLoading}>
//                 <Skeleton height={60} width="100%" />
//                 <Skeleton height={60} width="100%" />
//                 <Skeleton height={60} width="100%" />
//               </View>
//             ) : allDateCollections.length > 0 ? (
//               <FlatList
//                 data={allDateCollections}
//                 renderItem={renderDateItem}
//                 keyExtractor={(item) => item.date}
//                 contentContainerStyle={styles.modalList}
//                 ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
//                 showsVerticalScrollIndicator={false}
//               />
//             ) : (
//               <Text style={[styles.noDataText, { color: theme.colors.muted }]}>
//                 No collections found
//               </Text>
//             )}
//           </View>
//         </View>
//       </Modal>

//       <PopupModal
//         visible={!!popup}
//         title={popup?.title ?? ""}
//         message={popup?.message}
//         actions={popup?.actions}
//         onDismiss={closePopup}
//       />
//     </ScrollScreen>
//   );
// }

// const makeStyles = (theme: Theme) =>
//   StyleSheet.create({
//     datePickerButton: {
//       paddingHorizontal: 12,
//       paddingVertical: 6,
//       borderRadius: theme.radii.sm,
//       borderWidth: 1,
//     },
//     datePickerButtonText: {
//       fontSize: 12,
//       fontWeight: "600",
//     },
//     pendingGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
//     pendingTile: {
//       width: "48%",
//       minHeight: 76,
//       borderRadius: theme.radii.sm + 2,
//       borderWidth: 1,
//       paddingHorizontal: 10,
//       paddingVertical: 10,
//       justifyContent: "center",
//       gap: 3,
//     },
//     pendingTileWide: {
//       width: "100%",
//       minHeight: 76,
//       borderRadius: theme.radii.sm + 2,
//       borderWidth: 1,
//       paddingHorizontal: 10,
//       paddingVertical: 10,
//       justifyContent: "center",
//       gap: 3,
//     },
//     todayCollectionTile: {
//       // Colors applied dynamically
//     },
//     totalCollectionTile: {
//       // Colors applied dynamically
//     },
//     pendingValue: {
//       fontSize: 16,
//       fontWeight: "900",
//     },
//     todayCollectionLabel: {
//       fontSize: 11,
//       fontWeight: "700",
//       letterSpacing: 0.35,
//       textTransform: "uppercase",
//       marginBottom: 4,
//     },
//     todayCollectionValue: {
//       fontSize: 20,
//       fontWeight: "900",
//     },
//     todayCollectionCount: {
//       fontSize: 11,
//       marginTop: 2,
//     },
//     totalCollectionValue: {
//       fontSize: 20,
//       fontWeight: "900",
//     },
//     pendingLabel: {
//       fontSize: 11,
//       fontWeight: "700",
//       letterSpacing: 0.35,
//       textTransform: "uppercase",
//     },
//     rowGap: { marginTop: 10 },

//     // Date collections section
//     dateCollectionsContainer: {
//       marginTop: 16,
//       paddingTop: 16,
//       borderTopWidth: 1,
//     },
//     dateCollectionsHeader: {
//       flexDirection: "row",
//       justifyContent: "space-between",
//       alignItems: "center",
//       marginBottom: 12,
//     },
//     dateCollectionsTitle: {
//       fontSize: 14,
//       fontWeight: "700",
//     },
//     viewAllLink: {
//       fontSize: 12,
//       fontWeight: "600",
//     },
//     collectionItem: {
//       flexDirection: "row",
//       justifyContent: "space-between",
//       alignItems: "center",
//       paddingVertical: 8,
//       paddingHorizontal: 12,
//       borderRadius: theme.radii.sm,
//       borderWidth: 1,
//     },
//     collectionAccountNo: {
//       fontSize: 14,
//     },
//     collectionAmount: {
//       fontSize: 14,
//       fontWeight: "700",
//     },
//     viewMoreButton: {
//       marginTop: 8,
//       paddingVertical: 8,
//       alignItems: "center",
//     },
//     viewMoreText: {
//       fontSize: 12,
//       fontWeight: "600",
//     },

//     // Modal styles
//     modalContainer: {
//       flex: 1,
//       backgroundColor: "rgba(0, 0, 0, 0.5)",
//       justifyContent: "flex-end",
//     },
//     modalContent: {
//       borderTopLeftRadius: 20,
//       borderTopRightRadius: 20,
//       maxHeight: "80%",
//       minHeight: "50%",
//     },
//     modalHeader: {
//       flexDirection: "row",
//       justifyContent: "space-between",
//       alignItems: "center",
//       padding: 16,
//       borderBottomWidth: 1,
//     },
//     modalTitle: {
//       fontSize: 18,
//       fontWeight: "700",
//     },
//     closeButton: {
//       width: 32,
//       height: 32,
//       borderRadius: 16,
//       justifyContent: "center",
//       alignItems: "center",
//     },
//     closeButtonText: {
//       fontSize: 16,
//       fontWeight: "600",
//     },
//     modalLoading: {
//       padding: 16,
//       gap: 8,
//     },
//     modalList: {
//       padding: 16,
//     },
//     dateItem: {
//       borderWidth: 1,
//       borderRadius: theme.radii.sm + 2,
//       overflow: "hidden",
//     },
//     dateHeader: {
//       flexDirection: "row",
//       justifyContent: "space-between",
//       alignItems: "center",
//       padding: 12,
//     },
//     dateText: {
//       fontSize: 14,
//       fontWeight: "700",
//     },
//     dateAmount: {
//       fontSize: 16,
//       fontWeight: "900",
//     },
//     dateDetails: {
//       padding: 12,
//       borderTopWidth: 1,
//       gap: 8,
//     },
//     categoryBreakdown: {
//       gap: 4,
//     },
//     categoryText: {
//       fontSize: 13,
//     },
//     collectionCount: {
//       fontSize: 12,
//       fontStyle: "italic",
//     },
//     noDataText: {
//       textAlign: "center",
//       padding: 20,
//     },
//     rowContainer: {
//       flexDirection: "row",
//       alignItems: "center",
//       justifyContent: 'space-between'
//     },
//   });

import { useCallback, useMemo, useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Modal,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Sharing from "expo-sharing";

import { useApp } from "../../appState/AppProvider";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { PopupModal, type PopupAction } from "../../components/PopupModal";
import { SocietySwitcherCard } from "../../components/SocietySwitcherCard";
import { Skeleton } from "../../components/Skeleton";
import { ScrollScreen } from "../../components/Screen";
import { SectionHeader } from "../../components/SectionHeader";
import {
  clearClientDataByLots,
  getAccountCount,
  getPendingExportCounts,
  getCollectionTotalsForDate,
  listCollectionsForDate,
} from "../../db/repo";
import type {
  ImportCategory,
  RootStackParamList,
} from "../../navigation/types";
import {
  exportPendingCombined,
  type ExportCategory,
  type ExportFormat,
} from "../../sync/exportPending";
import { useI18n } from "../../i18n";
import { getErrorMessage } from "../../utils/errors";
import { useTheme } from "../../theme";
import type { Theme } from "../../theme";
import { toISODate } from "../../utils/dates";

// Define CollectionEntry type locally since it's not exported
type CollectionEntry = {
  id: string;
  societyId: string;
  agentId: string;
  accountId: string;
  accountNo: string;
  collectedPaise: number;
  collectedAt: string;
  collectionDate: string;
  status: string;
  exportedAt: string | null;
  remarks: string | null;
};

const exportCategories: ExportCategory[] = ["daily", "monthly", "loan"];

// Type for date-wise collection summary
type DateCollectionSummary = {
  date: string;
  totalAmount: number;
  count: number;
  dailyAmount: number;
  monthlyAmount: number;
  loanAmount: number;
};

// Simple date formatter for display
const formatDateForDisplay = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Check if date is today
const isToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

export function SyncScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { db, society, agent, activeLot, signOut } = useApp();
  const { t } = useI18n();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  // State for pending collections
  const [pendingCollections, setPendingCollections] = useState(0);
  const [pendingDaily, setPendingDaily] = useState(0);
  const [pendingMonthly, setPendingMonthly] = useState(0);
  const [pendingLoan, setPendingLoan] = useState(0);
  const [accountCount, setAccountCount] = useState(0);
  const [exportingCategory, setExportingCategory] =
    useState<ExportCategory | null>(null);
  const [loading, setLoading] = useState(true);

  // State for date picker
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateCollections, setDateCollections] = useState<CollectionEntry[]>([]);
  const [dateTotal, setDateTotal] = useState({ count: 0, totalPaise: 0 });
  const [loadingDateData, setLoadingDateData] = useState(false);

  // State for date-wise collections modal
  const [showDateModal, setShowDateModal] = useState(false);
  const [allDateCollections, setAllDateCollections] = useState<
    DateCollectionSummary[]
  >([]);
  const [loadingAllDates, setLoadingAllDates] = useState(false);
  const [selectedDateDetail, setSelectedDateDetail] = useState<string | null>(
    null,
  );
  const [totalCollectionAmount, setTotalCollectionAmount] = useState(0);

  const [popup, setPopup] = useState<{
    title: string;
    message?: string;
    actions?: PopupAction[];
  } | null>(null);

  const refresh = useCallback(async () => {
    if (!db || !agent || !society) return;
    setLoading(true);
    try {
      // Get pending export counts
      const [pending, count] = await Promise.all([
        getPendingExportCounts({
          db,
          societyId: society.id,
          agentId: agent.id,
        }),
        getAccountCount(db, society.id, agent.id),
      ]);

      setPendingCollections(pending.collections);
      setPendingDaily(pending.daily);
      setPendingMonthly(pending.monthly);
      setPendingLoan(pending.loan);
      setAccountCount(count);

      // Load data for selected date
      await loadDateData(selectedDate);

      // Load total collection amount
      await loadTotalCollectionAmount();
    } finally {
      setLoading(false);
    }
  }, [agent, db, society, selectedDate]);

  const loadDateData = useCallback(
    async (date: Date) => {
      if (!db || !agent || !society) return;
      setLoadingDateData(true);
      try {
        const dateStr = toISODate(date);

        // Get totals for the date
        const totals = await getCollectionTotalsForDate({
          db,
          societyId: society.id,
          agentId: agent.id,
          collectionDate: dateStr,
        });
        setDateTotal(totals);

        // Get collections for the date
        const collections = await listCollectionsForDate({
          db,
          societyId: society.id,
          agentId: agent.id,
          collectionDate: dateStr,
        });
        setDateCollections(collections);
      } catch (error) {
        console.error("Error loading date data:", error);
      } finally {
        setLoadingDateData(false);
      }
    },
    [agent, db, society],
  );

  const loadTotalCollectionAmount = useCallback(async () => {
    if (!db || !agent || !society) return;
    try {
      // Get total collection amount from all dates
      const query = `
        SELECT COALESCE(SUM(c.collected_paise), 0) as totalAmount
        FROM collections c
        WHERE c.society_id = ? AND c.agent_id = ?
      `;

      const result = await db.getFirstAsync<{ totalAmount: number }>(
        query,
        society.id,
        agent.id,
      );
      setTotalCollectionAmount(result?.totalAmount || 0);
    } catch (error) {
      console.error("Error loading total collection amount:", error);
    }
  }, [agent, db, society]);

  const loadAllDateCollections = useCallback(async () => {
    if (!db || !agent || !society) return;
    setLoadingAllDates(true);
    try {
      // Get all collection dates with their totals and category breakdown
      const query = `
        SELECT 
          c.collection_date as date,
          COUNT(*) as count,
          COALESCE(SUM(c.collected_paise), 0) as totalAmount,
          COALESCE(SUM(CASE WHEN a.account_type = 'LOAN' THEN c.collected_paise ELSE 0 END), 0) as loanAmount,
          COALESCE(SUM(CASE WHEN a.account_type <> 'LOAN' AND a.frequency = 'DAILY' THEN c.collected_paise ELSE 0 END), 0) as dailyAmount,
          COALESCE(SUM(CASE WHEN a.account_type <> 'LOAN' AND a.frequency = 'MONTHLY' THEN c.collected_paise ELSE 0 END), 0) as monthlyAmount
        FROM collections c
        JOIN accounts a ON a.id = c.account_id
        WHERE c.society_id = ? AND c.agent_id = ?
        GROUP BY c.collection_date
        ORDER BY c.collection_date DESC
      `;

      const rows = await db.getAllAsync<any>(query, society.id, agent.id);

      const collections: DateCollectionSummary[] = rows.map((row) => ({
        date: row.date,
        totalAmount: row.totalAmount || 0,
        count: row.count || 0,
        dailyAmount: row.dailyAmount || 0,
        monthlyAmount: row.monthlyAmount || 0,
        loanAmount: row.loanAmount || 0,
      }));

      setAllDateCollections(collections);
    } catch (error) {
      console.error("Error loading all date collections:", error);
    } finally {
      setLoadingAllDates(false);
    }
  }, [agent, db, society]);

  // Load total on initial mount and when dependencies change
  useEffect(() => {
    if (db && agent && society) {
      loadTotalCollectionAmount();
    }
  }, [db, agent, society, loadTotalCollectionAmount]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
      void loadDateData(date);
    }
  };

  const openAllDatesModal = async () => {
    await loadAllDateCollections();
    setShowDateModal(true);
  };

  // Get collection label based on selected date
  const collectionLabel = useMemo(() => {
    return isToday(selectedDate)
      ? "Today's Collection"
      : `Collection for ${formatDateForDisplay(selectedDate)}`;
  }, [selectedDate]);

  const fileNameFromUri = (uri: string): string => {
    const parts = uri.split("/");
    return parts[parts.length - 1] || uri;
  };

  const closePopup = () => setPopup(null);

  const categoryLabel = (category: ExportCategory | ImportCategory): string =>
    category === "daily"
      ? t("import.category.daily")
      : category === "monthly"
        ? t("import.category.monthly")
        : t("import.category.loan");

  const selectedExportCategory = useMemo<ExportCategory | null>(() => {
    if (!activeLot) return null;
    if (activeLot.accountType === "LOAN") return "loan";
    if (activeLot.frequency === "DAILY") return "daily";
    if (activeLot.frequency === "MONTHLY") return "monthly";
    return null;
  }, [activeLot]);

  const pendingCountFor = (category: ExportCategory): number => {
    if (category === "daily") return pendingDaily;
    if (category === "monthly") return pendingMonthly;
    return pendingLoan;
  };

  // Function to share a file
  const shareFile = async (fileUri: string, format: ExportFormat) => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        setPopup({
          title: "Sharing Not Available",
          message: "Sharing is not available on this device",
          actions: [{ label: "OK", onPress: closePopup }],
        });
        return;
      }

      const mimeType =
        format === "pdf"
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

      await Sharing.shareAsync(fileUri, {
        dialogTitle: `Export ${format.toUpperCase()} File`,
        mimeType: mimeType,
      });
    } catch (error) {
      console.error("Sharing failed:", error);
      setPopup({
        title: "Share Failed",
        message: getErrorMessage(error),
        actions: [{ label: "OK", onPress: closePopup }],
      });
    }
  };

  // Main export function - generates both Excel and PDF
  const doExport = async (category: ExportCategory) => {
    if (!db || !society || !agent) return;
    setExportingCategory(category);
    try {
      // Generate both Excel and PDF files
      const result = await exportPendingCombined({
        db,
        society,
        agent,
        category,
        formats: ["xlsx", "pdf"], // Generate both formats
      });

      if (!result || result.files.length === 0) {
        setPopup({
          title: "Nothing to export",
          message: `No pending ${categoryLabel(category)} collections.`,
          actions: [{ label: "OK", onPress: closePopup }],
        });
        return;
      }

      // Clear client data using lots from exports
      await clearClientDataByLots(
        db,
        society.id,
        agent.id,
        result.files.map((file) => file.lot),
      );

      // Find Excel file for sharing
      const excelFile = result.files.find((f) => f.format === "xlsx");

      const filesInfo = result.files
        .map(
          (f) =>
            `${f.lotCode ? `Lot ${f.lotCode}` : f.lotName}: ${fileNameFromUri(f.fileUri)} (${f.format.toUpperCase()})`,
        )
        .join("\n");

      await refresh();

      // Show success popup with share option for Excel
      setPopup({
        title: `${categoryLabel(category)} Exported Successfully`,
        actions: [
          {
            label: "Close",
            onPress: closePopup,
          },
          ...(excelFile
            ? [
                {
                  label: "Share Excel File",
                  onPress: () => {
                    closePopup();
                    void shareFile(excelFile.fileUri, "xlsx");
                  },
                },
              ]
            : []),
        ],
      });
    } catch (e: unknown) {
      setPopup({
        title: "Export Failed",
        message: getErrorMessage(e),
        actions: [{ label: "OK", onPress: closePopup }],
      });
    } finally {
      setExportingCategory(null);
    }
  };

  const renderDateItem = ({ item }: { item: DateCollectionSummary }) => (
    <TouchableOpacity
      style={[styles.dateItem, { backgroundColor: theme.colors.surface }]}
      onPress={() =>
        setSelectedDateDetail(
          selectedDateDetail === item.date ? null : item.date,
        )
      }
    >
      <View
        style={[
          styles.dateHeader,
          { backgroundColor: theme.colors.surfaceTint },
        ]}
      >
        <Text style={[styles.dateText, { color: theme.colors.text }]}>
          {item.date}
        </Text>
        <Text style={[styles.dateAmount, { color: theme.colors.primary }]}>
          ₹
          {(item.totalAmount / 100).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </Text>
      </View>
      {selectedDateDetail === item.date && (
        <View
          style={[styles.dateDetails, { borderTopColor: theme.colors.border }]}
        >
          <View style={styles.categoryBreakdown}>
            <Text style={[styles.categoryText, { color: theme.colors.text }]}>
              Daily: ₹
              {(item.dailyAmount / 100).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
            <Text style={[styles.categoryText, { color: theme.colors.text }]}>
              Monthly: ₹
              {(item.monthlyAmount / 100).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
            <Text style={[styles.categoryText, { color: theme.colors.text }]}>
              Loan: ₹
              {(item.loanAmount / 100).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
          </View>
          <Text style={[styles.collectionCount, { color: theme.colors.muted }]}>
            Collections: {item.count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderCollectionItem = ({ item }: { item: CollectionEntry }) => (
    <View
      style={[
        styles.collectionItem,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <Text style={[styles.collectionAccountNo, { color: theme.colors.text }]}>
        {item.accountNo}
      </Text>
      <Text style={[styles.collectionAmount, { color: theme.colors.primary }]}>
        ₹
        {(item.collectedPaise / 100).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </Text>
    </View>
  );

  // Date picker button component
  const DatePickerButton = () => (
    <TouchableOpacity
      style={[
        styles.datePickerButton,
        {
          backgroundColor: theme.colors.surfaceTint,
          borderColor: theme.colors.border,
        },
      ]}
      onPress={() => setShowDatePicker(true)}
    >
      <Text
        style={[styles.datePickerButtonText, { color: theme.colors.primary }]}
      >
        {formatDateForDisplay(selectedDate)} ▼
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScrollScreen>
      <SocietySwitcherCard />
      <Card>
        <SectionHeader title={t("sync.pending.title")} icon="time-outline" />

        <View style={{ height: 10 }} />

        {loading ? (
          <View style={{ gap: 8 }}>
            <Skeleton height={12} width="55%" />
            <Skeleton height={12} width="45%" />
            <Skeleton height={12} width="50%" />
            <Skeleton height={12} width="40%" />
            <Skeleton height={12} width="45%" />
          </View>
        ) : (
          <View style={styles.pendingGrid}>
            <View
              style={[
                styles.pendingTile,
                {
                  backgroundColor: theme.colors.surfaceTint,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text style={[styles.pendingValue, { color: theme.colors.text }]}>
                {pendingCollections}
              </Text>
              <Text
                style={[styles.pendingLabel, { color: theme.colors.muted }]}
              >
                {t("sync.pending.collections")}
              </Text>
            </View>
            <View
              style={[
                styles.pendingTile,
                {
                  backgroundColor: theme.colors.surfaceTint,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text style={[styles.pendingValue, { color: theme.colors.text }]}>
                {pendingDaily}
              </Text>
              <Text
                style={[styles.pendingLabel, { color: theme.colors.muted }]}
              >
                {categoryLabel("daily")}
              </Text>
            </View>
            <View
              style={[
                styles.pendingTile,
                {
                  backgroundColor: theme.colors.surfaceTint,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text style={[styles.pendingValue, { color: theme.colors.text }]}>
                {pendingMonthly}
              </Text>
              <Text
                style={[styles.pendingLabel, { color: theme.colors.muted }]}
              >
                {categoryLabel("monthly")}
              </Text>
            </View>
            <View
              style={[
                styles.pendingTile,
                {
                  backgroundColor: theme.colors.surfaceTint,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text style={[styles.pendingValue, { color: theme.colors.text }]}>
                {pendingLoan}
              </Text>
              <Text
                style={[styles.pendingLabel, { color: theme.colors.muted }]}
              >
                {categoryLabel("loan")}
              </Text>
            </View>
            <View
              style={[
                styles.pendingTileWide,
                {
                  backgroundColor: theme.colors.surfaceTint,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text style={[styles.pendingValue, { color: theme.colors.text }]}>
                {accountCount}
              </Text>
              <Text
                style={[styles.pendingLabel, { color: theme.colors.muted }]}
              >
                {t("sync.pending.clientsLoaded")}
              </Text>
            </View>

            {/* Collection for selected date */}
            <View
              style={[
                styles.pendingTileWide,
                styles.todayCollectionTile,
                {
                  backgroundColor: `${theme.colors.primary}20`,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View style={styles.rowContainer}>
                <Text style={[{ color: theme.colors.muted }]}>
                  {collectionLabel}
                </Text>
                <DatePickerButton />
              </View>

              {loadingDateData ? (
                <Skeleton height={20} width="60%" />
              ) : (
                <View>
                  <Text
                    style={[
                      styles.todayCollectionValue,
                      {
                        color: theme.colors.primary,
                      },
                    ]}
                  >
                    ₹
                    {(dateTotal.totalPaise / 100).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Text>
                  <Text
                    style={[
                      styles.todayCollectionCount,
                      { color: theme.colors.muted },
                    ]}
                  >
                    {dateTotal.count}{" "}
                    {dateTotal.count === 1 ? "collection" : "collections"}
                  </Text>
                </View>
              )}
            </View>

            {/* Total Collection Tile */}
            <View
              style={[
                styles.pendingTileWide,
                styles.totalCollectionTile,
                {
                  backgroundColor: `${theme.colors.primary}20`,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text
                style={[styles.pendingLabel, { color: theme.colors.muted }]}
              >
                Total Collection Amount
              </Text>
              <Text
                style={[
                  styles.totalCollectionValue,
                  {
                    color: theme.colors.primary,
                  },
                ]}
              >
                ₹
                {(totalCollectionAmount / 100).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>
          </View>
        )}
      </Card>
      <Card>
        <SectionHeader
          title={t("sync.export.title")}
          subtitle={
            selectedExportCategory
              ? t("sync.export.subtitleSelected", {
                  category: categoryLabel(selectedExportCategory),
                })
              : t("sync.export.subtitleDefault")
          }
          icon="share-outline"
        />
        <View style={{ height: 10 }} />
        {exportCategories.map((category) => (
          <View key={category} style={styles.rowGap}>
            <Button
              title={
                exportingCategory === category
                  ? "Exporting..."
                  : ` Export ${categoryLabel(category)} (${pendingCountFor(category)})`
              }
              variant={
                selectedExportCategory === category ? "primary" : "secondary"
              }
              disabled={
                loading ||
                !!exportingCategory ||
                pendingCountFor(category) === 0
              }
              iconLeft={
                selectedExportCategory === category
                  ? "checkmark-circle"
                  : "share-outline"
              }
              onPress={() => {
                if (pendingCountFor(category) > 0) {
                  void doExport(category);
                }
              }}
            />
          </View>
        ))}
      </Card>
      <Card>
        <SectionHeader
          title={t("sync.import.title")}
          subtitle="Choose the exact file type to avoid confusion."
          icon="cloud-download-outline"
        />
        <View style={{ height: 10 }} />
        <View style={styles.rowGap}>
          <Button
            title={t("sync.import.buttonWithFormat", {
              label: t("actions.importDailyFile"),
            })}
            iconLeft="cloud-download-outline"
            onPress={() =>
              nav.navigate("ImportMasterData", {
                mode: "replace",
                category: "daily",
              })
            }
          />
        </View>
        <View style={styles.rowGap}>
          <Button
            title={t("sync.import.buttonWithFormat", {
              label: t("actions.importMonthlyFile"),
            })}
            variant="secondary"
            iconLeft="cloud-download-outline"
            onPress={() =>
              nav.navigate("ImportMasterData", {
                mode: "replace",
                category: "monthly",
              })
            }
          />
        </View>
        <View style={styles.rowGap}>
          <Button
            title={t("sync.import.buttonWithFormat", {
              label: t("actions.importLoanFile"),
            })}
            variant="secondary"
            iconLeft="cloud-download-outline"
            onPress={() =>
              nav.navigate("ImportMasterData", {
                mode: "replace",
                category: "loan",
              })
            }
          />
        </View>
      </Card>
      <Card>
        {accountCount === 0 ? (
          <Button
            title={t("sync.account.buttonGoToLoginRegister")}
            variant="secondary"
            iconLeft="log-in-outline"
            onPress={() => nav.navigate("Login")}
          />
        ) : null}
        <View style={{ height: accountCount === 0 ? 10 : 0 }} />
        <Button
          title={t("sync.account.buttonLogout")}
          variant="danger"
          iconLeft="log-out-outline"
          onPress={signOut}
        />
      </Card>
      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
      {/* All Dates Collections Modal */}
      <Modal
        visible={showDateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDateModal(false)}
      >
        <View style={styles.modalContainer}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <View
              style={[
                styles.modalHeader,
                { borderBottomColor: theme.colors.border },
              ]}
            >
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                All Collections by Date
              </Text>
              <TouchableOpacity
                onPress={() => setShowDateModal(false)}
                style={[
                  styles.closeButton,
                  { backgroundColor: theme.colors.surfaceTint },
                ]}
              >
                <Text
                  style={[
                    styles.closeButtonText,
                    { color: theme.colors.muted },
                  ]}
                >
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            {loadingAllDates ? (
              <View style={styles.modalLoading}>
                <Skeleton height={60} width="100%" />
                <Skeleton height={60} width="100%" />
                <Skeleton height={60} width="100%" />
              </View>
            ) : allDateCollections.length > 0 ? (
              <FlatList
                data={allDateCollections}
                renderItem={renderDateItem}
                keyExtractor={(item) => item.date}
                contentContainerStyle={styles.modalList}
                ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <Text style={[styles.noDataText, { color: theme.colors.muted }]}>
                No collections found
              </Text>
            )}
          </View>
        </View>
      </Modal>
      {/* old popup model */}
      {/* <PopupModal
        visible={!!popup}
        title={popup?.title ?? ""}
        message={popup?.message}
        actions={popup?.actions}
        onDismiss={closePopup}
      /> */}

      {/* new popup by jay */}
      <Modal
        visible={!!popup}
        transparent={true}
        animationType="fade"
        onRequestClose={closePopup}
      >
        <View style={styles.customPopupOverlay}>
          <View
            style={[
              styles.customPopupContainer,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            {/* Sirf Title - No message */}
            <Text
              style={[styles.customPopupTitle, { color: theme.colors.text }]}
            >
              {popup?.title}
            </Text>

            {/* Buttons - side by side */}
            <View style={styles.customPopupActions}>
              {popup?.actions?.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.customPopupButton,
                    // Cancel button ko simple rakhna hai to
                    action.label === "Cancel" && styles.customPopupCancelButton,
                  ]}
                  onPress={action.onPress}
                >
                  <Text
                    style={[
                      styles.customPopupButtonText,
                      {
                        color:
                          action.label === "Cancel"
                            ? theme.colors.muted
                            : theme.colors.primary,
                      },
                    ]}
                  >
                    {action.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </ScrollScreen>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    datePickerButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: theme.radii.sm,
      borderWidth: 1,
    },
    datePickerButtonText: {
      fontSize: 12,
      fontWeight: "600",
    },
    pendingGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    pendingTile: {
      width: "48%",
      minHeight: 76,
      borderRadius: theme.radii.sm + 2,
      borderWidth: 1,
      paddingHorizontal: 10,
      paddingVertical: 10,
      justifyContent: "center",
      gap: 3,
    },
    pendingTileWide: {
      width: "100%",
      minHeight: 76,
      borderRadius: theme.radii.sm + 2,
      borderWidth: 1,
      paddingHorizontal: 10,
      paddingVertical: 10,
      justifyContent: "center",
      gap: 3,
    },
    todayCollectionTile: {
      // Colors applied dynamically
    },
    totalCollectionTile: {
      // Colors applied dynamically
    },
    pendingValue: {
      fontSize: 16,
      fontWeight: "900",
    },
    todayCollectionLabel: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.35,
      textTransform: "uppercase",
      marginBottom: 4,
    },
    todayCollectionValue: {
      fontSize: 20,
      fontWeight: "900",
    },
    todayCollectionCount: {
      fontSize: 11,
      marginTop: 2,
    },
    totalCollectionValue: {
      fontSize: 20,
      fontWeight: "900",
    },
    pendingLabel: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.35,
      textTransform: "uppercase",
    },
    rowGap: { marginTop: 10 },
    dateCollectionsContainer: {
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
    },
    dateCollectionsHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    dateCollectionsTitle: {
      fontSize: 14,
      fontWeight: "700",
    },
    viewAllLink: {
      fontSize: 12,
      fontWeight: "600",
    },
    collectionItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: theme.radii.sm,
      borderWidth: 1,
    },
    collectionAccountNo: {
      fontSize: 14,
    },
    collectionAmount: {
      fontSize: 14,
      fontWeight: "700",
    },
    viewMoreButton: {
      marginTop: 8,
      paddingVertical: 8,
      alignItems: "center",
    },
    viewMoreText: {
      fontSize: 12,
      fontWeight: "600",
    },
    modalContainer: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-end",
    },
    modalContent: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: "80%",
      minHeight: "50%",
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
      borderBottomWidth: 1,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "700",
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: "center",
      alignItems: "center",
    },
    closeButtonText: {
      fontSize: 16,
      fontWeight: "600",
    },
    modalLoading: {
      padding: 16,
      gap: 8,
    },
    modalList: {
      padding: 16,
    },
    dateItem: {
      borderWidth: 1,
      borderRadius: theme.radii.sm + 2,
      overflow: "hidden",
    },
    dateHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 12,
    },
    dateText: {
      fontSize: 14,
      fontWeight: "700",
    },
    dateAmount: {
      fontSize: 16,
      fontWeight: "900",
    },
    dateDetails: {
      padding: 12,
      borderTopWidth: 1,
      gap: 8,
    },
    categoryBreakdown: {
      gap: 4,
    },
    categoryText: {
      fontSize: 13,
    },
    collectionCount: {
      fontSize: 12,
      fontStyle: "italic",
    },
    noDataText: {
      textAlign: "center",
      padding: 20,
    },
    rowContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    // Custom Popup Styles
    customPopupOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    customPopupContainer: {
      width: "85%",
      minHeight: 150,
      borderRadius: 12,
      padding: 20,
      elevation: 5,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    customPopupTitle: {
      fontSize: 18,
      fontWeight: "700",
      marginBottom: 20,
      textAlign: "center",
    },
    customPopupActions: {
      flexDirection: "row",
      justifyContent: "space-around",
      gap: 10,
    },
    customPopupButton: {
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 6,
      minWidth: 120,
      alignItems: "center",
      backgroundColor: theme.colors.surfaceTint,
    },
    customPopupCancelButton: {
      backgroundColor: "transparent", // Cancel button transparent
    },
    customPopupButtonText: {
      fontSize: 16,
      fontWeight: "600",
    },
  });
