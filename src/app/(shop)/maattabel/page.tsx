import type { Metadata } from "next";
import { getActiveProducts } from "@/lib/products";
import { DEFAULT_SIZE_CHART } from "@/lib/config";
import { Prose } from "@/components/shop/Prose";
import { HowToMeasure, SizeChartTable } from "@/components/shop/SizeChartTable";

export const revalidate = 300;
export const metadata: Metadata = { title: "Maattabel", description: "Vind de juiste maat voor jouw supportersshirt." };

export default async function SizePage() {
  const products = await getActiveProducts();
  const withCharts = products.length ? products : [];
  return (
    <Prose title="Maattabel" intro="Zo kies je de juiste maat. Alle maten in centimeters, plat gemeten.">
      <h2>Hoe meet je?</h2>
      <HowToMeasure />
      {withCharts.length === 0 && (
        <>
          <h2>Standaard maten</h2>
          <SizeChartTable chart={DEFAULT_SIZE_CHART} />
        </>
      )}
      {withCharts.map((p) => (
        <section key={p.id}>
          <h2>{p.name}</h2>
          {p.fit && <p className="mb-3">{p.fit}</p>}
          <SizeChartTable chart={p.size_chart ?? DEFAULT_SIZE_CHART} />
        </section>
      ))}
    </Prose>
  );
}
