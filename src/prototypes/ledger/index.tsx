/**
 * @name 记账
 */

import React, { useEffect, useMemo, useState } from 'react';
import { defineHashPageRoute, useHashPage } from '../../common/useHashPage';
import {
    accountBalanceOnDate,
    accountKindOrder,
    accountTotal,
    accountsBalanceTotal,
    bookBalanceOnDate,
    bookNetWorth,
    bookNetWorthOnDate,
    createId,
    holdingCostPrice,
    holdingCostTotalFromPrice,
    holdingMarketValue,
    holdingUnrealizedPnl,
    holdingsEquivalent,
    holdingsMarketTotal,
    normalizeHoldingKind,
    parseHoldings,
    currencyMark,
    currencyOptions,
    emptyBook,
    loadBook,
    normalizeAccountKind,
    normalizeCurrency,
    saveBook,
    signedValue,
    categoryBudgetHint,
    defaultMonthlyBudgetHint,
    dedupeTemplates,
    starterCategories,
    withoutSample,
    type Account,
    type AccountKind,
    type Book,
    type Direction,
    type Entry,
    type Gender,
    type Holding,
    type HoldingKind,
} from './store';
import { normalizeLocale, strings, type Copy, type Locale } from './i18n';
import './style.css';

const ALL_CATEGORIES = '*';
const ALL_ACCOUNTS = '*';

type Scope = 'mine' | 'family';
type PageId = 'dashboard' | 'transactions' | 'accounts' | 'me';
type Panel = 'none' | 'entry' | 'account' | 'accountDetail' | 'holding' | 'holdingDetail' | 'profile' | 'export' | 'import' | 'filter' | 'budget' | 'transfer';
type TxView = 'list' | 'calendar';
type PeriodMode = 'today' | 'month' | 'range';
type AccountsWindow = 7 | 30;

function genderLabel(gender: Gender, L: Copy) {
    if (gender === 'male') return L.genderMale;
    if (gender === 'female') return L.genderFemale;
    return L.genderSecret;
}

function GenderIcon({ gender, L }: { gender: Gender; L: Copy }) {
    const label = genderLabel(gender, L);
    if (gender === 'male') {
        return (
            <svg className="ledger-gender-icon" viewBox="0 0 24 24" role="img" aria-label={label}>
                <circle cx="10" cy="14" r="5" fill="none" stroke="currentColor" strokeWidth="1.75" />
                <path d="M14.5 9.5 20 4M20 4h-5M20 4v5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        );
    }
    if (gender === 'female') {
        return (
            <svg className="ledger-gender-icon" viewBox="0 0 24 24" role="img" aria-label={label}>
                <circle cx="12" cy="9" r="5" fill="none" stroke="currentColor" strokeWidth="1.75" />
                <path d="M12 14v6M9.5 17h5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
        );
    }
    return (
        <svg className="ledger-gender-icon" viewBox="0 0 24 24" role="img" aria-label={label}>
            <circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" strokeWidth="1.75" />
            <path d="M8.5 12h7" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
    );
}

const route = defineHashPageRoute([
    { id: 'dashboard', title: '总览' },
    { id: 'transactions', title: '流水' },
    { id: 'accounts', title: '账户' },
    { id: 'me', title: '我的' },
], { defaultPageId: 'dashboard' });

const legacyPage: Record<string, PageId> = {
    today: 'dashboard',
    book: 'transactions',
    assets: 'accounts',
    me: 'me',
};

const sliceColors = ['#E85D75', '#F4A261', '#E9C46A', '#C47B84', '#8D6E63', '#E8A0BF', '#B5838D', '#6B705C'];

function todayIso() {
    return isoDate(new Date());
}

function isoDate(date: Date) {
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
}

function monthBounds(offset: number) {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
    return { start: isoDate(start), end: isoDate(end) };
}

function eachDay(start: string, end: string) {
    const days: string[] = [];
    const cursor = new Date(`${start}T00:00:00`);
    const last = new Date(`${end}T00:00:00`);
    while (cursor <= last && days.length < 62) {
        days.push(isoDate(cursor));
        cursor.setDate(cursor.getDate() + 1);
    }
    return days;
}

function dayLabel(iso: string, locale: Locale, L: Copy) {
    const today = todayIso();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yIso = isoDate(yesterday);
    if (iso === today) return L.dayToday;
    if (iso === yIso) return L.dayYesterday;
    const date = new Date(`${iso}T00:00:00`);
    if (locale === 'en') {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    const [, m, d] = iso.split('-');
    return `${Number(m)}月${Number(d)}日`;
}

function dashboardHeading(locale: Locale, L: Copy) {
    const now = new Date();
    if (locale === 'en') {
        return `${now.toLocaleString('en-US', { month: 'long' })} ${L.monthOverview}`;
    }
    return `${now.getMonth() + 1}月${L.monthOverview}`;
}

function periodBounds(mode: PeriodMode, rangeFrom: string, rangeTo: string) {
    const today = todayIso();
    if (mode === 'today') return { start: today, end: today };
    if (mode === 'month') {
        const month = monthBounds(0);
        return { start: month.start, end: month.end > today ? today : month.end };
    }
    const start = rangeFrom <= rangeTo ? rangeFrom : rangeTo;
    const end = rangeFrom <= rangeTo ? rangeTo : rangeFrom;
    return { start, end: end > today ? today : end };
}

function periodChipLabel(mode: PeriodMode, rangeFrom: string, rangeTo: string, locale: Locale, L: Copy) {
    if (mode === 'today') return L.periodToday;
    if (mode === 'month') {
        const now = new Date();
        if (locale === 'en') return now.toLocaleString('en-US', { month: 'short' });
        return `${now.getMonth() + 1}月`;
    }
    const start = rangeFrom <= rangeTo ? rangeFrom : rangeTo;
    const end = rangeFrom <= rangeTo ? rangeTo : rangeFrom;
    if (start === end) return dayLabel(start, locale, L);
    const [, sm, sd] = start.split('-');
    const [, em, ed] = end.split('-');
    return `${Number(sm)}/${Number(sd)}–${Number(em)}/${Number(ed)}`;
}

function accountKindLabel(L: Copy, kind: AccountKind) {
    if (kind === 'bank') return L.accountKindBank;
    if (kind === 'card') return L.accountKindCard;
    if (kind === 'other') return L.accountKindOther;
    return L.accountKindCash;
}

function accountsWindowStart(days: AccountsWindow) {
    const cursor = new Date();
    cursor.setDate(cursor.getDate() - (days - 1));
    return isoDate(cursor);
}

function isoBefore(iso: string) {
    const cursor = new Date(`${iso}T00:00:00`);
    cursor.setDate(cursor.getDate() - 1);
    return isoDate(cursor);
}

function formatPct(delta: number, base: number) {
    if (base === 0) return delta === 0 ? '0%' : '—';
    const pct = (delta / Math.abs(base)) * 100;
    const sign = pct > 0 ? '+' : '';
    return `${sign}${pct.toFixed(1)}%`;
}

function netWorthSeries(accounts: Account[], entries: Entry[], holdings: Holding[], days: AccountsWindow) {
    const start = accountsWindowStart(days);
    const end = todayIso();
    return eachDay(start, end).map((day) => ({
        day,
        amount: bookNetWorthOnDate(accounts, entries, holdings, day),
    }));
}

function holdingKindLabel(L: Copy, kind: HoldingKind) {
    if (kind === 'etf') return L.holdingKindEtf;
    if (kind === 'fund') return L.holdingKindFund;
    return L.holdingKindStock;
}

function formatHoldingQty(kind: HoldingKind, qty: number) {
    const digits = kind === 'etf' ? 3 : 2;
    return qty.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: digits });
}

function accountPeriodFlow(accountId: string, entries: Entry[], start: string, end: string) {
    const list = entries.filter((entry) => entry.accountId === accountId && entry.date >= start && entry.date <= end);
    const inflow = list.filter((entry) => entry.direction === 'in').reduce((sum, entry) => sum + entry.amount, 0);
    const outflow = list.filter((entry) => entry.direction === 'out').reduce((sum, entry) => sum + entry.amount, 0);
    return { inflow, outflow, net: inflow - outflow };
}

function streakDays(entries: Entry[]) {
    const days = new Set(entries.map((entry) => entry.date));
    if (days.size === 0) return 0;
    let streak = 0;
    const cursor = new Date();
    for (let guard = 0; guard < 4000; guard += 1) {
        if (days.has(isoDate(cursor))) {
            streak += 1;
            cursor.setDate(cursor.getDate() - 1);
        } else break;
    }
    return streak;
}

function titleSuggestions(entries: Entry[], limit = 6) {
    const counts = new Map<string, number>();
    for (const entry of entries) {
        const title = entry.title.trim();
        if (!title) continue;
        counts.set(title, (counts.get(title) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limit).map(([title]) => title);
}

function categoriesByUsage(entries: Entry[], categories: string[]) {
    const counts = new Map<string, number>();
    for (const entry of entries) counts.set(entry.category, (counts.get(entry.category) ?? 0) + 1);
    return [...categories].sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0) || a.localeCompare(b));
}

const transferCategoryName = '转账';

function daysLeftInMonth() {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return Math.max(1, lastDay - now.getDate() + 1);
}

function detectRecurring(entries: Entry[]) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 120);
    const minIso = isoDate(cutoff);
    const groups = new Map<string, { title: string; amount: number; dates: string[]; sample: Entry }>();
    for (const entry of entries) {
        if (entry.direction !== 'out' || entry.date < minIso) continue;
        const key = `${entry.title.trim()}|${entry.amount}`;
        const node = groups.get(key) ?? { title: entry.title, amount: entry.amount, dates: [], sample: entry };
        if (!node.dates.includes(entry.date)) node.dates.push(entry.date);
        groups.set(key, node);
    }
    return [...groups.values()]
        .filter((item) => item.dates.length >= 2)
        .sort((a, b) => b.dates.length - a.dates.length)
        .slice(0, 5);
}

