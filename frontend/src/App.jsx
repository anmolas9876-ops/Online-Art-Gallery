import { useEffect, useMemo, useState } from 'react'

async function readApiJson(response) {
  const body = await response.text()
  if (!body.trim()) throw new Error('The gallery API returned an empty response. Stop the old dev server and restart it with npm run dev from the frontend folder.')
  try { return JSON.parse(body) }
  catch { throw new Error('The gallery API returned an invalid response. Restart the frontend and API with npm run dev from the frontend folder.') }
}

function apiErrorMessage(error, fallback) {
  if (error instanceof TypeError) return 'Could not connect to the gallery API. Stop the old dev server and restart it with npm run dev from the frontend folder.'
  return error.message || fallback
}

const initialArtworks = [
  { id: 1, name: 'Girl with the Wheat Sheaf', artist: 'Clara Whitmore', category: 'traditional-art', kind: 'Traditional · Portrait', price: 1850, image: 'europeana-WS7wycSbVuY-unsplash.jpg', alt: 'Traditional portrait of a young woman carrying wheat' },
  { id: 2, name: 'A Quiet Supper', artist: 'Elise Beaumont', category: 'traditional-art', kind: 'Traditional · Portrait', price: 2200, image: 'europeana-XCXbKmxYbsI-unsplash.jpg', alt: 'Classical painting of a girl seated at a table' },
  { id: 3, name: 'Portrait in Blue', artist: 'Mateo Laurent', category: 'traditional-art', kind: 'Traditional · Portrait', price: 3400, image: 'national-gallery-of-art-wAQpwc0rM1g-unsplash.jpg', alt: 'Expressive blue and gold painted portrait' },
  { id: 4, name: 'The Grand Salon', artist: 'Beatrice Moreau', category: 'traditional-art', kind: 'Traditional · Gallery', price: 2750, image: 'europeana-vrNNBydA8Wo-unsplash.jpg', alt: 'Historic gallery interior filled with paintings' },
  { id: 5, name: 'Stillness in Stone', artist: 'Lucien Ardent', category: 'sculptures', kind: 'Sculpture · Marble', price: 4800, image: 'sara-darcaj-YzamNB_T4WQ-unsplash.jpg', alt: 'Marble sculpture of two entwined figures' },
  { id: 6, name: 'The Young Laureate', artist: 'Felix Rowan', category: 'sculptures', kind: 'Sculpture · Bust', price: 3900, image: 'jack-hunter-1L4E_lsIb9Q-unsplash.jpg', alt: 'Sculpted marble bust in dramatic light' },
  { id: 7, name: 'Mended in Gold', artist: 'Hana Sato', category: 'sculptures', kind: 'Sculpture · Contemporary', price: 5250, image: 'simon-lee-IEgvy4o3byM-unsplash.jpg', alt: 'Contemporary sculptural bust with gold detailing' },
  { id: 8, name: 'Gathering of the Muses', artist: 'Adrian Bellini', category: 'sculptures', kind: 'Sculpture · Figure group', price: 6100, image: 'iam_os-jst9zmbCD58-unsplash.jpg', alt: 'Classical marble figure group in a museum' },
  { id: 9, name: 'Colour in Motion', artist: 'Nina Calder', category: 'modern-art', kind: 'Modern · Abstract', price: 1650, image: 'jene-stephaniuk--MCrF6hnojU-unsplash.jpg', alt: 'Bright abstract painting with textured colorful brushstrokes' },
  { id: 10, name: 'Lines of a City', artist: 'Jules Mercer', category: 'modern-art', kind: 'Modern · Mixed media', price: 2450, image: 'claudio-schwarz-k39RGHmLoV8-unsplash.jpg', alt: 'Expressive modern mural in bold colors' },
  { id: 11, name: 'Sunroom No. 4', artist: 'Amara Cole', category: 'modern-art', kind: 'Modern · Abstract', price: 2900, image: 'steve-a-johnson-Xx_d26R37E4-unsplash.jpg', alt: 'Vibrant geometric abstract painting in orange and blue' },
  { id: 12, name: 'Many Ways of Seeing', artist: 'Devika Rao', category: 'modern-art', kind: 'Modern · Figurative', price: 3150, image: 'mayur-deshpande-zZPeoLxLRyM-unsplash.jpg', alt: 'Colorful cubist-inspired mural painting' },
]

