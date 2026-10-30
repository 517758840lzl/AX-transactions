export type Gender = 'female' | 'male' | 'secret';
export type Direction = 'out' | 'in';
export type Currency = 'USD' | 'EUR' | 'JPY' | 'GBP' | 'HKD' | 'TWD' | 'SGD' | 'AUD' | 'KRW' | 'CAD';

export const currencyOptions: Currency[] = ['USD', 'EUR', 'JPY', 'GBP', 'HKD', 'TWD', 'SGD', 'AUD', 'KRW', 'CAD'];
export type BookLocale = 'zh' | 'en';

export type AccountKind = 'bank' | 'cash' | 'card' | 'other';

export const accountKindOrder: AccountKind[] = ['bank', 'cash', 'card', 'other'];

export type Account = {
    id: string;
    name: string;
    opening: number;
    kind: AccountKind;
    archived?: boolean;
    /** 1–28. 0 means no statement day yet. */
    statementDay?: number;
    dueDay?: number;
};

export type ClaimMark = 'none' | 'waiting' | 'done';

export type Entry = {
    id: string;
    title: string;
    amount: number;
    direction: Direction;
    category: string;
    date: string;
    accountId: string;
    shared: boolean;
    checked: boolean;
    /** Missing means none. Leave old books alone. */
    claim?: ClaimMark;
    /** Counts, unless it's a transfer, a refund, or a reimbursement. */
    countsInBudget?: boolean;
    refundOf?: string;
    goalId?: string;
    splitGroup?: string;
};

export type RemovedEntry = {
    entry: Entry;
    removedOn: string;
};

export type SavingGoal = {
    id: string;
    title: string;
    target: number;
    saved: number;
};

export type EntryTemplate = {
    id: string;
    title: string;
    amount: number;
    direction: Direction;
    category: string;
    accountId: string;
    shared: boolean;
};

export type EntryTemplatePayload = Omit<EntryTemplate, 'id'>;

function normalizeTemplateAmount(amount: number) {
    return Math.round(amount * 100) / 100;
}

/** Same memo, amount, direction, category, account, and household flag is one template. */
export function templatesEquivalent(
    a: Pick<EntryTemplate, 'title' | 'amount' | 'direction' | 'category' | 'accountId' | 'shared'>,
    b: Pick<EntryTemplate, 'title' | 'amount' | 'direction' | 'category' | 'accountId' | 'shared'>,
) {
    return (
        a.title.trim() === b.title.trim()
        && normalizeTemplateAmount(a.amount) === normalizeTemplateAmount(b.amount)
        && a.direction === b.direction
        && a.category === b.category
        && a.accountId === b.accountId
        && a.shared === b.shared
    );
}

export function dedupeTemplates(templates: EntryTemplate[]) {
    const kept: EntryTemplate[] = [];
    for (const item of templates) {
        if (!kept.some((existing) => templatesEquivalent(existing, item))) kept.push(item);
    }
    return kept;
}

export type Book = {
    nickname: string;
    gender: Gender;
    locale: BookLocale;
    currency: Currency;
    /** This month's spend cap. null if they haven't set one. */
    monthlyBudget: number | null;
    /** Optional cap per category. */
    categoryBudgets: Record<string, number>;
    templates: EntryTemplate[];
    categories: string[];
    accounts: Account[];
    entries: Entry[];
    goals: SavingGoal[];
    sampleCleared?: boolean;
    /** True after they pick a language. Older books never had this. */
    localeChosen?: boolean;
    hideAmounts?: boolean;
    lockOnOpen?: boolean;
    removed?: RemovedEntry[];
};

const storageKey = 'ledger-book-v1';

export const starterCategories = ['Dining', 'Transit', 'Daily', 'Housing', 'Income', 'Subscriptions', 'Entertainment'];

/** Placeholder numbers in the category cap fields. Not saved. */
export const categoryBudgetHintByName: Record<string, number> = {
    Dining: 1800,
    Transit: 400,
    Daily: 600,
    Housing: 3200,
    Income: 8000,
    Subscriptions: 200,
    Entertainment: 500,
    餐饮: 1800,
    交通: 400,
    日用: 600,
    居住: 3200,
    收入: 8000,
    订阅: 200,
    娱乐: 500,
};

function budgetHintAmount(value: number) {
    return value.toFixed(2);
}

export function categoryBudgetHint(name: string) {
    return budgetHintAmount(categoryBudgetHintByName[name] ?? 500);
}

export function defaultMonthlyBudgetHint() {
    return budgetHintAmount(5000);
}

export const currencyMark: Record<Currency, string> = {
    USD: '$',
    EUR: '€',
    JPY: '円',
    GBP: '£',
    HKD: 'HK$',
    TWD: 'NT$',
    SGD: 'S$',
    AUD: 'A$',
    KRW: '₩',
    CAD: 'C$',
};

