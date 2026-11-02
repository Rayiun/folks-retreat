export function activityEntries({ weeks = [], games = [], fetches = [], personById }) {
  const name = id => personById(id)?.name || 'Former member';
  return [
    ...weeks.map(record => ({ type: 'weeks', record, label: 'Gathering', title: record.hostId ? name(record.hostId) : 'Collective Failure', detail: `${record.attendees.length} attended${record.note ? ` · ${record.note}` : ''}` })),
    ...games.map(record => ({ type: 'games', record, label: 'Match', title: record.cat === 'fifa' ? 'FIFA' : record.title || 'Others', detail: (record.format === 'teams' ? [...(record.teamA || []), ...(record.teamB || [])] : record.players || []).map(name).join(', ') })),
    ...fetches.map(record => ({ type: 'fetches', record, label: 'Fetch', title: name(record.personId), detail: 'Food run' })),
  ].sort((a, b) => b.record.date.localeCompare(a.record.date) || a.type.localeCompare(b.type) || a.record.id.localeCompare(b.record.id));
}
