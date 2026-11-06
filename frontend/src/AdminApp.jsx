import { useCallback, useEffect, useMemo, useState } from 'react'
import './admin.css'

const currency = (amount) => Number(amount || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
const dateLabel = (value) => value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
const tabs = [
  ['overview', '◫', 'Overview'], ['collection', '▧', 'Collection'], ['bids', '↗', 'Live bids'], ['submissions', '✳', 'Artist submissions'], ['sales', '◎', 'Sales desk'],
]

async function api(path, options = {}) {
  let response
  try {
    response = await fetch(`/api/admin${path}`, { credentials: 'same-origin', ...options, headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers } })
  } catch { throw new Error('Could not connect to the gallery service. Start the gallery and API, then try again.') }
  const text = await response.text()
  let data = {}
  try { data = text ? JSON.parse(text) : {} } catch { throw new Error('The gallery service returned an unreadable response. Restart it and try again.') }
  if (!response.ok) throw new Error(data.error || 'The request could not be completed.')
  return data
}

function AdminApp() {
  const [username, setUsername] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  const [checking, setChecking] = useState(true)
  const [busy, setBusy] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [notice, setNotice] = useState('')
  const [data, setData] = useState({ artworks: [], bids: [], submissions: [], purchases: [] })
  const [view, setView] = useState('overview')
  const [search, setSearch] = useState('')
  const [saleOpen, setSaleOpen] = useState(false)
  const [saleError, setSaleError] = useState('')
  const [saleBusy, setSaleBusy] = useState(false)

  const refresh = useCallback(async () => setData(await api('/overview')), [])
  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Admin Studio — Azure Galleria'
    return () => { document.title = previousTitle }
  }, [])
  useEffect(() => {
    let active = true
    api('/me').then((session) => {
      if (!active) return
      setUsername(session.username || '')
      setLoggedIn(Boolean(session.authenticated))
      if (session.authenticated) return refresh().catch((error) => { if (active) setNotice(error.message) })
    }).catch((error) => { if (active) setLoginError(error.message) }).finally(() => { if (active) setChecking(false) })
    return () => { active = false }
  }, [refresh])

  const bidLeaders = useMemo(() => data.artworks.map((artwork) => {
    const offers = data.bids.filter((bid) => Number(bid.artworkId) === Number(artwork.id))
    const leader = offers.reduce((best, bid) => !best || Number(bid.amount) > Number(best.amount) ? bid : best, null)
    return { ...artwork, offers, leader, currentBid: leader ? Number(leader.amount) : Number(artwork.price) }
  }).sort((a, b) => b.currentBid - a.currentBid), [data])

  const filteredArtworks = useMemo(() => data.artworks.filter((art) => `${art.name} ${art.artist} ${art.category}`.toLowerCase().includes(search.toLowerCase().trim())), [data.artworks, search])
  const pending = data.submissions.filter((item) => item.status === 'pending')
  const grossSales = data.purchases.reduce((total, item) => total + Number(item.amount || 0), 0)

  async function signIn(event) {
    event.preventDefault(); setBusy(true); setLoginError('')
    const form = new FormData(event.currentTarget)
    try {
      const session = await api('/login', { method: 'POST', body: JSON.stringify({ username: form.get('username'), password: form.get('password') }) })
      await refresh(); setUsername(session.username); setLoggedIn(true)
    } catch (error) { setLoginError(error.message) }
    finally { setBusy(false) }
  }

  async function signOut() {
    try { await api('/logout', { method: 'POST' }) } catch { setNotice('Could not reach the gallery API to end the session. Please try signing out again.') }
    setLoggedIn(false); setData({ artworks: [], bids: [], submissions: [], purchases: [] }); setView('overview')
  }

  async function reviewSubmission(item, decision) {
    try {
      await api(`/submissions/${encodeURIComponent(item.id)}/review`, { method: 'POST', body: JSON.stringify({ decision }) })
      await refresh(); setNotice(decision === 'approve' ? `${item.title} is now in the collection.` : `${item.title} was declined.`)
    } catch (error) { setNotice(error.message) }
  }

  async function recordSale(event) {
    event.preventDefault(); setSaleBusy(true); setSaleError('')
    const form = new FormData(event.currentTarget)
    try {
      await api('/purchases', { method: 'POST', body: JSON.stringify({ artworkId: form.get('artworkId'), buyer: form.get('buyer'), amount: form.get('amount'), date: form.get('date') }) })
      await refresh(); setSaleOpen(false); setNotice('Sale recorded in the gallery ledger.')
    } catch (error) { setSaleError(error.message) }
    finally { setSaleBusy(false) }
  }

  if (checking) return <div className="admin-loading"><span className="admin-spinner"/>Opening your studio…</div>
  if (!loggedIn) return <AdminLogin onSubmit={signIn} busy={busy} error={loginError} />

  return <div className="studio-shell">
    <aside className="studio-sidebar"><a className="studio-logo" href="/" aria-label="Return to Azure Galleria"><img src="/images/gallery-emblem.png" alt=""/><span>Azure Galleria</span></a><div className="studio-label">YOUR PRIVATE STUDIO</div><nav className="studio-nav" aria-label="Admin navigation">{tabs.map(([id,icon,label])=><button key={id} className={view===id?'active':''} onClick={()=>{setView(id);setSearch('')}}><span>{icon}</span>{label}{id==='submissions'&&pending.length>0&&<b>{pending.length}</b>}</button>)}</nav><div className="studio-sidebar-foot"><div className="studio-live"><i/>Azure Galleria connected</div><a href="/">← View public gallery</a><button onClick={signOut}>Sign out <span>↗</span></button></div></aside>
    <main className="studio-main"><header className="studio-topbar"><div><p>AZURE GALLERIA <span>/</span> STUDIO</p><h1>{tabs.find(([id])=>id===view)?.[2]}</h1></div><div className="studio-top-actions"><time>{new Date().toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})}</time><span className="studio-user"><i>{(username[0]||'A').toUpperCase()}</i>{username}</span></div></header>
      {notice&&<div className="studio-notice" role="status"><span>{notice}</span><button onClick={()=>setNotice('')} aria-label="Dismiss">×</button></div>}
      {view==='overview'&&<Overview data={data} pending={pending} leaders={bidLeaders} grossSales={grossSales} setView={setView}/>}
      {view==='collection'&&<section className="studio-view"><div className="studio-view-head"><div><p className="studio-eyebrow">EVERY PIECE, IN ITS PLACE</p><h2>The collection</h2><p>{data.artworks.length} artworks across three collections.</p></div><label className="studio-search"><span>⌕</span><input value={search} onChange={(event)=>setSearch(event.target.value)} placeholder="Search artist or artwork"/></label></div><div className="studio-art-grid">{filteredArtworks.map((art,index)=><article className="studio-art-card" key={art.id}><div className="studio-art-image"><img src={imageUrl(art.image)} alt={art.alt||art.name}/><span>{String(index+1).padStart(2,'0')}</span>{art.status==='sold'&&<b>SOLD</b>}</div><div className="studio-art-info"><small>{categoryName(art.category)}</small><h3>{art.name}</h3><p>{art.artist}</p><div><span>{art.status==='sold'?'Sale price':'Current bid'}<strong>{currency(art.status==='sold'?data.purchases.find((sale)=>Number(sale.artworkId)===Number(art.id))?.amount:bidLeaders.find((leader)=>Number(leader.id)===Number(art.id))?.currentBid||art.price)}</strong></span><span>{data.bids.filter((bid)=>Number(bid.artworkId)===Number(art.id)).length} offers</span></div></div></article>)}</div>{!filteredArtworks.length&&<Empty text="No artworks match this search."/>}</section>}
      {view==='bids'&&<section className="studio-view"><div className="studio-view-head"><div><p className="studio-eyebrow">THE AUCTION ROOM</p><h2>Every offer, in real time.</h2><p>{data.bids.length} bids recorded across the collection.</p></div><label className="studio-search"><span>⌕</span><input value={search} onChange={(event)=>setSearch(event.target.value)} placeholder="Search bids"/></label></div><div className="studio-panel"><div className="studio-panel-title"><div><small>LEADING OFFERS</small><h3>Current bid leaders</h3></div><span className="studio-live-pill"><i/>LIVE DATA</span></div><div className="studio-table-wrap"><table className="studio-table"><thead><tr><th>Artwork</th><th>Artist</th><th>Top offer</th><th>Leading bidder</th><th>Offers</th></tr></thead><tbody>{bidLeaders.filter((art)=>art.offers.length&&`${art.name} ${art.artist} ${art.leader?.bidder}`.toLowerCase().includes(search.toLowerCase())).map((art)=><tr key={art.id}><td><strong>{art.name}</strong></td><td>{art.artist}</td><td className="studio-price">{currency(art.currentBid)}</td><td>{art.leader?.bidder||'—'}</td><td><span className="studio-count">{art.offers.length}</span></td></tr>)}</tbody></table>{!data.bids.length&&<Empty text="No bids yet. New offers will appear here as collectors place them."/>}</div></div><div className="studio-panel"><div className="studio-panel-title"><div><small>THE FULL PICTURE</small><h3>Recent bid activity</h3></div></div><div className="studio-table-wrap"><table className="studio-table"><thead><tr><th>Artwork</th><th>Collector</th><th>Amount</th><th>Placed</th></tr></thead><tbody>{data.bids.filter((bid)=>`${bid.artwork} ${bid.bidder}`.toLowerCase().includes(search.toLowerCase())).map((bid)=><tr key={bid.id}><td><strong>{bid.artwork}</strong></td><td>{bid.bidder}</td><td className="studio-price">{currency(bid.amount)}</td><td>{dateLabel(bid.createdAt)}</td></tr>)}</tbody></table>{!data.bids.length&&<Empty text="Your bid history will appear here."/>}</div></div></section>}
      {view==='submissions'&&<section className="studio-view"><div className="studio-view-head"><div><p className="studio-eyebrow">ARTIST RELATIONS</p><h2>New work, new perspectives.</h2><p>{pending.length} waiting for your eye.</p></div><a className="studio-soft-link" href="/">Open the gallery ↗</a></div><div className="studio-submission-grid">{data.submissions.map((item)=><article className="studio-submission" key={item.id}><div className="studio-submission-image"><img src={imageUrl(item.image)} alt={item.title}/><span className={`studio-status ${item.status}`}>{statusLabel(item.status)}</span></div><div className="studio-submission-copy"><small>{categoryName(item.category)} · {dateLabel(item.submittedAt)}</small><h3>{item.title}</h3><p>by {item.artist}</p><div className="studio-submission-price">Suggested opening bid <strong>{currency(item.price)}</strong></div>{item.story&&<blockquote>{item.story}</blockquote>}{item.status==='pending'?<div className="studio-review-actions"><button className="studio-approve" onClick={()=>reviewSubmission(item,'approve')}>Add to collection <span>↗</span></button><button className="studio-decline" onClick={()=>reviewSubmission(item,'decline')}>Decline</button></div>:<p className="studio-reviewed">Reviewed {dateLabel(item.reviewedAt)}</p>}</div></article>)}</div>{!data.submissions.length&&<Empty text="No submissions yet. New artist submissions will appear here for review."/>}</section>}
      {view==='sales'&&<section className="studio-view"><div className="studio-view-head"><div><p className="studio-eyebrow">A RECORD OF THE WORK THAT FOUND A HOME</p><h2>Sales desk</h2><p>Record completed sales made outside the gallery checkout.</p></div><button className="studio-primary" onClick={()=>{setSaleError('');setSaleOpen(true)}}>＋ Record a sale</button></div><div className="studio-sales-summary"><article><small>RECORDED SALES</small><strong>{data.purchases.length}</strong><span>completed artwork purchases</span></article><article><small>GROSS SALES</small><strong>{currency(grossSales)}</strong><span>based on manually recorded sales</span></article><article><small>AVAILABLE WORKS</small><strong>{data.artworks.filter((art)=>art.status!=='sold').length}</strong><span>ready for a new collector</span></article></div><div className="studio-panel"><div className="studio-panel-title"><div><small>COLLECTOR RECORDS</small><h3>Completed purchases</h3></div><span className="studio-count">{data.purchases.length} SALES</span></div><div className="studio-table-wrap"><table className="studio-table"><thead><tr><th>Artwork</th><th>Artist</th><th>Collector</th><th>Sale price</th><th>Sale date</th></tr></thead><tbody>{data.purchases.map((item)=><tr key={item.id}><td><strong>{item.artwork}</strong></td><td>{item.artist}</td><td>{item.buyer}</td><td className="studio-price">{currency(item.amount)}</td><td>{dateLabel(item.date)}</td></tr>)}</tbody></table>{!data.purchases.length&&<Empty text="No sales have been recorded yet. Record an off-platform sale to keep your collection ledger up to date."/>}</div></div><p className="studio-disclaimer">The gallery does not currently process checkout payments. Sales shown here are records entered by an administrator.</p></section>}
    </main>
    {saleOpen&&<div className="studio-modal-backdrop" onMouseDown={(event)=>{if(event.target===event.currentTarget)setSaleOpen(false)}}><section className="studio-sale-modal" role="dialog" aria-modal="true" aria-labelledby="saleTitle"><button className="studio-modal-close" onClick={()=>setSaleOpen(false)} aria-label="Close">×</button><p className="studio-eyebrow">SALES DESK</p><h2 id="saleTitle">Record a completed sale</h2><p className="sale-modal-copy">Keep a note of an artwork sold outside the gallery checkout.</p><form onSubmit={recordSale}><label>Artwork<select name="artworkId" required defaultValue=""><option value="" disabled>Choose an available artwork</option>{data.artworks.filter((art)=>art.status!=='sold').map((art)=><option value={art.id} key={art.id}>{art.name} · {art.artist}</option>)}</select></label><label>Collector name<input name="buyer" required maxLength="120" placeholder="Collector’s name"/></label><label>Sale price (INR)<input name="amount" required type="number" min="1" step="1" placeholder="0"/></label><label>Sale date<input name="date" required type="date" defaultValue={new Date().toISOString().slice(0,10)}/></label>{saleError&&<p className="studio-form-error" role="alert">{saleError}</p>}<button className="studio-primary" disabled={saleBusy}>{saleBusy?'Saving…':'Save sale record'} <span>↗</span></button></form></section></div>}
  </div>
}

