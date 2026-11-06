/**
 * @name SpendLogBook
 */

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import brandMark from './assets/brand-mark.png';
import bannerBars from './assets/banner-bars.png';
import bannerRing from './assets/banner-ring.png';
import emptyNote from './assets/empty-note.png';
import tabOverview from './assets/tab-overview.png';
import tabLedger from './assets/tab-ledger.png';
import tabAccounts from './assets/tab-accounts.png';
import tabProfile from './assets/tab-profile.png';
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
    openStoredBook,
    normalizeAccountKind,
    normalizeClaim,
    normalizeCurrency,
    parseGoals,
    parseSparks,
    parseSparkTags,
    saveBook,
    moneyTyping,
    solveMoney,
    signedValue,
    categoryBudgetHint,
    defaultMonthlyBudgetHint,
    dedupeTemplates,
    adoptCategories,
    starterCategories,
    withoutSample,
    releaseDisplay,
    labelSampleEntries,
    bareMemo,
    type Account,
    type AccountKind,
    type Book,
    type ClaimMark,
    type Direction,
    type Entry,
    type Gender,
    type SavingGoal,
    type Spark,
    type SparkKind,
} from './store';
import { localeChoices, normalizeLocale, strings, type Copy, type Locale } from './i18n';
import { CategoryBadge, CategoryGrid, CategoryMarkPicker, categoryKey } from './category-marks';
import { excelBook } from './excel-book';
import './style.css';

const ALL_CATEGORIES = '*';
const ALL_ACCOUNTS = '*';

type Scope = 'mine' | 'family';
type PageId = 'dashboard' | 'transactions' | 'accounts' | 'me';
type Panel = 'none' | 'entry' | 'account' | 'accountDetail' | 'accountsBoard' | 'profile' | 'filter' | 'budget' | 'transfer' | 'privacy' | 'about' | 'disclaimer' | 'year' | 'goals' | 'goal' | 'sparks' | 'sparkShelf' | 'sparkBoard' | 'spark' | 'language' | 'currency' | 'categories' | 'categoryForm' | 'worth' | 'removed' | 'export' | 'reminder' | 'cloud';
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
    { id: 'accounts', title: '灵感' },
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

function yesterdayIso() {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return isoDate(date);
}

function sparkGroups(sparks: Spark[], L: Copy) {
    const listed = [...sparks].sort((left, right) => (left.writtenOn === right.writtenOn ? (left.id < right.id ? 1 : -1) : left.writtenOn < right.writtenOn ? 1 : -1));
    const groups: { day: string; label: string; items: Spark[] }[] = [];
    for (const spark of listed) {
        const label = spark.writtenOn === todayIso() ? L.dayToday : spark.writtenOn === yesterdayIso() ? L.dayYesterday : spark.writtenOn;
        const last = groups[groups.length - 1];
        if (last && last.day === spark.writtenOn) last.items.push(spark);
        else groups.push({ day: spark.writtenOn, label, items: [spark] });
    }
    return groups;
}

const sparkKindOrder: SparkKind[] = ['idea', 'diary', 'thought', 'summary'];

function sparkKindLabel(kind: SparkKind, L: Copy) {
    if (kind === 'diary') return L.sparkDiary;
    if (kind === 'thought') return L.sparkThought;
    if (kind === 'summary') return L.sparkSummary;
    return L.sparkIdea;
}

function paperCue(locale: Locale, kind: SparkKind) {
    const zh = {
        lead: '从一笔开始',
        tally: (count: number) => `${count} 字`,
        idea: { hint: '还有一笔没记上', lines: ['这笔下次能少花吗', '想先记下的一笔'] },
        diary: { hint: '今天这笔钱花在哪', lines: ['为什么会花这一笔', '哪一笔最不该花'] },
        thought: { hint: '这笔花得值不值', lines: ['还能再省下来吗', '先记着，回头再对'] },
        summary: { hint: '今天花得最多的是', lines: ['今天一共出去多少', '明天想少花的一笔'] },
    };
    const en = {
        lead: 'Start from one expense',
        tally: (count: number) => `${count} characters`,
        idea: { hint: 'An expense not written down yet', lines: ['Could the next one cost less?', 'One entry to set down first'] },
        diary: { hint: 'Where this money went today', lines: ['Why this expense went out', 'The one that should not have'] },
        thought: { hint: 'Was this expense worth it', lines: ['Can a little more be kept back?', 'Write it now, check it later'] },
        summary: { hint: 'Where most of the money went today', lines: ['How much went out today', 'What to spend less on tomorrow'] },
    };
    const pack = locale === 'en' ? en : zh;
    return { lead: pack.lead, tally: pack.tally, ...pack[kind] };
}

function sparkDayChip(iso: string, locale: Locale, L: Copy) {
    if (iso === todayIso()) return L.dayToday;
    if (iso === yesterdayIso()) return L.dayYesterday;
    const parts = iso.split('-');
    const month = Number(parts[1]);
    const day = Number(parts[2]);
    if (!month || !day) return iso;
    if (locale === 'en') {
        const name = new Date(2000, month - 1, 1).toLocaleDateString('en-US', { month: 'short' });
        return `${name} ${day}`;
    }
    return `${month}月${day}日`;
}

function SparkKindIcon({ kind }: { kind: SparkKind }) {
    if (kind === 'diary') {
        return <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.2h8.2v11.6H5.2A1.2 1.2 0 0 1 4 12.6V2.2z" fill="none" stroke="currentColor" strokeWidth="1.4" /><path d="M4 2.2v11.2" fill="none" stroke="currentColor" strokeWidth="1.4" /></svg>;
    }
    if (kind === 'thought') {
        return <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3.2h10v7.2H6.2L3.4 13V3.2z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /></svg>;
    }
    if (kind === 'summary') {
        return <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 4.2h9M3.5 8h9M3.5 11.8h6" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>;
    }
    return <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2.2a3.4 3.4 0 0 1 1.6 6.4c-.5.3-.7.8-.7 1.4H7.1c0-.6-.2-1.1-.7-1.4A3.4 3.4 0 0 1 8 2.2z" fill="none" stroke="currentColor" strokeWidth="1.4" /><path d="M6.6 12h2.8M7.1 13.6h1.8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>;
}

function SparkBrief({ spark, locale, L, onOpen }: { spark: Spark; locale: Locale; L: Copy; onOpen: () => void }) {
    return (
        <button type="button" className="ledger-spark-brief" onClick={onOpen}>
            <span>{sparkKindLabel(spark.kind, L)}</span>
            <b>{spark.body.replace(/\n/g, ' ')}</b>
            {spark.favorite ? <em>★</em> : null}
            <time>{sparkDayChip(spark.writtenOn, locale, L)}</time>
        </button>
    );
}

function PaperWrite({ value, placeholder, onChange }: { value: string; placeholder: string; onChange: (value: string) => void }) {
    const ref = useRef<HTMLTextAreaElement>(null);
    useLayoutEffect(() => {
        const node = ref.current;
        if (!node) return;
        node.style.height = '0px';
        node.style.height = `${Math.max(168, node.scrollHeight)}px`;
    }, [value, placeholder]);
    return (
        <textarea
            ref={ref}
            className="ledger-paper-write"
            value={value}
            maxLength={2000}
            placeholder={placeholder}
            onChange={(event) => onChange(event.target.value)}
        />
    );
}

function sparkMatches(spark: Spark, query: string, L: Copy) {
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    if (spark.body.toLowerCase().includes(needle)) return true;
    if (spark.writtenOn.includes(needle)) return true;
    if (sparkKindLabel(spark.kind, L).toLowerCase().includes(needle)) return true;
    return spark.tags.some((tag) => tag.toLowerCase().includes(needle));
}

function entryMatchesQuery(entry: Entry, query: string) {
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    return entry.title.toLowerCase().includes(needle) || entry.date.includes(needle);
}

function sparkTimelineDays(sparks: Spark[], entries: Entry[], query: string, includeEntryDays: boolean) {
    const days = new Set(sparks.map((spark) => spark.writtenOn));
    if (includeEntryDays) {
        for (const entry of entries) {
            if (entry.id.startsWith('transfer-')) continue;
            if (!entryMatchesQuery(entry, query)) continue;
            days.add(entry.date);
        }
    }
    return [...days].sort((left, right) => (left < right ? 1 : -1));
}

function SparkCard({ spark, L, onOpen, onFavorite }: { spark: Spark; L: Copy; onOpen: () => void; onFavorite: () => void }) {
    return (
        <article className="ledger-spark-card">
            <div className="ledger-spark-card-head">
                <span>{sparkKindLabel(spark.kind, L)}</span>
                <button type="button" aria-label={L.sparkFavorite} onClick={onFavorite}>{spark.favorite ? '★' : '☆'}</button>
            </div>
            <button type="button" className="ledger-spark-card-body" onClick={onOpen}>
                {spark.image && <img src={spark.image} alt="" />}
                <b>{spark.body}</b>
                {spark.tags.length > 0 && <span className="ledger-spark-tags">{spark.tags.map((tag) => `#${tag}`).join(' ')}</span>}
            </button>
        </article>
    );
}

function shrinkPicture(file: File): Promise<string> {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => {
                const longest = Math.max(img.width, img.height);
                const scale = longest > 1280 ? 1280 / longest : 1;
                const canvas = document.createElement('canvas');
                canvas.width = Math.max(1, Math.round(img.width * scale));
                canvas.height = Math.max(1, Math.round(img.height * scale));
                const context = canvas.getContext('2d');
                if (!context) {
                    resolve('');
                    return;
                }
                context.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.72));
            };
            img.src = String(reader.result || '');
        };
        reader.readAsDataURL(file);
    });
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
    const list = entries.filter((entry) => entry.accountId === accountId && entry.date >= start && entry.date <= end && !isTransfer(entry));
    const inflow = list.filter((entry) => entry.direction === 'in').reduce((sum, entry) => sum + entry.amount, 0);
    const outflow = list.filter((entry) => entry.direction === 'out').reduce((sum, entry) => sum + entry.amount, 0);
    return { inflow, outflow, net: inflow - outflow };
}

