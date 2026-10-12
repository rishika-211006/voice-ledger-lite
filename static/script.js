
/* Voice Ledger Lite — Step 25C: complete frontend script */

const $ = id => document.getElementById(id);
const languageSelect = $("languageSelect");
const micButton = $("micButton");
const statusLine = $("statusLine");
const textInput = $("textInput");
const readButton = $("readButton");
const confirmCard = $("confirmCard");
const entryForm = $("entryForm");
const nameInput = $("nameInput");
const amountInput = $("amountInput");
const typeInput = $("typeInput");
const cancelButton = $("cancelButton");
const cancelButtonBottom = $("cancelButtonBottom");
const saveButton = $("saveButton");
const totalPending = $("totalPending");
const customerList = $("customerList");
const refreshButton = $("refreshButton");
const toast = $("toast");
const customerSearch = $("customerSearch");
const clearSearchButton = $("clearSearchButton");
const filterButtons = document.querySelectorAll(".filter-button");
const sortSelect = $("sortSelect");
const dashboardPending = $("dashboardPending");
const dashboardOwing = $("dashboardOwing");
const dashboardSettled = $("dashboardSettled");
const dashboardCustomers = $("dashboardCustomers");
const editModal = $("editModal");
const editModalClose = $("editModalClose");
const editForm = $("editForm");
const editTypeInput = $("editTypeInput");
const editAmountInput = $("editAmountInput");
const editCancelButton = $("editCancelButton");
const editSaveButton = $("editSaveButton");
const deleteModal = $("deleteModal");
const deleteModalClose = $("deleteModalClose");
const deleteTransactionDetails = $("deleteTransactionDetails");
const deleteCancelButton = $("deleteCancelButton");
const deleteConfirmButton = $("deleteConfirmButton");

let recognition = null;
let isListening = false;
let editingTransaction = null;
let deletingTransaction = null;
let allCustomers = [];
let currentFilter = "all";
let currentSort = "balance-desc";
let isSavingEntry = false;
let isUpdatingTransaction = false;
let isDeletingTransaction = false;
let isLoadingLedger = false;
let isLoadingHistory = false;
let isParsingEntry = false;
let historyRequestId = 0;
let lastLedgerTotal = 0;
let lastStatusKey = "";

