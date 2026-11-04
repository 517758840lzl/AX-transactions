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

export type SparkKind = 'idea' | 'diary' | 'thought' | 'summary';

export type Spark = {
    id: string;
    body: string;
    /** Day the thought belongs to, yyyy-MM-dd. */
    writtenOn: string;
    kind: SparkKind;
    tags: string[];
    favorite: boolean;
    image?: string;
};

export function parseSparkTags(raw: string) {
    const seen = new Set<string>();
    const tags: string[] = [];
    for (const piece of raw.split(/[\s,，#]+/)) {
        const tag = piece.trim();
        if (!tag || tag.length > 20 || seen.has(tag)) continue;
        seen.add(tag);
        tags.push(tag);
        if (tags.length === 8) break;
    }
    return tags;
}

export function sparkKindOf(raw: unknown): SparkKind {
    return raw === 'diary' || raw === 'thought' || raw === 'summary' || raw === 'idea' ? raw : 'idea';
}

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
    /** Icon key chosen for a category the person added. Presets are recognized by name. */
    categoryMarks?: Record<string, string>;
    /** 2 means the longer preset list has already been folded in. */
    presetStamp?: number;
    accounts: Account[];
    entries: Entry[];
    goals: SavingGoal[];
    sparks: Spark[];
    sampleCleared?: boolean;
    /** True after they pick a language. Older books never had this. */
    localeChosen?: boolean;
    hideAmounts?: boolean;
    lockOnOpen?: boolean;
    dailyReminder?: boolean;
    reminderHour?: number;
    reminderMinute?: number;
    removed?: RemovedEntry[];
};

const storageKey = 'ledger-book-v1';

export const starterCategories = ['Dining', 'Transit', 'Shopping', 'Daily', 'Housing', 'Snacks', 'Clothes', 'Entertainment', 'Social', 'Pets', 'Kids', 'Sports', 'Medical', 'Phone', 'Education', 'Subscriptions', 'Income', 'Travel', 'Beauty'];

const previousCategories = ['Dining', 'Transit', 'Daily', 'Housing', 'Income', 'Subscriptions', 'Entertainment'];

export function adoptCategories(book: Book): Book {
    if (book.presetStamp === 2) return book;
    const current = new Set(book.categories);
    const previous = new Set(previousCategories);
    const same = current.size === previous.size && previousCategories.every((name) => current.has(name));
    if (same) return { ...book, categories: [...starterCategories], presetStamp: 2 };
    const extras = starterCategories.filter((name) => !previous.has(name) && !current.has(name));
    return { ...book, categories: [...book.categories, ...extras], presetStamp: 2 };
}

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

const sampleNames: Record<string, { zh: string; en: string }> = {
    'sample-lunch': { zh: '午餐', en: 'Lunch' },
    'sample-coffee': { zh: '咖啡', en: 'Coffee' },
    'sample-metro': { zh: '地铁', en: 'Metro' },
};

function sampleTag(locale: string) {
    return locale === 'zh' ? '示例' : 'Sample';
}

export function bareMemo(title: string) {
    return stripSampleTag(title);
}

function stripSampleTag(title: string) {
    const tags = ['示例', 'Sample'];
    for (const tag of tags) {
        const suffix = ` (${tag})`;
        if (title.endsWith(suffix)) return title.slice(0, -suffix.length);
    }
    return title;
}

export function sampleDisplayTitle(id: string, locale: string, current: string) {
    const names = sampleNames[id];
    const bare = stripSampleTag(current);
    const known = names ? [names.zh, names.en] : [];
    const base = names && known.includes(bare) ? (locale === 'zh' ? names.zh : names.en) : bare;
    const suffix = ` (${sampleTag(locale)})`;
    return base.endsWith(suffix) ? base : `${base}${suffix}`;
}

export function labelSampleEntries<T extends Pick<Book, 'entries' | 'locale' | 'sampleCleared'>>(book: T): T {
    if (book.sampleCleared) return book;
    let changed = false;
    const entries = book.entries.map((entry) => {
        if (!entry.id.startsWith('sample-')) return entry;
        const title = sampleDisplayTitle(entry.id, book.locale, entry.title);
        if (title === entry.title) return entry;
        changed = true;
        return { ...entry, title };
    });
    return changed ? { ...book, entries } : book;
}

export function withSample(book: Book): Book {
    return withoutSample(book);
}

export function releaseDisplay<T extends Pick<Book, 'accounts' | 'entries' | 'sampleCleared'>>(book: T): T {
    const hasOwn = book.entries.some((entry) => !entry.id.startsWith('sample-')) || book.accounts.some((account) => !account.id.startsWith('sample-'));
    if (!hasOwn) return book;
    return {
        ...book,
        sampleCleared: true,
        accounts: book.accounts.filter((account) => !account.id.startsWith('sample-')),
        entries: book.entries.filter((entry) => !entry.id.startsWith('sample-')),
    };
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
        categoryMarks: {},
        presetStamp: 2,
        accounts: [],
        entries: [],
        goals: [],
        sparks: [],
        hideAmounts: false,
        lockOnOpen: false,
        dailyReminder: false,
        reminderHour: 21,
        reminderMinute: 30,
        removed: [],
    });
}