function loggedDays(entries: Entry[]) {
    return new Set(entries.filter((entry) => !entry.id.startsWith('sample-')).map((entry) => entry.date)).size;
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

function RecordMarks({ days, L, onAdd }: { days: number; L: Copy; onAdd: () => void }) {
    const [picked, setPicked] = useState<number | null>(null);
    const steps = [1, 7, 30, 100, 365];
    const names = [L.markFirst, L.markWeek, L.markMonth, L.markHundred, L.markYear];
    const nextIndex = steps.findIndex((step) => days < step);
    const focus = picked ?? (nextIndex === -1 ? steps.length - 1 : nextIndex);
    const step = steps[focus];
    const earned = days >= step;
    const filled = Math.min(days, step);
    const remain = step - days === 1 ? L.markRemain.replace('{count}', '1').replace('days', 'day') : L.markRemain.replace('{count}', String(step - days));
    return (
        <section className="ledger-card ledger-marks">
            <div className="ledger-marks-kicker">{L.markTitle}</div>
            <div className="ledger-marks-head">
                <b>{names[focus]}</b>
                <span className="ledger-marks-quota">{filled}/{step}</span>
            </div>
            <div className="ledger-marks-track" aria-hidden="true">
                <i style={{ width: `${(filled / step) * 100}%` }} />
            </div>
            <div className="ledger-marks-foot">
                <span>{earned ? L.markReached : remain}</span>
                {!earned && <button type="button" className="ledger-marks-add" onClick={onAdd}>{L.entryNew}</button>}
            </div>
            <div className="ledger-marks-row">
                {steps.map((item, index) => {
                    const got = days >= item;
                    return (
                        <button
                            key={item}
                            type="button"
                            className={`ledger-mark-step${got ? ' is-got' : ''}${index === focus ? ' is-on' : ''}`}
                            onClick={() => setPicked(index)}
                        >
                            <span>{item}</span>
                            <em>{names[index]}</em>
                        </button>
                    );
                })}
            </div>
        </section>
    );
}

function starterTitles(locale: Locale) {
    if (locale === 'zh') return ['午餐', '咖啡', '地铁', '早饭', '晚饭', '买菜', '零食', '打车', '购物', '房租', '话费', '工资'];
    return ['Lunch', 'Coffee', 'Metro', 'Breakfast', 'Dinner', 'Groceries', 'Snacks', 'Taxi', 'Shopping', 'Rent', 'Phone', 'Salary'];
}

function titleSuggestions(entries: Entry[], locale: Locale, limit = 6) {
    const counts = new Map<string, number>();
    for (const entry of entries) {
        const title = bareMemo(entry.title).trim();
        if (!title) continue;
        counts.set(title, (counts.get(title) ?? 0) + 1);
    }
    const titles = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([title]) => title).slice(0, limit);
    for (const title of starterTitles(locale)) {
        if (!titles.includes(title)) titles.push(title);
    }
    return titles;
}

function categoriesByUsage(entries: Entry[], categories: string[]) {
    const counts = new Map<string, number>();
    const order = new Map(categories.map((name, index) => [name, index]));
    for (const entry of entries) counts.set(entry.category, (counts.get(entry.category) ?? 0) + 1);
    return [...categories].sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0) || (order.get(a) ?? 0) - (order.get(b) ?? 0));
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

function DateSheetFace({ value, locale, L }: { value: string; locale: Locale; L: Copy }) {
    const parts = value.split('-');
    const month = Number(parts[1]) || 1;
    const day = Number(parts[2]) || 1;
    const weekday = L.weekday[new Date(`${value}T00:00:00`).getDay()] ?? '';
    const monthLabel = locale === 'en'
        ? new Date(2000, month - 1, 1).toLocaleDateString('en-US', { month: 'short' })
        : `${month}月`;
    return (
        <>
            <b>{day}</b>
            <span>
                <strong>{monthLabel}</strong>
                {weekday ? <em>{weekday}</em> : null}
            </span>
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="M4 10h16M8 3.5v4M16 3.5v4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
        </>
    );
}

