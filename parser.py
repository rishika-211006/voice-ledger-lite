import re

from indic_transliteration import sanscript
from indic_transliteration.sanscript import transliterate


# ---------------------------------------------------------
# Digit conversion
# ---------------------------------------------------------

DIGIT_TRANSLATION = str.maketrans(
    "०१२३४५६७८९૦૧૨૩૪૫૬૭૮૯",
    "01234567890123456789",
)


def normalize_digits(text):
    """
    Convert Hindi and Gujarati digits to normal ASCII digits.
    """
    return text.translate(DIGIT_TRANSLATION)


# ---------------------------------------------------------
# Number words
# ---------------------------------------------------------

NUMBER_WORDS = {
    "zero": 0,
    "one": 1,
    "two": 2,
    "three": 3,
    "four": 4,
    "five": 5,
    "six": 6,
    "seven": 7,
    "eight": 8,
    "nine": 9,
    "ten": 10,
    "eleven": 11,
    "twelve": 12,
    "thirteen": 13,
    "fourteen": 14,
    "fifteen": 15,
    "sixteen": 16,
    "seventeen": 17,
    "eighteen": 18,
    "nineteen": 19,
    "twenty": 20,
    "thirty": 30,
    "forty": 40,
    "fifty": 50,
    "sixty": 60,
    "seventy": 70,
    "eighty": 80,
    "ninety": 90,
    "hundred": 100,
    "thousand": 1000,
    "lakh": 100000,
    "lakhs": 100000,
    "crore": 10000000,
    "crores": 10000000,
}


HINDI_NUMBER_WORDS = {
    "शून्य": 0,
    "एक": 1,
    "दो": 2,
    "तीन": 3,
    "चार": 4,
    "पाँच": 5,
    "पांच": 5,
    "छह": 6,
    "छः": 6,
    "सात": 7,
    "आठ": 8,
    "नौ": 9,
    "दस": 10,
    "ग्यारह": 11,
    "बारह": 12,
    "तेरह": 13,
    "चौदह": 14,
    "पंद्रह": 15,
    "पन्द्रह": 15,
    "सोलह": 16,
    "सत्रह": 17,
    "अठारह": 18,
    "उन्नीस": 19,
    "बीस": 20,
    "तीस": 30,
    "चालीस": 40,
    "पचास": 50,
    "साठ": 60,
    "सत्तर": 70,
    "अस्सी": 80,
    "नब्बे": 90,
    "सौ": 100,
    "हज़ार": 1000,
    "हजार": 1000,
    "लाख": 100000,
    "लाखों": 100000,
    "करोड़": 10000000,
    "करोड़": 10000000,
}


GUJARATI_NUMBER_WORDS = {
    "શૂન્ય": 0,
    "એક": 1,
    "બે": 2,
    "ત્રણ": 3,
    "ચાર": 4,
    "પાંચ": 5,
    "છ": 6,
    "સાત": 7,
    "આઠ": 8,
    "નવ": 9,
    "દસ": 10,
    "અગિયાર": 11,
    "બાર": 12,
    "તેર": 13,
    "ચૌદ": 14,
    "પંદર": 15,
    "સોળ": 16,
    "સત્તર": 17,
    "અઢાર": 18,
    "ઓગણીસ": 19,
    "વીસ": 20,
    "ત્રીસ": 30,
    "ચાલીસ": 40,
    "પચાસ": 50,
    "સાઠ": 60,
    "સિત્તેર": 70,
    "એંસી": 80,
    "નેવું": 90,
    "સો": 100,
    "હજાર": 1000,
    "હજાર": 1000,
    "લાખ": 100000,
    "કરોડ": 10000000,
}


# ---------------------------------------------------------
# General helpers
# ---------------------------------------------------------

def clean_spaces(text):
    """
    Normalize repeated whitespace.
    """
    return re.sub(r"\s+", " ", text).strip()


def normalize_text(text):
    """
    Normalize digits and whitespace.
    """
    text = normalize_digits(text)
    text = clean_spaces(text)
    return text


# ---------------------------------------------------------
# Number-word parsing
# ---------------------------------------------------------

