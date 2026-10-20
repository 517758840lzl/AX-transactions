/**
 * @name 记账
 */

import React, { useEffect, useMemo, useState } from 'react';
import { defineHashPageRoute, useHashPage } from '../../common/useHashPage';
import {
    accountTotal,
    createId,
    currencyMark,
    emptyBook,
    loadBook,
    saveBook,
    signedValue,
    withoutSample,
    type Account,
    type Book,
    type Currency,
    type Direction,
    type Entry,
    type Gender,
} from './store';
import './style.css';

type Scope = 'mine' | 'family';
type PageId = 'today' | 'book' | 'assets' | 'me';
type Panel = 'none' | 'entry' | 'account' | 'profile' | 'privacy' | 'filter';
type PeriodMode = 'today' | 'month' | 'range';

const genderText: Record<Gender, string> = {
    female: '女',
    male: '男',
    secret: '保密',
};

const route = defineHashPageRoute([
    { id: 'today', title: '今天' },
    { id: 'book', title: '账本' },
    { id: 'assets', title: '资产' },
    { id: 'me', title: '我的' },
], { defaultPageId: 'today' });

function todayIso() {
    return isoDate(new Date());
}

function isoDate(date: Date) {
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
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

function periodChipLabel(mode: PeriodMode, rangeFrom: string, rangeTo: string) {
    if (mode === 'today') return '今日';
    if (mode === 'month') {
        const now = new Date();
        return `${now.getMonth() + 1}月`;
    }
    const start = rangeFrom <= rangeTo ? rangeFrom : rangeTo;
    const end = rangeFrom <= rangeTo ? rangeTo : rangeFrom;
    if (start === end) return dayLabel(start);
    const [, sm, sd] = start.split('-');
    const [, em, ed] = end.split('-');
    return `${Number(sm)}月${Number(sd)}日–${Number(em)}月${Number(ed)}日`;
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

const sliceColors = ['#E85D75', '#F4A261', '#E9C46A', '#C47B84', '#8D6E63', '#E8A0BF', '#B5838D', '#6B705C'];

const weekdayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function weekdayLabel(iso: string) {
    return weekdayNames[new Date(`${iso}T12:00:00`).getDay()];
}

function calendarHeadline(iso: string) {
    const [, m, d] = iso.split('-');
    return `${Number(m)}月${Number(d)}日`;
}

function dayLabel(iso: string) {
    const today = todayIso();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const month = `${yesterday.getMonth() + 1}`.padStart(2, '0');
    const day = `${yesterday.getDate()}`.padStart(2, '0');
    const yesterdayIso = `${yesterday.getFullYear()}-${month}-${day}`;
    if (iso === today) return '今天';
    if (iso === yesterdayIso) return '昨天';
    return calendarHeadline(iso);
}

function money(value: number, mark: string) {
    const body = Math.abs(value).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    return `${value < 0 ? '−' : ''}${mark}${body}`;
}

function MoneyAmount({
    value,
    mark,
    size = 'md',
    signed = false,
    className,
}: {
    value: number;
    mark: string;
    size?: 'hero' | 'md' | 'sm';
    signed?: boolean;
    className?: string;
}) {
    const negative = value < 0;
    const body = Math.abs(value).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    return (
        <span className={['ledger-money', `ledger-money--${size}`, className].filter(Boolean).join(' ')} aria-label={money(value, mark)}>
            {signed && value > 0 ? <span className="ledger-money-sign">+</span> : null}
            {negative ? <span className="ledger-money-sign">−</span> : null}
            <span className="ledger-money-mark">{mark}</span>
            <span className="ledger-money-value">{body}</span>
        </span>
    );
}

function IconToday() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="4" y="5" width="16" height="15" rx="3" />
            <path d="M8 3.5v3M16 3.5v3M4 10h16" />
        </svg>
    );
}

function IconBook() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 4.5h11.5A1.5 1.5 0 0 1 19 6v13.5H7.5A1.5 1.5 0 0 0 6 21V4.5z" />
            <path d="M6 4.5A1.5 1.5 0 0 1 7.5 3H19" />
        </svg>
    );
}

function IconAssets() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 16.5 9 11l3.2 3.2L20 7" />
            <path d="M14.5 7H20v5.5" />
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