function Overview({ data, pending, leaders, grossSales, setView }) {
  const recent = data.bids.slice().sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0)).slice(0,5)
  return <section className="studio-view"><div className="studio-welcome"><div className="studio-welcome-copy"><p className="studio-eyebrow">YOUR GALLERY, AT A GLANCE</p><h2>A good day to<br/><em>make room for art.</em></h2><p>Here’s what’s happening across your gallery today.</p><button onClick={()=>setView('submissions')}>Review new work <span>↗</span>{pending.length>0&&<b>{pending.length}</b>}</button></div><div className="studio-welcome-art"><img src="/images/europeana-vrNNBydA8Wo-unsplash.jpg" alt="Sunlit gallery interior"/><span>CURATED WITH CARE<br/><i>✳</i></span></div></div><div className="studio-metrics"><Metric icon="▧" label="IN THE COLLECTION" value={data.artworks.length} note="Original works on view" tone="sage"/><Metric icon="↗" label="LIVE OFFERS" value={data.bids.length} note="Across the collection" tone="sand"/><Metric icon="✳" label="AWAITING YOUR EYE" value={pending.length} note="Artist submissions" tone="rose"/><Metric icon="◎" label="RECORDED SALES" value={currency(grossSales)} note={`${data.purchases.length} completed sales`} tone="blue"/></div><div className="studio-overview-grid"><section className="studio-panel"><div className="studio-panel-title"><div><small>THE AUCTION ROOM</small><h3>Recent offers</h3></div><button className="studio-panel-link" onClick={()=>setView('bids')}>All bids ↗</button></div>{recent.length?recent.map((bid)=><div className="studio-activity" key={bid.id}><span className="activity-mark">↗</span><div><strong>{bid.artwork}</strong><small>{bid.bidder} · {dateLabel(bid.createdAt)}</small></div><b>{currency(bid.amount)}</b></div>):<Empty text="The next offer could be the first. Bids will appear here as collectors discover your work."/>}</section><section className="studio-panel studio-review-panel"><div className="studio-panel-title"><div><small>ARTIST RELATIONS</small><h3>At your review table</h3></div><span className="studio-count">{pending.length} NEW</span></div>{pending.slice(0,3).map((item)=><div className="studio-review-row" key={item.id}><img src={imageUrl(item.image)} alt=""/><div><strong>{item.title}</strong><small>{item.artist} · {categoryName(item.category)}</small></div><button onClick={()=>setView('submissions')} aria-label={`Review ${item.title}`}>↗</button></div>)}{!pending.length&&<Empty text="All caught up. New artist submissions will land here."/>}<button className="studio-review-all" onClick={()=>setView('submissions')}>Open artist submissions <span>↗</span></button></section></div><p className="studio-data-note">Bids are offers, not completed purchases. Sales are recorded separately in the Sales desk.</p></section>
}

