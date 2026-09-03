import { Cabecalho } from "@/components/site/Cabecalho";
import { Rodape } from "@/components/site/Rodape";

export default function LayoutSite({ children }: { children: React.ReactNode }) {
  const lojaUrl = process.env.NEXT_PUBLIC_LOJA_URL;

  return (
    <>
      <Cabecalho lojaUrl={lojaUrl} />
      <main className="flex-1">{children}</main>
      <Rodape lojaUrl={lojaUrl} />
    </>
  );
}
