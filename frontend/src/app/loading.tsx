export default function Loading() {
  return <main className="min-h-screen bg-[#f8f4e7] px-5 text-[#271c19] sm:px-10 lg:px-16" aria-busy="true">
    <p role="status" className="sr-only">Loading Finora</p>
    <header aria-hidden="true" className="mx-auto flex h-20 max-w-7xl items-center justify-between border-b border-[#e7e3dc]">
      <span className="h-8 w-32 animate-pulse rounded-md bg-[#eee8de] motion-reduce:animate-none" />
      <nav className="hidden items-center gap-8 md:flex">{[0, 1, 2, 3].map((item) => <span key={item} className="h-4 w-20 animate-pulse rounded bg-[#eee8de] motion-reduce:animate-none" />)}</nav>
      <span className="h-10 w-24 animate-pulse rounded-md bg-[#eee8de] motion-reduce:animate-none" />
    </header>
    <section aria-hidden="true" className="mx-auto grid min-h-[68vh] max-w-7xl items-center gap-10 py-16 lg:grid-cols-[0.9fr_1.1fr]">
      <div><span className="block h-4 w-36 animate-pulse rounded bg-[#eee8de] motion-reduce:animate-none" /><span className="mt-6 block h-16 max-w-xl animate-pulse rounded-lg bg-[#eee8de] motion-reduce:animate-none" /><span className="mt-3 block h-16 max-w-lg animate-pulse rounded-lg bg-[#eee8de] motion-reduce:animate-none" /><span className="mt-6 block h-5 max-w-md animate-pulse rounded bg-[#eee8de] motion-reduce:animate-none" /><span className="mt-3 block h-5 max-w-sm animate-pulse rounded bg-[#eee8de] motion-reduce:animate-none" /><span className="mt-8 block h-12 w-44 animate-pulse rounded-md bg-[#eee8de] motion-reduce:animate-none" /></div>
      <div className="min-h-[22rem] animate-pulse rounded-2xl border border-[#e7e3dc] bg-[#f2ede4] motion-reduce:animate-none" />
    </section>
    <section aria-hidden="true" className="mx-auto grid max-w-7xl gap-4 border-t border-[#e7e3dc] py-12 sm:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="rounded-xl border border-[#e7e3dc] bg-white p-5"><span className="block h-4 w-28 animate-pulse rounded bg-[#eee8de] motion-reduce:animate-none" /><span className="mt-4 block h-10 w-full animate-pulse rounded bg-[#eee8de] motion-reduce:animate-none" /><span className="mt-3 block h-3 w-4/5 animate-pulse rounded bg-[#eee8de] motion-reduce:animate-none" /></div>)}</section>
  </main>;
}