function DateField({
    id,
    label,
    locale,
    value,
    max,
    onChange,
    L,
    invalid,
    face,
}: {
    id?: string;
    label: string;
    locale: Locale;
    value: string;
    max?: string;
    onChange: (value: string) => void;
    L: Copy;
    invalid?: boolean;
    face?: 'sheet';
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
                className={face === 'sheet' ? 'ledger-date-sheet' : `ledger-field ledger-date-trigger${invalid ? ' is-miss' : ''}`}
                aria-label={label}
                aria-haspopup="dialog"
                aria-expanded={open}
                onClick={() => {
                    setCursor(monthCursor(value));
                    setOpen(true);
                }}
            >
                {face === 'sheet' ? <DateSheetFace value={value} locale={locale} L={L} /> : value}
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
    invalid,
}: {
    id?: string;
    label: string;
    value: string;
    options: { value: string; label: string }[];
    onChange: (value: string) => void;
    invalid?: boolean;
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
                className={`ledger-field ledger-choice-trigger${invalid ? ' is-miss' : ''}`}
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

function ledgerTabs(L: Copy): { id: PageId; title: string; icon: string }[] {
    return [
        { id: 'dashboard', title: L.tabDashboard, icon: tabOverview },
        { id: 'transactions', title: L.tabTransactions, icon: tabLedger },
        { id: 'accounts', title: L.sparks, icon: tabAccounts },
        { id: 'me', title: L.tabMe, icon: tabProfile },
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

function clockText(hour: number, minute: number) {
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function blankEntry(book: Book): EntryDraft {
    return {
        id: '',
        title: '',
        amount: '',
        direction: 'out',
        category: book.categories[0] ?? starterCategories[0],
        date: todayIso(),
        accountId: book.accounts.find((account) => account.archived !== true)?.id ?? '',
        accountName: '',
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
    const [book, setBookState] = useState<Book>(emptyBook);
    const bookRef = useRef(book);
    bookRef.current = book;
    function writeBook(next: Book) {
        setBookState(releaseDisplay(labelSampleEntries(next)));
    }
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
    const [cloudWhen, setCloudWhen] = useState('');
    const [cloudAsk, setCloudAsk] = useState(false);
    const [importAsk, setImportAsk] = useState(false);
    const [pendingImport, setPendingImport] = useState<Partial<Book> | null>(null);
    const importFileRef = useRef<HTMLInputElement>(null);
    const entryReturn = useRef<Panel | null>(null);
    const accountFromEntry = useRef(false);
    const accountsReturn = useRef<Panel>('entry');
    const transferBack = useRef<Panel>('none');
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
    const [categoryMark, setCategoryMark] = useState('tag');
    const [categorySlot, setCategorySlot] = useState<'entry' | 'other' | 'manage'>('manage');
    const [editingCategories, setEditingCategories] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState(ALL_CATEGORIES);
    const [accountFilter, setAccountFilter] = useState(ALL_ACCOUNTS);
    const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'done'>('all');
    const [txDirection, setTxDirection] = useState<'all' | 'out' | 'in'>('all');
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
    const [sparkId, setSparkId] = useState('');
    const [sparkBody, setSparkBody] = useState('');
    const [sparkDate, setSparkDate] = useState(todayIso);
    const [sparkKind, setSparkKind] = useState<SparkKind>('idea');
    const [sparkTags, setSparkTags] = useState('');
    const [sparkFavorite, setSparkFavorite] = useState(false);
    const [sparkImage, setSparkImage] = useState('');
    const [pictureLook, setPictureLook] = useState('');
    const [picturePull, setPicturePull] = useState(0);
    const picturePullRef = useRef(0);
    const pictureMoved = useRef(false);
    const sparkLaneDrag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
    const [sparkQuery, setSparkQuery] = useState('');
    const [sparkHomeQuery, setSparkHomeQuery] = useState('');
    const [sparkBoardQuery, setSparkBoardQuery] = useState('');
    const [sparkFilter, setSparkFilter] = useState<'all' | 'favorite'>('all');
    const [sparkShelfKind, setSparkShelfKind] = useState<SparkKind>('idea');
    const sparkBack = useRef<Panel>('none');
    const [sparkTimeline, setSparkTimeline] = useState(false);
    const [notifyDenied, setNotifyDenied] = useState(false);

    useEffect(() => {
        openStoredBook().then((loaded) => {
            writeBook(loaded);
            setReady(true);
        });
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

    useEffect(() => {
        if (typeof Notification === 'undefined') return;
        setNotifyDenied(Notification.permission === 'denied');
    }, [panel, book.dailyReminder]);

    useEffect(() => {
        if (!book.dailyReminder || typeof Notification === 'undefined' || Notification.permission !== 'granted') return undefined;
        const hour = book.reminderHour ?? 21;
        const minute = book.reminderMinute ?? 30;
        const next = new Date();
        next.setHours(hour, minute, 0, 0);
        if (next.getTime() <= Date.now()) next.setDate(next.getDate() + 1);
        const timer = window.setTimeout(() => {
            try {
                const note = new Notification(L.reminderPing);
                note.onclick = () => {
                    window.focus();
                    setDraft(blankEntry(bookRef.current));
                    setPanel('entry');
                };
            } catch {
                /* this browser refused the notice */
            }
        }, next.getTime() - Date.now());
        return () => window.clearTimeout(timer);
    }, [book.dailyReminder, book.reminderHour, book.reminderMinute, L.reminderPing]);

    const mark = currencyMark[book.currency];
    const visibleEntries = useMemo(
        () => book.entries.filter((entry) => (scope === 'family' ? entry.shared : !entry.shared)),
        [book.entries, scope],
    );
    const reviewQueue = [...visibleEntries].filter((entry) => !entry.checked && !entry.id.startsWith('sample-')).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
    const bounds = periodBounds(periodMode, rangeFrom, rangeTo);
    const periodSource = listAll ? book.entries : visibleEntries;
    const periodEntries = periodSource.filter((entry) => entry.date >= bounds.start && entry.date <= bounds.end && !entry.id.startsWith('sample-'));
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
    const flowSpend = filteredEntries.filter((entry) => isSpend(entry)).reduce((sum, entry) => sum + entry.amount, 0);
    const flowIncome = filteredEntries.filter((entry) => isIncome(entry)).reduce((sum, entry) => sum + entry.amount, 0);
    const flowBalance = flowIncome - flowSpend;
    const shownEntries = filteredEntries.filter((entry) => {
        if (txDirection === 'out') return entry.direction === 'out';
        if (txDirection === 'in') return entry.direction === 'in';
        return true;
    });
    const txDays = shownEntries.reduce<string[]>((list, entry) => {
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
            if (entry.id.startsWith('sample-')) continue;
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
    const suggestionTitles = useMemo(() => titleSuggestions(book.entries, locale), [book.entries, locale]);
    const orderedCategories = useMemo(() => categoriesByUsage(book.entries, book.categories), [book.entries, book.categories]);
    const logStreak = streakDays(book.entries);
    const loggedDayCount = loggedDays(book.entries);
    const loggedToday = book.entries.some((entry) => entry.date === todayIso());
    const budget = book.monthlyBudget;
    const recurringItems = useMemo(() => detectRecurring(book.entries), [book.entries]);
    const monthKey = todayIso().slice(0, 7);
    const monthMoves = book.entries.filter((entry) => entry.date.startsWith(monthKey) && !isTransfer(entry));
    const ownAccounts = book.accounts.filter((account) => !account.id.startsWith('sample-'));
    const ownAccountIds = new Set(ownAccounts.map((account) => account.id));
    const ownMonthMoves = monthMoves.filter((entry) => ownAccountIds.has(entry.accountId));
    const ownMonthOut = ownMonthMoves.filter((entry) => entry.direction === 'out').reduce((sum, entry) => sum + entry.amount, 0);
    const ownMonthIn = ownMonthMoves.filter((entry) => entry.direction === 'in').reduce((sum, entry) => sum + entry.amount, 0);
    const ownWorth = bookNetWorth(ownAccounts, book.entries);
    const ownWorthPrior = bookNetWorthOnDate(ownAccounts, book.entries, isoBefore(accountsWindowFrom));
    const monthOutAll = monthMoves.filter((entry) => entry.direction === 'out').reduce((sum, entry) => sum + entry.amount, 0);
    const monthInAll = monthMoves.filter((entry) => entry.direction === 'in').reduce((sum, entry) => sum + entry.amount, 0);
    const waitingClaims = visibleEntries.filter((entry) => !entry.id.startsWith('sample-') && normalizeClaim(entry.claim) === 'waiting' && entry.direction === 'out');
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

    async function setDailyReminder(on: boolean) {
        if (on && typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
            const result = await Notification.requestPermission();
            setNotifyDenied(result === 'denied');
        }
        writeBook({ ...book, dailyReminder: on });
    }

    function setReminderClock(value: string) {
        const [hourText, minuteText] = value.split(':');
        const hour = Number(hourText);
        const minute = Number(minuteText);
        if (!Number.isInteger(hour) || !Number.isInteger(minute)) return;
        writeBook({
            ...book,
            reminderHour: Math.min(23, Math.max(0, hour)),
            reminderMinute: Math.min(59, Math.max(0, minute)),
        });
    }

    function openFresh(direction: Direction) {
        const next = blankEntry(book);
        next.direction = direction;
        setDraft(next);
        setPanel('entry');
    }

    function openNewRecord() {
        if (statsKind === 'other') {
            const own = book.accounts.filter((account) => !account.id.startsWith('sample-'));
            if (own.length < 2) {
                flashExportNote(L.transferNeedTwo);
                return;
            }
            openTransferPanel();
            return;
        }
        openFresh(statsKind === 'in' ? 'in' : 'out');
    }

    function openEntry(entry?: Entry) {
        if (!entry) openFresh('out');
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
                accountName: account?.name ?? '',
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
        const ownAccount = book.accounts.some((account) => account.id === draft.accountId && !account.id.startsWith('sample-'));
        if (!title || amount == null || amount <= 0 || (!draft.id && !ownAccount)) return;
        const accountId = draft.accountId;
        const accounts = book.accounts;
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
        writeBook({ ...book, accounts, entries });
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
        writeBook({ ...book, entries: [back, ...book.entries] });
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
        writeBook({ ...book, goals });
        setPanel('none');
    }

    function openSparkShelf(kind: SparkKind) {
        setSparkShelfKind(kind);
        setSparkFilter('all');
        setSparkQuery('');
        setPanel('sparkShelf');
    }

    function openSparkBoard() {
        setSparkBoardQuery(sparkHomeQuery);
        setPanel('sparkBoard');
    }

    function openSpark(spark?: Spark, preset?: SparkKind) {
        sparkBack.current = panel === 'sparkShelf' || panel === 'sparkBoard' ? panel : 'none';
        setSparkId(spark?.id ?? '');
        setSparkBody(spark?.body ?? '');
        setSparkDate(spark?.writtenOn ?? todayIso());
        setSparkKind(spark?.kind ?? preset ?? 'idea');
        setSparkTags(spark?.tags.join(' ') ?? '');
        setSparkFavorite(spark?.favorite === true);
        setSparkImage(spark?.image ?? '');
        setPanel('spark');
    }

    function closeSpark() {
        setPanel(sparkBack.current === 'sparkShelf' || sparkBack.current === 'sparkBoard' ? sparkBack.current : 'none');
    }

    function saveSpark() {
        const body = sparkBody.trim();
        if (!body) return;
        const next: Spark = {
            id: sparkId || createId(),
            body: body.slice(0, 2000),
            writtenOn: sparkDate || todayIso(),
            kind: sparkKind,
            tags: parseSparkTags(sparkTags),
            favorite: sparkFavorite,
            image: sparkImage || undefined,
        };
        const sparks = sparkId
            ? book.sparks.map((item) => (item.id === sparkId ? next : item))
            : [...book.sparks, next];
        writeBook({ ...book, sparks });
        closeSpark();
    }

    function toggleSparkFavorite(spark: Spark) {
        writeBook({
            ...book,
            sparks: book.sparks.map((item) => (item.id === spark.id ? { ...item, favorite: !item.favorite } : item)),
        });
    }

    function deleteSpark(id: string) {
        writeBook({ ...book, sparks: book.sparks.filter((item) => item.id !== id) });
        closeSpark();
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
        writeBook({ ...book, entries: [incoming, outgoing, ...book.entries] });
    }

    function deleteGoal(id: string) {
        writeBook({ ...book, goals: book.goals.filter((item) => item.id !== id) });
        setPanel('none');
    }

    function payClaim(id: string) {
        const source = book.entries.find((entry) => entry.id === id);
        if (!source || normalizeClaim(source.claim) !== 'waiting') return;
        const backId = `claim-${id}`;
        const updated = book.entries.map((entry) => (entry.id === id ? { ...entry, claim: 'done' as const } : entry));
        if (book.entries.some((entry) => entry.id === backId)) {
            writeBook({ ...book, entries: updated });
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
        writeBook({ ...book, entries: [back, ...updated] });
    }

    function removeEntry(id: string) {
        const entry = book.entries.find((item) => item.id === id);
        const removed = entry
            ? [{ entry, removedOn: todayIso() }, ...(book.removed ?? []).filter((item) => item.entry.id !== id)]
            : (book.removed ?? []);
        writeBook({ ...book, entries: book.entries.filter((item) => item.id !== id), removed });
        closeEntry();
    }

    function restoreEntry(id: string) {
        const item = (book.removed ?? []).find((row) => row.entry.id === id);
        if (!item) return;
        const entries = book.entries.some((entry) => entry.id === id) ? book.entries : [item.entry, ...book.entries];
        writeBook({ ...book, entries, removed: (book.removed ?? []).filter((row) => row.entry.id !== id) });
    }

    function toggleChecked(id: string) {
        writeBook({ ...book, entries: book.entries.map((entry) => (entry.id === id ? { ...entry, checked: !entry.checked } : entry)) });
    }

    function markReviewed(ids: string[]) {
        const set = new Set(ids);
        writeBook({ ...book, entries: book.entries.map((entry) => (set.has(entry.id) ? { ...entry, checked: true } : entry)) });
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

    function openAccountsBoard() {
        accountsReturn.current = panel === 'export' ? 'export' : 'entry';
        setPanel('accountsBoard');
    }

    function closeAccountEditor() {
        if (accountFromEntry.current) {
            accountFromEntry.current = false;
            pageMotionRef.current = 'back';
            setPageMotion('back');
            setPanelState('entry');
            return;
        }
        setPanel(viewingAccountId ? 'accountDetail' : 'accountsBoard');
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
        writeBook({ ...book, accounts });
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
        writeBook({
            ...book,
            accounts: book.accounts.filter((item) => item.id !== id),
            entries: book.entries.filter((entry) => !gone.has(entry.id)),
            removed,
        });
        setViewingAccountId('');
        setPanel('accountsBoard');
    }

    function openCategoryForm(slot: 'entry' | 'other' | 'manage') {
        setCategorySlot(slot);
        setCategoryName('');
        setCategoryMark('tag');
        setPanel('categoryForm');
    }

    function closeCategoryForm() {
        setPanel(categorySlot === 'manage' ? 'categories' : 'entry');
    }

    function addCategory() {
        const name = categoryName.trim();
        if (!name || book.categories.includes(name)) return;
        const marks = { ...(book.categoryMarks ?? {}) };
        if (categoryMark !== 'tag') marks[name] = categoryMark;
        writeBook({ ...book, categories: [...book.categories, name], categoryMarks: marks });
        if (categorySlot === 'entry') setDraft((current) => ({ ...current, category: name }));
        if (categorySlot === 'other') setDraft((current) => ({ ...current, otherCategory: name }));
        setCategoryName('');
        setCategoryMark('tag');
        closeCategoryForm();
    }

    function removeCategory(name: string) {
        if (book.categories.length <= 1) return;
        const marks = { ...(book.categoryMarks ?? {}) };
        delete marks[name];
        writeBook({
            ...book,
            categories: book.categories.filter((item) => item !== name),
            categoryMarks: marks,
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
        writeBook({ ...book, nickname: nickname.slice(0, 12), gender: draftGender });
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
        writeBook({ ...book, monthlyBudget, categoryBudgets });
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

    function openTransferPanel(back: Panel = 'none') {
        const open = openAccountList(book.accounts);
        setTransferFrom(open[0]?.id ?? '');
        setTransferTo(open[1]?.id ?? open[0]?.id ?? '');
        setTransferAmount('');
        setTransferDate(todayIso());
        transferBack.current = back;
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
        writeBook({ ...book, categories, entries: [inEntry, outEntry, ...book.entries] });
        setPanel('none');
    }

    function applyImportedBook(parsed: Partial<Book> | null) {
        if (!parsed || !Array.isArray(parsed.entries) || !Array.isArray(parsed.accounts)) {
            flashExportNote(L.importFail);
            return;
        }
        const stored = parsed as Partial<Book> & { holdings?: unknown };
        const { holdings: _ignoredHoldings, ...clean } = stored;
        writeBook(adoptCategories(withoutSample({
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
            sparks: parseSparks(parsed.sparks),
            locale: parsed.locale === 'zh' ? 'zh' : 'en',
            localeChosen: true,
            hideAmounts: parsed.hideAmounts === true,
            currency: normalizeCurrency(parsed.currency),
            monthlyBudget: typeof parsed.monthlyBudget === 'number' && parsed.monthlyBudget > 0 ? parsed.monthlyBudget : null,
            categoryBudgets: parsed.categoryBudgets && typeof parsed.categoryBudgets === 'object' ? parsed.categoryBudgets : {},
            templates: dedupeTemplates(Array.isArray(parsed.templates) ? parsed.templates : []),
            sampleCleared: true,
            presetStamp: parsed.presetStamp === 2 ? 2 : 0,
        })));
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

    function exportExcelFile() {
        const blob = excelBook(book, {
            transactions: L.transactions,
            accounts: L.tabAccounts,
            budget: L.monthlyBudget,
            date: L.date,
            name: L.name,
            category: L.category,
            account: L.account,
            spend: L.expense,
            income: L.income,
            kind: L.accountKindLabel,
            balance: L.accountBalance,
            amount: L.amount,
            monthly: L.monthlyBudget,
            kindName: (kind) => accountKindLabel(L, kind),
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'SpendLogBook.xlsx';
        link.click();
        URL.revokeObjectURL(url);
        flashExportNote(L.exportDone);
    }

    function wipeBook() {
        setClearAsk(false);
        writeBook({
            ...book,
            sampleCleared: true,
            accounts: [],
            entries: [],
            goals: [],
            sparks: [],
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
        if (panel === 'categoryForm') {
            closeCategoryForm();
            return;
        }
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

    function pullPicture(event: React.PointerEvent<HTMLDivElement>) {
        if (event.button !== 0) return;
        if ((event.target as HTMLElement).closest('button')) return;
        const startY = event.clientY;
        const startX = event.clientX;
        const move = (next: PointerEvent) => {
            const dy = next.clientY - startY;
            const dx = next.clientX - startX;
            const pulled = dy > 8 && dy > Math.abs(dx) ? dy : 0;
            picturePullRef.current = pulled;
            setPicturePull(pulled);
        };
        const up = () => {
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up);
            const pulled = picturePullRef.current;
            pictureMoved.current = pulled > 8;
            picturePullRef.current = 0;
            setPicturePull(0);
            if (pulled > 72) setPictureLook('');
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
    }

    function closePicture(event: React.MouseEvent<HTMLDivElement>) {
        if (pictureMoved.current) {
            pictureMoved.current = false;
            event.preventDefault();
            return;
        }
        setPictureLook('');
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

    const visibleSparks = book.sparks.filter((spark) => {
        if (spark.kind !== sparkShelfKind) return false;
        if (sparkFilter === 'favorite' && !spark.favorite) return false;
        return sparkMatches(spark, sparkQuery, L);
    });
    const sparkOrdered = [...book.sparks].sort((left, right) => (left.writtenOn === right.writtenOn ? (left.id < right.id ? 1 : -1) : left.writtenOn < right.writtenOn ? 1 : -1));
    const sparkNeedle = sparkHomeQuery.trim();
    const sparkMatched = sparkNeedle ? sparkOrdered.filter((spark) => sparkMatches(spark, sparkNeedle, L)) : sparkOrdered;
    const wroteSummary = book.sparks.some((spark) => spark.kind === 'summary' && spark.writtenOn === todayIso());
    const sparkBoardListed = sparkBoardQuery.trim() ? sparkOrdered.filter((spark) => sparkMatches(spark, sparkBoardQuery, L)) : sparkOrdered;
    const showFab = panel === 'none' && (active === 'dashboard' || active === 'transactions');

    function sparkLaneDown(event: React.PointerEvent<HTMLDivElement>) {
        const row = event.currentTarget;
        const drag = { x: event.clientX, left: row.scrollLeft, moved: false };
        sparkLaneDrag.current = drag;
        const move = (next: PointerEvent) => {
            const dx = next.clientX - drag.x;
            if (Math.abs(dx) > 4) drag.moved = true;
            if (!drag.moved) return;
            row.classList.add('is-dragging');
            row.scrollLeft = drag.left - dx;
        };
        const up = () => {
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up);
            row.classList.remove('is-dragging');
            sparkLaneDrag.current = null;
            if (!drag.moved) return;
            const block = (click: Event) => {
                click.preventDefault();
                click.stopPropagation();
                row.removeEventListener('click', block, true);
            };
            row.addEventListener('click', block, true);
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
    }

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
                <div key={`${active}-${panel}`} className={`ledger-body is-${pageMotion}${showFab ? '' : ' is-rest'}${panel === 'privacy' ? ' is-privacy' : ''}${panel === 'entry' ? ' is-entry' : ''}${panel === 'spark' ? ` is-spark is-spark-${sparkKind}` : ''}`}>
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
                            onTransfer={() => {
                                const own = book.accounts.filter((account) => !account.id.startsWith('sample-'));
                                if (own.length < 2) {
                                    flashExportNote(L.transferNeedTwo);
                                    return;
                                }
                                openTransferPanel('entry');
                            }}
                            onAddCategory={() => openCategoryForm('entry')}
                            onAddOtherCategory={() => openCategoryForm('other')}
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
                                <button type="button" className="ledger-text-button" onClick={() => { setBudgetInput(''); writeBook({ ...book, monthlyBudget: null, categoryBudgets: {} }); setPanel('none'); }}>{L.budgetClear}</button>
                            )}
                        </>
                    )}
                    {panel === 'transfer' && (
                        <>
                            <SubpageHead L={L} title={L.transferTitle} onBack={() => setPanel(transferBack.current)} />
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
                            onBack={() => { setViewingAccountId(''); setPanel('accountsBoard'); }}
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
                    {panel === 'cloud' && (
                        <div className="ledger-cloud-page">
                            <SubpageHead L={L} title={L.cloudTitle} onBack={() => setPanel('none')} />
                            <p className="ledger-cloud-status">{cloudWhen ? L.cloudWhenLine.replace('{time}', cloudWhen) : L.cloudNone}</p>
                            <button type="button" className="ledger-pill" onClick={() => {
                                const when = new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en', { dateStyle: 'short', timeStyle: 'short' }).format(new Date());
                                setCloudWhen(when);
                                flashExportNote(L.cloudSaved);
                            }}>{L.cloudSave}</button>
                            <button type="button" className="ledger-pill ledger-pill-secondary" onClick={() => setCloudAsk(true)}>{L.cloudBring}</button>
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
                                <button type="button" onClick={openAccountsBoard}>
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
                            <button type="button" className="ledger-export-file" onClick={exportExcelFile}>
                                <span className="ledger-export-mark" aria-hidden="true">表</span>
                                <span>
                                    <b>{L.exportExcel}</b>
                                    <p>{L.dataExcelNote}</p>
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
                    {(panel === 'about' || panel === 'disclaimer') && (
                        <CompanyPage L={L} kind={panel} onBack={() => setPanel('none')} />
                    )}
                    {panel === 'language' && (
                        <>
                            <SubpageHead L={L} title={L.language} onBack={() => setPanel('none')} />
                            <div className="ledger-pick-card">
                                {localeChoices.map((item) => (
                                    <button key={item.id} type="button" className={locale === item.id ? 'is-on' : ''} onClick={() => writeBook({ ...book, locale: item.id, localeChosen: true })}>
                                        <span className="ledger-pick-code">{item.title}</span>
                                        {locale === item.id && <span className="ledger-pick-check" aria-hidden="true">✓</span>}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                    {panel === 'reminder' && (
                        <>
                            <SubpageHead L={L} title={L.reminderTitle} onBack={() => setPanel('none')} />
                            <div className="ledger-remind-card">
                                <b>{L.reminderDaily}</b>
                                <button
                                    type="button"
                                    className={book.dailyReminder ? 'ledger-switch is-on' : 'ledger-switch'}
                                    role="switch"
                                    aria-checked={book.dailyReminder}
                                    onClick={() => { void setDailyReminder(!book.dailyReminder); }}
                                >
                                    <i />
                                </button>
                            </div>
                            <label className="ledger-label" htmlFor="ledger-reminder-time">{L.reminderTime}</label>
                            <input
                                id="ledger-reminder-time"
                                className="ledger-remind-time"
                                type="time"
                                value={clockText(book.reminderHour ?? 21, book.reminderMinute ?? 30)}
                                onChange={(event) => setReminderClock(event.target.value)}
                            />
                            <p className="ledger-remind-note">{L.reminderNote}</p>
                            {notifyDenied && <p className="ledger-remind-warn">{L.reminderDenied}</p>}
                        </>
                    )}
                    {panel === 'currency' && (
                        <>
                            <SubpageHead L={L} title={L.currency} onBack={() => setPanel('none')} />
                            <div className="ledger-pick-card">
                                {currencyOptions.map((item) => (
                                    <button key={item} type="button" className={book.currency === item ? 'is-on' : ''} onClick={() => writeBook({ ...book, currency: item })}>
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
                            <header className="ledger-subhead">
                                <button type="button" className="ledger-back-btn" onClick={() => setPanel('none')} aria-label={L.back}>
                                    <svg viewBox="0 0 24 24" aria-hidden="true">
                                        <path d="M19 12H5M12 19 5 12 12 5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                                <h1>{L.categories}</h1>
                                <button type="button" className="ledger-head-action" onClick={() => setEditingCategories((on) => !on)}>{editingCategories ? L.done : L.edit}</button>
                            </header>
                            <CategoryGrid
                                names={book.categories}
                                marks={book.categoryMarks}
                                editing={editingCategories}
                                canRemove={book.categories.length > 1}
                                addLabel={L.add}
                                onAdd={() => openCategoryForm('manage')}
                                onRemove={removeCategory}
                            />
                        </>
                    )}
                    {panel === 'categoryForm' && (
                        <>
                            <SubpageHead L={L} title={L.newCategory} onBack={closeCategoryForm} />
                            <CategoryMarkPicker selected={categoryMark} onSelect={setCategoryMark} />
                            <label className="ledger-label" htmlFor="ledger-new-category">{L.name}</label>
                            <input id="ledger-new-category" className="ledger-field" value={categoryName} placeholder={L.newCategory} onChange={(event) => setCategoryName(event.target.value)} />
                            <button type="button" className="ledger-pill" onClick={addCategory} disabled={!categoryName.trim() || book.categories.includes(categoryName.trim())}>{L.add}</button>
                        </>
                    )}
                    {panel === 'year' && (
                        <YearReportPanel
                            L={L}
                            year={reportYear}
                            entries={visibleEntries.filter((entry) => !entry.id.startsWith('sample-'))}
                            ledgerEntries={book.entries}
                            accounts={book.accounts}
                            marks={book.categoryMarks}
                            mark={mark}
                            onPrev={() => setReportYear((value) => value - 1)}
                            onNext={() => setReportYear((value) => Math.min(value + 1, new Date().getFullYear()))}
                            nextDisabled={reportYear >= new Date().getFullYear()}
                            onOpen={openYearFeed}
                            onEntry={openYearEntry}
                            onAdd={openFresh}
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
                    {panel === 'none' && active === 'accounts' && (
                        <>
                            <div className="ledger-topbar">
                                <h1>
                                    {L.sparks}
                                    {book.sparks.length > 0 && <span className="ledger-spark-count">{book.sparks.length}</span>}
                                </h1>
                            </div>
                            <button type="button" className="ledger-spark-compose" onClick={() => openSpark(undefined, 'idea')}>
                                <span>{L.sparkHint}</span>
                                <b>{L.sparkPlaceholder}</b>
                            </button>
                            {!wroteSummary && (
                                <button type="button" className="ledger-spark-summary" onClick={() => openSpark(undefined, 'summary')}>
                                    <span>
                                        <b>{L.sparkSummary}</b>
                                        <small>{L.today}</small>
                                    </span>
                                    <em>{L.sparkPlaceholder}</em>
                                </button>
                            )}
                            <div className="ledger-spark-grid">
                                {sparkKindOrder.map((kind) => {
                                    const mine = sparkOrdered.filter((spark) => spark.kind === kind);
                                    const preview = mine[0] ? mine[0].body.replace(/\n/g, ' ') : paperCue(locale, kind).hint;
                                    return (
                                        <button key={kind} type="button" className="ledger-spark-kind" onClick={() => openSparkShelf(kind)}>
                                            <span>
                                                <b>{sparkKindLabel(kind, L)}</b>
                                                <em>{mine.length}</em>
                                            </span>
                                            <small className={mine.length ? '' : 'is-empty'}>{preview}</small>
                                        </button>
                                    );
                                })}
                            </div>
                            <label className="ledger-spark-lookup">
                                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M16 16l4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
                                <input value={sparkHomeQuery} placeholder={L.sparkSearch} onChange={(event) => setSparkHomeQuery(event.target.value)} />
                            </label>
                            <section className="ledger-spark-preview">
                                <h2>{L.sparkNotes}</h2>
                                {sparkMatched.length === 0 && !sparkNeedle ? (
                                    <div className="ledger-spark-starters">
                                        {(['diary', 'thought', 'summary'] as const).map((kind) => (
                                            <button key={kind} type="button" onClick={() => openSpark(undefined, kind)}>
                                                <b>{sparkKindLabel(kind, L)}</b>
                                                <span>{paperCue(locale, kind).hint}</span>
                                            </button>
                                        ))}
                                    </div>
                                ) : sparkMatched.length > 0 ? (
                                    <div className="ledger-spark-briefs">
                                        {sparkMatched.slice(0, 5).map((spark, index, shown) => (
                                            <React.Fragment key={spark.id}>
                                                <SparkBrief spark={spark} locale={locale} L={L} onOpen={() => openSpark(spark)} />
                                                {(index < shown.length - 1 || sparkMatched.length > 5) && <div className="ledger-spark-brief-line" />}
                                            </React.Fragment>
                                        ))}
                                        {sparkMatched.length > 5 && (
                                            <button type="button" className="ledger-spark-rest" onClick={openSparkBoard}>
                                                <b>{L.filterAll}</b>
                                                <em>{sparkMatched.length}</em>
                                                <span aria-hidden="true">›</span>
                                            </button>
                                        )}
                                    </div>
                                ) : null}
                            </section>
                        </>
                    )}
                    {panel === 'sparkShelf' && (
                        <>
                            <SubpageHead L={L} title={sparkKindLabel(sparkShelfKind, L)} onBack={() => setPanel('none')} />
                            <button type="button" className="ledger-pill" onClick={() => openSpark(undefined, sparkShelfKind)}>{L.sparkPlaceholder}</button>
                            <div className="ledger-spark-board">
                                <label className="ledger-spark-find">
                                    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M16 16l4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
                                    <input value={sparkQuery} placeholder={L.sparkSearch} onChange={(event) => setSparkQuery(event.target.value)} />
                                </label>
                                <div className="ledger-spark-mode" role="tablist" aria-label={L.sparkTimeline}>
                                    <button type="button" className={!sparkTimeline ? 'is-on' : ''} onClick={() => setSparkTimeline(false)}>{L.sparkNotes}</button>
                                    <button type="button" className={sparkTimeline ? 'is-on' : ''} onClick={() => setSparkTimeline(true)}>{L.sparkTimeline}</button>
                                </div>
                                <div
                                    className="ledger-spark-filters"
                                    role="tablist"
                                    aria-label={L.sparks}
                                    ref={(node) => {
                                        if (!node || node.dataset.bound === '1') return;
                                        node.dataset.bound = '1';
                                        node.addEventListener('wheel', (event) => {
                                            if (node.scrollWidth <= node.clientWidth) return;
                                            if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
                                            node.scrollLeft += event.deltaX;
                                            event.preventDefault();
                                        }, { passive: false });
                                    }}
                                    onPointerDown={sparkLaneDown}
                                >
                                    {(['all', 'favorite'] as const).map((item) => (
                                        <button key={item} type="button" className={sparkFilter === item ? 'is-on' : ''} onClick={() => setSparkFilter(item)}>
                                            {item === 'all' ? L.filterAll : `★ ${L.sparkFavorite}`}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {sparkTimeline ? sparkTimelineDays(visibleSparks, book.entries, sparkQuery, sparkFilter === 'all').map((day) => (
                                <section key={day} className="ledger-spark-day">
                                    <h2>{day === todayIso() ? L.dayToday : day === yesterdayIso() ? L.dayYesterday : day}</h2>
                                    {visibleSparks.filter((spark) => spark.writtenOn === day).map((spark) => (
                                        <SparkCard key={spark.id} spark={spark} L={L} onOpen={() => openSpark(spark)} onFavorite={() => toggleSparkFavorite(spark)} />
                                    ))}
                                    {sparkFilter === 'all' && book.entries.filter((entry) => entry.date === day && !entry.id.startsWith('transfer-') && entryMatchesQuery(entry, sparkQuery)).map((entry) => (
                                        <button key={entry.id} type="button" className="ledger-spark-entry" onClick={() => openEntry(entry)}>
                                            <CategoryBadge mark={categoryKey(entry.category, book.categoryMarks)} small />
                                            <b>{entry.title}</b>
                                            <span>{book.hideAmounts ? '***' : `${entry.direction === 'out' ? '−' : '+'}${money(entry.amount, mark)}`}</span>
                                        </button>
                                    ))}
                                </section>
                            )) : sparkGroups(visibleSparks, L).map((group) => (
                                <section key={group.day} className="ledger-spark-day">
                                    <h2>{group.label}</h2>
                                    {group.items.map((spark) => (
                                        <SparkCard key={spark.id} spark={spark} L={L} onOpen={() => openSpark(spark)} onFavorite={() => toggleSparkFavorite(spark)} />
                                    ))}
                                </section>
                            ))}
                        </>
                    )}
                    {panel === 'sparkBoard' && (
                        <>
                            <SubpageHead L={L} title={L.sparkNotes} onBack={() => setPanel('none')} />
                            <label className="ledger-spark-lookup">
                                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M16 16l4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
                                <input value={sparkBoardQuery} placeholder={L.sparkSearch} onChange={(event) => setSparkBoardQuery(event.target.value)} />
                            </label>
                            {sparkGroups(sparkBoardListed, L).map((group) => (
                                <section key={group.day} className="ledger-spark-board-day">
                                    <h2>{group.label}</h2>
                                    <div className="ledger-spark-briefs">
                                        {group.items.map((spark, index) => (
                                            <React.Fragment key={spark.id}>
                                                <SparkBrief spark={spark} locale={locale} L={L} onOpen={() => openSpark(spark)} />
                                                {index < group.items.length - 1 && <div className="ledger-spark-brief-line" />}
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </section>
                            ))}
                        </>
                    )}
                    {panel === 'spark' && (
                        <div className="ledger-paper">
                            <div className="ledger-paper-head">
                                <button type="button" className="ledger-paper-icon" aria-label={L.back} onClick={closeSpark}>
                                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                </button>
                                <h1>{sparkKindLabel(sparkKind, L)}</h1>
                                <button type="button" className={`ledger-paper-icon${sparkFavorite ? ' is-on' : ''}`} aria-label={L.sparkFavorite} onClick={() => setSparkFavorite((value) => !value)}>
                                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.6l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.2 7.2 18.5l.9-5.4L4.2 9.3l5.4-.8z" fill={sparkFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>
                                </button>
                            </div>
                            <div className="ledger-paper-strip" role="tablist" aria-label={L.sparkIdea}>
                                {sparkKindOrder.map((item) => (
                                    <button key={item} type="button" className={sparkKind === item ? 'is-on' : ''} onClick={() => setSparkKind(item)}>
                                        <SparkKindIcon kind={item} />
                                        {sparkKindLabel(item, L)}
                                    </button>
                                ))}
                            </div>
                            <div className="ledger-paper-scroll">
                                <section className="ledger-paper-sheet">
                                    <DateField id="spark-date" label={L.date} locale={locale} value={sparkDate} max={todayIso()} onChange={setSparkDate} L={L} face="sheet" />
                                    {sparkImage && (
                                        <div className="ledger-paper-shot">
                                            <button type="button" aria-label={L.sparkPicture} onClick={() => setPictureLook(sparkImage)}>
                                                <img src={sparkImage} alt="" />
                                            </button>
                                            <button type="button" className="ledger-paper-shot-x" aria-label={L.sparkPictureRemove} onClick={() => setSparkImage('')}>×</button>
                                        </div>
                                    )}
                                    {!sparkBody.trim() && (
                                        <>
                                            <p className="ledger-paper-lead">{paperCue(locale, sparkKind).lead}</p>
                                            <div className="ledger-paper-cues">
                                                {paperCue(locale, sparkKind).lines.map((line) => (
                                                    <button key={line} type="button" onClick={() => setSparkBody(line)}>{line}</button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                    <div className="ledger-paper-rule">
                                        <span aria-hidden="true"><i /><i /><i /></span>
                                        <em aria-hidden="true" />
                                        <PaperWrite value={sparkBody} placeholder={paperCue(locale, sparkKind).hint} onChange={setSparkBody} />
                                    </div>
                                    {sparkBody.trim() && <p className="ledger-paper-tally">{paperCue(locale, sparkKind).tally(sparkBody.length)}</p>}
                                </section>
                                {parseSparkTags(sparkTags).length > 0 && (
                                    <div className="ledger-paper-chips">
                                        {parseSparkTags(sparkTags).map((chip) => <span key={chip}>#{chip}</span>)}
                                    </div>
                                )}
                            </div>
                            <div className="ledger-paper-tools">
                                <div className="ledger-paper-tool-row">
                                    <label className="ledger-paper-photo" aria-label={L.sparkPicture}>
                                        <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" /><circle cx="9" cy="10" r="1.6" fill="currentColor" /><path d="M4.5 16.5l4.2-4 3.2 3 2.2-2 5.4 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>
                                        <input type="file" accept="image/*" hidden onChange={(event) => {
                                            const file = event.target.files?.[0];
                                            if (file) void shrinkPicture(file).then((url) => { if (url) setSparkImage(url); });
                                            event.target.value = '';
                                        }} />
                                    </label>
                                    <input className="ledger-paper-tags" value={sparkTags} placeholder={L.sparkTagHint} onChange={(event) => setSparkTags(event.target.value)} />
                                </div>
                                <button type="button" className="ledger-pill" onClick={saveSpark} disabled={!sparkBody.trim()}>{L.save}</button>
                                {sparkId && <button type="button" className="ledger-paper-delete" onClick={() => deleteSpark(sparkId)}>{L.deleteEntry}</button>}
                            </div>
                        </div>
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
                                entries={visibleEntries.filter((entry) => !entry.id.startsWith('sample-'))}
                                mark={mark}
                                marks={book.categoryMarks}
                                annual={statsAnnual}
                                kind={statsKind}
                                month={statsMonth}
                                onAnnual={setStatsAnnual}
                                onKind={setStatsKind}
                                onMonth={setStatsMonth}
                                onOpen={openStatsFeed}
                                onAdd={openNewRecord}
                            />
                            {visibleEntries.every((entry) => entry.id.startsWith('sample-')) && (
                                <div className="ledger-home-banners">
                                    <button type="button" className="ledger-home-banner is-wash" onClick={openNewRecord}>
                                        <span>
                                            <b>{L.bannerEntryTitle}</b>
                                            <p>{L.bannerEntryNote}</p>
                                        </span>
                                        <img className="ledger-home-banner-art" src={bannerBars} alt="" />
                                    </button>
                                    <button type="button" className="ledger-home-banner" onClick={openBudgetPanel}>
                                        <span>
                                            <b>{L.bannerBudgetTitle}</b>
                                            <p>{L.bannerBudgetNote}</p>
                                        </span>
                                        <img className="ledger-home-banner-art" src={bannerRing} alt="" />
                                    </button>
                                </div>
                            )}
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
                                    <div className="ledger-panel-head ledger-review-head">
                                        <h2>{L.toReview} · {reviewQueue.length}</h2>
                                        <button type="button" className="ledger-mark-all" onClick={() => markReviewed(reviewQueue.map((entry) => entry.id))}>{L.markAllReviewed}</button>
                                    </div>
                                    <ul className="ledger-tx-list">
                                        {reviewQueue.map((entry) => (
                                            <TxRow key={entry.id} L={L} entry={entry} accounts={book.accounts} marks={book.categoryMarks} mark={mark} onOpen={openEntry} onToggle={toggleChecked} />
                                        ))}
                                    </ul>
                                </section>
                            )}
                            <section className="ledger-panel">
                                <div className="ledger-panel-head">
                                    <h2>{L.recurringTitle}</h2>
                                    {recurringItems.length > 0
                                        ? <span className="ledger-topbar-meta">{L.recurringHint}</span>
                                        : <button type="button" onClick={openNewRecord}>{L.entryNew}</button>}
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
                        </>
                    )}

                    {panel === 'none' && active === 'transactions' && (
                        <>
                            <div className="ledger-topbar">
                                <h1>{L.transactions}</h1>
                                <button type="button" className="ledger-chip-btn" onClick={() => setPanel('filter')}>{periodLabel}</button>
                            </div>
                            <div className="ledger-flow" role="group" aria-label={L.transactions}>
                                <button type="button" className={txDirection === 'out' ? 'is-on is-down' : 'is-down'} onClick={() => setTxDirection(txDirection === 'out' ? 'all' : 'out')}>
                                    <span>{L.periodSpend}</span>
                                    <MoneyAmount value={flowSpend} mark={mark} size="md" />
                                </button>
                                <button type="button" className={txDirection === 'in' ? 'is-on is-up' : 'is-up'} onClick={() => setTxDirection(txDirection === 'in' ? 'all' : 'in')}>
                                    <span>{L.periodIncome}</span>
                                    <MoneyAmount value={flowIncome} mark={mark} size="md" />
                                </button>
                                <button type="button" className={`${txDirection === 'all' ? 'is-on ' : ''}${flowBalance >= 0 ? 'is-up' : 'is-down'}`} onClick={() => setTxDirection('all')}>
                                    <span>{L.periodBalance}</span>
                                    <MoneyAmount value={flowBalance} mark={mark} size="md" signed />
                                </button>
                            </div>
                            <section className="ledger-toolbar" aria-label={L.filter}>
                                <label className="ledger-search">
                                    <svg viewBox="0 0 24 24" aria-hidden="true">
                                        <circle cx="11" cy="11" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.8" />
                                        <path d="M15.6 15.6 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                    </svg>
                                    <input value={search} placeholder={L.searchPlaceholder} onChange={(event) => setSearch(event.target.value)} aria-label={L.searchAria} />
                                </label>
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
                                            marks={book.categoryMarks}
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
                                {shownEntries.length === 0 ? (
                                    <div className="ledger-empty">
                                        <span className="ledger-empty-mark" aria-hidden="true">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M7.2 3.8h6.4L18.8 9v10.2a1.4 1.4 0 0 1-1.4 1.4H7.2a1.4 1.4 0 0 1-1.4-1.4V5.2a1.4 1.4 0 0 1 1.4-1.4z" />
                                                <path d="M13.4 3.8V9h5.4" />
                                                <path d="M8.6 12.6h6.8M8.6 16h6.8" />
                                            </svg>
                                        </span>
                                        <p>{L.txEmpty}</p>
                                        <button type="button" className="ledger-pill" onClick={openNewRecord}>{L.entryNew}</button>
                                    </div>
                                ) : (
                                    (txView === 'calendar' && calendarDay
                                        ? [calendarDay]
                                        : txDays
                                    ).map((day) => (
                                        <div key={day}>
                                            {txView === 'list' && <p className="ledger-day-label">{dayLabel(day, locale, L)}</p>}
                                            <ul className="ledger-tx-list">
                                                {shownEntries.filter((entry) => entry.date === day).map((entry) => (
                                                    <TxRow key={entry.id} L={L} entry={entry} accounts={book.accounts} marks={book.categoryMarks} mark={mark} onOpen={openEntry} onToggle={toggleChecked} />
                                                ))}
                                            </ul>
                                        </div>
                                    ))
                                )}
                            </section>
                        </>
                    )}

                    {panel === 'accountsBoard' && (
                        <>
                            <SubpageHead L={L} title={`${L.accounts} (${ownAccounts.length})`} onBack={() => setPanel(accountsReturn.current)} />
                            {ownAccounts.length === 0 ? (
                                <AccountIntro L={L} />
                            ) : (
                                <>
                                    <WorthSummary
                                        L={L}
                                        mark={mark}
                                        worth={ownWorth}
                                        delta={ownWorth - ownWorthPrior}
                                        prior={ownWorthPrior}
                                        span={worthSpan}
                                        onSpan={setWorthSpan}
                                        onOpen={() => setPanel('worth')}
                                    />
                                    {ownMonthMoves.length > 0 && (
                                        <section className="ledger-account-flow">
                                            <button type="button" className="ledger-account-flow-head" onClick={() => openMonthAccounts()}>
                                                <span className="ledger-account-flow-title">
                                                    {L.accountMonthFlow}
                                                    <span className="ledger-chevron" aria-hidden="true">›</span>
                                                </span>
                                                <span className="ledger-account-flow-gutter" aria-hidden="true" />
                                                <span className="is-out">
                                                    <b>{L.expense}</b>
                                                    <MoneyAmount value={ownMonthOut} mark={mark} size="sm" />
                                                </span>
                                                <span>
                                                    <b>{L.income}</b>
                                                    <MoneyAmount value={ownMonthIn} mark={mark} size="sm" />
                                                </span>
                                                <span>
                                                    <b>{L.accountNet}</b>
                                                    <MoneyAmount value={ownMonthIn - ownMonthOut} mark={mark} size="sm" signed />
                                                </span>
                                            </button>
                                            {ownAccounts.filter((account) => account.archived !== true && ownMonthMoves.some((entry) => entry.accountId === account.id)).map((account) => {
                                                const mine = ownMonthMoves.filter((entry) => entry.accountId === account.id);
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
                                        const group = ownAccounts.filter((account) => normalizeAccountKind(account.kind) === kind && account.archived !== true);
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
                                    {ownAccounts.some((account) => account.archived) && (
                                        <section className="ledger-account-group">
                                            <div className="ledger-account-group-head">
                                                <h2>{L.archivedTitle}</h2>
                                            </div>
                                            {ownAccounts.filter((account) => account.archived).map((account, index) => (
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
                            <button type="button" className="ledger-pill" onClick={() => openAccount()}>{L.addAccount}</button>
                            {ownAccounts.length > 0 && <SampleNote L={L} book={book} onClear={clearSample} />}
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
                            <RecordMarks days={loggedDayCount} L={L} onAdd={openNewRecord} />
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
                                <button type="button" className="ledger-row-link" onClick={() => writeBook({ ...book, hideAmounts: !book.hideAmounts })}>
                                    <span>{L.hideAmounts}</span>
                                    <span className="ledger-row-value">{book.hideAmounts ? L.hideAmountsOn : L.hideAmountsOff}</span>
                                </button>
                                <div className="ledger-settings-divider" role="presentation" />
                                <SettingsLink title={L.language} value={localeChoices.find((item) => item.id === locale)?.title ?? locale} onClick={() => setPanel('language')} />
                                <div className="ledger-settings-divider" role="presentation" />
                                <SettingsLink title={L.currency} value={`${book.currency}  ${mark}`} onClick={() => setPanel('currency')} />
                                <div className="ledger-settings-divider" role="presentation" />
                                <SettingsLink title={L.reminderTitle} value={book.dailyReminder ? clockText(book.reminderHour ?? 21, book.reminderMinute ?? 30) : L.reminderOff} onClick={() => setPanel('reminder')} />
                            </section>
                            <section className="ledger-card ledger-settings">
                                <h2 className="ledger-settings-kicker">{L.meData}</h2>
                                <SettingsLink title={L.cloudTitle} value={cloudWhen || L.cloudNone} onClick={() => setPanel('cloud')} />
                                <div className="ledger-settings-divider" role="presentation" />
                                <SettingsLink title={L.exportData} onClick={() => setPanel('export')} />
                                <div className="ledger-settings-divider" role="presentation" />
                                <SettingsLink title={L.importData} onClick={() => importFileRef.current?.click()} />
                                <div className="ledger-settings-divider" role="presentation" />
                                <SettingsLink title={L.removedTitle} value={(book.removed ?? []).length > 0 ? String(book.removed?.length) : undefined} onClick={() => setPanel('removed')} />
                                <div className="ledger-settings-divider" role="presentation" />
                                <SettingsLink title={L.clearBook} danger onClick={() => setClearAsk(true)} />
                            </section>
                            <section className="ledger-card ledger-settings">
                                <SettingsLink title={L.about} onClick={() => setPanel('about')} />
                                <div className="ledger-settings-divider" role="presentation" />
                                <SettingsLink title={L.disclaimer} onClick={() => setPanel('disclaimer')} />
                                <div className="ledger-settings-divider" role="presentation" />
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
                    <button type="button" className="ledger-fab" aria-label={L.fabLabel} onClick={openNewRecord}>
                        <span className="ledger-pen" aria-hidden="true">
                            <svg viewBox="0 0 34 34">
                                <path className="ledger-pen-line" d="M8 24 Q14 22 24 12" />
                                <g className="ledger-pen-body">
                                    <g transform="rotate(48)">
                                        <rect x="-13" y="-2.1" width="11" height="4.2" rx="2" fill="#fff" />
                                        <path d="M0 0 L-3.4 -2.3 L-3.4 2.3 Z" fill="#fff" />
                                    </g>
                                </g>
                            </svg>
                        </span>
                    </button>
                )}
                </div>

                {exportNote && <p className="ledger-toast" role="status">{exportNote}</p>}

                {pictureLook && (
                    <div
                        className={`ledger-photo-view${picturePull > 0 ? ' is-pulling' : ''}`}
                        role="dialog"
                        aria-modal="true"
                        aria-label={L.sparkPicture}
                        style={{ background: `rgba(11, 5, 29, ${Math.max(0.2, 1 - picturePull / 320)})` }}
                        onPointerDown={pullPicture}
                        onClick={closePicture}
                    >
                        <div className="ledger-photo-sheet" style={{ transform: `translateY(${picturePull}px)` }}>
                            <button type="button" className="ledger-photo-view-close" onClick={() => setPictureLook('')}>{`×  ${L.done}`}</button>
                            <img src={pictureLook} alt="" onClick={(event) => event.stopPropagation()} />
                        </div>
                    </div>
                )}

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

                {cloudAsk && (
                    <div className="ledger-modal-backdrop" role="presentation" onClick={() => setCloudAsk(false)}>
                        <div className="ledger-modal" role="dialog" aria-modal="true" aria-labelledby="ledger-cloud-title" onClick={(event) => event.stopPropagation()}>
                            <h2 id="ledger-cloud-title">{L.cloudBring}</h2>
                            <p>{L.cloudBringAsk}</p>
                            <div className="ledger-modal-actions">
                                <button type="button" onClick={() => setCloudAsk(false)}>{L.cancel}</button>
                                <button type="button" className="is-danger" onClick={() => { setCloudAsk(false); flashExportNote(L.cloudBrought); }}>{L.cloudBring}</button>
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
                                <i className="ledger-tab-chip">
                                    <i className="ledger-tab-mark" style={{ WebkitMaskImage: `url(${tab.icon})`, maskImage: `url(${tab.icon})` }} />
                                </i>
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
    marks,
    annual,
    kind,
    month,
    onAnnual,
    onKind,
    onMonth,
    onOpen,
    onAdd,
}: {
    L: Copy;
    entries: Entry[];
    mark: string;
    marks?: Record<string, string>;
    annual: boolean;
    kind: StatsKind;
    month: string;
    onAnnual: (annual: boolean) => void;
    onKind: (kind: StatsKind) => void;
    onMonth: (month: string) => void;
    onOpen: (from: string, to: string, category: string, title: string) => void;
    onAdd: () => void;
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
            <div className="ledger-segment" role="tablist" aria-label={L.statsMonthly}>
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
            <button type="button" className={total > 0 ? 'ledger-stats-total' : 'ledger-stats-total is-quiet'} onClick={() => onOpen(span.start, span.end, '', '')}>
                <MoneyAmount value={total} mark={mark} size="md" />
                <span>({fillCopy(L.statsCount, { count: String(inWindow.length), kind: kindName })})</span>
            </button>
            <h2 className={total > 0 ? undefined : 'is-quiet'}>{fillCopy(annual ? L.statsCompareYear : L.statsCompareMonth, { kind: kindName })}</h2>
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
                            className={[selected ? 'is-on' : '', amount <= 0 ? 'is-empty' : ''].filter(Boolean).join(' ')}
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
            {total === 0 ? (
                <p className="ledger-stats-empty">
                    <img className="ledger-stats-empty-mark" src={emptyNote} alt="" />
                    <span>{L.statsEmpty}</span>
                    <button type="button" onClick={onAdd}>{L.statsEmptyAdd}</button>
                </p>
            ) : (
                <>
                    <h2>{fillCopy(L.statsCompose, { when, kind: kindName })}</h2>
                    {mix.map((item) => (
                        <button key={item.name} type="button" className="ledger-mix" onClick={() => onOpen(span.start, span.end, item.name, '')}>
                            <span className="ledger-mix-head">
                                <CategoryBadge mark={categoryKey(item.name, marks)} small />
                                <b>{item.name}</b>
                                <MoneyAmount value={item.amount} mark={mark} size="sm" />
                                <span aria-hidden="true">›</span>
                            </span>
                            <span className="ledger-mix-track" aria-hidden="true"><i style={{ width: `${Math.max(6, (item.amount / (mix[0]?.amount || 1)) * 100)}%` }} /></span>
                        </button>
                    ))}
                    <h2>{fillCopy(L.statsRank, { when, kind: kindName })}</h2>
                    {rank.map((item, index) => (
                        <button key={item.name} type="button" className="ledger-rank-row" onClick={() => onOpen(span.start, span.end, '', item.name)}>
                            <span className="ledger-rank-no">{index + 1}</span>
                            <span className="ledger-tx-icon" style={{ background: `${sliceColors[index % sliceColors.length]}33` }}>{item.name.slice(0, 1)}</span>
                            <b>{item.name}</b>
                            <MoneyAmount value={item.amount} mark={mark} size="sm" />
                            <span aria-hidden="true">›</span>
                        </button>
                    ))}
                </>
            )}
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
    marks,
    active,
    prevByCategory,
    onPick,
}: {
    L: Copy;
    parts: { name: string; amount: number; color: string }[];
    total: number;
    mark: string;
    marks?: Record<string, string>;
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
                                <CategoryBadge mark={categoryKey(part.name, marks)} small />
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

function TxRow({ L, entry, accounts, marks, mark, onOpen, onToggle }: { L: Copy; entry: Entry; accounts: Account[]; marks?: Record<string, string>; mark: string; onOpen: (entry: Entry) => void; onToggle: (id: string) => void }) {
    const account = accounts.find((item) => item.id === entry.accountId);
    const value = signedValue(entry);
    return (
        <li className="ledger-tx">
            <CategoryBadge mark={categoryKey(entry.category, marks)} row />
            <button type="button" className="ledger-tx-main" onClick={() => onOpen(entry)}>
                <b>{entry.title}</b>
                <span>{[entry.category, account?.name?.trim() ?? '', entry.shared ? L.familyTag : ''].filter(Boolean).join(' · ')}</span>
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

function AccountIntro({ L }: { L: Copy }) {
    const points = [
        ['chart', L.accountIntroSumTitle, L.accountIntroSumBody],
        ['lock', L.accountIntroLocalTitle, L.accountIntroLocalBody],
        ['card', L.accountIntroNameTitle, L.accountIntroNameBody],
    ] as const;
    return (
        <div className="ledger-account-intro">
            <div className="ledger-account-head">
                <i aria-hidden="true">
                    <svg viewBox="0 0 24 24"><path d="M3 7h18v10H3zM3 11h18M7 15h4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
                </i>
                <div>
                    <b>{L.accountIntroTitle}</b>
                    <span>{L.accountIntroBody}</span>
                </div>
            </div>
            {points.map(([icon, title, body]) => (
                <div key={title} className="ledger-account-point">
                    <i aria-hidden="true">{icon === 'chart' ? <svg viewBox="0 0 24 24"><path d="M5 19V9M12 19V5M19 19v-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg> : icon === 'lock' ? <svg viewBox="0 0 24 24"><path d="M8 11V8a4 4 0 0 1 8 0v3M7 11h10v8H7z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg> : <svg viewBox="0 0 24 24"><path d="M4 8h16v9H4zM4 12h16M8 16h3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>}</i>
                    <div>
                        <b>{title}</b>
                        <span>{body}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}

function CompanyPage({ L, kind, onBack }: { L: Copy; kind: 'about' | 'disclaimer'; onBack: () => void }) {
    const lines = (text: string) => text.split('\n').filter(Boolean);
    return (
        <>
            <SubpageHead L={L} title={kind === 'about' ? L.about : L.disclaimer} onBack={onBack} />
            {kind === 'about' ? (
                <>
                    <section className="ledger-card ledger-company">
                        <h2>SpendLogBook</h2>
                        <p>{L.aboutLead}</p>
                    </section>
                    <section className="ledger-card ledger-company">
                        <h2>{L.aboutDoesTitle}</h2>
                        <ul className="ledger-note-list">{lines(L.aboutDoes).map((line) => <li key={line}>{line}</li>)}</ul>
                    </section>
                    <section className="ledger-card ledger-company">
                        <h2>{L.aboutNotTitle}</h2>
                        <ul className="ledger-note-list">{lines(L.aboutNot).map((line) => <li key={line}>{line}</li>)}</ul>
                    </section>
                </>
            ) : (
                <section className="ledger-card ledger-company">
                    {lines(L.disclaimerBody).map((line) => <p key={line}>{line}</p>)}
                </section>
            )}
            <section className="ledger-card ledger-company">
                <p><b>{L.aboutOperator}</b><br />LIGACAO VITAL - COMERCIO E SERVICOS, (SU), LDA</p>
                <p><b>{L.aboutMail}</b><br /><a className="ledger-mail" href="mailto:office@ligacaovital.com">office@ligacaovital.com</a></p>
                <p>{L.aboutWrite}</p>
                <p>© 2026 LIGACAO VITAL - COMERCIO E SERVICOS, (SU), LDA. All rights reserved.</p>
            </section>
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
    marks,
    mark,
    onPrev,
    onNext,
    nextDisabled,
    onOpen,
    onEntry,
    onAdd,
    onBack,
}: {
    L: Copy;
    year: number;
    entries: Entry[];
    ledgerEntries: Entry[];
    accounts: { id: string; name: string }[];
    marks?: Record<string, string>;
    mark: string;
    onPrev: () => void;
    onNext: () => void;
    nextDisabled: boolean;
    onOpen: (kind: 'out' | 'in', month?: number, category?: string, title?: string, accountId?: string) => void;
    onEntry: (entry: Entry) => void;
    onAdd: (direction: Direction) => void;
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
                {slices.length === 0 ? (
                    <p className="ledger-year-empty">
                        <span>{L.statsEmpty}</span>
                        <button type="button" onClick={() => onAdd(kind)}>{L.statsEmptyAdd}</button>
                    </p>
                ) : (
                    <>
                        <YearDonut parts={slices.map((slice, index) => ({ name: slice.name, amount: slice.amount, color: sliceColors[index % sliceColors.length] }))} />
                        {slices.map((slice, index) => {
                            const titles = groupYear(picked.filter((entry) => entry.category === slice.name), (entry) => entry.title, (entry) => entry.title);
                            const open = openCategory === slice.id;
                            return (
                                <div key={slice.id} className="ledger-year-cat">
                                    <div className="ledger-year-cat-row">
                                        <button type="button" className={open ? 'is-open' : ''} onClick={() => setOpenCategory(open ? '' : slice.id)}>
                                            <CategoryBadge mark={categoryKey(slice.name, marks)} small />
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
                                                    <CategoryBadge mark={categoryKey(slice.name, marks)} small />
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

function revealGap(id: string) {
    const node = document.getElementById(id);
    if (!node) return;
    const previous = node.previousElementSibling;
    const target = previous instanceof HTMLElement && previous.classList.contains('ledger-label') ? previous : node;
    const scroller = node.closest('.ledger-body');
    if (!(scroller instanceof HTMLElement)) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
    }
    const frame = scroller.getBoundingClientRect();
    const head = target.getBoundingClientRect();
    const foot = node.getBoundingClientRect();
    const inView = head.top >= frame.top && foot.bottom <= frame.bottom - 8;
    if (inView) return;
    scroller.scrollTo({ top: Math.max(0, head.top - frame.top + scroller.scrollTop - 12), behavior: 'smooth' });
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
    onTransfer,
    onAddCategory,
    onAddOtherCategory,
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
    onTransfer: () => void;
    onAddCategory: () => void;
    onAddOtherCategory: () => void;
}) {
    const solved = solveMoney(draft.amount);
    const otherSolved = solveMoney(draft.otherAmount);
    const [tried, setTried] = useState(false);
    const refunded = draft.id ? book.entries.some((entry) => entry.refundOf === draft.id) : false;
    const source = book.entries.find((entry) => entry.id === draft.id);
    const accounts = openAccountList(book.accounts, draft.accountId);
    const ownAccount = accounts.some((account) => account.id === draft.accountId && !account.id.startsWith('sample-'));
    const gaps = [
        !(solved != null && solved > 0) ? 'entry-amount' : '',
        !draft.title.trim() ? 'entry-title' : '',
        draft.splitOn && !draft.id && !(otherSolved != null && otherSolved > 0) ? 'entry-other' : '',
        !draft.date ? 'entry-date' : '',
        !draft.id && !ownAccount ? 'entry-account' : '',
    ].filter(Boolean);
    const mark = (id: string) => tried && gaps.includes(id);
    return (
        <>
            <SubpageHead L={L} title={draft.id ? L.entryEdit : L.entryNew} onBack={onBack} />
            <div className="ledger-choice-row" role="tablist" aria-label={L.direction}>
                <button type="button" role="tab" aria-selected={draft.direction === 'out'} className={draft.direction === 'out' ? 'is-on' : ''} onClick={() => onChange({ ...draft, direction: 'out' })}>{L.expense}</button>
                <button type="button" role="tab" aria-selected={draft.direction === 'in'} className={draft.direction === 'in' ? 'is-on' : ''} onClick={() => onChange({ ...draft, direction: 'in' })}>{L.income}</button>
                <button type="button" onClick={onTransfer}>{L.transfer}</button>
            </div>
            <label className="ledger-label" htmlFor="entry-amount">{L.amount}</label>
            <input id="entry-amount" className={`ledger-field${mark('entry-amount') ? ' is-miss' : ''}`} inputMode="decimal" value={draft.amount} placeholder="0.00" onChange={(event) => onChange({ ...draft, amount: moneyTyping(event.target.value) })} />
            <label className="ledger-label" htmlFor="entry-title">{L.name}</label>
            <input id="entry-title" className={`ledger-field${mark('entry-title') ? ' is-miss' : ''}`} value={draft.title} placeholder={L.namePh} onChange={(event) => onChange({ ...draft, title: event.target.value })} />
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
            <CategoryGrid names={categories} marks={book.categoryMarks} selected={draft.category} rows={4} addLabel={L.add} onAdd={onAddCategory} onSelect={(name) => onChange({ ...draft, category: name })} />
            {!draft.id && (
                <label className="ledger-check">
                    <input type="checkbox" checked={draft.splitOn} onChange={(event) => onChange({ ...draft, splitOn: event.target.checked })} />
                    {L.splitMark}
                </label>
            )}
            <Fold open={draft.splitOn && !draft.id}>
                <label className="ledger-label" htmlFor="entry-other">{L.splitAmount}</label>
                <input id="entry-other" className={`ledger-field${mark('entry-other') ? ' is-miss' : ''}`} inputMode="decimal" value={draft.otherAmount} placeholder="0.00" onChange={(event) => onChange({ ...draft, otherAmount: moneyTyping(event.target.value) })} />
                <p className="ledger-label">{L.category}</p>
                <CategoryGrid names={categories} marks={book.categoryMarks} selected={draft.otherCategory} rows={4} addLabel={L.add} onAdd={onAddOtherCategory} onSelect={(name) => onChange({ ...draft, otherCategory: name })} />
                <label className="ledger-check">
                    <input type="checkbox" checked={draft.otherShared} onChange={(event) => onChange({ ...draft, otherShared: event.target.checked })} />
                    {L.shared}
                </label>
            </Fold>
            <label className="ledger-label" htmlFor="entry-date">{L.date}</label>
            <DateField id="entry-date" label={L.date} locale={locale} value={draft.date} max={todayIso()} onChange={(date) => onChange({ ...draft, date })} L={L} invalid={mark('entry-date')} />
            <label className="ledger-label" htmlFor="entry-account">{L.account}</label>
            {accounts.length > 0 ? (
                <ChoiceMenu id="entry-account" label={L.account} value={draft.accountId} options={accounts.map((account) => ({ value: account.id, label: account.name }))} onChange={(accountId) => onChange({ ...draft, accountId })} invalid={mark('entry-account')} />
            ) : (
                <div id="entry-account" className={`ledger-field is-still${mark('entry-account') ? ' is-miss' : ''}`}>{L.accountNone}</div>
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
            <button type="button" className={gaps.length ? 'ledger-pill is-quiet' : 'ledger-pill'} onClick={() => { const first = gaps[0]; if (first) { setTried(true); revealGap(first); return; } onSave(); }}>{L.save}</button>
            {source && source.direction === 'out' && !source.refundOf && (
                refunded
                    ? <p className="ledger-refund-done">{L.refundDone}</p>
                    : <button type="button" className="ledger-pill ledger-pill-secondary" onClick={onRefund}>{L.refundMark}</button>
            )}
            {draft.id && <button type="button" className="ledger-text-button" onClick={onDelete}>{L.deleteEntry}</button>}
        </>
    );
}

