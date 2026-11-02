import { useState } from 'react';
import { activityEntries } from './activity.js';
import { fmtDate, matchSides } from './domain.js';
import { Sheet, Btn, Icon } from './ui.jsx';
import { WeekEditor, DateField } from './screens.jsx';
import { MatchEditor } from './games.jsx';

function FetchEditor({ store, record, onClose }) {
  const [personId, setPersonId] = useState(record.personId);
  const [date, setDate] = useState(record.date);
  const people = store.people.some(person => person.id === record.personId) ? store.people : [...store.people, { id: record.personId, name: 'Former member' }];
  return <Sheet open onClose={store.saving ? undefined : onClose} title="Edit fetch">
    <fieldset disabled={store.saving} className="editor-fields">
      <label style={{ display: 'block', color: 'var(--muted)', marginBottom: 8 }} htmlFor="fetch-person">Fetcher</label>
      <select id="fetch-person" value={personId} onChange={e => setPersonId(e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 12, background: 'var(--sunken)', color: 'var(--ink)', border: '1px solid var(--line)', font: 'inherit', marginBottom: 18 }}>
        {people.map(person => <option key={person.id} value={person.id}>{person.name}</option>)}
      </select>
      <DateField value={date} onChange={setDate} />
      <Btn disabled={!personId || !date || store.saving} onClick={async () => { if (await store.updateFetch(record.id, { personId, date })) onClose(); }} style={{ width: '100%', marginTop: 20 }}>{store.saving ? 'Saving…' : 'Save changes'}</Btn>
    </fieldset>
  </Sheet>;
}

export function ActivityHistory({ store, open, onClose }) {
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [editor, setEditor] = useState(null);
  const [confirm, setConfirm] = useState(false);
  const entries = activityEntries(store);
  const item = entries.find(entry => entry.type === selected?.type && entry.record.id === selected?.id);
  const editing = entries.find(entry => entry.type === editor?.type && entry.record.id === editor?.id);
  const choose = entry => setSelected({ type: entry.type, id: entry.record.id });
  const closeDetail = () => { if (!store.saving) { setSelected(null); setConfirm(false); } };
  const deleteRecord = async () => {
    if (!item || store.saving) return;
    const remove = { weeks: store.deleteWeek, games: store.deleteGame, fetches: store.deleteFetch }[item.type];
    if (await remove(item.record.id)) closeDetail();
  };
  const record = item?.record;
  const sides = item?.type === 'games' ? matchSides(record) : null;
  const names = ids => ids.map(id => store.personById(id)?.name || 'Former member').join(', ');
  return <>
    <Sheet open={open && !item && !editing} onClose={onClose} title="Activity history">
      <div role="group" aria-label="Activity filter" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {[['all', 'All'], ['weeks', 'Gatherings'], ['games', 'Matches'], ['fetches', 'Fetches']].map(([value, label]) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)} style={{ border: 'none', borderRadius: 20, padding: '9px 12px', font: 'inherit', fontSize: 12, background: filter === value ? 'var(--accent-soft)' : 'var(--sunken)', color: filter === value ? 'var(--accent)' : 'var(--muted)', cursor: 'pointer' }}>{label}</button>)}
      </div>
      <div style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 12 }}>Newest event date first</div>
      {!entries.some(entry => filter === 'all' || entry.type === filter) && <p style={{ color: 'var(--muted)' }}>No entries yet.</p>}
      {entries.filter(entry => filter === 'all' || entry.type === filter).map(entry => <button key={`${entry.type}-${entry.record.id}`} type="button" onClick={() => choose(entry)} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', padding: '13px 0', border: 'none', borderBottom: '1px solid var(--line)', background: 'none', font: 'inherit', cursor: 'pointer' }}>
        <Icon name={entry.type === 'weeks' ? 'calendar' : entry.type === 'games' ? 'gamepad' : 'wheel'} size={21} color="var(--accent)" />
        <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: 'block', color: 'var(--muted)', fontSize: 11 }}>{entry.label} · {fmtDate(entry.record.date)}</span><span style={{ display: 'block', color: 'var(--ink)', marginTop: 3, fontSize: 14 }}>{entry.title}</span><span style={{ display: 'block', color: 'var(--muted)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.detail}</span></span>
        <Icon name="chevronRight" size={16} color="var(--faint)" />
      </button>)}
    </Sheet>
    <Sheet open={open && !!item} onClose={store.saving ? undefined : closeDetail} title={confirm ? 'Delete this entry?' : item?.label}>
      {item && <>
        <div style={{ color: 'var(--ink)', fontSize: 18, marginBottom: 5 }}>{item.title}</div>
        <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 16 }}>{fmtDate(record.date)}</div>
        {item.type === 'weeks' && <><p style={{ color: 'var(--ink)' }}>Attendees: {names(record.attendees) || 'None recorded'}</p><p style={{ color: 'var(--muted)', whiteSpace: 'pre-wrap' }}>Dinner: {record.note || 'Not recorded'}</p></>}
        {sides && <><p style={{ color: 'var(--ink)' }}>Winners: {names(sides.winners)}</p><p style={{ color: 'var(--muted)' }}>Players: {names(sides.players)}</p></>}
        {confirm ? <>
          <p style={{ color: 'var(--muted)' }}>This permanently removes this {item.label.toLowerCase()} from the app. It cannot be undone.</p>
          <div style={{ display: 'flex', gap: 10 }}><Btn variant="ghost" disabled={store.saving} onClick={() => setConfirm(false)}>Cancel</Btn><Btn variant="danger" disabled={store.saving} onClick={deleteRecord}>{store.saving ? 'Deleting…' : 'Delete entry'}</Btn></div>
        </> : <div style={{ display: 'flex', gap: 10, marginTop: 20 }}><Btn icon="edit" onClick={() => { setEditor(selected); setSelected(null); }}>Edit</Btn><Btn variant="danger" icon="trash" onClick={() => setConfirm(true)}>Delete</Btn></div>}
      </>}
    </Sheet>
    {open && editing?.type === 'weeks' && <WeekEditor store={store} open editing={editing.record} onClose={() => setEditor(null)} />}
    {open && editing?.type === 'games' && <MatchEditor store={store} open editing={editing.record} onClose={() => setEditor(null)} />}
    {open && editing?.type === 'fetches' && <FetchEditor store={store} record={editing.record} onClose={() => setEditor(null)} />}
  </>;
}
