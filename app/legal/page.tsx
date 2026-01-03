import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-black text-white p-8 md:p-16 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        <Button
          asChild
          variant="ghost"
          className="text-zinc-400 hover:text-white pl-0"
        >
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour à l&apos;accueil
          </Link>
        </Button>

        <h1 className="text-4xl font-bold mb-8">Mentions Légales</h1>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-zinc-200">
            1. Éditeur du site
          </h2>
          <p className="text-zinc-400">
            Le site Trainflow est édité par lotus64 (LMC Group).
            <br />
            Contact : lotus64santon@gmail.com
            <br />
            Discord : lotus64
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-zinc-200">
            2. Hébergement
          </h2>
          <p className="text-zinc-400">
            Ce site est hébergé par Orion Hosting.
            <br />
            Adresse : https://orionhost.xyz
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-zinc-200">
            3. Propriété intellectuelle et usage
          </h2>
          <p className="text-zinc-400">
            L&apos;ensemble du contenu de ce site (structure, design, textes,
            images, animations, logo) est la propriété exclusive de Trainflow,
            sauf mention contraire.
          </p>
          <p className="text-zinc-400">
            Le site est open source : le code et le contenu peuvent être
            réutilisés à des fins non commerciales à condition de citer
            &quot;Trainflow&quot; et d&apos;inclure un lien vers le site ou le
            dépôt. Toute reproduction à but commercial est interdite sans
            autorisation écrite préalable.
          </p>
          <ul className="list-disc list-inside text-zinc-400 ml-4 space-y-2">
            <li>
              <span className="text-white font-medium">Usage commercial :</span>{" "}
              Strictement interdit sans autorisation préalable.
            </li>
            <li>
              <span className="text-white font-medium">Citation :</span> Toute
              réutilisation autorisée doit obligatoirement citer l&apos;origine
              &quot;Trainflow&quot; avec un lien vers le site.
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-zinc-200">
            4. Limitation de responsabilité
          </h2>
          <p className="text-zinc-400">
            Les informations fournies sur la carte (positions des trains,
            horaires, retards) sont données à titre indicatif et sont basées sur
            des données estimées ou fournies par des tiers (SNCF, IDFM, etc.).
          </p>
          <p className="text-zinc-400">
            Trainflow ne saurait être tenu responsable des erreurs, omissions,
            ou d&apos;une absence de disponibilité des informations.
            L&apos;utilisateur reconnaît utiliser ces informations sous sa
            responsabilité exclusive. Trainflow ne garantit pas
            l&apos;exactitude, la complétude ou l&apos;actualité des
            informations diffusées sur le site.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-zinc-200">
            5. Données personnelles
          </h2>
          <p className="text-zinc-400">
            Ce site ne collecte pas de données personnelles nominatives à
            l&apos;insu de l&apos;utilisateur. Aucune information n&apos;est
            cédée à des tiers.
          </p>
        </section>
      </div>
    </div>
  );
}