def words_to_number(tokens, vocabulary):
    """
    Convert a sequence of number words into a numeric value.

    Supports simple phrases such as:
        five hundred
        one thousand
        twenty five
        पाँच सौ
        બે સો
    """

    if not tokens:
        return None

    values = []

    for token in tokens:
        if token in vocabulary:
            values.append(vocabulary[token])
        else:
            return None

    total = 0
    current = 0

    for value in values:
        if value == 100:
            if current == 0:
                current = 1

            current *= 100

        elif value in {1000, 100000, 10000000}:
            if current == 0:
                current = 1

            total += current * value
            current = 0

        else:
            current += value

    total += current

    if total <= 0:
        return None

    return float(total)


def find_number_from_words(text):
    """
    Search the text for a sequence of English, Hindi,
    or Gujarati number words.
    """

    all_vocabularies = [
        NUMBER_WORDS,
        HINDI_NUMBER_WORDS,
        GUJARATI_NUMBER_WORDS,
    ]

    for vocabulary in all_vocabularies:
        words = list(vocabulary.keys())

        pattern = (
            r"(?<!\S)"
            r"("
            + "|".join(
                re.escape(word)
                for word in sorted(
                    words,
                    key=len,
                    reverse=True
                )
            )
            + r"(?:\s+"
            + "|".join(
                re.escape(word)
                for word in sorted(
                    words,
                    key=len,
                    reverse=True
                )
            )
            + r")*"
            r")"
            r"(?!\S)"
        )

        match = re.search(
            pattern,
            text,
            flags=re.IGNORECASE
        )

        if match:
            phrase = match.group(1)

            tokens = phrase.split()

            lowered_tokens = [
                token.lower()
                for token in tokens
            ]

            number = words_to_number(
                lowered_tokens,
                vocabulary
            )

            if number is not None:
                return number, match.group(0)

    return None, None


# ---------------------------------------------------------
# Numeric amount parsing
# ---------------------------------------------------------

def find_numeric_amount(text):
    """
    Find numeric amounts such as:

        500
        1,500
        1500
        500.50
        १,५००
        ૧,૫૦૦
    """

    normalized = normalize_digits(text)

    matches = re.finditer(
        r"(?<![\w.])"
        r"(?:\d{1,3}(?:,\d{2,3})+|\d+)"
        r"(?:\.\d{1,2})?"
        r"(?![\w.])",
        normalized,
    )

    for match in matches:
        raw = match.group(0)

        try:
            amount = float(raw.replace(",", ""))

        except ValueError:
            continue

        if amount > 0:
            return amount, raw

    return None, None


def find_amount(text):
    """
    Find a numeric amount first.

    If no numeric amount exists, try spoken number words.
    """

    amount, raw = find_numeric_amount(text)

    if amount is not None:
        return amount, raw

    return find_number_from_words(text)


# ---------------------------------------------------------
# Transaction type
# ---------------------------------------------------------

PAYMENT_PHRASES = [
    "paid",
    "pay",
    "payment",
    "received",
    "receive",
    "returned",
    "return",
    "gave back",
    "given back",
    "paid back",
    "chukaye",
    "chukaya",
    "chukayi",
    "chukaye hain",
    "jama",
    "जमा",
    "जमाए",
    "जमाया",
    "चुकाए",
    "चुकाया",
    "चुकाई",
    "भुगतान",
    "ભર્યા",
    "ચૂકવ્યા",
    "ચૂકવ્યું",
    "ચૂકવ્યા છે",
    "જમા",
    "જમાવ્યા",
]


CREDIT_PHRASES = [
    "udhaar",
    "udhar",
    "credit",
    "debt",
    "taken debt",
    "on credit",
    "borrowed",
    "borrow",
    "उधार",
    "उधारी",
    "कर्ज",
    "कर्जा",
    "उधार लिया",
    "ઉધાર",
    "ઉધારી",
    "દેવું",
    "ક્રેડિટ",
]


def contains_phrase(text, phrases):
    """
    Check whether any known phrase occurs in the text.
    """

    lowered = text.lower()

    for phrase in phrases:
        if phrase.lower() in lowered:
            return True

    return False


def detect_transaction_type(text):
    """
    Detect payment or credit.

    Payment wins if both kinds of words appear.
    Otherwise credit words produce credit.
    Default is credit.
    """

    if contains_phrase(text, PAYMENT_PHRASES):
        return "payment"

    if contains_phrase(text, CREDIT_PHRASES):
        return "credit"

    return "credit"


# ---------------------------------------------------------
# Name extraction
# ---------------------------------------------------------

