import { accountTotal, type AccountKind, type Book } from './store';

export type ExcelLabels = {
    transactions: string;
    accounts: string;
    budget: string;
    date: string;
    name: string;
    category: string;
    account: string;
    spend: string;
    income: string;
    kind: string;
    balance: string;
    amount: string;
    monthly: string;
    kindName: (kind: AccountKind) => string;
};

type Cell = string | number | null;

export function excelBook(book: Book, labels: ExcelLabels) {
    const files = [
        { name: '[Content_Types].xml', data: text(contentTypes()) },
        { name: '_rels/.rels', data: text(rootRels()) },
        { name: 'xl/workbook.xml', data: text(workbookXml(labels)) },
        { name: 'xl/_rels/workbook.xml.rels', data: text(workbookRels()) },
        { name: 'xl/styles.xml', data: text(stylesXml()) },
        { name: 'xl/worksheets/sheet1.xml', data: text(sheetXml(transactionRows(book, labels))) },
        { name: 'xl/worksheets/sheet2.xml', data: text(sheetXml(accountRows(book, labels))) },
        { name: 'xl/worksheets/sheet3.xml', data: text(sheetXml(budgetRows(book, labels))) },
    ];
    const bytes = zipStore(files);
    return new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

function transactionRows(book: Book, labels: ExcelLabels): Cell[][] {
    const names = new Map(book.accounts.map((account) => [account.id, account.name]));
    const rows: Cell[][] = [[labels.date, labels.name, labels.category, labels.account, labels.spend, labels.income]];
    const entries = [...book.entries].sort((a, b) => b.date.localeCompare(a.date));
    for (const entry of entries) {
        const spend = entry.direction === 'out' ? entry.amount : null;
        const income = entry.direction === 'in' ? entry.amount : null;
        rows.push([entry.date, entry.title, entry.category, names.get(entry.accountId) ?? '', spend, income]);
    }
    return rows;
}

function accountRows(book: Book, labels: ExcelLabels): Cell[][] {
    const rows: Cell[][] = [[labels.name, labels.kind, labels.balance]];
    for (const account of book.accounts) {
        rows.push([account.name, labels.kindName(account.kind), roundMoney(accountTotal(account, book.entries))]);
    }
    return rows;
}

function budgetRows(book: Book, labels: ExcelLabels): Cell[][] {
    const rows: Cell[][] = [[labels.name, labels.amount]];
    if (book.monthlyBudget != null) rows.push([labels.monthly, roundMoney(book.monthlyBudget)]);
    const names = Object.keys(book.categoryBudgets).sort((a, b) => a.localeCompare(b));
    for (const name of names) {
        const amount = book.categoryBudgets[name];
        if (!Number.isFinite(amount) || amount <= 0) continue;
        rows.push([name, roundMoney(amount)]);
    }
    return rows;
}

function roundMoney(value: number) {
    return Math.round(value * 100) / 100;
}

function workbookXml(labels: ExcelLabels) {
    const names = uniqueSheetNames([labels.transactions, labels.accounts, labels.budget]);
    const sheets = names.map((name, index) => `<sheet name="${xml(name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`).join('');
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
        `<sheets>${sheets}</sheets></workbook>`;
}

function uniqueSheetNames(names: string[]) {
    const used = new Set<string>();
    return names.map((name, index) => {
        const cleaned = name.replace(/[\\/*?:\[\]]/g, ' ').trim().slice(0, 31) || `Sheet${index + 1}`;
        let next = cleaned;
        let extra = 2;
        while (used.has(next)) {
            const suffix = ` ${extra}`;
            next = `${cleaned.slice(0, 31 - suffix.length)}${suffix}`;
            extra += 1;
        }
        used.add(next);
        return next;
    });
}

function sheetXml(rows: Cell[][]) {
    const body = rows.map((row, rowIndex) => {
        const cells = row.map((cell, column) => cellXml(column, rowIndex + 1, cell)).join('');
        return `<row r="${rowIndex + 1}">${cells}</row>`;
    }).join('');
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${body}</sheetData></worksheet>`;
}

function cellXml(column: number, row: number, cell: Cell) {
    if (cell == null || cell === '') return '';
    const ref = `${columnName(column)}${row}`;
    if (typeof cell === 'number' && Number.isFinite(cell)) {
        return `<c r="${ref}" s="1"><v>${cell}</v></c>`;
    }
    return `<c r="${ref}" t="inlineStr"><is><t>${xml(String(cell))}</t></is></c>`;
}

function columnName(index: number) {
    let n = index + 1;
    let name = '';
    while (n > 0) {
        const rem = (n - 1) % 26;
        name = String.fromCharCode(65 + rem) + name;
        n = Math.floor((n - 1) / 26);
    }
    return name;
}

function xml(value: string) {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function contentTypes() {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
        `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
        `<Default Extension="xml" ContentType="application/xml"/>` +
        `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
        `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
        `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
        `<Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
        `<Override PartName="/xl/worksheets/sheet3.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
        `</Types>`;
}

function rootRels() {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
        `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
        `</Relationships>`;
}

function workbookRels() {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
        `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>` +
        `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>` +
        `<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet3.xml"/>` +
        `<Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
        `</Relationships>`;
}

function stylesXml() {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
        `<fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>` +
        `<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>` +
        `<borders count="1"><border/></borders>` +
        `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
        `<cellXfs count="2">` +
        `<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>` +
        `<xf numFmtId="2" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>` +
        `</cellXfs></styleSheet>`;
}

function text(value: string) {
    return new TextEncoder().encode(value);
}

function zipStore(files: { name: string; data: Uint8Array }[]) {
    const parts: Uint8Array[] = [];
    const central: Uint8Array[] = [];
    let offset = 0;
    for (const file of files) {
        const name = new TextEncoder().encode(file.name);
        const crc = crc32(file.data);
        const local = new DataView(new ArrayBuffer(30));
        local.setUint32(0, 0x04034b50, true);
        local.setUint16(4, 20, true);
        local.setUint16(8, 0, true);
        local.setUint32(14, crc, true);
        local.setUint32(18, file.data.length, true);
        local.setUint32(22, file.data.length, true);
        local.setUint16(26, name.length, true);
        parts.push(new Uint8Array(local.buffer), name, file.data);
        const directory = new DataView(new ArrayBuffer(46));
        directory.setUint32(0, 0x02014b50, true);
        directory.setUint16(4, 20, true);
        directory.setUint16(6, 20, true);
        directory.setUint32(16, crc, true);
        directory.setUint32(20, file.data.length, true);
        directory.setUint32(24, file.data.length, true);
        directory.setUint16(28, name.length, true);
        directory.setUint32(42, offset, true);
        central.push(new Uint8Array(directory.buffer), name);
        offset += 30 + name.length + file.data.length;
    }
    const directoryBytes = concat(central);
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true);
    end.setUint16(8, files.length, true);
    end.setUint16(10, files.length, true);
    end.setUint32(12, directoryBytes.length, true);
    end.setUint32(16, offset, true);
    return concat([...parts, directoryBytes, new Uint8Array(end.buffer)]);
}

function concat(parts: Uint8Array[]) {
    const size = parts.reduce((sum, part) => sum + part.length, 0);
    const out = new Uint8Array(size);
    let cursor = 0;
    for (const part of parts) {
        out.set(part, cursor);
        cursor += part.length;
    }
    return out;
}

function crc32(bytes: Uint8Array) {
    let crc = 0xffffffff;
    for (let index = 0; index < bytes.length; index += 1) {
        crc ^= bytes[index];
        for (let bit = 0; bit < 8; bit += 1) {
            const mask = -(crc & 1);
            crc = (crc >>> 1) ^ (0xedb88320 & mask);
        }
    }
    return (crc ^ 0xffffffff) >>> 0;
}