const TRANSLATIONS = {
    "en-IN": {
        headerEyebrow: "Simple shop ledger", totalPending: "Total pending",
        customersWhoOwe: "Customers who owe", settled: "Settled",
        totalCustomers: "Total customers", totalUdhaarPending: "Total udhaar pending",
        readEntry: "Read entry", checkBeforeSaving: "Check before saving",
        confirmEntry: "Confirm entry", name: "Name", amount: "Amount (₹)",
        type: "Type", udhaarGiven: "Udhaar given", paymentReceived: "Payment received",
        save: "Save", cancel: "Cancel", customers: "Customers",
        pendingBalances: "Pending balances", refresh: "Refresh",
        searchCustomer: "Search customer...", all: "All", owes: "Owes",
        sortBy: "Sort by", highestBalance: "Highest balance",
        lowestBalance: "Lowest balance", nameAZ: "Name A → Z", nameZA: "Name Z → A",
        modifyTransaction: "Modify transaction", editTransaction: "Edit transaction",
        saveChanges: "Save changes", permanentAction: "Permanent action",
        deleteTransaction: "Delete transaction", areYouSure: "Are you sure?",
        deleteWarning: "This transaction will be permanently removed.",
        history: "Transaction history", currentBalance: "Current balance",
        totalUdhaar: "Total udhaar", totalPayments: "Total payments",
        noTransactions: "No transactions yet.",
        noCustomers: "No customers yet. Add your first entry above.",
        noSearchResults: "No customers match your search.",
        noOwingCustomers: "No customers currently owe money.",
        noSettledCustomers: "No settled customers found.",
        owesAmount: "Owes", settledStatus: "Settled", historyButton: "History",
        remind: "Remind", edit: "Edit", delete: "Delete",
        udhaarGivenHistory: "Udhaar given", paymentReceivedHistory: "Payment received",
        entrySaved: "Entry saved", transactionUpdated: "Transaction updated",
        transactionDeleted: "Transaction deleted",
        understanding: "Understanding your entry...",
        checkDetails: "Check the details below before saving.",
        listening: "Listening... speak now.",
        unsupportedVoice: "Voice input is not supported in this browser. You can type the entry below.",
        microphoneBlocked: "Microphone permission was blocked. Allow microphone access and try again.",
        speechNotAllowed: "Speech recognition is not allowed by the browser.",
        noSpeech: "I did not hear anything. Please try again.",
        noMicrophone: "No microphone was found. Please check your microphone.",
        voiceNetwork: "Voice recognition needs a network connection in this browser.",
        voiceFailed: "Voice input failed. Please try again.",
        emptyEntry: "Please enter or speak an entry.",
        parseFailed: "Sorry, I could not understand that entry.",
        saveFailed: "Could not save the entry.",
        ledgerFailed: "Could not load the ledger. Please refresh.",
        historyFailed: "Could not load transaction history.",
        updateFailed: "Could not update transaction.",
        deleteFailed: "Could not delete transaction.",
        amountInvalid: "Please enter an amount greater than zero.",
        customerNameRequired: "Customer name is required.",
        reminderOwed: "Hello {name}, a friendly reminder that your pending udhaar is {amount}. Please pay when convenient. Thank you.",
        reminderSettled: "Hello {name}, your ledger is settled. Thank you!",
        saving: "Saving...", deleting: "Deleting...", loading: "Loading...",
        loadingHistory: "Loading transaction history...", stopVoice: "Stop voice input",
        startVoice: "Start voice input"
    },
    "hi-IN": {
        headerEyebrow: "सरल दुकान खाता", totalPending: "कुल बकाया",
        customersWhoOwe: "जिनसे लेना है", settled: "भुगतान पूरा",
        totalCustomers: "कुल ग्राहक", totalUdhaarPending: "कुल उधार बकाया",
        readEntry: "एंट्री पढ़ें", checkBeforeSaving: "सेव करने से पहले जाँचें",
        confirmEntry: "एंट्री की पुष्टि करें", name: "नाम", amount: "रकम (₹)",
        type: "प्रकार", udhaarGiven: "उधार दिया", paymentReceived: "भुगतान मिला",
        save: "सेव करें", cancel: "रद्द करें", customers: "ग्राहक",
        pendingBalances: "बकाया राशि", refresh: "रिफ्रेश",
        searchCustomer: "ग्राहक खोजें...", all: "सभी", owes: "बकाया",
        sortBy: "क्रम से", highestBalance: "सबसे अधिक बकाया",
        lowestBalance: "सबसे कम बकाया", nameAZ: "नाम A → Z", nameZA: "नाम Z → A",
        modifyTransaction: "लेन-देन बदलें", editTransaction: "लेन-देन संपादित करें",
        saveChanges: "बदलाव सेव करें", permanentAction: "स्थायी कार्रवाई",
        deleteTransaction: "लेन-देन हटाएँ", areYouSure: "क्या आप निश्चित हैं?",
        deleteWarning: "यह लेन-देन हमेशा के लिए हटा दिया जाएगा।",
        history: "लेन-देन का इतिहास", currentBalance: "वर्तमान बकाया",
        totalUdhaar: "कुल उधार", totalPayments: "कुल भुगतान",
        noTransactions: "अभी कोई लेन-देन नहीं है।",
        noCustomers: "अभी कोई ग्राहक नहीं है। ऊपर पहली एंट्री जोड़ें।",
        noSearchResults: "आपकी खोज से कोई ग्राहक नहीं मिला।",
        noOwingCustomers: "अभी किसी ग्राहक से पैसा लेना बाकी नहीं है।",
        noSettledCustomers: "कोई भुगतान पूरा ग्राहक नहीं मिला।",
        owesAmount: "बकाया", settledStatus: "भुगतान पूरा", historyButton: "इतिहास",
        remind: "याद दिलाएँ", edit: "संपादित", delete: "हटाएँ",
        udhaarGivenHistory: "उधार दिया", paymentReceivedHistory: "भुगतान मिला",
        entrySaved: "एंट्री सेव हो गई", transactionUpdated: "लेन-देन अपडेट हो गया",
        transactionDeleted: "लेन-देन हटा दिया गया",
        understanding: "आपकी एंट्री समझ रहा हूँ...",
        checkDetails: "सेव करने से पहले नीचे दी गई जानकारी जाँचें।",
        listening: "सुन रहा हूँ... अभी बोलें।",
        unsupportedVoice: "इस ब्राउज़र में वॉइस इनपुट उपलब्ध नहीं है। आप नीचे एंट्री लिख सकते हैं।",
        microphoneBlocked: "माइक्रोफ़ोन की अनुमति बंद है। माइक्रोफ़ोन की अनुमति दें और फिर कोशिश करें।",
        speechNotAllowed: "ब्राउज़र ने स्पीच रिकग्निशन की अनुमति नहीं दी।",
        noSpeech: "मुझे कुछ सुनाई नहीं दिया। फिर से कोशिश करें।",
        noMicrophone: "माइक्रोफ़ोन नहीं मिला। कृपया अपना माइक्रोफ़ोन जाँचें।",
        voiceNetwork: "इस ब्राउज़र में वॉइस रिकग्निशन के लिए नेटवर्क कनेक्शन चाहिए।",
        voiceFailed: "वॉइस इनपुट काम नहीं कर पाया। फिर से कोशिश करें।",
        emptyEntry: "कृपया एंट्री लिखें या बोलें।",
        parseFailed: "माफ़ कीजिए, मैं इस एंट्री को समझ नहीं पाया।",
        saveFailed: "एंट्री सेव नहीं हो सकी।", ledgerFailed: "खाता लोड नहीं हो सका। कृपया रिफ्रेश करें।",
        historyFailed: "लेन-देन का इतिहास लोड नहीं हो सका।",
        updateFailed: "लेन-देन अपडेट नहीं हो सका।", deleteFailed: "लेन-देन हटाया नहीं जा सका।",
        amountInvalid: "कृपया शून्य से अधिक राशि डालें।",
        customerNameRequired: "ग्राहक का नाम ज़रूरी है।",
        reminderOwed: "नमस्ते {name}, आपका {amount} का उधार अभी बाकी है। कृपया सुविधा के अनुसार भुगतान करें। धन्यवाद।",
        reminderSettled: "नमस्ते {name}, आपका खाता पूरा भुगतान हो गया है। धन्यवाद!",
        saving: "सेव हो रहा है...", deleting: "हटाया जा रहा है...",
        loading: "लोड हो रहा है...", loadingHistory: "लेन-देन का इतिहास लोड हो रहा है...",
        stopVoice: "वॉइस इनपुट बंद करें", startVoice: "वॉइस इनपुट शुरू करें"
    },
    "gu-IN": {
        headerEyebrow: "સરળ દુકાન ખાતું", totalPending: "કુલ બાકી",
        customersWhoOwe: "જેમની પાસેથી લેવાનું છે", settled: "ચૂકવેલ",
        totalCustomers: "કુલ ગ્રાહકો", totalUdhaarPending: "કુલ ઉધાર બાકી",
        readEntry: "એન્ટ્રી વાંચો", checkBeforeSaving: "સાચવતા પહેલાં તપાસો",
        confirmEntry: "એન્ટ્રીની પુષ્ટિ કરો", name: "નામ", amount: "રકમ (₹)",
        type: "પ્રકાર", udhaarGiven: "ઉધાર આપ્યું", paymentReceived: "ચૂકવણી મળી",
        save: "સાચવો", cancel: "રદ કરો", customers: "ગ્રાહકો",
        pendingBalances: "બાકી રકમ", refresh: "રિફ્રેશ",
        searchCustomer: "ગ્રાહક શોધો...", all: "બધા", owes: "બાકી",
        sortBy: "ક્રમ", highestBalance: "સૌથી વધુ બાકી",
        lowestBalance: "સૌથી ઓછી બાકી", nameAZ: "નામ A → Z", nameZA: "નામ Z → A",
        modifyTransaction: "વ્યવહાર બદલો", editTransaction: "વ્યવહાર સંપાદિત કરો",
        saveChanges: "ફેરફારો સાચવો", permanentAction: "કાયમી કાર્યવાહી",
        deleteTransaction: "વ્યવહાર કાઢી નાખો", areYouSure: "શું તમે ચોક્કસ છો?",
        deleteWarning: "આ વ્યવહાર કાયમ માટે કાઢી નાખવામાં આવશે.",
        history: "વ્યવહારનો ઇતિહાસ", currentBalance: "હાલની બાકી રકમ",
        totalUdhaar: "કુલ ઉધાર", totalPayments: "કુલ ચૂકવણી",
        noTransactions: "હજુ કોઈ વ્યવહાર નથી.",
        noCustomers: "હજુ કોઈ ગ્રાહક નથી. ઉપર પહેલી એન્ટ્રી ઉમેરો.",
        noSearchResults: "તમારી શોધ સાથે કોઈ ગ્રાહક મળ્યો નથી.",
        noOwingCustomers: "હાલ કોઈ ગ્રાહક પાસેથી પૈસા લેવાના નથી.",
        noSettledCustomers: "કોઈ ચૂકવેલ ગ્રાહક મળ્યો નથી.",
        owesAmount: "બાકી", settledStatus: "ચૂકવેલ", historyButton: "ઇતિહાસ",
        remind: "યાદ કરાવો", edit: "ફેરફાર", delete: "કાઢી નાખો",
        udhaarGivenHistory: "ઉધાર આપ્યું", paymentReceivedHistory: "ચૂકવણી મળી",
        entrySaved: "એન્ટ્રી સાચવાઈ ગઈ", transactionUpdated: "વ્યવહાર અપડેટ થયો",
        transactionDeleted: "વ્યવહાર કાઢી નાખ્યો",
        understanding: "તમારી એન્ટ્રી સમજી રહ્યો છું...",
        checkDetails: "સાચવતા પહેલાં નીચેની માહિતી તપાસો.",
        listening: "સાંભળી રહ્યો છું... હવે બોલો.",
        unsupportedVoice: "આ બ્રાઉઝરમાં વૉઇસ ઇનપુટ ઉપલબ્ધ નથી. તમે નીચે એન્ટ્રી લખી શકો છો.",
        microphoneBlocked: "માઇક્રોફોનની પરવાનગી બંધ છે. માઇક્રોફોનની પરવાનગી આપો અને ફરી પ્રયાસ કરો.",
        speechNotAllowed: "બ્રાઉઝરે સ્પીચ રિકગ્નિશનની પરવાનગી આપી નથી.",
        noSpeech: "મને કંઈ સંભળાયું નહીં. ફરી પ્રયાસ કરો.",
        noMicrophone: "માઇક્રોફોન મળ્યો નથી. કૃપા કરીને માઇક્રોફોન તપાસો.",
        voiceNetwork: "આ બ્રાઉઝરમાં વૉઇસ રિકગ્નિશન માટે નેટવર્ક કનેક્શન જરૂરી છે.",
        voiceFailed: "વૉઇસ ઇનપુટ કામ કરી શક્યું નહીં. ફરી પ્રયાસ કરો.",
        emptyEntry: "કૃપા કરીને એન્ટ્રી લખો અથવા બોલો.",
        parseFailed: "માફ કરશો, હું આ એન્ટ્રી સમજી શક્યો નહીં.",
        saveFailed: "એન્ટ્રી સાચવી શકાઈ નહીં.", ledgerFailed: "ખાતું લોડ થઈ શક્યું નહીં. કૃપા કરીને રિફ્રેશ કરો.",
        historyFailed: "વ્યવહારનો ઇતિહાસ લોડ થઈ શક્યો નહીં.",
        updateFailed: "વ્યવહાર અપડેટ થઈ શક્યો નહીં.", deleteFailed: "વ્યવહાર કાઢી શકાયો નહીં.",
        amountInvalid: "કૃપા કરીને શૂન્ય કરતાં વધુ રકમ દાખલ કરો.",
        customerNameRequired: "ગ્રાહકનું નામ જરૂરી છે.",
        reminderOwed: "નમસ્તે {name}, તમારી {amount} ની ઉધાર રકમ હજુ બાકી છે. કૃપા કરીને અનુકૂળ સમયે ચૂકવણી કરો. આભાર.",
        reminderSettled: "નમસ્તે {name}, તમારું ખાતું ચૂકવાઈ ગયું છે. આભાર!",
        saving: "સાચવી રહ્યું છે...", deleting: "કાઢી રહ્યું છે...",
        loading: "લોડ થઈ રહ્યું છે...", loadingHistory: "વ્યવહારનો ઇતિહાસ લોડ થઈ રહ્યો છે...",
        stopVoice: "વૉઇસ ઇનપુટ બંધ કરો", startVoice: "વૉઇસ ઇનપુટ શરૂ કરો"
    }
};

