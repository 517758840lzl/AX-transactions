import React from 'react';

const tones: Record<string, string> = {
    dining: '#e66b47',
    transit: '#2e85b3',
    shopping: '#8c6133',
    daily: '#5275b8',
    housing: '#7561b8',
    snacks: '#d17538',
    clothes: '#b35c85',
    entertainment: '#c7577a',
    social: '#ad4d75',
    pets: '#856642',
    kids: '#d66b85',
    sports: '#2e8c66',
    medical: '#bd4852',
    phone: '#4266b8',
    education: '#5261ad',
    subscriptions: '#7557a8',
    income: '#2e8f61',
    travel: '#387a9e',
    beauty: '#c2618f',
    transfer: '#66667a',
    tag: '#73667a',
};

const known: Record<string, string> = {
    Dining: 'dining', Transit: 'transit', Shopping: 'shopping', Daily: 'daily', Housing: 'housing',
    Snacks: 'snacks', Clothes: 'clothes', Entertainment: 'entertainment', Social: 'social', Pets: 'pets',
    Kids: 'kids', Sports: 'sports', Medical: 'medical', Phone: 'phone', Education: 'education',
    Subscriptions: 'subscriptions', Income: 'income', Travel: 'travel', Beauty: 'beauty', Transfer: 'transfer',
    餐饮: 'dining', 交通: 'transit', 购物: 'shopping', 日用: 'daily', 居住: 'housing', 零食: 'snacks',
    服饰: 'clothes', 娱乐: 'entertainment', 社交: 'social', 宠物: 'pets', 养娃: 'kids', 运动: 'sports',
    医疗: 'medical', 通讯: 'phone', 教育: 'education', 订阅: 'subscriptions', 收入: 'income', 旅行: 'travel',
    美容: 'beauty', 转账: 'transfer',
};

export const categoryMarkKeys = Object.keys(tones).filter((key) => key !== 'transfer');

export function categoryKey(name: string, marks?: Record<string, string>) {
    return marks?.[name] || known[name] || 'tag';
}

export function categoryTone(key: string) {
    return tones[key] || tones.tag;
}

export function CategorySvg({ name }: { name: string }) {
    const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
    switch (name) {
        case 'dining':
            return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...common} d="M8 3v8M6 3v5M10 3v5M8 11v10M16 3c1.5 2 2 4 2 7h-4V3M14 10v11" /></svg>;
        case 'transit':
            return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...common} d="M6 16V7a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v9M6 16h12M8 19l-2 2M16 19l2 2M8 11h3M13 11h3" /></svg>;
        case 'shopping':
            return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...common} d="M6 8h12l-1 12H7L6 8zM9 8V6a3 3 0 0 1 6 0v2" /></svg>;
        case 'daily':
            return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...common} d="M4 7h16l-1.5 13h-13L4 7zM8 7V5h8v2" /></svg>;
        case 'housing':
            return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...common} d="M4 11l8-7 8 7M6 10v9h12v-9" /></svg>;
        case 'snacks':
            return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...common} d="M7 10h10v3a5 5 0 0 1-10 0v-3zM8 10V7h8v3M10 4h.01M14 5h.01" /></svg>;
        case 'clothes':
            return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...common} d="M9 5l3 2 3-2 4 3-2 2v11H7V10L5 8l4-3z" /></svg>;
        case 'entertainment':
            return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...common} d="M12 20a8 8 0 1 0-8-8M8 10h.01M16 10h.01M8 14c1 1.2 2.4 2 4 2s3-.8 4-2" /></svg>;
        case 'social':
            return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...common} d="M8 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3zM16 11a2.5 2.5 0 1 0-2.5-2.5A2.5 2.5 0 0 0 16 11zM3 19c.5-2.5 2.4-4 5-4s4.5 1.5 5 4M14 15c1.8 0 3.4.8 4 3" /></svg>;
        case 'pets':
            return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...common} d="M8 10a1.5 1.5 0 1 0-1.5-1.5A1.5 1.5 0 0 0 8 10zM16 10a1.5 1.5 0 1 0-1.5-1.5A1.5 1.5 0 0 0 16 10zM6 14a1.3 1.3 0 1 0-1.3-1.3A1.3 1.3 0 0 0 6 14zM18 14a1.3 1.3 0 1 0-1.3-1.3A1.3 1.3 0 0 0 18 14zM12 19c2.5 0 4-1.4 4-3.2S14.2 12 12 12s-4 1.6-4 3.8S9.5 19 12 19z" /></svg>;
        case 'kids':
            return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...common} d="M12 12a3 3 0 1 0-3-3 3 3 0 0 0 3 3zM6 19c.6-3 2.6-4.5 6-4.5s5.4 1.5 6 4.5" /></svg>;
        case 'sports':
            return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...common} d="M8 20l2-6 4 2 2-5M9 8a2 2 0 1 0-2-2 2 2 0 0 0 2 2zM14 14l3-1" /></svg>;
        case 'medical':
            return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...common} d="M8 8h8v10H8zM10 4h4v4h-4zM12 11v4M10 13h4" /></svg>;
        case 'phone':
            return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...common} d="M9 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM11 18h2" /></svg>;
        case 'education':
            return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...common} d="M4 8l8-4 8 4-8 4-8-4zM7 10v5c2 2 8 2 10 0v-5" /></svg>;
        case 'subscriptions':
            return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...common} d="M7 8a5 5 0 0 1 8-2l1 1M17 16a5 5 0 0 1-8 2l-1-1M16 4v4h-4M8 20v-4h4" /></svg>;
        case 'income':
            return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...common} d="M12 5v12M7 13l5 5 5-5M6 19h12" /></svg>;
        case 'travel':
            return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...common} d="M3 13l18-6-4 12-4-3-3 3-1-5-6-1z" /></svg>;
        case 'beauty':
            return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...common} d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18" /></svg>;
        case 'transfer':
            return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...common} d="M4 8h13M13 4l4 4-4 4M20 16H7M11 12l-4 4 4 4" /></svg>;
        default:
            return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...common} d="M4 12l6-6h8v8l-6 6zM15 9h.01" /></svg>;
    }
}

