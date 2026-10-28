import { Aurora } from "@/components/ui/Aurora";
import { ButtonLink } from "@/components/ui/Button";
import { Dot, Eyebrow } from "@/components/ui/Eyebrow";

export default function NotFound() {
  return (
    <>
      <Aurora />
      <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col justify-center px-6 py-24">
        <div className="animate-rise">
          <Eyebrow>
            <Dot />
            404
          </Eyebrow>

          <h1 className="mt-8 text-4xl font-medium leading-[1.05] tracking-[-0.035em] text-silver sm:text-5xl">
            Aici nu e nimeni.
          </h1>

          <p className="mt-7 max-w-[44ch] text-[0.9375rem] leading-relaxed text-whisper">
            Pagina pe care o cauți nu există, sau camera aceasta nu îți aparține.
            SilentDate nu arată nimănui ce nu e al lui.
          </p>

          <div className="mt-12">
            <ButtonLink href="/dashboard">Înapoi la panou</ButtonLink>
          </div>
        </div>
      </main>
    </>
  );
}
