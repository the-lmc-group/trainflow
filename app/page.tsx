import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight, Map as MapIcon, Zap, BarChart3 } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/80 backdrop-blur-md supports-backdrop-filter:bg-black/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/banner/trainflow-banner.png"
                alt="Trainflow"
                width={120}
                height={40}
                className="h-8 w-auto object-contain brightness-0 invert"
                priority
              />
            </Link>
          </div>
          <nav className="flex items-center gap-6 text-sm font-medium">
            <Link
              href="/"
              className="transition-colors text-zinc-400 hover:text-white"
            >
              Accueil
            </Link>
            <Link
              href="/map"
              className="transition-colors text-zinc-400 hover:text-white"
            >
              Carte
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-24 md:py-32 relative overflow-hidden">
          <div className="absolute inset-0 -z-10 h-full w-full bg-black [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_100%)] opacity-50"></div>

          <div className="container mx-auto flex flex-col items-center gap-8">
            <div className="space-y-4 max-w-3xl">
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl md:text-7xl bg-clip-text text-transparent bg-linear-to-r from-white to-white/70">
                Trainflow
              </h1>
              <p className="text-xl text-zinc-400 md:text-2xl max-w-2xl mx-auto leading-normal">
                Visualisez le trafic ferroviaire en temps réel avec une
                précision inégalée.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Button asChild size="lg" className="gap-2 text-lg h-12 px-8">
                <Link href="/map">
                  Accéder à la carte <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="gap-2 text-lg h-12 px-8 text-zinc-800"
              >
                <Link href="#features">En savoir plus</Link>
              </Button>
            </div>
          </div>
        </section>

        <section
          id="features"
          className="container mx-auto py-24 px-4 md:px-8 space-y-24"
        >
          <div className="grid md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-lg bg-white/10 flex items-center justify-center">
                <MapIcon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold">Temps Réel</h3>
              <p className="text-zinc-400">
                Suivez chaque train à la seconde près grâce à notre algorithme
                d&apos;interpolation avancé. (La position des trains n&apos;est
                pas réelle mais calculée à l&apos;aide des horaires et des
                données disponibles.)
              </p>
            </div>
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-lg bg-white/10 flex items-center justify-center">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold">Performance</h3>
              <p className="text-zinc-400">
                Une carte fluide et réactive capable d&apos;être utilisée sur
                n&apos;importe quel appareil.
              </p>
            </div>
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-lg bg-white/10 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold">Analytique</h3>
              <p className="text-zinc-400">
                Consultez les statistiques de retard et de ponctualité sur
                l&apos;ensemble du réseau.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 bg-muted/30">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4 px-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Trainflow. Tous droits réservés.</p>
          <div className="flex gap-4">
            <Link href="/legal" className="hover:underline">
              Mentions légales
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