const HINTS = {
    "en-IN": 'Tap the mic and say: "Jai taken debt of 500"',
    "hi-IN": 'माइक दबाएँ और बोलें: "रमेश ने 500 उधार"',
    "gu-IN": 'માઈક દબાવીને બોલો: "રમેશ ને 500 ઉધાર"'
};

const PLACEHOLDERS = {
    "en-IN": "Or type: Jai taken debt of 500",
    "hi-IN": "या लिखें: रमेश ने 500 उधार",
    "gu-IN": "અથવા લખો: રમેશ ને 500 ઉધાર"
};

function getLanguage() {
    return TRANSLATIONS[languageSelect.value] ? languageSelect.value : "en-IN";
}

function t(key) {
    return TRANSLATIONS[getLanguage()][key] || TRANSLATIONS["en-IN"][key] || key;
}

function formatRupees(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency", currency: "INR", maximumFractionDigits: 2
    }).format(Number(amount) || 0);
}

function formatDateTime(value) {
    if (!value) return "";
    const date = new Date(value.replace(" ", "T") + "Z");
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat(getLanguage(), {
        dateStyle: "medium", timeStyle: "short"
    }).format(date);
}

function createElement(tag, className = "", text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
}

function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 2500);
}

function showError(message) {
    showToast(message);
}