const groups = [
  { id: 'traditional-art', eyebrow: 'TIMELESS WORKS', title: 'Traditional Art', description: 'Masterful portraits, historic scenes, and enduring detail.' },
  { id: 'sculptures', eyebrow: 'FORM IN THREE DIMENSIONS', title: 'Sculptures', description: 'Classical forms and contemporary interpretations in stone.' },
  { id: 'modern-art', eyebrow: 'NEW PERSPECTIVES', title: 'Modern Art', description: 'Vibrant canvases and bold ideas for contemporary spaces.' },
]

const heroSlides = [
  { eyebrow: 'THE ART OF LIVING WITH ART', title: <>Make room for<br/><em>something lasting.</em></>, description: 'Original works with stories, soul, and a place in your everyday.', image: 'europeana-vrNNBydA8Wo-unsplash.jpg', alt: 'Warmly lit gallery filled with original paintings', note: 'A COLLECTION OF STORIES', category: 'all' },
  { eyebrow: 'FIND YOUR NEW FAVOURITE', title: <>A little colour.<br/><em>A whole new feeling.</em></>, description: 'Meet the bold ideas and fresh perspectives shaping modern art.', image: 'jene-stephaniuk--MCrF6hnojU-unsplash.jpg', alt: 'Bright, expressive modern artwork', note: 'SEE THINGS DIFFERENTLY', category: 'modern-art' },
  { eyebrow: 'COLLECT WITH CURIOSITY', title: <>Good art stays<br/><em>with you.</em></>, description: 'Discover one-of-a-kind works from independent artists around the world.', image: 'national-gallery-of-art-wAQpwc0rM1g-unsplash.jpg', alt: 'Expressive painted portrait in a gallery', note: 'CHOSEN WITH CARE', category: 'traditional-art' },
]

const artists = [
  ['CW', 'traditional', 'TRADITIONAL · PORTRAIT', 'Clara Whitmore', 'Girl with the Wheat Sheaf'],
  ['EB', 'traditional', 'TRADITIONAL · PORTRAIT', 'Elise Beaumont', 'A Quiet Supper'],
  ['ML', 'traditional', 'TRADITIONAL · PORTRAIT', 'Mateo Laurent', 'Portrait in Blue'],
  ['BM', 'traditional', 'TRADITIONAL · GALLERY', 'Beatrice Moreau', 'The Grand Salon'],
  ['LA', 'sculpture', 'SCULPTURE · MARBLE', 'Lucien Ardent', 'Stillness in Stone'],
  ['FR', 'sculpture', 'SCULPTURE · BUST', 'Felix Rowan', 'The Young Laureate'],
  ['HS', 'sculpture', 'SCULPTURE · CONTEMPORARY', 'Hana Sato', 'Mended in Gold'],
  ['AB', 'sculpture', 'SCULPTURE · FIGURE GROUP', 'Adrian Bellini', 'Gathering of the Muses'],
  ['NC', 'modern', 'MODERN · ABSTRACT', 'Nina Calder', 'Colour in Motion'],
  ['JM', 'modern', 'MODERN · MIXED MEDIA', 'Jules Mercer', 'Lines of a City'],
  ['AC', 'modern', 'MODERN · ABSTRACT', 'Amara Cole', 'Sunroom No. 4'],
  ['DR', 'modern', 'MODERN · FIGURATIVE', 'Devika Rao', 'Many Ways of Seeing'],
]

const formatINR = (amount) => Number(amount).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
const artworkImageUrl = (image) => /^https?:\/\//i.test(image || '') ? image : `/images/${image}`