function daysAgo(ago: number) {
    const now = new Date();
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ago);
    if (date.getMonth() !== now.getMonth()) {
        date.setFullYear(now.getFullYear(), now.getMonth(), 1);
    }
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
}

function sampleBookParts(): Pick<Book, 'accounts' | 'entries'> {
    const cash = 'sample-cash';
    const card = 'sample-card';
    return {
        accounts: [
            { id: cash, name: 'Cash', opening: 100, kind: 'cash' },
            { id: card, name: 'Visa', opening: 200, kind: 'card' },
        ],
        entries: [
            { id: 'sample-lunch', title: 'Lunch', amount: 18.4, direction: 'out', category: 'Dining', date: daysAgo(0), accountId: cash, shared: false, checked: false },
            { id: 'sample-coffee', title: 'Coffee', amount: 6.5, direction: 'out', category: 'Dining', date: daysAgo(1), accountId: card, shared: true, checked: true },
            { id: 'sample-metro', title: 'Metro', amount: 2.75, direction: 'out', category: 'Transit', date: daysAgo(0), accountId: cash, shared: false, checked: true },
        ],
    };
}

export function withSample(book: Book): Book {
    if (book.sampleCleared) return book;
    const next = sampleBookParts();
    const empty = book.accounts.length === 0 && book.entries.length === 0;
    const onlySample = book.accounts.length > 0
        && book.entries.length > 0
        && book.accounts.every((account) => account.id.startsWith('sample-'))
        && book.entries.every((entry) => entry.id.startsWith('sample-'));
    if (!empty && !onlySample) return book;
    return { ...book, ...next, categories: [...starterCategories] };
}

export function withoutSample(book: Book): Book {
    return {
        ...book,
        sampleCleared: true,
        accounts: book.accounts.filter((account) => !account.id.startsWith('sample-')),
        entries: book.entries.filter((entry) => !entry.id.startsWith('sample-')),
    };
}

export function emptyBook(): Book {
    return withSample({
        nickname: '',
        gender: 'secret',
        locale: 'en',
        currency: 'USD',
        monthlyBudget: null,
        categoryBudgets: {},
        templates: [],
        categories: [...starterCategories],
        accounts: [],
        entries: [],
        goals: [],
        hideAmounts: false,
        lockOnOpen: false,
        removed: [],
    });
}

export function normalizeCurrency(value: unknown): Currency {
    if (value === 'CNY') return 'USD';
    return currencyOptions.includes(value as Currency) ? (value as Currency) : 'USD';
}

export function loadBook(): Book {
    try {
        const raw = localStorage.getItem(storageKey);
        if (!raw) return emptyBook();
        const stored = JSON.parse(raw) as Partial<Book> & { holdings?: unknown };
        const { holdings: _ignoredHoldings, ...parsed } = stored;
        if (!parsed || !Array.isArray(parsed.entries) || !Array.isArray(parsed.accounts)) return emptyBook();
        return withSample({
            ...emptyBook(),
            ...parsed,
            categories: parsed.categories?.length ? parsed.categories : [...starterCategories],
            accounts: parsed.accounts.map((account) => ({
                id: account.id,
                name: account.name,
                opening: account.opening,
                kind: normalizeAccountKind(account.kind),
                archived: account.archived === true,
                statementDay: cycleDay(account.statementDay),
                dueDay: cycleDay(account.dueDay),
            })),
            entries: parsed.entries.map((entry) => ({
                ...entry,
                claim: normalizeClaim(entry.claim),
                refundOf: typeof entry.refundOf === 'string' ? entry.refundOf : '',
                goalId: typeof entry.goalId === 'string' ? entry.goalId : '',
                splitGroup: typeof entry.splitGroup === 'string' ? entry.splitGroup : '',
            })),
            goals: parseGoals(parsed.goals),
            removed: purgeRemoved(parseRemoved(parsed.removed)),
            lockOnOpen: parsed.lockOnOpen === true,
            sampleCleared: parsed.sampleCleared,
            locale: parsed.locale === 'zh' ? 'zh' : 'en',
            hideAmounts: parsed.hideAmounts === true,
            currency: normalizeCurrency(parsed.currency),
            monthlyBudget: typeof parsed.monthlyBudget === 'number' && parsed.monthlyBudget > 0 ? parsed.monthlyBudget : null,
            categoryBudgets: parsed.categoryBudgets && typeof parsed.categoryBudgets === 'object' ? parsed.categoryBudgets : {},
            templates: dedupeTemplates(Array.isArray(parsed.templates) ? parsed.templates : []),
        });
    } catch {
        return emptyBook();
    }
}

export function saveBook(book: Book) {
    localStorage.setItem(storageKey, JSON.stringify(book));
}

export function createId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function signedValue(entry: Entry) {
    return entry.direction === 'out' ? -entry.amount : entry.amount;
}

export function normalizeAccountKind(value: unknown): AccountKind {
    if (value === 'bank' || value === 'cash' || value === 'card' || value === 'other') return value;
    return 'cash';
}