async function requestJSON(url, options) {
    const response = await fetch(url, options);
    let data;
    try {
        data = await response.json();
    } catch {
        throw new Error(`Server returned an unexpected response (${response.status}).`);
    }
    if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
    return data;
}

function jsonOptions(method, body) {
    return {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    };
}

function updateVoiceHint() {
    if (isListening) {
        statusLine.textContent = t("listening");
    } else if (isParsingEntry) {
        statusLine.textContent = t("understanding");
    } else if (!recognition) {
        statusLine.textContent = t("unsupportedVoice");
    } else if (!confirmCard.classList.contains("hidden")) {
        statusLine.textContent = t("checkDetails");
    } else {
        statusLine.textContent = HINTS[getLanguage()];
    }
}

function updateActionLabels() {
    readButton.textContent = isParsingEntry ? t("loading") : t("readEntry");
    saveButton.textContent = isSavingEntry ? t("saving") : t("save");
    editSaveButton.textContent = isUpdatingTransaction ? t("saving") : t("saveChanges");
    deleteConfirmButton.textContent = isDeletingTransaction ? t("deleting") : t("deleteTransaction");
    refreshButton.textContent = isLoadingLedger ? t("loading") : t("refresh");
}

function translatePage() {
    document.documentElement.lang = getLanguage().split("-")[0];

    document.querySelectorAll("[data-i18n]").forEach(element => {
        element.textContent = t(element.dataset.i18n);
    });

    textInput.placeholder = PLACEHOLDERS[getLanguage()];
    customerSearch.placeholder = t("searchCustomer");
    customerSearch.setAttribute("aria-label", t("searchCustomer"));
    languageSelect.setAttribute("aria-label", "Voice language");

    updateActionLabels();
    updateVoiceHint();

    totalPending.textContent = formatRupees(lastLedgerTotal);
    updateDashboard();
    renderCustomerList();

    const history = document.querySelector(".history-card");
    if (history && history.dataset.customerId) {
        loadCustomerHistory(Number(history.dataset.customerId), false);
    }
}

