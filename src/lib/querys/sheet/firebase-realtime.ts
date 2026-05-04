/**
 * ============================================================
 *  lib/querys/sheet/firebase-realtime.ts
 *  Handles version history + comments via Firebase Firestore.
 *  Only used for org/shared sheets.
 * ============================================================
 */

import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    updateDoc,
    doc,
    serverTimestamp,
    Timestamp,
    getDocs,
    limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";

// ─────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────

export type HistoryAction =
    | "cell_edit"
    | "row_add"
    | "row_delete"
    | "col_add"
    | "col_delete"
    | "formula_set"
    | "formula_remove"
    | "format_change"
    | "column_rename";

export interface HistoryEntry {
    id: string;
    sheetId: string;
    userId: string;
    userName: string;
    userColor: string;
    action: HistoryAction;
    detail: string;       // human readable e.g. "Changed B3: 'Pending' → 'Active'"
    oldValue?: any;
    newValue?: any;
    createdAt: string;    // ISO string — already formatted for UI
}

export interface SheetComment {
    id: string;
    sheetId: string;
    cellKey: string;      // "rowIdx-colKey"
    userId: string;
    author: string;
    authorColor: string;
    text: string;
    resolved: boolean;
    parentId: string | null;  // null = root comment, string = reply
    createdAt: string;
}

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────

function formatTimestamp(ts: any): string {
    if (!ts) return "Just now";
    const date: Date = ts instanceof Timestamp ? ts.toDate() : new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─────────────────────────────────────────────
//  VERSION HISTORY — WRITE
// ─────────────────────────────────────────────

export async function logHistory(entry: {
    sheetId: string;
    userId: string;
    userName: string;
    userColor: string;
    action: HistoryAction;
    detail: string;
    oldValue?: any;
    newValue?: any;
}) {
    try {
        await addDoc(collection(db, "sheet_history"), {
            ...entry,
            createdAt: serverTimestamp(),
        });
    } catch (err) {
        console.error("Failed to log history:", err);
    }
}

// ─────────────────────────────────────────────
//  VERSION HISTORY — READ (real-time listener)
// ─────────────────────────────────────────────

export function subscribeToHistory(
    sheetId: string,
    callback: (entries: HistoryEntry[]) => void,
    maxEntries = 50
): () => void {
    const q = query(
        collection(db, "sheet_history"),
        where("sheetId", "==", sheetId),
        orderBy("createdAt", "desc"),
        limit(maxEntries)
    );

    const unsub = onSnapshot(q, (snapshot) => {
        const entries: HistoryEntry[] = snapshot.docs.map((d) => {
            const data = d.data();
            return {
                id: d.id,
                sheetId: data.sheetId,
                userId: data.userId,
                userName: data.userName,
                userColor: data.userColor || "#0d7c5f",
                action: data.action,
                detail: data.detail,
                oldValue: data.oldValue,
                newValue: data.newValue,
                createdAt: formatTimestamp(data.createdAt),
            };
        });
        callback(entries);
    });

    return unsub;
}

// ─────────────────────────────────────────────
//  COMMENTS — WRITE
// ─────────────────────────────────────────────

export async function addComment(comment: {
    sheetId: string;
    cellKey: string;
    userId: string;
    author: string;
    authorColor: string;
    text: string;
    parentId?: string | null;
}): Promise<string | null> {
    try {
        const ref = await addDoc(collection(db, "sheet_comments"), {
            ...comment,
            parentId: comment.parentId ?? null,
            resolved: false,
            createdAt: serverTimestamp(),
        });
        return ref.id;
    } catch (err) {
        console.error("Failed to add comment:", err);
        return null;
    }
}

export async function resolveComment(commentId: string): Promise<void> {
    try {
        await updateDoc(doc(db, "sheet_comments", commentId), {
            resolved: true,
        });
    } catch (err) {
        console.error("Failed to resolve comment:", err);
    }
}

// ─────────────────────────────────────────────
//  COMMENTS — READ (real-time listener)
// ─────────────────────────────────────────────

export function subscribeToComments(
    sheetId: string,
    callback: (comments: Record<string, SheetComment[]>) => void
): () => void {
    const q = query(
        collection(db, "sheet_comments"),
        where("sheetId", "==", sheetId),
        orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
        const grouped: Record<string, SheetComment[]> = {};

        snapshot.docs.forEach((d) => {
            const data = d.data();
            const comment: SheetComment = {
                id: d.id,
                sheetId: data.sheetId,
                cellKey: data.cellKey,
                userId: data.userId,
                author: data.author,
                authorColor: data.authorColor || "#0d7c5f",
                text: data.text,
                resolved: data.resolved,
                parentId: data.parentId,
                createdAt: formatTimestamp(data.createdAt),
            };

            if (!grouped[data.cellKey]) grouped[data.cellKey] = [];
            grouped[data.cellKey].push(comment);
        });

        callback(grouped);
    });

    return unsub;
}

