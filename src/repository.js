// This module accepts a client so failure paths can be tested without a database.
export async function requireResult(request) {
  const result = await request;
  if (result.error) throw result.error;
  return result.data;
}

export async function loadRecords(client, signal) {
  const ordered = (table, column, options) => {
    const request = client.from(table).select('*').order(column, options);
    return requireResult(signal ? request.abortSignal(signal) : request);
  };
  const [people, weeks, fetches, games] = await Promise.all([
    ordered('people', 'name'),
    ordered('weeks', 'date', { ascending: false }),
    ordered('fetches', 'date', { ascending: false }),
    ordered('games', 'date', { ascending: false }),
  ]);
  return { people, weeks, fetches, games };
}

export async function writeRecord(client, table, operation, record, id) {
  let request = client.from(table)[operation](record);
  if (id !== undefined) request = request.eq('id', id);
  // A successful HTTP response with no matching row is not a confirmed save.
  return requireResult(request.select('id').single());
}

export function createMutationRunner(onChange) {
  let busy = false;
  return async (operation, onSuccess = () => {}) => {
    if (busy) return false;
    busy = true;
    onChange({ saving: true, mutationError: null, notice: null });
    try {
      await operation();
      onSuccess();
      onChange({ notice: 'Saved.' });
      return true;
    } catch {
      onChange({ mutationError: 'Could not confirm this change. Check your connection and the latest records before trying again.', notice: null });
      return false;
    } finally {
      busy = false;
      onChange({ saving: false });
    }
  };
}