function updateLanguageUI() {
    if (recognition && !isListening) recognition.lang = getLanguage();
    translatePage();
}

function updateDashboard() {
    let owing = 0;
    let settled = 0;
    let pending = 0;

    for (const customer of allCustomers) {
        const balance = Number(customer.balance) || 0;

        if (balance > 0) {
            owing++;
            pending += balance;
        } else {
            settled++;
        }
    }

    dashboardPending.textContent = formatRupees(pending);
    dashboardOwing.textContent = String(owing);
    dashboardSettled.textContent = String(settled);
    dashboardCustomers.textContent = String(allCustomers.length);
}

function openConfirmCard(data) {
    nameInput.value = data.name || "";
    amountInput.value = data.amount ?? "";
    typeInput.value = data.type === "payment" ? "payment" : "credit";

    confirmCard.classList.remove("hidden");
    updateVoiceHint();
    nameInput.focus();

    confirmCard.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

function closeConfirmCard() {
    if (isSavingEntry) return;

    confirmCard.classList.add("hidden");
    entryForm.reset();
    updateVoiceHint();
}

async function parseText(text) {
    const cleanText = String(text || "").trim();

    if (!cleanText) {
        showError(t("emptyEntry"));
        return;
    }

    if (isParsingEntry) return;

    isParsingEntry = true;
    readButton.disabled = true;
    updateActionLabels();
    updateVoiceHint();

    try {
        const data = await requestJSON(
            "/parse",
            jsonOptions("POST", { text: cleanText })
        );

        openConfirmCard(data);
    } catch (error) {
        console.error(error);
        showError(error.message || t("parseFailed"));
    } finally {
        isParsingEntry = false;
        readButton.disabled = false;
        updateActionLabels();
        updateVoiceHint();
    }
}

async function saveEntry(event) {
    event.preventDefault();

    if (isSavingEntry) return;

    const name = nameInput.value.trim();
    const amount = Number(amountInput.value);
    const type = typeInput.value;

    if (!name) {
        showError(t("customerNameRequired"));
        nameInput.focus();
        return;
    }

    if (
        !amountInput.value.trim()
        || !Number.isFinite(amount)
        || amount <= 0
    ) {
        showError(t("amountInvalid"));
        amountInput.focus();
        return;
    }

    isSavingEntry = true;
    saveButton.disabled = true;
    cancelButton.disabled = true;
    cancelButtonBottom.disabled = true;
    updateActionLabels();

    try {
        await requestJSON(
            "/save",
            jsonOptions("POST", { name, amount, type })
        );

        isSavingEntry = false;
        closeConfirmCard();

        showToast(t("entrySaved"));
        textInput.value = "";

        await loadLedger();
    } catch (error) {
        console.error(error);
        showError(error.message || t("saveFailed"));
    } finally {
        isSavingEntry = false;
        saveButton.disabled = false;
        cancelButton.disabled = false;
        cancelButtonBottom.disabled = false;
        updateActionLabels();
    }
}

function getFilteredCustomers() {
    const term = customerSearch.value.trim().toLocaleLowerCase();

    return allCustomers.filter(customer => {
        const matchesName =
            !term ||
            String(customer.name || "").toLocaleLowerCase().includes(term);

        const balance = Number(customer.balance) || 0;

        return matchesName && (
            currentFilter === "all"
            || (currentFilter === "owed" && balance > 0)
            || (currentFilter === "settled" && balance <= 0)
        );
    });
}

function updateSearchUI() {
    clearSearchButton.classList.toggle(
        "hidden",
        !customerSearch.value.trim()
    );
}

function setCustomerFilter(filter) {
    currentFilter = filter;

    filterButtons.forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.filter === filter
        );
    });

    renderCustomerList();
}

function compareNames(a, b) {
    return a.localeCompare(
        b,
        undefined,
        { sensitivity: "base" }
    );
}

function sortCustomers(customers) {
    return [...customers].sort((a, b) => {
        const x = Number(a.balance) || 0;
        const y = Number(b.balance) || 0;
        const an = String(a.name || "");
        const bn = String(b.name || "");

        if (currentSort === "balance-desc") {
            return y - x || compareNames(an, bn);
        }

        if (currentSort === "balance-asc") {
            return x - y || compareNames(an, bn);
        }

        if (currentSort === "name-asc") {
            return compareNames(an, bn) || y - x;
        }

        if (currentSort === "name-desc") {
            return compareNames(bn, an) || y - x;
        }

        return 0;
    });
}

function renderCustomerList() {
    customerList.textContent = "";

    const customers = sortCustomers(getFilteredCustomers());

    if (!allCustomers.length) {
        customerList.appendChild(
            createElement("div", "empty-state", t("noCustomers"))
        );
        return;
    }

    if (!customers.length) {
        const message = customerSearch.value.trim()
            ? t("noSearchResults")
            : currentFilter === "owed"
                ? t("noOwingCustomers")
                : currentFilter === "settled"
                    ? t("noSettledCustomers")
                    : t("noSearchResults");

        customerList.appendChild(
            createElement("div", "empty-state", message)
        );
        return;
    }

    for (const customer of customers) {
        customerList.appendChild(createCustomerCard(customer));
    }
}