function App() {
  const [authPage, setAuthPage] = useState(() => ['login', 'register'].includes(window.location.pathname.slice(1)) ? window.location.pathname.slice(1) : null)
  const [artworks, setArtworks] = useState(initialArtworks)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [artistCategory, setArtistCategory] = useState('all')
  const [slide, setSlide] = useState(0)
  const [autoSlide, setAutoSlide] = useState(true)
  const [bidItem, setBidItem] = useState(null)
  const [bidAmount, setBidAmount] = useState('')
  const [bidderName, setBidderName] = useState('')
  const [submissionOpen, setSubmissionOpen] = useState(false)
  const [authMode, setAuthMode] = useState(null)
  const [authUser, setAuthUser] = useState(null)
  const [authError, setAuthError] = useState('')
  const [authBusy, setAuthBusy] = useState(false)
  const [myBidsOpen, setMyBidsOpen] = useState(false)
  const [myBidsBusy, setMyBidsBusy] = useState(false)
  const [myBidsError, setMyBidsError] = useState('')
  const [myBids, setMyBids] = useState([])
  const [notice, setNotice] = useState('')
  const [bids, setBids] = useState(() => {
    try { return JSON.parse(localStorage.getItem('artGalleryMyBids') || '[]') } catch { return [] }
  })

  useEffect(() => {
    const syncAuthPage = () => setAuthPage(['login', 'register'].includes(window.location.pathname.slice(1)) ? window.location.pathname.slice(1) : null)
    window.addEventListener('popstate', syncAuthPage)
    return () => window.removeEventListener('popstate', syncAuthPage)
  }, [])

  const goToAuthPage = (page) => {
    window.history.pushState({}, '', `/${page}`)
    setAuthPage(page)
    setAuthError('')
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  const leaveAuthPage = () => {
    window.history.pushState({}, '', '/')
    setAuthPage(null)
    setAuthError('')
  }

  useEffect(() => {
    let mounted = true
    fetch('/api/artworks').then((response) => response.ok ? response.json() : Promise.reject()).then((data) => { if (mounted && Array.isArray(data) && data.length) setArtworks(data) }).catch(() => {})
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    fetch('/api/auth/me').then((response) => response.ok ? response.json() : null).then((data) => { if (data?.user) setAuthUser(data.user) }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!autoSlide) return
    const timer = window.setInterval(() => setSlide((current) => (current + 1) % heroSlides.length), 5000)
    return () => window.clearInterval(timer)
  }, [autoSlide])

  const visibleArtworks = useMemo(() => artworks.filter((art) => {
    const matchesCategory = category === 'all' || art.category === category
    const text = `${art.name} ${art.artist} ${art.category} ${art.kind || ''}`.toLowerCase()
    return matchesCategory && text.includes(query.toLowerCase().trim())
  }), [artworks, category, query])

  const chooseCategory = (next) => {
    setCategory(next)
    document.getElementById(next === 'all' ? 'paintings' : next)?.scrollIntoView({ behavior: 'smooth' })
  }

  const placeBid = async (event) => {
    event.preventDefault()
    const value = Number(bidAmount)
    if (!bidItem || !Number.isFinite(value) || value <= Number(bidItem.price)) {
      setNotice(`Enter a bid higher than ${formatINR(bidItem?.price || 0)}.`)
      return
    }
    const newBid = { artworkId: bidItem.id, artwork: bidItem.name, bidder: (authUser?.name || bidderName).trim(), amount: value, createdAt: new Date().toISOString() }
    try {
      const response = await fetch('/api/bids', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newBid) })
      const savedBid = await readApiJson(response)
      if (!response.ok) throw new Error(savedBid.error || 'Could not save this bid.')
      Object.assign(newBid, savedBid)
    } catch (error) {
      setNotice(apiErrorMessage(error, 'The gallery service is unavailable. Please try again.'))
      return
    }
    const nextBids = [newBid, ...bids]
    setArtworks((items) => items.map((art) => art.id === bidItem.id ? { ...art, price: value } : art))
    setBids(nextBids)
    try { localStorage.setItem('artGalleryMyBids', JSON.stringify(nextBids)) } catch { /* API remains the source of truth. */ }
    setNotice(`Your ${formatINR(value)} bid on “${bidItem.name}” has been placed.`)
    setBidItem(null)
    setBidAmount('')
    setBidderName('')
  }

  const submitArtwork = async (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const submission = Object.fromEntries(formData.entries())
    submission.price = Number(submission.price)
    try {
      const response = await fetch('/api/submissions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(submission) })
      const data = await readApiJson(response)
      if (!response.ok) throw new Error(data.error || 'Could not submit this artwork.')
    } catch {
      setNotice('Could not connect to the gallery API. Stop the old dev server and restart it with npm run dev from the frontend folder.')
      return
    }
    setSubmissionOpen(false)
    setNotice('Your artwork was sent to the gallery team for review.')
  }

  const submitAuth = async (event) => {
    event.preventDefault()
    setAuthError('')
    setAuthBusy(true)
    const formData = new FormData(event.currentTarget)
    const payload = Object.fromEntries(formData.entries())
    try {
      const mode = authPage || authMode
      const response = await fetch(`/api/auth/${mode}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await readApiJson(response)
      if (!response.ok) throw new Error(data.error || 'Could not sign in. Please try again.')
      setAuthUser(data.user)
      setBidderName(data.user.name)
      if (authPage) leaveAuthPage()
      setAuthMode(null)
      setNotice((authPage || authMode) === 'register' ? `Welcome to the gallery, ${data.user.name}. Your account is ready.` : `Welcome back, ${data.user.name}.`)
    } catch (error) {
      setAuthError(apiErrorMessage(error, 'The gallery service is unavailable. Please try again.'))
    } finally {
      setAuthBusy(false)
    }
  }

  const logout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }) } catch { /* Clear the local account display either way. */ }
    setAuthUser(null)
    setNotice('You have been signed out.')
  }

  const openMyBids = async () => {
    setMyBidsOpen(true)
    setMyBidsError('')
    setMyBidsBusy(true)
    const localBids = (() => {
      try { return JSON.parse(localStorage.getItem('artGalleryMyBids') || '[]') } catch { return [] }
    })()
    try {
      if (!authUser) {
        setMyBids(localBids)
        return
      }
      const response = await fetch('/api/bids/mine')
      const data = await readApiJson(response)
      if (!response.ok) throw new Error(data.error || 'Could not load your bids.')
      const olderLocalBids = localBids.filter((bid) => bid.bidder?.toLowerCase() === authUser.name.toLowerCase() && !data.bids.some((saved) => saved.artworkId === bid.artworkId && Number(saved.amount) === Number(bid.amount)))
      setMyBids([...data.bids, ...olderLocalBids])
    } catch (error) {
      setMyBidsError(apiErrorMessage(error, 'Could not load your bids. Please try again.'))
    } finally {
      setMyBidsBusy(false)
    }
  }

  const filteredArtists = artistCategory === 'all' ? artists : artists.filter((artist) => artist[1] === artistCategory)
  const onSearch = (event) => { event.preventDefault(); document.getElementById('paintings')?.scrollIntoView({ behavior: 'smooth' }) }

  if (authPage) return <AuthPage mode={authPage} busy={authBusy} error={authError} onSubmit={submitAuth} onSwitch={() => goToAuthPage(authPage === 'register' ? 'login' : 'register')} onHome={leaveAuthPage} />

  return <>
    <header className="site-header">
      <a className="brand" href="#home" aria-label="Azure Galleria home"><img src="/images/gallery-emblem.png" alt="" /><span className="wordmark">Azure Galleria</span></a>
      <form className="search-form" onSubmit={onSearch}><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search paintings" aria-label="Search paintings" /><button aria-label="Search">⌕</button></form>
      <div className="header-links">{authUser ? <><span className="account-greeting">Hi, {authUser.name}</span><button onClick={logout}>Log out</button></> : <><button onClick={() => goToAuthPage('login')}>Login</button><button onClick={() => goToAuthPage('register')}>Register</button></>}<button onClick={openMyBids}>My Bids{bids.length > 0 && <span className="bid-count">{bids.length}</span>}</button><button onClick={() => setSubmissionOpen(true)}>Submit artwork</button></div>
    </header>
    <nav className="main-nav" aria-label="Main navigation">{[['all', 'Paintings'], ['modern-art', 'Modern Art'], ['traditional-art', 'Traditional Art'], ['sculptures', 'Sculptures']].map(([id, label]) => <button className={category === id ? 'selected' : ''} key={id} onClick={() => chooseCategory(id)}>{label}</button>)}<a href="#artists">Artists</a><a href="#about">About us</a></nav>
    <div className="gallery-ribbon"><span className="ribbon-star">✳</span><span>ART FOR THE WAY YOU LIVE</span><i /><span>Discover original works from independent artists</span><button onClick={() => authUser ? document.getElementById('paintings')?.scrollIntoView({ behavior: 'smooth' }) : goToAuthPage('register')}>{authUser ? 'Explore the collection' : 'Become a collector'} <b>↗</b></button></div>
    {notice && <div className="notice" role="status"><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Dismiss">×</button></div>}
    <section className="hero-banner" id="home" aria-label="Featured Azure Galleria artwork"><div className="hero-slides" style={{ transform: `translateX(-${slide * 100}%)` }}>{heroSlides.map((item,index) => <article className={`hero-slide ${slide === index ? 'is-active' : ''}`} key={item.image}><div className="hero-copy"><p className="hero-eyebrow"><span>✳</span>{item.eyebrow}</p><h1>{item.title}</h1><p className="hero-description">{item.description}</p><button className="hero-cta" onClick={() => chooseCategory(item.category)}>Explore the collection <span>↗</span></button><div className="hero-caption"><i/>{item.note}</div></div><div className="hero-visual"><img src={`/images/${item.image}`} alt={item.alt}/><span className="hero-visual-index">AZURE GALLERIA <i/> 2026</span><span className="hero-visual-mark">AG<span>✳</span></span></div></article>)}</div><button className="hero-arrow prev" aria-label="Previous featured artwork" onClick={() => setSlide((slide + heroSlides.length - 1) % heroSlides.length)}>‹</button><button className="hero-arrow next" aria-label="Next featured artwork" onClick={() => setSlide((slide + 1) % heroSlides.length)}>›</button><div className="hero-controls"><span className="hero-index">0{slide + 1}<i/>0{heroSlides.length}</span><div className="hero-dots">{heroSlides.map((item,number) => <button key={item.image} className={slide === number ? 'active' : ''} aria-label={`Show featured artwork ${number + 1}`} onClick={() => setSlide(number)} />)}</div><button className="hero-play" aria-label={autoSlide ? 'Pause carousel' : 'Play carousel'} onClick={() => setAutoSlide((playing) => !playing)}>{autoSlide ? 'Ⅱ' : '▶'}</button></div></section>
    <section className="collection-intro"><div className="intro-copy"><p className="eyebrow">A GOOD EYE. AN OPEN MIND.</p><h1>Art should make<br/>you <em>feel something.</em></h1><p>Meet the makers. Find the piece you can’t stop thinking about. Bring a little more meaning into your everyday.</p></div><div className="intro-side"><span className="intro-orbit">✳</span><p>Collected with care.<br/><strong>Made to live with.</strong></p><button onClick={() => document.getElementById('discover')?.scrollIntoView({ behavior: 'smooth' })}>Find your kind of art <span>↓</span></button></div></section>
    <section className="discover" id="discover"><div className="discover-heading"><div><p className="eyebrow">A PLACE FOR EVERY PERSPECTIVE</p><h2>Wander a little.</h2></div><p>Start wherever your eye takes you.<br/>There’s no wrong way through.</p></div><div className="discover-grid">{[{id:'traditional-art',kicker:'THE TIMELESS ONES',name:'Traditional art',image:'europeana-XCXbKmxYbsI-unsplash.jpg',count:'01 — 04'}, {id:'modern-art',kicker:'A FRESH POINT OF VIEW',name:'Modern art',image:'jene-stephaniuk--MCrF6hnojU-unsplash.jpg',count:'05 — 08'}, {id:'sculptures',kicker:'MADE TO BE FELT',name:'Sculpture',image:'sara-darcaj-YzamNB_T4WQ-unsplash.jpg',count:'09 — 12'}].map((item,index)=><button className={`discover-card discover-card-${index+1}`} key={item.id} onClick={()=>chooseCategory(item.id)}><img src={`/images/${item.image}`} alt="" loading="lazy"/><span className="discover-overlay"/><span className="discover-meta"><small>{item.kicker}</small><b>{item.name}<i>↗</i></b><small>{item.count} WORKS TO EXPLORE</small></span></button>)}</div></section>
    <main className="collection-sections" id="paintings">{groups.map((group) => {
      const items = visibleArtworks.filter((art) => art.category === group.id)
      if (category !== 'all' && category !== group.id) return null
      return <section className="art-section" id={group.id} key={group.id}><div className="art-section-heading"><div><p className="eyebrow">{group.eyebrow}</p><h2>{group.title}<span className="heading-period">.</span></h2><p>{group.description}</p></div><span className="art-section-index">A GALLERY OF {String(items.length).padStart(2,'0')} WORKS <i>↘</i></span></div><div className="products">{items.map((art,index) => <article className="product" key={art.id}><div className="product-image-wrap"><img className="art-image" src={artworkImageUrl(art.image)} alt={art.alt || art.name} loading="lazy" /><span className="product-number">{String(index+1).padStart(2,'0')}</span>{art.status==='sold'&&<span className="product-sold">SOLD</span>}<button className="product-quick-bid" disabled={art.status==='sold'} onClick={() => { setBidItem(art); setBidAmount(String(Number(art.price) + 250)) }} aria-label={art.status==='sold'?`${art.name} is sold`:`Bid on ${art.name}`}>↗</button></div><div className="product-details"><span className="art-type">{art.kind}</span><h3>{art.name}</h3><p className="product-artist">by {art.artist}</p><div className="product-bottom"><span><small>{art.status==='sold'?'SOLD FOR':'CURRENT BID'}</small><strong>{formatINR(art.status==='sold'?art.salePrice:art.price)}</strong></span><button className="bid-button" disabled={art.status==='sold'} onClick={() => { setBidItem(art); setBidAmount(String(Number(art.price) + 250)) }}>{art.status==='sold'?'Collected':'Place a bid'} <span>{art.status==='sold'?'✓':'↗'}</span></button></div></div></article>)}</div>{items.length === 0 && <p className="empty-state">No works found in this collection. Try another search.</p>}</section>
    })}</main>
    <section className="auction"><div className="auction-art"><img src="/images/national-gallery-of-art-wAQpwc0rM1g-unsplash.jpg" alt="Expressive portrait in rich blue and gold" loading="lazy"/><span className="auction-art-note">THE ART OF<br/>LOOKING CLOSER</span></div><div className="auction-copy"><p className="eyebrow">THE THRILL OF THE FIND</p><h2>Some things<br/>are worth a <em>second look.</em></h2><p>Step into the auction room. Meet the work, discover its story, and make your move.</p><div className="auction-details"><span><small>COMING UP</small><strong>Sunday · 6:00 PM</strong></span><span><small>IN THE ROOM</small><strong>Original works, chosen for you</strong></span></div><button onClick={() => { chooseCategory('all'); document.getElementById('paintings')?.scrollIntoView({behavior:'smooth'}) }}>Explore the collection <span>↗</span></button></div></section>
    <section className="artists" id="artists"><div className="artists-heading"><div><p className="eyebrow">THE PEOPLE BEHIND THE WORK</p><h2>Every piece has a <em>person.</em></h2></div><p className="section-lede">Twelve distinct voices, each with a way of seeing the world that’s entirely their own.</p></div><div className="artist-filters">{[['all', 'Everyone'], ['traditional', 'Traditional'], ['sculpture', 'Sculpture'], ['modern', 'Modern']].map(([id, label]) => <button key={id} className={artistCategory === id ? 'active' : ''} onClick={() => setArtistCategory(id)}>{label}</button>)}</div><div className="artist-grid">{filteredArtists.map(([mark, group, specialty, name, work]) => { const portrait=initialArtworks.find(art=>art.artist===name); return <article className="artist-card" key={name}><div className="artist-photo">{portrait&&<img src={`/images/${portrait.image}`} alt="" loading="lazy"/>}<span className="artist-mark">{mark}</span></div><div className="artist-card-copy"><p className="artist-specialty">{specialty}</p><h3>{name}</h3><p className="artist-work">{work}</p><a href={`#${group === 'sculpture' ? 'sculptures' : `${group}-art`}`}>Meet the work <span>↗</span></a></div></article>})}</div></section>
    <section className="about" id="about"><div className="about-stamp"><img src="/images/gallery-emblem.png" alt="Azure Galleria monogram" /></div><div><p className="eyebrow">A GALLERY FOR THE CURIOUS</p><h2>Art belongs in the everyday.</h2><p>We bring collectors closer to original art and the artists who make it. Discover thoughtfully selected paintings and sculpture, learn the stories behind each work, and find something worth living with.</p><a href="#paintings">Discover the collection <span>↗</span></a></div></section>
    <section className="services"><p className="eyebrow">A MORE PERSONAL WAY TO COLLECT</p><h2>Good art. Good people.</h2><div><article><span>01</span><h3>Original paintings</h3><p>Find considered works from artists around the world.</p></article><article><span>02</span><h3>Online auctions</h3><p>Take part in thoughtful auctions from wherever you are.</p></article><article><span>03</span><h3>Artist stories</h3><p>Meet the people and ideas behind every work.</p></article></div></section>
    <footer className="site-footer"><p>Easy buying <span>·</span> Online auctions <span>·</span> Trusted artists <span>·</span> Curated collections</p><p>© 2026 Azure Galleria</p><p>Made by Anmol · <a href="https://github.com/anmolas9876-ops" target="_blank" rel="noreferrer">GitHub</a></p></footer>
    {bidItem && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setBidItem(null) }}><section className="bid-modal" role="dialog" aria-modal="true" aria-labelledby="bid-title"><button className="modal-close" aria-label="Close" onClick={() => setBidItem(null)}>×</button><p className="eyebrow">PLACE A BID</p><h2 id="bid-title">{bidItem.name}</h2><p>Current bid <strong>{formatINR(bidItem.price)}</strong></p><form onSubmit={placeBid}><label>Your name<input required maxLength="80" value={bidderName} onChange={(event) => setBidderName(event.target.value)} /></label><label htmlFor="bid-amount">Your bid (INR)<input id="bid-amount" type="number" min={Number(bidItem.price) + 1} step="50" required value={bidAmount} onChange={(event) => setBidAmount(event.target.value)} /></label><button className="bid-button">Confirm bid <span>↗</span></button></form><small>By placing a bid, you agree to be contacted about this artwork.</small></section></div>}
    {submissionOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSubmissionOpen(false) }}><section className="bid-modal" role="dialog" aria-modal="true" aria-labelledby="submission-title"><button className="modal-close" aria-label="Close" onClick={() => setSubmissionOpen(false)}>×</button><p className="eyebrow">ARTIST SUBMISSIONS</p><h2 id="submission-title">Share your work</h2><p>Send your artwork to the gallery team for review.</p><form onSubmit={submitArtwork}><label>Artist name<input name="artist" required maxLength="80" /></label><label>Artwork title<input name="title" required maxLength="120" /></label><label>Collection<select name="category" required defaultValue="modern-art"><option value="traditional-art">Traditional art</option><option value="sculptures">Sculpture</option><option value="modern-art">Modern art</option></select></label><label>Artwork image URL<input name="image" type="url" required /></label><label>Starting bid (INR)<input name="price" type="number" min="1" required /></label><label>About your work<textarea name="story" rows="3" maxLength="600" /></label><button className="bid-button">Send for review <span>↗</span></button></form><small>Submissions are reviewed by the gallery before they appear online.</small></section></div>}
    {authMode && <div className="modal-backdrop" role="presentation"><section className="bid-modal auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title"><button className="modal-close" aria-label="Close" onClick={() => setAuthMode(null)}>×</button><p className="eyebrow">AZURE GALLERIA ACCOUNT</p><h2 id="auth-title">{authMode === 'register' ? 'Join the gallery' : 'Welcome back'}</h2><form onSubmit={submitAuth}>{authMode === 'register' && <label>Your name<input name="name" required minLength="2" maxLength="80" autoComplete="name" /></label>}<label>Email address<input name="email" type="email" required maxLength="254" autoComplete="email" /></label><label>Password<input name="password" type="password" required minLength="8" autoComplete={authMode === 'register' ? 'new-password' : 'current-password'} /></label>{authError && <p className="auth-error" role="alert">{authError}</p>}<button className="bid-button" disabled={authBusy}>{authBusy ? 'Please wait…' : authMode === 'register' ? 'Create account' : 'Sign in'} <span>↗</span></button></form></section></div>}
    {myBidsOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setMyBidsOpen(false) }}><section className="bid-modal my-bids-modal" role="dialog" aria-modal="true" aria-labelledby="my-bids-title"><button className="modal-close" aria-label="Close" onClick={() => setMyBidsOpen(false)}>×</button><p className="eyebrow">YOUR COLLECTOR ACTIVITY</p><h2 id="my-bids-title">My bids</h2>{myBidsBusy ? <p className="bids-state">Loading your bids…</p> : myBidsError ? <p className="auth-error" role="alert">{myBidsError}</p> : myBids.length === 0 ? <div className="bids-empty"><p>You haven’t placed any bids yet.</p><small>When you bid on a piece, it will appear here.</small></div> : <div className="my-bids-list">{myBids.map((bid, index) => <article className="my-bid-row" key={bid.id || `${bid.artwork}-${bid.amount}-${index}`}><div><strong>{bid.artwork}</strong><small>{bid.createdAt ? new Date(bid.createdAt).toLocaleString() : 'Saved on this device'}</small></div><span>{formatINR(bid.amount)}</span></article>)}</div>}{!authUser && <p className="bids-signin">Sign in to sync your bids with your account across visits.</p>}</section></div>}
  </>
}