NAME_STOP_WORDS = {
    "taken",
    "take",
    "taking",
    "debt",
    "credit",
    "udhaar",
    "udhar",
    "paid",
    "pay",
    "payment",
    "received",
    "receive",
    "returned",
    "return",
    "borrowed",
    "borrow",
    "on",
    "for",
    "of",
    "is",
    "was",
    "has",
    "have",
    "given",
    "gave",
    "back",
    "please",
    "ने",
    "ने",
    "को",
    "का",
    "की",
    "के",
    "से",
    "उधार",
    "उधारी",
    "चुकाए",
    "चुकाया",
    "जमा",
    "भुगतान",
    "ને",
    "નો",
    "ના",
    "ની",
    "ને",
    "માટે",
    "ઉધાર",
    "ઉધારી",
    "ચૂકવ્યા",
    "ચૂકવ્યું",
    "જમા",
}


def strip_name_suffixes(name):
    """
    Remove common Hindi/Gujarati grammatical suffixes
    accidentally attached to a spoken customer name.
    """

    suffixes = [
        "ને",
        "નો",
        "ના",
        "ની",
        "ભાઈ",
        "ભાઇ",
    ]

    changed = True

    while changed:
        changed = False

        stripped = name.rstrip()

        for suffix in suffixes:
            if stripped.endswith(suffix):
                candidate = stripped[:-len(suffix)].rstrip()

                if candidate:
                    name = candidate
                    changed = True
                    break

    return name.strip()


def extract_name(text, amount_raw=None):
    """
    Extract the customer name from the remaining phrase.
    """

    working = normalize_digits(text)

    # Remove numeric amount.
    if amount_raw:
        working = working.replace(
            amount_raw,
            " "
        )

        working = working.replace(
            amount_raw.replace(",", ""),
            " "
        )

    # Remove known transaction phrases.
    sorted_phrases = sorted(
        set(
            PAYMENT_PHRASES
            + CREDIT_PHRASES
        ),
        key=len,
        reverse=True
    )

    for phrase in sorted_phrases:
        working = re.sub(
            re.escape(phrase),
            " ",
            working,
            flags=re.IGNORECASE
        )

    # Remove common English connector words.
    connector_words = [
        "taken",
        "take",
        "taking",
        "debt",
        "credit",
        "paid",
        "pay",
        "payment",
        "received",
        "receive",
        "returned",
        "return",
        "borrowed",
        "borrow",
        "given",
        "gave",
        "back",
        "on",
        "for",
        "of",
        "please",
        "is",
        "was",
        "has",
        "have",
        "me",
        "from",
        "to",
        "the",
    ]

    for word in connector_words:
        working = re.sub(
            rf"\b{re.escape(word)}\b",
            " ",
            working,
            flags=re.IGNORECASE
        )

    # Remove Hindi/Gujarati connectors.
    working = re.sub(
        r"\b(?:ने|को|का|की|के|से|में|पर)\b",
        " ",
        working
    )

    working = re.sub(
        r"\b(?:ને|નો|ના|ની|થી|માં|પર|માટે)\b",
        " ",
        working
    )

    # Remove currency words.
    working = re.sub(
        r"\b(?:rupees?|rs|₹)\b",
        " ",
        working,
        flags=re.IGNORECASE
    )

    working = clean_spaces(working)

    working = working.strip(
        " ,.!?;:।,，"
    )

    working = strip_name_suffixes(working)

    return clean_spaces(working)


# ---------------------------------------------------------
# Name matching
# ---------------------------------------------------------

def name_key(name):
    """
    Produce a script-independent matching key.

    Example:

        Jai
        जय
        જય

    can produce a comparable key after transliteration.

    Vowels and 'h' are removed to make speech-recognition
    spelling variations easier to match.
    """

    if not name:
        return ""

    text = str(name).strip().lower()

    try:
        text = transliterate(
            text,
            sanscript.DEVANAGARI,
            sanscript.ITRANS
        )
    except Exception:
        pass

    try:
        text = transliterate(
            text,
            sanscript.GUJARATI,
            sanscript.ITRANS
        )
    except Exception:
        pass

    text = text.lower()

    text = re.sub(
        r"[^a-z]",
        "",
        text
    )

    text = re.sub(
        r"[aeiouyh]",
        "",
        text
    )

    text = re.sub(
        r"(.)\1+",
        r"\1",
        text
    )

    return text


# ---------------------------------------------------------
# Main parser
# ---------------------------------------------------------