function createCustomerCard(customer) {
    const card = createElement("article", "customer-card");

    card.dataset.customerId = String(customer.id);
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");

    const main = createElement("div", "customer-main");

    main.appendChild(
        createElement("h3", "customer-name", customer.name)
    );

    const balance = createElement("p", "customer-balance");

    if (Number(customer.balance) > 0) {
        balance.textContent =
            `${t("owesAmount")} ${formatRupees(customer.balance)}`;

        balance.classList.add("owed");
    } else {
        balance.textContent = t("settledStatus");
        balance.classList.add("settled");
    }

    main.appendChild(balance);

    const actions = createElement("div", "customer-actions");

    const historyButton = createElement(
        "button",
        "secondary-button",
        t("historyButton")
    );

    historyButton.type = "button";

    historyButton.addEventListener("click", event => {
        event.stopPropagation();
        loadCustomerHistory(customer.id);
    });

    const remindButton = createElement(
        "button",
        "secondary-button",
        t("remind")
    );

    remindButton.type = "button";

    remindButton.addEventListener("click", event => {
        event.stopPropagation();
        openWhatsAppReminder(customer);
    });

    actions.append(historyButton, remindButton);
    card.append(main, actions);

    card.addEventListener("click", () => {
        loadCustomerHistory(customer.id);
    });

    card.addEventListener("keydown", event => {
        if (event.target !== card) return;

        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            loadCustomerHistory(customer.id);
        }
    });

    return card;
}

function openWhatsAppReminder(customer) {
    const message = Number(customer.balance) > 0
        ? t("reminderOwed")
            .replace("{name}", customer.name)
            .replace("{amount}", formatRupees(customer.balance))
        : t("reminderSettled").replace("{name}", customer.name);

    window.open(
        `https://wa.me/?text=${encodeURIComponent(message)}`,
        "_blank",
        "noopener,noreferrer"
    );
}

async function loadLedger() {
    if (isLoadingLedger) return;

    isLoadingLedger = true;
    refreshButton.disabled = true;
    updateActionLabels();

    if (!allCustomers.length) {
        customerList.textContent = "";

        customerList.appendChild(
            createElement("div", "empty-state", t("loading"))
        );
    }

    try {
        const data = await requestJSON("/ledger");

        allCustomers = Array.isArray(data.customers)
            ? data.customers
            : [];

        lastLedgerTotal = Number(data.total) || 0;

        totalPending.textContent = formatRupees(lastLedgerTotal);

        updateDashboard();
        updateSearchUI();
        renderCustomerList();
    } catch (error) {
        console.error(error);
        showError(error.message || t("ledgerFailed"));
        renderCustomerList();
    } finally {
        isLoadingLedger = false;
        refreshButton.disabled = false;
        updateActionLabels();
    }
}

function createHistoryTransaction(transaction) {
    const item = createElement("div", "history-transaction");
    const left = createElement("div", "history-transaction-info");
    const isCredit = transaction.type === "credit";

    left.appendChild(
        createElement(
            "strong",
            isCredit ? "history-credit" : "history-payment",
            t(isCredit ? "udhaarGivenHistory" : "paymentReceivedHistory")
        )
    );

    left.appendChild(
        createElement(
            "span",
            "history-date",
            formatDateTime(transaction.created_at)
        )
    );

    const amount = createElement(
        "strong",
        "history-amount",
        formatRupees(transaction.amount)
    );

    const actions = createElement("div", "history-actions");

    const editButton = createElement(
        "button",
        "history-edit-button",
        t("edit")
    );

    editButton.type = "button";

    editButton.addEventListener("click", event => {
        event.stopPropagation();
        openEditModal(transaction);
    });

    const deleteButton = createElement(
        "button",
        "history-delete-button",
        t("delete")
    );

    deleteButton.type = "button";

    deleteButton.addEventListener("click", event => {
        event.stopPropagation();
        openDeleteModal(transaction);
    });

    actions.append(editButton, deleteButton);
    item.append(left, amount, actions);

    return item;
}

