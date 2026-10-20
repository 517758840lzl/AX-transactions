export type Gender = 'female' | 'male' | 'secret';
export type Direction = 'out' | 'in';
export type Currency = 'USD' | 'EUR' | 'CNY';

export type Account = {
    id: string;
    name: string;
    opening: number;
};

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
};

export type Book = {
    nickname: string;
    gender: Gender;
    currency: Currency;
    categories: string[];
    accounts: Account[];
    entries: Entry[];
    sampleCleared?: boolean;
};

const storageKey = 'ledger-book-v1';

export const starterCategories = ['餐饮', '交通', '日用', '居住', '收入', '订阅', '娱乐'];

export const currencyMark: Record<Currency, string> = {
    USD: '$',
    EUR: '€',
    CNY: '¥',
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

function dateInMonth(offset: number, day: number) {
    const now = new Date();
    const last = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0).getDate();
    const date = new Date(now.getFullYear(), now.getMonth() + offset, Math.min(day, last));
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const dateText = `${date.getDate()}`.padStart(2, '0');
    return `${date.getFullYear()}-${month}-${dateText}`;
}

function earlierSamples(card: string): Entry[] {
    return [
        { id: 'sample-prev-coffee', title: '咖啡', amount: 7.2, direction: 'out', category: '餐饮', date: dateInMonth(-1, 6), accountId: card, shared: false, checked: true },
        { id: 'sample-prev-market', title: '超市', amount: 48, direction: 'out', category: '日用', date: dateInMonth(-1, 14), accountId: card, shared: true, checked: true },
        { id: 'sample-prev-ride', title: '地铁', amount: 18, direction: 'out', category: '交通', date: dateInMonth(-1, 21), accountId: card, shared: false, checked: false },
        { id: 'sample-prev-rent', title: '房租', amount: 1450, direction: 'out', category: '居住', date: dateInMonth(-1, 5), accountId: card, shared: true, checked: true },
    ];
}
function sampleBookParts(): Pick<Book, 'accounts' | 'entries'> {
    const cash = 'sample-cash';
    const card = 'sample-card';
    return {
        accounts: [
            { id: cash, name: '现金', opening: 860 },
            { id: card, name: 'Visa', opening: 4200 },
        ],
        entries: [
            { id: 'sample-lunch', title: '午饭', amount: 18.4, direction: 'out', category: '餐饮', date: daysAgo(0), accountId: cash, shared: false, checked: false },
            { id: 'sample-metro', title: '地铁', amount: 2.75, direction: 'out', category: '交通', date: daysAgo(0), accountId: cash, shared: false, checked: true },
            { id: 'sample-coffee', title: '咖啡', amount: 6.5, direction: 'out', category: '餐饮', date: daysAgo(1), accountId: card, shared: false, checked: false },
            { id: 'sample-market', title: '超市', amount: 54.2, direction: 'out', category: '日用', date: daysAgo(1), accountId: card, shared: true, checked: true },
            { id: 'sample-film', title: '电影', amount: 16, direction: 'out', category: '娱乐', date: daysAgo(4), accountId: card, shared: false, checked: false },
            { id: 'sample-sub', title: '视频会员', amount: 15.99, direction: 'out', category: '订阅', date: daysAgo(8), accountId: card, shared: false, checked: true },
            { id: 'sample-rent', title: '房租', amount: 1450, direction: 'out', category: '居住', date: daysAgo(15), accountId: card, shared: true, checked: true },
            { id: 'sample-pay', title: '工资', amount: 3200, direction: 'in', category: '收入', date: daysAgo(19), accountId: card, shared: false, checked: true },
            ...earlierSamples(card),
        ],
    };
}

export function withSample(book: Book): Book {
    if (book.sampleCleared) return book;
    if (book.accounts.length === 0 && book.entries.length === 0) return { ...book, ...sampleBookParts() };
    const stillSample = book.entries.length > 0 && book.entries.every((entry) => entry.id.startsWith('sample-')) && book.accounts.some((account) => account.id === 'sample-card');
    if (!stillSample) return book;
    const missing = earlierSamples('sample-card').filter((entry) => !book.entries.some((item) => item.id === entry.id));
    if (missing.length === 0) return book;
    return { ...book, entries: [...book.entries, ...missing] };
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
        currency: 'USD',
        categories: [...starterCategories],
        accounts: [],
        entries: [],
    });
}

export function loadBook(): Book {
    try {
        const raw = localStorage.getItem(storageKey);
        if (!raw) return emptyBook();
        const parsed = JSON.parse(raw) as Partial<Book>;
        if (!parsed || !Array.isArray(parsed.entries) || !Array.isArray(parsed.accounts)) return emptyBook();
        return withSample({
            ...emptyBook(),
            ...parsed,
            categories: parsed.categories?.length ? parsed.categories : [...starterCategories],
            accounts: parsed.accounts,
            entries: parsed.entries,
            sampleCleared: parsed.sampleCleared,
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

export function accountTotal(account: Account, entries: Entry[]) {
    return entries
        .filter((entry) => entry.accountId === account.id)
        .reduce((sum, entry) => sum + signedValue(entry), account.opening);
}
