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
    /** 1–28。0 表示信用卡还没设出账日。 */
    statementDay?: number;
    dueDay?: number;
};

/** 股票 / ETF / 场外基金；不绑证券账户，手动维护 */
export type HoldingKind = 'stock' | 'etf' | 'fund';

export type Holding = {
    id: string;
    kind: HoldingKind;
    code: string;
    name: string;
    qty: number;
    /** 总成本（非单价） */
    costTotal: number;
    price: number;
    priceAsOf: string;
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
    /** 缺省视为 none，旧账不改写其它字段 */
    claim?: ClaimMark;
    /** 缺省计入预算。转账、退款、报销入账为 false。 */
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

/** 备注、金额、收支、分类、账户、共享范围全部相同视为同一模板 */
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
    /** 本月支出预算；null 表示未设置 */
    monthlyBudget: number | null;
    /** 分类支出上限（可选） */
    categoryBudgets: Record<string, number>;
    templates: EntryTemplate[];
    categories: string[];
    accounts: Account[];
    holdings: Holding[];
    entries: Entry[];
    goals: SavingGoal[];
    sampleCleared?: boolean;
    hideAmounts?: boolean;
    lockOnOpen?: boolean;
    removed?: RemovedEntry[];
};

const storageKey = 'ledger-book-v1';

export const starterCategories = ['餐饮', '交通', '日用', '居住', '收入', '订阅', '娱乐'];

/** 分类预算输入框占位金额（元/月，仅提示，不自动写入） */
export const categoryBudgetHintByName: Record<string, number> = {
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
            { id: cash, name: '现金', opening: 860, kind: 'cash' },
            { id: card, name: 'Visa', opening: 4200, kind: 'card' },
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
        locale: 'zh',
        currency: 'USD',
        monthlyBudget: null,
        categoryBudgets: {},
        templates: [],
        categories: [...starterCategories],
        accounts: [],
        holdings: [],
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
        const parsed = JSON.parse(raw) as Partial<Book>;
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
            locale: parsed.locale === 'en' ? 'en' : 'zh',
            hideAmounts: parsed.hideAmounts === true,
            currency: normalizeCurrency(parsed.currency),
            monthlyBudget: typeof parsed.monthlyBudget === 'number' && parsed.monthlyBudget > 0 ? parsed.monthlyBudget : null,
            categoryBudgets: parsed.categoryBudgets && typeof parsed.categoryBudgets === 'object' ? parsed.categoryBudgets : {},
            templates: dedupeTemplates(Array.isArray(parsed.templates) ? parsed.templates : []),
            holdings: parseHoldings(parsed.holdings),
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

export function normalizeHoldingKind(value: unknown): HoldingKind {
    if (value === 'etf' || value === 'fund') return value;
    return 'stock';
}

/** 早期表单把「每股成本」误存进 costTotal 时，按每股还原后再 × 份额 */
function fixLegacyHoldingCost(holding: Holding): Holding {
    if (holding.qty < 10) return holding;
    const perUnitIfStoredAsTotal = holding.costTotal / holding.qty;
    const looksLikePerShareInTotalField =
        holding.costTotal <= holding.price * 2
        && Math.abs(holding.costTotal - holding.price) < Math.abs(perUnitIfStoredAsTotal - holding.price);
    if (!looksLikePerShareInTotalField) return holding;
    return { ...holding, costTotal: roundMoney(holding.costTotal * holding.qty) };
}

export function parseHoldings(raw: unknown): Holding[] {
    if (!Array.isArray(raw)) return [];
    const kept: Holding[] = [];
    for (const item of raw) {
        if (!item || typeof item !== 'object') continue;
        const row = item as Partial<Holding>;
        const code = String(row.code ?? '').trim();
        const name = String(row.name ?? '').trim();
        const qty = Number(row.qty);
        const costTotal = Number(row.costTotal);
        const price = Number(row.price);
        if (!code || !name || !Number.isFinite(qty) || qty <= 0) continue;
        if (!Number.isFinite(costTotal) || costTotal < 0) continue;
        if (!Number.isFinite(price) || price <= 0) continue;
        kept.push(fixLegacyHoldingCost({
            id: typeof row.id === 'string' && row.id ? row.id : createId(),
            kind: normalizeHoldingKind(row.kind),
            code,
            name,
            qty: roundMoney(qty),
            costTotal: roundMoney(costTotal),
            price: roundMoney(price),
            priceAsOf: typeof row.priceAsOf === 'string' && row.priceAsOf ? row.priceAsOf : todayIsoStatic(),
        }));
    }
    return kept;
}

function todayIsoStatic() {
    const now = new Date();
    const month = `${now.getMonth() + 1}`.padStart(2, '0');
    const day = `${now.getDate()}`.padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
}

export function holdingMarketValue(holding: Holding) {
    return roundMoney(holding.qty * holding.price);
}

export function holdingsMarketTotal(holdings: Holding[]) {
    return holdings.reduce((sum, item) => sum + holdingMarketValue(item), 0);
}

/** 每股/每份成本（存库为 costTotal，展示与录入用） */
export function holdingCostPrice(holding: Holding) {
    if (holding.qty <= 0) return 0;
    return roundMoney(holding.costTotal / holding.qty);
}

export function holdingCostTotalFromPrice(qty: number, costPrice: number) {
    return roundMoney(qty * costPrice);
}

/** 浮动盈亏 = 市值 − 成本总额（= (现价 − 成本价) × 份额） */
export function holdingUnrealizedPnl(holding: Holding) {
    return roundMoney(holdingMarketValue(holding) - holding.costTotal);
}

export function countsTowardWorth(account: Account) {
    return account.archived !== true;
}

export function accountsBalanceTotal(accounts: Account[], entries: Entry[]) {
    return accounts.filter(countsTowardWorth).reduce((sum, account) => sum + accountTotal(account, entries), 0);
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

/** 净资产 = 账户余额 + 持仓市值（V0 持仓按当前市值计入历史曲线） */
export function bookNetWorth(accounts: Account[], entries: Entry[], holdings: Holding[]) {
    return roundMoney(accountsBalanceTotal(accounts, entries) + holdingsMarketTotal(holdings));
}

export function bookNetWorthOnDate(accounts: Account[], entries: Entry[], holdings: Holding[], iso: string) {
    return roundMoney(bookBalanceOnDate(accounts, entries, iso) + holdingsMarketTotal(holdings));
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

export function holdingsEquivalent(a: Pick<Holding, 'kind' | 'code'>, b: Pick<Holding, 'kind' | 'code'>) {
    return a.kind === b.kind && a.code.trim().toUpperCase() === b.code.trim().toUpperCase();
}
