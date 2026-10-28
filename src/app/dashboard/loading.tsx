import { Aurora } from "@/components/ui/Aurora";
import { Dot, Eyebrow } from "@/components/ui/Eyebrow";
import { Surface } from "@/components/ui/Surface";

/** Holds the dashboard's shape while it loads, so nothing jumps into place. */
export default function DashboardLoading() {
  return (
    <>
      <Aurora />
      <div className="mx-auto w-full max-w-6xl px-6 pb-32 sm:px-10">
        <header className="flex items-center justify-between py-10">
          <div className="flex items-center gap-3">
            <Dot />
            <span className="text-[0.9375rem] font-medium tracking-[-0.02em] text-silver">
              SilentDate
            </span>
          </div>
          <Eyebrow>se încarcă</Eyebrow>
        </header>

        <section className="grid grid-cols-1 gap-5 pb-16 lg:grid-cols-12">
          <Surface className="h-[22rem] p-9 lg:col-span-7">
            <Eyebrow>
              <Dot />
              Starea clonelor
            </Eyebrow>
          </Surface>
          <Surface tone="inset" className="h-[22rem] p-9 lg:col-span-5">
            <Eyebrow>Semnalele tale</Eyebrow>
          </Surface>
        </section>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <Surface key={index} className="h-64 p-7" />
          ))}
        </div>
      </div>
    </>
  );
}