export function accountTotal(account: Account, entries: Entry[]) {
    return entries
        .filter((entry) => entry.accountId === account.id)
        .reduce((sum, entry) => sum + signedValue(entry), account.opening);
}

export function accountBalanceOnDate(account: Account, entries: Entry[], iso: string) {
    return entries
        .filter((entry) => entry.accountId === account.id && entry.date <= iso)
        .reduce((sum, entry) => sum + signedValue(entry), account.opening);
}

export function bookBalanceOnDate(accounts: Account[], entries: Entry[], iso: string) {
    return accounts.filter(countsTowardWorth).reduce((sum, account) => sum + accountBalanceOnDate(account, entries, iso), 0);
}

function roundMoney(value: number) {
    return Math.round(value * 100) / 100;
}

function todayIsoStatic() {
    const now = new Date();
    const month = `${now.getMonth() + 1}`.padStart(2, '0');
    const day = `${now.getDate()}`.padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
}


export function countsTowardWorth(account: Account) {
    return account.archived !== true;
}

export function accountsBalanceTotal(accounts: Account[], entries: Entry[]) {
    return accounts.filter(countsTowardWorth).reduce((sum, account) => sum + accountTotal(account, entries), 0);
}

export function moneyTyping(raw: string) {
    let kept = '';
    let dotted = false;
    let places = 0;
    for (const character of raw) {
        if (character >= '0' && character <= '9') {
            if (dotted) {
                if (places >= 2) continue;
                places += 1;
            }
            kept += character;
        } else if (character === '.' && !dotted) {
            dotted = true;
            kept += '.';
        }
    }
    return kept;
}

export function solveMoney(raw: string) {
    const text = raw.replace(/ /g, '').replace(/＋/g, '+').replace(/－/g, '-').replace(/−/g, '-');
    if (!text) return null;
    let total = 0;
    let number = '';
    let sign = 1;
    const flush = () => {
        if (!number) return false;
        const value = Number(number);
        if (!Number.isFinite(value)) return false;
        total += sign * value;
        number = '';
        return true;
    };
    for (const character of text) {
        if (character === '+' || character === '-') {
            if (!flush()) return null;
            sign = character === '-' ? -1 : 1;
        } else {
            number += character;
        }
    }
    if (!flush()) return null;
    return Math.round(total * 100) / 100;
}

function cycleDay(value: unknown) {
    const day = Math.round(Number(value));
    if (!Number.isFinite(day) || day < 1 || day > 28) return 0;
    return day;
}

function parseRemoved(raw: unknown): RemovedEntry[] {
    if (!Array.isArray(raw)) return [];
    const kept: RemovedEntry[] = [];
    for (const item of raw) {
        if (!item || typeof item !== 'object') continue;
        const row = item as Partial<RemovedEntry>;
        if (!row.entry || typeof row.entry !== 'object' || !row.entry.id) continue;
        kept.push({
            entry: { ...row.entry, claim: normalizeClaim(row.entry.claim) },
            removedOn: typeof row.removedOn === 'string' ? row.removedOn : todayIsoStatic(),
        });
    }
    return kept;
}

function purgeRemoved(list: RemovedEntry[]) {
    const cutoff = shiftIso(todayIsoStatic(), -7);
    return list.filter((item) => item.removedOn >= cutoff);
}

function shiftIso(iso: string, days: number) {
    const cursor = new Date(`${iso}T00:00:00`);
    cursor.setDate(cursor.getDate() + days);
    const month = `${cursor.getMonth() + 1}`.padStart(2, '0');
    const day = `${cursor.getDate()}`.padStart(2, '0');
    return `${cursor.getFullYear()}-${month}-${day}`;
}

/** Net worth: balances of accounts that count. */
export function bookNetWorth(accounts: Account[], entries: Entry[]) {
    return roundMoney(accountsBalanceTotal(accounts, entries));
}

export function bookNetWorthOnDate(accounts: Account[], entries: Entry[], iso: string) {
    return roundMoney(bookBalanceOnDate(accounts, entries, iso));
}

export function normalizeClaim(value: unknown): ClaimMark {
    if (value === 'waiting' || value === 'done') return value;
    return 'none';
}

export function parseGoals(raw: unknown): SavingGoal[] {
    if (!Array.isArray(raw)) return [];
    const kept: SavingGoal[] = [];
    for (const item of raw) {
        if (!item || typeof item !== 'object') continue;
        const row = item as Partial<SavingGoal>;
        const title = String(row.title ?? '').trim();
        const target = Number(row.target);
        const saved = Number(row.saved);
        if (!title || !Number.isFinite(target) || target <= 0) continue;
        if (!Number.isFinite(saved) || saved < 0) continue;
        kept.push({
            id: typeof row.id === 'string' && row.id ? row.id : createId(),
            title,
            target: roundMoney(target),
            saved: roundMoney(saved),
        });
    }
    return kept;
}
