export type Language = "en" | "hi" | "mr";

export const EN_TRANSLATIONS = {
  "common.selected": "Selected",
  "common.ok": "OK",
  "common.cancel": "Cancel",
  "common.stay": "Stay",
  "common.openDashboard": "Open Dashboard",
  "common.english": "English",
  "common.hindi": "Hindi",
  "common.marathi": "Marathi",
  "branding.poweredBy": "Powered by",

  "actions.importDailyFile": "Import Daily File",
  "actions.importMonthlyFile": "Import Monthly File",
  "actions.importLoanFile": "Import Loan File",

  "import.category.daily": "Daily",
  "import.category.monthly": "Monthly",
  "import.category.loan": "Loan",
  "import.category.account": "Account",
  "import.category.different": "a different",
  "import.popup.wrongFileTitle": "Wrong file selected",
  "import.popup.wrongFileMessage":
    "This screen is for {{expectedCategory}} data, but the selected file looks like {{detectedCategory}} account data.\n\nPlease choose the correct file.",
  "import.popup.accountTypeLoadedTitle": "Account type already loaded",
  "import.popup.accountTypeLoadedMessage":
    "This account type is already loaded: {{lotLabel}}\n\nPlease select a different file (Daily/Monthly/Loan).",
  "import.popup.otherAgentFileTitle": "This file is not ours",
  "import.popup.otherAgentFileMessage":
    "This file is not for your registered agent.\nPlease upload your own file.\n\nRegistered: {{registeredAgentCode}} • {{registeredSocietyCode}}\nSelected: {{selectedAgentCode}} • {{selectedSocietyCode}}",
  "import.popup.duplicateFileTitle": "File already imported",
  "import.popup.duplicateFileMessage":
    "This exact file was already imported.\nPlease upload a new file to avoid duplicate data.",
  "import.popup.importedSignInFailedTitle": "Imported, but sign in failed",
  "import.popup.importedSignInFailedMessage":
    "Society: {{societyName}} ({{societyCode}})\nAgent: {{agentCode}}\nAccounts: {{accountsUpserted}}\n\nTry signing in manually.",
  "import.popup.importedTitle": "Imported",
  "import.popup.importedMessage":
    "Society: {{societyName}} ({{societyCode}})\nAgent: {{agentCode}}\nAccounts: {{accountsUpserted}}\nType: {{lotLabel}}",
  "import.popup.importFailedTitle": "Import failed",
  "import.screen.navTitleCategory": "Import {{category}} Data",
  "import.screen.navTitleDefault": "Import Account Data",
  "import.screen.titleAdd": "Add {{category}} Data (TXT or Excel)",
  "import.screen.titleImport": "Import {{category}} Data (TXT or Excel)",
  "import.screen.subtitleAdd":
    "Add a new {{category}} file. Existing data stays. PIN is set to 0000.",
  "import.screen.subtitleCategory":
    "Import only {{category}} file data. Existing data is kept, and collections are removed only after export. PIN is set to 0000.",
  "import.screen.subtitleAll":
    "Import agent report data shared by your admin. Existing data is kept, and collections are removed only after export. PIN is set to 0000.",
  "import.screen.registered": "Registered: {{societyName}} • {{agentName}}",
  "import.screen.registrationOptional":
    "Registration is optional. You can import without it.",
  "import.screen.guideTitle": "Quick Import Guide",
  "import.screen.guideSubtitle":
    "No fixed sample needed. The app auto-detects structure.",
  "import.screen.heroAddTitle": "Add {{category}} records safely",
  "import.screen.heroImportTitle": "Import {{category}} records in one step",
  "import.screen.heroText":
    "Pick a TXT/XLS/XLSX report and we automatically read headers, rows, and extra spaces.",
  "import.screen.step1Title": "Choose file",
  "import.screen.step1Text":
    "Select report shared by your admin from device storage.",
  "import.screen.step2Title": "Auto-parse",
  "import.screen.step2Text":
    "The app validates account type and imports rows automatically.",
  "import.screen.step3Title": "Start collecting",
  "import.screen.step3Text":
    "Open dashboard immediately after successful import.",
  "import.screen.tipCategory":
    "Import only {{category}} account files on this screen for best results.",
  "import.screen.tipAll":
    "Import only account files on this screen for best results.",
  "import.screen.buttonImporting": "Importing…",
  "import.screen.buttonPickAdd": "Pick {{category}} File & Add",
  "import.screen.buttonPickImport": "Pick {{category}} File & Import",
  "import.screen.buttonRefreshSession": "Refresh Session",
  "import.screen.buttonBack": "Back",
  "import.screen.loadingTitle": "Importing file",
  "import.screen.loadingMessage": "Reading the TXT/Excel data…",
  "labels.company": "Company",
  "labels.agent": "Agent",
  "profile.card.title": "Company & Agent",
  "profile.card.subtitle": "Current profile",
  "profile.button.add": "Add",
  "profile.button.change": "Change",
  "profile.item.agentLine": "Agent: {{agentCode}} • {{agentName}}",
  "sync.pending.title": "Pending",
  "sync.pending.collections": "Collections",
  "sync.pending.clientsLoaded": "Clients Loaded",
  "sync.export.title": "Export Separately",
  "sync.export.subtitleSelected":
    "Selected in Collect: {{category}} (highlighted below).",
  "sync.export.subtitleDefault":
    "Export Daily, Monthly, and Loan files separately.",
  "sync.export.buttonExporting": "Exporting…",
  "sync.export.buttonExport": "Export {{category}} ({{count}})",
  "sync.export.popup.clientDataDeleted":
    "Client data deleted for exported account types.",
  "sync.import.title": "Import Separately",
  "sync.import.buttonWithFormat": "{{label}} (TXT/Excel)",
  "sync.account.buttonGoToLoginRegister": "Go to Login / Register",
  "sync.account.buttonLogout": "Logout",
  "accounts.search.label": "Search Accounts",
  "accounts.search.placeholder": "Name or Account No",
  "accounts.filter.title": "Filter",
  "accounts.filter.pendingUntilExport": "Pending until export • {{lotLabel}}",
  "accounts.filter.allAccountTypes": "All account types",
  "accounts.filter.all": "All ({{count}})",
  "accounts.filter.collected": "Collected ({{count}})",
  "accounts.filter.remaining": "Remaining ({{count}})",
  "accounts.list.title": "Accounts ({{count}})",
  "accounts.list.subtitle": "Tap an account to view details.",
  "accounts.row.balance": "Balance",
  "accounts.status.collected": "Collected",
  "accounts.status.pending": "Pending",
  "collect.accountType.title": "Account Type",
  "collect.accountType.subtitle": "Selected type",
  "collect.accountType.buttonAdd": "Add",
  "collect.accountType.buttonChange": "Change",
  "collect.accountType.accessibilityAdd": "Add account type",
  "collect.accountType.accessibilityChange": "Change account type",
  "collect.accountType.modalTitle": "Change Account Type",
  "collect.accountType.modalCurrent": "Current: {{label}}",
  "collect.accountType.searchPlaceholder": "Search account type...",
  "collect.accountType.noResults":
    "No account type found for this search.",
  "collect.accountType.selected": "Selected",
  "collect.accountType.current": "Current",
  "collect.accountType.tap": "Tap",
  "collect.accountType.buttonApplySelect": "Apply Select",
  "collect.accountType.buttonAlreadySelected": "Already Select",
  "collect.accountType.accountsCount": "{{count}} accounts",
  "collect.accountType.optionsCount": "{{filtered}} / {{total}} options",
  "collect.search.label": "Search Account",
  "collect.search.placeholder": "Enter last 4 digits...",
  "collect.search.matchesTitle": "Matches",
  "collect.search.matchesSubtitle": "Results for: {{digits}}",
  "collect.search.noMatchesTitle": "No matches",
  "collect.search.noMatchesMessage": "Try different digits",
  "collect.pending.title": "Pending (Until Export)",
  "collect.pending.subtitle":
    "Entries remain here until you export from Sync.",
  "collect.pending.saved": "Saved",
  "collect.pending.remaining": "Remaining",
  "collect.pending.amount": "Amount",
  "collect.pending.progress":
    "{{percent}}% complete • {{pendingCount}} / {{totalAccounts}}",
  "collect.pending.emptyTitle": "No pending collections",
  "collect.pending.emptyMessage":
    "Saved collections stay here until exported.",
  "accountDetail.collect.title": "Collect (Pending until export)",
  "accountDetail.collect.subtitleSaved":
    "Saved and pending export: {{amount}} ({{date}})",
  "accountDetail.collect.subtitleNone":
    "No pending entry for this account.",
  "reports.filter.title": "History Filter",
  "reports.filter.subtitle": "Select a date to view export history.",
  "reports.history.title": "History ({{date}})",
  "reports.history.subtitleKnown":
    "Showing files with known collection count.",
  "reports.history.subtitleUnknown":
    "Showing files where collection count is unavailable.",
  "reports.history.subtitleAll":
    "Exports saved on this device. Tap to view details.",
  "reports.summary.savedFiles": "Saved files",
  "reports.summary.knownCollections": "Known collections ({{count}})",
  "reports.summary.unknownCountFiles": "Unknown count files",
  "reports.empty.noHistoryTitle": "No history",
  "reports.empty.noMatchingFilesTitle": "No matching files",
  "reports.empty.noExportFilesForDate":
    "No export files found for this date.",
  "reports.empty.noKnownFilesForDate":
    "No files with known collection count for this date.",
  "reports.empty.noUnknownFilesForDate":
    "No files with unknown collection count for this date.",
  "reports.item.collectionsUnavailable": "Collections: —",
  "reports.item.collectionsCount": "Collections: {{count}}",

  "navigation.tabs.collect": "Collect",
  "navigation.tabs.clients": "Clients",
  "navigation.tabs.reports": "Reports",
  "navigation.tabs.sync": "Sync",
  "navigation.stack.account": "Account",
  "navigation.stack.exportDetails": "Export Details",
  "navigation.stack.importAccountData": "Import Account Data",
  "navigation.theme.accessibilityLabel": "Select theme",
  "navigation.theme.modalTitle": "Choose Theme",
  "navigation.theme.modalMessage": "Select the app appearance style.",
  "navigation.language.accessibilityLabel": "Select language",
  "navigation.language.modalTitle": "Choose Language",
  "navigation.language.modalMessage": "Select your preferred app language.",

  "auth.shared.agentCode": "Agent Code",
  "auth.shared.pin": "PIN",

  "auth.login.title": "Welcome Back",
  "auth.login.subtitle": "Sign in to your account",
  "auth.login.agentCodePlaceholder": "e.g. AG01",
  "auth.login.pinPlaceholder": "Enter PIN",
  "auth.login.signIn": "Sign In",
  "auth.login.signingIn": "Signing In…",
  "auth.login.signInFailedTitle": "Sign in failed",
  "auth.login.signInFailedMessage": "Check Agent Code and PIN.",
  "auth.login.registerAgentPin": "Register Agent PIN",

  "auth.register.title": "Register",
  "auth.register.subtitle": "Create a secure PIN for your agent profile",
  "auth.register.agentCodePlaceholder": "e.g. AG001",
  "auth.register.newPin": "New PIN",
  "auth.register.newPinPlaceholder": "At least 4 digits",
  "auth.register.confirmPin": "Confirm PIN",
  "auth.register.confirmPinPlaceholder": "Re-enter PIN",
  "auth.register.pinTooShort": "PIN must be at least 4 digits.",
  "auth.register.pinMismatch": "PIN does not match.",
  "auth.register.savePin": "Save PIN",
  "auth.register.savingPin": "Saving…",
  "auth.register.backToSignIn": "Back to Sign In",
  "auth.register.missingAgentCodeTitle": "Missing agent code",
  "auth.register.missingAgentCodeMessage": "Enter a valid agent code.",
  "auth.register.invalidPinTitle": "Invalid PIN",
  "auth.register.invalidPinMessage": "PIN must be at least 4 digits.",
  "auth.register.pinMismatchTitle": "PIN mismatch",
  "auth.register.pinMismatchMessage": "PIN and confirm PIN must match.",
  "auth.register.pinSavedTitle": "PIN saved",
  "auth.register.pinSavedMessage": "PIN saved. Please sign in once from Login.",
  "auth.register.agentCodeNotUniqueTitle": "Agent code not unique",
  "auth.register.agentCodeNotUniqueMessage":
    "This agent code exists in multiple societies. Import your file first for automatic sign in, then try again.",
  "auth.register.agentNotFoundTitle": "Agent not found",
  "auth.register.agentNotFoundMessage":
    "No active agent found for this code. Import your data file first, then create PIN.",
} as const;