function Metric({icon,label,value,note,tone}) { return <article className={`studio-metric ${tone}`}><span className="metric-icon">{icon}</span><small>{label}</small><strong>{value}</strong><p>{note}</p><i className="metric-spark"/></article> }
function Empty({text}) { return <div className="studio-empty"><span>✳</span><p>{text}</p></div> }
function imageUrl(image) { return !image ? '' : /^https?:\/\//i.test(image) ? image : `/images/${image}` }
function categoryName(category) { return ({'traditional-art':'Traditional art',sculptures:'Sculpture','modern-art':'Modern art'})[category]||category||'Artwork' }
function statusLabel(status) { return ({pending:'Awaiting review',approved:'Added to collection',declined:'Declined'})[status]||status }

function AdminLogin({ onSubmit, busy, error }) {
  return <main className="admin-login"><section className="admin-login-art"><img src="/images/national-gallery-of-art-wAQpwc0rM1g-unsplash.jpg" alt="A painting in the gallery"/><div className="login-art-shade"/><a className="admin-login-brand" href="/"><img src="/images/gallery-emblem.png" alt=""/><span>Azure Galleria</span></a><div className="login-art-copy"><span>THE QUIET WORK BEHIND THE ART</span><h1>Care for every<br/><em>little detail.</em></h1><p>Your gallery, your artists, your collectors — all in one considered space.</p></div><small className="login-art-foot">AZURE GALLERIA · PRIVATE STUDIO</small></section><section className="admin-login-side"><div className="admin-login-card"><p className="studio-eyebrow">A PRIVATE SPACE FOR YOUR GALLERY</p><h2>Welcome<br/>to the studio.</h2><p className="admin-login-intro">Sign in to keep an eye on the collection and everything happening around it.</p><form onSubmit={onSubmit}><label>Admin username<input name="username" autoComplete="username" required placeholder="Your admin username"/></label><label>Password<input name="password" type="password" autoComplete="current-password" required placeholder="Your private password"/></label>{error&&<p className="admin-login-error" role="alert">{error}</p>}<button className="admin-login-submit" disabled={busy}>{busy?'Opening your studio…':'Enter the studio'}<span>↗</span></button></form><div className="admin-login-note"><span>✳</span><p>Admin access is private. Set your credentials in <code>backend/.env</code> to unlock the studio.</p></div><a className="admin-back-link" href="/">← Back to the gallery</a></div><footer className="admin-login-footer"><span>AZURE GALLERIA · 2026</span><span>MADE FOR THE LOVE OF ART</span></footer></section></main>
}

export default AdminApp