function createHistoryCard(data) {
    const card = createElement("section", "history-card");
    card.dataset.customerId = String(data.customer.id);

    const heading = createElement("div", "history-heading");
    const headingText = createElement("div");

    headingText.appendChild(
        createElement("p", "eyebrow", t("history"))
    );

    const title = createElement("h2", "", data.customer.name);
    title.id = "historyTitle";

    headingText.appendChild(title);

    const closeButton = createElement("button", "icon-button", "×");
    closeButton.type = "button";
    closeButton.setAttribute("aria-label", t("cancel"));

    closeButton.addEventListener("click", () => {
        historyRequestId++;
        card.remove();
    });

    heading.append(headingText, closeButton);

    const balance = createElement("div", "history-balance");

    balance.appendChild(
        createElement("span", "", t("currentBalance"))
    );

    const balanceAmount = createElement(
        "strong",
        Number(data.balance) > 0 ? "owed" : "settled",
        Number(data.balance) > 0
            ? formatRupees(data.balance)
            : t("settledStatus")
    );

    balance.appendChild(balanceAmount);

    const totals = createElement("div", "history-totals");

    const creditTotal = createElement("div", "history-total-box");

    creditTotal.append(
        createElement("span", "", t("totalUdhaar")),
        createElement("strong", "", formatRupees(data.total_credit))
    );

    const paymentTotal = createElement("div", "history-total-box");

    paymentTotal.append(
        createElement("span", "", t("totalPayments")),
        createElement("strong", "", formatRupees(data.total_payment))
    );

    totals.append(creditTotal, paymentTotal);

    const list = createElement("div", "history-list");

    if (!data.transactions || !data.transactions.length) {
        list.appendChild(
            createElement("p", "empty-state", t("noTransactions"))
        );
    } else {
        for (const transaction of data.transactions) {
            list.appendChild(createHistoryTransaction(transaction));
        }
    }

    card.append(heading, balance, totals, list);

    return card;
}

async function loadCustomerHistory(customerId, scroll = true) {
    const requestId = ++historyRequestId;

    isLoadingHistory = true;

    const ledgerSection = document.querySelector(".ledger-section");
    const previous = document.querySelector(".history-card");

    if (previous) previous.remove();

    const loadingCard = createElement(
        "section",
        "history-card",
        t("loadingHistory")
    );

    loadingCard.dataset.customerId = String(customerId);

    ledgerSection.insertBefore(loadingCard, customerList);

    try {
        const data = await requestJSON(
            `/customer/${customerId}/transactions`
        );

        if (requestId !== historyRequestId) return;

        const historyCard = createHistoryCard(data);

        loadingCard.replaceWith(historyCard);

        if (scroll) {
            historyCard.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    } catch (error) {
        if (requestId !== historyRequestId) return;

        console.error(error);
        loadingCard.remove();
        showError(error.message || t("historyFailed"));
    } finally {
        if (requestId === historyRequestId) {
            isLoadingHistory = false;
        }
    }
}

function openEditModal(transaction) {
    if (isUpdatingTransaction || isDeletingTransaction) return;

    editingTransaction = transaction;
    editTypeInput.value = transaction.type;
    editAmountInput.value = transaction.amount;

    editModal.classList.remove("hidden");
    editModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    editAmountInput.focus();
    editAmountInput.select();
}

function closeEditModal() {
    if (isUpdatingTransaction) return;

    editingTransaction = null;
    editModal.classList.add("hidden");
    editModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    editForm.reset();
}

async function saveEditedTransaction(event) {
    event.preventDefault();

    if (isUpdatingTransaction || !editingTransaction) return;

    const amount = Number(editAmountInput.value);
    const type = editTypeInput.value;

    if (
        !editAmountInput.value.trim()
        || !Number.isFinite(amount)
        || amount <= 0
    ) {
        showError(t("amountInvalid"));
        editAmountInput.focus();
        return;
    }

    const transactionId = editingTransaction.id;

    isUpdatingTransaction = true;
    editSaveButton.disabled = true;
    editCancelButton.disabled = true;
    editModalClose.disabled = true;
    updateActionLabels();

    try {
        const data = await requestJSON(
            `/transaction/${transactionId}`,
            jsonOptions("PUT", { amount, type })
        );

        isUpdatingTransaction = false;
        closeEditModal();

        showToast(t("transactionUpdated"));

        await loadLedger();
        await loadCustomerHistory(data.customer_id);
    } catch (error) {
        console.error(error);
        showError(error.message || t("updateFailed"));
    } finally {
        isUpdatingTransaction = false;
        editSaveButton.disabled = false;
        editCancelButton.disabled = false;
        editModalClose.disabled = false;
        updateActionLabels();
    }
}

function openDeleteModal(transaction) {
    if (isDeletingTransaction || isUpdatingTransaction) return;

    deletingTransaction = transaction;
    deleteTransactionDetails.textContent = "";

    deleteTransactionDetails.append(
        createElement(
            "strong",
            "delete-transaction-type",
            t(
                transaction.type === "credit"
                    ? "udhaarGivenHistory"
                    : "paymentReceivedHistory"
            )
        ),
        createElement(
            "strong",
            "delete-transaction-amount",
            formatRupees(transaction.amount)
        )
    );

    deleteModal.classList.remove("hidden");
    deleteModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    deleteConfirmButton.focus();
}

function closeDeleteModal() {
    if (isDeletingTransaction) return;

    deletingTransaction = null;
    deleteModal.classList.add("hidden");
    deleteModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    deleteTransactionDetails.textContent = "";
}

async function confirmDeleteTransaction() {
    if (isDeletingTransaction || !deletingTransaction) return;

    const transactionId = deletingTransaction.id;

    isDeletingTransaction = true;
    deleteConfirmButton.disabled = true;
    deleteCancelButton.disabled = true;
    deleteModalClose.disabled = true;
    updateActionLabels();

    try {
        const data = await requestJSON(
            `/transaction/${transactionId}`,
            { method: "DELETE" }
        );

        isDeletingTransaction = false;
        closeDeleteModal();

        showToast(t("transactionDeleted"));

        await loadLedger();
        await loadCustomerHistory(data.customer_id);
    } catch (error) {
        console.error(error);
        showError(error.message || t("deleteFailed"));
    } finally {
        isDeletingTransaction = false;
        deleteConfirmButton.disabled = false;
        deleteCancelButton.disabled = false;
        deleteModalClose.disabled = false;
        updateActionLabels();
    }
}


function setupSpeechRecognition() {
    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        recognition = null;
        micButton.disabled = true;

        micButton.classList.remove("listening");
        statusLine.textContent = t("unsupportedVoice");

        return;
    }

    recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.lang = getLanguage();

    recognition.onstart = () => {
        isListening = true;

        micButton.classList.add("listening");
        micButton.disabled = false;

        micButton.setAttribute(
            "aria-label",
            t("stopVoice")
        );

        statusLine.textContent = t("listening");
    };

    recognition.onresult = event => {
        const transcript =
            event.results?.[0]?.[0]?.transcript;

        if (!transcript || !transcript.trim()) {
            showError(t("noSpeech"));
            return;
        }

        textInput.value = transcript.trim();

        // Parse only the recognized entry.
        parseText(transcript.trim());
    };

    recognition.onerror = event => {
        console.error(
            "Speech recognition error:",
            event.error
        );

        const messages = {
            "not-allowed": t("microphoneBlocked"),
            "service-not-allowed": t("speechNotAllowed"),
            "no-speech": t("noSpeech"),
            "audio-capture": t("noMicrophone"),
            "network": t("voiceNetwork"),
            "aborted": null
        };

        const message = Object.prototype.hasOwnProperty.call(
            messages,
            event.error
        )
            ? messages[event.error]
            : t("voiceFailed");

        // Stopping recognition manually is not an error.
        if (message) {
            showError(message);
        }
    };

    recognition.onend = () => {
        isListening = false;

        micButton.classList.remove("listening");

        micButton.setAttribute(
            "aria-label",
            t("startVoice")
        );

        updateVoiceHint();
    };
}



