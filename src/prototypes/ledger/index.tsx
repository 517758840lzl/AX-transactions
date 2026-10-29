/**
 * @name SpendLogBook
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import brandMark from './assets/brand-mark.png';
import { defineHashPageRoute, useHashPage } from '../../common/useHashPage';
import {
    accountBalanceOnDate,
    accountKindOrder,
    accountTotal,
    bookBalanceOnDate,
    bookNetWorth,
    bookNetWorthOnDate,
    createId,
    currencyMark,
    currencyOptions,
    emptyBook,
    loadBook,
    normalizeAccountKind,
    normalizeClaim,
    normalizeCurrency,
    parseGoals,
    saveBook,
    moneyTyping,
    solveMoney,
    signedValue,
    categoryBudgetHint,
    defaultMonthlyBudgetHint,
    dedupeTemplates,
    starterCategories,
    withoutSample,
    type Account,
    type AccountKind,
    type Book,
    type ClaimMark,
    type Direction,
    type Entry,
    type Gender,
    type SavingGoal,
} from './store';
import { localeChoices, normalizeLocale, strings, type Copy, type Locale } from './i18n';
import './style.css';

const ALL_CATEGORIES = '*';
const ALL_ACCOUNTS = '*';

type Scope = 'mine' | 'family';
type PageId = 'dashboard' | 'transactions' | 'accounts' | 'me';
type Panel = 'none' | 'entry' | 'account' | 'accountDetail' | 'profile' | 'filter' | 'budget' | 'transfer' | 'privacy' | 'year' | 'goals' | 'goal' | 'language' | 'currency' | 'categories' | 'worth' | 'removed' | 'export';
type TxView = 'list' | 'calendar';
type PeriodMode = 'today' | 'month' | 'range';
type AccountsWindow = 7 | 30;
type WorthSpan = 'week' | 'month' | 'quarter' | 'year' | 'all';
const WORTH_SPANS: WorthSpan[] = ['week', 'month', 'quarter', 'year', 'all'];

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

function yearColumns(entries: Entry[], year: number) {
    return Array.from({ length: 12 }, (_, index) => {
        const month = index + 1;
        const prefix = `${year}-${`${month}`.padStart(2, '0')}`;
        const rows = entries.filter((entry) => entry.date.startsWith(prefix));
        const spend = rows.filter((entry) => isSpend(entry)).reduce((sum, entry) => sum + entry.amount, 0);
        const income = rows.filter((entry) => isIncome(entry)).reduce((sum, entry) => sum + entry.amount, 0);
        return { month, spend, income };
    });
}

function claimBackTitle(template: string, title: string) {
    return template.replace('{title}', title);
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

function worthDayCount(span: WorthSpan, entries: Entry[]) {
    if (span === 'week') return 7;
    if (span === 'month') return 30;
    if (span === 'quarter') return 90;
    if (span === 'year') return 365;
    const dates = entries.map((entry) => entry.date).filter((day) => day.length >= 10);
    if (dates.length === 0) return 2;
    const first = dates.reduce((left, right) => (left < right ? left : right));
    const start = new Date(`${first}T00:00:00`);
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    const count = Math.round((end.getTime() - start.getTime()) / 86400000);
    return Math.max(count + 1, 2);
}

function worthPastLabel(L: Copy, span: WorthSpan) {
    if (span === 'week') return L.worthPastWeek;
    if (span === 'quarter') return L.worthPastQuarter;
    if (span === 'year') return L.worthPastYear;
    if (span === 'all') return L.worthPastAll;
    return L.worthPastMonth;
}

function worthSpanLabel(L: Copy, span: WorthSpan) {
    if (span === 'week') return L.worthSpanWeek;
    if (span === 'quarter') return L.worthSpanQuarter;
    if (span === 'year') return L.worthSpanYear;
    if (span === 'all') return L.worthSpanAll;
    return L.worthSpanMonth;
}

function openAccountList(accounts: Account[], keeping = '') {
    return accounts.filter((account) => account.archived !== true || account.id === keeping);
}

function cardCycle(account: Account, entries: Entry[]) {
    const statementDay = account.statementDay ?? 0;
    if (normalizeAccountKind(account.kind) !== 'card' || statementDay < 1) return null;
    const today = todayIso();
    const offset = new Date().getDate() >= statementDay ? 0 : -1;
    const start = isoDate(new Date(new Date().getFullYear(), new Date().getMonth() + offset, statementDay));
    const nextStart = isoDate(new Date(new Date().getFullYear(), new Date().getMonth() + offset + 1, statementDay));
    const end = isoBefore(nextStart);
    const dueDay = (account.dueDay ?? 0) >= 1 ? (account.dueDay as number) : statementDay;
    let due = isoDate(new Date(new Date().getFullYear(), new Date().getMonth() + offset, dueDay));
    if (due <= start) due = isoDate(new Date(new Date().getFullYear(), new Date().getMonth() + offset + 1, dueDay));
    const close = end < today ? end : today;
    const spent = entries
        .filter((entry) => entry.accountId === account.id && entry.date >= start && entry.date <= close)
        .reduce((sum, entry) => sum + (entry.direction === 'out' ? entry.amount : -entry.amount), 0);
    return { start, end, due, spent: Math.round(spent * 100) / 100 };
}

function goalKept(goal: SavingGoal, entries: Entry[]) {
    const linked = entries
        .filter((entry) => entry.goalId === goal.id && entry.direction === 'out')
        .reduce((sum, entry) => sum + entry.amount, 0);
    return Math.round((goal.saved + linked) * 100) / 100;
}

function isTransfer(entry: Entry) {
    return entry.id.startsWith('transfer-');
}

function transferMate(id: string) {
    if (!id.startsWith('transfer-')) return '';
    if (id.endsWith('-in')) return `${id.slice(0, -3)}-out`;
    if (id.endsWith('-out')) return `${id.slice(0, -4)}-in`;
    return '';
}

function isSpend(entry: Entry) {
    return entry.direction === 'out' && !isTransfer(entry);
}

function isIncome(entry: Entry) {
    return entry.direction === 'in' && !isTransfer(entry);
}

type StatsKind = 'out' | 'in' | 'other';

function shiftMonthKey(key: string, delta: number) {
    const [year, month] = key.split('-').map(Number);
    const date = new Date(year, month - 1 + delta, 1);
    return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}`;
}

function monthSpan(key: string) {
    const [year, month] = key.split('-').map(Number);
    const endDate = new Date(year, month, 0);
    return { start: `${key}-01`, end: `${key}-${`${endDate.getDate()}`.padStart(2, '0')}` };
}

function matchesStatsKind(entry: Entry, kind: StatsKind) {
    if (kind === 'other') return isTransfer(entry) && entry.direction === 'out';
    if (kind === 'in') return isIncome(entry);
    return isSpend(entry);
}

function fillCopy(template: string, values: Record<string, string>) {
    return template.replace(/\{(\w+)\}/g, (_, token: string) => values[token] ?? '');
}

function accountsWindowStart(days: number) {
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

function netWorthSeries(accounts: Account[], entries: Entry[], days: number) {
    const start = accountsWindowStart(days);
    const end = todayIso();
    return eachDay(start, end).map((day) => ({
        day,
        amount: bookNetWorthOnDate(accounts, entries, day),
    }));
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

function detectRecurring(entries: Entry[]) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 120);
    const minIso = isoDate(cutoff);
    const groups = new Map<string, { title: string; amount: number; dates: string[]; sample: Entry }>();
    for (const entry of entries) {
        if (!isSpend(entry) || entry.date < minIso) continue;
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

const AmountsHidden = React.createContext(false);

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
    const hidden = React.useContext(AmountsHidden);
    if (hidden) {
        return <span className={`ledger-money ledger-money--${size}`} aria-label="hidden">***</span>;
    }
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

function avatarMark(gender: Gender) {
    if (gender === 'female') return '👩';
    if (gender === 'male') return '👨';
    return '🧑';
}

function SettingsLink({ title, value, danger, onClick }: { title: string; value?: string; danger?: boolean; onClick: () => void }) {
    return (
        <button type="button" className={`ledger-row-link${danger ? ' ledger-clear-row' : ''}`} onClick={onClick}>
            <span>{title}</span>
            <span className="ledger-row-trail">
                {value ? <span className="ledger-row-value">{value}</span> : null}
                <span className="ledger-chevron" aria-hidden="true">›</span>
            </span>
        </button>
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
    claim: ClaimMark;
    goalId: string;
    splitOn: boolean;
    otherAmount: string;
    otherCategory: string;
    otherShared: boolean;
};

function blankEntry(book: Book): EntryDraft {
    return {
        id: '',
        title: '',
        amount: '',
        direction: 'out',
        category: book.categories[0] ?? starterCategories[0],
        date: todayIso(),
        accountId: book.accounts.find((account) => account.archived !== true)?.id ?? '',
        accountName: book.locale === 'zh' ? '现金' : 'Cash',
        shared: false,
        checked: false,
        claim: 'none',
        goalId: '',
        splitOn: false,
        otherAmount: '',
        otherCategory: book.categories[1] ?? book.categories[0] ?? starterCategories[0],
        otherShared: false,
    };
}

export default function LedgerApp() {
    const { page, setPage: setPageHash } = useHashPage(route);
    const resolved = (legacyPage[page] ?? page) as PageId;
    const [book, setBook] = useState<Book>(emptyBook);
    const locale = normalizeLocale(book.locale);
    const L = strings(locale);
    const tabs = useMemo(() => ledgerTabs(L), [locale]);
    const active = tabs.some((tab) => tab.id === resolved) ? resolved : 'dashboard';

    const [ready, setReady] = useState(false);
    const [opening, setOpening] = useState(true);
    const [openingOut, setOpeningOut] = useState(false);
    const [scope, setScope] = useState<Scope>('mine');
    const [listAll, setListAll] = useState(false);
    const [panel, setPanelState] = useState<Panel>('none');
    const [pageMotion, setPageMotion] = useState<'forward' | 'back' | 'fade'>('fade');
    const pageMotionRef = useRef<'forward' | 'back' | 'fade'>('fade');
    const [clearAsk, setClearAsk] = useState(false);
    const [importAsk, setImportAsk] = useState(false);
    const [pendingImport, setPendingImport] = useState<Partial<Book> | null>(null);
    const importFileRef = useRef<HTMLInputElement>(null);
    const entryReturn = useRef<Panel | null>(null);
    const accountFromEntry = useRef(false);
    const [draft, setDraft] = useState<EntryDraft>(() => blankEntry(emptyBook()));
    const [accountName, setAccountName] = useState('');
    const [accountOpening, setAccountOpening] = useState('');
    const [accountKind, setAccountKind] = useState<AccountKind | ''>('cash');
    const [editingAccountId, setEditingAccountId] = useState('');
    const [viewingAccountId, setViewingAccountId] = useState('');
    const [worthSpan, setWorthSpan] = useState<WorthSpan>('month');
    const [statementDay, setStatementDay] = useState('');
    const [dueDay, setDueDay] = useState('');
    const [accountArchived, setAccountArchived] = useState(false);
    const [depositAmount, setDepositAmount] = useState('');
    const [depositFrom, setDepositFrom] = useState('');
    const [depositTo, setDepositTo] = useState('');
    const [categoryName, setCategoryName] = useState('');
    const [editingCategories, setEditingCategories] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState(ALL_CATEGORIES);
    const [accountFilter, setAccountFilter] = useState(ALL_ACCOUNTS);
    const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'done'>('all');
    const [periodMode, setPeriodMode] = useState<PeriodMode>('month');
    const [feedKind, setFeedKind] = useState<StatsKind | ''>('');
    const [statsAnnual, setStatsAnnual] = useState(false);
    const [statsKind, setStatsKind] = useState<StatsKind>('out');
    const [statsMonth, setStatsMonth] = useState(() => todayIso().slice(0, 7));
    const [rangeFrom, setRangeFrom] = useState(() => monthBounds(0).start);
    const [rangeTo, setRangeTo] = useState(todayIso);
    const [draftName, setDraftName] = useState('');
    const [draftGender, setDraftGender] = useState<Gender>('secret');
    const [search, setSearch] = useState('');
    const [txView, setTxView] = useState<TxView>('list');
    const [calendarDay, setCalendarDay] = useState('');
    const [budgetInput, setBudgetInput] = useState('');
    const [exportNote, setExportNote] = useState('');
    const [transferFrom, setTransferFrom] = useState('');
    const [transferTo, setTransferTo] = useState('');
    const [transferAmount, setTransferAmount] = useState('');
    const [transferDate, setTransferDate] = useState(todayIso);
    const [categoryBudgetDraft, setCategoryBudgetDraft] = useState<Record<string, string>>({});
    const [reportYear, setReportYear] = useState(() => new Date().getFullYear());
    const [goalId, setGoalId] = useState('');
    const [goalTitle, setGoalTitle] = useState('');
    const [goalTarget, setGoalTarget] = useState('');
    const [goalSaved, setGoalSaved] = useState('');

    useEffect(() => {
        setBook(loadBook());
        setReady(true);
    }, []);

    useEffect(() => {
        if (!ready) return;
        const hold = window.setTimeout(() => setOpeningOut(true), 2200);
        const gone = window.setTimeout(() => setOpening(false), 2520);
        return () => {
            window.clearTimeout(hold);
            window.clearTimeout(gone);
        };
    }, [ready]);

    useEffect(() => {
        if (ready) saveBook(book);
    }, [book, ready]);

    const mark = currencyMark[book.currency];
    const visibleEntries = useMemo(
        () => book.entries.filter((entry) => (scope === 'family' ? entry.shared : !entry.shared)),
        [book.entries, scope],
    );
    const reviewQueue = [...visibleEntries].filter((entry) => !entry.checked).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
    const bounds = periodBounds(periodMode, rangeFrom, rangeTo);
    const periodSource = listAll ? book.entries : visibleEntries;
    const periodEntries = periodSource.filter((entry) => entry.date >= bounds.start && entry.date <= bounds.end);
    const periodOut = periodEntries.filter((entry) => isSpend(entry)).reduce((sum, entry) => sum + entry.amount, 0);
    const periodIn = periodEntries.filter((entry) => isIncome(entry)).reduce((sum, entry) => sum + entry.amount, 0);
    const spendParts = [...new Set(periodEntries.filter((entry) => isSpend(entry)).map((entry) => entry.category))].map((name, index) => ({
        name,
        amount: periodEntries.filter((entry) => entry.category === name && isSpend(entry)).reduce((sum, entry) => sum + entry.amount, 0),
        color: sliceColors[index % sliceColors.length],
    })).filter((item) => item.amount > 0);
    const query = search.trim().toLowerCase();
    const filteredEntries = periodEntries.filter((entry) => {
        if (categoryFilter !== ALL_CATEGORIES && entry.category !== categoryFilter) return false;
        if (accountFilter !== ALL_ACCOUNTS && entry.accountId !== accountFilter) return false;
        if (feedKind === 'out' && !isSpend(entry)) return false;
        if (feedKind === 'in' && !isIncome(entry)) return false;
        if (feedKind === 'other' && !(isTransfer(entry) && entry.direction === 'out')) return false;
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

    const accountsCombined = bookNetWorth(book.accounts, book.entries);
    const worthDays = worthDayCount(worthSpan, book.entries);
    const accountsTrend = useMemo(
        () => netWorthSeries(book.accounts, book.entries, worthDays),
        [book.accounts, book.entries, worthDays],
    );
    const accountsWindowFrom = accountsWindowStart(worthDays);
    const accountsWindowPrior = bookNetWorthOnDate(book.accounts, book.entries, isoBefore(accountsWindowFrom));
    const accountsWindowDelta = accountsCombined - accountsWindowPrior;
    const filteredAccountName = book.accounts.find((item) => item.id === accountFilter)?.name;
    const viewingAccount = book.accounts.find((item) => item.id === viewingAccountId);
    const prevMonth = monthBounds(-1);
    const prevMonthOutByCategory = useMemo(() => {
        const map = new Map<string, number>();
        for (const entry of visibleEntries) {
            if (!isSpend(entry)) continue;
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
    const budget = book.monthlyBudget;
    const recurringItems = useMemo(() => detectRecurring(book.entries), [book.entries]);
    const monthKey = todayIso().slice(0, 7);
    const monthMoves = book.entries.filter((entry) => entry.date.startsWith(monthKey));
    const monthOutAll = monthMoves.filter((entry) => entry.direction === 'out').reduce((sum, entry) => sum + entry.amount, 0);
    const monthInAll = monthMoves.filter((entry) => entry.direction === 'in').reduce((sum, entry) => sum + entry.amount, 0);
    const waitingClaims = visibleEntries.filter((entry) => normalizeClaim(entry.claim) === 'waiting' && entry.direction === 'out');
    const spendByDay = useMemo(() => {
        const map = new Map<string, number>();
        for (const entry of periodEntries) {
            if (!isSpend(entry)) continue;
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
                accountName: account?.name ?? L.accountKindCash,
                shared: entry.shared,
                checked: entry.checked,
                claim: normalizeClaim(entry.claim),
                goalId: entry.goalId ?? '',
                splitOn: false,
                otherAmount: '',
                otherCategory: book.categories[0] ?? starterCategories[0],
                otherShared: false,
            });
        }
        setPanel('entry');
    }

    function saveEntry() {
        const amount = solveMoney(draft.amount);
        const title = draft.title.trim();
        if (!title || amount == null || amount <= 0) return;
        let accountId = draft.accountId;
        let accounts = book.accounts;
        if (!accountId) {
            const created: Account = { id: createId(), name: draft.accountName.trim() || L.accountKindCash, opening: 0, kind: 'cash' };
            accounts = [...accounts, created];
            accountId = created.id;
        }
        const splitting = draft.splitOn && !draft.id;
        const firstId = draft.id || createId();
        const next: Entry = {
            id: firstId,
            title,
            amount,
            direction: draft.direction,
            category: draft.category,
            date: draft.date || todayIso(),
            accountId,
            shared: draft.shared,
            checked: draft.checked,
            claim: draft.direction === 'out' ? draft.claim : 'none',
            goalId: draft.direction === 'out' && !splitting ? draft.goalId : '',
            refundOf: book.entries.find((entry) => entry.id === draft.id)?.refundOf ?? '',
            splitGroup: splitting ? firstId : (book.entries.find((entry) => entry.id === draft.id)?.splitGroup ?? ''),
        };
        let entries = draft.id ? book.entries.map((entry) => (entry.id === draft.id ? next : entry)) : [next, ...book.entries];
        if (splitting) {
            const other = solveMoney(draft.otherAmount);
            if (other != null && other > 0) {
                entries = [{
                    ...next,
                    id: createId(),
                    amount: other,
                    category: draft.otherCategory || draft.category,
                    shared: draft.otherShared,
                    goalId: '',
                    refundOf: '',
                    splitGroup: firstId,
                    claim: 'none',
                }, ...entries];
            }
        }
        setBook({ ...book, accounts, entries });
        closeEntry();
    }

    function refundEntry(source: Entry) {
        if (source.direction !== 'out' || source.refundOf) return;
        if (book.entries.some((entry) => entry.refundOf === source.id)) return;
        const back: Entry = {
            id: `refund-${source.id}`,
            title: L.refundBack.replace('{title}', source.title),
            amount: source.amount,
            direction: 'in',
            category: source.category,
            date: todayIso(),
            accountId: source.accountId,
            shared: source.shared,
            checked: true,
            claim: 'none',
            countsInBudget: false,
            refundOf: source.id,
        };
        setBook({ ...book, entries: [back, ...book.entries] });
        closeEntry();
    }

    function closeEntry() {
        const back = entryReturn.current;
        entryReturn.current = null;
        if (!back) {
            setPanel('none');
            return;
        }
        pageMotionRef.current = 'back';
        setPageMotion('back');
        setPanelState(back);
    }

    function openYear() {
        setReportYear(new Date().getFullYear());
        setPanel('year');
    }

    function openYearEntry(entry: Entry) {
        entryReturn.current = 'year';
        openEntry(entry);
    }

    function openYearFeed(kind: 'out' | 'in', month?: number, category?: string, title?: string, accountId?: string) {
        const startDate = month ? new Date(reportYear, month - 1, 1) : new Date(reportYear, 0, 1);
        const endDate = month ? new Date(reportYear, month, 0) : new Date(reportYear, 11, 31);
        setPeriodMode('range');
        setRangeFrom(isoDate(startDate));
        setRangeTo(isoDate(endDate));
        setCategoryFilter(category ?? ALL_CATEGORIES);
        setFeedKind(kind);
        setStatusFilter('all');
        setSearch(title ?? '');
        setAccountFilter(accountId ?? ALL_ACCOUNTS);
        setCalendarDay('');
        setTxView('list');
        setPanel('none');
        setPage('transactions');
    }

    function openGoal(goal?: SavingGoal) {
        setGoalId(goal?.id ?? '');
        setGoalTitle(goal?.title ?? '');
        setGoalTarget(goal ? goal.target.toFixed(2) : '');
        setGoalSaved(goal ? goal.saved.toFixed(2) : '');
        const open = openAccountList(book.accounts);
        setDepositFrom(open[0]?.id ?? '');
        setDepositTo(open[1]?.id ?? '');
        setDepositAmount('');
        setPanel('goal');
    }

    function saveGoal() {
        const title = goalTitle.trim();
        const target = Number(goalTarget);
        const saved = Number(goalSaved || '0');
        if (!title || !Number.isFinite(target) || target <= 0 || !Number.isFinite(saved) || saved < 0) return;
        const next: SavingGoal = {
            id: goalId || createId(),
            title,
            target: Math.round(target * 100) / 100,
            saved: Math.round(saved * 100) / 100,
        };
        const goals = goalId
            ? book.goals.map((item) => (item.id === goalId ? next : item))
            : [...book.goals, next];
        setBook({ ...book, goals });
        setPanel('none');
    }

    function depositTowardGoal() {
        const amount = solveMoney(depositAmount);
        const goal = book.goals.find((item) => item.id === goalId);
        const from = book.accounts.find((item) => item.id === depositFrom);
        const to = book.accounts.find((item) => item.id === depositTo);
        if (!goal || !from || !to || from.id === to.id || amount == null || amount <= 0) return;
        const stamp = createId();
        const incoming: Entry = {
            id: `transfer-${stamp}-in`,
            title: `${L.transferFrom} ${from.name}`,
            amount,
            direction: 'in',
            category: L.transferCategory,
            date: todayIso(),
            accountId: to.id,
            shared: false,
            checked: true,
            countsInBudget: false,
            claim: 'none',
        };
        const outgoing: Entry = {
            id: `transfer-${stamp}-out`,
            title: goal.title,
            amount,
            direction: 'out',
            category: L.transferCategory,
            date: todayIso(),
            accountId: from.id,
            shared: false,
            checked: true,
            countsInBudget: false,
            claim: 'none',
            goalId: goal.id,
        };
        setDepositAmount('');
        setBook({ ...book, entries: [incoming, outgoing, ...book.entries] });
    }

    function deleteGoal(id: string) {
        setBook({ ...book, goals: book.goals.filter((item) => item.id !== id) });
        setPanel('none');
    }

    function payClaim(id: string) {
        const source = book.entries.find((entry) => entry.id === id);
        if (!source || normalizeClaim(source.claim) !== 'waiting') return;
        const backId = `claim-${id}`;
        const updated = book.entries.map((entry) => (entry.id === id ? { ...entry, claim: 'done' as const } : entry));
        if (book.entries.some((entry) => entry.id === backId)) {
            setBook({ ...book, entries: updated });
            return;
        }
        const back: Entry = {
            id: backId,
            title: claimBackTitle(L.claimBack, source.title),
            amount: source.amount,
            direction: 'in',
            category: source.category,
            date: todayIso(),
            accountId: source.accountId,
            shared: source.shared,
            checked: true,
            claim: 'none',
            countsInBudget: false,
        };
        setBook({ ...book, entries: [back, ...updated] });
    }

    function removeEntry(id: string) {
        const entry = book.entries.find((item) => item.id === id);
        const removed = entry
            ? [{ entry, removedOn: todayIso() }, ...(book.removed ?? []).filter((item) => item.entry.id !== id)]
            : (book.removed ?? []);
        setBook({ ...book, entries: book.entries.filter((item) => item.id !== id), removed });
        closeEntry();
    }

    function restoreEntry(id: string) {
        const item = (book.removed ?? []).find((row) => row.entry.id === id);
        if (!item) return;
        const entries = book.entries.some((entry) => entry.id === id) ? book.entries : [item.entry, ...book.entries];
        setBook({ ...book, entries, removed: (book.removed ?? []).filter((row) => row.entry.id !== id) });
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
        setAccountArchived(account?.archived === true);
        setStatementDay(account?.statementDay ? String(account.statementDay) : '');
        setDueDay(account?.dueDay ? String(account.dueDay) : '');
        setPanel('account');
    }

    function openAccountFromEntry() {
        accountFromEntry.current = true;
        openAccount();
        setAccountKind('');
    }

    function closeAccountEditor() {
        if (accountFromEntry.current) {
            accountFromEntry.current = false;
            pageMotionRef.current = 'back';
            setPageMotion('back');
            setPanelState('entry');
            return;
        }
        setPanel(viewingAccountId ? 'accountDetail' : 'none');
    }

    function saveAccount(archived = accountArchived) {
        const name = accountName.trim();
        const opening = Number(accountOpening);
        if (!name || !accountKind || !Number.isFinite(opening)) return;
        const kind = accountKind;
        const day = (raw: string) => {
            const value = Math.round(Number(raw));
            return Number.isFinite(value) && value >= 1 && value <= 28 ? value : 0;
        };
        const next = {
            name,
            opening,
            kind,
            archived,
            statementDay: kind === 'card' ? day(statementDay) : 0,
            dueDay: kind === 'card' ? day(dueDay) : 0,
        };
        const createdId = editingAccountId || createId();
        const accounts = editingAccountId
            ? book.accounts.map((item) => (item.id === editingAccountId ? { ...item, ...next } : item))
            : [...book.accounts, { id: createdId, ...next }];
        setBook({ ...book, accounts });
        if (!editingAccountId && accountFromEntry.current) {
            setDraft((current) => ({ ...current, accountId: createdId, accountName: name }));
        }
        closeAccountEditor();
    }

    function removeAccount(id: string) {
        const gone = new Set(book.entries.filter((entry) => entry.accountId === id).map((entry) => entry.id));
        for (const entryId of [...gone]) {
            const mate = transferMate(entryId);
            if (mate) gone.add(mate);
        }
        const taken = book.entries.filter((entry) => gone.has(entry.id));
        const removed = [
            ...taken.map((entry) => ({ entry, removedOn: todayIso() })),
            ...(book.removed ?? []).filter((item) => !gone.has(item.entry.id)),
        ];
        setBook({
            ...book,
            accounts: book.accounts.filter((item) => item.id !== id),
            entries: book.entries.filter((entry) => !gone.has(entry.id)),
            removed,
        });
        setViewingAccountId('');
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
        wipeBook();
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

    function openStatsFeed(from: string, to: string, category: string, title: string) {
        const today = todayIso();
        setPeriodMode('range');
        setRangeFrom(from);
        setRangeTo(to > today ? today : to);
        setCategoryFilter(category || ALL_CATEGORIES);
        setSearch(title);
        setFeedKind(statsKind);
        setStatusFilter('all');
        setAccountFilter(ALL_ACCOUNTS);
        setCalendarDay('');
        setTxView('list');
        setListAll(false);
        setPanel('none');
        setPage('transactions');
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
        setFeedKind('');
        setListAll(false);
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
        const open = openAccountList(book.accounts);
        setTransferFrom(open[0]?.id ?? '');
        setTransferTo(open[1]?.id ?? open[0]?.id ?? '');
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
            countsInBudget: false,
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
            countsInBudget: false,
        };
        setBook({ ...book, categories, entries: [inEntry, outEntry, ...book.entries] });
        setPanel('none');
    }

    function applyImportedBook(parsed: Partial<Book> | null) {
        if (!parsed || !Array.isArray(parsed.entries) || !Array.isArray(parsed.accounts)) {
            flashExportNote(L.importFail);
            return;
        }
        const stored = parsed as Partial<Book> & { holdings?: unknown };
        const { holdings: _ignoredHoldings, ...clean } = stored;
        setBook(withoutSample({
            ...emptyBook(),
            ...clean,
            categories: parsed.categories?.length ? parsed.categories : [...starterCategories],
            accounts: parsed.accounts.map((account) => ({
                id: account.id,
                name: account.name,
                opening: account.opening,
                kind: normalizeAccountKind(account.kind),
            })),
            entries: parsed.entries.map((entry) => ({ ...entry, claim: normalizeClaim(entry.claim) })),
            goals: parseGoals(parsed.goals),
            locale: parsed.locale === 'zh' ? 'zh' : 'en',
            localeChosen: true,
            hideAmounts: parsed.hideAmounts === true,
            currency: normalizeCurrency(parsed.currency),
            monthlyBudget: typeof parsed.monthlyBudget === 'number' && parsed.monthlyBudget > 0 ? parsed.monthlyBudget : null,
            categoryBudgets: parsed.categoryBudgets && typeof parsed.categoryBudgets === 'object' ? parsed.categoryBudgets : {},
            templates: dedupeTemplates(Array.isArray(parsed.templates) ? parsed.templates : []),
            sampleCleared: true,
        }));
        flashExportNote(L.importDone);
    }

    function stageImport(text: string) {
        try {
            const parsed = JSON.parse(text) as Partial<Book>;
            if (!parsed || !Array.isArray(parsed.entries) || !Array.isArray(parsed.accounts)) {
                flashExportNote(L.importFail);
                return;
            }
            setPendingImport(parsed);
            setImportAsk(true);
        } catch {
            flashExportNote(L.importFail);
        }
    }

    function importBookFile(file: File) {
        const reader = new FileReader();
        reader.onload = () => stageImport(String(reader.result));
        reader.readAsText(file);
    }

    function confirmImportBook() {
        setImportAsk(false);
        if (pendingImport) applyImportedBook(pendingImport);
        setPendingImport(null);
    }

    function exportBookFile() {
        const blob = new Blob([JSON.stringify(book)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'SpendLogBook.json';
        link.click();
        URL.revokeObjectURL(url);
        flashExportNote(L.exportDone);
    }

    function wipeBook() {
        setClearAsk(false);
        setBook({
            ...book,
            sampleCleared: true,
            accounts: [],
            entries: [],
            goals: [],
            removed: [],
            templates: [],
            monthlyBudget: null,
            categoryBudgets: {},
        });
        flashExportNote(L.clearBookDone);
    }

    function confirmClearBook() {
        wipeBook();
    }

    function flashExportNote(text: string) {
        setExportNote(text);
        window.setTimeout(() => {
            setExportNote((current) => (current === text ? '' : current));
        }, 2000);
    }

    function openMonthAccounts(accountId?: string) {
        const span = monthBounds(0);
        setAccountFilter(accountId ?? ALL_ACCOUNTS);
        setPeriodMode('range');
        setRangeFrom(span.start);
        setRangeTo(span.end > todayIso() ? todayIso() : span.end);
        setCategoryFilter(ALL_CATEGORIES);
        setFeedKind('');
        setStatusFilter('all');
        setSearch('');
        setCalendarDay('');
        setTxView('list');
        setListAll(true);
        setPanel('none');
        setPage('transactions');
    }

    function openAccountFeed(accountId: string, from?: string, to?: string) {
        setPanel('none');
        setViewingAccountId('');
        setAccountFilter(accountId);
        setPeriodMode('range');
        setRangeFrom(from ?? accountsWindowStart(30));
        setRangeTo(to ?? todayIso());
        setCategoryFilter(ALL_CATEGORIES);
        setFeedKind('');
        setStatusFilter('all');
        setSearch('');
        setListAll(true);
        setPage('transactions');
    }

    function goBack() {
        if (panel === 'entry') {
            closeEntry();
            return;
        }
        if (panel === 'account') {
            closeAccountEditor();
            return;
        }
        if (panel === 'accountDetail') {
            setViewingAccountId('');
            setPanel('none');
            return;
        }
        if (panel !== 'none') setPanel('none');
    }

    function edgeSwipe(event: React.PointerEvent<HTMLDivElement>) {
        if (panel === 'none' || event.button !== 0) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX - bounds.left > 28) return;
        const startX = event.clientX;
        const startY = event.clientY;
        const move = (next: PointerEvent) => {
            const dx = next.clientX - startX;
            const dy = next.clientY - startY;
            if (dx > 72 && dx > Math.abs(dy)) {
                window.removeEventListener('pointermove', move);
                window.removeEventListener('pointerup', up);
                goBack();
            }
        };
        const up = () => {
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up);
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
    }

    function setPanel(next: Panel) {
        const motion = next === 'none' ? 'back' : 'forward';
        pageMotionRef.current = motion;
        setPageMotion(motion);
        setPanelState(next);
    }

    function setPage(id: PageId) {
        if (pageMotionRef.current !== 'back') {
            pageMotionRef.current = 'fade';
            setPageMotion('fade');
        }
        setPageHash(id);
    }

    const showFab = panel === 'none' && (active === 'dashboard' || active === 'transactions');

    return (
        <AmountsHidden.Provider value={book.hideAmounts === true}>
        <main className="ledger">
            <section className="ledger-phone">
                {opening && (
                    <div className={`ledger-opening${openingOut ? ' is-out' : ''}`}>
                        <div className="ledger-opening-mark" aria-hidden>
                            <img src={brandMark} alt="" />
                        </div>
                        <p className="ledger-opening-name">SpendLogBook</p>
                        <p className="ledger-opening-line">{L.splashLine}</p>
                        <span className="ledger-opening-spin" aria-hidden />
                    </div>
                )}
                <div className="ledger-stage" onPointerDown={edgeSwipe}>
                <div key={`${active}-${panel}`} className={`ledger-body is-${pageMotion}${showFab ? '' : ' is-rest'}${panel === 'privacy' ? ' is-privacy' : ''}`}>
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
                            onRefund={() => {
                                const source = book.entries.find((entry) => entry.id === draft.id);
                                if (source) refundEntry(source);
                            }}
                            onBack={closeEntry}
                            onAddAccount={openAccountFromEntry}
                        />
                    )}
                    {panel === 'budget' && (
                        <>
                            <SubpageHead L={L} title={L.monthlyBudget} onBack={() => setPanel('none')} />
                            <p className="ledger-panel-note">{L.budgetHint}</p>
                            <label className="ledger-label" htmlFor="ledger-budget">{L.monthlyBudget}</label>
                            <input id="ledger-budget" className="ledger-field ledger-field-budget" inputMode="decimal" value={budgetInput} placeholder={defaultMonthlyBudgetHint()} onChange={(event) => setBudgetInput(moneyTyping(event.target.value))} />
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
                                        onChange={(event) => setCategoryBudgetDraft({ ...categoryBudgetDraft, [name]: moneyTyping(event.target.value) })}
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
                            <ChoiceMenu id="transfer-from" label={L.transferFrom} value={transferFrom} options={openAccountList(book.accounts, transferFrom).map((account) => ({ value: account.id, label: account.name }))} onChange={setTransferFrom} />
                            <label className="ledger-label" htmlFor="transfer-to">{L.transferTo}</label>
                            <ChoiceMenu id="transfer-to" label={L.transferTo} value={transferTo} options={openAccountList(book.accounts, transferTo).map((account) => ({ value: account.id, label: account.name }))} onChange={setTransferTo} />
                            <label className="ledger-label" htmlFor="transfer-amount">{L.amount}</label>
                            <input id="transfer-amount" className="ledger-field" inputMode="decimal" value={transferAmount} onChange={(event) => setTransferAmount(moneyTyping(event.target.value))} />
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
                            <input id="account-opening" className="ledger-field" inputMode="decimal" value={accountOpening} placeholder="0.00" onChange={(event) => setAccountOpening(moneyTyping(event.target.value))} />
                            <Fold open={accountKind === 'card'}>
                                <label className="ledger-label" htmlFor="account-statement">{L.cardStatementDay}</label>
                                <input id="account-statement" className="ledger-field" inputMode="numeric" value={statementDay} placeholder="1–28" onChange={(event) => setStatementDay(event.target.value)} />
                                <label className="ledger-label" htmlFor="account-due">{L.cardDueDay}</label>
                                <input id="account-due" className="ledger-field" inputMode="numeric" value={dueDay} placeholder="1–28" onChange={(event) => setDueDay(event.target.value)} />
                            </Fold>
                            <button type="button" className="ledger-pill" onClick={() => saveAccount()} disabled={!accountKind || !accountName.trim() || accountOpening.trim() === '' || Number.isNaN(Number(accountOpening))}>{L.save}</button>
                            {editingAccountId && (
                                <button type="button" className="ledger-pill ledger-pill-secondary" onClick={() => saveAccount(!accountArchived)}>{accountArchived ? L.restoreAccount : L.archiveAccount}</button>
                            )}
                            {editingAccountId && <button type="button" className="ledger-text-button" onClick={() => removeAccount(editingAccountId)}>{L.deleteAccount}</button>}
                        </>
                    )}
                    {panel === 'removed' && (
                        <>
                            <SubpageHead L={L} title={L.removedTitle} onBack={() => setPanel('none')} />
                            {(book.removed ?? []).length === 0 ? (
                                <p className="ledger-empty">{L.removedEmpty}</p>
                            ) : (
                                <ul className="ledger-tx-list">
                                    {(book.removed ?? []).map((item) => (
                                        <li key={item.entry.id} className="ledger-removed-row">
                                            <div>
                                                <b>{item.entry.title}</b>
                                                <p className="ledger-account-meta">{item.removedOn}</p>
                                            </div>
                                            <div className="ledger-removed-side">
                                                <MoneyAmount value={item.entry.direction === 'out' ? -item.entry.amount : item.entry.amount} mark={mark} size="sm" signed />
                                                <button type="button" className="ledger-pill" onClick={() => restoreEntry(item.entry.id)}>{L.removedRestore}</button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </>
                    )}
                    {panel === 'worth' && (
                        <>
                            <SubpageHead L={L} title={L.netAssets} onBack={() => setPanel('none')} />
                            <WorthSummary
                                L={L}
                                mark={mark}
                                worth={accountsCombined}
                                delta={accountsWindowDelta}
                                prior={accountsWindowPrior}
                                span={worthSpan}
                                onSpan={setWorthSpan}
                            />
                            <div className="ledger-worth-frame">
                                <WorthCurve points={accountsTrend} label={L.accountsTrend} />
                            </div>
                        </>
                    )}
                    {panel === 'accountDetail' && viewingAccount && (
                        <AccountDetailView
                            L={L}
                            locale={locale}
                            account={viewingAccount}
                            entries={book.entries}
                            mark={mark}
                            onBack={() => { setViewingAccountId(''); setPanel('none'); }}
                            onEdit={() => openAccount(viewingAccount)}
                            onActivity={(from, to) => openAccountFeed(viewingAccount.id, from, to)}
                        />
                    )}
                    {panel === 'profile' && (
                        <div className="ledger-profile-page">
                            <SubpageHead L={L} title={L.profileTitle} onBack={() => setPanel('none')} />
                            <p className="ledger-label">{L.avatar}</p>
                            <div className="ledger-avatar" aria-hidden>{avatarMark(draftGender)}</div>
                            <label className="ledger-label" htmlFor="ledger-nickname">{L.nickname}</label>
                            <input id="ledger-nickname" className="ledger-field" value={draftName} maxLength={12} placeholder={L.profileHint} onChange={(event) => setDraftName(event.target.value)} />
                            <p className="ledger-label">{L.gender}</p>
                            <div className="ledger-choice-row ledger-choice-row--3" role="tablist" aria-label={L.gender}>
                                {(['female', 'male', 'secret'] as const).map((item) => (
                                    <button key={item} type="button" role="tab" aria-selected={draftGender === item} className={draftGender === item ? 'is-on' : ''} onClick={() => setDraftGender(item)}>{genderLabel(item, L)}</button>
                                ))}
                            </div>
                            <button type="button" className="ledger-pill" onClick={saveProfile} disabled={!draftName.trim()}>{L.save}</button>
                        </div>
                    )}
                    {panel === 'export' && (
                        <>
                            <SubpageHead L={L} title={L.dataManage} onBack={() => setPanel('none')} />
                            <div className="ledger-export-stats">
                                <button type="button" onClick={() => goTab('transactions')}>
                                    <b>{book.entries.length}</b>
                                    <span>{L.transactions}</span>
                                </button>
                                <div className="ledger-export-rule" role="presentation" />
                                <button type="button" onClick={() => goTab('accounts')}>
                                    <b>{book.accounts.length}</b>
                                    <span>{L.tabAccounts}</span>
                                </button>
                            </div>
                            <button type="button" className="ledger-export-file" onClick={exportBookFile}>
                                <span className="ledger-export-mark" aria-hidden="true">↑</span>
                                <span>
                                    <b>{L.exportBackup}</b>
                                    <p>{L.dataExportNote}</p>
                                </span>
                            </button>
                        </>
                    )}
                    {panel === 'privacy' && (
                        <div className="ledger-privacy">
                            <SubpageHead L={L} title={L.privacy} onBack={() => setPanel('none')} />
                            <iframe className="ledger-privacy-frame" title={L.privacy} src="/prototypes/ledger/privacy.html" />
                        </div>
                    )}
                    {panel === 'language' && (
                        <>
                            <SubpageHead L={L} title={L.language} onBack={() => setPanel('none')} />
                            <div className="ledger-pick-card">
                                {localeChoices.map((item) => (
                                    <button key={item.id} type="button" className={locale === item.id ? 'is-on' : ''} onClick={() => setBook({ ...book, locale: item.id, localeChosen: true })}>
                                        <span className="ledger-pick-code">{item.title}</span>
                                        {locale === item.id && <span className="ledger-pick-check" aria-hidden="true">✓</span>}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                    {panel === 'currency' && (
                        <>
                            <SubpageHead L={L} title={L.currency} onBack={() => setPanel('none')} />
                            <div className="ledger-pick-card">
                                {currencyOptions.map((item) => (
                                    <button key={item} type="button" className={book.currency === item ? 'is-on' : ''} onClick={() => setBook({ ...book, currency: item })}>
                                        <span className="ledger-pick-code">{item}</span>
                                        <span className="ledger-pick-mark">{currencyMark[item]}</span>
                                        {book.currency === item && <span className="ledger-pick-check" aria-hidden="true">✓</span>}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                    {panel === 'categories' && (
                        <>
                            <SubpageHead L={L} title={L.categories} onBack={() => setPanel('none')} />
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
                        </>
                    )}
                    {panel === 'year' && (
                        <YearReportPanel
                            L={L}
                            year={reportYear}
                            entries={visibleEntries}
                            ledgerEntries={book.entries}
                            accounts={book.accounts}
                            mark={mark}
                            onPrev={() => setReportYear((value) => value - 1)}
                            onNext={() => setReportYear((value) => Math.min(value + 1, new Date().getFullYear()))}
                            nextDisabled={reportYear >= new Date().getFullYear()}
                            onOpen={openYearFeed}
                            onEntry={openYearEntry}
                            onBack={() => setPanel('none')}
                        />
                    )}
                    {panel === 'goals' && (
                        <>
                            <SubpageHead L={L} title={L.savingGoals} onBack={() => setPanel('none')} />
                            <button type="button" className="ledger-pill" onClick={() => openGoal()}>{L.add}</button>
                            {book.goals.map((goal) => {
                                const kept = goalKept(goal, book.entries);
                                const ratio = goal.target > 0 ? Math.min(100, (kept / goal.target) * 100) : 0;
                                return (
                                    <button key={goal.id} type="button" className="ledger-goal-row" onClick={() => openGoal(goal)}>
                                        <span className="ledger-goal-meta">
                                            <b>{goal.title}</b>
                                            <MoneyAmount value={kept} mark={mark} size="sm" />
                                            <span className="ledger-goal-slash">/</span>
                                            <span className="ledger-goal-cap"><MoneyAmount value={goal.target} mark={mark} size="sm" /></span>
                                        </span>
                                        <span className="ledger-budget-track" aria-hidden="true">
                                            <span className="ledger-budget-fill" style={{ width: `${ratio}%` }} />
                                        </span>
                                    </button>
                                );
                            })}
                        </>
                    )}
                    {panel === 'goal' && (
                        <>
                            <SubpageHead L={L} title={L.savingGoals} onBack={() => setPanel('none')} />
                            <label className="ledger-label" htmlFor="goal-name">{L.name}</label>
                            <input id="goal-name" className="ledger-field" value={goalTitle} placeholder={L.namePh} onChange={(event) => setGoalTitle(event.target.value)} />
                            <label className="ledger-label" htmlFor="goal-target">{L.savingTarget}</label>
                            <input id="goal-target" className="ledger-field" inputMode="decimal" value={goalTarget} placeholder="0.00" onChange={(event) => setGoalTarget(moneyTyping(event.target.value))} />
                            <label className="ledger-label" htmlFor="goal-saved">{L.savingSaved}</label>
                            <input id="goal-saved" className="ledger-field" inputMode="decimal" value={goalSaved} placeholder="0.00" onChange={(event) => setGoalSaved(moneyTyping(event.target.value))} />
                            <button type="button" className="ledger-pill" onClick={saveGoal} disabled={!goalTitle.trim() || !(Number(goalTarget) > 0)}>{L.save}</button>
                            {goalId && openAccountList(book.accounts).length >= 2 && (
                                <section className="ledger-card">
                                    <h2>{L.goalDeposit}</h2>
                                    <p className="ledger-panel-note">{L.goalFrom} / {L.goalTo}</p>
                                    <label className="ledger-label" htmlFor="deposit-amount">{L.amount}</label>
                                    <input id="deposit-amount" className="ledger-field" inputMode="decimal" value={depositAmount} placeholder="0.00" onChange={(event) => setDepositAmount(moneyTyping(event.target.value))} />
                                    <label className="ledger-label" htmlFor="deposit-from">{L.goalFrom}</label>
                                    <ChoiceMenu id="deposit-from" label={L.goalFrom} value={depositFrom} options={openAccountList(book.accounts).map((account) => ({ value: account.id, label: account.name }))} onChange={setDepositFrom} />
                                    <label className="ledger-label" htmlFor="deposit-to">{L.goalTo}</label>
                                    <ChoiceMenu id="deposit-to" label={L.goalTo} value={depositTo} options={openAccountList(book.accounts).map((account) => ({ value: account.id, label: account.name }))} onChange={setDepositTo} />
                                    <button type="button" className="ledger-pill ledger-pill-secondary" onClick={depositTowardGoal} disabled={!(solveMoney(depositAmount) != null && solveMoney(depositAmount)! > 0) || !depositFrom || depositFrom === depositTo}>{L.goalDeposit}</button>
                                </section>
                            )}
                            {goalId && <button type="button" className="ledger-text-button" onClick={() => deleteGoal(goalId)}>{L.deleteEntry}</button>}
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
                            onScope={(next) => { setListAll(false); setScope(next); }}
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
                            <BookStats
                                L={L}
                                entries={visibleEntries}
                                mark={mark}
                                annual={statsAnnual}
                                kind={statsKind}
                                month={statsMonth}
                                onAnnual={setStatsAnnual}
                                onKind={setStatsKind}
                                onMonth={setStatsMonth}
                                onOpen={openStatsFeed}
                            />
                            {waitingClaims.length > 0 && (
                                <section className="ledger-panel">
                                    <div className="ledger-panel-head">
                                        <h2>{`${L.claimTitle} · ${waitingClaims.length}`}</h2>
                                    </div>
                                    {waitingClaims.map((entry) => (
                                        <div key={entry.id} className="ledger-claim-row">
                                            <button type="button" className="ledger-claim-main" onClick={() => openEntry(entry)}>
                                                <b>{entry.title}</b>
                                                <span>{entry.category}</span>
                                            </button>
                                            <MoneyAmount value={entry.amount} mark={mark} size="sm" />
                                            <button type="button" className="ledger-claim-paid" onClick={() => payClaim(entry.id)}>{L.claimPaid}</button>
                                        </div>
                                    ))}
                                </section>
                            )}
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
                                    {feedKind && (
                                        <button type="button" className="is-on" onClick={() => setFeedKind('')}>
                                            {feedKind === 'in' ? L.statsIn : feedKind === 'other' ? L.statsOther : L.statsOut} ×
                                        </button>
                                    )}
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
                            <Fold open={txView === 'calendar'}>
                                <SpendCalendar
                                    L={L}
                                    locale={locale}
                                    bounds={bounds}
                                    spendByDay={spendByDay}
                                    selected={calendarDay || bounds.end}
                                    onSelect={(day) => { setCalendarDay(day); chooseDayRange(day); }}
                                />
                            </Fold>
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
                                <h1>{L.accounts}<span className="ledger-title-count">({book.accounts.length})</span></h1>
                            </div>
                            {book.accounts.length === 0 ? (
                                <p className="ledger-empty">{L.accountsEmpty}</p>
                            ) : (
                                <>
                                    <WorthSummary
                                        L={L}
                                        mark={mark}
                                        worth={accountsCombined}
                                        delta={accountsWindowDelta}
                                        prior={accountsWindowPrior}
                                        span={worthSpan}
                                        onSpan={setWorthSpan}
                                        onOpen={() => setPanel('worth')}
                                    />
                                    {monthMoves.length > 0 && (
                                        <section className="ledger-account-flow">
                                            <button type="button" className="ledger-account-flow-head" onClick={() => openMonthAccounts()}>
                                                <span className="ledger-account-flow-title">
                                                    {L.accountMonthFlow}
                                                    <span className="ledger-chevron" aria-hidden="true">›</span>
                                                </span>
                                                <span className="ledger-account-flow-gutter" aria-hidden="true" />
                                                <span className="is-out">
                                                    <b>{L.expense}</b>
                                                    <MoneyAmount value={monthOutAll} mark={mark} size="sm" />
                                                </span>
                                                <span>
                                                    <b>{L.income}</b>
                                                    <MoneyAmount value={monthInAll} mark={mark} size="sm" />
                                                </span>
                                                <span>
                                                    <b>{L.accountNet}</b>
                                                    <MoneyAmount value={monthInAll - monthOutAll} mark={mark} size="sm" signed />
                                                </span>
                                            </button>
                                            {book.accounts.filter((account) => account.archived !== true && monthMoves.some((entry) => entry.accountId === account.id)).map((account) => {
                                                const mine = monthMoves.filter((entry) => entry.accountId === account.id);
                                                const spent = mine.filter((entry) => entry.direction === 'out').reduce((sum, entry) => sum + entry.amount, 0);
                                                const income = mine.filter((entry) => entry.direction === 'in').reduce((sum, entry) => sum + entry.amount, 0);
                                                return (
                                                    <button key={account.id} type="button" className="ledger-account-flow-row" aria-label={account.name} onClick={() => openMonthAccounts(account.id)}>
                                                        <span className="ledger-year-mark">{account.name.slice(0, 1)}</span>
                                                        <span className="is-out"><MoneyAmount value={spent} mark={mark} size="sm" /></span>
                                                        <span><MoneyAmount value={income} mark={mark} size="sm" /></span>
                                                        <span><MoneyAmount value={income - spent} mark={mark} size="sm" signed /></span>
                                                    </button>
                                                );
                                            })}
                                        </section>
                                    )}
                                    {accountKindOrder.map((kind) => {
                                        const group = book.accounts.filter((account) => normalizeAccountKind(account.kind) === kind && account.archived !== true);
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
                                    {book.accounts.some((account) => account.archived) && (
                                        <section className="ledger-account-group">
                                            <div className="ledger-account-group-head">
                                                <h2>{L.archivedTitle}</h2>
                                            </div>
                                            {book.accounts.filter((account) => account.archived).map((account, index) => (
                                                <button key={account.id} type="button" className="ledger-account-row" onClick={() => openAccountDetail(account)}>
                                                    <div className="ledger-account-left">
                                                        <div className="ledger-tx-icon" style={{ background: sliceColors[index % sliceColors.length] + '33' }}>{account.name.slice(0, 1)}</div>
                                                        <div className="ledger-account-copy">
                                                            <b>{account.name}</b>
                                                            <p className="ledger-account-meta">{accountKindLabel(L, normalizeAccountKind(account.kind))}</p>
                                                        </div>
                                                    </div>
                                                    <MoneyAmount value={accountTotal(account, book.entries)} mark={mark} size="md" />
                                                </button>
                                            ))}
                                        </section>
                                    )}
                                </>
                            )}
                            {book.accounts.length >= 2 && (
                                <button type="button" className="ledger-pill ledger-pill-secondary" onClick={openTransferPanel}>{L.transfer}</button>
                            )}
                            <button type="button" className="ledger-pill" onClick={() => openAccount()}>{L.addAccount}</button>
                            <SampleNote L={L} book={book} onClear={clearSample} />
                        </>
                    )}

                    {panel === 'none' && active === 'me' && (
                        <>
                            <h1>{L.me}</h1>
                            <button type="button" className="ledger-card ledger-profile" onClick={openProfile}>
                                <div className="ledger-mark">{avatarMark(book.gender)}</div>
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
                                <h2 className="ledger-settings-kicker">{L.meLedger}</h2>
                                <SettingsLink title={L.yearReport} onClick={openYear} />
                                <div className="ledger-settings-divider" role="presentation" />
                                <SettingsLink title={L.monthlyBudget} value={book.hideAmounts ? '***' : (budget != null && budget > 0 ? money(budget, mark) : L.budgetUnset)} onClick={openBudgetPanel} />
                                <div className="ledger-settings-divider" role="presentation" />
                                <SettingsLink title={L.savingGoals} value={book.goals.length > 0 ? String(book.goals.length) : undefined} onClick={() => setPanel('goals')} />
                                <div className="ledger-settings-divider" role="presentation" />
                                <SettingsLink title={L.categories} value={String(book.categories.length)} onClick={() => setPanel('categories')} />
                            </section>
                            <section className="ledger-card ledger-settings">
                                <h2 className="ledger-settings-kicker">{L.meDisplay}</h2>
                                <button type="button" className="ledger-row-link" onClick={() => setBook({ ...book, hideAmounts: !book.hideAmounts })}>
                                    <span>{L.hideAmounts}</span>
                                    <span className="ledger-row-value">{book.hideAmounts ? L.hideAmountsOn : L.hideAmountsOff}</span>
                                </button>
                                <div className="ledger-settings-divider" role="presentation" />
                                <SettingsLink title={L.language} value={localeChoices.find((item) => item.id === locale)?.title ?? locale} onClick={() => setPanel('language')} />
                                <div className="ledger-settings-divider" role="presentation" />
                                <SettingsLink title={L.currency} value={`${book.currency}  ${mark}`} onClick={() => setPanel('currency')} />
                            </section>
                            <section className="ledger-card ledger-settings">
                                <h2 className="ledger-settings-kicker">{L.meData}</h2>
                                <SettingsLink title={L.exportData} onClick={() => setPanel('export')} />
                                <div className="ledger-settings-divider" role="presentation" />
                                <SettingsLink title={L.importData} onClick={() => importFileRef.current?.click()} />
                                <div className="ledger-settings-divider" role="presentation" />
                                <SettingsLink title={L.removedTitle} value={(book.removed ?? []).length > 0 ? String(book.removed?.length) : undefined} onClick={() => setPanel('removed')} />
                                <div className="ledger-settings-divider" role="presentation" />
                                <SettingsLink title={L.clearBook} danger onClick={() => setClearAsk(true)} />
                            </section>
                            <section className="ledger-card ledger-settings">
                                <SettingsLink title={L.privacy} onClick={() => setPanel('privacy')} />
                            </section>
                            <input
                                ref={importFileRef}
                                type="file"
                                accept="application/json,.json"
                                hidden
                                onChange={(event) => {
                                    const file = event.target.files?.[0];
                                    if (file) importBookFile(file);
                                    event.target.value = '';
                                }}
                            />
                        </>
                    )}
                </div>

                {showFab && (
                    <button type="button" className="ledger-fab" aria-label={L.fabLabel} onClick={() => openEntry()}>
                        <svg viewBox="0 0 32 32" aria-hidden="true">
                            <rect x="4" y="18.2" width="24" height="6.2" rx="3" fill="#EC82A2" />
                            <path fill="#fff" d="M6.6 11Q6.6 8.6 9 8.6L15.1 9.2V21.4Q11 22.2 6.6 20.6Z" />
                            <path fill="#fff" d="M16.9 9.2L23 8.6Q25.4 8.6 25.4 11V20.6Q21 22.2 16.9 21.4Z" />
                            <path fill="#F28AAB" d="M14.45 8.9h3.1V14.2L16 12.55l-1.55 1.65Z" />
                            <path d="M18.6 18.8C20.4 18.2 21.8 15 23.15 12.35" fill="none" stroke="#E85D75" strokeWidth="1.7" strokeLinecap="round" />
                            <circle cx="23.15" cy="11.35" r="1.45" fill="#E85D75" />
                        </svg>
                    </button>
                )}
                </div>

                {exportNote && <p className="ledger-toast" role="status">{exportNote}</p>}

                {importAsk && (
                    <div className="ledger-modal-backdrop" role="presentation" onClick={() => setImportAsk(false)}>
                        <div className="ledger-modal" role="dialog" aria-modal="true" aria-labelledby="ledger-import-title" onClick={(event) => event.stopPropagation()}>
                            <h2 id="ledger-import-title">{L.importData}</h2>
                            <p>{L.importConfirm}</p>
                            <div className="ledger-modal-actions">
                                <button type="button" onClick={() => setImportAsk(false)}>{L.cancel}</button>
                                <button type="button" className="is-danger" onClick={confirmImportBook}>{L.importData}</button>
                            </div>
                        </div>
                    </div>
                )}

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

                {panel === 'none' && (
                    <nav className="ledger-tabs" aria-label={L.mainNav}>
                        {tabs.map((tab) => (
                            <button key={tab.id} type="button" className={active === tab.id ? 'is-on' : ''} aria-current={active === tab.id ? 'page' : undefined} onClick={() => goTab(tab.id)}>
                                {tab.icon}
                                <span>{tab.title}</span>
                            </button>
                        ))}
                    </nav>
                )}
            </section>
        </main>
        </AmountsHidden.Provider>
    );
}

function statsKindName(L: Copy, kind: StatsKind) {
    if (kind === 'in') return L.statsIn;
    if (kind === 'other') return L.statsOther;
    return L.statsOut;
}

function BookStats({
    L,
    entries,
    mark,
    annual,
    kind,
    month,
    onAnnual,
    onKind,
    onMonth,
    onOpen,
}: {
    L: Copy;
    entries: Entry[];
    mark: string;
    annual: boolean;
    kind: StatsKind;
    month: string;
    onAnnual: (annual: boolean) => void;
    onKind: (kind: StatsKind) => void;
    onMonth: (month: string) => void;
    onOpen: (from: string, to: string, category: string, title: string) => void;
}) {
    const today = todayIso();
    const current = today.slice(0, 7);
    const shown = month > current ? current : month;
    const year = Number(shown.slice(0, 4));
    const kindName = statsKindName(L, kind);
    const bars = annual
        ? Array.from({ length: 12 }, (_, index) => `${year}-${`${index + 1}`.padStart(2, '0')}`)
        : Array.from({ length: 6 }, (_, index) => shiftMonthKey(shown, index - 5));
    const inWindow = entries.filter((entry) => {
        if (!matchesStatsKind(entry, kind) || entry.date > today) return false;
        return annual ? entry.date.startsWith(String(year)) : entry.date.startsWith(shown);
    });
    const total = inWindow.reduce((sum, entry) => sum + entry.amount, 0);
    const amounts = bars.map((key) => entries.reduce((sum, entry) => (
        matchesStatsKind(entry, kind) && entry.date.startsWith(key) && entry.date <= today ? sum + entry.amount : sum
    ), 0));
    const peak = Math.max(...amounts, 0);
    const when = annual
        ? (year === Number(current.slice(0, 4)) ? L.statsThisYear : String(year))
        : (shown === current ? L.statsThisMonth : shown.replace('-', '/'));
    const mix = groupStats(inWindow, 'category');
    const rank = groupStats(inWindow, 'title').slice(0, 10);
    const span = annual ? { start: `${year}-01-01`, end: `${year}-12-31` } : monthSpan(shown);
    const floor = shiftMonthKey(current, annual ? -60 : -36);
    const next = shiftMonthKey(shown, annual ? 12 : 1);
    const prev = shiftMonthKey(shown, annual ? -12 : -1);
    const canNext = next <= current && next !== shown;
    const canPrev = prev >= floor.slice(0, annual ? 4 : 7) && prev !== shown;

    function step(delta: number) {
        const moved = shiftMonthKey(shown, annual ? delta * 12 : delta);
        onMonth(moved > current ? current : moved);
    }

    return (
        <section className="ledger-stats">
            <div className="ledger-stats-tabs" role="tablist">
                <button type="button" role="tab" aria-selected={!annual} className={annual ? '' : 'is-on'} onClick={() => onAnnual(false)}>{L.statsMonthly}</button>
                <button type="button" role="tab" aria-selected={annual} className={annual ? 'is-on' : ''} onClick={() => onAnnual(true)}>{L.statsAnnual}</button>
            </div>
            <div className="ledger-stats-tools">
                <div className="ledger-stats-step">
                    <button type="button" aria-label={L.statsPrev} disabled={!canPrev} onClick={() => step(-1)}>‹</button>
                    <span>{annual ? String(year) : shown.replace('-', '/')}</span>
                    <button type="button" aria-label={L.statsNext} disabled={!canNext} onClick={() => step(1)}>›</button>
                </div>
                <div className="ledger-stats-kinds" role="tablist">
                    {(['out', 'in', 'other'] as const).map((item) => (
                        <button key={item} type="button" role="tab" aria-selected={kind === item} className={kind === item ? 'is-on' : ''} onClick={() => onKind(item)}>{statsKindName(L, item)}</button>
                    ))}
                </div>
            </div>
            <button type="button" className="ledger-stats-total" onClick={() => onOpen(span.start, span.end, '', '')}>
                <span>{fillCopy(L.statsCount, { count: String(inWindow.length), kind: kindName })}</span>
                <MoneyAmount value={total} mark={mark} size="hero" />
            </button>
            <h2>{fillCopy(annual ? L.statsCompareYear : L.statsCompareMonth, { kind: kindName })}</h2>
            <div className="ledger-stats-bars">
                {bars.map((key, index) => {
                    const amount = amounts[index];
                    const future = key > current;
                    const selected = !annual && key === shown;
                    const height = peak > 0 ? Math.max(4, (amount / peak) * 108) : 4;
                    return (
                        <button
                            key={key}
                            type="button"
                            className={selected ? 'is-on' : ''}
                            disabled={future}
                            onClick={() => { onMonth(key); onAnnual(false); }}
                        >
                            {amount > 0 ? <MoneyAmount value={amount} mark={mark} size="sm" /> : <span className="ledger-stats-gap" />}
                            <i style={{ height }} />
                            <b>{Number(key.slice(5))}</b>
                        </button>
                    );
                })}
            </div>
            <h2>{fillCopy(L.statsCompose, { when, kind: kindName })}</h2>
            {mix.length === 0 ? <p className="ledger-panel-note">{L.statsEmpty}</p> : mix.map((item) => (
                <button key={item.name} type="button" className="ledger-mix" onClick={() => onOpen(span.start, span.end, item.name, '')}>
                    <span className="ledger-mix-head">
                        <b>{item.name}</b>
                        <MoneyAmount value={item.amount} mark={mark} size="sm" />
                        <span aria-hidden="true">›</span>
                    </span>
                    <span className="ledger-mix-track" aria-hidden="true"><i style={{ width: `${Math.max(6, (item.amount / (mix[0]?.amount || 1)) * 100)}%` }} /></span>
                </button>
            ))}
            <h2>{fillCopy(L.statsRank, { when, kind: kindName })}</h2>
            {rank.length === 0 ? <p className="ledger-panel-note">{L.statsEmpty}</p> : rank.map((item, index) => (
                <button key={item.name} type="button" className="ledger-rank-row" onClick={() => onOpen(span.start, span.end, '', item.name)}>
                    <span className="ledger-rank-no">{index + 1}</span>
                    <span className="ledger-tx-icon" style={{ background: `${sliceColors[index % sliceColors.length]}33` }}>{item.name.slice(0, 1)}</span>
                    <b>{item.name}</b>
                    <MoneyAmount value={item.amount} mark={mark} size="sm" />
                    <span aria-hidden="true">›</span>
                </button>
            ))}
        </section>
    );
}

function groupStats(entries: Entry[], field: 'category' | 'title') {
    const totals = new Map<string, number>();
    for (const entry of entries) {
        const name = entry[field].trim() || '—';
        totals.set(name, (totals.get(name) ?? 0) + entry.amount);
    }
    return [...totals.entries()].map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount);
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
                    return (
                        <button
                            key={iso}
                            type="button"
                            role="gridcell"
                            className={`ledger-calendar-day${selected === iso ? ' is-selected' : ''}`}
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

function smoothCurve(points: { x: number; y: number }[]) {
    if (points.length === 0) return '';
    if (points.length === 1) return `M${points[0].x},${points[0].y}`;
    let path = `M${points[0].x},${points[0].y}`;
    if (points.length === 2) return `${path} L${points[1].x},${points[1].y}`;
    for (let index = 0; index < points.length - 1; index += 1) {
        const p0 = points[Math.max(index - 1, 0)];
        const p1 = points[index];
        const p2 = points[index + 1];
        const p3 = points[Math.min(index + 2, points.length - 1)];
        const c1x = p1.x + (p2.x - p0.x) / 6;
        const c1y = p1.y + (p2.y - p0.y) / 6;
        const c2x = p2.x - (p3.x - p1.x) / 6;
        const c2y = p2.y - (p3.y - p1.y) / 6;
        path += ` C${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`;
    }
    return path;
}

function WorthCurve({ points, label }: { points: { day: string; amount: number }[]; label: string }) {
    const width = 320;
    const height = 180;
    if (points.length === 0) return null;
    const min = Math.min(...points.map((point) => point.amount));
    const max = Math.max(...points.map((point) => point.amount));
    const step = points.length <= 1 ? 0 : (width - 16) / (points.length - 1);
    const plotH = height - 24;
    const placed = points.map((point, index) => ({
        x: 8 + index * step,
        y: max === min ? height / 2 : 12 + (1 - (point.amount - min) / (max - min)) * plotH,
    }));
    const last = placed[placed.length - 1];
    return (
        <svg className="ledger-worth-line" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
            <path d={smoothCurve(placed)} fill="none" stroke="#E85D75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={last.x} cy={last.y} r="4" fill="#E85D75" />
        </svg>
    );
}

function WorthSummary({
    L,
    mark,
    worth,
    delta,
    prior,
    span,
    onSpan,
    onOpen,
}: {
    L: Copy;
    mark: string;
    worth: number;
    delta: number;
    prior: number;
    span: WorthSpan;
    onSpan: (span: WorthSpan) => void;
    onOpen?: () => void;
}) {
    const tone = delta === 0 ? 'is-flat' : 'is-theme';
    const body = (
        <>
            <div className="ledger-worth-top">
                <p className="ledger-worth-kicker">{L.netAssets}</p>
                <span className={`ledger-worth-past ${tone}`}>
                    <WorthArrow down={delta < 0} />
                    {worthPastLabel(L, span)}
                </span>
            </div>
            <MoneyAmount value={worth} mark={mark} size="hero" />
            <div className="ledger-worth-growth">
                <p className="ledger-worth-kicker">{L.worthGrowth}</p>
                <div className={`ledger-worth-change ${tone}`}>
                    <MoneyAmount value={delta} mark={mark} size="md" signed />
                    <span className="ledger-worth-pct">{formatPct(delta, prior)}</span>
                </div>
            </div>
        </>
    );
    return (
        <article className="ledger-worth-card">
            {onOpen ? (
                <button type="button" className="ledger-worth-open" onClick={onOpen}>{body}</button>
            ) : (
                <div className="ledger-worth-open">{body}</div>
            )}
            <div className="ledger-worth-tabs" role="tablist" aria-label={L.accountsTrend}>
                {WORTH_SPANS.map((item) => (
                    <button key={item} type="button" role="tab" aria-selected={span === item} className={span === item ? 'is-on' : ''} onClick={() => onSpan(item)}>{worthSpanLabel(L, item)}</button>
                ))}
            </div>
        </article>
    );
}

function WorthArrow({ down }: { down: boolean }) {
    return (
        <svg className="ledger-worth-arrow" viewBox="0 0 12 12" aria-hidden="true">
            {down ? (
                <path d="M2 2 10 10M10 4v6H4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            ) : (
                <path d="M2 10 10 2M4 2h6v6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            )}
        </svg>
    );
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
    const last = placed[placed.length - 1];
    return (
        <svg className="ledger-line" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={L.spendLineAria}>
            <path d={smoothCurve(placed)} fill="none" stroke="#E85D75" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            {last && <circle cx={last.x} cy={last.y} r="4" fill="#E85D75" />}
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


function AccountDetailView({
    L,
    locale,
    account,
    entries,
    mark,
    onBack,
    onEdit,
    onActivity,
}: {
    L: Copy;
    locale: Locale;
    account: Account;
    entries: Entry[];
    mark: string;
    onBack: () => void;
    onEdit: () => void;
    onActivity: (from: string, to: string) => void;
}) {
    const [windowDays, setWindowDays] = useState<AccountsWindow>(30);
    const total = accountTotal(account, entries);
    const windowFrom = accountsWindowStart(windowDays);
    const prior = accountBalanceOnDate(account, entries, isoBefore(windowFrom));
    const delta = total - prior;
    const flow = accountPeriodFlow(account.id, entries, windowFrom, todayIso());
    const series = netWorthSeries([account], entries, windowDays);
    const cycle = cardCycle(account, entries);
    const up = delta >= 0;

    return (
        <>
            <SubpageHead L={L} title={account.name} onBack={onBack} />
            <article className="ledger-net-card">
                <p>{accountKindLabel(L, normalizeAccountKind(account.kind))}</p>
                <MoneyAmount value={total} mark={mark} size="hero" />
                <div className="ledger-segment" role="tablist" aria-label={L.accountsTrend}>
                    {([
                        [7, L.accountsWindow7],
                        [30, L.accountsWindow30],
                    ] as const).map(([days, label]) => (
                        <button key={days} type="button" role="tab" aria-selected={windowDays === days} className={windowDays === days ? 'is-on' : ''} onClick={() => setWindowDays(days)}>{label}</button>
                    ))}
                </div>
                <SpendLine L={L} points={series} active="" fitRange />
                <p className="ledger-net-foot">
                    <span>{L.accountPeriodDelta}</span>
                    <span className="ledger-detail-amt"><MoneyAmount value={delta} mark={mark} size="sm" signed /></span>
                    <span className={up ? 'ledger-detail-pct is-up' : 'ledger-detail-pct is-down'}>{formatPct(delta, prior)}</span>
                </p>
            </article>
            <button type="button" className="ledger-detail-flow" onClick={() => onActivity(windowFrom, todayIso())}>
                <span>
                    <b>{L.periodSpend}</b>
                    <MoneyAmount value={flow.outflow} mark={mark} size="sm" />
                </span>
                <span>
                    <b>{L.periodIncome}</b>
                    <MoneyAmount value={flow.inflow} mark={mark} size="sm" />
                </span>
                <span className={flow.net >= 0 ? 'is-up' : 'is-down'}>
                    <b>{L.accountPeriodNet}</b>
                    <MoneyAmount value={flow.net} mark={mark} size="sm" signed />
                </span>
            </button>
            {cycle && (
                <button type="button" className="ledger-card ledger-bill" onClick={() => onActivity(cycle.start, cycle.end)}>
                    <span className="ledger-bill-head">
                        <b>{L.cardBill}</b>
                        <span aria-hidden="true">›</span>
                    </span>
                    <MoneyAmount value={cycle.spent} mark={mark} size="md" />
                    <p>{L.cardDueDay} {dayLabel(cycle.due, locale, L)}</p>
                    <p>{dayLabel(cycle.start, locale, L)} – {dayLabel(cycle.end, locale, L)}</p>
                </button>
            )}
            <button type="button" className="ledger-pill" onClick={onEdit}>{L.editAccount}</button>
            <button type="button" className="ledger-pill ledger-pill-secondary" onClick={() => onActivity(windowFrom, todayIso())}>{L.accountDetailActivity}</button>
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

function percentLabel(amount: number, total: number) {
    if (total <= 0) return '0%';
    const digits = ((amount / total) * 100).toFixed(1);
    return `${digits.endsWith('.0') ? digits.slice(0, -2) : digits}%`;
}

function groupYear(rows: Entry[], keyOf: (entry: Entry) => string, nameOf: (entry: Entry) => string) {
    const map = new Map<string, { id: string; name: string; amount: number; count: number }>();
    for (const entry of rows) {
        const id = keyOf(entry);
        const current = map.get(id) ?? { id, name: nameOf(entry), amount: 0, count: 0 };
        current.amount += entry.amount;
        current.count += 1;
        map.set(id, current);
    }
    return [...map.values()].sort((a, b) => b.amount - a.amount);
}

function YearDonut({ parts }: { parts: { name: string; amount: number; color: string }[] }) {
    const total = parts.reduce((sum, part) => sum + part.amount, 0);
    if (total <= 0) return null;
    const radius = 58;
    const circ = 2 * Math.PI * radius;
    let cursor = 0;
    const slices = parts.map((part) => {
        const fraction = part.amount / total;
        const dash = fraction * circ;
        const rotation = (cursor / total) * 360 - 90;
        const mid = rotation + (fraction * 360) / 2;
        cursor += part.amount;
        return { ...part, dash, rotation, mid, fraction };
    });
    return (
        <div className="ledger-year-donut" aria-hidden="true">
            <svg viewBox="0 0 280 200">
                {slices.map((slice) => (
                    <circle
                        key={slice.name}
                        cx="140"
                        cy="100"
                        r={radius}
                        fill="none"
                        stroke={slice.color}
                        strokeWidth="22"
                        strokeDasharray={`${slice.dash} ${circ - slice.dash}`}
                        transform={`rotate(${slice.rotation} 140 100)`}
                    />
                ))}
                {slices.filter((slice) => slice.fraction >= 0.08).map((slice) => {
                    const rad = (slice.mid * Math.PI) / 180;
                    const x = 140 + Math.cos(rad) * 96;
                    const y = 100 + Math.sin(rad) * 96;
                    const anchor = Math.cos(rad) > 0.25 ? 'start' : Math.cos(rad) < -0.25 ? 'end' : 'middle';
                    return (
                        <text key={`label-${slice.name}`} x={x} y={y} textAnchor={anchor} dominantBaseline="middle" className="ledger-year-donut-label">
                            {percentLabel(slice.amount, total)}
                        </text>
                    );
                })}
            </svg>
        </div>
    );
}

function YearReportPanel({
    L,
    year,
    entries,
    ledgerEntries,
    accounts,
    mark,
    onPrev,
    onNext,
    nextDisabled,
    onOpen,
    onEntry,
    onBack,
}: {
    L: Copy;
    year: number;
    entries: Entry[];
    ledgerEntries: Entry[];
    accounts: { id: string; name: string }[];
    mark: string;
    onPrev: () => void;
    onNext: () => void;
    nextDisabled: boolean;
    onOpen: (kind: 'out' | 'in', month?: number, category?: string, title?: string, accountId?: string) => void;
    onEntry: (entry: Entry) => void;
    onBack: () => void;
}) {
    const [kind, setKind] = useState<'out' | 'in'>('out');
    const [openCategory, setOpenCategory] = useState('');
    const [showAll, setShowAll] = useState(false);
    const columns = yearColumns(entries, year);
    const prefix = String(year);
    const scoped = entries.filter((entry) => entry.date.startsWith(prefix));
    const spend = scoped.filter((entry) => isSpend(entry)).reduce((sum, entry) => sum + entry.amount, 0);
    const income = scoped.filter((entry) => isIncome(entry)).reduce((sum, entry) => sum + entry.amount, 0);
    const picked = scoped.filter((entry) => (kind === 'out' ? isSpend(entry) : isIncome(entry)));
    const total = kind === 'out' ? spend : income;
    const kindName = kind === 'out' ? L.statsOut : L.statsIn;
    const now = new Date();
    const futureMonth = (month: number) => year > now.getFullYear() || (year === now.getFullYear() && month > now.getMonth() + 1);
    const live = columns.filter((column) => !futureMonth(column.month));
    const valueOf = (column: { spend: number; income: number }) => (kind === 'out' ? column.spend : column.income);
    const peak = live.reduce((best, column) => Math.max(best, valueOf(column)), 0);
    const average = live.length ? live.reduce((sum, column) => sum + valueOf(column), 0) / live.length : 0;
    const peakMonth = live.reduce((best, column) => {
        if (!best) return column;
        const value = valueOf(column);
        const bestValue = valueOf(best);
        if (value > bestValue || (value === bestValue && column.month > best.month)) return column;
        return best;
    }, live[0]);
    const slices = groupYear(picked, (entry) => entry.category, (entry) => entry.category);
    const tops = [...picked].sort((a, b) => b.amount - a.amount);
    const shownTops = showAll ? tops.slice(0, 30) : tops.slice(0, 5);
    const topScale = tops[0]?.amount || 1;
    const accountRows = groupYear(
        picked,
        (entry) => entry.accountId || 'cash',
        (entry) => accounts.find((account) => account.id === entry.accountId)?.name ?? '',
    );
    useEffect(() => {
        setOpenCategory('');
        setShowAll(false);
    }, [year]);

    function chooseKind(next: 'out' | 'in') {
        setKind(next);
        setOpenCategory('');
        setShowAll(false);
    }

    return (
        <>
            <SubpageHead L={L} title={`${year} ${L.yearReport}`} onBack={onBack} />
            <div className="ledger-year-nav">
                <button type="button" onClick={onPrev}>{L.yearPrev}</button>
                <button type="button" onClick={onNext} disabled={nextDisabled}>{L.yearNext}</button>
            </div>
            <div className="ledger-year-kinds" role="tablist">
                <button type="button" role="tab" aria-selected={kind === 'out'} className={kind === 'out' ? 'is-on' : ''} onClick={() => chooseKind('out')}>
                    <span>{L.yearSpend}</span>
                    <MoneyAmount value={spend} mark={mark} size="sm" />
                </button>
                <button type="button" role="tab" aria-selected={kind === 'in'} className={kind === 'in' ? 'is-on' : ''} onClick={() => chooseKind('in')}>
                    <span>{L.yearIncome}</span>
                    <MoneyAmount value={income} mark={mark} size="sm" />
                </button>
            </div>
            <button type="button" className="ledger-year-hero" onClick={() => onOpen(kind)}>
                <span>{kindName}</span>
                <MoneyAmount value={total} mark={mark} size="hero" />
                <span className="ledger-year-count">{fillCopy(L.yearCount, { count: String(picked.length) })}</span>
                <span className="ledger-year-balance">
                    {L.yearBalance}
                    <MoneyAmount value={income - spend} mark={mark} size="sm" signed />
                </span>
                <b className="ledger-year-watermark" aria-hidden="true">{year}</b>
            </button>
            <section className="ledger-year-card">
                <h2>{L.yearClassify}</h2>
                {slices.length === 0 ? <p className="ledger-year-empty">{L.statsEmpty}</p> : (
                    <>
                        <YearDonut parts={slices.map((slice, index) => ({ name: slice.name, amount: slice.amount, color: sliceColors[index % sliceColors.length] }))} />
                        {slices.map((slice, index) => {
                            const titles = groupYear(picked.filter((entry) => entry.category === slice.name), (entry) => entry.title, (entry) => entry.title);
                            const open = openCategory === slice.id;
                            return (
                                <div key={slice.id} className="ledger-year-cat">
                                    <div className="ledger-year-cat-row">
                                        <button type="button" className={open ? 'is-open' : ''} onClick={() => setOpenCategory(open ? '' : slice.id)}>
                                            <i style={{ background: sliceColors[index % sliceColors.length] }} />
                                            <span>{index + 1}. {slice.name} {percentLabel(slice.amount, total)}</span>
                                            <span className="ledger-chevron" aria-hidden="true">›</span>
                                        </button>
                                        <button type="button" onClick={() => onOpen(kind, undefined, slice.name)}>
                                            <MoneyAmount value={slice.amount} mark={mark} size="sm" />
                                            <span>{fillCopy(L.yearCount, { count: String(slice.count) })}</span>
                                            <span className="ledger-chevron" aria-hidden="true">›</span>
                                        </button>
                                    </div>
                                    {open && (
                                        <div className="ledger-year-tiles">
                                            {titles.map((item) => (
                                                <button key={item.id} type="button" onClick={() => onOpen(kind, undefined, slice.name, item.name)}>
                                                    <span className="ledger-year-mark">{item.name.slice(0, 1)}</span>
                                                    <span>{item.name}</span>
                                                    <MoneyAmount value={item.amount} mark={mark} size="sm" />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </>
                )}
            </section>
            <section className="ledger-year-card">
                <h2>{L.yearCompare}</h2>
                <div className="ledger-year-bubbles">
                    {columns.map((column) => {
                        const edge = column.month <= 2 ? 'is-start' : column.month >= 11 ? 'is-end' : '';
                        const hot = peak > 0 && peakMonth?.month === column.month;
                        return (
                            <div key={column.month}>
                                {hot && (
                                    <button type="button" className={`ledger-year-bubble ${edge}`} onClick={() => onOpen(kind, column.month)}>
                                        <span>{fillCopy(L.yearMost, { when: `${year}/${column.month}` })}</span>
                                        <MoneyAmount value={valueOf(column)} mark={mark} size="sm" />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
                <div className="ledger-year-plot">
                    {peak > 0 && <i className="ledger-year-mean" style={{ bottom: `${(average / peak) * 100}%` }} />}
                    {columns.map((column) => {
                        const value = valueOf(column);
                        const height = peak > 0 ? Math.max(value > 0 ? 8 : 4, (112 * value) / peak) : 4;
                        const ahead = futureMonth(column.month);
                        const hot = peakMonth?.month === column.month && value > 0;
                        return (
                            <button key={column.month} type="button" className={hot ? 'is-on' : ''} disabled={ahead} aria-label={`${year}/${column.month}`} onClick={() => onOpen(kind, column.month)}>
                                <i style={{ height: `${height}px` }} />
                            </button>
                        );
                    })}
                </div>
                <div className="ledger-year-months">
                    {columns.map((column) => (
                        <b key={column.month} className={`${peakMonth?.month === column.month && valueOf(column) > 0 ? 'is-on' : ''} ${futureMonth(column.month) ? 'is-ahead' : ''}`}>{column.month}</b>
                    ))}
                </div>
                <p className="ledger-year-avg">
                    <i />
                    {fillCopy(L.yearAverage, { kind: kindName })}
                    <MoneyAmount value={average} mark={mark} size="sm" />
                </p>
            </section>
            {shownTops.length > 0 && (
                <section className="ledger-year-card">
                    <h2>{fillCopy(L.yearTop, { kind: kindName })}</h2>
                    <ol className="ledger-year-tops">
                        {shownTops.map((entry, index) => {
                            const paidBack = ledgerEntries.filter((item) => item.refundOf === entry.id).reduce((sum, item) => sum + item.amount, 0);
                            return (
                                <li key={entry.id}>
                                    <button type="button" onClick={() => onEntry(entry)}>
                                        <span className="ledger-year-top-line">
                                            <span className="ledger-year-rank">{index + 1}</span>
                                            <b>{entry.title}</b>
                                            <MoneyAmount value={entry.amount} mark={mark} size="sm" />
                                        </span>
                                        <span className="ledger-year-top-meta">{entry.category} · {entry.date.slice(5)}</span>
                                        {paidBack > 0 && (
                                            <span className="ledger-year-top-back">
                                                {L.yearRefunded}
                                                <MoneyAmount value={paidBack} mark={mark} size="sm" />
                                            </span>
                                        )}
                                        <span className="ledger-year-top-track" aria-hidden="true">
                                            <i style={{ width: `${Math.max(8, (entry.amount / topScale) * 100)}%` }} />
                                        </span>
                                    </button>
                                </li>
                            );
                        })}
                    </ol>
                    {tops.length > 5 && (
                        <button type="button" className="ledger-year-more" onClick={() => setShowAll((on) => !on)}>{showAll ? L.yearFold : L.yearExpand}</button>
                    )}
                </section>
            )}
            {accountRows.length > 0 && (
                <section className="ledger-year-card">
                    <h2>{kind === 'out' ? L.yearAccountOut : L.yearAccountIn}</h2>
                    <ul className="ledger-year-accounts">
                        {accountRows.map((row) => (
                            <li key={row.id}>
                                <button type="button" onClick={() => onOpen(kind, undefined, undefined, undefined, row.id)}>
                                    <span className="ledger-year-mark">{row.name.slice(0, 1) || '·'}</span>
                                    <span>{row.name}</span>
                                    <span className="ledger-year-top-fig">
                                        <MoneyAmount value={row.amount} mark={mark} size="sm" />
                                        <span>{fillCopy(L.yearCount, { count: String(row.count) })}</span>
                                    </span>
                                    <span className="ledger-chevron" aria-hidden="true">›</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </>
    );
}

function Fold({ open, children }: { open: boolean; children: React.ReactNode }) {
    const [expanded, setExpanded] = useState(open);
    const skip = useRef(true);
    useEffect(() => {
        if (skip.current) {
            skip.current = false;
            return;
        }
        setExpanded(open);
    }, [open]);
    return (
        <div
            className={expanded ? 'ledger-fold is-open' : 'ledger-fold'}
            aria-hidden={expanded ? undefined : true}
            ref={(node) => {
                if (node) node.inert = !expanded;
            }}
        >
            <div className="ledger-fold-body">{children}</div>
        </div>
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
                <Fold open={periodMode === 'range'}>
                    <div className="ledger-dates">
                        <DateField label={L.rangeStart} locale={locale} value={rangeFrom} max={todayIso()} onChange={onFrom} L={L} />
                        <span>{L.rangeTo}</span>
                        <DateField label={L.rangeEnd} locale={locale} value={rangeTo} max={todayIso()} onChange={onTo} L={L} />
                    </div>
                </Fold>
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
    onRefund,
    onBack,
    onAddAccount,
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
    onRefund: () => void;
    onBack: () => void;
    onAddAccount: () => void;
}) {
    const solved = solveMoney(draft.amount);
    const otherSolved = solveMoney(draft.otherAmount);
    const amountOk = solved != null && solved > 0 && (!draft.splitOn || (otherSolved != null && otherSolved > 0));
    const refunded = draft.id ? book.entries.some((entry) => entry.refundOf === draft.id) : false;
    const source = book.entries.find((entry) => entry.id === draft.id);
    const accounts = openAccountList(book.accounts, draft.accountId);
    return (
        <>
            <SubpageHead L={L} title={draft.id ? L.entryEdit : L.entryNew} onBack={onBack} />
            <div className="ledger-choice-row" role="tablist" aria-label={L.direction}>
                <button type="button" role="tab" aria-selected={draft.direction === 'out'} className={draft.direction === 'out' ? 'is-on' : ''} onClick={() => onChange({ ...draft, direction: 'out' })}>{L.expense}</button>
                <button type="button" role="tab" aria-selected={draft.direction === 'in'} className={draft.direction === 'in' ? 'is-on' : ''} onClick={() => onChange({ ...draft, direction: 'in' })}>{L.income}</button>
            </div>
            <label className="ledger-label" htmlFor="entry-amount">{L.amount}</label>
            <input id="entry-amount" className="ledger-field" inputMode="decimal" value={draft.amount} placeholder="0.00" onChange={(event) => onChange({ ...draft, amount: moneyTyping(event.target.value) })} />
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
            {!draft.id && (
                <label className="ledger-check">
                    <input type="checkbox" checked={draft.splitOn} onChange={(event) => onChange({ ...draft, splitOn: event.target.checked })} />
                    {L.splitMark}
                </label>
            )}
            <Fold open={draft.splitOn && !draft.id}>
                <label className="ledger-label" htmlFor="entry-other">{L.splitAmount}</label>
                <input id="entry-other" className="ledger-field" inputMode="decimal" value={draft.otherAmount} placeholder="0.00" onChange={(event) => onChange({ ...draft, otherAmount: moneyTyping(event.target.value) })} />
                <p className="ledger-label">{L.category}</p>
                <div className="ledger-chips">
                    {categories.map((name) => (
                        <button key={`other-${name}`} type="button" className={draft.otherCategory === name ? 'is-on' : ''} onClick={() => onChange({ ...draft, otherCategory: name })}>{name}</button>
                    ))}
                </div>
                <label className="ledger-check">
                    <input type="checkbox" checked={draft.otherShared} onChange={(event) => onChange({ ...draft, otherShared: event.target.checked })} />
                    {L.shared}
                </label>
            </Fold>
            <label className="ledger-label" htmlFor="entry-date">{L.date}</label>
            <DateField id="entry-date" label={L.date} locale={locale} value={draft.date} max={todayIso()} onChange={(date) => onChange({ ...draft, date })} L={L} />
            <label className="ledger-label" htmlFor="entry-account">{L.account}</label>
            {accounts.length > 0 ? (
                <ChoiceMenu id="entry-account" label={L.account} value={draft.accountId} options={accounts.map((account) => ({ value: account.id, label: account.name }))} onChange={(accountId) => onChange({ ...draft, accountId })} />
            ) : (
                <input id="entry-account" className="ledger-field" value={draft.accountName} onChange={(event) => onChange({ ...draft, accountName: event.target.value })} />
            )}
            {accounts.every((account) => account.id.startsWith('sample-')) && (
                <button type="button" className="ledger-account-guide" onClick={onAddAccount}>
                    <span>{L.accountGuide}</span>
                    <span className="ledger-chevron" aria-hidden="true">›</span>
                </button>
            )}
            <label className="ledger-check">
                <input type="checkbox" checked={draft.shared} onChange={(event) => onChange({ ...draft, shared: event.target.checked })} />
                {L.shared}
            </label>
            <Fold open={draft.direction === 'out' && !draft.splitOn && book.goals.length > 0}>
                <p className="ledger-label">{L.goalAttach}</p>
                <div className="ledger-chips">
                    <button type="button" className={draft.goalId === '' ? 'is-on' : ''} onClick={() => onChange({ ...draft, goalId: '' })}>{L.goalNone}</button>
                    {book.goals.map((goal) => (
                        <button key={goal.id} type="button" className={draft.goalId === goal.id ? 'is-on' : ''} onClick={() => onChange({ ...draft, goalId: goal.id })}>{goal.title}</button>
                    ))}
                </div>
            </Fold>
            <Fold open={draft.direction === 'out'}>
                <label className="ledger-check">
                    <input
                        type="checkbox"
                        checked={draft.claim !== 'none'}
                        onChange={() => onChange({ ...draft, claim: draft.claim === 'none' ? 'waiting' : 'none' })}
                    />
                    {draft.claim === 'done' ? L.claimDone : L.claimMark}
                </label>
            </Fold>
            <button type="button" className="ledger-pill" onClick={onSave} disabled={!draft.title.trim() || !amountOk}>{L.save}</button>
            {source && source.direction === 'out' && !source.refundOf && (
                refunded
                    ? <p className="ledger-refund-done">{L.refundDone}</p>
                    : <button type="button" className="ledger-pill ledger-pill-secondary" onClick={onRefund}>{L.refundMark}</button>
            )}
            {draft.id && <button type="button" className="ledger-text-button" onClick={onDelete}>{L.deleteEntry}</button>}
        </>
    );
}