// ─────────────────────────────────────────────
//  HISTORY HELPERS — call these from SheetClient
//  wherever actions happen
// ─────────────────────────────────────────────

/** Call when a cell value changes */
export function logCellEdit(
    sheetId: string,
    cellRef: string,        // e.g. "B3"
    colName: string,
    oldVal: any,
    newVal: any,
    userName = "You",
    userColor = "#0d7c5f",
    userId = "local"
) {
    return logHistory({
        sheetId,
        userId,
        userName,
        userColor,
        action: "cell_edit",
        detail: `Edited ${cellRef} (${colName}): "${String(oldVal ?? "")}" → "${String(newVal ?? "")}"`,
        oldValue: oldVal,
        newValue: newVal,
    });
}

/** Call when a row is added */
export function logRowAdd(
    sheetId: string,
    rowIndex: number,
    userName = "You",
    userColor = "#0d7c5f",
    userId = "local"
) {
    return logHistory({
        sheetId,
        userId,
        userName,
        userColor,
        action: "row_add",
        detail: `Added row ${rowIndex + 1}`,
    });
}

/** Call when rows are deleted */
export function logRowDelete(
    sheetId: string,
    count: number,
    userName = "You",
    userColor = "#0d7c5f",
    userId = "local"
) {
    return logHistory({
        sheetId,
        userId,
        userName,
        userColor,
        action: "row_delete",
        detail: `Deleted ${count} row${count > 1 ? "s" : ""}`,
    });
}

/** Call when a column is added */
export function logColAdd(
    sheetId: string,
    colName: string,
    colType: string,
    userName = "You",
    userColor = "#0d7c5f",
    userId = "local"
) {
    return logHistory({
        sheetId,
        userId,
        userName,
        userColor,
        action: "col_add",
        detail: `Added column "${colName}" (${colType})`,
    });
}

/** Call when a column is deleted */
export function logColDelete(
    sheetId: string,
    colName: string,
    userName = "You",
    userColor = "#0d7c5f",
    userId = "local"
) {
    return logHistory({
        sheetId,
        userId,
        userName,
        userColor,
        action: "col_delete",
        detail: `Deleted column "${colName}"`,
    });
}

/** Call when a formula is set */
export function logFormulaSet(
    sheetId: string,
    cellRef: string,
    formula: string,
    userName = "You",
    userColor = "#0d7c5f",
    userId = "local"
) {
    return logHistory({
        sheetId,
        userId,
        userName,
        userColor,
        action: "formula_set",
        detail: `Set formula on ${cellRef}: ${formula}`,
        newValue: formula,
    });
}

/** Call when a column is renamed */
export function logColumnRename(
    sheetId: string,
    oldName: string,
    newName: string,
    userName = "You",
    userColor = "#0d7c5f",
    userId = "local"
) {
    return logHistory({
        sheetId,
        userId,
        userName,
        userColor,
        action: "column_rename",
        detail: `Renamed column "${oldName}" → "${newName}"`,
        oldValue: oldName,
        newValue: newName,
    });
}