function toggleListening() {
    if (!recognition) {
        showError(t("unsupportedVoice"));
        return;
    }

    if (isListening) {
        try {
            recognition.stop();
        } catch (error) {
            console.error(
                "Could not stop voice recognition:",
                error
            );
        }

        return;
    }

    if (isParsingEntry || isSavingEntry) {
        return;
    }

    // Use the currently selected language.
    recognition.lang = getLanguage();

    try {
        recognition.start();
    } catch (error) {
        console.error(
            "Could not start voice recognition:",
            error
        );

        showError(t("voiceFailed"));
    }
}


/* Language and voice input */

languageSelect.addEventListener(
    "change",
    updateLanguageUI
);

micButton.addEventListener(
    "click",
    toggleListening
);

readButton.addEventListener(
    "click",
    () => parseText(textInput.value)
);

textInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        event.preventDefault();
        parseText(textInput.value);
    }
});

/* Save and refresh */

entryForm.addEventListener(
    "submit",
    saveEntry
);

cancelButton.addEventListener(
    "click",
    closeConfirmCard
);

cancelButtonBottom.addEventListener(
    "click",
    closeConfirmCard
);

refreshButton.addEventListener(
    "click",
    loadLedger
);

/* Search */

customerSearch.addEventListener("input", () => {
    updateSearchUI();
    renderCustomerList();
});

clearSearchButton.addEventListener("click", () => {
    customerSearch.value = "";

    updateSearchUI();
    renderCustomerList();

    customerSearch.focus();
});

/* Filters */

filterButtons.forEach(button => {
    button.addEventListener("click", () => {
        setCustomerFilter(button.dataset.filter);
    });
});

/* Sorting */

sortSelect.addEventListener("change", () => {
    currentSort = sortSelect.value;
    renderCustomerList();
});

/* Edit modal */

editForm.addEventListener(
    "submit",
    saveEditedTransaction
);

editModalClose.addEventListener(
    "click",
    closeEditModal
);

editCancelButton.addEventListener(
    "click",
    closeEditModal
);

editModal.addEventListener("click", event => {
    if (event.target === editModal) {
        closeEditModal();
    }
});

/* Delete modal */

deleteModalClose.addEventListener(
    "click",
    closeDeleteModal
);

deleteCancelButton.addEventListener(
    "click",
    closeDeleteModal
);

deleteConfirmButton.addEventListener(
    "click",
    confirmDeleteTransaction
);

deleteModal.addEventListener("click", event => {
    if (event.target === deleteModal) {
        closeDeleteModal();
    }
});

/* Escape key */

document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;

    if (!editModal.classList.contains("hidden")) {
        closeEditModal();
    } else if (!deleteModal.classList.contains("hidden")) {
        closeDeleteModal();
    }
});

/* Initialize application */

setupSpeechRecognition();
translatePage();
loadLedger();