export type TranslationKey = keyof typeof EN_TRANSLATIONS;
export type TranslationParams = Record<string, string | number>;

const HI_TRANSLATIONS: Partial<Record<TranslationKey, string>> = {
  "common.selected": "चयनित",
  "common.ok": "ठीक है",
  "common.cancel": "रद्द करें",
  "common.stay": "यहीं रहें",
  "common.openDashboard": "डैशबोर्ड खोलें",
  "common.english": "अंग्रेजी",
  "common.hindi": "हिंदी",
  "common.marathi": "मराठी",
  "branding.poweredBy": "द्वारा संचालित",

  "actions.importDailyFile": "डेली फाइल इम्पोर्ट करें",
  "actions.importMonthlyFile": "मंथली फाइल इम्पोर्ट करें",
  "actions.importLoanFile": "लोन फाइल इम्पोर्ट करें",

  "import.category.daily": "डेली",
  "import.category.monthly": "मंथली",
  "import.category.loan": "लोन",
  "import.category.account": "अकाउंट",
  "import.category.different": "किसी दूसरे",
  "import.popup.wrongFileTitle": "गलत फाइल चुनी गई",
  "import.popup.wrongFileMessage":
    "यह स्क्रीन {{expectedCategory}} डेटा के लिए है, लेकिन चुनी गई फाइल {{detectedCategory}} अकाउंट डेटा जैसी लग रही है।\n\nकृपया सही फाइल चुनें।",
  "import.popup.accountTypeLoadedTitle": "अकाउंट टाइप पहले से लोड है",
  "import.popup.accountTypeLoadedMessage":
    "यह अकाउंट टाइप पहले से लोड है: {{lotLabel}}\n\nकृपया अलग फाइल चुनें (Daily/Monthly/Loan)।",
  "import.popup.otherAgentFileTitle": "यह फाइल हमारी नहीं है",
  "import.popup.otherAgentFileMessage":
    "यह फाइल आपके रजिस्टर्ड एजेंट की नहीं है।\nकृपया अपनी फाइल अपलोड करें।\n\nरजिस्टर्ड: {{registeredAgentCode}} • {{registeredSocietyCode}}\nचुनी गई: {{selectedAgentCode}} • {{selectedSocietyCode}}",
  "import.popup.duplicateFileTitle": "फाइल पहले ही इम्पोर्ट हो चुकी है",
  "import.popup.duplicateFileMessage":
    "यह वही फाइल पहले इम्पोर्ट हो चुकी है।\nडुप्लिकेट डेटा से बचने के लिए नई फाइल अपलोड करें।",
  "import.popup.importedSignInFailedTitle": "इम्पोर्ट हुआ, लेकिन साइन इन विफल",
  "import.popup.importedSignInFailedMessage":
    "सोसायटी: {{societyName}} ({{societyCode}})\nएजेंट: {{agentCode}}\nअकाउंट: {{accountsUpserted}}\n\nकृपया मैनुअली साइन इन करें।",
  "import.popup.importedTitle": "इम्पोर्ट सफल",
  "import.popup.importedMessage":
    "सोसायटी: {{societyName}} ({{societyCode}})\nएजेंट: {{agentCode}}\nअकाउंट: {{accountsUpserted}}\nटाइप: {{lotLabel}}",
  "import.popup.importFailedTitle": "इम्पोर्ट विफल",
  "import.screen.navTitleCategory": "{{category}} डेटा इम्पोर्ट",
  "import.screen.navTitleDefault": "अकाउंट डेटा इम्पोर्ट",
  "import.screen.titleAdd": "{{category}} डेटा जोड़ें (TXT या Excel)",
  "import.screen.titleImport": "{{category}} डेटा इम्पोर्ट करें (TXT या Excel)",
  "import.screen.subtitleAdd":
    "नई {{category}} फाइल जोड़ें। मौजूदा डेटा रहेगा। PIN 0000 पर सेट है।",
  "import.screen.subtitleCategory":
    "यहां केवल {{category}} फाइल डेटा इम्पोर्ट करें। मौजूदा डेटा रखा जाएगा, और कलेक्शन केवल एक्सपोर्ट के बाद हटेंगे। PIN 0000 पर सेट है।",
  "import.screen.subtitleAll":
    "अपने एडमिन द्वारा शेयर की गई एजेंट रिपोर्ट फाइल इम्पोर्ट करें। मौजूदा डेटा रखा जाएगा, और कलेक्शन केवल एक्सपोर्ट के बाद हटेंगे। PIN 0000 पर सेट है।",
  "import.screen.registered": "रजिस्टर्ड: {{societyName}} • {{agentName}}",
  "import.screen.registrationOptional":
    "रजिस्ट्रेशन वैकल्पिक है। आप बिना रजिस्ट्रेशन के इम्पोर्ट कर सकते हैं।",
  "import.screen.guideTitle": "क्विक इम्पोर्ट गाइड",
  "import.screen.guideSubtitle":
    "फिक्स्ड सैंपल की जरूरत नहीं। ऐप खुद स्ट्रक्चर पहचानता है।",
  "import.screen.heroAddTitle": "{{category}} रिकॉर्ड सुरक्षित रूप से जोड़ें",
  "import.screen.heroImportTitle": "{{category}} रिकॉर्ड एक स्टेप में इम्पोर्ट करें",
  "import.screen.heroText":
    "TXT/XLS/XLSX रिपोर्ट चुनें, हम हेडर, रो और अतिरिक्त स्पेस अपने आप पढ़ लेते हैं।",
  "import.screen.step1Title": "फाइल चुनें",
  "import.screen.step1Text":
    "डिवाइस स्टोरेज से एडमिन द्वारा शेयर की गई रिपोर्ट चुनें।",
  "import.screen.step2Title": "ऑटो-पार्स",
  "import.screen.step2Text":
    "ऐप अकाउंट टाइप जांचकर रो अपने आप इम्पोर्ट करता है।",
  "import.screen.step3Title": "कलेक्शन शुरू करें",
  "import.screen.step3Text": "सफल इम्पोर्ट के बाद तुरंत डैशबोर्ड खोलें।",
  "import.screen.tipCategory":
    "बेहतर परिणाम के लिए इस स्क्रीन पर केवल {{category}} अकाउंट फाइलें इम्पोर्ट करें।",
  "import.screen.tipAll":
    "बेहतर परिणाम के लिए इस स्क्रीन पर केवल अकाउंट फाइलें इम्पोर्ट करें।",
  "import.screen.buttonImporting": "इम्पोर्ट हो रहा है…",
  "import.screen.buttonPickAdd": "{{category}} फाइल चुनें और जोड़ें",
  "import.screen.buttonPickImport": "{{category}} फाइल चुनें और इम्पोर्ट करें",
  "import.screen.buttonRefreshSession": "सेशन रिफ्रेश करें",
  "import.screen.buttonBack": "वापस",
  "import.screen.loadingTitle": "फाइल इम्पोर्ट हो रही है",
  "import.screen.loadingMessage": "TXT/Excel डेटा पढ़ा जा रहा है…",
  "labels.company": "कंपनी",
  "labels.agent": "एजेंट",
  "profile.card.title": "कंपनी और एजेंट",
  "profile.card.subtitle": "वर्तमान प्रोफ़ाइल",
  "profile.button.add": "जोड़ें",
  "profile.button.change": "बदलें",
  "profile.item.agentLine": "एजेंट: {{agentCode}} • {{agentName}}",
  "sync.pending.title": "पेंडिंग",
  "sync.pending.collections": "कलेक्शन",
  "sync.pending.clientsLoaded": "लोड किए गए ग्राहक",
  "sync.export.title": "अलग-अलग एक्सपोर्ट",
  "sync.export.subtitleSelected":
    "कलेक्ट में चयनित: {{category}} (नीचे हाइलाइट किया गया)।",
  "sync.export.subtitleDefault":
    "डेली, मंथली और लोन फाइलें अलग-अलग एक्सपोर्ट करें।",
  "sync.export.buttonExporting": "एक्सपोर्ट हो रहा है…",
  "sync.export.buttonExport": "{{category}} एक्सपोर्ट ({{count}})",
  "sync.export.popup.clientDataDeleted":
    "एक्सपोर्ट किए गए अकाउंट टाइप का क्लाइंट डेटा हटा दिया गया है।",
  "sync.import.title": "अलग-अलग इम्पोर्ट",
  "sync.import.buttonWithFormat": "{{label}} (TXT/Excel)",
  "sync.account.buttonGoToLoginRegister": "लॉगिन / रजिस्टर पर जाएं",
  "sync.account.buttonLogout": "लॉगआउट",
  "accounts.search.label": "खाते खोजें",
  "accounts.search.placeholder": "नाम या खाता नंबर",
  "accounts.filter.title": "फिल्टर",
  "accounts.filter.pendingUntilExport": "एक्सपोर्ट तक पेंडिंग • {{lotLabel}}",
  "accounts.filter.allAccountTypes": "सभी अकाउंट टाइप",
  "accounts.filter.all": "सभी ({{count}})",
  "accounts.filter.collected": "वसूल ({{count}})",
  "accounts.filter.remaining": "बाकी ({{count}})",
  "accounts.list.title": "खाते ({{count}})",
  "accounts.list.subtitle": "विवरण देखने के लिए खाते पर टैप करें।",
  "accounts.row.balance": "बैलेंस",
  "accounts.status.collected": "वसूल",
  "accounts.status.pending": "पेंडिंग",
  "collect.accountType.title": "अकाउंट टाइप",
  "collect.accountType.subtitle": "चयनित टाइप",
  "collect.accountType.buttonAdd": "जोड़ें",
  "collect.accountType.buttonChange": "बदलें",
  "collect.accountType.accessibilityAdd": "अकाउंट टाइप जोड़ें",
  "collect.accountType.accessibilityChange": "अकाउंट टाइप बदलें",
  "collect.accountType.modalTitle": "अकाउंट टाइप बदलें",
  "collect.accountType.modalCurrent": "वर्तमान: {{label}}",
  "collect.accountType.searchPlaceholder": "अकाउंट टाइप खोजें...",
  "collect.accountType.noResults":
    "इस खोज के लिए कोई अकाउंट टाइप नहीं मिला।",
  "collect.accountType.selected": "चयनित",
  "collect.accountType.current": "वर्तमान",
  "collect.accountType.tap": "टैप करें",
  "collect.accountType.buttonApplySelect": "चयन लागू करें",
  "collect.accountType.buttonAlreadySelected": "पहले से चयनित",
  "collect.accountType.accountsCount": "{{count}} खाते",
  "collect.accountType.optionsCount": "{{filtered}} / {{total}} विकल्प",
  "collect.search.label": "खाता खोजें",
  "collect.search.placeholder": "आखिरी 4 अंक दर्ज करें...",
  "collect.search.matchesTitle": "मिले परिणाम",
  "collect.search.matchesSubtitle": "परिणाम: {{digits}}",
  "collect.search.noMatchesTitle": "कोई मिलान नहीं",
  "collect.search.noMatchesMessage": "अलग अंक आज़माएं",
  "collect.pending.title": "पेंडिंग (एक्सपोर्ट तक)",
  "collect.pending.subtitle":
    "जब तक आप Sync से एक्सपोर्ट नहीं करते, एंट्री यहां रहेंगी।",
  "collect.pending.saved": "सेव",
  "collect.pending.remaining": "बाकी",
  "collect.pending.amount": "राशि",
  "collect.pending.progress":
    "{{percent}}% पूरा • {{pendingCount}} / {{totalAccounts}}",
  "collect.pending.emptyTitle": "कोई पेंडिंग कलेक्शन नहीं",
  "collect.pending.emptyMessage":
    "सेव कलेक्शन एक्सपोर्ट होने तक यहीं रहते हैं।",
  "accountDetail.collect.title": "कलेक्ट (एक्सपोर्ट तक पेंडिंग)",
  "accountDetail.collect.subtitleSaved":
    "सेव और एक्सपोर्ट पेंडिंग: {{amount}} ({{date}})",
  "accountDetail.collect.subtitleNone":
    "इस खाते के लिए कोई पेंडिंग एंट्री नहीं है।",
  "reports.filter.title": "हिस्ट्री फिल्टर",
  "reports.filter.subtitle": "एक्सपोर्ट हिस्ट्री देखने के लिए तारीख चुनें।",
  "reports.history.title": "हिस्ट्री ({{date}})",
  "reports.history.subtitleKnown":
    "ज्ञात कलेक्शन काउंट वाली फाइलें दिख रही हैं।",
  "reports.history.subtitleUnknown":
    "जिन फाइलों में कलेक्शन काउंट उपलब्ध नहीं है, वे दिख रही हैं।",
  "reports.history.subtitleAll":
    "इस डिवाइस पर सेव एक्सपोर्ट। विवरण देखने के लिए टैप करें।",
  "reports.summary.savedFiles": "सेव फाइलें",
  "reports.summary.knownCollections": "ज्ञात कलेक्शन ({{count}})",
  "reports.summary.unknownCountFiles": "अज्ञात काउंट फाइलें",
  "reports.empty.noHistoryTitle": "कोई हिस्ट्री नहीं",
  "reports.empty.noMatchingFilesTitle": "मिलती-जुलती फाइल नहीं",
  "reports.empty.noExportFilesForDate":
    "इस तारीख के लिए कोई एक्सपोर्ट फाइल नहीं मिली।",
  "reports.empty.noKnownFilesForDate":
    "इस तारीख के लिए ज्ञात कलेक्शन काउंट वाली फाइलें नहीं मिलीं।",
  "reports.empty.noUnknownFilesForDate":
    "इस तारीख के लिए अज्ञात कलेक्शन काउंट वाली फाइलें नहीं मिलीं।",
  "reports.item.collectionsUnavailable": "कलेक्शन: —",
  "reports.item.collectionsCount": "कलेक्शन: {{count}}",

  "navigation.tabs.collect": "कलेक्शन",
  "navigation.tabs.clients": "ग्राहक",
  "navigation.tabs.reports": "रिपोर्ट्स",
  "navigation.tabs.sync": "सिंक",
  "navigation.stack.account": "खाता",
  "navigation.stack.exportDetails": "एक्सपोर्ट विवरण",
  "navigation.stack.importAccountData": "अकाउंट डेटा इम्पोर्ट",
  "navigation.theme.accessibilityLabel": "थीम चुनें",
  "navigation.theme.modalTitle": "थीम चुनें",
  "navigation.theme.modalMessage": "ऐप का दिखावट स्टाइल चुनें।",
  "navigation.language.accessibilityLabel": "भाषा चुनें",
  "navigation.language.modalTitle": "भाषा चुनें",
  "navigation.language.modalMessage": "ऐप की पसंदीदा भाषा चुनें।",

  "auth.shared.agentCode": "एजेंट कोड",
  "auth.shared.pin": "पिन",

  "auth.login.title": "वापसी पर स्वागत है",
  "auth.login.subtitle": "अपने खाते में साइन इन करें",
  "auth.login.agentCodePlaceholder": "जैसे AG01",
  "auth.login.pinPlaceholder": "पिन दर्ज करें",
  "auth.login.signIn": "साइन इन",
  "auth.login.signingIn": "साइन इन हो रहा है…",
  "auth.login.signInFailedTitle": "साइन इन विफल",
  "auth.login.signInFailedMessage": "एजेंट कोड और पिन जांचें।",
  "auth.login.registerAgentPin": "एजेंट पिन रजिस्टर करें",

  "auth.register.title": "रजिस्टर",
  "auth.register.subtitle": "अपने एजेंट प्रोफाइल के लिए सुरक्षित पिन बनाएं",
  "auth.register.agentCodePlaceholder": "जैसे AG001",
  "auth.register.newPin": "नया पिन",
  "auth.register.newPinPlaceholder": "कम से कम 4 अंक",
  "auth.register.confirmPin": "पिन की पुष्टि करें",
  "auth.register.confirmPinPlaceholder": "पिन दोबारा दर्ज करें",
  "auth.register.pinTooShort": "पिन कम से कम 4 अंकों का होना चाहिए।",
  "auth.register.pinMismatch": "पिन मेल नहीं खाता।",
  "auth.register.savePin": "पिन सेव करें",
  "auth.register.savingPin": "सेव हो रहा है…",
  "auth.register.backToSignIn": "साइन इन पर वापस जाएं",
  "auth.register.missingAgentCodeTitle": "एजेंट कोड नहीं मिला",
  "auth.register.missingAgentCodeMessage": "कृपया सही एजेंट कोड दर्ज करें।",
  "auth.register.invalidPinTitle": "अमान्य पिन",
  "auth.register.invalidPinMessage": "पिन कम से कम 4 अंकों का होना चाहिए।",
  "auth.register.pinMismatchTitle": "पिन मेल नहीं खाता",
  "auth.register.pinMismatchMessage": "पिन और कन्फर्म पिन समान होना चाहिए।",
  "auth.register.pinSavedTitle": "पिन सेव हो गया",
  "auth.register.pinSavedMessage":
    "पिन सेव हो गया। कृपया लॉगिन स्क्रीन से एक बार साइन इन करें।",
  "auth.register.agentCodeNotUniqueTitle": "एजेंट कोड यूनिक नहीं है",
  "auth.register.agentCodeNotUniqueMessage":
    "यह एजेंट कोड कई सोसायटी में मौजूद है। पहले फाइल इम्पोर्ट करें, फिर दोबारा कोशिश करें।",
  "auth.register.agentNotFoundTitle": "एजेंट नहीं मिला",
  "auth.register.agentNotFoundMessage":
    "इस कोड के लिए कोई सक्रिय एजेंट नहीं मिला। पहले डेटा फाइल इम्पोर्ट करें, फिर पिन बनाएं।",
};

