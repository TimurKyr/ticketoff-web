import { useState } from "react";

import { PAGE_SIZE } from "../config";
import { useAdminPayments } from "../hooks/useAdminQueries";
import { ListState } from "./ListState";
import { Pager } from "./Pager";
import { PaymentsTable } from "./PaymentsTable";

export function FailedPaymentsTab() {
  const [offset, setOffset] = useState(0);
  const query = useAdminPayments("failed", PAGE_SIZE, offset);
  const data = query.data;

  return (
    <ListState
      isLoading={query.isFetching && !data}
      error={query.error}
      onRetry={() => void query.refetch()}
      isEmpty={!!data && data.items.length === 0}
    >
      {data && (
        <>
          <PaymentsTable items={data.items} />
          <Pager total={data.total} limit={PAGE_SIZE} offset={offset} onChange={setOffset} />
        </>
      )}
    </ListState>
  );
}