export function normalizeCurrency(value: unknown): Currency {
    if (value === 'CNY') return 'USD';
    return currencyOptions.includes(value as Currency) ? (value as Currency) : 'USD';
}

function bookFromRaw(raw: string | null): Book | null {
    if (!raw) return null;
    try {
        const stored = JSON.parse(raw) as Partial<Book> & { holdings?: unknown };
        const { holdings: _ignoredHoldings, ...parsed } = stored;
        if (!parsed || !Array.isArray(parsed.entries) || !Array.isArray(parsed.accounts)) return emptyBook();
        return adoptCategories(withSample({
            ...emptyBook(),
            ...parsed,
            categories: parsed.categories?.length ? parsed.categories : [...starterCategories],
            categoryMarks: parsed.categoryMarks && typeof parsed.categoryMarks === 'object' ? parsed.categoryMarks : {},
            presetStamp: parsed.presetStamp === 2 ? 2 : 0,
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
            sparks: parseSparks(parsed.sparks),
            removed: purgeRemoved(parseRemoved(parsed.removed)),
            lockOnOpen: parsed.lockOnOpen === true,
            sampleCleared: parsed.sampleCleared,
            locale: parsed.locale === 'zh' ? 'zh' : 'en',
            hideAmounts: parsed.hideAmounts === true,
            currency: normalizeCurrency(parsed.currency),
            monthlyBudget: typeof parsed.monthlyBudget === 'number' && parsed.monthlyBudget > 0 ? parsed.monthlyBudget : null,
            categoryBudgets: parsed.categoryBudgets && typeof parsed.categoryBudgets === 'object' ? parsed.categoryBudgets : {},
            templates: dedupeTemplates(Array.isArray(parsed.templates) ? parsed.templates : []),
        }));
    } catch {
        return null;
    }
}

export function loadBook(): Book {
    return bookFromRaw(localStorage.getItem(storageKey)) ?? emptyBook();
}

const bookDbName = 'ledger-book';
const bookStoreName = 'book';
let bookWrite = Promise.resolve();
let bookWriteTicket = 0;

function openBookDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(bookDbName, 1);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(bookStoreName)) db.createObjectStore(bookStoreName);
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function readBookRecord(db: IDBDatabase): Promise<Book | null> {
    return new Promise((resolve, reject) => {
        const request = db.transaction(bookStoreName).objectStore(bookStoreName).get(storageKey);
        request.onsuccess = () => resolve(bookFromRaw(request.result ? JSON.stringify(request.result) : null));
        request.onerror = () => reject(request.error);
    });
}

function writeBookRecord(db: IDBDatabase, book: Book): Promise<void> {
    return new Promise((resolve, reject) => {
        const request = db.transaction(bookStoreName, 'readwrite').objectStore(bookStoreName).put(book, storageKey);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

export async function openStoredBook(): Promise<Book> {
    try {
        const db = await openBookDb();
        const stored = await readBookRecord(db);
        if (stored) return stored;
        const legacy = loadBook();
        await writeBookRecord(db, legacy);
        localStorage.removeItem(storageKey);
        return legacy;
    } catch {
        return loadBook();
    }
}

export function saveBook(book: Book) {
    const ticket = ++bookWriteTicket;
    const snapshot = book;
    bookWrite = bookWrite.then(async () => {
        if (ticket !== bookWriteTicket) return;
        try {
            const db = await openBookDb();
            if (ticket !== bookWriteTicket) return;
            await writeBookRecord(db, snapshot);
            localStorage.removeItem(storageKey);
        } catch {
            if (ticket === bookWriteTicket) localStorage.setItem(storageKey, JSON.stringify(snapshot));
        }
    });
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

export function parseSparks(raw: unknown): Spark[] {
    if (!Array.isArray(raw)) return [];
    const kept: Spark[] = [];
    for (const item of raw) {
        if (!item || typeof item !== 'object') continue;
        const row = item as Partial<Spark>;
        const body = String(row.body ?? '').trim();
        const writtenOn = String(row.writtenOn ?? '');
        if (!body || !/^\d{4}-\d{2}-\d{2}$/.test(writtenOn)) continue;
        kept.push({
            id: typeof row.id === 'string' && row.id ? row.id : createId(),
            body: body.slice(0, 2000),
            writtenOn,
            kind: sparkKindOf(row.kind),
            tags: parseSparkTags(Array.isArray(row.tags) ? row.tags.join(' ') : ''),
            favorite: row.favorite === true,
            image: typeof row.image === 'string' && row.image.startsWith('data:image/') ? row.image : undefined,
        });
    }
    return kept;
}