const tabs: { id: PageId; title: string; icon: React.ReactNode }[] = [
    { id: 'today', title: '今天', icon: <IconToday /> },
    { id: 'book', title: '账本', icon: <IconBook /> },
    { id: 'assets', title: '资产', icon: <IconAssets /> },
    { id: 'me', title: '我的', icon: <IconMe /> },
];

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
    const active = (tabs.some((tab) => tab.id === page) ? page : 'today') as PageId;
    const [book, setBook] = useState<Book>(emptyBook);
    const [ready, setReady] = useState(false);
    const [scope, setScope] = useState<Scope>('mine');
    const [panel, setPanel] = useState<Panel>('none');
    const [draft, setDraft] = useState<EntryDraft>(() => blankEntry(emptyBook()));
    const [accountName, setAccountName] = useState('');
    const [accountOpening, setAccountOpening] = useState('');
    const [editingAccountId, setEditingAccountId] = useState('');
    const [categoryName, setCategoryName] = useState('');
    const [editingCategories, setEditingCategories] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState('全部');
    const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'done'>('all');
    const [periodMode, setPeriodMode] = useState<PeriodMode>('today');
    const [rangeFrom, setRangeFrom] = useState(() => monthBounds(0).start);
    const [rangeTo, setRangeTo] = useState(todayIso);
    const [draftName, setDraftName] = useState('');
    const [draftGender, setDraftGender] = useState<Gender>('secret');

    useEffect(() => {
        const loaded = loadBook();
        setBook(loaded);
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
    const balance = book.accounts.reduce((sum, account) => sum + accountTotal(account, book.entries), 0);
    const monthKey = todayIso().slice(0, 7);
    const monthEntries = visibleEntries.filter((entry) => entry.date.startsWith(monthKey));
    const monthOut = monthEntries.filter((entry) => entry.direction === 'out').reduce((sum, entry) => sum + entry.amount, 0);
    const monthIn = monthEntries.filter((entry) => entry.direction === 'in').reduce((sum, entry) => sum + entry.amount, 0);
    const todayKey = todayIso();
    const todayEntries = visibleEntries.filter((entry) => entry.date === todayKey);
    const todayOut = todayEntries.filter((entry) => entry.direction === 'out').reduce((sum, entry) => sum + entry.amount, 0);
    const todayIn = todayEntries.filter((entry) => entry.direction === 'in').reduce((sum, entry) => sum + entry.amount, 0);
    const todayOpenCount = todayEntries.filter((entry) => !entry.checked).length;
    const hasOlderEntries = visibleEntries.some((entry) => entry.date < todayKey);

    function openEntry(entry?: Entry) {
        if (!entry) {
            setDraft(blankEntry(book));
        } else {
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
            const created: Account = { id: createId(), name: draft.accountName.trim() || '现金', opening: 0 };
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
        const entries = draft.id
            ? book.entries.map((entry) => (entry.id === draft.id ? next : entry))
            : [next, ...book.entries];
        setBook({ ...book, accounts, entries });
        setPanel('none');
    }

    function removeEntry(id: string) {
        setBook({ ...book, entries: book.entries.filter((entry) => entry.id !== id) });
        setPanel('none');
    }

    function toggleChecked(id: string) {
        setBook({
            ...book,
            entries: book.entries.map((entry) => (entry.id === id ? { ...entry, checked: !entry.checked } : entry)),
        });
    }

    function openAccount(account?: Account) {
        setEditingAccountId(account?.id ?? '');
        setAccountName(account?.name ?? '');
        setAccountOpening(account ? String(account.opening) : '');
        setPanel('account');
    }

    function saveAccount() {
        const name = accountName.trim();
        const opening = Number(accountOpening);
        if (!name || !Number.isFinite(opening)) return;
        const accounts = editingAccountId
            ? book.accounts.map((item) => (item.id === editingAccountId ? { ...item, name, opening } : item))
            : [...book.accounts, { id: createId(), name, opening }];
        setBook({ ...book, accounts });
        setPanel('none');
    }

    function removeAccount(id: string) {
        setBook({
            ...book,
            accounts: book.accounts.filter((item) => item.id !== id),
            entries: book.entries.filter((entry) => entry.accountId !== id),
        });
        setPanel('none');
    }

    function clearSample() {
        setBook(withoutSample(book));
    }

    function removeCategory(name: string) {
        if (book.categories.length <= 1) return;
        setBook({ ...book, categories: book.categories.filter((item) => item !== name) });
        if (categoryFilter === name) setCategoryFilter('全部');
    }

    function addCategory() {
        const name = categoryName.trim();
        if (!name || book.categories.includes(name)) return;
        setBook({ ...book, categories: [...book.categories, name] });
        setCategoryName('');
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

    const bounds = periodBounds(periodMode, rangeFrom, rangeTo);
    const singleDay = bounds.start === bounds.end;
    const periodEntries = visibleEntries.filter((entry) => entry.date >= bounds.start && entry.date <= bounds.end);
    const periodOut = periodEntries.filter((entry) => entry.direction === 'out').reduce((sum, entry) => sum + entry.amount, 0);
    const periodIn = periodEntries.filter((entry) => entry.direction === 'in').reduce((sum, entry) => sum + entry.amount, 0);
    const spendByDay = eachDay(bounds.start, bounds.end).map((day) => ({
        day,
        amount: periodEntries.filter((entry) => entry.date === day && entry.direction === 'out').reduce((sum, entry) => sum + entry.amount, 0),
    }));
    const spendParts = [...new Set(periodEntries.filter((entry) => entry.direction === 'out').map((entry) => entry.category))].map((name, index) => ({
        name,
        amount: periodEntries.filter((entry) => entry.category === name && entry.direction === 'out').reduce((sum, entry) => sum + entry.amount, 0),
        color: sliceColors[index % sliceColors.length],
    })).filter((item) => item.amount > 0);

    const bookEntries = periodEntries.filter((entry) => {
        if (categoryFilter !== '全部' && entry.category !== categoryFilter) return false;
        if (statusFilter === 'open' && entry.checked) return false;
        if (statusFilter === 'done' && !entry.checked) return false;
        return true;
    });
    const days = bookEntries.reduce<string[]>((list, entry) => {
        if (!list.includes(entry.date)) list.push(entry.date);
        return list;
    }, []).sort((a, b) => b.localeCompare(a));

    const displayName = book.nickname || '未设置';
    const monthSpend = eachDay(monthBounds(0).start, todayIso()).map((day) => ({
        day,
        amount: visibleEntries.filter((entry) => entry.date === day && entry.direction === 'out').reduce((sum, entry) => sum + entry.amount, 0),
    }));

    const periodLabel = periodChipLabel(periodMode, rangeFrom, rangeTo);
    const lineActiveDay = singleDay ? bounds.start : '';

    function resetPeriodFilters() {
        setCategoryFilter('全部');
    }

    function chooseToday() {
        setPeriodMode('today');
        resetPeriodFilters();
    }

    function chooseMonth() {
        setPeriodMode('month');
        resetPeriodFilters();
    }

    function chooseRange() {
        setPeriodMode('range');
        resetPeriodFilters();
    }

    function chooseDayRange(day: string) {
        if (!day) return;
        setPeriodMode('range');
        setRangeFrom(day);
        setRangeTo(day);
        resetPeriodFilters();
    }

    function chooseCategory(name: string) {
        setCategoryFilter((current) => (current === name ? '全部' : name));
    }

    return (
        <main className="ledger">
            <section className="ledger-phone">
                <div className="ledger-body">
                    {panel === 'entry' && (
                        <EntryForm
                            draft={draft}
                            book={book}
                            onChange={setDraft}
                            onSave={saveEntry}
                            onDelete={() => draft.id && removeEntry(draft.id)}
                            onBack={() => setPanel('none')}
                        />
                    )}
                    {panel === 'account' && (
                        <>
                            <SubpageHead title={editingAccountId ? '编辑账户' : '添加账户'} onBack={() => setPanel('none')} />
                            <label className="ledger-label" htmlFor="account-name">账户名称</label>
                            <input id="account-name" className="ledger-field" value={accountName} placeholder="例如 Visa、现金、工资卡" onChange={(event) => setAccountName(event.target.value)} />
                            <label className="ledger-label" htmlFor="account-opening">当前余额</label>
                            <input id="account-opening" className="ledger-field" inputMode="decimal" value={accountOpening} placeholder="0.00" onChange={(event) => setAccountOpening(event.target.value)} />
                            <button type="button" className="ledger-pill ledger-import" onClick={saveAccount} disabled={!accountName.trim() || accountOpening.trim() === '' || Number.isNaN(Number(accountOpening))}>保存</button>
                            {editingAccountId && (
                                <button type="button" className="ledger-text-button" onClick={() => removeAccount(editingAccountId)}>删除这个账户和里面的账</button>
                            )}
                        </>
                    )}
                    {panel === 'profile' && (
                        <>
                            <SubpageHead title="昵称与性别" onBack={() => setPanel('none')} />
                            <label className="ledger-label" htmlFor="ledger-nickname">昵称</label>
                            <input id="ledger-nickname" className="ledger-field" value={draftName} maxLength={12} onChange={(event) => setDraftName(event.target.value)} />
                            <p className="ledger-label">性别</p>
                            <div className="ledger-segment ledger-genders" role="tablist" aria-label="性别">
                                {(['female', 'male', 'secret'] as const).map((item) => (
                                    <button key={item} type="button" role="tab" aria-selected={draftGender === item} className={draftGender === item ? 'is-on' : ''} onClick={() => setDraftGender(item)}>{genderText[item]}</button>
                                ))}
                            </div>
                            <button type="button" className="ledger-pill ledger-import" onClick={saveProfile} disabled={!draftName.trim()}>保存</button>
                        </>
                    )}
                    {panel === 'privacy' && <PrivacyNote onBack={() => setPanel('none')} />}
                    {panel === 'filter' && (
                        <FilterPage
                            scope={scope}
                            periodMode={periodMode}
                            rangeFrom={rangeFrom}
                            rangeTo={rangeTo}
                            onScope={setScope}
                            onToday={chooseToday}
                            onMonth={chooseMonth}
                            onRange={chooseRange}
                            onFrom={setRangeFrom}
                            onTo={setRangeTo}
                            onBack={() => setPanel('none')}
                        />
                    )}

                    {panel === 'none' && active === 'today' && (
                        <>
                            <TabHeader kind="today" date={todayKey} scope={scope} onFilter={() => setPanel('filter')} />
                            <section className="ledger-day-panel" aria-label="今日概况">
                                <div className="ledger-day-panel-cell">
                                    <span className="ledger-stat-label">支出</span>
                                    <MoneyAmount value={todayOut} mark={mark} size="md" />
                                </div>
                                <div className="ledger-day-panel-cell">
                                    <span className="ledger-stat-label">收入</span>
                                    <MoneyAmount value={todayIn} mark={mark} size="md" />
                                </div>
                                <div className="ledger-day-panel-cell">
                                    <span className="ledger-stat-label">笔数</span>
                                    <strong className="ledger-stat-count">{todayEntries.length}</strong>
                                </div>
                            </section>
                            <button type="button" className="ledger-balance-row" onClick={() => setPage('assets')}>
                                <span>总资产</span>
                                <MoneyAmount value={balance} mark={mark} size="sm" />
                                <span className="ledger-chevron" aria-hidden="true">›</span>
                            </button>
                            <button type="button" className="ledger-pill ledger-import ledger-import--today" onClick={() => openEntry()}>记一笔</button>
                            {todayOpenCount > 0 && (
                                <p className="ledger-inline-note">{todayOpenCount} 笔今日账还未核对</p>
                            )}
                            {monthOut > 0 && (
                                <button type="button" className="ledger-card ledger-jump" onClick={() => setPage('book')}>
                                    <span>本月支出走势</span>
                                    <SpendLine points={monthSpend} active="" />
                                </button>
                            )}
                            <SampleNote book={book} onClear={clearSample} />
                            {todayEntries.length === 0 ? (
                                <p className="ledger-empty">{hasOlderEntries ? '今天还没有账。记一笔，或去账本看更早的流水。' : '还没有账。记一笔之后，流水会留在这台设备上。'}</p>
                            ) : (
                                <EntryGroups
                                    days={[todayKey]}
                                    entries={todayEntries}
                                    accounts={book.accounts}
                                    mark={mark}
                                    onOpen={openEntry}
                                    onToggle={toggleChecked}
                                    showDayHead={false}
                                />
                            )}
                            {hasOlderEntries && (
                                <button type="button" className="ledger-text-button ledger-more-link" onClick={() => setPage('book')}>查看账本里的更早流水</button>
                            )}
                        </>
                    )}

                    {panel === 'none' && active === 'book' && (
                        <>
                            <TabHeader kind="book" periodLabel={periodLabel} onFilter={() => setPanel('filter')} />
                            {categoryFilter !== '全部' && (
                                <button type="button" className="ledger-active-filter" onClick={() => setCategoryFilter('全部')}>
                                    分类：{categoryFilter} ×
                                </button>
                            )}
                            <section className="ledger-period-strip" aria-label={`${periodLabel}收支`}>
                                <p className="ledger-period-strip-label">{periodLabel} · 收支</p>
                                <div className="ledger-period-strip-row">
                                    <div><span>支出</span><MoneyAmount value={periodOut} mark={mark} size="md" /></div>
                                    <div><span>收入</span><MoneyAmount value={periodIn} mark={mark} size="md" /></div>
                                    <div><span>结余</span><MoneyAmount value={periodIn - periodOut} mark={mark} size="md" /></div>
                                </div>
                            </section>
                            {spendParts.length > 0 && (
                                <section className="ledger-card">
                                    <h2>分类支出</h2>
                                    <div className="ledger-pie-wrap">
                                        <SpendDonut parts={spendParts} total={periodOut} active={categoryFilter} mark={mark} onPick={chooseCategory} />
                                        <ul className="ledger-legend">
                                            {spendParts.map((part) => (
                                                <li key={part.name}>
                                                    <button type="button" className={categoryFilter === part.name ? 'is-on' : ''} onClick={() => chooseCategory(part.name)}>
                                                        <i style={{ background: part.color }} />
                                                        <span>{part.name}</span>
                                                        <MoneyAmount value={part.amount} mark={mark} size="sm" />
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </section>
                            )}
                            {!singleDay && periodOut > 0 && (
                                <section className="ledger-card">
                                    <h2>每日支出</h2>
                                    <SpendLine points={spendByDay} active={lineActiveDay} onPick={chooseDayRange} />
                                </section>
                            )}
                            <div className="ledger-chips" role="tablist" aria-label="核对状态">
                                {([['all', '全部'], ['open', '未核对'], ['done', '已核对']] as const).map(([id, label]) => (
                                    <button key={id} type="button" className={statusFilter === id ? 'is-on' : ''} onClick={() => setStatusFilter(id)}>{label}</button>
                                ))}
                            </div>
                            <button type="button" className="ledger-pill ledger-import" onClick={() => openEntry()}>记一笔</button>
                            <SampleNote book={book} onClear={clearSample} />
                            {bookEntries.length === 0 ? <p className="ledger-empty">这里还没有账。</p> : (
                                <EntryGroups days={days} entries={bookEntries} accounts={book.accounts} mark={mark} onOpen={openEntry} onToggle={toggleChecked} />
                            )}
                        </>
                    )}

                    {panel === 'none' && active === 'assets' && (
                        <>
                            <TabHeader kind="assets" />
                            <article className="ledger-hero ledger-hero--assets">
                                <p>净资产</p>
                                <div className="ledger-hero-amount">
                                    <MoneyAmount value={balance} mark={mark} size="hero" />
                                </div>
                                <span className="ledger-hero-foot">
                                    {book.accounts.length} 个账户
                                    <span className="ledger-dot" aria-hidden="true">·</span>
                                    本月支出 <MoneyAmount value={monthOut} mark={mark} size="sm" />
                                </span>
                            </article>
                            <SampleNote book={book} onClear={clearSample} />
                            {book.accounts.length === 0 ? <p className="ledger-empty">先添加一个账户，填上现在的真实余额。</p> : book.accounts.map((account) => {
                                const total = accountTotal(account, book.entries);
                                return (
                                    <button key={account.id} type="button" className="ledger-card ledger-account-card" onClick={() => openAccount(account)}>
                                        <div className="ledger-account-top">
                                            <b>{account.name}</b>
                                            <MoneyAmount value={total} mark={mark} size="md" />
                                        </div>
                                        <span className="ledger-account-meta">
                                            起始 <MoneyAmount value={account.opening} mark={mark} size="sm" />
                                            <span className="ledger-dot" aria-hidden="true">·</span>
                                            点此修改
                                        </span>
                                    </button>
                                );
                            })}
                            <button type="button" className="ledger-pill ledger-import" onClick={() => openAccount()}>添加账户</button>
                        </>
                    )}

                    {panel === 'none' && active === 'me' && (
                        <>
                            <TabHeader kind="me" />
                            <button type="button" className="ledger-card ledger-profile" onClick={openProfile}>
                                <div className="ledger-mark" aria-hidden="true">{displayName.slice(0, 1)}</div>
                                <div>
                                    <b>{displayName}</b>
                                    <span>{book.nickname ? genderText[book.gender] : '点此填写昵称'}</span>
                                </div>
                            </button>
                            <section className="ledger-card ledger-settings">
                                <button type="button" className="ledger-setting ledger-entry" onClick={() => setPanel('privacy')}>
                                    <div><b>隐私协议</b><span>账存在这台设备上</span></div>
                                    <span aria-hidden="true">›</span>
                                </button>
                            </section>
                            <section className="ledger-card">
                                <h2>货币</h2>
                                <div className="ledger-segment ledger-genders" role="tablist" aria-label="货币">
                                    {(['USD', 'EUR', 'CNY'] as const).map((item) => (
                                        <button key={item} type="button" role="tab" aria-selected={book.currency === item} className={book.currency === item ? 'is-on' : ''} onClick={() => setBook({ ...book, currency: item })}>{item}</button>
                                    ))}
                                </div>
                            </section>
                            <section className="ledger-card">
                                <div className="ledger-card-head">
                                    <h2>分类</h2>
                                    <button type="button" className="ledger-head-action" onClick={() => setEditingCategories((on) => !on)}>{editingCategories ? '完成' : '编辑'}</button>
                                </div>
                                <div className={`ledger-chips ledger-chips-wrap${editingCategories ? ' is-editing' : ''}`}>
                                    {book.categories.map((name) => (
                                        <span key={name} className="ledger-static-chip">
                                            {name}
                                            {editingCategories && book.categories.length > 1 && (
                                                <button type="button" className="ledger-chip-remove" aria-label={`删除${name}`} onClick={() => removeCategory(name)}>×</button>
                                            )}
                                        </span>
                                    ))}
                                </div>
                                <div className="ledger-add-row">
                                    <input className="ledger-field" value={categoryName} placeholder="新分类" onChange={(event) => setCategoryName(event.target.value)} />
                                    <button type="button" className="ledger-pill" onClick={addCategory} disabled={!categoryName.trim()}>添加</button>
                                </div>
                            </section>
                        </>
                    )}
                </div>
                <nav className="ledger-tabs" aria-label="主导航">
                    {tabs.map((tab) => (
                        <button key={tab.id} type="button" className={active === tab.id ? 'is-on' : ''} aria-current={active === tab.id ? 'page' : undefined} onClick={() => {
                            setPanel('none');
                            if (tab.id !== 'book') {
                                setCategoryFilter('全部');
                                setStatusFilter('all');
                            }
                            setPage(tab.id);
                        }}>
                            {tab.icon}
                            {tab.title}
                        </button>
                    ))}
                </nav>
            </section>
        </main>
    );
}

function SpendDonut({
    parts,
    total,
    active,
    mark,
    onPick,
}: {
    parts: { name: string; amount: number; color: string }[];
    total: number;
    active: string;
    mark: string;
    onPick: (name: string) => void;
}) {
    const radius = 54;
    const turn = 2 * Math.PI * radius;
    let cursor = 0;
    return (
        <svg className="ledger-pie" viewBox="0 0 160 160" role="img" aria-label="分类支出">
            {parts.map((part) => {
                const length = Math.max((part.amount / total) * turn - (parts.length > 1 ? 3 : 0), 1);
                const node = (
                    <circle
                        key={part.name}
                        cx="80"
                        cy="80"
                        r={radius}
                        fill="none"
                        stroke={part.color}
                        strokeWidth={active === part.name ? 24 : 18}
                        strokeDasharray={`${length} ${turn - length}`}
                        strokeDashoffset={-cursor}
                        transform="rotate(-90 80 80)"
                        onClick={() => onPick(part.name)}
                    >
                        <title>{part.name}</title>
                    </circle>
                );
                cursor += (part.amount / total) * turn;
                return node;
            })}
            <text x="80" y="76" textAnchor="middle" fill="#6E6878" fontSize="12">支出</text>
            <text x="80" y="96" textAnchor="middle" fill="#0B051D" fontSize="13" fontWeight="700">{money(total, mark)}</text>
        </svg>
    );
}

function SpendLine({
    points,
    active,
    onPick,
}: {
    points: { day: string; amount: number }[];
    active: string;
    onPick?: (day: string) => void;
}) {
    const width = 320;
    const height = 128;
    const max = Math.max(...points.map((point) => point.amount), 1);
    const step = points.length <= 1 ? 0 : (width - 20) / (points.length - 1);
    const placed = points.map((point, index) => ({
        ...point,
        x: 10 + index * step,
        y: height - 18 - (point.amount / max) * (height - 36),
    }));
    const path = placed.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`).join(' ');
    return (
        <svg className="ledger-line" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="每日支出">
            <path d={path} fill="none" stroke="#E85D75" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            {placed.map((point) => (
                <circle
                    key={point.day}
                    cx={point.x}
                    cy={point.y}
                    r={active === point.day ? 5.5 : point.amount > 0 ? 4 : 2.5}
                    fill={active === point.day ? '#0B051D' : '#FFB3C7'}
                    stroke="#0B051D"
                    strokeWidth="1.4"
                    onClick={onPick ? () => onPick(point.day) : undefined}
                >
                    <title>{`${dayLabel(point.day)} ${point.amount}`}</title>
                </circle>
            ))}
        </svg>
    );
}

function SampleNote({ book, onClear }: { book: Book; onClear: () => void }) {
    const hasSample = book.accounts.some((account) => account.id.startsWith('sample-')) || book.entries.some((entry) => entry.id.startsWith('sample-'));
    if (!hasSample) return null;
    return (
        <div className="ledger-banner ledger-sample">
            <span>先放了几笔常见的账，点开就能改</span>
            <button type="button" onClick={onClear}>清空</button>
        </div>
    );
}

function TabHeader(
    props:
    | { kind: 'today'; date: string; scope: Scope; onFilter: () => void }
    | { kind: 'book'; periodLabel: string; onFilter: () => void }
    | { kind: 'assets' }
    | { kind: 'me' },
) {
    if (props.kind === 'today') {
        return (
            <header className="ledger-tab-head ledger-tab-head--today">
                <div className="ledger-tab-head-main">
                    <p className="ledger-tab-eyebrow">{weekdayLabel(props.date)}</p>
                    <h1>{calendarHeadline(props.date)}</h1>
                </div>
                <button type="button" className="ledger-scope-chip" onClick={props.onFilter}>
                    {props.scope === 'mine' ? '我的' : '家庭'}
                </button>
            </header>
        );
    }
    if (props.kind === 'book') {
        return (
            <header className="ledger-tab-head ledger-tab-head--book">
                <h1>账本</h1>
                <button type="button" className="ledger-period-chip" onClick={props.onFilter}>{props.periodLabel}</button>
            </header>
        );
    }
    if (props.kind === 'assets') {
        return (
            <header className="ledger-tab-head ledger-tab-head--assets">
                <p className="ledger-tab-eyebrow">账户与结余</p>
                <h1>资产</h1>
            </header>
        );
    }
    return (
        <header className="ledger-tab-head ledger-tab-head--me">
            <h1>我的</h1>
            <p className="ledger-tab-eyebrow">昵称、货币与分类</p>
        </header>
    );
}

function SubpageHead({ title, onBack }: { title: string; onBack: () => void }) {
    return (
        <header className="ledger-subhead">
            <button type="button" className="ledger-back-btn" onClick={onBack} aria-label="返回">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M19 12H5M12 19 5 12 12 5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>
            <h1>{title}</h1>
        </header>
    );
}

function FilterPage({
    scope,
    periodMode,
    rangeFrom,
    rangeTo,
    onScope,
    onToday,
    onMonth,
    onRange,
    onFrom,
    onTo,
    onBack,
}: {
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
        <div className="ledger-filter-page">
            <SubpageHead title="筛选" onBack={onBack} />
            <section className="ledger-card">
                <h2>范围</h2>
                <div className="ledger-segment" role="tablist" aria-label="范围">
                    <button type="button" role="tab" aria-selected={scope === 'mine'} className={scope === 'mine' ? 'is-on' : ''} onClick={() => onScope('mine')}>只看我的</button>
                    <button type="button" role="tab" aria-selected={scope === 'family'} className={scope === 'family' ? 'is-on' : ''} onClick={() => onScope('family')}>家庭</button>
                </div>
            </section>
            <section className="ledger-card">
                <h2>时间</h2>
                <div className="ledger-segment ledger-segment-3" role="tablist" aria-label="时间">
                    <button type="button" role="tab" aria-selected={periodMode === 'today'} className={periodMode === 'today' ? 'is-on' : ''} onClick={onToday}>今日</button>
                    <button type="button" role="tab" aria-selected={periodMode === 'month'} className={periodMode === 'month' ? 'is-on' : ''} onClick={onMonth}>本月</button>
                    <button type="button" role="tab" aria-selected={periodMode === 'range'} className={periodMode === 'range' ? 'is-on' : ''} onClick={onRange}>自定义</button>
                </div>
                {periodMode === 'range' && (
                    <div className="ledger-dates ledger-dates-filter">
                        <input className="ledger-field" type="date" aria-label="开始日期" value={rangeFrom} max={todayIso()} onChange={(event) => onFrom(event.target.value)} />
                        <span>至</span>
                        <input className="ledger-field" type="date" aria-label="结束日期" value={rangeTo} max={todayIso()} onChange={(event) => onTo(event.target.value)} />
                    </div>
                )}
            </section>
            <button type="button" className="ledger-pill ledger-import" onClick={onBack}>完成</button>
        </div>
    );
}

function EntryGroups({
    days,
    entries,
    accounts,
    mark,
    onOpen,
    onToggle,
    showDayHead = true,
}: {
    days: string[];
    entries: Entry[];
    accounts: Account[];
    mark: string;
    onOpen: (entry: Entry) => void;
    onToggle: (id: string) => void;
    showDayHead?: boolean;
}) {
    return (
        <>
            {days.map((day) => (
                <section key={day} className={`ledger-card ledger-list${showDayHead ? '' : ' ledger-list--flat'}`}>
                    {showDayHead ? <h2>{dayLabel(day)}</h2> : null}
                    {entries.filter((entry) => entry.date === day).map((entry) => {
                        const account = accounts.find((item) => item.id === entry.accountId);
                        const value = signedValue(entry);
                        return (
                            <article key={entry.id} className="ledger-row">
                                <button type="button" className="ledger-row-main" onClick={() => onOpen(entry)}>
                                    <div className="ledger-mark" aria-hidden="true">{entry.title.slice(0, 1)}</div>
                                    <div>
                                        <b>{entry.title}</b>
                                        <span>{entry.category} · {account?.name ?? '账户'}{entry.shared ? ' · 家庭' : ''}</span>
                                    </div>
                                </button>
                                <div className="ledger-amount">
                                    <MoneyAmount value={value} mark={mark} size="md" signed />
                                    <button type="button" className={entry.checked ? 'ledger-tag' : 'ledger-wait'} onClick={() => onToggle(entry.id)}>
                                        {entry.checked ? '已核对' : '未核对'}
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </section>
            ))}
        </>
    );
}

function EntryForm({
    draft,
    book,
    onChange,
    onSave,
    onDelete,
    onBack,
}: {
    draft: EntryDraft;
    book: Book;
    onChange: (draft: EntryDraft) => void;
    onSave: () => void;
    onDelete: () => void;
    onBack: () => void;
}) {
    const amountOk = Number(draft.amount) > 0;
    return (
        <>
            <SubpageHead title={draft.id ? '改这一笔' : '记一笔'} onBack={onBack} />
            <div className="ledger-segment ledger-segment-tight" role="tablist" aria-label="收支">
                <button type="button" role="tab" aria-selected={draft.direction === 'out'} className={draft.direction === 'out' ? 'is-on' : ''} onClick={() => onChange({ ...draft, direction: 'out' })}>支出</button>
                <button type="button" role="tab" aria-selected={draft.direction === 'in'} className={draft.direction === 'in' ? 'is-on' : ''} onClick={() => onChange({ ...draft, direction: 'in' })}>收入</button>
            </div>
            <label className="ledger-label" htmlFor="entry-amount">金额</label>
            <input id="entry-amount" className="ledger-field" inputMode="decimal" value={draft.amount} placeholder="0.00" onChange={(event) => onChange({ ...draft, amount: event.target.value })} />
            <label className="ledger-label" htmlFor="entry-title">名称</label>
            <input id="entry-title" className="ledger-field" value={draft.title} placeholder="午饭、工资、房租" onChange={(event) => onChange({ ...draft, title: event.target.value })} />
            <p className="ledger-label">分类</p>
            <div className="ledger-chips ledger-chips-wrap">
                {book.categories.map((name) => (
                    <button key={name} type="button" className={draft.category === name ? 'is-on' : ''} onClick={() => onChange({ ...draft, category: name })}>{name}</button>
                ))}
            </div>
            <label className="ledger-label" htmlFor="entry-date">日期</label>
            <input id="entry-date" className="ledger-field" type="date" value={draft.date} onChange={(event) => onChange({ ...draft, date: event.target.value })} />
            <label className="ledger-label" htmlFor="entry-account">账户</label>
            {book.accounts.length > 0 ? (
                <select id="entry-account" className="ledger-field" value={draft.accountId} onChange={(event) => onChange({ ...draft, accountId: event.target.value })}>
                    {book.accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
                </select>
            ) : (
                <input id="entry-account" className="ledger-field" value={draft.accountName} onChange={(event) => onChange({ ...draft, accountName: event.target.value })} />
            )}
            <label className="ledger-check">
                <input type="checkbox" checked={draft.shared} onChange={(event) => onChange({ ...draft, shared: event.target.checked })} />
                记入家庭
            </label>
            <button type="button" className="ledger-pill ledger-import" onClick={onSave} disabled={!draft.title.trim() || !amountOk}>保存</button>
            {draft.id && <button type="button" className="ledger-text-button" onClick={onDelete}>删除这笔</button>}
        </>
    );
}

function PrivacyNote({ onBack }: { onBack: () => void }) {
    return (
        <>
            <SubpageHead title="隐私协议" onBack={onBack} />
            <article className="ledger-card ledger-copy">
                <p>昵称、性别、账户和每一笔账都保存在你正在使用的这台设备的浏览器里，用来给你自己记账。</p>
                <p>这里不会登录 Visa、Apple Pay 或银行，也不会把账单发到别处。</p>
                <p>记入家庭的账，可以在「家庭」范围里单独查看。没有标记的账只出现在「只看我的」。</p>
                <p>清除这个浏览器的站点数据后，账本会一起消失。</p>
            </article>
        </>
    );
}