const MR_TRANSLATIONS: Partial<Record<TranslationKey, string>> = {
  "common.selected": "निवडलेले",
  "common.ok": "ठीक आहे",
  "common.cancel": "रद्द करा",
  "common.stay": "इथेच रहा",
  "common.openDashboard": "डॅशबोर्ड उघडा",
  "common.english": "इंग्रजी",
  "common.hindi": "हिंदी",
  "common.marathi": "मराठी",
  "branding.poweredBy": "यांच्या द्वारे समर्थित",

  "actions.importDailyFile": "दैनिक फाइल आयात करा",
  "actions.importMonthlyFile": "मासिक फाइल आयात करा",
  "actions.importLoanFile": "कर्ज फाइल आयात करा",

  "import.category.daily": "दैनिक",
  "import.category.monthly": "मासिक",
  "import.category.loan": "कर्ज",
  "import.category.account": "खाते",
  "import.category.different": "दुसऱ्या प्रकारच्या",
  "import.popup.wrongFileTitle": "चुकीची फाइल निवडली",
  "import.popup.wrongFileMessage":
    "ही स्क्रीन {{expectedCategory}} डेटासाठी आहे, पण निवडलेली फाइल {{detectedCategory}} खाते डेटासारखी दिसते.\n\nकृपया योग्य फाइल निवडा.",
  "import.popup.accountTypeLoadedTitle": "खात्याचा प्रकार आधीच लोड आहे",
  "import.popup.accountTypeLoadedMessage":
    "हा खात्याचा प्रकार आधीच लोड आहे: {{lotLabel}}\n\nकृपया वेगळी फाइल निवडा (Daily/Monthly/Loan).",
  "import.popup.otherAgentFileTitle": "ही फाइल आमची नाही",
  "import.popup.otherAgentFileMessage":
    "ही फाइल तुमच्या नोंदणीकृत एजंटसाठी नाही.\nकृपया तुमची स्वतःची फाइल अपलोड करा.\n\nनोंदणीकृत: {{registeredAgentCode}} • {{registeredSocietyCode}}\nनिवडलेले: {{selectedAgentCode}} • {{selectedSocietyCode}}",
  "import.popup.duplicateFileTitle": "फाइल आधीच आयात झाली आहे",
  "import.popup.duplicateFileMessage":
    "हीच फाइल आधी आयात झाली आहे.\nडुप्लिकेट डेटा टाळण्यासाठी नवीन फाइल अपलोड करा.",
  "import.popup.importedSignInFailedTitle": "आयात झाले, पण साइन इन अयशस्वी",
  "import.popup.importedSignInFailedMessage":
    "सोसायटी: {{societyName}} ({{societyCode}})\nएजंट: {{agentCode}}\nखाती: {{accountsUpserted}}\n\nकृपया हाताने साइन इन करा.",
  "import.popup.importedTitle": "आयात पूर्ण",
  "import.popup.importedMessage":
    "सोसायटी: {{societyName}} ({{societyCode}})\nएजंट: {{agentCode}}\nखाती: {{accountsUpserted}}\nप्रकार: {{lotLabel}}",
  "import.popup.importFailedTitle": "आयात अयशस्वी",
  "import.screen.navTitleCategory": "{{category}} डेटा आयात",
  "import.screen.navTitleDefault": "खाते डेटा आयात",
  "import.screen.titleAdd": "{{category}} डेटा जोडा (TXT किंवा Excel)",
  "import.screen.titleImport": "{{category}} डेटा आयात करा (TXT किंवा Excel)",
  "import.screen.subtitleAdd":
    "नवीन {{category}} फाइल जोडा. विद्यमान डेटा तसाच राहील. PIN 0000 सेट आहे.",
  "import.screen.subtitleCategory":
    "या स्क्रीनवर फक्त {{category}} फाइल डेटा आयात करा. विद्यमान डेटा जतन राहील, आणि वसुली फक्त एक्सपोर्टनंतर हटवली जाईल. PIN 0000 सेट आहे.",
  "import.screen.subtitleAll":
    "तुमच्या अॅडमिनने शेअर केलेली एजंट रिपोर्ट फाइल आयात करा. विद्यमान डेटा जतन राहील, आणि वसुली फक्त एक्सपोर्टनंतर हटवली जाईल. PIN 0000 सेट आहे.",
  "import.screen.registered": "नोंदणीकृत: {{societyName}} • {{agentName}}",
  "import.screen.registrationOptional":
    "नोंदणी ऐच्छिक आहे. नोंदणीशिवायही आयात करू शकता.",
  "import.screen.guideTitle": "त्वरित आयात मार्गदर्शक",
  "import.screen.guideSubtitle":
    "ठराविक नमुना आवश्यक नाही. अॅप रचना आपोआप ओळखते.",
  "import.screen.heroAddTitle": "{{category}} नोंदी सुरक्षितपणे जोडा",
  "import.screen.heroImportTitle": "{{category}} नोंदी एका टप्प्यात आयात करा",
  "import.screen.heroText":
    "TXT/XLS/XLSX रिपोर्ट निवडा; आम्ही हेडर, ओळी आणि अतिरिक्त जागा आपोआप वाचतो.",
  "import.screen.step1Title": "फाइल निवडा",
  "import.screen.step1Text":
    "डिव्हाइस स्टोरेजमधून अॅडमिनने शेअर केलेला रिपोर्ट निवडा.",
  "import.screen.step2Title": "ऑटो-पार्स",
  "import.screen.step2Text":
    "अॅप खात्याचा प्रकार पडताळून ओळी आपोआप आयात करते.",
  "import.screen.step3Title": "वसुली सुरू करा",
  "import.screen.step3Text": "यशस्वी आयातीनंतर लगेच डॅशबोर्ड उघडा.",
  "import.screen.tipCategory":
    "उत्तम निकालासाठी या स्क्रीनवर फक्त {{category}} खाते फाइल्स आयात करा.",
  "import.screen.tipAll":
    "उत्तम निकालासाठी या स्क्रीनवर फक्त खाते फाइल्स आयात करा.",
  "import.screen.buttonImporting": "आयात होत आहे…",
  "import.screen.buttonPickAdd": "{{category}} फाइल निवडा आणि जोडा",
  "import.screen.buttonPickImport": "{{category}} फाइल निवडा आणि आयात करा",
  "import.screen.buttonRefreshSession": "सेशन रिफ्रेश करा",
  "import.screen.buttonBack": "मागे",
  "import.screen.loadingTitle": "फाइल आयात होत आहे",
  "import.screen.loadingMessage": "TXT/Excel डेटा वाचला जात आहे…",
  "labels.company": "कंपनी",
  "labels.agent": "एजंट",
  "profile.card.title": "कंपनी आणि एजंट",
  "profile.card.subtitle": "सध्याचा प्रोफाइल",
  "profile.button.add": "जोडा",
  "profile.button.change": "बदला",
  "profile.item.agentLine": "एजंट: {{agentCode}} • {{agentName}}",
  "sync.pending.title": "प्रलंबित",
  "sync.pending.collections": "वसुली",
  "sync.pending.clientsLoaded": "लोड केलेले ग्राहक",
  "sync.export.title": "स्वतंत्र एक्सपोर्ट",
  "sync.export.subtitleSelected":
    "कलेक्टमध्ये निवडलेले: {{category}} (खाली हायलाइट केलेले).",
  "sync.export.subtitleDefault":
    "दैनिक, मासिक आणि कर्ज फाइल्स वेगवेगळ्या एक्सपोर्ट करा.",
  "sync.export.buttonExporting": "एक्सपोर्ट होत आहे…",
  "sync.export.buttonExport": "{{category}} एक्सपोर्ट ({{count}})",
  "sync.export.popup.clientDataDeleted":
    "एक्सपोर्ट केलेल्या खाते प्रकारांसाठी क्लायंट डेटा हटवला गेला आहे.",
  "sync.import.title": "स्वतंत्र आयात",
  "sync.import.buttonWithFormat": "{{label}} (TXT/Excel)",
  "sync.account.buttonGoToLoginRegister": "लॉगिन / नोंदणीकडे जा",
  "sync.account.buttonLogout": "लॉगआउट",
  "accounts.search.label": "खाती शोधा",
  "accounts.search.placeholder": "नाव किंवा खाते क्रमांक",
  "accounts.filter.title": "फिल्टर",
  "accounts.filter.pendingUntilExport":
    "एक्सपोर्टपर्यंत प्रलंबित • {{lotLabel}}",
  "accounts.filter.allAccountTypes": "सर्व खाते प्रकार",
  "accounts.filter.all": "सर्व ({{count}})",
  "accounts.filter.collected": "वसूल ({{count}})",
  "accounts.filter.remaining": "उर्वरित ({{count}})",
  "accounts.list.title": "खाती ({{count}})",
  "accounts.list.subtitle": "तपशील पाहण्यासाठी खात्यावर टॅप करा.",
  "accounts.row.balance": "शिल्लक",
  "accounts.status.collected": "वसूल",
  "accounts.status.pending": "प्रलंबित",
  "collect.accountType.title": "खाते प्रकार",
  "collect.accountType.subtitle": "निवडलेला प्रकार",
  "collect.accountType.buttonAdd": "जोडा",
  "collect.accountType.buttonChange": "बदला",
  "collect.accountType.accessibilityAdd": "खाते प्रकार जोडा",
  "collect.accountType.accessibilityChange": "खाते प्रकार बदला",
  "collect.accountType.modalTitle": "खाते प्रकार बदला",
  "collect.accountType.modalCurrent": "सध्याचे: {{label}}",
  "collect.accountType.searchPlaceholder": "खाते प्रकार शोधा...",
  "collect.accountType.noResults":
    "या शोधासाठी कोणताही खाते प्रकार सापडला नाही.",
  "collect.accountType.selected": "निवडलेले",
  "collect.accountType.current": "सध्याचे",
  "collect.accountType.tap": "टॅप करा",
  "collect.accountType.buttonApplySelect": "निवड लागू करा",
  "collect.accountType.buttonAlreadySelected": "आधीच निवडलेले",
  "collect.accountType.accountsCount": "{{count}} खाती",
  "collect.accountType.optionsCount": "{{filtered}} / {{total}} पर्याय",
  "collect.search.label": "खाते शोधा",
  "collect.search.placeholder": "शेवटचे 4 अंक टाका...",
  "collect.search.matchesTitle": "जुळणारे",
  "collect.search.matchesSubtitle": "निकाल: {{digits}}",
  "collect.search.noMatchesTitle": "जुळणारे नाही",
  "collect.search.noMatchesMessage": "वेगळे अंक वापरून पहा",
  "collect.pending.title": "प्रलंबित (एक्सपोर्टपर्यंत)",
  "collect.pending.subtitle":
    "तुम्ही Sync मधून एक्सपोर्ट करेपर्यंत नोंदी येथे राहतात.",
  "collect.pending.saved": "जतन",
  "collect.pending.remaining": "उर्वरित",
  "collect.pending.amount": "रक्कम",
  "collect.pending.progress":
    "{{percent}}% पूर्ण • {{pendingCount}} / {{totalAccounts}}",
  "collect.pending.emptyTitle": "प्रलंबित वसुली नाही",
  "collect.pending.emptyMessage":
    "जतन केलेली वसुली एक्सपोर्ट होईपर्यंत येथे राहते.",
  "accountDetail.collect.title": "वसुली (एक्सपोर्टपर्यंत प्रलंबित)",
  "accountDetail.collect.subtitleSaved":
    "जतन आणि एक्सपोर्ट प्रलंबित: {{amount}} ({{date}})",
  "accountDetail.collect.subtitleNone":
    "या खात्यासाठी कोणतीही प्रलंबित नोंद नाही.",
  "reports.filter.title": "इतिहास फिल्टर",
  "reports.filter.subtitle": "एक्सपोर्ट इतिहास पाहण्यासाठी तारीख निवडा.",
  "reports.history.title": "इतिहास ({{date}})",
  "reports.history.subtitleKnown":
    "ज्ञात वसुली संख्या असलेल्या फाइल्स दाखवत आहोत.",
  "reports.history.subtitleUnknown":
    "ज्या फाइल्समध्ये वसुली संख्या उपलब्ध नाही त्या दाखवत आहोत.",
  "reports.history.subtitleAll":
    "या डिव्हाइसवर जतन केलेले एक्सपोर्ट. तपशील पाहण्यासाठी टॅप करा.",
  "reports.summary.savedFiles": "जतन केलेल्या फाइल्स",
  "reports.summary.knownCollections": "ज्ञात वसुली ({{count}})",
  "reports.summary.unknownCountFiles": "अज्ञात संख्या फाइल्स",
  "reports.empty.noHistoryTitle": "इतिहास नाही",
  "reports.empty.noMatchingFilesTitle": "जुळणाऱ्या फाइल्स नाहीत",
  "reports.empty.noExportFilesForDate":
    "या तारखेसाठी कोणतीही एक्सपोर्ट फाइल सापडली नाही.",
  "reports.empty.noKnownFilesForDate":
    "या तारखेसाठी ज्ञात वसुली संख्या असलेल्या फाइल्स नाहीत.",
  "reports.empty.noUnknownFilesForDate":
    "या तारखेसाठी अज्ञात वसुली संख्या असलेल्या फाइल्स नाहीत.",
  "reports.item.collectionsUnavailable": "वसुली: —",
  "reports.item.collectionsCount": "वसुली: {{count}}",

  "navigation.tabs.collect": "वसुली",
  "navigation.tabs.clients": "ग्राहक",
  "navigation.tabs.reports": "अहवाल",
  "navigation.tabs.sync": "सिंक",
  "navigation.stack.account": "खाते",
  "navigation.stack.exportDetails": "एक्सपोर्ट तपशील",
  "navigation.stack.importAccountData": "खाते डेटा आयात",
  "navigation.theme.accessibilityLabel": "थीम निवडा",
  "navigation.theme.modalTitle": "थीम निवडा",
  "navigation.theme.modalMessage": "अॅपचे दिसणे निवडा.",
  "navigation.language.accessibilityLabel": "भाषा निवडा",
  "navigation.language.modalTitle": "भाषा निवडा",
  "navigation.language.modalMessage": "अॅपची पसंतीची भाषा निवडा.",

  "auth.shared.agentCode": "एजंट कोड",
  "auth.shared.pin": "पिन",

  "auth.login.title": "पुन्हा स्वागत आहे",
  "auth.login.subtitle": "तुमच्या खात्यात साइन इन करा",
  "auth.login.agentCodePlaceholder": "उदा. AG01",
  "auth.login.pinPlaceholder": "पिन टाका",
  "auth.login.signIn": "साइन इन",
  "auth.login.signingIn": "साइन इन होत आहे…",
  "auth.login.signInFailedTitle": "साइन इन अयशस्वी",
  "auth.login.signInFailedMessage": "एजंट कोड आणि पिन तपासा.",
  "auth.login.registerAgentPin": "एजंट पिन नोंदणी करा",

  "auth.register.title": "नोंदणी",
  "auth.register.subtitle": "तुमच्या एजंट प्रोफाइलसाठी सुरक्षित पिन तयार करा",
  "auth.register.agentCodePlaceholder": "उदा. AG001",
  "auth.register.newPin": "नवीन पिन",
  "auth.register.newPinPlaceholder": "किमान 4 अंक",
  "auth.register.confirmPin": "पिनची पुष्टी करा",
  "auth.register.confirmPinPlaceholder": "पिन पुन्हा टाका",
  "auth.register.pinTooShort": "पिन किमान 4 अंकांचा असावा.",
  "auth.register.pinMismatch": "पिन जुळत नाही.",
  "auth.register.savePin": "पिन जतन करा",
  "auth.register.savingPin": "जतन होत आहे…",
  "auth.register.backToSignIn": "साइन इनकडे परत जा",
  "auth.register.missingAgentCodeTitle": "एजंट कोड नाही",
  "auth.register.missingAgentCodeMessage": "वैध एजंट कोड टाका.",
  "auth.register.invalidPinTitle": "अवैध पिन",
  "auth.register.invalidPinMessage": "पिन किमान 4 अंकांचा असावा.",
  "auth.register.pinMismatchTitle": "पिन जुळत नाही",
  "auth.register.pinMismatchMessage":
    "पिन आणि पुष्टी पिन सारखे असणे आवश्यक आहे.",
  "auth.register.pinSavedTitle": "पिन जतन झाला",
  "auth.register.pinSavedMessage":
    "पिन जतन झाला. कृपया लॉगिनमधून एकदा साइन इन करा.",
  "auth.register.agentCodeNotUniqueTitle": "एजंट कोड अद्वितीय नाही",
  "auth.register.agentCodeNotUniqueMessage":
    "हा एजंट कोड अनेक सोसायटींमध्ये आहे. प्रथम फाइल आयात करा, नंतर पुन्हा प्रयत्न करा.",
  "auth.register.agentNotFoundTitle": "एजंट सापडला नाही",
  "auth.register.agentNotFoundMessage":
    "या कोडसाठी सक्रिय एजंट सापडला नाही. प्रथम डेटा फाइल आयात करा, नंतर पिन तयार करा.",
};

const TRANSLATIONS: Record<Language, Partial<Record<TranslationKey, string>>> =
  {
    en: EN_TRANSLATIONS,
    hi: HI_TRANSLATIONS,
    mr: MR_TRANSLATIONS,
  };

export const LANGUAGE_OPTIONS: ReadonlyArray<{
  language: Language;
  labelKey: TranslationKey;
  icon: string;
}> = [
  { language: "en", labelKey: "common.english", icon: "language-outline" },
  { language: "hi", labelKey: "common.hindi", icon: "globe-outline" },
  { language: "mr", labelKey: "common.marathi", icon: "flag-outline" },
];

export function isLanguage(value: string): value is Language {
  return value === "en" || value === "hi" || value === "mr";
}

export function translate(
  language: Language,
  key: TranslationKey,
  params?: TranslationParams
): string {
  const message = TRANSLATIONS[language][key] ?? EN_TRANSLATIONS[key] ?? key;
  if (!params) return message;
  return message.replace(/\{\{(\w+)\}\}/g, (match, token: string) => {
    const value = params[token];
    if (value === undefined || value === null) return match;
    return String(value);
  });
}
