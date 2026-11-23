export default function Loading() {
  const heroBlock = "block rounded bg-[#3e4038] animate-pulse motion-reduce:animate-none";
  return (
    <main className="min-h-screen bg-[#f5f4f0]" aria-busy="true">
      <p className="sr-only" role="status">Loading Finora</p>
      <div aria-hidden="true">
        <div className="relative z-10 -mb-[76px] flex h-[76px] items-center justify-between px-[max(22px,4vw)] md:-mb-[88px] md:h-[88px]">
          <span className={`${heroBlock} h-8 w-32`} />
          <div className="hidden gap-6 md:flex">
            {Array.from({ length: 4 }, (_, item) => <span key={item} className={`${heroBlock} h-4 w-16`} />)}
          </div>
          <span className={`${heroBlock} h-11 w-24`} />
        </div>
        <div className="grid min-h-svh items-start bg-[linear-gradient(to_bottom,#20211f_72%,#f5f4f0)] md:items-center">
          <div className="mx-auto w-full max-w-[112rem] space-y-7 px-[max(22px,4vw)] pt-[124px] pb-[12rem] md:pt-[calc(88px+5vh)] md:pb-[29svh]">
            <div className="space-y-3">
              <span className={`${heroBlock} h-[clamp(2.5rem,7vw,7rem)] w-11/12 max-w-[45rem]`} />
              <span className={`${heroBlock} h-[clamp(2.5rem,7vw,7rem)] w-3/5 max-w-[30rem]`} />
            </div>
            <div className="space-y-3">
              <span className={`${heroBlock} h-4 w-full max-w-80`} />
              <span className={`${heroBlock} h-4 w-3/4 max-w-64`} />
              <span className={`${heroBlock} mt-5 h-14 w-52`} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