export function CategoryBadge({ mark, selected, small, row }: { mark: string; selected?: boolean; small?: boolean; row?: boolean }) {
    return (
        <span className={`ledger-glyph-badge${selected ? ' is-on' : ''}${small ? ' is-small' : ''}${row ? ' is-row' : ''}`} style={{ ['--mark' as string]: categoryTone(mark) }}>
            <CategorySvg name={mark} />
        </span>
    );
}

export function CategoryGrid({
    names,
    marks,
    selected,
    editing,
    canRemove,
    rows,
    addLabel,
    onSelect,
    onRemove,
    onAdd,
}: {
    names: string[];
    marks?: Record<string, string>;
    selected?: string;
    editing?: boolean;
    canRemove?: boolean;
    rows?: number;
    addLabel?: string;
    onSelect?: (name: string) => void;
    onRemove?: (name: string) => void;
    onAdd?: () => void;
}) {
    const cap = rows ? rows * 4 - (onAdd ? 1 : 0) : names.length;
    let shown = names;
    if (names.length > cap) {
        shown = names.slice(0, cap);
        if (selected && !shown.includes(selected)) shown = [...shown.slice(0, Math.max(cap - 1, 0)), selected];
    }
    return (
        <div className="ledger-glyph-grid">
            {shown.map((name) => {
                const mark = categoryKey(name, marks);
                const on = selected === name;
                return (
                    <div key={name} className="ledger-glyph-cell">
                        {onSelect ? (
                            <button type="button" className={`ledger-glyph${on ? ' is-on' : ''}`} onClick={() => onSelect(name)}>
                                <CategoryBadge mark={mark} selected={on} />
                                <span className="ledger-glyph-name">{name}</span>
                            </button>
                        ) : (
                            <div className="ledger-glyph">
                                <CategoryBadge mark={mark} />
                                <span className="ledger-glyph-name">{name}</span>
                            </div>
                        )}
                        {editing && canRemove && onRemove && (
                            <button type="button" className="ledger-glyph-remove" aria-label={name} onClick={() => onRemove(name)}>×</button>
                        )}
                    </div>
                );
            })}
            {onAdd && (
                <div className="ledger-glyph-cell">
                    <button type="button" className="ledger-glyph" onClick={onAdd}>
                        <span className="ledger-glyph-badge ledger-glyph-add" aria-hidden="true">
                            <svg viewBox="0 0 24 24"><path d="M12 6v12M6 12h12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
                        </span>
                        <span className="ledger-glyph-name">{addLabel}</span>
                    </button>
                </div>
            )}
        </div>
    );
}

export function CategoryMarkPicker({ selected, onSelect }: { selected: string; onSelect: (key: string) => void }) {
    return (
        <div className="ledger-glyph-picker">
            {categoryMarkKeys.map((key) => (
                <button key={key} type="button" className={selected === key ? 'is-on' : ''} onClick={() => onSelect(key)} aria-label={key}>
                    <CategoryBadge mark={key} selected={selected === key} />
                </button>
            ))}
        </div>
    );
}