function downloadBook(book: Book) {
    const blob = new Blob([JSON.stringify(book, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ledger-${todayIso()}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

function calendarCells(year: number, month: number) {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startPad = first.getDay();
    const cells: { iso: string | null; day: number | null }[] = [];
    for (let i = 0; i < startPad; i += 1) cells.push({ iso: null, day: null });
    for (let day = 1; day <= last.getDate(); day += 1) {
        const date = new Date(year, month, day);
        cells.push({ iso: isoDate(date), day });
    }
    return cells;
}

function monthCursor(value: string) {
    const parsed = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : new Date();
    const safe = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
    return new Date(safe.getFullYear(), safe.getMonth(), 1);
}

function weekdayMark(name: string) {
    return name.startsWith('周') ? name.slice(1) : name;
}

function DateField({
    id,
    label,
    locale,
    value,
    max,
    onChange,
    L,
}: {
    id?: string;
    label: string;
    locale: Locale;
    value: string;
    max?: string;
    onChange: (value: string) => void;
    L: Copy;
}) {
    const [open, setOpen] = useState(false);
    const [cursor, setCursor] = useState(() => monthCursor(value));
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const cells = calendarCells(year, month);
    const title = cursor.toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', { year: 'numeric', month: 'long' });

    useEffect(() => {
        if (!open) return undefined;
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpen(false);
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open]);

    return (
        <>
            <button
                type="button"
                id={id}
                className="ledger-field ledger-date-trigger"
                aria-label={label}
                aria-haspopup="dialog"
                aria-expanded={open}
                onClick={() => {
                    setCursor(monthCursor(value));
                    setOpen(true);
                }}
            >
                {value}
            </button>
            {open && (
                <div className="ledger-modal-backdrop" role="presentation" onClick={() => setOpen(false)}>
                    <div className="ledger-modal ledger-date-pop" role="dialog" aria-modal="true" aria-label={label} onClick={(event) => event.stopPropagation()}>
                        <div className="ledger-date-pop-head">
                            <button type="button" className="ledger-date-nav" aria-label={locale === 'zh' ? '上个月' : 'Previous month'} onClick={() => setCursor(new Date(year, month - 1, 1))}>‹</button>
                            <b>{title}</b>
                            <button type="button" className="ledger-date-nav" aria-label={locale === 'zh' ? '下个月' : 'Next month'} onClick={() => setCursor(new Date(year, month + 1, 1))}>›</button>
                        </div>
                        <div className="ledger-date-week">
                            {L.weekday.map((name) => <span key={name}>{weekdayMark(name)}</span>)}
                        </div>
                        <div className="ledger-date-grid">
                            {cells.map((cell, index) => {
                                if (!cell.iso || cell.day == null) return <span key={`pad-${index}`} />;
                                const disabled = max != null && cell.iso > max;
                                return (
                                    <button
                                        key={cell.iso}
                                        type="button"
                                        disabled={disabled}
                                        className={cell.iso === value ? 'is-on' : ''}
                                        onClick={() => {
                                            onChange(cell.iso as string);
                                            setOpen(false);
                                        }}
                                    >
                                        {cell.day}
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            type="button"
                            className="ledger-date-today"
                            onClick={() => {
                                const today = max && max < todayIso() ? max : todayIso();
                                onChange(today);
                                setOpen(false);
                            }}
                        >
                            {L.today}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

function ChoiceMenu({
    id,
    label,
    value,
    options,
    onChange,
}: {
    id?: string;
    label: string;
    value: string;
    options: { value: string; label: string }[];
    onChange: (value: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const current = options.find((item) => item.value === value);

    useEffect(() => {
        if (!open) return undefined;
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpen(false);
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open]);

    return (
        <>
            <button
                type="button"
                id={id}
                className="ledger-field ledger-choice-trigger"
                aria-label={label}
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={() => setOpen(true)}
            >
                {current?.label ?? ''}
            </button>
            {open && (
                <div className="ledger-modal-backdrop" role="presentation" onClick={() => setOpen(false)}>
                    <div className="ledger-modal ledger-choice-pop" role="listbox" aria-label={label} onClick={(event) => event.stopPropagation()}>
                        {options.map((item) => (
                            <button
                                key={item.value}
                                type="button"
                                role="option"
                                aria-selected={item.value === value}
                                className={item.value === value ? 'is-on' : ''}
                                onClick={() => {
                                    onChange(item.value);
                                    setOpen(false);
                                }}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}

function ledgerTabs(L: Copy): { id: PageId; title: string; icon: React.ReactNode }[] {
    return [
        { id: 'dashboard', title: L.tabDashboard, icon: <IconDashboard /> },
        { id: 'transactions', title: L.tabTransactions, icon: <IconTransactions /> },
        { id: 'accounts', title: L.tabAccounts, icon: <IconAccounts /> },
        { id: 'me', title: L.tabMe, icon: <IconMe /> },
    ];
}

function money(value: number, mark: string) {
    const body = Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${value < 0 ? '−' : ''}${mark}${body}`;
}

function MoneyAmount({
    value,
    mark,
    size = 'md',
    signed = false,
}: {
    value: number;
    mark: string;
    size?: 'hero' | 'md' | 'sm';
    signed?: boolean;
}) {
    const negative = value < 0;
    const body = Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return (
        <span className={`ledger-money ledger-money--${size}`} aria-label={money(value, mark)}>
            {signed && value > 0 ? <span className="ledger-money-sign">+</span> : null}
            {negative ? <span className="ledger-money-sign">−</span> : null}
            <span className="ledger-money-mark">{mark}</span>
            <span className="ledger-money-value">{body}</span>
        </span>
    );
}

function IconDashboard() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="3" width="8" height="8" rx="2" />
            <rect x="13" y="3" width="8" height="5" rx="2" />
            <rect x="13" y="10" width="8" height="11" rx="2" />
            <rect x="3" y="13" width="8" height="8" rx="2" />
        </svg>
    );
}

function IconTransactions() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 7h14M5 12h14M5 17h14" />
        </svg>
    );
}

function IconAccounts() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="4" y="6" width="16" height="12" rx="3" />
            <path d="M4 10h16" />
        </svg>
    );
}

function IconMe() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="8" r="3.2" />
            <path d="M5.5 19.2c1.4-3 3.6-4.4 6.5-4.4s5.1 1.4 6.5 4.4" />
        </svg>
    );
}

type EntryDraft = {
    id: string;
    title: string;
    amount: string;
    direction: Direction;
    category: string;
    date: string;
    accountId: string;
    accountName: string;
    shared: boolean;
    checked: boolean;
};

function blankEntry(book: Book): EntryDraft {
    return {
        id: '',
        title: '',
        amount: '',
        direction: 'out',
        category: book.categories[0] ?? '餐饮',
        date: todayIso(),
        accountId: book.accounts[0]?.id ?? '',
        accountName: '现金',
        shared: false,
        checked: false,
    };
}

export default function LedgerApp() {
    const { page, setPage } = useHashPage(route);
    const resolved = (legacyPage[page] ?? page) as PageId;
    const [book, setBook] = useState<Book>(emptyBook);
    const locale = normalizeLocale(book.locale);
    const L = strings(locale);
    const tabs = useMemo(() => ledgerTabs(L), [locale]);
    const active = tabs.some((tab) => tab.id === resolved) ? resolved : 'dashboard';

    const [ready, setReady] = useState(false);
    const [scope, setScope] = useState<Scope>('mine');
    const [panel, setPanel] = useState<Panel>('none');
    const [clearAsk, setClearAsk] = useState(false);
    const [draft, setDraft] = useState<EntryDraft>(() => blankEntry(emptyBook()));
    const [accountName, setAccountName] = useState('');
    const [accountOpening, setAccountOpening] = useState('');
    const [accountKind, setAccountKind] = useState<AccountKind>('cash');
    const [editingAccountId, setEditingAccountId] = useState('');
    const [viewingAccountId, setViewingAccountId] = useState('');
    const [editingHoldingId, setEditingHoldingId] = useState('');
    const [viewingHoldingId, setViewingHoldingId] = useState('');
    const [holdingKind, setHoldingKind] = useState<HoldingKind>('stock');
    const [holdingCode, setHoldingCode] = useState('');
    const [holdingName, setHoldingName] = useState('');
    const [holdingQty, setHoldingQty] = useState('');
    const [holdingCost, setHoldingCost] = useState('');
    const [holdingPrice, setHoldingPrice] = useState('');
    const [holdingPriceDate, setHoldingPriceDate] = useState(todayIso);
    const [accountsWindowDays, setAccountsWindowDays] = useState<AccountsWindow>(30);
    const [categoryName, setCategoryName] = useState('');
    const [editingCategories, setEditingCategories] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState(ALL_CATEGORIES);
    const [accountFilter, setAccountFilter] = useState(ALL_ACCOUNTS);
    const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'done'>('all');
    const [periodMode, setPeriodMode] = useState<PeriodMode>('month');
    const [rangeFrom, setRangeFrom] = useState(() => monthBounds(0).start);
    const [rangeTo, setRangeTo] = useState(todayIso);
    const [draftName, setDraftName] = useState('');
    const [draftGender, setDraftGender] = useState<Gender>('secret');
    const [search, setSearch] = useState('');
    const [txView, setTxView] = useState<TxView>('list');
    const [calendarDay, setCalendarDay] = useState('');
    const [budgetInput, setBudgetInput] = useState('');
    const [exportNote, setExportNote] = useState('');
    const [importNote, setImportNote] = useState('');
    const [importText, setImportText] = useState('');
    const [transferFrom, setTransferFrom] = useState('');
    const [transferTo, setTransferTo] = useState('');
    const [transferAmount, setTransferAmount] = useState('');
    const [transferDate, setTransferDate] = useState(todayIso);
    const [categoryBudgetDraft, setCategoryBudgetDraft] = useState<Record<string, string>>({});

    useEffect(() => {
        setBook(loadBook());
        setReady(true);
    }, []);

    useEffect(() => {
        if (ready) saveBook(book);
    }, [book, ready]);

    const mark = currencyMark[book.currency];
    const visibleEntries = useMemo(
        () => book.entries.filter((entry) => (scope === 'family' ? entry.shared : !entry.shared)),
        [book.entries, scope],
    );
    const balance = bookNetWorth(book.accounts, book.entries, book.holdings ?? []);
    const cashBalance = accountsBalanceTotal(book.accounts, book.entries);
    const holdingsTotal = holdingsMarketTotal(book.holdings ?? []);
    const monthKey = todayIso().slice(0, 7);
    const monthEntries = visibleEntries.filter((entry) => entry.date.startsWith(monthKey));
    const monthOut = monthEntries.filter((entry) => entry.direction === 'out').reduce((sum, entry) => sum + entry.amount, 0);
    const monthIn = monthEntries.filter((entry) => entry.direction === 'in').reduce((sum, entry) => sum + entry.amount, 0);
    const monthSpend = eachDay(monthBounds(0).start, todayIso()).map((day) => ({
        day,
        amount: visibleEntries.filter((entry) => entry.date === day && entry.direction === 'out').reduce((sum, entry) => sum + entry.amount, 0),
    }));
    const reviewQueue = [...visibleEntries].filter((entry) => !entry.checked).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
    const bounds = periodBounds(periodMode, rangeFrom, rangeTo);
    const periodEntries = visibleEntries.filter((entry) => entry.date >= bounds.start && entry.date <= bounds.end);
    const periodOut = periodEntries.filter((entry) => entry.direction === 'out').reduce((sum, entry) => sum + entry.amount, 0);
    const periodIn = periodEntries.filter((entry) => entry.direction === 'in').reduce((sum, entry) => sum + entry.amount, 0);
    const spendParts = [...new Set(periodEntries.filter((entry) => entry.direction === 'out').map((entry) => entry.category))].map((name, index) => ({
        name,
        amount: periodEntries.filter((entry) => entry.category === name && entry.direction === 'out').reduce((sum, entry) => sum + entry.amount, 0),
        color: sliceColors[index % sliceColors.length],
    })).filter((item) => item.amount > 0);
    const monthCategoryParts = [...new Set(monthEntries.filter((entry) => entry.direction === 'out').map((entry) => entry.category))].map((name, index) => ({
        name,
        amount: monthEntries.filter((entry) => entry.category === name && entry.direction === 'out').reduce((sum, entry) => sum + entry.amount, 0),
        color: sliceColors[index % sliceColors.length],
    })).filter((item) => item.amount > 0);
    const query = search.trim().toLowerCase();
    const filteredEntries = periodEntries.filter((entry) => {
        if (categoryFilter !== ALL_CATEGORIES && entry.category !== categoryFilter) return false;
        if (accountFilter !== ALL_ACCOUNTS && entry.accountId !== accountFilter) return false;
        if (statusFilter === 'open' && entry.checked) return false;
        if (statusFilter === 'done' && !entry.checked) return false;
        if (!query) return true;
        const account = book.accounts.find((item) => item.id === entry.accountId);
        const hay = `${entry.title} ${entry.category} ${account?.name ?? ''}`.toLowerCase();
        return hay.includes(query);
    });
    const txDays = filteredEntries.reduce<string[]>((list, entry) => {
        if (!list.includes(entry.date)) list.push(entry.date);
        return list;
    }, []).sort((a, b) => b.localeCompare(a));

    const holdings = book.holdings ?? [];
    const stockHoldings = holdings.filter((item) => item.kind === 'stock' || item.kind === 'etf');
    const fundHoldings = holdings.filter((item) => item.kind === 'fund');
    const accountsCombined = bookNetWorth(book.accounts, book.entries, holdings);
    const accountsTrend = useMemo(
        () => netWorthSeries(book.accounts, book.entries, holdings, accountsWindowDays),
        [book.accounts, book.entries, holdings, accountsWindowDays],
    );
    const accountsWindowFrom = accountsWindowStart(accountsWindowDays);
    const accountsWindowPrior = bookNetWorthOnDate(book.accounts, book.entries, holdings, isoBefore(accountsWindowFrom));
    const accountsWindowDelta = accountsCombined - accountsWindowPrior;
    const filteredAccountName = book.accounts.find((item) => item.id === accountFilter)?.name;
    const viewingAccount = book.accounts.find((item) => item.id === viewingAccountId);
    const viewingHolding = holdings.find((item) => item.id === viewingHoldingId);
    const prevMonth = monthBounds(-1);
    const prevMonthOutByCategory = useMemo(() => {
        const map = new Map<string, number>();
        for (const entry of visibleEntries) {
            if (entry.direction !== 'out') continue;
            if (entry.date < prevMonth.start || entry.date > prevMonth.end) continue;
            map.set(entry.category, (map.get(entry.category) ?? 0) + entry.amount);
        }
        return map;
    }, [visibleEntries, prevMonth.start, prevMonth.end]);
    const rankedSpendParts = useMemo(
        () => [...spendParts].sort((a, b) => b.amount - a.amount),
        [spendParts],
    );
    const suggestionTitles = useMemo(() => titleSuggestions(book.entries), [book.entries]);
    const orderedCategories = useMemo(() => categoriesByUsage(book.entries, book.categories), [book.entries, book.categories]);
    const logStreak = streakDays(book.entries);
    const loggedToday = book.entries.some((entry) => entry.date === todayIso());
    const monthBalance = monthIn - monthOut;
    const budget = book.monthlyBudget;
    const budgetLeft = budget != null ? budget - monthOut : null;
    const safeDaily = budgetLeft != null ? budgetLeft / daysLeftInMonth() : null;
    const nowDay = new Date().getDate();
    const monthDays = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const paceOver = budget != null && budget > 0 && nowDay > 0 && (monthOut / nowDay) * monthDays > budget;
    const recurringItems = useMemo(() => detectRecurring(book.entries), [book.entries]);
    const spendByDay = useMemo(() => {
        const map = new Map<string, number>();
        for (const entry of periodEntries) {
            if (entry.direction !== 'out') continue;
            map.set(entry.date, (map.get(entry.date) ?? 0) + entry.amount);
        }
        return map;
    }, [periodEntries]);

    const periodLabel = periodChipLabel(periodMode, rangeFrom, rangeTo, locale, L);
    const displayName = book.nickname || L.unnamed;
    const dashTitle = dashboardHeading(locale, L);
    const scopeChip = scope === 'mine' ? L.scopeChipMine : L.scopeChipFamily;

    function openEntry(entry?: Entry) {
        if (!entry) setDraft(blankEntry(book));
        else {
            const account = book.accounts.find((item) => item.id === entry.accountId);
            setDraft({
                id: entry.id,
                title: entry.title,
                amount: String(entry.amount),
                direction: entry.direction,
                category: entry.category,
                date: entry.date,
                accountId: entry.accountId,
                accountName: account?.name ?? '现金',
                shared: entry.shared,
                checked: entry.checked,
            });
        }
        setPanel('entry');
    }

    function saveEntry() {
        const amount = Number(draft.amount);
        const title = draft.title.trim();
        if (!title || !Number.isFinite(amount) || amount <= 0) return;
        let accountId = draft.accountId;
        let accounts = book.accounts;
        if (!accountId) {
            const created: Account = { id: createId(), name: draft.accountName.trim() || '现金', opening: 0, kind: 'cash' };
            accounts = [...accounts, created];
            accountId = created.id;
        }
        const next: Entry = {
            id: draft.id || createId(),
            title,
            amount,
            direction: draft.direction,
            category: draft.category,
            date: draft.date || todayIso(),
            accountId,
            shared: draft.shared,
            checked: draft.checked,
        };
        const entries = draft.id ? book.entries.map((entry) => (entry.id === draft.id ? next : entry)) : [next, ...book.entries];
        setBook({ ...book, accounts, entries });
        setPanel('none');
    }

    function removeEntry(id: string) {
        setBook({ ...book, entries: book.entries.filter((entry) => entry.id !== id) });
        setPanel('none');
    }

    function toggleChecked(id: string) {
        setBook({ ...book, entries: book.entries.map((entry) => (entry.id === id ? { ...entry, checked: !entry.checked } : entry)) });
    }

    function markReviewed(ids: string[]) {
        const set = new Set(ids);
        setBook({ ...book, entries: book.entries.map((entry) => (set.has(entry.id) ? { ...entry, checked: true } : entry)) });
    }

    function openAccountDetail(account: Account) {
        setViewingAccountId(account.id);
        setPanel('accountDetail');
    }

    function openAccount(account?: Account) {
        setEditingAccountId(account?.id ?? '');
        setAccountName(account?.name ?? '');
        setAccountOpening(account ? String(account.opening) : '');
        setAccountKind(normalizeAccountKind(account?.kind));
        setPanel('account');
    }

    function closeAccountEditor() {
        setPanel(viewingAccountId ? 'accountDetail' : 'none');
    }

    function saveAccount() {
        const name = accountName.trim();
        const opening = Number(accountOpening);
        if (!name || !Number.isFinite(opening)) return;
        const kind = normalizeAccountKind(accountKind);
        const accounts = editingAccountId
            ? book.accounts.map((item) => (item.id === editingAccountId ? { ...item, name, opening, kind } : item))
            : [...book.accounts, { id: createId(), name, opening, kind }];
        setBook({ ...book, accounts });
        closeAccountEditor();
    }

    function removeAccount(id: string) {
        setBook({ ...book, accounts: book.accounts.filter((item) => item.id !== id), entries: book.entries.filter((entry) => entry.accountId !== id) });
        setViewingAccountId('');
        setPanel('none');
    }

    function openHoldingDetail(holding: Holding) {
        setViewingHoldingId(holding.id);
        setPanel('holdingDetail');
    }

    function openHolding(holding?: Holding) {
        setEditingHoldingId(holding?.id ?? '');
        setHoldingKind(normalizeHoldingKind(holding?.kind));
        setHoldingCode(holding?.code ?? '');
        setHoldingName(holding?.name ?? '');
        setHoldingQty(holding ? String(holding.qty) : '');
        setHoldingCost(holding ? String(holdingCostPrice(holding)) : '');
        setHoldingPrice(holding ? String(holding.price) : '');
        setHoldingPriceDate(holding?.priceAsOf ?? todayIso());
        setPanel('holding');
    }

    function closeHoldingEditor() {
        setPanel(viewingHoldingId ? 'holdingDetail' : 'none');
    }

    function saveHolding() {
        const code = holdingCode.trim();
        const name = holdingName.trim();
        const qty = Number(holdingQty);
        const costPrice = Number(holdingCost);
        const price = Number(holdingPrice);
        if (!code || !name || !Number.isFinite(qty) || qty <= 0) return;
        if (!Number.isFinite(costPrice) || costPrice < 0) return;
        if (!Number.isFinite(price) || price <= 0) return;
        const costTotal = holdingCostTotalFromPrice(qty, costPrice);
        const kind = normalizeHoldingKind(holdingKind);
        const payload = {
            kind,
            code,
            name,
            qty,
            costTotal,
            price,
            priceAsOf: holdingPriceDate || todayIso(),
        };
        const list = book.holdings ?? [];
        const duplicate = list.some(
            (item) => holdingsEquivalent(item, payload) && item.id !== editingHoldingId,
        );
        if (duplicate) return;
        const next: Holding = editingHoldingId
            ? { ...list.find((item) => item.id === editingHoldingId)!, ...payload }
            : { id: createId(), ...payload };
        const holdingsNext = editingHoldingId
            ? list.map((item) => (item.id === editingHoldingId ? next : item))
            : [...list, next];
        setBook({ ...book, holdings: holdingsNext });
        if (editingHoldingId) setViewingHoldingId(editingHoldingId);
        closeHoldingEditor();
    }

    function removeHolding(id: string) {
        setBook({ ...book, holdings: (book.holdings ?? []).filter((item) => item.id !== id) });
        setViewingHoldingId('');
        setPanel('none');
    }

    function addCategory() {
        const name = categoryName.trim();
        if (!name || book.categories.includes(name)) return;
        setBook({ ...book, categories: [...book.categories, name] });
        setCategoryName('');
    }

    function removeCategory(name: string) {
        if (book.categories.length <= 1) return;
        setBook({
            ...book,
            categories: book.categories.filter((item) => item !== name),
            entries: book.entries.map((entry) => (entry.category === name ? { ...entry, category: book.categories.find((item) => item !== name) ?? '日用' } : entry)),
        });
        if (categoryFilter === name) setCategoryFilter(ALL_CATEGORIES);
    }

    function clearSample() {
        setBook(withoutSample(book));
    }

    function openProfile() {
        setDraftName(book.nickname);
        setDraftGender(book.gender);
        setPanel('profile');
    }

    function saveProfile() {
        const nickname = draftName.trim();
        if (!nickname) return;
        setBook({ ...book, nickname: nickname.slice(0, 12), gender: draftGender });
        setPanel('none');
    }

    function chooseCategory(name: string) {
        setCategoryFilter((current) => (current === name ? ALL_CATEGORIES : name));
    }

    function chooseDayRange(day: string) {
        if (!day) return;
        setPeriodMode('range');
        setRangeFrom(day);
        setRangeTo(day);
        setCategoryFilter(ALL_CATEGORIES);
    }

    function goTab(id: PageId) {
        setPanel('none');
        if (id !== 'transactions') {
            setCategoryFilter(ALL_CATEGORIES);
            setAccountFilter(ALL_ACCOUNTS);
            setStatusFilter('all');
            setSearch('');
        }
        setPage(id);
    }

    function saveBudget() {
        const value = Number(budgetInput);
        const monthlyBudget = !Number.isFinite(value) || value <= 0 ? null : Math.round(value * 100) / 100;
        const categoryBudgets: Record<string, number> = {};
        for (const name of book.categories) {
            const raw = categoryBudgetDraft[name]?.trim();
            if (!raw) continue;
            const cap = Number(raw);
            if (Number.isFinite(cap) && cap > 0) categoryBudgets[name] = Math.round(cap * 100) / 100;
        }
        setBook({ ...book, monthlyBudget, categoryBudgets });
        setPanel('none');
    }

    function openBudgetPanel() {
        setBudgetInput(book.monthlyBudget != null ? String(book.monthlyBudget) : '');
        const drafts: Record<string, string> = {};
        for (const name of book.categories) {
            const cap = book.categoryBudgets[name];
            drafts[name] = cap != null && cap > 0 ? String(cap) : '';
        }
        setCategoryBudgetDraft(drafts);
        setPanel('budget');
    }

    function openTransferPanel() {
        setTransferFrom(book.accounts[0]?.id ?? '');
        setTransferTo(book.accounts[1]?.id ?? book.accounts[0]?.id ?? '');
        setTransferAmount('');
        setTransferDate(todayIso());
        setPanel('transfer');
    }

    function saveTransfer() {
        const amount = Number(transferAmount);
        if (!transferFrom || !transferTo || transferFrom === transferTo || !Number.isFinite(amount) || amount <= 0) return;
        const from = book.accounts.find((item) => item.id === transferFrom);
        const to = book.accounts.find((item) => item.id === transferTo);
        if (!from || !to) return;
        let categories = book.categories;
        if (!categories.includes(transferCategoryName)) categories = [...categories, transferCategoryName];
        const stamp = todayIso();
        const date = transferDate || stamp;
        const outEntry: Entry = {
            id: createId(),
            title: `${L.transferTo} ${to.name}`,
            amount,
            direction: 'out',
            category: transferCategoryName,
            date,
            accountId: from.id,
            shared: false,
            checked: true,
        };
        const inEntry: Entry = {
            id: createId(),
            title: `${L.transferFrom} ${from.name}`,
            amount,
            direction: 'in',
            category: transferCategoryName,
            date,
            accountId: to.id,
            shared: false,
            checked: true,
        };
        setBook({ ...book, categories, entries: [inEntry, outEntry, ...book.entries] });
        setPanel('none');
    }

    function applyImportedBook(parsed: Partial<Book> | null) {
        if (!parsed || !Array.isArray(parsed.entries) || !Array.isArray(parsed.accounts)) {
            setImportNote(L.importFail);
            return;
        }
        setBook(withoutSample({
            ...emptyBook(),
            ...parsed,
            categories: parsed.categories?.length ? parsed.categories : [...starterCategories],
            accounts: parsed.accounts.map((account) => ({
                id: account.id,
                name: account.name,
                opening: account.opening,
                kind: normalizeAccountKind(account.kind),
            })),
            entries: parsed.entries,
            locale: parsed.locale === 'en' ? 'en' : 'zh',
            currency: normalizeCurrency(parsed.currency),
            monthlyBudget: typeof parsed.monthlyBudget === 'number' && parsed.monthlyBudget > 0 ? parsed.monthlyBudget : null,
            categoryBudgets: parsed.categoryBudgets && typeof parsed.categoryBudgets === 'object' ? parsed.categoryBudgets : {},
            templates: dedupeTemplates(Array.isArray(parsed.templates) ? parsed.templates : []),
            holdings: parseHoldings(parsed.holdings),
            sampleCleared: true,
        }));
        setImportNote(L.importDone);
    }

    function importBookFile(file: File) {
        const reader = new FileReader();
        reader.onload = () => {
            try {
                applyImportedBook(JSON.parse(String(reader.result)) as Partial<Book>);
            } catch {
                setImportNote(L.importFail);
            }
        };
        reader.readAsText(file);
    }

    function importBookText() {
        try {
            applyImportedBook(JSON.parse(importText) as Partial<Book>);
        } catch {
            setImportNote(L.importFail);
        }
    }

    function confirmClearBook() {
        setClearAsk(false);
        setBook({
            ...book,
            sampleCleared: true,
            accounts: [],
            holdings: [],
            entries: [],
            templates: [],
            monthlyBudget: null,
            categoryBudgets: {},
        });
        flashExportNote(L.clearBookDone);
    }

    function flashExportNote(text: string) {
        setExportNote(text);
        window.setTimeout(() => {
            setExportNote((current) => (current === text ? '' : current));
        }, 2000);
    }

    function handleExport() {
        downloadBook(book);
        flashExportNote(L.exportDone);
    }

    function openAccountFeed(accountId: string) {
        setPanel('none');
        setViewingAccountId('');
        setAccountFilter(accountId);
        setPeriodMode('range');
        setRangeFrom(accountsWindowStart(accountsWindowDays));
        setRangeTo(todayIso());
        setCategoryFilter(ALL_CATEGORIES);
        setStatusFilter('all');
        setSearch('');
        setPage('transactions');
    }

    const showFab = panel === 'none' && (active === 'dashboard' || active === 'transactions');

    return (
        <main className="ledger">
            <section className="ledger-phone">
                <div className="ledger-stage">
                <div className={showFab ? 'ledger-body' : 'ledger-body is-rest'}>
                    {panel === 'entry' && (
                        <EntryForm
                            L={L}
                            locale={locale}
                            draft={draft}
                            book={book}
                            categories={orderedCategories}
                            titleSuggestions={suggestionTitles}
                            onChange={setDraft}
                            onSave={saveEntry}
                            onDelete={() => draft.id && removeEntry(draft.id)}
                            onBack={() => setPanel('none')}
                        />
                    )}
                    {panel === 'budget' && (
                        <>
                            <SubpageHead L={L} title={L.monthlyBudget} onBack={() => setPanel('none')} />
                            <p className="ledger-panel-note">{L.budgetHint}</p>
                            <label className="ledger-label" htmlFor="ledger-budget">{L.monthlyBudget}</label>
                            <input id="ledger-budget" className="ledger-field ledger-field-budget" inputMode="decimal" value={budgetInput} placeholder={defaultMonthlyBudgetHint()} onChange={(event) => setBudgetInput(event.target.value)} />
                            <h2 className="ledger-label">{L.categoryBudget}</h2>
                            <p className="ledger-budget-hint">{L.categoryBudgetHint}</p>
                            {book.categories.map((name) => (
                                <label key={name} className="ledger-budget-cat-row">
                                    <span>{name}</span>
                                    <input
                                        className="ledger-field ledger-field-budget"
                                        inputMode="decimal"
                                        placeholder={categoryBudgetHint(name)}
                                        value={categoryBudgetDraft[name] ?? ''}
                                        onChange={(event) => setCategoryBudgetDraft({ ...categoryBudgetDraft, [name]: event.target.value })}
                                    />
                                </label>
                            ))}
                            <button type="button" className="ledger-pill" onClick={saveBudget}>{L.save}</button>
                            {book.monthlyBudget != null && (
                                <button type="button" className="ledger-text-button" onClick={() => { setBudgetInput(''); setBook({ ...book, monthlyBudget: null, categoryBudgets: {} }); setPanel('none'); }}>{L.budgetClear}</button>
                            )}
                        </>
                    )}
                    {panel === 'transfer' && (
                        <>
                            <SubpageHead L={L} title={L.transferTitle} onBack={() => setPanel('none')} />
                            <label className="ledger-label" htmlFor="transfer-from">{L.transferFrom}</label>
                            <ChoiceMenu id="transfer-from" label={L.transferFrom} value={transferFrom} options={book.accounts.map((account) => ({ value: account.id, label: account.name }))} onChange={setTransferFrom} />
                            <label className="ledger-label" htmlFor="transfer-to">{L.transferTo}</label>
                            <ChoiceMenu id="transfer-to" label={L.transferTo} value={transferTo} options={book.accounts.map((account) => ({ value: account.id, label: account.name }))} onChange={setTransferTo} />
                            <label className="ledger-label" htmlFor="transfer-amount">{L.amount}</label>
                            <input id="transfer-amount" className="ledger-field" inputMode="decimal" value={transferAmount} onChange={(event) => setTransferAmount(event.target.value)} />
                            <label className="ledger-label" htmlFor="transfer-date">{L.date}</label>
                            <DateField id="transfer-date" label={L.date} locale={locale} value={transferDate} max={todayIso()} onChange={setTransferDate} L={L} />
                            <button type="button" className="ledger-pill" onClick={saveTransfer} disabled={book.accounts.length < 2 || transferFrom === transferTo || !(Number(transferAmount) > 0)}>{L.save}</button>
                        </>
                    )}
                    {panel === 'account' && (
                        <>
                            <SubpageHead L={L} title={editingAccountId ? L.editAccount : L.newAccount} onBack={closeAccountEditor} />
                            <label className="ledger-label" htmlFor="account-name">{L.accountName}</label>
                            <input id="account-name" className="ledger-field" value={accountName} placeholder={L.accountNamePh} onChange={(event) => setAccountName(event.target.value)} />
                            <p className="ledger-label">{L.accountKindLabel}</p>
                            <div className="ledger-choice-row" role="tablist" aria-label={L.accountKindLabel}>
                                {accountKindOrder.map((item) => (
                                    <button key={item} type="button" role="tab" aria-selected={accountKind === item} className={accountKind === item ? 'is-on' : ''} onClick={() => setAccountKind(item)}>{accountKindLabel(L, item)}</button>
                                ))}
                            </div>
                            <label className="ledger-label" htmlFor="account-opening">{L.accountBalance}</label>
                            <input id="account-opening" className="ledger-field" inputMode="decimal" value={accountOpening} placeholder="0.00" onChange={(event) => setAccountOpening(event.target.value)} />
                            <button type="button" className="ledger-pill" onClick={saveAccount} disabled={!accountName.trim() || accountOpening.trim() === '' || Number.isNaN(Number(accountOpening))}>{L.save}</button>
                            {editingAccountId && <button type="button" className="ledger-text-button" onClick={() => removeAccount(editingAccountId)}>{L.deleteAccount}</button>}
                        </>
                    )}
                    {panel === 'accountDetail' && viewingAccount && (
                        <AccountDetailView
                            L={L}
                            account={viewingAccount}
                            entries={book.entries}
                            mark={mark}
                            windowDays={accountsWindowDays}
                            onBack={() => { setViewingAccountId(''); setPanel('none'); }}
                            onEdit={() => openAccount(viewingAccount)}
                            onActivity={() => openAccountFeed(viewingAccount.id)}
                        />
                    )}
                    {panel === 'holding' && (
                        <>
                            <SubpageHead L={L} title={editingHoldingId ? L.editHolding : L.newHolding} onBack={closeHoldingEditor} />
                            <p className="ledger-label">{L.holdingKindLabel}</p>
                            <div className="ledger-choice-row ledger-choice-row--3" role="tablist" aria-label={L.holdingKindLabel}>
                                {(['stock', 'etf', 'fund'] as const).map((item) => (
                                    <button key={item} type="button" role="tab" aria-selected={holdingKind === item} className={holdingKind === item ? 'is-on' : ''} onClick={() => setHoldingKind(item)}>{holdingKindLabel(L, item)}</button>
                                ))}
                            </div>
                            <label className="ledger-label" htmlFor="holding-code">{L.holdingCode}</label>
                            <input id="holding-code" className="ledger-field" value={holdingCode} placeholder={holdingKind === 'etf' ? L.holdingCodeEtf : holdingKind === 'fund' ? L.holdingCodeFund : L.holdingCodeStock} onChange={(event) => setHoldingCode(event.target.value)} />
                            <label className="ledger-label" htmlFor="holding-name">{L.holdingName}</label>
                            <input id="holding-name" className="ledger-field" value={holdingName} placeholder={holdingKind === 'etf' ? L.holdingNameEtf : holdingKind === 'fund' ? L.holdingNameFund : L.holdingNameStock} onChange={(event) => setHoldingName(event.target.value)} />
                            <label className="ledger-label" htmlFor="holding-qty">{L.holdingQty}</label>
                            <input id="holding-qty" className="ledger-field" inputMode="decimal" value={holdingQty} placeholder="0" onChange={(event) => setHoldingQty(event.target.value)} />
                            <label className="ledger-label" htmlFor="holding-cost">{L.holdingCostPrice}</label>
                            <input id="holding-cost" className="ledger-field" inputMode="decimal" value={holdingCost} placeholder={L.holdingCostPricePh} onChange={(event) => setHoldingCost(event.target.value)} />
                            <label className="ledger-label" htmlFor="holding-price">{L.holdingPrice}</label>
                            <input id="holding-price" className="ledger-field" inputMode="decimal" value={holdingPrice} placeholder="0.00" onChange={(event) => setHoldingPrice(event.target.value)} />
                            <label className="ledger-label" htmlFor="holding-price-date">{L.holdingPriceAsOf}</label>
                            <DateField id="holding-price-date" label={L.holdingPriceAsOf} locale={locale} value={holdingPriceDate} max={todayIso()} onChange={setHoldingPriceDate} L={L} />
                            <button
                                type="button"
                                className="ledger-pill"
                                onClick={saveHolding}
                                disabled={
                                    !holdingCode.trim()
                                    || !holdingName.trim()
                                    || !(Number(holdingQty) > 0)
                                    || !(Number(holdingCost) >= 0)
                                    || !(Number(holdingPrice) > 0)
                                }
                            >
                                {L.save}
                            </button>
                            {editingHoldingId && <button type="button" className="ledger-text-button" onClick={() => removeHolding(editingHoldingId)}>{L.deleteHolding}</button>}
                        </>
                    )}
                    {panel === 'holdingDetail' && viewingHolding && (
                        <HoldingDetailView
                            L={L}
                            holding={viewingHolding}
                            mark={mark}
                            locale={locale}
                            onBack={() => { setViewingHoldingId(''); setPanel('none'); }}
                            onEdit={() => openHolding(viewingHolding)}
                        />
                    )}
                    {panel === 'profile' && (
                        <>
                            <SubpageHead L={L} title={L.profileTitle} onBack={() => setPanel('none')} />
                            <label className="ledger-label" htmlFor="ledger-nickname">{L.nickname}</label>
                            <input id="ledger-nickname" className="ledger-field" value={draftName} maxLength={12} onChange={(event) => setDraftName(event.target.value)} />
                            <p className="ledger-label">{L.gender}</p>
                            <div className="ledger-choice-row ledger-choice-row--3" role="tablist" aria-label={L.gender}>
                                {(['female', 'male', 'secret'] as const).map((item) => (
                                    <button key={item} type="button" role="tab" aria-selected={draftGender === item} className={draftGender === item ? 'is-on' : ''} onClick={() => setDraftGender(item)}>{genderLabel(item, L)}</button>
                                ))}
                            </div>
                            <button type="button" className="ledger-pill" onClick={saveProfile} disabled={!draftName.trim()}>{L.save}</button>
                        </>
                    )}
                    {panel === 'export' && (
                        <>
                            <SubpageHead L={L} title={L.dataManage} onBack={() => setPanel('none')} />
                            <div className="ledger-export-card">
                                <button type="button" className="ledger-row-link" onClick={handleExport}>
                                    <span>{L.exportBackup}</span>
                                    <span aria-hidden="true">↓</span>
                                </button>
                                <div className="ledger-settings-divider" role="presentation" />
                                <button type="button" className="ledger-row-link ledger-clear-row" onClick={() => setClearAsk(true)}>
                                    <span>{L.clearBook}</span>
                                    <span aria-hidden="true">!</span>
                                </button>
                            </div>
                            {exportNote && <p className="ledger-toast" role="status">{exportNote}</p>}
                        </>
                    )}
                    {panel === 'import' && (
                        <>
                            <SubpageHead L={L} title={L.importData} onBack={() => setPanel('none')} />
                            <textarea className="ledger-field ledger-json" value={importText} placeholder={L.importPaste} onChange={(event) => setImportText(event.target.value)} />
                            <button type="button" className="ledger-pill" onClick={importBookText} disabled={!importText.trim()}>{L.importData}</button>
                            <label className="ledger-text-button ledger-import-row">
                                {L.importFile}
                                <input type="file" accept="application/json,.json" onChange={(event) => { const file = event.target.files?.[0]; if (file) importBookFile(file); event.target.value = ''; }} />
                            </label>
                            {importNote && <p className="ledger-panel-note">{importNote}</p>}
                        </>
                    )}
                    {panel === 'filter' && (
                        <FilterPage
                            L={L}
                            locale={locale}
                            scope={scope}
                            periodMode={periodMode}
                            rangeFrom={rangeFrom}
                            rangeTo={rangeTo}
                            onScope={setScope}
                            onToday={() => { setPeriodMode('today'); setCategoryFilter(ALL_CATEGORIES); }}
                            onMonth={() => { setPeriodMode('month'); setCategoryFilter(ALL_CATEGORIES); }}
                            onRange={() => { setPeriodMode('range'); setCategoryFilter(ALL_CATEGORIES); }}
                            onFrom={setRangeFrom}
                            onTo={setRangeTo}
                            onBack={() => setPanel('none')}
                        />
                    )}

                    {panel === 'none' && active === 'dashboard' && (
                        <>
                            <div className="ledger-topbar">
                                <h1>{dashTitle}</h1>
                                <button type="button" className="ledger-chip-btn" onClick={() => setPanel('filter')}>{scopeChip}</button>
                            </div>
                            <article className="ledger-net-card">
                                <p>{L.netAssets}</p>
                                <MoneyAmount value={balance} mark={mark} size="hero" />
                                <div className="ledger-net-foot">
                                    {L.monthSpend} <MoneyAmount value={monthOut} mark={mark} size="sm" />
                                    · {L.monthIncome} <MoneyAmount value={monthIn} mark={mark} size="sm" />
                                    · {L.monthBalance} <MoneyAmount value={monthBalance} mark={mark} size="sm" signed />
                                </div>
                            </article>
                            <section className="ledger-panel ledger-budget-panel">
                                {budget != null && budget > 0 ? (
                                    <>
                                        <div className="ledger-panel-head">
                                            <h2>{L.monthlyBudget}</h2>
                                            <button type="button" onClick={openBudgetPanel}>{L.edit}</button>
                                        </div>
                                        <div className="ledger-budget-track" aria-hidden="true">
                                            <span className="ledger-budget-fill" style={{ width: `${Math.min(100, (monthOut / budget) * 100)}%` }} />
                                        </div>
                                        <p className={`ledger-budget-meta${budgetLeft != null && budgetLeft < 0 ? ' is-over' : ''}`}>
                                            {budgetLeft != null && budgetLeft < 0 ? L.budgetOver : L.budgetRemaining}
                                            {' '}
                                            <MoneyAmount value={budgetLeft ?? 0} mark={mark} size="sm" signed={budgetLeft != null && budgetLeft < 0} />
                                            {' / '}
                                            <MoneyAmount value={budget} mark={mark} size="sm" />
                                        </p>
                                        {safeDaily != null && safeDaily >= 0 && (
                                            <p className="ledger-budget-meta">
                                                {L.safeToSpend}{' '}
                                                <MoneyAmount value={safeDaily} mark={mark} size="sm" />
                                            </p>
                                        )}
                                        {paceOver && <p className="ledger-budget-pace">{L.paceWarning}</p>}
                                    </>
                                ) : (
                                    <button type="button" className="ledger-budget-setup" onClick={openBudgetPanel}>
                                        <span>{L.budgetUnset}</span>
                                        <span className="ledger-chevron" aria-hidden="true">›</span>
                                    </button>
                                )}
                            </section>
                            <section className="ledger-panel">
                                <div className="ledger-panel-head">
                                    <h2>{L.spendPace}</h2>
                                    <button type="button" onClick={() => goTab('transactions')}>{L.toTransactions}</button>
                                </div>
                                {monthOut > 0 ? <SpendLine L={L} points={monthSpend} active="" onPick={(day) => { chooseDayRange(day); goTab('transactions'); }} /> : <p className="ledger-panel-note">{L.spendChartEmpty}</p>}
                            </section>
                            {reviewQueue.length > 0 && (
                                <section className="ledger-panel">
                                    <div className="ledger-panel-head">
                                        <h2>{L.toReview} · {reviewQueue.length}</h2>
                                        <button type="button" className="ledger-mark-all" onClick={() => markReviewed(reviewQueue.map((entry) => entry.id))}>{L.markAllReviewed}</button>
                                    </div>
                                    <ul className="ledger-tx-list">
                                        {reviewQueue.map((entry) => (
                                            <TxRow key={entry.id} L={L} entry={entry} accounts={book.accounts} mark={mark} onOpen={openEntry} onToggle={toggleChecked} />
                                        ))}
                                    </ul>
                                </section>
                            )}
                            <section className="ledger-panel">
                                <div className="ledger-panel-head">
                                    <h2>{L.recurringTitle}</h2>
                                    {recurringItems.length > 0
                                        ? <span className="ledger-topbar-meta">{L.recurringHint}</span>
                                        : <button type="button" onClick={() => openEntry()}>{L.entryNew}</button>}
                                </div>
                                {recurringItems.length > 0 ? (
                                    <ul className="ledger-recurring-list">
                                        {recurringItems.map((item) => (
                                            <li key={`${item.title}-${item.amount}`}>
                                                <button type="button" onClick={() => openEntry(item.sample)}>
                                                    <b>{item.title}</b>
                                                    <span>{item.dates.length}× · <MoneyAmount value={item.amount} mark={mark} size="sm" /></span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="ledger-panel-note">{L.recurringEmpty}</p>
                                )}
                            </section>
                            {monthCategoryParts.length > 0 && (
                                <section className="ledger-panel">
                                    <div className="ledger-panel-head">
                                        <h2>{L.monthCategories}</h2>
                                        <button type="button" onClick={() => goTab('transactions')}>{L.report}</button>
                                    </div>
                                    <div className="ledger-cat-rail">
                                        {monthCategoryParts.map((part) => {
                                            const cap = book.categoryBudgets[part.name];
                                            const ratio = cap != null && cap > 0 ? Math.min(100, (part.amount / cap) * 100) : null;
                                            return (
                                                <button
                                                    key={part.name}
                                                    type="button"
                                                    className="ledger-cat-chip"
                                                    style={{ '--cat': part.color } as React.CSSProperties}
                                                    onClick={() => { setCategoryFilter(part.name); goTab('transactions'); }}
                                                >
                                                    <span className="ledger-cat-name">{part.name}</span>
                                                    <MoneyAmount value={part.amount} mark={mark} size="sm" />
                                                    {ratio != null && (
                                                        <span className={`ledger-cat-cap${ratio >= 100 ? ' is-over' : ''}`} aria-hidden="true">
                                                            <i style={{ width: `${ratio}%` }} />
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </section>
                            )}
                            <SampleNote L={L} book={book} onClear={clearSample} />
                        </>
                    )}

                    {panel === 'none' && active === 'transactions' && (
                        <>
                            <div className="ledger-topbar">
                                <h1>{L.transactions}</h1>
                                <button type="button" className="ledger-chip-btn" onClick={() => setPanel('filter')}>{periodLabel}</button>
                            </div>
                            <section className="ledger-toolbar" aria-label={L.filter}>
                                <input className="ledger-search" value={search} placeholder={L.searchPlaceholder} onChange={(event) => setSearch(event.target.value)} aria-label={L.searchAria} />
                                <div className="ledger-segment ledger-tx-view" role="tablist" aria-label={L.transactions}>
                                    <button type="button" role="tab" aria-selected={txView === 'list'} className={txView === 'list' ? 'is-on' : ''} onClick={() => setTxView('list')}>{L.txViewList}</button>
                                    <button type="button" role="tab" aria-selected={txView === 'calendar'} className={txView === 'calendar' ? 'is-on' : ''} onClick={() => { setTxView('calendar'); if (!calendarDay) setCalendarDay(bounds.end); }}>{L.txViewCalendar}</button>
                                </div>
                                <div className="ledger-filter-row" role="tablist" aria-label={L.reviewFilterAria}>
                                    {([['all', L.filterAll], ['open', L.filterOpen], ['done', L.filterDone]] as const).map(([id, label]) => (
                                        <button key={id} type="button" className={statusFilter === id ? 'is-on' : ''} onClick={() => setStatusFilter(id)}>{label}</button>
                                    ))}
                                    {categoryFilter !== ALL_CATEGORIES && (
                                        <button type="button" className="is-on" onClick={() => setCategoryFilter(ALL_CATEGORIES)}>{L.filterCategory} {categoryFilter} ×</button>
                                    )}
                                    {accountFilter !== ALL_ACCOUNTS && filteredAccountName && (
                                        <button type="button" className="is-on" onClick={() => setAccountFilter(ALL_ACCOUNTS)}>{L.filterAccount} {filteredAccountName} ×</button>
                                    )}
                                </div>
                            </section>
                            {spendParts.length > 0 && (
                                <section className="ledger-card">
                                    <h2>{L.categoryPeriod} · {periodLabel}</h2>
                                    <div className="ledger-pie-wrap">
                                        <SpendDonut L={L} parts={spendParts} total={periodOut} active={categoryFilter} mark={mark} onPick={chooseCategory} />
                                        <CategoryRankList
                                            L={L}
                                            parts={rankedSpendParts}
                                            total={periodOut}
                                            mark={mark}
                                            active={categoryFilter}
                                            prevByCategory={prevMonthOutByCategory}
                                            onPick={chooseCategory}
                                        />
                                    </div>
                                </section>
                            )}
                            {txView === 'calendar' && (
                                <SpendCalendar
                                    L={L}
                                    locale={locale}
                                    bounds={bounds}
                                    spendByDay={spendByDay}
                                    selected={calendarDay || bounds.end}
                                    onSelect={(day) => { setCalendarDay(day); chooseDayRange(day); }}
                                />
                            )}
                            <section className="ledger-panel">
                                <div className="ledger-panel-head">
                                    <h2>{txView === 'calendar' && calendarDay ? dayLabel(calendarDay, locale, L) : periodLabel}</h2>
                                    <span className="ledger-topbar-meta">{L.periodSpend} <MoneyAmount value={periodOut} mark={mark} size="sm" /> · {L.periodIncome} <MoneyAmount value={periodIn} mark={mark} size="sm" /></span>
                                </div>
                                {filteredEntries.length === 0 ? (
                                    <p className="ledger-panel-note">{L.txEmpty}</p>
                                ) : (
                                    (txView === 'calendar' && calendarDay
                                        ? [calendarDay]
                                        : txDays
                                    ).map((day) => (
                                        <div key={day}>
                                            {txView === 'list' && <p className="ledger-day-label">{dayLabel(day, locale, L)}</p>}
                                            <ul className="ledger-tx-list">
                                                {filteredEntries.filter((entry) => entry.date === day).map((entry) => (
                                                    <TxRow key={entry.id} L={L} entry={entry} accounts={book.accounts} mark={mark} onOpen={openEntry} onToggle={toggleChecked} />
                                                ))}
                                            </ul>
                                        </div>
                                    ))
                                )}
                            </section>
                            <SampleNote L={L} book={book} onClear={clearSample} />
                        </>
                    )}

                    {panel === 'none' && active === 'accounts' && (
                        <>
                            <div className="ledger-topbar">
                                <h1>{L.accounts}</h1>
                                <span className="ledger-topbar-meta">{book.accounts.length}{L.accountCount ? ` ${L.accountCount}` : ''}</span>
                            </div>
                            <SampleNote L={L} book={book} onClear={clearSample} />
                            {book.accounts.length === 0 && holdings.length === 0 ? (
                                <p className="ledger-empty">{L.accountsEmpty}</p>
                            ) : (
                                <>
                                    <article className="ledger-net-card ledger-accounts-hero">
                                        <p>{L.netAssets}</p>
                                        <MoneyAmount value={accountsCombined} mark={mark} size="hero" />
                                        {holdingsTotal > 0 && (
                                            <p className="ledger-net-foot">
                                                {L.accountBalance} <MoneyAmount value={cashBalance} mark={mark} size="sm" />
                                                · {L.holdingMarketValue} <MoneyAmount value={holdingsTotal} mark={mark} size="sm" />
                                            </p>
                                        )}
                                        <div className="ledger-segment ledger-accounts-window" role="tablist" aria-label={L.accountsTrend}>
                                            {([
                                                [7, L.accountsWindow7],
                                                [30, L.accountsWindow30],
                                            ] as const).map(([days, label]) => (
                                                <button key={days} type="button" role="tab" aria-selected={accountsWindowDays === days} className={accountsWindowDays === days ? 'is-on' : ''} onClick={() => setAccountsWindowDays(days)}>{label}</button>
                                            ))}
                                        </div>
                                        <SpendLine L={L} points={accountsTrend} active="" fitRange />
                                        <p className="ledger-accounts-delta">
                                            <span>{L.accountPeriodDelta}</span>
                                            <span className={accountsWindowDelta >= 0 ? 'ledger-tone-up' : 'ledger-tone-down'}>
                                                <MoneyAmount value={accountsWindowDelta} mark={mark} size="sm" signed />
                                                {' '}
                                                {formatPct(accountsWindowDelta, accountsWindowPrior)}
                                            </span>
                                        </p>
                                    </article>
                                    {accountKindOrder.map((kind) => {
                                        const group = book.accounts.filter((account) => normalizeAccountKind(account.kind) === kind);
                                        if (group.length === 0) return null;
                                        const groupTotal = group.reduce((sum, account) => sum + accountTotal(account, book.entries), 0);
                                        return (
                                            <section key={kind} className="ledger-account-group">
                                                <div className="ledger-account-group-head">
                                                    <h2>{accountKindLabel(L, kind)}</h2>
                                                    <MoneyAmount value={groupTotal} mark={mark} size="sm" />
                                                </div>
                                                {group.map((account, index) => {
                                                    const total = accountTotal(account, book.entries);
                                                    const prior = accountBalanceOnDate(account, book.entries, isoBefore(accountsWindowFrom));
                                                    const delta = total - prior;
                                                    return (
                                                        <button key={account.id} type="button" className="ledger-account-row" onClick={() => openAccountDetail(account)}>
                                                            <div className="ledger-account-left">
                                                                <div className="ledger-tx-icon" style={{ background: sliceColors[(index + kind.charCodeAt(0)) % sliceColors.length] + '33' }}>{account.name.slice(0, 1)}</div>
                                                                <div className="ledger-account-copy">
                                                                    <b>{account.name}</b>
                                                                    <p className="ledger-account-meta">{accountKindLabel(L, normalizeAccountKind(account.kind))}</p>
                                                                </div>
                                                            </div>
                                                            <div className="ledger-account-row-side">
                                                                <MoneyAmount value={total} mark={mark} size="md" />
                                                                <span className={`ledger-account-delta ${delta >= 0 ? 'is-up' : 'is-down'}`}>{formatPct(delta, prior)}</span>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </section>
                                        );
                                    })}
                                    {stockHoldings.length > 0 && (
                                        <HoldingGroupSection
                                            title={L.holdingsStock}
                                            list={stockHoldings}
                                            L={L}
                                            mark={mark}
                                            toneOffset={2}
                                            onOpen={openHoldingDetail}
                                        />
                                    )}
                                    {fundHoldings.length > 0 && (
                                        <HoldingGroupSection
                                            title={L.holdingsFund}
                                            list={fundHoldings}
                                            L={L}
                                            mark={mark}
                                            toneOffset={5}
                                            onOpen={openHoldingDetail}
                                        />
                                    )}
                                </>
                            )}
                            {book.accounts.length >= 2 && (
                                <button type="button" className="ledger-pill ledger-pill-secondary" onClick={openTransferPanel}>{L.transfer}</button>
                            )}
                            <button type="button" className="ledger-pill" onClick={() => openAccount()}>{L.addAccount}</button>
                            <button type="button" className="ledger-pill ledger-pill-secondary" onClick={() => openHolding()}>{L.addHolding}</button>
                        </>
                    )}

                    {panel === 'none' && active === 'me' && (
                        <>
                            <h1>{L.me}</h1>
                            <button type="button" className="ledger-card ledger-profile" onClick={openProfile}>
                                <div className="ledger-mark">{displayName.slice(0, 1)}</div>
                                <div className="ledger-profile-copy">
                                    <div className="ledger-profile-title">
                                        <b>{displayName}</b>
                                        {book.nickname ? <GenderIcon gender={book.gender} L={L} /> : null}
                                    </div>
                                    {!book.nickname && <span className="ledger-profile-hint">{L.profileHint}</span>}
                                    <span className="ledger-streak-meta">
                                        {L.streakDays} {logStreak} · {loggedToday ? L.streakToday : L.streakNone}
                                    </span>
                                </div>
                            </button>
                            <section className="ledger-card ledger-settings">
                                <button type="button" className="ledger-row-link" onClick={openBudgetPanel}>
                                    <span>{L.monthlyBudget}</span>
                                    <span className="ledger-row-value">
                                        {budget != null && budget > 0 ? money(budget, mark) : L.budgetUnset}
                                    </span>
                                </button>
                                <div className="ledger-settings-divider" role="presentation" />
                                <button type="button" className="ledger-row-link" onClick={() => { setExportNote(''); setPanel('export'); }}>
                                    <span>{L.exportData}</span>
                                    <span className="ledger-chevron" aria-hidden="true">›</span>
                                </button>
                                <div className="ledger-settings-divider" role="presentation" />
                                <button type="button" className="ledger-row-link" onClick={() => { setImportNote(''); setPanel('import'); }}>
                                    <span>{L.importData}</span>
                                    <span className="ledger-chevron" aria-hidden="true">›</span>
                                </button>
                                <div className="ledger-settings-divider" role="presentation" />
                                <a className="ledger-row-link" href="https://www.baidu.com" target="_blank" rel="noreferrer">
                                    <span>{L.privacy}</span>
                                    <span className="ledger-chevron" aria-hidden="true">›</span>
                                </a>
                                <div className="ledger-settings-divider" role="presentation" />
                                <div className="ledger-settings-block">
                                    <p className="ledger-settings-label" id="ledger-locale-label">{L.language}</p>
                                    <div className="ledger-choice-row" role="tablist" aria-labelledby="ledger-locale-label">
                                        <button type="button" role="tab" aria-selected={locale === 'zh'} className={locale === 'zh' ? 'is-on' : ''} onClick={() => setBook({ ...book, locale: 'zh' })}>中文</button>
                                        <button type="button" role="tab" aria-selected={locale === 'en'} className={locale === 'en' ? 'is-on' : ''} onClick={() => setBook({ ...book, locale: 'en' })}>English</button>
                                    </div>
                                </div>
                                <div className="ledger-settings-divider" role="presentation" />
                                <div className="ledger-settings-block">
                                    <p className="ledger-settings-label" id="ledger-currency-label">{L.currency}</p>
                                    <div className="ledger-choice-row ledger-choice-row--wrap" role="tablist" aria-labelledby="ledger-currency-label">
                                        {currencyOptions.map((item) => (
                                            <button key={item} type="button" role="tab" aria-selected={book.currency === item} className={book.currency === item ? 'is-on' : ''} onClick={() => setBook({ ...book, currency: item })}>{item}</button>
                                        ))}
                                    </div>
                                </div>
                            </section>
                            <section className="ledger-card">
                                <div className="ledger-card-head">
                                    <h2>{L.categories}</h2>
                                    <button type="button" className="ledger-head-action" onClick={() => setEditingCategories((on) => !on)}>{editingCategories ? L.done : L.edit}</button>
                                </div>
                                <div className={`ledger-chips${editingCategories ? ' is-editing' : ''}`}>
                                    {book.categories.map((name) => (
                                        <span key={name} className="ledger-static-chip">
                                            {name}
                                            {editingCategories && book.categories.length > 1 && (
                                                <button type="button" className="ledger-chip-remove" aria-label={`${L.deleteCategory}${name}`} onClick={() => removeCategory(name)}>×</button>
                                            )}
                                        </span>
                                    ))}
                                </div>
                                <div className="ledger-add-row">
                                    <input className="ledger-field" value={categoryName} placeholder={L.newCategory} onChange={(event) => setCategoryName(event.target.value)} />
                                    <button type="button" className="ledger-pill" onClick={addCategory} disabled={!categoryName.trim()}>{L.add}</button>
                                </div>
                            </section>
                        </>
                    )}
                </div>

                {showFab && (
                    <button type="button" className="ledger-fab" aria-label={L.fabLabel} onClick={() => openEntry()}>+</button>
                )}
                </div>

                {clearAsk && (
                    <div className="ledger-modal-backdrop" role="presentation" onClick={() => setClearAsk(false)}>
                        <div className="ledger-modal" role="dialog" aria-modal="true" aria-labelledby="ledger-clear-title" onClick={(event) => event.stopPropagation()}>
                            <h2 id="ledger-clear-title">{L.clearBook}</h2>
                            <p>{L.clearBookConfirm}</p>
                            <div className="ledger-modal-actions">
                                <button type="button" onClick={() => setClearAsk(false)}>{L.cancel}</button>
                                <button type="button" className="is-danger" onClick={confirmClearBook}>{L.clearBook}</button>
                            </div>
                        </div>
                    </div>
                )}

                <nav className="ledger-tabs" aria-label={L.mainNav}>
                    {tabs.map((tab) => (
                        <button key={tab.id} type="button" className={active === tab.id ? 'is-on' : ''} aria-current={active === tab.id ? 'page' : undefined} onClick={() => goTab(tab.id)}>
                            {tab.icon}
                            {tab.title}
                        </button>
                    ))}
                </nav>
            </section>
        </main>
    );
}

function CategoryRankList({
    L,
    parts,
    total,
    mark,
    active,
    prevByCategory,
    onPick,
}: {
    L: Copy;
    parts: { name: string; amount: number; color: string }[];
    total: number;
    mark: string;
    active: string;
    prevByCategory: Map<string, number>;
    onPick: (name: string) => void;
}) {
    return (
        <ul className="ledger-rank">
            {parts.map((part) => {
                const prev = prevByCategory.get(part.name) ?? 0;
                const trend = part.amount > prev ? L.rankUp : part.amount < prev ? L.rankDown : L.rankFlat;
                const trendClass = part.amount > prev ? 'is-up' : part.amount < prev ? 'is-down' : '';
                return (
                    <li key={part.name}>
                        <button type="button" className={active === part.name ? 'is-on' : ''} onClick={() => onPick(part.name)}>
                            <span className="ledger-rank-label">
                                <i style={{ background: part.color }} />
                                <span>{part.name}</span>
                            </span>
                            <span className="ledger-rank-bar" aria-hidden="true">
                                <span style={{ width: `${Math.max(4, (part.amount / total) * 100)}%`, background: part.color }} />
                            </span>
                            <span className="ledger-rank-side">
                                <MoneyAmount value={part.amount} mark={mark} size="sm" />
                                <span className={`ledger-rank-trend ${trendClass}`} title={L.vsLastMonth}>{trend}</span>
                            </span>
                        </button>
                    </li>
                );
            })}
        </ul>
    );
}

function SpendCalendar({
    L,
    locale,
    bounds,
    spendByDay,
    selected,
    onSelect,
}: {
    L: Copy;
    locale: Locale;
    bounds: { start: string; end: string };
    spendByDay: Map<string, number>;
    selected: string;
    onSelect: (day: string) => void;
}) {
    const anchor = new Date(`${bounds.end}T00:00:00`);
    const year = anchor.getFullYear();
    const month = anchor.getMonth();
    const cells = calendarCells(year, month);
    const maxSpend = Math.max(...cells.map((cell) => (cell.iso ? spendByDay.get(cell.iso) ?? 0 : 0)), 1);
    const monthLabel = locale === 'en'
        ? anchor.toLocaleString('en-US', { month: 'long', year: 'numeric' })
        : `${year}年${month + 1}月`;

    return (
        <section className="ledger-panel ledger-calendar">
            <h2>{L.txViewCalendar} · {monthLabel}</h2>
            <div className="ledger-calendar-week" aria-hidden="true">
                {L.weekday.map((label) => <span key={label}>{label}</span>)}
            </div>
            <div className="ledger-calendar-grid" role="grid">
                {cells.map((cell, index) => {
                    const iso = cell.iso;
                    if (!iso) return <span key={`pad-${index}`} className="ledger-calendar-pad" />;
                    const spend = spendByDay.get(iso) ?? 0;
                    const inRange = iso >= bounds.start && iso <= bounds.end;
                    const intensity = spend > 0 ? Math.max(0.2, spend / maxSpend) : 0;
                    return (
                        <button
                            key={iso}
                            type="button"
                            role="gridcell"
                            disabled={!inRange}
                            className={`ledger-calendar-day${selected === iso ? ' is-selected' : ''}${spend > 0 ? ' has-spend' : ''}`}
                            style={{ '--heat': intensity } as React.CSSProperties}
                            onClick={() => onSelect(iso)}
                        >
                            <span>{cell.day}</span>
                            {spend > 0 && <i aria-hidden="true" />}
                        </button>
                    );
                })}
            </div>
        </section>
    );
}

function TxRow({ L, entry, accounts, mark, onOpen, onToggle }: { L: Copy; entry: Entry; accounts: Account[]; mark: string; onOpen: (entry: Entry) => void; onToggle: (id: string) => void }) {
    const account = accounts.find((item) => item.id === entry.accountId);
    const value = signedValue(entry);
    const colorIndex = entry.category.charCodeAt(0) % sliceColors.length;
    return (
        <li className="ledger-tx">
            <div className="ledger-tx-icon" style={{ background: `${sliceColors[colorIndex]}33` }}>{entry.category.slice(0, 1)}</div>
            <button type="button" className="ledger-tx-main" onClick={() => onOpen(entry)}>
                <b>{entry.title}</b>
                <span>{entry.category} · {account?.name ?? L.defaultAccount}{entry.shared ? ` · ${L.familyTag}` : ''}</span>
            </button>
            <div className="ledger-tx-side">
                <MoneyAmount value={value} mark={mark} size="md" signed />
                <button type="button" className={`ledger-review-btn ${entry.checked ? 'is-done' : 'is-open'}`} onClick={() => onToggle(entry.id)}>
                    {entry.checked ? L.checked : L.unchecked}
                </button>
            </div>
        </li>
    );
}

function SpendDonut({ L, parts, total, active, mark, onPick }: { L: Copy; parts: { name: string; amount: number; color: string }[]; total: number; active: string; mark: string; onPick: (name: string) => void }) {
    const radius = 50;
    const turn = 2 * Math.PI * radius;
    let cursor = 0;
    return (
        <svg className="ledger-pie" viewBox="0 0 140 140" role="img" aria-label={L.categorySpendAria}>
            {parts.map((part) => {
                const length = Math.max((part.amount / total) * turn - (parts.length > 1 ? 3 : 0), 1);
                const node = (
                    <circle key={part.name} cx="70" cy="70" r={radius} fill="none" stroke={part.color} strokeWidth={active === part.name ? 22 : 16} strokeDasharray={`${length} ${turn - length}`} strokeDashoffset={-cursor} transform="rotate(-90 70 70)" onClick={() => onPick(part.name)} />
                );
                cursor += (part.amount / total) * turn;
                return node;
            })}
            <text x="70" y="66" textAnchor="middle" fill="#6E6878" fontSize="11">{L.periodSpend}</text>
            <text x="70" y="84" textAnchor="middle" fill="#0B051D" fontSize="12" fontWeight="700">{money(total, mark)}</text>
        </svg>
    );
}

/** 圆点直径约 7px。点距不够时隔天取样，避免 3 个月挤成一条。折线仍用全部日期。 */
function spacedMarkers<T>(points: T[], width: number) {
    if (points.length <= 2) return points;
    const pointStep = (width - 20) / (points.length - 1);
    const stride = pointStep >= 12 ? 1 : Math.ceil(12 / pointStep);
    if (stride <= 1) return points;
    const picked: T[] = [];
    for (let index = 0; index < points.length; index += stride) picked.push(points[index]);
    const last = points[points.length - 1];
    const previous = (picked.length - 1) * stride;
    if (previous !== points.length - 1) {
        if (points.length - 1 - previous < stride) picked[picked.length - 1] = last;
        else picked.push(last);
    }
    return picked;
}

function SpendLine({ L, points, active, onPick, fitRange = false }: { L: Copy; points: { day: string; amount: number }[]; active: string; onPick?: (day: string) => void; fitRange?: boolean }) {
    const width = 320;
    const height = 120;
    const min = Math.min(...points.map((point) => point.amount));
    const max = Math.max(...points.map((point) => point.amount), 1);
    const step = points.length <= 1 ? 0 : (width - 20) / (points.length - 1);
    const plotH = height - 32;
    const placed = points.map((point, index) => {
        let y: number;
        if (fitRange) {
            y = max === min ? height / 2 : height - 16 - ((point.amount - min) / (max - min)) * plotH;
        } else {
            y = height - 16 - (point.amount / max) * plotH;
        }
        return { ...point, x: 10 + index * step, y };
    });
    const path = placed.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`).join(' ');
    const dots = spacedMarkers(placed, width);
    return (
        <svg className="ledger-line" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={L.spendLineAria}>
            <path d={path} fill="none" stroke="#E85D75" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            {dots.map((point) => (
                <circle key={point.day} cx={point.x} cy={point.y} r={active === point.day ? 5 : point.amount > 0 ? 3.5 : 2} fill={active === point.day ? '#0B051D' : '#FFB3C7'} stroke="#0B051D" strokeWidth="1.2" onClick={onPick ? () => onPick(point.day) : undefined} />
            ))}
        </svg>
    );
}

function SampleNote({ L, book, onClear }: { L: Copy; book: Book; onClear: () => void }) {
    const hasSample = book.accounts.some((account) => account.id.startsWith('sample-')) || book.entries.some((entry) => entry.id.startsWith('sample-'));
    if (!hasSample) return null;
    return (
        <div className="ledger-banner">
            <span>{L.sampleBanner}</span>
            <button type="button" onClick={onClear}>{L.sampleClear}</button>
        </div>
    );
}

function HoldingGroupSection({
    title,
    list,
    L,
    mark,
    toneOffset,
    onOpen,
}: {
    title: string;
    list: Holding[];
    L: Copy;
    mark: string;
    toneOffset: number;
    onOpen: (holding: Holding) => void;
}) {
    const groupTotal = holdingsMarketTotal(list);
    return (
        <section className="ledger-account-group">
            <div className="ledger-account-group-head">
                <h2>{title}</h2>
                <MoneyAmount value={groupTotal} mark={mark} size="sm" />
            </div>
            {list.map((holding, index) => {
                    const value = holdingMarketValue(holding);
                    const pnl = holdingUnrealizedPnl(holding);
                    return (
                        <button key={holding.id} type="button" className="ledger-account-row" onClick={() => onOpen(holding)}>
                            <div className="ledger-account-left">
                                <div className="ledger-tx-icon" style={{ background: sliceColors[(index + toneOffset) % sliceColors.length] + '33' }}>{holding.name.slice(0, 1)}</div>
                                <div className="ledger-account-copy">
                                    <b>{holding.name}</b>
                                    <p className="ledger-account-meta">{holding.code} · {holdingKindLabel(L, holding.kind)} · {formatHoldingQty(holding.kind, holding.qty)}</p>
                                </div>
                            </div>
                            <div className="ledger-account-row-side">
                                <MoneyAmount value={value} mark={mark} size="md" />
                                <span className={`ledger-account-delta ${pnl >= 0 ? 'is-up' : 'is-down'}`}>
                                    <MoneyAmount value={pnl} mark={mark} size="sm" signed />
                                </span>
                            </div>
                        </button>
                    );
                })}
        </section>
    );
}

function HoldingDetailView({
    L,
    holding,
    mark,
    locale,
    onBack,
    onEdit,
}: {
    L: Copy;
    holding: Holding;
    mark: string;
    locale: Locale;
    onBack: () => void;
    onEdit: () => void;
}) {
    const value = holdingMarketValue(holding);
    const pnl = holdingUnrealizedPnl(holding);
    const unitCost = holdingCostPrice(holding);
    const priceLabel = locale === 'en'
        ? new Date(`${holding.priceAsOf}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : holding.priceAsOf;

    return (
        <>
            <SubpageHead L={L} title={holding.name} onBack={onBack} />
            <article className="ledger-card">
                <p className="ledger-settings-label">{holding.code} · {holdingKindLabel(L, holding.kind)}</p>
                <MoneyAmount value={value} mark={mark} size="hero" />
                <p className="ledger-account-detail-meta">
                    <span>{L.holdingPnl}</span>
                    <span className={pnl >= 0 ? 'ledger-tone-up' : 'ledger-tone-down'}>
                        <MoneyAmount value={pnl} mark={mark} size="sm" signed />
                    </span>
                </p>
                <dl className="ledger-holding-facts">
                    <div><dt>{L.holdingQty}</dt><dd>{formatHoldingQty(holding.kind, holding.qty)}</dd></div>
                    <div><dt>{L.holdingCostPrice}</dt><dd><MoneyAmount value={unitCost} mark={mark} size="sm" /></dd></div>
                    <div><dt>{L.holdingCostTotal}</dt><dd><MoneyAmount value={holding.costTotal} mark={mark} size="sm" /></dd></div>
                    <div><dt>{L.holdingPrice}</dt><dd><MoneyAmount value={holding.price} mark={mark} size="sm" /> <span className="ledger-holding-asof">{priceLabel}</span></dd></div>
                </dl>
            </article>
            <button type="button" className="ledger-pill" onClick={onEdit}>{L.editHolding}</button>
        </>
    );
}

function AccountDetailView({
    L,
    account,
    entries,
    mark,
    windowDays,
    onBack,
    onEdit,
    onActivity,
}: {
    L: Copy;
    account: Account;
    entries: Entry[];
    mark: string;
    windowDays: AccountsWindow;
    onBack: () => void;
    onEdit: () => void;
    onActivity: () => void;
}) {
    const total = accountTotal(account, entries);
    const windowFrom = accountsWindowStart(windowDays);
    const prior = accountBalanceOnDate(account, entries, isoBefore(windowFrom));
    const delta = total - prior;
    const flow = accountPeriodFlow(account.id, entries, windowFrom, todayIso());
    const series = netWorthSeries([account], entries, [], windowDays);

    return (
        <>
            <SubpageHead L={L} title={account.name} onBack={onBack} />
            <article className="ledger-card">
                <p className="ledger-settings-label">{accountKindLabel(L, normalizeAccountKind(account.kind))}</p>
                <MoneyAmount value={total} mark={mark} size="hero" />
                <p className="ledger-account-detail-meta">
                    <span>{L.accountPeriodDelta}</span>
                    <span className={delta >= 0 ? 'ledger-tone-up' : 'ledger-tone-down'}>
                        <MoneyAmount value={delta} mark={mark} size="sm" signed />
                        {' '}
                        {formatPct(delta, prior)}
                    </span>
                </p>
                <p className="ledger-account-detail-meta">
                    {L.accountPeriodNet}{' '}
                    <MoneyAmount value={flow.net} mark={mark} size="sm" signed />
                    <span className="ledger-account-detail-flow">
                        · {L.periodIncome} <MoneyAmount value={flow.inflow} mark={mark} size="sm" />
                        {' · '}{L.periodSpend} <MoneyAmount value={flow.outflow} mark={mark} size="sm" />
                    </span>
                </p>
                <SpendLine L={L} points={series} active="" />
            </article>
            <button type="button" className="ledger-pill" onClick={onEdit}>{L.editAccount}</button>
            <button type="button" className="ledger-text-button" onClick={onActivity}>{L.accountDetailActivity}</button>
        </>
    );
}

function SubpageHead({ L, title, onBack }: { L: Copy; title: string; onBack: () => void }) {
    return (
        <header className="ledger-subhead">
            <button type="button" className="ledger-back-btn" onClick={onBack} aria-label={L.back}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M19 12H5M12 19 5 12 12 5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>
            <h1>{title}</h1>
        </header>
    );
}

function FilterPage({ L, locale, scope, periodMode, rangeFrom, rangeTo, onScope, onToday, onMonth, onRange, onFrom, onTo, onBack }: {
    L: Copy;
    locale: Locale;
    scope: Scope;
    periodMode: PeriodMode;
    rangeFrom: string;
    rangeTo: string;
    onScope: (scope: Scope) => void;
    onToday: () => void;
    onMonth: () => void;
    onRange: () => void;
    onFrom: (value: string) => void;
    onTo: (value: string) => void;
    onBack: () => void;
}) {
    return (
        <>
            <SubpageHead L={L} title={L.filter} onBack={onBack} />
            <section className="ledger-card">
                <h2>{L.filterScope}</h2>
                <div className="ledger-segment" role="tablist" aria-label={L.filterScope}>
                    <button type="button" role="tab" aria-selected={scope === 'mine'} className={scope === 'mine' ? 'is-on' : ''} onClick={() => onScope('mine')}>{L.scopeMine}</button>
                    <button type="button" role="tab" aria-selected={scope === 'family'} className={scope === 'family' ? 'is-on' : ''} onClick={() => onScope('family')}>{L.scopeFamily}</button>
                </div>
            </section>
            <section className="ledger-card">
                <h2>{L.time}</h2>
                <div className="ledger-segment ledger-segment-3" role="tablist" aria-label={L.time}>
                    <button type="button" role="tab" aria-selected={periodMode === 'today'} className={periodMode === 'today' ? 'is-on' : ''} onClick={onToday}>{L.today}</button>
                    <button type="button" role="tab" aria-selected={periodMode === 'month'} className={periodMode === 'month' ? 'is-on' : ''} onClick={onMonth}>{L.thisMonth}</button>
                    <button type="button" role="tab" aria-selected={periodMode === 'range'} className={periodMode === 'range' ? 'is-on' : ''} onClick={onRange}>{L.customRange}</button>
                </div>
                {periodMode === 'range' && (
                    <div className="ledger-dates">
                        <DateField label={L.rangeStart} locale={locale} value={rangeFrom} max={todayIso()} onChange={onFrom} L={L} />
                        <span>{L.rangeTo}</span>
                        <DateField label={L.rangeEnd} locale={locale} value={rangeTo} max={todayIso()} onChange={onTo} L={L} />
                    </div>
                )}
            </section>
            <button type="button" className="ledger-pill" onClick={onBack}>{L.done}</button>
        </>
    );
}

function EntryForm({
    L,
    locale,
    draft,
    book,
    categories,
    titleSuggestions,
    onChange,
    onSave,
    onDelete,
    onBack,
}: {
    L: Copy;
    locale: Locale;
    draft: EntryDraft;
    book: Book;
    categories: string[];
    titleSuggestions: string[];
    onChange: (draft: EntryDraft) => void;
    onSave: () => void;
    onDelete: () => void;
    onBack: () => void;
}) {
    const amountOk = Number(draft.amount) > 0;
    return (
        <>
            <SubpageHead L={L} title={draft.id ? L.entryEdit : L.entryNew} onBack={onBack} />
            <div className="ledger-choice-row" role="tablist" aria-label={L.direction}>
                <button type="button" role="tab" aria-selected={draft.direction === 'out'} className={draft.direction === 'out' ? 'is-on' : ''} onClick={() => onChange({ ...draft, direction: 'out' })}>{L.expense}</button>
                <button type="button" role="tab" aria-selected={draft.direction === 'in'} className={draft.direction === 'in' ? 'is-on' : ''} onClick={() => onChange({ ...draft, direction: 'in' })}>{L.income}</button>
            </div>
            <label className="ledger-label" htmlFor="entry-amount">{L.amount}</label>
            <input id="entry-amount" className="ledger-field" inputMode="decimal" value={draft.amount} placeholder="0.00" onChange={(event) => onChange({ ...draft, amount: event.target.value })} />
            <label className="ledger-label" htmlFor="entry-title">{L.name}</label>
            <input id="entry-title" className="ledger-field" value={draft.title} placeholder={L.namePh} onChange={(event) => onChange({ ...draft, title: event.target.value })} />
            {titleSuggestions.length > 0 && (
                <>
                    <p className="ledger-label">{L.titleSuggestions}</p>
                    <div className="ledger-chips">
                        {titleSuggestions.map((title) => (
                            <button key={title} type="button" className={draft.title === title ? 'is-on' : ''} onClick={() => onChange({ ...draft, title })}>{title}</button>
                        ))}
                    </div>
                </>
            )}
            <p className="ledger-label">{L.category}</p>
            <div className="ledger-chips">
                {categories.map((name) => (
                    <button key={name} type="button" className={draft.category === name ? 'is-on' : ''} onClick={() => onChange({ ...draft, category: name })}>{name}</button>
                ))}
            </div>
            <label className="ledger-label" htmlFor="entry-date">{L.date}</label>
            <DateField id="entry-date" label={L.date} locale={locale} value={draft.date} max={todayIso()} onChange={(date) => onChange({ ...draft, date })} L={L} />
            <label className="ledger-label" htmlFor="entry-account">{L.account}</label>
            {book.accounts.length > 0 ? (
                <ChoiceMenu id="entry-account" label={L.account} value={draft.accountId} options={book.accounts.map((account) => ({ value: account.id, label: account.name }))} onChange={(accountId) => onChange({ ...draft, accountId })} />
            ) : (
                <input id="entry-account" className="ledger-field" value={draft.accountName} onChange={(event) => onChange({ ...draft, accountName: event.target.value })} />
            )}
            <label className="ledger-check">
                <input type="checkbox" checked={draft.shared} onChange={(event) => onChange({ ...draft, shared: event.target.checked })} />
                {L.shared}
            </label>
            <button type="button" className="ledger-pill" onClick={onSave} disabled={!draft.title.trim() || !amountOk}>{L.save}</button>
            {draft.id && <button type="button" className="ledger-text-button" onClick={onDelete}>{L.deleteEntry}</button>}
        </>
    );
}