function AuthPage({ mode, busy, error, onSubmit, onSwitch, onHome }) {
  const [showPassword, setShowPassword] = useState(false)
  const registering = mode === 'register'
  return <main className="auth-page">
    <a className="auth-back" href="/" onClick={(event) => { event.preventDefault(); onHome() }}>← <span>Back to the gallery</span></a>
    <section className="auth-art-panel" aria-label="Azure Galleria"><img className="auth-art-image" src="/images/europeana-WS7wycSbVuY-unsplash.jpg" alt="A quiet, classical portrait from the gallery collection" /><div className="auth-art-shade" /><a href="/" className="auth-brand" onClick={(event) => { event.preventDefault(); onHome() }} aria-label="Azure Galleria home"><img className="auth-brand-emblem" src="/images/gallery-emblem.png" alt="" /><span className="auth-brand-wordmark">AZURE GALLERIA</span></a><div className="auth-art-caption"><p>ART, CHOSEN WITH INTENTION</p><h2>Find the pieces<br/>that feel like <em>you.</em></h2><span>Discover original works and the artists behind them.</span></div><div className="auth-art-credit">A quieter way to collect.</div></section>
    <section className="auth-form-panel"><div className="auth-card"><span className="auth-kicker">YOUR PLACE IN THE GALLERY</span><h1>{registering ? 'Join our collector community.' : 'Welcome back.'}</h1><p className="auth-intro">{registering ? 'Create an account to save the art you love and take part in auctions.' : 'Sign in to continue exploring art that moves you.'}</p><form className="auth-page-form" onSubmit={onSubmit}>
      {registering && <label>Your name<input name="name" type="text" autoComplete="name" placeholder="How should we call you?" minLength="2" maxLength="80" required /></label>}
      <label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" maxLength="254" required /></label>
      <label>Password<span className="auth-password"><input name="password" type={showPassword ? 'text' : 'password'} autoComplete={registering ? 'new-password' : 'current-password'} placeholder={registering ? 'At least 8 characters' : 'Enter your password'} minLength="8" maxLength="128" required /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button></span></label>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <button className="auth-submit" type="submit" disabled={busy}>{busy ? 'Please wait…' : registering ? 'Create your account' : 'Sign in'}<span>↗</span></button>
    </form><p className="auth-page-switch">{registering ? 'Already have an account?' : 'New to the gallery?'} <button onClick={onSwitch}>{registering ? 'Sign in' : 'Create an account'}</button></p><div className="auth-privacy"><span>✳</span> Your details stay private and secure.</div></div><footer className="auth-footer"><a href="/" onClick={(event) => { event.preventDefault(); onHome() }}>Azure Galleria</a><span>© 2026</span><span>Made for the love of art</span></footer></section>
  </main>
}

export default App