def parse(text):
    """
    Parse a natural-language ledger entry.

    Returns:

        {
            "name": "...",
            "amount": 500.0,
            "type": "credit"
        }
    """

    if not isinstance(text, str):
        raise ValueError(
            "Please provide a text entry."
        )

    text = normalize_text(text)

    if not text:
        raise ValueError(
            "Please enter or speak an entry."
        )

    amount, amount_raw = find_amount(text)

    if amount is None:
        raise ValueError(
            "I could not find an amount. "
            "Please say or type the amount."
        )

    transaction_type = detect_transaction_type(
        text
    )

    name = extract_name(
        text,
        amount_raw
    )

    if not name:
        raise ValueError(
            "I could not find the customer name."
        )

    return {
        "name": name,
        "amount": float(amount),
        "type": transaction_type,
    }


# ---------------------------------------------------------
# Automated parser tests
# ---------------------------------------------------------

if __name__ == "__main__":
    tests = [
        # -------------------------------------------------
        # English credit
        # -------------------------------------------------

        (
            "Jai Patel taken debt of 500",
            {
                "name": "Jai Patel",
                "amount": 500.0,
                "type": "credit",
            },
        ),

        (
            "Ramesh Shah 750 credit",
            {
                "name": "Ramesh Shah",
                "amount": 750.0,
                "type": "credit",
            },
        ),

        (
            "Jai Patel borrowed 1000",
            {
                "name": "Jai Patel",
                "amount": 1000.0,
                "type": "credit",
            },
        ),

        # -------------------------------------------------
        # English payment
        # -------------------------------------------------

        (
            "Jai Patel paid 200",
            {
                "name": "Jai Patel",
                "amount": 200.0,
                "type": "payment",
            },
        ),

        (
            "Ramesh Shah received 300",
            {
                "name": "Ramesh Shah",
                "amount": 300.0,
                "type": "payment",
            },
        ),

        (
            "Jai Patel paid back 150",
            {
                "name": "Jai Patel",
                "amount": 150.0,
                "type": "payment",
            },
        ),

        # -------------------------------------------------
        # Hindi
        # -------------------------------------------------

        (
            "जय पटेल 500 उधार",
            {
                "name": "जय पटेल",
                "amount": 500.0,
                "type": "credit",
            },
        ),

        (
            "रमेश शाह ने 200 चुकाए",
            {
                "name": "रमेश शाह",
                "amount": 200.0,
                "type": "payment",
            },
        ),

        (
            "जय पटेल ५०० उधार",
            {
                "name": "जय पटेल",
                "amount": 500.0,
                "type": "credit",
            },
        ),

        # -------------------------------------------------
        # Gujarati
        # -------------------------------------------------

        (
            "જય પટેલ ને 300 ઉધાર",
            {
                "name": "જય પટેલ",
                "amount": 300.0,
                "type": "credit",
            },
        ),

        (
            "રમેશ શાહ ને 150 ચૂકવ્યા",
            {
                "name": "રમેશ શાહ",
                "amount": 150.0,
                "type": "payment",
            },
        ),

        (
            "જય પટેલ ૩૦૦ ઉધાર",
            {
                "name": "જય પટેલ",
                "amount": 300.0,
                "type": "credit",
            },
        ),

        # -------------------------------------------------
        # Numeric formatting
        # -------------------------------------------------

        (
            "Jai Patel taken debt of 1,500",
            {
                "name": "Jai Patel",
                "amount": 1500.0,
                "type": "credit",
            },
        ),
    ]

    passed = 0

    print()
    print("Voice Ledger Lite parser tests")
    print("=" * 50)

    for index, (text, expected) in enumerate(
        tests,
        start=1
    ):
        try:
            result = parse(text)

            if result == expected:
                print(
                    f"PASS {index:02d}: {text}"
                )
                passed += 1

            else:
                print(
                    f"FAIL {index:02d}: {text}"
                )
                print(
                    f"      Expected: {expected}"
                )
                print(
                    f"      Got:      {result}"
                )

        except Exception as exc:
            print(
                f"FAIL {index:02d}: {text}"
            )
            print(
                f"      Error: {exc}"
            )

    print("=" * 50)
    print(
        f"{passed}/{len(tests)} tests passed"
    )

    if passed == len(tests):
        print("All parser tests passed.")

    else:
        raise SystemExit(
            "Some parser tests failed."
        )