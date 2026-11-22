import { useState } from "react";

import type { SearchItemOut, SearchType } from "@/lib/api/types";
import { useI18n, type MessageKey } from "@/lib/i18n";

import { PAGE_SIZE } from "../config";
import { errorText } from "../errors";
import { useAdminSearch } from "../hooks/useAdminQueries";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useSuspendEvent, useSuspendUser } from "../hooks/useSuspension";
import { ConfirmDialog } from "./ConfirmDialog";
import { ListState } from "./ListState";
import { Pager } from "./Pager";

interface Target {
  item: SearchItemOut;
  /** true = suspend, false = unsuspend. */
  suspend: boolean;
}

function dialogKey(item: SearchItemOut, suspend: boolean): string {
  return `admin.dlg.${suspend ? "suspend" : "unsuspend"}${item.type === "event" ? "Event" : "User"}`;
}

export function SearchTab() {
  const { t } = useI18n();
  const [text, setText] = useState("");
  const [type, setType] = useState<SearchType>("user");
  const [offset, setOffset] = useState(0);
  const q = useDebouncedValue(text.trim(), 300);

  const search = useAdminSearch(q, type, PAGE_SIZE, offset);
  const suspendEvent = useSuspendEvent();
  const suspendUser = useSuspendUser();

  const [target, setTarget] = useState<Target | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const data = search.data;

  const openDialog = (item: SearchItemOut) => {
    setError(null);
    setTarget({ item, suspend: !item.suspended });
  };
  const closeDialog = () => {
    setTarget(null);
    setError(null);
  };

  const confirm = async () => {
    if (!target) return;
    setPending(true);
    setError(null);
    try {
      const mutation = target.item.type === "event" ? suspendEvent : suspendUser;
      await mutation.mutateAsync({ id: target.item.id, suspend: target.suspend });
      setTarget(null);
    } catch (e) {
      setError(errorText(e, t));
    } finally {
      setPending(false);
    }
  };

  const statusLabel = (item: SearchItemOut) =>
    (item.type === "event" ? t(`status.${item.status}` as MessageKey) : "") || item.status;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="mb-1 block text-gray-600">{t("admin.search.type")}</span>
          <select
            className="rounded border px-2 py-1.5"
            value={type}
            onChange={(e) => {
              setType(e.target.value as SearchType);
              setOffset(0);
            }}
          >
            <option value="user">{t("admin.search.type.user")}</option>
            <option value="event">{t("admin.search.type.event")}</option>
          </select>
        </label>
        <label className="min-w-[16rem] flex-1 text-sm">
          <span className="mb-1 block text-gray-600">{t("events.search")}</span>
          <input
            type="search"
            className="w-full rounded border px-2 py-1.5"
            placeholder={t("admin.search.placeholder")}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setOffset(0);
            }}
          />
        </label>
      </div>

      {q.length === 0 ? (
        <p className="text-sm text-gray-600">{t("admin.search.hint")}</p>
      ) : (
        <ListState
          isLoading={search.isFetching && !data}
          error={search.error}
          onRetry={() => void search.refetch()}
          isEmpty={!!data && data.items.length === 0}
          emptyText={t("admin.search.empty")}
        >
          {data && (
            <>
              <p className="mb-2 text-sm text-gray-600">
                {t("events.found")}: {data.total}
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b text-gray-600">
                    <tr>
                      <th className="py-2 pr-4">{t("admin.col.item")}</th>
                      <th className="py-2 pr-4">{t("admin.col.status")}</th>
                      <th className="py-2 pr-4">{t("admin.col.actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((item) => (
                      <tr key={`${item.type}-${item.id}`} className="border-b">
                        <td className="py-2 pr-4">{item.label}</td>
                        <td className="py-2 pr-4">
                          {statusLabel(item)}
                          {item.suspended && (
                            <span className="ml-2 inline-block rounded bg-red-100 px-2 py-0.5 text-xs text-red-800">
                              {t("admin.suspended")}
                            </span>
                          )}
                        </td>
                        <td className="py-2 pr-4">
                          <button
                            type="button"
                            className="rounded border px-3 py-1"
                            onClick={() => openDialog(item)}
                          >
                            {item.suspended ? t("admin.resume") : t("admin.suspend")}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pager total={data.total} limit={PAGE_SIZE} offset={offset} onChange={setOffset} />
            </>
          )}
        </ListState>
      )}

      <ConfirmDialog
        open={target !== null}
        title={target ? t(`${dialogKey(target.item, target.suspend)}.title` as MessageKey) : ""}
        description={
          target
            ? t(`${dialogKey(target.item, target.suspend)}.text` as MessageKey).replace(
                "$1",
                target.item.label,
              )
            : ""
        }
        confirmLabel={target?.suspend ? t("admin.suspend") : t("admin.resume")}
        isPending={pending}
        error={error}
        onConfirm={() => void confirm()}
        onCancel={closeDialog}
      />
    </div>
  );
}
